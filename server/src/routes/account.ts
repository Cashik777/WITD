import { Router } from 'express'
import { customerRepository } from '../data/customersDb.js'
import { orderRepository } from '../data/db.js'
import type { Customer } from '../models/Customer.js'
import { hashPassword, verifyPassword, signSession, isAuthConfigured } from '../lib/auth.js'
import { requireCustomer, CUSTOMER_SESSION_COOKIE, type CustomerRequest } from '../lib/requireCustomer.js'
import { sendVerificationEmail } from '../lib/email.js'
import {
  generateCode,
  hashCode,
  codeExpiresAt,
  isExpired,
  isWithinResendCooldown,
  hasAttemptsRemaining,
  codeMatches,
} from '../lib/verificationCode.js'

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

function profileResponse(customer: Customer) {
  return {
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    age: customer.age,
  }
}

async function issueAndSendCode(customerId: string, email: string) {
  const code = generateCode()
  await customerRepository.setVerification(customerId, { codeHash: hashCode(code), expiresAt: codeExpiresAt(), attempts: 0 })
  await sendVerificationEmail(email, code)
}

// Accounts are entirely optional — checkout never requires one (guest
// checkout stays the default; see Checkout.tsx). This just lets a customer
// who *wants* one see their order history across visits. Email must be
// verified with a code before the account can log in, so an order history
// page can't be spoofed just by knowing someone else's order email.
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
  try {
    await issueAndSendCode(customer.id, customer.email)
  } catch (err) {
    console.error('Failed to send verification email:', err)
    return res.status(502).json({ error: 'Could not send a verification email. Please try again.' })
  }
  res.status(201).json({ email: customer.email, verificationRequired: true })
})

accountRouter.post('/account/verify-email', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const code = String(req.body?.code ?? '').trim()
  const customer = await customerRepository.findByEmail(email)
  if (!customer) return res.status(404).json({ error: 'No account found for that email.' })

  if (customer.emailVerified) {
    setSessionCookie(res, customer.id)
    return res.json(profileResponse(customer))
  }

  const verification = await customerRepository.getVerification(customer.id)
  if (!verification || isExpired(verification.expiresAt)) {
    return res.status(400).json({ error: 'This code has expired. Request a new one.' })
  }
  if (!hasAttemptsRemaining(verification.attempts)) {
    return res.status(429).json({ error: 'Too many incorrect attempts. Request a new code.' })
  }
  if (!codeMatches(code, verification.codeHash)) {
    await customerRepository.incrementVerificationAttempts(customer.id)
    return res.status(400).json({ error: 'That code is incorrect.' })
  }

  await customerRepository.markVerified(customer.id)
  setSessionCookie(res, customer.id)
  res.json(profileResponse(customer))
})

accountRouter.post('/account/resend-code', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const customer = await customerRepository.findByEmail(email)
  if (!customer) return res.status(404).json({ error: 'No account found for that email.' })
  if (customer.emailVerified) return res.status(400).json({ error: 'This account is already verified.' })

  const verification = await customerRepository.getVerification(customer.id)
  if (verification && !isExpired(verification.expiresAt) && isWithinResendCooldown(verification.expiresAt)) {
    return res.status(429).json({ error: 'Please wait a moment before requesting another code.' })
  }

  try {
    await issueAndSendCode(customer.id, customer.email)
  } catch (err) {
    console.error('Failed to send verification email:', err)
    return res.status(502).json({ error: 'Could not send a verification email. Please try again.' })
  }
  res.json({ ok: true })
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

  if (!customer.emailVerified) {
    try {
      await issueAndSendCode(customer.id, customer.email)
    } catch (err) {
      console.error('Failed to send verification email:', err)
    }
    return res.status(403).json({ error: 'Please verify your email first — we just sent you a new code.', verificationRequired: true })
  }

  setSessionCookie(res, customer.id)
  res.json(profileResponse(customer))
})

accountRouter.post('/account/logout', (_req, res) => {
  res.clearCookie(CUSTOMER_SESSION_COOKIE)
  res.json({ ok: true })
})

accountRouter.get('/account/me', requireCustomer, (req: CustomerRequest, res) => {
  res.json(req.customer)
})

// Entirely optional, filled in from the account page after signup — see the
// comment on Customer in models/Customer.ts for why this isn't asked at
// registration.
accountRouter.patch('/account/profile', requireCustomer, async (req: CustomerRequest, res) => {
  const clean = (v: unknown): string | null => {
    if (v == null) return null
    const s = String(v).trim().slice(0, 100)
    return s || null
  }

  let age: number | null = null
  if (req.body?.age != null && req.body.age !== '') {
    const n = Number(req.body.age)
    if (!Number.isInteger(n) || n < 1 || n > 120) {
      return res.status(400).json({ error: 'Age must be a whole number between 1 and 120.' })
    }
    age = n
  }

  const customer = await customerRepository.updateProfile(req.customer!.id, {
    firstName: clean(req.body?.firstName),
    lastName: clean(req.body?.lastName),
    age,
  })
  res.json(profileResponse(customer))
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
