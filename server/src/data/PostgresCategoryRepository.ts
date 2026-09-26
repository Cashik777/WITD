import type pg from 'pg'
import { randomUUID } from 'crypto'
import { getPool } from '../lib/pgPool.js'
import type { Category } from '../models/Category.js'
import type { CategoryRepository } from './categoriesDb.js'
import { seedCategories } from './categoriesDb.js'

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL
  );
`

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    parentId: (row.parent_id as string | null) ?? null,
    createdAt: (row.created_at as Date).toISOString(),
  }
}

export class PostgresCategoryRepository implements CategoryRepository {
  private pool: pg.Pool
  private ready: Promise<void>

  constructor(_connectionString: string) {
    this.pool = getPool()
    this.ready = this.pool
      .query(CREATE_TABLE_SQL)
      .then(async () => {
        const { rows } = await this.pool.query('SELECT COUNT(*) FROM categories')
        if (Number(rows[0].count) === 0) {
          for (const c of seedCategories()) {
            await this.pool.query(
              'INSERT INTO categories (id, name, slug, parent_id, created_at) VALUES ($1,$2,$3,$4,$5)',
              [c.id, c.name, c.slug, c.parentId, c.createdAt]
            )
          }
        }
      })
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

  async findAll(): Promise<Category[]> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM categories ORDER BY created_at ASC')
    return rows.map(rowToCategory)
  }

  async findById(id: string): Promise<Category | null> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM categories WHERE id = $1', [id])
    return rows[0] ? rowToCategory(rows[0]) : null
  }

  async create(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    await this.ready
    const full: Category = { ...category, id: randomUUID(), createdAt: new Date().toISOString() }
    await this.pool.query(
      'INSERT INTO categories (id, name, slug, parent_id, created_at) VALUES ($1,$2,$3,$4,$5)',
      [full.id, full.name, full.slug, full.parentId, full.createdAt]
    )
    return full
  }

  async update(id: string, patch: Partial<Category>): Promise<Category | null> {
    await this.ready
    const existing = await this.findById(id)
    if (!existing) return null
    const updated = { ...existing, ...patch }
    await this.pool.query('UPDATE categories SET name = $2, slug = $3, parent_id = $4 WHERE id = $1', [
      id,
      updated.name,
      updated.slug,
      updated.parentId,
    ])
    return updated
  }

  async remove(id: string): Promise<boolean> {
    await this.ready
    const result = await this.pool.query('DELETE FROM categories WHERE id = $1', [id])
    return (result.rowCount ?? 0) > 0
  }
}
