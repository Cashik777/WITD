import { Router } from 'express'
import type { Request } from 'express'
import type Stripe from 'stripe'
import { stripe, isStripeConfigured } from '../lib/stripe.js'
import { orderRepository } from '../data/db.js'
import { getServerProduct } from '../data/products.js'
import { getFulfillmentProvider } from '../lib/fulfillment/index.js'

export const webhookRouter = Router()

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Cheap in-process duplicate-delivery guard. Not durable across restarts —
// the real idempotency guarantee is the `paymentStatus !== 'paid'` check
// below, which survives restarts because it reads from orderRepository.
const seenEventIds = new Set<string>()

// Mounted with express.raw() in index.ts — Stripe's signature check needs
// the exact raw request body, which a JSON-parsing body parser would break.
webhookRouter.post('/stripe', async (req: Request, res) => {
  if (!isStripeConfigured || !stripe) {
    return res.status(503).send('Stripe is not configured.')
  }
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set — refusing to process unverified webhook events.')
    return res.status(503).send('Webhook secret not configured.')
  }

  const signature = req.headers['stripe-signature']
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(req.body, signature as string, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err)
    return res.status(400).send('Invalid signature.')
  }

  // Idempotency guard #1 — duplicate delivery of the same event id.
  if (seenEventIds.has(event.id)) {
    return res.status(200).send('Already processed.')
  }
  seenEventIds.add(event.id)

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as {
        id: string
        payment_status: string
        shipping_details?: {
          name?: string
          address?: { line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string }
        }
      }

      const order = await orderRepository.findByStripeSessionId(session.id)
      if (!order) {
        console.error(`Webhook for unknown session ${session.id} — no matching order.`)
        return res.status(200).send('No matching order — ignored.')
      }

      // Idempotency guard #2 — the durable one. If this order was already
      // marked paid (e.g. a retried webhook), do not fulfill it a second
      // time.
      if (order.paymentStatus === 'paid') {
        return res.status(200).send('Order already marked paid — skipped.')
      }

      if (session.payment_status !== 'paid') {
        return res.status(200).send('Payment not completed — no action taken.')
      }

      const addr = session.shipping_details?.address
      const paidOrder = await orderRepository.update(order.id, {
        paymentStatus: 'paid',
        shippingAddress: addr
          ? {
              name: session.shipping_details?.name,
              line1: addr.line1,
              line2: addr.line2,
              city: addr.city,
              state: addr.state,
              postalCode: addr.postal_code,
              country: addr.country,
            }
          : null,
      })
      if (!paidOrder) {
        console.error(`Order ${order.id} vanished mid-update — skipping fulfillment.`)
        return res.status(200).send('Order update failed — skipped fulfillment.')
      }

      // --- Trigger fulfillment ONLY after confirmed payment. Never earlier. ---
      const firstProduct = getServerProduct(paidOrder.items[0].productId)
      const providerName = firstProduct?.fulfillmentProvider ?? 'mock'
      const provider = getFulfillmentProvider(providerName)

      try {
        const result = await provider.createOrder(paidOrder)
        await orderRepository.update(order.id, {
          fulfillmentProvider: provider.name,
          fulfillmentOrderId: result.fulfillmentOrderId,
          fulfillmentStatus: result.status === 'submitted' ? 'submitted' : 'failed',
        })
      } catch (fulfillmentErr) {
        // Payment already succeeded — never lose that fact even if
        // fulfillment submission fails. Log and mark for manual retry
        // instead of throwing, which would make Stripe re-send the webhook.
        console.error(`Fulfillment submission failed for order ${order.id}`, fulfillmentErr)
        await orderRepository.update(order.id, { fulfillmentStatus: 'failed' })
      }
    }

    // Other event types (charge.refunded, etc.) can be handled here as
    // they're needed — left out for now per "don't build unused API
    // surface" (see PrintifyProvider.ts for the same principle).

    res.status(200).send('OK')
  } catch (err) {
    console.error('Webhook handling failed', err)
    res.status(500).send('Internal error.')
  }
})
