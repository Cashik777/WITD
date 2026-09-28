import { Router } from 'express'
import { subscribeToNewsletter, isNewsletterConfigured } from '../lib/email.js'

export const newsletterRouter = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

newsletterRouter.post('/newsletter', async (req, res) => {
  if (!isNewsletterConfigured) {
    return res.status(503).json({ error: 'Newsletter signup is not available yet.' })
  }
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' })
  }

  try {
    await subscribeToNewsletter(email)
    res.status(201).json({ ok: true })
  } catch (err) {
    console.error('Newsletter signup failed:', err)
    res.status(502).json({ error: 'Could not subscribe right now. Please try again.' })
  }
})
