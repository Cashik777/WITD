import { Router } from 'express'
import { orderRepository } from '../data/db.js'
import { isDiscordConfigured, createSingleUseInvite } from '../lib/discord.js'

export const ordersRouter = Router()

// Used by the order-confirmation page (redirected here from Stripe with
// ?session_id=...) to show the customer's order number — needed later to
// verify their purchase for Discord access.
ordersRouter.get('/orders/:sessionId', async (req, res) => {
  const order = await orderRepository.findByStripeSessionId(req.params.sessionId)
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' })
  }
  res.json({
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    total: order.total,
    currency: order.currency,
  })
})

// Purchase verification for Discord access. Matches order number + email
// against a *paid* order and, once, exchanges that proof for a single-use
// invite. Errors are intentionally generic (no distinction between "no such
// order" and "wrong email") so this can't be used to enumerate order
// numbers or probe which email a given order used.
ordersRouter.post('/verify-purchase', async (req, res) => {
  const orderNumber = String(req.body?.orderNumber ?? '').trim()
  const email = String(req.body?.email ?? '').trim().toLowerCase()

  if (!orderNumber || !email) {
    return res.status(400).json({ error: 'Enter both your order number and email.' })
  }

  const order = await orderRepository.findByOrderNumber(orderNumber)
  const orderEmail = order?.customer.email?.trim().toLowerCase()

  if (!order || order.paymentStatus !== 'paid' || orderEmail !== email) {
    return res.status(404).json({ error: "We couldn't find a matching paid order. Double-check both fields." })
  }

  if (order.discordVerifiedAt) {
    return res.status(409).json({
      error: 'This order has already been verified. Lost your invite? Contact us at hello@wakeinthedream.com.',
    })
  }

  if (!isDiscordConfigured) {
    return res.status(503).json({
      error: "Your purchase is verified, but community access isn't open yet — check back soon.",
    })
  }

  try {
    const inviteUrl = await createSingleUseInvite()
    await orderRepository.update(order.id, { discordVerifiedAt: new Date().toISOString() })
    res.json({ inviteUrl })
  } catch (err) {
    console.error('Discord invite creation failed', err)
    res.status(500).json({ error: 'Could not create your invite. Please try again shortly.' })
  }
})
