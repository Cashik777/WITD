import type pg from 'pg'
import { getPool } from '../lib/pgPool.js'
import type { Coupon } from '../models/Coupon.js'
import type { CouponRepository } from './couponsDb.js'

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    percent_off NUMERIC NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    used_by_email TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
  );
`

function rowToCoupon(row: Record<string, unknown>): Coupon {
  return {
    id: row.id as string,
    code: row.code as string,
    percentOff: Number(row.percent_off),
    used: row.used as boolean,
    usedByEmail: (row.used_by_email as string | null) ?? null,
    createdAt: (row.created_at as Date).toISOString(),
    usedAt: row.used_at ? (row.used_at as Date).toISOString() : null,
  }
}

export class PostgresCouponRepository implements CouponRepository {
  private pool: pg.Pool
  private ready: Promise<void>

  constructor(_connectionString: string) {
    this.pool = getPool()
    this.ready = this.pool.query(CREATE_TABLE_SQL).then(() => undefined)
  }

  async ping(): Promise<boolean> {
    try {
      await this.ready
      await this.pool.query('SELECT 1')
      return true
    } catch {
      return false
    }
  }

  async create(coupon: Coupon): Promise<Coupon> {
    await this.ready
    await this.pool.query(
      `INSERT INTO coupons (id, code, percent_off, used, used_by_email, created_at, used_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [coupon.id, coupon.code, coupon.percentOff, coupon.used, coupon.usedByEmail, coupon.createdAt, coupon.usedAt]
    )
    return coupon
  }

  async findByCode(code: string): Promise<Coupon | null> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM coupons WHERE code = $1', [code.toUpperCase()])
    return rows[0] ? rowToCoupon(rows[0]) : null
  }

  async markUsed(code: string, email: string): Promise<Coupon | null> {
    await this.ready
    const { rows } = await this.pool.query(
      `UPDATE coupons SET used = true, used_by_email = $2, used_at = $3 WHERE code = $1 AND used = false RETURNING *`,
      [code.toUpperCase(), email, new Date().toISOString()]
    )
    return rows[0] ? rowToCoupon(rows[0]) : null
  }
}
