import { Router } from 'express'
import type { Request } from 'express'
import type Stripe from 'stripe'
import { stripe, isStripeConfigured } from '../lib/stripe.js'
import { orderRepository } from '../data/db.js'
import { productRepository } from '../data/productsDb.js'
import { getFulfillmentProvider } from '../lib/fulfillment/index.js'
import { sendOrderConfirmationEmail } from '../lib/email.js'

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
        customer_details?: { email?: string }
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
        // Stripe always collects an email on its hosted checkout page, even
        // when we didn't pre-fill one — this is the authoritative address to
        // store, since it's what the customer will later prove ownership
        // with (see verify-purchase in routes/orders.ts).
        customer: { email: session.customer_details?.email ?? order.customer.email },
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
      const firstProduct = await productRepository.findById(paidOrder.items[0].productId)
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

      // Same reasoning as fulfillment above: payment already succeeded, so a
      // failed email send must never throw (which would make Stripe retry
      // the whole webhook and resubmit fulfillment).
      try {
        await sendOrderConfirmationEmail(paidOrder)
      } catch (emailErr) {
        console.error(`Order confirmation email failed for order ${order.id}`, emailErr)
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

// Mounted under the same /api/webhooks express.raw() middleware as the
// Stripe route above (see index.ts) — Printful's payload is JSON too, so it
// just needs a manual JSON.parse of the raw buffer. Printful's legacy
// store-webhooks API doesn't sign requests the way Stripe does, so there's
// no signature to verify; the only thing that gates an update is matching a
// real order by the external_id we set at submission time (see
// PrintfulProvider.createOrder), which an outside caller can't guess.
webhookRouter.post('/printful', async (req: Request, res) => {
  let payload: {
    type?: string
    data?: {
      order?: { external_id?: string }
      shipment?: { tracking_number?: string; tracking_url?: string }
    }
  }
  try {
    payload = JSON.parse(req.body.toString('utf8'))
  } catch {
    return res.status(400).send('Invalid JSON.')
  }

  const externalId = payload.data?.order?.external_id
  if (!externalId) {
    return res.status(200).send('No external_id — ignored.')
  }

  const order = await orderRepository.findById(externalId)
  if (!order) {
    console.error(`Printful webhook for unknown order ${externalId} — ignored.`)
    return res.status(200).send('No matching order — ignored.')
  }

  try {
    if (payload.type === 'package_shipped') {
      const shipment = payload.data?.shipment
      await orderRepository.update(order.id, {
        fulfillmentStatus: 'shipped',
        trackingNumber: shipment?.tracking_number ?? null,
        trackingUrl: shipment?.tracking_url ?? null,
      })
    } else if (payload.type === 'order_failed') {
      await orderRepository.update(order.id, { fulfillmentStatus: 'failed' })
    } else if (payload.type === 'order_canceled') {
      await orderRepository.update(order.id, { fulfillmentStatus: 'cancelled' })
    }
  } catch (err) {
    // Never throw here: an unhandled error would surface as a 500, and
    // Printful retries failed webhook deliveries — better to log and accept
    // the delivery than risk duplicate side effects downstream.
    console.error(`Failed to apply Printful webhook (${payload.type}) for order ${order.id}`, err)
  }

  res.status(200).send('OK')
})
