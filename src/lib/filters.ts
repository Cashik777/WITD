import type { Product, ProductFilters, SortOption } from '@/types/product'

// Category and color are admin-managed (see AdminCategories, and the
// growing set of real garment colorways from Printful) so neither is a
// fixed list here — options are derived from whatever's actually in the
// catalog, see categoryOptions()/colorOptions() below.
export const filterOptions = {
  size: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
  collection: ['New Drop', 'Bestsellers', 'Limited'],
  availability: ['in_stock', 'low_stock'],
} as const

export function categoryOptions(products: Product[]): string[] {
  return [...new Set(products.map((p) => p.category))].sort()
}

export function colorOptions(products: Product[]): string[] {
  return [...new Set(products.flatMap((p) => p.colors))].sort()
}

export const availabilityLabels: Record<string, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  sold_out: 'Sold Out',
  coming_soon: 'Coming Soon',
}

export const emptyFilters: ProductFilters = {
  category: [],
  size: [],
  color: [],
  collection: [],
  availability: [],
}

// A product can belong to more than its static `collection` field once
// "smart" collections (New Drop, Bestsellers, Limited) are taken into
// account — those are derived from flags rather than being their own field,
// so the filter and the top Shop-page tabs both read through this helper.
export function productCollections(p: Product): string[] {
  const list = [p.collection]
  if (p.new) list.push('New Drop')
  if (p.bestseller) list.push('Bestsellers')
  if (p.availability === 'low_stock') list.push('Limited')
  return list
}

export function applyFilters(products: Product[], filters: ProductFilters): Product[] {
  return products.filter((p) => {
    if (filters.category.length && !filters.category.includes(p.category)) return false
    if (filters.size.length && !filters.size.some((s) => p.availableSizes.includes(s))) return false
    if (filters.color.length && !filters.color.some((c) => p.colors.includes(c))) return false
    if (filters.collection.length && !filters.collection.some((c) => productCollections(p).includes(c))) return false
    if (filters.availability.length && !filters.availability.includes(p.availability)) return false
    if (filters.priceMin != null && p.price < filters.priceMin) return false
    if (filters.priceMax != null && p.price > filters.priceMax) return false
    return true
  })
}

export type FilterGroup = 'category' | 'size' | 'color' | 'collection' | 'availability'

function matchesGroupOption(p: Product, group: FilterGroup, value: string): boolean {
  switch (group) {
    case 'category':
      return p.category === value
    case 'size':
      return p.availableSizes.includes(value)
    case 'color':
      return p.colors.includes(value)
    case 'collection':
      return productCollections(p).includes(value)
    case 'availability':
      return p.availability === value
    default:
      return false
  }
}

// Counts each option against the catalog as filtered by every *other*
// active group — so picking "M" doesn't zero out every other size, but
// colors/categories with genuinely zero matching stock still show 0 and
// are disabled (Baymard: never let shoppers select into an empty result).
export function countByOption(
  products: Product[],
  filters: ProductFilters,
  group: FilterGroup
): Record<string, number> {
  const otherFilters: ProductFilters = { ...filters, [group]: [] }
  const base = applyFilters(products, otherFilters)
  const options =
    group === 'category' ? categoryOptions(products) : group === 'color' ? colorOptions(products) : filterOptions[group]
  const counts: Record<string, number> = {}
  for (const opt of options) {
    counts[opt] = base.filter((p) => matchesGroupOption(p, group, opt)).length
  }
  return counts
}

export function applySort(products: Product[], sort: SortOption): Product[] {
  const sorted = [...products]
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => Number(b.new) - Number(a.new))
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price)
    case 'featured':
    default:
      return sorted.sort((a, b) => Number(b.featured) - Number(a.featured))
  }
}

export function activeFilterChips(filters: ProductFilters): { key: string; label: string }[] {
  const chips: { key: string; label: string }[] = []
  const push = (group: keyof ProductFilters, values: string[]) =>
    values.forEach((v) => chips.push({ key: `${group}:${v}`, label: v }))
  push('category', filters.category)
  push('size', filters.size)
  push('color', filters.color)
  push('collection', filters.collection)
  push('availability', filters.availability)
  return chips
}
