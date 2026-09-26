import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { Product } from '@/types/product'
import type { Category } from '@/types/category'

export const collections = ['New Drop', 'Bestsellers', 'Limited'] as const

interface ProductsContextValue {
  products: Product[]
  categories: Category[]
  // Top-level category names, "All" first — the same shape the storefront
  // nav/filters used back when this was a static array, so most call sites
  // didn't need to change when categories became admin-managed.
  categoryNames: string[]
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
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetch('/api/products').then((res) => {
        if (!res.ok) throw new Error('Could not load products.')
        return res.json()
      }),
      fetch('/api/categories').then((res) => (res.ok ? res.json() : { categories: [] })),
    ])
      .then(([productsData, categoriesData]) => {
        setProducts(productsData.products ?? [])
        setCategories(categoriesData.categories ?? [])
      })
      .catch(() => setError('Could not load products. Please refresh the page.'))
      .finally(() => setLoading(false))
  }, [reloadKey])

  const categoryNames = ['All', ...categories.filter((c) => !c.parentId).map((c) => c.name)]

  const value: ProductsContextValue = {
    products,
    categories,
    categoryNames,
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
