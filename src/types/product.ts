export type FulfillmentProviderName = 'printful' | 'printify' | 'mock'

export interface ProductVariantMapping {
  // Maps a human-readable "color-size" key (e.g. "black-m") to the
  // fulfillment provider's internal variant id. Filled in when the
  // real POD catalog is connected — left as placeholders for now.
  [colorSizeKey: string]: string
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  idea?: string // short "the idea behind this piece" editorial blurb
  price: number
  currency: 'CAD' | 'USD'
  category: string // category slug — see Category type, admin-managed
  collection: string
  images: string[]
  hoverImage?: string
  imagesByColor: Record<string, string[]>
  colors: string[]
  sizes: string[]
  availableSizes: string[] // subset of sizes currently in stock
  materials: string
  fit: string
  careInstructions: string
  sku: string
  tags: string[]
  featured: boolean
  new: boolean
  bestseller: boolean
  availability: 'in_stock' | 'low_stock' | 'sold_out' | 'coming_soon'

  // Fulfillment / POD mapping — never shown to the customer directly.
  fulfillmentProvider: FulfillmentProviderName
  providerProductId: string | null
  providerVariantMappings: ProductVariantMapping
}

export interface ProductFilters {
  category: string[]
  size: string[]
  color: string[]
  collection: string[]
  availability: string[]
  priceMin?: number
  priceMax?: number
}

export type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc'
