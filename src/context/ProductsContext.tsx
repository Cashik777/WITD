import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { Product } from '@/types/product'

export const categories = ['All', 'T-Shirts', 'Hoodies', 'Outerwear', 'Accessories'] as const
export const collections = ['New Drop', 'Bestsellers', 'Limited'] as const

interface ProductsContextValue {
  products: Product[]
  loading: boolean
  error: string | null
  getProductBySlug: (slug: string) => Product | undefined
  getProductById: (id: string) => Product | undefined
  getRelatedProducts: (product: Product, limit?: number) => Product[]
  refresh: () => void
}

export const ProductsContext = createContext<ProductsContextValue | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch('/api/products')
      .then((res) => {
        if (!res.ok) throw new Error('Could not load products.')
        return res.json()
      })
      .then((data) => setProducts(data.products ?? []))
      .catch(() => setError('Could not load products. Please refresh the page.'))
      .finally(() => setLoading(false))
  }, [reloadKey])

  const value: ProductsContextValue = {
    products,
    loading,
    error,
    getProductBySlug: (slug) => products.find((p) => p.slug === slug),
    getProductById: (id) => products.find((p) => p.id === id),
    getRelatedProducts: (product, limit = 4) =>
      products
        .filter((p) => p.id !== product.id && (p.category === product.category || p.collection === product.collection))
        .slice(0, limit),
    refresh: () => setReloadKey((k) => k + 1),
  }

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
}
