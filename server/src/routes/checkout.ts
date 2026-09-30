import { Router } from 'express'
import { randomUUID } from 'crypto'
import { stripe, isStripeConfigured } from '../lib/stripe.js'
import { productRepository } from '../data/productsDb.js'
import { orderRepository } from '../data/db.js'
import { couponRepository } from '../data/couponsDb.js'
import { generateOrderNumber } from '../lib/orderNumber.js'
import { requireCustomer, type CustomerRequest } from '../lib/requireCustomer.js'
import type { Order, OrderItem } from '../models/Order.js'
import type { Product } from '../models/Product.js'

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
    const email = String(req.body?.email ?? '').trim()

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required to check out.' })
    }

    // --- Server-side validation. Nothing about price, product identity, or
    // stock comes from the browser past this point. ---
    const items: OrderItem[] = []
    let currency: Product['currency'] | undefined
    for (const raw of rawItems) {
      const product = await productRepository.findById(raw.productId)
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
      if (!currency) currency = product.currency
    }

    // items.length is guaranteed >0 here (rawItems was checked above and
    // every raw item either resolves to a product or returns early), so the
    // loop always ran and set this.
    if (!currency) throw new Error('unreachable: currency was never set')

    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

    // Coupon is optional — the homepage trace-the-shape toy hands one out
    // after 20 completed shapes. Only honored on a customer's first PAID
    // order, and single-use (markUsed is an atomic compare-and-set in the
    // repository, so two concurrent redemptions can't both succeed).
    let discount = 0
    let appliedCouponCode: string | null = null
    const rawCouponCode = req.body?.couponCode ? String(req.body.couponCode).trim().toUpperCase() : ''
    if (rawCouponCode) {
      const coupon = await couponRepository.findByCode(rawCouponCode)
      if (!coupon) return res.status(400).json({ error: 'That code is not valid.' })
      if (coupon.used) return res.status(400).json({ error: 'That code has already been used.' })
      const priorOrders = await orderRepository.findByEmail(email)
      if (priorOrders.some((o) => o.paymentStatus === 'paid')) {
        return res.status(400).json({ error: 'This code is only valid on your first order.' })
      }
      discount = Math.round(subtotal * (coupon.percentOff / 100) * 100) / 100
      appliedCouponCode = coupon.code
    }

    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING
    const total = subtotal - discount + shipping
    const discountRate = subtotal > 0 ? discount / subtotal : 0

    // Create our own order record *before* redirecting to Stripe, in
    // `pending` state. The webhook flips it to `paid` — fulfillment is only
    // ever triggered from there, never from this route.
    const orderId = randomUUID()
    const now = new Date().toISOString()
    const order: Order = {
      id: orderId,
      orderNumber: generateOrderNumber(),
      stripeSessionId: '', // filled in right after the Stripe session is created
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      customer: { email },
      items,
      subtotal,
      discount,
      couponCode: appliedCouponCode,
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
      discordVerifiedAt: null,
    }

    const session = await stripe.checkout.sessions.create(
      buildSessionParams({ items, currency, shipping, email, orderId, discountRate }),
    )

    order.stripeSessionId = session.id
    await orderRepository.create(order)
    if (appliedCouponCode) await couponRepository.markUsed(appliedCouponCode, email)

    res.json({ url: session.url })
  } catch (err) {
    console.error('create-checkout-session failed', err)
    res.status(500).json({ error: 'Could not start checkout. Please try again.' })
  }
})

function buildSessionParams(args: {
  items: OrderItem[]
  currency: string
  shipping: number
  email: string | undefined
  orderId: string
  discountRate?: number
}): import('stripe').default.Checkout.SessionCreateParams {
  const { items, currency, shipping, email, orderId, discountRate = 0 } = args
  return {
    mode: 'payment',
    customer_email: email,
    line_items: items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency,
        unit_amount: Math.round(item.unitPrice * (1 - discountRate) * 100),
        product_data: {
          name: `${item.name} — ${item.color} / ${item.size}`,
          ...(discountRate > 0 ? { description: `${Math.round(discountRate * 100)}% off applied` } : {}),
        },
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
  }
}

// A customer who opened Stripe Checkout and then backed out/closed the tab
// leaves behind a `pending` order (see the comment above — it's written
// before Stripe redirect) with no way back to payment. This re-opens a fresh
// Checkout Session for that same order so "pending" in order history isn't a
// dead end — it's ownership-checked by email so one customer can't resume
// another's order by guessing an order number.
checkoutRouter.post('/checkout/resume/:orderNumber', requireCustomer, async (req: CustomerRequest, res) => {
  try {
    if (!isStripeConfigured || !stripe) {
      return res.status(503).json({ error: 'Stripe is not connected yet.' })
    }

    const order = await orderRepository.findByOrderNumber(req.params.orderNumber)
    if (!order || order.customer.email?.toLowerCase() !== req.customer!.email.toLowerCase()) {
      return res.status(404).json({ error: 'Order not found.' })
    }
    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({ error: 'This order has already been paid or is no longer payable.' })
    }

    const session = await stripe.checkout.sessions.create(
      buildSessionParams({
        items: order.items,
        currency: order.currency,
        shipping: order.shipping,
        email: order.customer.email,
        orderId: order.id,
        discountRate: order.subtotal > 0 ? order.discount / order.subtotal : 0,
      }),
    )

    await orderRepository.update(order.id, { stripeSessionId: session.id })

    res.json({ url: session.url })
  } catch (err) {
    console.error('resume-checkout failed', err)
    res.status(500).json({ error: 'Could not resume checkout. Please try again.' })
  }
})
