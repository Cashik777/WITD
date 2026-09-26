import type pg from 'pg'
import { randomUUID } from 'crypto'
import { getPool } from '../lib/pgPool.js'
import type { Customer } from '../models/Customer.js'
import type { CustomerRepository } from './customersDb.js'

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
  );
`

function rowToCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    email: row.email as string,
    passwordHash: row.password_hash as string,
    createdAt: (row.created_at as Date).toISOString(),
  }
}

export class PostgresCustomerRepository implements CustomerRepository {
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

  async findByEmail(email: string): Promise<Customer | null> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM customers WHERE email = $1', [email.toLowerCase()])
    return rows[0] ? rowToCustomer(rows[0]) : null
  }

  async findById(id: string): Promise<Customer | null> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM customers WHERE id = $1', [id])
    return rows[0] ? rowToCustomer(rows[0]) : null
  }

  async create(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    await this.ready
    const full: Customer = { ...customer, id: randomUUID(), createdAt: new Date().toISOString() }
    await this.pool.query('INSERT INTO customers (id, email, password_hash, created_at) VALUES ($1,$2,$3,$4)', [
      full.id,
      full.email.toLowerCase(),
      full.passwordHash,
      full.createdAt,
    ])
    return full
  }
}
