import { Router } from 'express'
import { randomUUID } from 'crypto'
import { couponRepository } from '../data/couponsDb.js'
import { generateCouponCode } from '../lib/couponCode.js'
import type { Coupon } from '../models/Coupon.js'

export const couponsRouter = Router()

const VALID_FOR_MS = 60 * 60 * 1000 // 1 hour — keeps it feeling like a live reward, not a code to stockpile

// Rewards the homepage trace-the-shape toy — complete 20 shapes and the
// client claims a one-time 20%-off code here. There's no server-side proof
// the 20 shapes were actually traced (that state lives entirely in the
// browser); this is a lightweight marketing gimmick, not a guarded reward,
// so the real protections are the things that matter for revenue: the code
// is single-use (enforced atomically at the DB level in markUsed), expires
// an hour after being issued, and checkout only honors it on a customer's
// first paid order.
couponsRouter.post('/coupons/claim', async (_req, res) => {
  try {
    const now = new Date()
    const coupon: Coupon = {
      id: randomUUID(),
      code: generateCouponCode(),
      percentOff: 20,
      used: false,
      usedByEmail: null,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + VALID_FOR_MS).toISOString(),
      usedAt: null,
    }
    await couponRepository.create(coupon)
    res.status(201).json({ code: coupon.code, percentOff: coupon.percentOff, expiresAt: coupon.expiresAt })
  } catch (err) {
    console.error('coupon claim failed', err)
    res.status(500).json({ error: 'Could not generate a code right now. Please try again.' })
  }
})
