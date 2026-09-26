import { Router } from 'express'
import { orderRepository } from '../data/db.js'
import { verifyOrderState, exchangeCodeForToken, addMemberToGuildWithRole, guildChannelUrl } from '../lib/discord.js'

export const discordAuthRouter = Router()
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Discord redirects the browser here after the customer approves the OAuth
// prompt. This exchanges the code, joins them to the guild with the
// VERIFIED role, and sends them back to the site — the whole point of the
// signed `state` param is that this route never has to ask "which order is
// this for?" again, it's already proven.
discordAuthRouter.get('/discord/callback', async (req, res) => {
  const code = req.query.code as string | undefined
  const state = req.query.state as string | undefined
  if (!code || !state) {
    return res.redirect(`${FRONTEND_URL}/verify?error=missing_params`)
  }

  const orderId = verifyOrderState(state)
  if (!orderId) {
    return res.redirect(`${FRONTEND_URL}/verify?error=expired`)
  }

  const order = await orderRepository.findById(orderId)
  if (!order || order.paymentStatus !== 'paid') {
    return res.redirect(`${FRONTEND_URL}/verify?error=not_found`)
  }

  try {
    const accessToken = await exchangeCodeForToken(code)
    await addMemberToGuildWithRole(accessToken)
    if (!order.discordVerifiedAt) {
      await orderRepository.update(order.id, { discordVerifiedAt: new Date().toISOString() })
    }
    res.redirect(`${FRONTEND_URL}/verify?success=1&channel=${encodeURIComponent(guildChannelUrl())}`)
  } catch (err) {
    console.error('Discord OAuth callback failed', err)
    res.redirect(`${FRONTEND_URL}/verify?error=discord_failed`)
  }
})
