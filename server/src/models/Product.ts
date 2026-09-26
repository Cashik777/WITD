export type FulfillmentProviderName = 'printful' | 'printify' | 'mock'

export interface ProductVariantMapping {
  [colorSizeKey: string]: string
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  idea?: string
  price: number
  currency: 'CAD' | 'USD'
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
