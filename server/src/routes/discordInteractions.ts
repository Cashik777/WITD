import { Router } from 'express'
import type { Request } from 'express'
import nacl from 'tweetnacl'
import { discordGameRepository } from '../data/discordGameDb.js'

export const discordInteractionsRouter = Router()

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY

const PLAY_COOLDOWN_MS = 4 * 60 * 60 * 1000 // 4 hours between plays per person

function formatCooldown(msRemaining: number): string {
  const totalMinutes = Math.ceil(msRemaining / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const MEDALS = ['🥇', '🥈', '🥉']

async function handlePlay(discordUserId: string, username: string): Promise<string> {
  const existing = await discordGameRepository.get(discordUserId)
  const now = Date.now()
  if (existing?.lastPlayedAt) {
    const elapsed = now - new Date(existing.lastPlayedAt).getTime()
    if (elapsed < PLAY_COOLDOWN_MS) {
      return `⏳ Already played. Come back in **${formatCooldown(PLAY_COOLDOWN_MS - elapsed)}** — total so far: **${existing.score}**.`
    }
  }
  // 1-10, weighted toward the low end so a rare big roll still feels special.
  const points = 1 + Math.floor(Math.random() * Math.random() * 10)
  const updated = await discordGameRepository.addScore(discordUserId, username, points, new Date(now).toISOString())
  return `🎲 You scored **${points}**! Total: **${updated.score}** points. Next play in 4h.`
}

async function handleLeaderboard(): Promise<string> {
  const top = await discordGameRepository.top(10)
  if (top.length === 0) return 'No scores yet — be the first to `/play`.'
  const lines = top.map((s, i) => `${MEDALS[i] ?? `${i + 1}.`} **${s.username}** — ${s.score}`)
  return `**Leaderboard**\n${lines.join('\n')}`
}

// Mounted with express.raw() in index.ts — Discord's Ed25519 signature check
// needs the exact raw request body, same reasoning as the Stripe webhook.
discordInteractionsRouter.post('/', async (req: Request, res) => {
  if (!PUBLIC_KEY) {
    return res.status(503).send('Discord interactions not configured.')
  }

  const signature = req.headers['x-signature-ed25519'] as string | undefined
  const timestamp = req.headers['x-signature-timestamp'] as string | undefined
  const body = req.body as Buffer

  if (!signature || !timestamp) {
    return res.status(401).send('Missing signature headers.')
  }

  const isVerified = nacl.sign.detached.verify(
    Buffer.concat([Buffer.from(timestamp), body]),
    Buffer.from(signature, 'hex'),
    Buffer.from(PUBLIC_KEY, 'hex')
  )
  if (!isVerified) {
    return res.status(401).send('Invalid request signature.')
  }

  const interaction = JSON.parse(body.toString('utf8'))

  // Type 1 = PING, sent once when Discord verifies this endpoint URL.
  if (interaction.type === 1) {
    return res.json({ type: 1 })
  }

  // Type 2 = APPLICATION_COMMAND (a slash command was used).
  if (interaction.type === 2) {
    const commandName = interaction.data?.name
    const discordUser = interaction.member?.user ?? interaction.user
    const displayName = interaction.member?.nick ?? discordUser?.global_name ?? discordUser?.username ?? 'Someone'

    let content: string
    try {
      if (commandName === 'play') {
        content = await handlePlay(discordUser.id, displayName)
      } else if (commandName === 'leaderboard') {
        content = await handleLeaderboard()
      } else {
        content = "Unknown command."
      }
    } catch (err) {
      console.error('Discord interaction handling failed', err)
      content = "Something went wrong — try again in a moment."
    }

    return res.json({ type: 4, data: { content } })
  }

  res.status(400).send('Unhandled interaction type.')
})
