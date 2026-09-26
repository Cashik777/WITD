import type { Order } from '../models/Order.js'

// ---------------------------------------------------------------------------
// ORDER REPOSITORY ABSTRACTION
//
// The rest of the app (routes, webhook handler) only ever talks to the
// OrderRepository interface below — never to a specific database. That's
// what lets this swap from the in-memory store used here to Postgres,
// Supabase, or anything else without touching route/webhook code.
//
// localStorage is NEVER an acceptable backing store for this — it only
// exists on a single customer's browser and isn't authoritative. The
// frontend only uses localStorage for the pre-checkout cart, which is a
// separate, disposable piece of state (see src/context/CartContext.tsx).
//
// TO CONNECT A REAL DATABASE:
//   1. Implement OrderRepository against Postgres/Supabase (e.g. with
//      Prisma, Drizzle, or the Supabase client).
//   2. Swap the `export const orderRepository = new InMemoryOrderRepository()`
//      line at the bottom of this file for your implementation.
//   Nothing else in the server needs to change.
// ---------------------------------------------------------------------------

export interface OrderRepository {
  findByStripeSessionId(sessionId: string): Promise<Order | null>
  findById(id: string): Promise<Order | null>
  findByOrderNumber(orderNumber: string): Promise<Order | null>
  findAll(): Promise<Order[]>
  create(order: Order): Promise<Order>
  update(id: string, patch: Partial<Order>): Promise<Order | null>
  ping(): Promise<boolean>
}

class InMemoryOrderRepository implements OrderRepository {
  private orders = new Map<string, Order>()
  private byStripeSession = new Map<string, string>()
  private byOrderNumber = new Map<string, string>()

  async ping(): Promise<boolean> {
    return true
  }

  async findByStripeSessionId(sessionId: string): Promise<Order | null> {
    const id = this.byStripeSession.get(sessionId)
    return id ? this.orders.get(id) ?? null : null
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const id = this.byOrderNumber.get(orderNumber.toUpperCase())
    return id ? this.orders.get(id) ?? null : null
  }

  async findAll(): Promise<Order[]> {
    return [...this.orders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async create(order: Order): Promise<Order> {
    this.orders.set(order.id, order)
    this.byStripeSession.set(order.stripeSessionId, order.id)
    this.byOrderNumber.set(order.orderNumber.toUpperCase(), order.id)
    return order
  }

  async update(id: string, patch: Partial<Order>): Promise<Order | null> {
    const existing = this.orders.get(id)
    if (!existing) return null
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() }
    this.orders.set(id, updated)
    return updated
  }
}

// In-memory store — resets on every server restart. Fine for local test-mode
// development; a real DATABASE_URL swaps this for Postgres (see below).
async function createOrderRepository(): Promise<OrderRepository> {
  if (process.env.DATABASE_URL) {
    const { PostgresOrderRepository } = await import('./PostgresOrderRepository.js')
    return new PostgresOrderRepository(process.env.DATABASE_URL)
  }
  console.warn('DATABASE_URL is not set — orders are stored in memory and will be lost on restart.')
  return new InMemoryOrderRepository()
}

export const isUsingDatabase = Boolean(process.env.DATABASE_URL)
export const orderRepository: OrderRepository = await createOrderRepository()
