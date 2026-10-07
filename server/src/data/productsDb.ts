import { randomUUID } from 'crypto'
import type { Product } from '../models/Product.js'
import { PostgresProductRepository } from './PostgresProductRepository.js'

// ---------------------------------------------------------------------------
// PRODUCT REPOSITORY ABSTRACTION
//
// Mirrors data/db.ts (orders): routes never talk to Postgres directly, only
// to this interface, which is what lets the admin panel, the public catalog
// route, and checkout validation all share one source of truth instead of
// the two hand-maintained static arrays this replaced.
// ---------------------------------------------------------------------------

export interface ProductRepository {
  findAll(): Promise<Product[]>
  findById(id: string): Promise<Product | null>
  findBySlug(slug: string): Promise<Product | null>
  create(product: Product): Promise<Product>
  update(id: string, patch: Partial<Product>): Promise<Product | null>
  remove(id: string): Promise<boolean>
  ping(): Promise<boolean>
}

const colorSlug: Record<string, string> = {
  Black: 'black',
  White: 'white',
  'Off-White': 'off-white',
  'Dark Stone': 'dark-stone',
}
const teeImg = (color: string, view: 'front' | 'back') => `/assets/products/${colorSlug[color]}-${view}.svg`
const imagesByColorFor = (colors: string[]): Record<string, string[]> =>
  Object.fromEntries(colors.map((c) => [c, [teeImg(c, 'front'), teeImg(c, 'back')]]))

// One-time seed for a fresh database — the original First Drop catalog.
// After this, the admin panel is the source of truth; this array is never
// read again once the table has rows.
export function seedProducts(): Product[] {
  const now = new Date().toISOString()
  const base = (p: Omit<Product, 'createdAt' | 'updatedAt'>): Product => ({ ...p, createdAt: now, updatedAt: now })

  return [
    base({
      id: 'witd-001',
      slug: 'god-is-my-friend-tee',
      name: 'God Is My Friend Tee',
      description:
        'A heavyweight tee built around a single quiet line, printed small over the chest. Not a statement piece — a private one.',
      idea: 'Said to no one in particular, at the moment it was needed most. Some garments are worn for other people. This one is worn for the wearer.',
      price: 45,
      priceUSD: 35,
      priceEUR: null,
      currency: 'CAD',
      category: 'T-Shirts',
      collection: 'First Drop',
      colors: ['Black', 'White'],
      images: [teeImg('Black', 'front'), teeImg('Black', 'back')],
      hoverImage: teeImg('Black', 'back'),
      imagesByColor: imagesByColorFor(['Black', 'White']),
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      availableSizes: ['S', 'M', 'L', 'XL'],
      materials: '100% heavyweight combed cotton, 240gsm',
      fit: 'Boxy fit. True to size — size down for a closer fit.',
      careInstructions: 'Machine wash cold, inside out. Do not tumble dry.',
      sku: 'WITD-TEE-GIMF',
      tags: ['tee', 'first drop', 'black', 'white'],
      featured: true,
      new: true,
      bestseller: true,
      availability: 'in_stock',
      fulfillmentProvider: 'printful',
      providerProductId: null,
      providerVariantMappings: {
        'black-s': 'PLACEHOLDER', 'black-m': 'PLACEHOLDER', 'black-l': 'PLACEHOLDER', 'black-xl': 'PLACEHOLDER',
        'white-s': 'PLACEHOLDER', 'white-m': 'PLACEHOLDER', 'white-l': 'PLACEHOLDER', 'white-xl': 'PLACEHOLDER',
      },
    }),
    base({
      id: 'witd-002',
      slug: 'witd-observer-tee',
      name: 'WITD Observer Tee',
      description: 'Front chest hit of the WITD symbol — the eye that watches the dream from inside it. Oversized back print.',
      idea: 'To observe is already to choose. The Observer Tee carries the mark that everything else in the brand circles back to.',
      price: 48,
      priceUSD: 37,
      priceEUR: null,
      currency: 'CAD',
      category: 'T-Shirts',
      collection: 'First Drop',
      colors: ['Black', 'Dark Stone'],
      images: [teeImg('Black', 'front'), teeImg('Black', 'back')],
      hoverImage: teeImg('Black', 'back'),
      imagesByColor: imagesByColorFor(['Black', 'Dark Stone']),
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      materials: '100% heavyweight combed cotton, 240gsm',
      fit: 'Boxy fit. True to size — size down for a closer fit.',
      careInstructions: 'Machine wash cold, inside out. Do not tumble dry.',
      sku: 'WITD-TEE-OBS',
      tags: ['tee', 'first drop', 'symbol', 'bestseller'],
      featured: true,
      new: true,
      bestseller: true,
      availability: 'in_stock',
      fulfillmentProvider: 'printful',
      providerProductId: null,
      providerVariantMappings: {},
    }),
    base({
      id: 'witd-003',
      slug: 'wake-in-the-dream-tee',
      name: 'Wake In The Dream Tee',
      description: 'The flagship wordmark tee. Full-width type treatment across the back, small mark on the chest.',
      idea: 'The brand name, worn as instruction rather than logo.',
      price: 45,
      priceUSD: 35,
      priceEUR: null,
      currency: 'CAD',
      category: 'T-Shirts',
      collection: 'First Drop',
      colors: ['Black', 'White', 'Off-White'],
      images: [teeImg('Black', 'front'), teeImg('Black', 'back')],
      hoverImage: teeImg('Black', 'back'),
      imagesByColor: imagesByColorFor(['Black', 'White', 'Off-White']),
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
      materials: '100% heavyweight combed cotton, 240gsm',
      fit: 'Boxy fit. True to size — size down for a closer fit.',
      careInstructions: 'Machine wash cold, inside out. Do not tumble dry.',
      sku: 'WITD-TEE-WITD',
      tags: ['tee', 'first drop', 'wordmark'],
      featured: true,
      new: false,
      bestseller: true,
      availability: 'in_stock',
      fulfillmentProvider: 'printful',
      providerProductId: null,
      providerVariantMappings: {},
    }),
    base({
      id: 'witd-004',
      slug: 'snake-catcher-tee',
      name: 'Snake Catcher Tee',
      description: 'Graphic tee built around a hand-drawn snake motif — temptation, held rather than avoided.',
      idea: 'You don’t defeat the snake by running from it. You learn to hold it without being bitten.',
      price: 48,
      priceUSD: 37,
      priceEUR: null,
      currency: 'CAD',
      category: 'T-Shirts',
      collection: 'First Drop',
      colors: ['Black'],
      images: [teeImg('Black', 'front'), teeImg('Black', 'back')],
      hoverImage: teeImg('Black', 'back'),
      imagesByColor: imagesByColorFor(['Black']),
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      availableSizes: ['S', 'M', 'L'],
      materials: '100% heavyweight combed cotton, 240gsm',
      fit: 'Boxy fit. True to size — size down for a closer fit.',
      careInstructions: 'Machine wash cold, inside out. Do not tumble dry.',
      sku: 'WITD-TEE-SNK',
      tags: ['tee', 'first drop', 'graphic'],
      featured: false,
      new: true,
      bestseller: false,
      availability: 'low_stock',
      fulfillmentProvider: 'printful',
      providerProductId: null,
      providerVariantMappings: {},
    }),
    base({
      id: 'witd-005',
      slug: 'fool-me-if-you-can-tee',
      name: 'Fool Me If You Can Tee',
      description: 'A dare printed in small serif type across the back shoulder blades. Minimal front.',
      idea: 'Consciousness as a kind of armor. Try it.',
      price: 45,
      priceUSD: 35,
      priceEUR: null,
      currency: 'CAD',
      category: 'T-Shirts',
      collection: 'First Drop',
      colors: ['White', 'Black'],
      images: [teeImg('White', 'front'), teeImg('White', 'back')],
      hoverImage: teeImg('White', 'back'),
      imagesByColor: imagesByColorFor(['White', 'Black']),
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
      materials: '100% heavyweight combed cotton, 240gsm',
      fit: 'Boxy fit. True to size — size down for a closer fit.',
      careInstructions: 'Machine wash cold, inside out. Do not tumble dry.',
      sku: 'WITD-TEE-FMY',
      tags: ['tee', 'first drop'],
      featured: false,
      new: false,
      bestseller: false,
      availability: 'in_stock',
      fulfillmentProvider: 'printify',
      providerProductId: null,
      providerVariantMappings: {},
    }),
    base({
      id: 'witd-006',
      slug: 'witd-symbol-tee',
      name: 'WITD Symbol Tee',
      description: 'The four-letter mark, oversized and centered. As close to a uniform piece as the drop gets.',
      idea: 'Some symbols explain themselves once you’ve seen them enough times. This one is designed to be seen often.',
      price: 48,
      priceUSD: 37,
      priceEUR: null,
      currency: 'CAD',
      category: 'T-Shirts',
      collection: 'First Drop',
      colors: ['Black', 'White'],
      images: [teeImg('Black', 'front'), teeImg('Black', 'back')],
      hoverImage: teeImg('Black', 'back'),
      imagesByColor: imagesByColorFor(['Black', 'White']),
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
      materials: '100% heavyweight combed cotton, 240gsm',
      fit: 'Boxy fit. True to size — size down for a closer fit.',
      careInstructions: 'Machine wash cold, inside out. Do not tumble dry.',
      sku: 'WITD-TEE-SYM',
      tags: ['tee', 'first drop', 'symbol', 'bestseller'],
      featured: true,
      new: false,
      bestseller: true,
      availability: 'in_stock',
      fulfillmentProvider: 'printful',
      providerProductId: null,
      providerVariantMappings: {},
    }),
    base({
      id: 'witd-007',
      slug: 'where-are-we-running-tee',
      name: 'Where Are We Running? Tee',
      description: 'A question, not a slogan. Placed low on the back hem, easy to miss on purpose.',
      idea: 'Most of what looks like ambition is just motion. Worth asking, occasionally, where it’s headed.',
      price: 45,
      priceUSD: 35,
      priceEUR: null,
      currency: 'CAD',
      category: 'T-Shirts',
      collection: 'First Drop',
      colors: ['Black', 'Dark Stone'],
      images: [teeImg('Black', 'front'), teeImg('Black', 'back')],
      hoverImage: teeImg('Black', 'back'),
      imagesByColor: imagesByColorFor(['Black', 'Dark Stone']),
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      availableSizes: ['S', 'M', 'L', 'XL'],
      materials: '100% heavyweight combed cotton, 240gsm',
      fit: 'Boxy fit. True to size — size down for a closer fit.',
      careInstructions: 'Machine wash cold, inside out. Do not tumble dry.',
      sku: 'WITD-TEE-RUN',
      tags: ['tee', 'first drop'],
      featured: false,
      new: true,
      bestseller: false,
      availability: 'in_stock',
      fulfillmentProvider: 'printify',
      providerProductId: null,
      providerVariantMappings: {},
    }),
    base({
      id: 'witd-008',
      slug: 'security-forgiveness-tee',
      name: 'Security / Forgiveness Tee',
      description: 'Two words, one on the chest and one on the back — meant to be read in either order.',
      idea: 'Between the two of them, most of what people actually want.',
      price: 45,
      priceUSD: 35,
      priceEUR: null,
      currency: 'CAD',
      category: 'T-Shirts',
      collection: 'First Drop',
      colors: ['White', 'Off-White'],
      images: [teeImg('White', 'front'), teeImg('White', 'back')],
      hoverImage: teeImg('White', 'back'),
      imagesByColor: imagesByColorFor(['White', 'Off-White']),
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      availableSizes: ['XS', 'S', 'M', 'L'],
      materials: '100% heavyweight combed cotton, 240gsm',
      fit: 'Boxy fit. True to size — size down for a closer fit.',
      careInstructions: 'Machine wash cold, inside out. Do not tumble dry.',
      sku: 'WITD-TEE-SEC',
      tags: ['tee', 'first drop'],
      featured: false,
      new: false,
      bestseller: false,
      availability: 'sold_out',
      fulfillmentProvider: 'printify',
      providerProductId: null,
      providerVariantMappings: {},
    }),
  ]
}

class InMemoryProductRepository implements ProductRepository {
  private products = new Map<string, Product>(seedProducts().map((p) => [p.id, p]))

  async ping(): Promise<boolean> {
    return true
  }

  async findAll(): Promise<Product[]> {
    return [...this.products.values()]
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) ?? null
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return [...this.products.values()].find((p) => p.slug === slug) ?? null
  }

  async create(product: Product): Promise<Product> {
    const withId = { ...product, id: product.id || randomUUID() }
    this.products.set(withId.id, withId)
    return withId
  }

  async update(id: string, patch: Partial<Product>): Promise<Product | null> {
    const existing = this.products.get(id)
    if (!existing) return null
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() }
    this.products.set(id, updated)
    return updated
  }

  async remove(id: string): Promise<boolean> {
    return this.products.delete(id)
  }
}

// See the comment in data/db.ts — this selection must stay synchronous.
function createProductRepository(): ProductRepository {
  if (process.env.DATABASE_URL) {
    return new PostgresProductRepository(process.env.DATABASE_URL)
  }
  console.warn('DATABASE_URL is not set — product catalog is in-memory and edits will not persist.')
  return new InMemoryProductRepository()
}

export const productRepository: ProductRepository = createProductRepository()
