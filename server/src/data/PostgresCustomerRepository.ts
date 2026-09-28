import type pg from 'pg'
import { randomUUID } from 'crypto'
import { getPool } from '../lib/pgPool.js'
import type { Customer, EmailVerification } from '../models/Customer.js'
import type { CustomerRepository } from './customersDb.js'

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
  );
`

// Added after the table already existed in production, so these ride in as
// ALTERs rather than being part of CREATE_TABLE_SQL.
const ADD_VERIFICATION_COLUMNS_SQL = `
  ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
  ALTER TABLE customers ADD COLUMN IF NOT EXISTS verification_code_hash TEXT;
  ALTER TABLE customers ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;
  ALTER TABLE customers ADD COLUMN IF NOT EXISTS verification_attempts INT NOT NULL DEFAULT 0;
`

function rowToCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    email: row.email as string,
    passwordHash: row.password_hash as string,
    emailVerified: row.email_verified as boolean,
    createdAt: (row.created_at as Date).toISOString(),
  }
}

export class PostgresCustomerRepository implements CustomerRepository {
  private pool: pg.Pool
  private ready: Promise<void>

  constructor(_connectionString: string) {
    this.pool = getPool()
    this.ready = this.pool
      .query(CREATE_TABLE_SQL)
      .then(() => this.pool.query(ADD_VERIFICATION_COLUMNS_SQL))
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

  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'emailVerified'>): Promise<Customer> {
    await this.ready
    const full: Customer = { ...customer, id: randomUUID(), emailVerified: false, createdAt: new Date().toISOString() }
    await this.pool.query(
      'INSERT INTO customers (id, email, password_hash, email_verified, created_at) VALUES ($1,$2,$3,$4,$5)',
      [full.id, full.email.toLowerCase(), full.passwordHash, full.emailVerified, full.createdAt]
    )
    return full
  }

  async setVerification(customerId: string, verification: EmailVerification): Promise<void> {
    await this.ready
    await this.pool.query(
      'UPDATE customers SET verification_code_hash = $1, verification_expires_at = $2, verification_attempts = $3 WHERE id = $4',
      [verification.codeHash, verification.expiresAt, verification.attempts, customerId]
    )
  }

  async getVerification(customerId: string): Promise<EmailVerification | null> {
    await this.ready
    const { rows } = await this.pool.query(
      'SELECT verification_code_hash, verification_expires_at, verification_attempts FROM customers WHERE id = $1',
      [customerId]
    )
    const row = rows[0]
    if (!row || !row.verification_code_hash || !row.verification_expires_at) return null
    return {
      codeHash: row.verification_code_hash as string,
      expiresAt: (row.verification_expires_at as Date).toISOString(),
      attempts: row.verification_attempts as number,
    }
  }

  async incrementVerificationAttempts(customerId: string): Promise<void> {
    await this.ready
    await this.pool.query('UPDATE customers SET verification_attempts = verification_attempts + 1 WHERE id = $1', [
      customerId,
    ])
  }

  async markVerified(customerId: string): Promise<void> {
    await this.ready
    await this.pool.query(
      `UPDATE customers
       SET email_verified = TRUE, verification_code_hash = NULL, verification_expires_at = NULL, verification_attempts = 0
       WHERE id = $1`,
      [customerId]
    )
  }
}
