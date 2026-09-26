import type { Product } from '@/types/product'

export function searchProducts(products: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return products.filter((p) => {
    const haystack = [p.name, p.category, p.collection, ...p.tags].join(' ').toLowerCase()
    return haystack.includes(q)
  })
}
