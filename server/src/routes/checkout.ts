import { Router } from 'express'
import { randomUUID } from 'crypto'
import { stripe, isStripeConfigured } from '../lib/stripe.js'
import { getServerProduct } from '../data/products.js'
import { orderRepository } from '../data/db.js'
import type { Order, OrderItem } from '../models/Order.js'

export const checkoutRouter = Router()

interface CheckoutRequestItem {
  productId: string
  size: string
  color: string
  quantity: number
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const FREE_SHIPPING_THRESHOLD = 150
const FLAT_SHIPPING = 12

checkoutRouter.post('/create-checkout-session', async (req, res) => {
  try {
    if (!isStripeConfigured || !stripe) {
      return res.status(503).json({
        error:
          'Stripe is not connected yet. Add STRIPE_SECRET_KEY to server/.env (test-mode key) to enable checkout.',
      })
    }

    const rawItems = req.body?.items as CheckoutRequestItem[] | undefined
    const email: string | undefined = req.body?.email

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' })
    }

    // --- Server-side validation. Nothing about price, product identity, or
    // stock comes from the browser past this point. ---
    const items: OrderItem[] = []
    for (const raw of rawItems) {
      const product = getServerProduct(raw.productId)
      if (!product) {
        return res.status(400).json({ error: `Unknown product: ${raw.productId}` })
      }
      const quantity = Number(raw.quantity)
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return res.status(400).json({ error: `Invalid quantity for ${product.name}.` })
      }
      if (!product.colors.includes(raw.color)) {
        return res.status(400).json({ error: `Invalid color "${raw.color}" for ${product.name}.` })
      }
      if (!product.availableSizes.includes(raw.size)) {
        return res.status(400).json({ error: `${product.name} is not available in size ${raw.size}.` })
      }
      items.push({
        productId: product.id,
        name: product.name,
        size: raw.size,
        color: raw.color,
        quantity,
        unitPrice: product.price, // server-side price — the only price Stripe ever sees
      })
    }

    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING
    const currency = getServerProduct(items[0].productId)!.currency
    const total = subtotal + shipping

    // Create our own order record *before* redirecting to Stripe, in
    // `pending` state. The webhook flips it to `paid` — fulfillment is only
    // ever triggered from there, never from this route.
    const orderId = randomUUID()
    const now = new Date().toISOString()
    const order: Order = {
      id: orderId,
      stripeSessionId: '', // filled in right after the Stripe session is created
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      customer: { email },
      items,
      subtotal,
      shipping,
      tax: 0,
      total,
      currency,
      shippingAddress: null,
      createdAt: now,
      updatedAt: now,
      fulfillmentProvider: null,
      fulfillmentOrderId: null,
      trackingNumber: null,
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency,
          unit_amount: Math.round(item.unitPrice * 100),
          product_data: { name: `${item.name} — ${item.color} / ${item.size}` },
        },
      })),
      shipping_options:
        shipping > 0
          ? [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: shipping * 100, currency }, display_name: 'Standard Shipping' } }]
          : [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: 0, currency }, display_name: 'Free Shipping' } }],
      shipping_address_collection: { allowed_countries: ['CA', 'US'] },
      success_url: `${FRONTEND_URL}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/cart`,
      metadata: { orderId },
    })

    order.stripeSessionId = session.id
    await orderRepository.create(order)

    res.json({ url: session.url })
  } catch (err) {
    console.error('create-checkout-session failed', err)
    res.status(500).json({ error: 'Could not start checkout. Please try again.' })
  }
})
