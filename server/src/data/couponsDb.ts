import type { Coupon } from '../models/Coupon.js'
import { PostgresCouponRepository } from './PostgresCouponRepository.js'

export interface CouponRepository {
  create(coupon: Coupon): Promise<Coupon>
  findByCode(code: string): Promise<Coupon | null>
  markUsed(code: string, email: string): Promise<Coupon | null>
  ping(): Promise<boolean>
}

class InMemoryCouponRepository implements CouponRepository {
  private coupons = new Map<string, Coupon>()

  async ping(): Promise<boolean> {
    return true
  }

  async create(coupon: Coupon): Promise<Coupon> {
    this.coupons.set(coupon.code, coupon)
    return coupon
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.coupons.get(code.toUpperCase()) ?? null
  }

  async markUsed(code: string, email: string): Promise<Coupon | null> {
    const existing = this.coupons.get(code.toUpperCase())
    if (!existing || existing.used) return null
    const updated: Coupon = { ...existing, used: true, usedByEmail: email, usedAt: new Date().toISOString() }
    this.coupons.set(code.toUpperCase(), updated)
    return updated
  }
}

// See the comment in data/db.ts — this selection must stay synchronous.
function createCouponRepository(): CouponRepository {
  if (process.env.DATABASE_URL) {
    return new PostgresCouponRepository(process.env.DATABASE_URL)
  }
  console.warn('DATABASE_URL is not set — coupons are stored in memory and will be lost on restart.')
  return new InMemoryCouponRepository()
}

export const couponRepository: CouponRepository = createCouponRepository()
