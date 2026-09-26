import pg from 'pg'
import type { Product } from '../models/Product.js'
import type { ProductRepository } from './productsDb.js'
import { seedProducts } from './productsDb.js'

const { Pool } = pg

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    idea TEXT,
    price NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    category TEXT NOT NULL,
    collection TEXT NOT NULL,
    images JSONB NOT NULL,
    hover_image TEXT,
    images_by_color JSONB NOT NULL,
    colors JSONB NOT NULL,
    sizes JSONB NOT NULL,
    available_sizes JSONB NOT NULL,
    materials TEXT NOT NULL,
    fit TEXT NOT NULL,
    care_instructions TEXT NOT NULL,
    sku TEXT NOT NULL,
    tags JSONB NOT NULL,
    featured BOOLEAN NOT NULL DEFAULT false,
    is_new BOOLEAN NOT NULL DEFAULT false,
    bestseller BOOLEAN NOT NULL DEFAULT false,
    availability TEXT NOT NULL,
    fulfillment_provider TEXT NOT NULL,
    provider_product_id TEXT,
    provider_variant_mappings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  );
`

function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string,
    idea: (row.idea as string | null) ?? undefined,
    price: Number(row.price),
    currency: row.currency as Product['currency'],
    category: row.category as Product['category'],
    collection: row.collection as string,
    images: row.images as string[],
    hoverImage: (row.hover_image as string | null) ?? undefined,
    imagesByColor: row.images_by_color as Record<string, string[]>,
    colors: row.colors as string[],
    sizes: row.sizes as string[],
    availableSizes: row.available_sizes as string[],
    materials: row.materials as string,
    fit: row.fit as string,
    careInstructions: row.care_instructions as string,
    sku: row.sku as string,
    tags: row.tags as string[],
    featured: row.featured as boolean,
    new: row.is_new as boolean,
    bestseller: row.bestseller as boolean,
    availability: row.availability as Product['availability'],
    fulfillmentProvider: row.fulfillment_provider as Product['fulfillmentProvider'],
    providerProductId: (row.provider_product_id as string | null) ?? null,
    providerVariantMappings: row.provider_variant_mappings as Product['providerVariantMappings'],
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  }
}

const INSERT_COLUMNS = `
  id, slug, name, description, idea, price, currency, category, collection,
  images, hover_image, images_by_color, colors, sizes, available_sizes,
  materials, fit, care_instructions, sku, tags, featured, is_new, bestseller,
  availability, fulfillment_provider, provider_product_id, provider_variant_mappings,
  created_at, updated_at
`

function toInsertValues(p: Product): unknown[] {
  return [
    p.id, p.slug, p.name, p.description, p.idea ?? null, p.price, p.currency, p.category, p.collection,
    JSON.stringify(p.images), p.hoverImage ?? null, JSON.stringify(p.imagesByColor), JSON.stringify(p.colors),
    JSON.stringify(p.sizes), JSON.stringify(p.availableSizes), p.materials, p.fit, p.careInstructions, p.sku,
    JSON.stringify(p.tags), p.featured, p.new, p.bestseller, p.availability, p.fulfillmentProvider,
    p.providerProductId, JSON.stringify(p.providerVariantMappings), p.createdAt, p.updatedAt,
  ]
}

export class PostgresProductRepository implements ProductRepository {
  private pool: pg.Pool
  private ready: Promise<void>

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
    this.ready = this.pool
      .query(CREATE_TABLE_SQL)
      .then(async () => {
        const { rows } = await this.pool.query('SELECT COUNT(*) FROM products')
        if (Number(rows[0].count) === 0) {
          for (const product of seedProducts()) {
            await this.insert(product)
          }
        }
      })
      .then(() => undefined)
  }

  private async insert(p: Product): Promise<void> {
    const placeholders = Array.from({ length: 29 }, (_, i) => `$${i + 1}`).join(',')
    await this.pool.query(`INSERT INTO products (${INSERT_COLUMNS}) VALUES (${placeholders})`, toInsertValues(p))
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

  async findAll(): Promise<Product[]> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM products ORDER BY created_at ASC')
    return rows.map(rowToProduct)
  }

  async findById(id: string): Promise<Product | null> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM products WHERE id = $1', [id])
    return rows[0] ? rowToProduct(rows[0]) : null
  }

  async findBySlug(slug: string): Promise<Product | null> {
    await this.ready
    const { rows } = await this.pool.query('SELECT * FROM products WHERE slug = $1', [slug])
    return rows[0] ? rowToProduct(rows[0]) : null
  }

  async create(product: Product): Promise<Product> {
    await this.ready
    await this.insert(product)
    return product
  }

  async update(id: string, patch: Partial<Product>): Promise<Product | null> {
    await this.ready
    const existing = await this.findById(id)
    if (!existing) return null
    const updated: Product = { ...existing, ...patch, updatedAt: new Date().toISOString() }
    await this.pool.query(
      `UPDATE products SET
        slug=$2, name=$3, description=$4, idea=$5, price=$6, currency=$7, category=$8, collection=$9,
        images=$10, hover_image=$11, images_by_color=$12, colors=$13, sizes=$14, available_sizes=$15,
        materials=$16, fit=$17, care_instructions=$18, sku=$19, tags=$20, featured=$21, is_new=$22,
        bestseller=$23, availability=$24, fulfillment_provider=$25, provider_product_id=$26,
        provider_variant_mappings=$27, updated_at=$28
      WHERE id=$1`,
      [
        id, updated.slug, updated.name, updated.description, updated.idea ?? null, updated.price, updated.currency,
        updated.category, updated.collection, JSON.stringify(updated.images), updated.hoverImage ?? null,
        JSON.stringify(updated.imagesByColor), JSON.stringify(updated.colors), JSON.stringify(updated.sizes),
        JSON.stringify(updated.availableSizes), updated.materials, updated.fit, updated.careInstructions,
        updated.sku, JSON.stringify(updated.tags), updated.featured, updated.new, updated.bestseller,
        updated.availability, updated.fulfillmentProvider, updated.providerProductId,
        JSON.stringify(updated.providerVariantMappings), updated.updatedAt,
      ]
    )
    return updated
  }

  async remove(id: string): Promise<boolean> {
    await this.ready
    const result = await this.pool.query('DELETE FROM products WHERE id = $1', [id])
    return (result.rowCount ?? 0) > 0
  }
}
