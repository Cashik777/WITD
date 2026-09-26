import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { products, categories } from '@/data/products'
import { useFilteredProducts } from '@/hooks/useFilteredProducts'
import { ProductGrid } from '@/components/ProductGrid'
import { FilterPanel } from '@/components/FilterPanel'
import { FilterDrawer } from '@/components/FilterDrawer'
import { activeFilterChips } from '@/lib/filters'
import { ChevronDown, CloseIcon } from '@/components/icons'
import type { SortOption } from '@/types/product'

// "/shop/t-shirts" -> "T-Shirts", matched against the canonical category list.
function slugToCategory(slug?: string) {
  if (!slug) return undefined
  const normalized = slug.replace(/-/g, ' ').toLowerCase()
  return categories.find((c) => c.toLowerCase() === normalized)
}

const sortLabels: Record<SortOption, string> = {
  featured: 'Featured',
  newest: 'Newest',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
}

export default function Shop() {
  const [searchParams] = useSearchParams()
  const { category: categoryParam } = useParams<{ category?: string }>()
  const initialCategory = slugToCategory(categoryParam) ?? searchParams.get('category') ?? undefined
  const initialCollection = searchParams.get('collection') ?? undefined

  const { filters, toggleFilter, clearFilters, sort, setSort, result } = useFilteredProducts(
    products,
    initialCategory
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  // Apply an incoming ?collection= param (e.g. from footer/hero links) once on mount.
  useEffect(() => {
    if (initialCollection) toggleFilter('collection', initialCollection)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chips = activeFilterChips(filters)
  // Only list categories that actually have stock in the top nav — an empty
  // "Hoodies" tab that always shows zero results is a dead end, not a filter.
  const availableCategories = categories.filter(
    (cat) => cat === 'All' || products.some((p) => p.category === cat)
  )

  const removeChip = (key: string) => {
    const [group, value] = key.split(':') as [keyof typeof filters, string]
    toggleFilter(group, value)
  }

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-12 md:py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl md:text-5xl text-paper">Shop</h1>
        <p className="mt-3 text-sm text-paper/70">Clothing for those awake inside the dream.</p>
      </div>

      <div className="mt-10 flex items-center gap-2 overflow-x-auto pb-2 -mx-5 px-5 md:mx-0 md:px-0">
        {availableCategories.map((cat) => {
          const active = cat === 'All' ? filters.category.length === 0 : filters.category.includes(cat)
          return (
            <button
              key={cat}
              onClick={() => {
                if (cat === 'All') {
                  clearFilters()
                } else {
                  clearFilters()
                  toggleFilter('category', cat)
                }
              }}
              className={`shrink-0 px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${
                active ? 'bg-paper text-black border-paper' : 'border-line text-paper/70 hover:border-mist'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-between border-y border-line py-3">
        <button
          onClick={() => setDrawerOpen(true)}
          className="md:hidden sticky top-[100px] z-20 bg-black px-4 py-2.5 -ml-4 text-xs tracking-widest uppercase text-paper border border-line"
        >
          Filter &amp; Sort
        </button>
        <span className="hidden md:block text-xs text-mist">
          {result.length} {result.length === 1 ? 'piece' : 'pieces'}
        </span>

        <div className="relative">
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs tracking-widest uppercase text-paper"
          >
            Sort: {sortLabels[sort]}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-black border border-line z-20">
              {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setSort(opt)
                    setSortOpen(false)
                  }}
                  className={`block w-full text-left px-4 py-2.5 text-xs uppercase tracking-wide hover:bg-white/5 ${
                    sort === opt ? 'text-paper' : 'text-paper/60'
                  }`}
                >
                  {sortLabels[opt]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => removeChip(chip.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-line text-xs text-paper/80 hover:border-mist"
            >
              {chip.label}
              <CloseIcon className="w-3 h-3" />
            </button>
          ))}
          <button onClick={clearFilters} className="text-xs text-mist hover:text-paper underline underline-offset-4">
            Clear All
          </button>
        </div>
      )}

      <div className="mt-10 grid md:grid-cols-[220px_1fr] gap-12">
        <aside className="hidden md:block">
          <FilterPanel products={products} filters={filters} toggleFilter={toggleFilter} clearFilters={clearFilters} />
        </aside>

        <ProductGrid products={result} />
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        products={products}
        filters={filters}
        toggleFilter={toggleFilter}
        clearFilters={clearFilters}
        sort={sort}
        setSort={setSort}
        resultCount={result.length}
      />
    </div>
  )
}
