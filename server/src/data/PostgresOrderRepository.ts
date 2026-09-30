import type pg from 'pg'
import { getPool } from '../lib/pgPool.js'
import type { Order } from '../models/Order.js'
import type { OrderRepository } from './db.js'

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    stripe_session_id TEXT UNIQUE NOT NULL,
    payment_status TEXT NOT NULL,
    fulfillment_status TEXT NOT NULL,
    customer_email TEXT,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL,
    shipping NUMERIC NOT NULL,
    tax NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    shipping_address JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    fulfillment_provider TEXT,
    fulfillment_order_id TEXT,
    tracking_number TEXT
  );
`

// Additive migrations for columns introduced after the table already existed
// in production — ADD COLUMN IF NOT EXISTS is safe to re-run and never
// touches existing rows/data.
const MIGRATE_SQL = `
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS discord_verified_at TIMESTAMPTZ;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
`

function rowToOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    orderNumber: row.order_number as string,
    stripeSessionId: row.stripe_session_id as string,
    paymentStatus: row.payment_status as Order['paymentStatus'],
    fulfillmentStatus: row.fulfillment_status as Order['fulfillmentStatus'],
    customer: { email: (row.customer_email as string | null) ?? undefined },
    items: row.items as Order['items'],
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    tax: Number(row.tax),
    total: Number(row.total),
    currency: row.currency as string,
    shippingAddress: row.shipping_address as Order['shippingAddress'],
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
    fulfillmentProvider: row.fulfillment_provider as Order['fulfillmentProvider'],
    fulfillmentOrderId: (row.fulfillment_order_id as string | null) ?? null,
    trackingNumber: (row.tracking_number as string | null) ?? null,
    discordVerifiedAt: row.discord_verified_at ? (row.discord_verified_at as Date).toISOString() : null,
  }
}

export class PostgresOrderRepository implements OrderRepository {
  private pool: pg.Pool
  private ready: Promise<void>

  constructor(_connectionString: string) {
    this.pool = getPool()
    this.ready = this.pool
      .query(CREATE_TABLE_SQL)
      .then(() => this.pool.query(MIGRATE_SQL))
      .then(() => undefined)
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

  async findByStripeSessionId(sessionId: string): Promise<Order | null> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM orders WHERE stripe_session_id = $1', [sessionId])
    return rows[0] ? rowToOrder(rows[0]) : null
  }

  async findById(id: string): Promise<Order | null> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM orders WHERE id = $1', [id])
    return rows[0] ? rowToOrder(rows[0]) : null
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM orders WHERE order_number = $1', [orderNumber.toUpperCase()])
    return rows[0] ? rowToOrder(rows[0]) : null
  }

  async findByEmail(email: string): Promise<Order[]> {
    await this.ready
    const { rows } = await this.pool.query(
      'SELECT * FROM orders WHERE lower(customer_email) = lower($1) ORDER BY created_at DESC',
      [email]
    )
    return rows.map(rowToOrder)
  }

  async findAll(): Promise<Order[]> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM orders ORDER BY created_at DESC')
    return rows.map(rowToOrder)
  }

  async create(order: Order): Promise<Order> {
    await this.ready
    await this.pool.query(
      `INSERT INTO orders (
        id, order_number, stripe_session_id, payment_status, fulfillment_status, customer_email,
        items, subtotal, shipping, tax, total, currency, shipping_address,
        created_at, updated_at, fulfillment_provider, fulfillment_order_id, tracking_number, discord_verified_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [
        order.id,
        order.orderNumber,
        order.stripeSessionId,
        order.paymentStatus,
        order.fulfillmentStatus,
        order.customer.email ?? null,
        JSON.stringify(order.items),
        order.subtotal,
        order.shipping,
        order.tax,
        order.total,
        order.currency,
        order.shippingAddress ? JSON.stringify(order.shippingAddress) : null,
        order.createdAt,
        order.updatedAt,
        order.fulfillmentProvider,
        order.fulfillmentOrderId,
        order.trackingNumber,
        order.discordVerifiedAt,
      ]
    )
    return order
  }

  async update(id: string, patch: Partial<Order>): Promise<Order | null> {
    await this.ready
    const existing = await this.findById(id)
    if (!existing) return null
    const updated: Order = { ...existing, ...patch, updatedAt: new Date().toISOString() }
    await this.pool.query(
      `UPDATE orders SET
        stripe_session_id = $2, payment_status = $3, fulfillment_status = $4, customer_email = $5,
        shipping_address = $6, updated_at = $7, fulfillment_provider = $8,
        fulfillment_order_id = $9, tracking_number = $10, discord_verified_at = $11
      WHERE id = $1`,
      [
        id,
        updated.stripeSessionId,
        updated.paymentStatus,
        updated.fulfillmentStatus,
        updated.customer.email ?? null,
        updated.shippingAddress ? JSON.stringify(updated.shippingAddress) : null,
        updated.updatedAt,
        updated.fulfillmentProvider,
        updated.fulfillmentOrderId,
        updated.trackingNumber,
        updated.discordVerifiedAt,
      ]
    )
    return updated
  }
}
