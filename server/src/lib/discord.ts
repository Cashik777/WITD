// Generates single-use Discord invites for verified purchasers. Requires a
// bot (Discord Developer Portal → New Application → Bot) added to the WITD
// server with the "Create Invite" permission on the target channel.
//
// Until DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID are set, isDiscordConfigured
// is false and the verify-purchase route returns an honest "not open yet"
// response instead — same pattern as Stripe/Printful/Printify.

export const isDiscordConfigured = Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CHANNEL_ID)

const INVITE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

export async function createSingleUseInvite(): Promise<string> {
  const channelId = process.env.DISCORD_CHANNEL_ID
  const botToken = process.env.DISCORD_BOT_TOKEN
  if (!channelId || !botToken) {
    throw new Error('Discord is not configured.')
  }

  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/invites`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      max_uses: 1,
      max_age: INVITE_MAX_AGE_SECONDS,
      unique: true,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Discord invite creation failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as { code: string }
  return `https://discord.gg/${data.code}`
}
