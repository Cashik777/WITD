import { Router } from 'express'
import { customerRepository } from '../data/customersDb.js'
import { orderRepository } from '../data/db.js'
import { hashPassword, verifyPassword, signSession, isAuthConfigured } from '../lib/auth.js'
import { requireCustomer, CUSTOMER_SESSION_COOKIE, type CustomerRequest } from '../lib/requireCustomer.js'

export const accountRouter = Router()

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 days — customer convenience over admin's tighter 7
const isHttps = (process.env.FRONTEND_URL || '').startsWith('https')

function setSessionCookie(res: import('express').Response, customerId: string) {
  res.cookie(CUSTOMER_SESSION_COOKIE, signSession(customerId), {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  })
}

// Accounts are entirely optional — checkout never requires one (guest
// checkout stays the default; see Checkout.tsx). This just lets a customer
// who *wants* one see their order history across visits.
accountRouter.post('/account/register', async (req, res) => {
  if (!isAuthConfigured) {
    return res.status(503).json({ error: 'Accounts are not available yet.' })
  }
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  if (!email || password.length < 8) {
    return res.status(400).json({ error: 'Email and a password of at least 8 characters are required.' })
  }
  if (await customerRepository.findByEmail(email)) {
    return res.status(409).json({ error: 'An account with that email already exists — try logging in instead.' })
  }
  const customer = await customerRepository.create({ email, passwordHash: await hashPassword(password) })
  setSessionCookie(res, customer.id)
  res.status(201).json({ email: customer.email })
})

accountRouter.post('/account/login', async (req, res) => {
  if (!isAuthConfigured) {
    return res.status(503).json({ error: 'Accounts are not available yet.' })
  }
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  const customer = await customerRepository.findByEmail(email)
  if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }
  setSessionCookie(res, customer.id)
  res.json({ email: customer.email })
})

accountRouter.post('/account/logout', (_req, res) => {
  res.clearCookie(CUSTOMER_SESSION_COOKIE)
  res.json({ ok: true })
})

accountRouter.get('/account/me', requireCustomer, (req: CustomerRequest, res) => {
  res.json({ email: req.customer!.email })
})

// Matches by email rather than a strict customer-id foreign key on Order —
// this also means a guest order placed before registering shows up the
// moment someone creates an account with that same email, with no separate
// "claim your order" step needed.
accountRouter.get('/account/orders', requireCustomer, async (req: CustomerRequest, res) => {
  const orders = await orderRepository.findByEmail(req.customer!.email)
  res.json({
    orders: orders.map((o) => ({
      orderNumber: o.orderNumber,
      paymentStatus: o.paymentStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      total: o.total,
      currency: o.currency,
      createdAt: o.createdAt,
      items: o.items,
      trackingNumber: o.trackingNumber,
    })),
  })
})
