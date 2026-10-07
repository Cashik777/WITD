export type FulfillmentProviderName = 'printful' | 'printify' | 'mock'

export interface ProductVariantMapping {
  [colorSizeKey: string]: string
}

// The single source of truth for how a color+size pair is looked up in
// providerVariantMappings — the admin form and every FulfillmentProvider
// must build/read this key the same way.
export function variantKey(color: string, size: string): string {
  return `${color}-${size}`
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  idea?: string
  price: number // CAD — the base/display price
  priceUSD: number | null // shown/charged to customers detected as non-Canadian; null falls back to a straight read of `price`
  priceEUR: number | null // shown/charged to customers detected as EU-based; null falls back to a straight read of `price`
  currency: 'CAD' | 'USD' | 'EUR'
  category: string // category slug, see models/Category.ts — admin-managed, not a fixed enum
  collection: string
  images: string[]
  hoverImage?: string
  imagesByColor: Record<string, string[]>
  colors: string[]
  sizes: string[]
  availableSizes: string[]
  materials: string
  fit: string
  careInstructions: string
  sku: string
  tags: string[]
  featured: boolean
  new: boolean
  bestseller: boolean
  availability: 'in_stock' | 'low_stock' | 'sold_out' | 'coming_soon'
  fulfillmentProvider: FulfillmentProviderName
  providerProductId: string | null
  providerVariantMappings: ProductVariantMapping
  createdAt: string
  updatedAt: string
}
