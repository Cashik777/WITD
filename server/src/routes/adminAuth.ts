import { Router } from 'express'
import { timingSafeEqual } from 'crypto'
import { userRepository } from '../data/usersDb.js'
import { hashPassword, verifyPassword, signSession, isAuthConfigured } from '../lib/auth.js'
import { requireAdmin, SESSION_COOKIE, type AdminRequest } from '../lib/requireAdmin.js'

export const adminAuthRouter = Router()

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000
const isHttps = (process.env.FRONTEND_URL || '').startsWith('https')

adminAuthRouter.post('/login', async (req, res) => {
  if (!isAuthConfigured) {
    return res.status(503).json({ error: 'Admin login is not configured yet.' })
  }
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const user = await userRepository.findByEmail(email)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  res.cookie(SESSION_COOKIE, signSession(user.id), {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  })
  res.json({ email: user.email })
})

adminAuthRouter.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE)
  res.json({ ok: true })
})

adminAuthRouter.get('/me', requireAdmin, (req: AdminRequest, res) => {
  res.json({ email: req.adminUser!.email })
})

// One-time bootstrap for the very first admin account. Locks itself out
// permanently once any admin exists (see the count() check below) — from
// then on, only an already-authenticated admin could create more accounts
// (not built yet, since this project only needs one). The bootstrap secret
// closes the race-condition window between deploy and the real owner
// actually calling this, since "no admins yet" alone is guessable/racy.
adminAuthRouter.post('/bootstrap', async (req, res) => {
  const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET
  if (!bootstrapSecret) {
    return res.status(503).json({ error: 'Admin bootstrap is not enabled.' })
  }
  const providedSecret = String(req.body?.bootstrapSecret ?? '')
  const a = Buffer.from(providedSecret)
  const b = Buffer.from(bootstrapSecret)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(403).json({ error: 'Invalid bootstrap secret.' })
  }

  if ((await userRepository.count()) > 0) {
    return res.status(409).json({ error: 'An admin account already exists.' })
  }

  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  if (!email || password.length < 10) {
    return res.status(400).json({ error: 'Email and a password of at least 10 characters are required.' })
  }

  const user = await userRepository.create({ email, passwordHash: await hashPassword(password), role: 'admin' })
  res.status(201).json({ email: user.email })
})
