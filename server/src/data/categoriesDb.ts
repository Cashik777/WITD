import { randomUUID } from 'crypto'
import type { Category } from '../models/Category.js'
import { PostgresCategoryRepository } from './PostgresCategoryRepository.js'

export interface CategoryRepository {
  findAll(): Promise<Category[]>
  findById(id: string): Promise<Category | null>
  create(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category>
  update(id: string, patch: Partial<Category>): Promise<Category | null>
  remove(id: string): Promise<boolean>
  ping(): Promise<boolean>
}

// Seeded once on a fresh database so the existing First Drop products (all
// tagged "T-Shirts") still resolve to a real category — everything after
// this is admin-managed via the category CRUD routes.
export function seedCategories(): Category[] {
  const now = new Date().toISOString()
  return ['T-Shirts', 'Hoodies', 'Outerwear', 'Accessories'].map((name) => ({
    id: randomUUID(),
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    parentId: null,
    createdAt: now,
  }))
}

class InMemoryCategoryRepository implements CategoryRepository {
  private categories = new Map<string, Category>(seedCategories().map((c) => [c.id, c]))

  async ping(): Promise<boolean> {
    return true
  }

  async findAll(): Promise<Category[]> {
    return [...this.categories.values()]
  }

  async findById(id: string): Promise<Category | null> {
    return this.categories.get(id) ?? null
  }

  async create(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const full: Category = { ...category, id: randomUUID(), createdAt: new Date().toISOString() }
    this.categories.set(full.id, full)
    return full
  }

  async update(id: string, patch: Partial<Category>): Promise<Category | null> {
    const existing = this.categories.get(id)
    if (!existing) return null
    const updated = { ...existing, ...patch }
    this.categories.set(id, updated)
    return updated
  }

  async remove(id: string): Promise<boolean> {
    return this.categories.delete(id)
  }
}

// See the comment in data/db.ts — this selection must stay synchronous.
function createCategoryRepository(): CategoryRepository {
  if (process.env.DATABASE_URL) {
    return new PostgresCategoryRepository(process.env.DATABASE_URL)
  }
  console.warn('DATABASE_URL is not set — categories are in-memory and will be lost on restart.')
  return new InMemoryCategoryRepository()
}

export const categoryRepository: CategoryRepository = createCategoryRepository()
