import { createHmac, timingSafeEqual } from 'crypto'

// Discord community access via OAuth2, not a plain invite link. A plain
// invite only adds someone to the server — it does NOT grant a role, so it
// can't gate a private channel on its own. The "add guild member" endpoint
// (used below) both joins *and* assigns a role in one authenticated call,
// and needs no persistent bot/gateway connection — just these REST calls.
export const isDiscordConfigured = Boolean(
  process.env.DISCORD_BOT_TOKEN &&
    process.env.DISCORD_APPLICATION_ID &&
    process.env.DISCORD_CLIENT_SECRET &&
    process.env.DISCORD_GUILD_ID &&
    process.env.DISCORD_ROLE_ID
)

const STATE_TTL_MS = 15 * 60 * 1000 // 15 minutes to complete the Discord auth flow

// Render's free-tier outbound IP is shared with unrelated tenants and got
// Cloudflare-rate-limited on discord.com's token endpoint (not by us — some
// other tenant's traffic). Routing server-to-server Discord calls through a
// small Cloudflare Worker proxy (our own, not Discord's) sidesteps that
// shared IP entirely. Falls back to calling discord.com directly if the
// proxy isn't configured (e.g. local dev).
const PROXY_URL = process.env.DISCORD_PROXY_URL
const PROXY_SECRET = process.env.DISCORD_PROXY_SECRET

function discordFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const base = PROXY_URL ? PROXY_URL.replace(/\/$/, '') : 'https://discord.com'
  const headers = new Headers(init.headers)
  if (PROXY_URL && PROXY_SECRET) headers.set('x-proxy-secret', PROXY_SECRET)
  return fetch(`${base}${path}`, { ...init, headers })
}

function callbackUrl(): string {
  const base = process.env.FRONTEND_URL || 'http://localhost:5173'
  return `${base}/api/discord/callback`
}

// The OAuth "state" param carries which order this authorization is for,
// signed so it can't be forged into verifying an order that was never
// actually paid. No server-side session storage needed.
export function signOrderState(orderId: string): string {
  const expires = Date.now() + STATE_TTL_MS
  const payload = `${orderId}.${expires}`
  const sig = createHmac('sha256', process.env.DISCORD_BOT_TOKEN ?? '').update(payload).digest('hex')
  return Buffer.from(`${payload}.${sig}`).toString('base64url')
}

export function verifyOrderState(state: string): string | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf8')
    const [orderId, expiresStr, sig] = decoded.split('.')
    if (!orderId || !expiresStr || !sig) return null
    if (Date.now() > Number(expiresStr)) return null
    const expectedSig = createHmac('sha256', process.env.DISCORD_BOT_TOKEN ?? '')
      .update(`${orderId}.${expiresStr}`)
      .digest('hex')
    const a = Buffer.from(sig)
    const b = Buffer.from(expectedSig)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    return orderId
  } catch {
    return null
  }
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_APPLICATION_ID!,
    redirect_uri: callbackUrl(),
    response_type: 'code',
    scope: 'identify guilds.join',
    state,
    prompt: 'consent',
  })
  return `https://discord.com/oauth2/authorize?${params.toString()}`
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await discordFetch('/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_APPLICATION_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl(),
    }),
  })
  if (!res.ok) throw new Error(`Discord token exchange failed (${res.status}): ${await res.text()}`)
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

// Joins the authorizing user to the WITD guild (if not already a member)
// and assigns the VERIFIED role — the "add guild member" call only applies
// `roles` on first join, so an existing member needs a separate role PUT.
export async function addMemberToGuildWithRole(accessToken: string): Promise<void> {
  const meRes = await discordFetch('/api/v10/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!meRes.ok) throw new Error('Could not identify Discord user.')
  const me = (await meRes.json()) as { id: string }

  const guildId = process.env.DISCORD_GUILD_ID
  const roleId = process.env.DISCORD_ROLE_ID
  const botAuth = `Bot ${process.env.DISCORD_BOT_TOKEN}`

  const joinRes = await discordFetch(`/api/v10/guilds/${guildId}/members/${me.id}`, {
    method: 'PUT',
    headers: { Authorization: botAuth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken, roles: [roleId] }),
  })

  if (joinRes.status === 204) {
    // Already a member — `roles` in the join body is ignored in this case.
    const roleRes = await discordFetch(`/api/v10/guilds/${guildId}/members/${me.id}/roles/${roleId}`, {
      method: 'PUT',
      headers: { Authorization: botAuth },
    })
    if (!roleRes.ok) throw new Error(`Could not assign role (${roleRes.status}): ${await roleRes.text()}`)
  } else if (!joinRes.ok) {
    throw new Error(`Could not add member to guild (${joinRes.status}): ${await joinRes.text()}`)
  }
}

export function guildChannelUrl(): string {
  return `https://discord.com/channels/${process.env.DISCORD_GUILD_ID}/${process.env.DISCORD_CHANNEL_ID}`
}
