import { useMemo, useState } from 'react'
import type { Product, ProductFilters, SortOption } from '@/types/product'
import { applyFilters, applySort, emptyFilters } from '@/lib/filters'

export function useFilteredProducts(products: Product[], initialCategory?: string) {
  const [filters, setFilters] = useState<ProductFilters>({
    ...emptyFilters,
    category: initialCategory && initialCategory !== 'All' ? [initialCategory] : [],
  })
  const [sort, setSort] = useState<SortOption>('featured')

  const result = useMemo(() => applySort(applyFilters(products, filters), sort), [products, filters, sort])

  const toggleFilter = (group: keyof ProductFilters, value: string) => {
    setFilters((prev) => {
      const current = prev[group] as string[]
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      return { ...prev, [group]: next }
    })
  }

  const clearFilters = () => setFilters(emptyFilters)

  return { filters, setFilters, toggleFilter, clearFilters, sort, setSort, result }
}
