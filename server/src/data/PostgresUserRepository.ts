import type pg from 'pg'
import { randomUUID } from 'crypto'
import { getPool } from '../lib/pgPool.js'
import type { User } from '../models/User.js'
import type { UserRepository } from './usersDb.js'

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
  );
`

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    passwordHash: row.password_hash as string,
    role: row.role as User['role'],
    createdAt: (row.created_at as Date).toISOString(),
  }
}

export class PostgresUserRepository implements UserRepository {
  private pool: pg.Pool
  private ready: Promise<void>

  constructor(_connectionString: string) {
    this.pool = getPool()
    this.ready = this.pool.query(CREATE_TABLE_SQL).then(() => undefined)
  }

  async findByEmail(email: string): Promise<User | null> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM admin_users WHERE email = $1', [email.toLowerCase()])
    return rows[0] ? rowToUser(rows[0]) : null
  }

  async findById(id: string): Promise<User | null> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM admin_users WHERE id = $1', [id])
    return rows[0] ? rowToUser(rows[0]) : null
  }

  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    await this.ready
    const full: User = { ...user, id: randomUUID(), createdAt: new Date().toISOString() }
    await this.pool.query(
      'INSERT INTO admin_users (id, email, password_hash, role, created_at) VALUES ($1,$2,$3,$4,$5)',
      [full.id, full.email.toLowerCase(), full.passwordHash, full.role, full.createdAt]
    )
    return full
  }

  async count(): Promise<number> {
    await this.ready
    const { rows } = await this.pool.query('SELECT COUNT(*) FROM admin_users')
    return Number(rows[0].count)
  }
}
