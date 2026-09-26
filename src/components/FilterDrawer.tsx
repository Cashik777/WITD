import type { Product, ProductFilters, SortOption } from '@/types/product'
import { FilterPanel } from './FilterPanel'
import { CloseIcon } from './icons'

const sortLabels: Record<SortOption, string> = {
  featured: 'Featured',
  newest: 'Newest',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
}

interface FilterDrawerProps {
  open: boolean
  onClose: () => void
  products: Product[]
  filters: ProductFilters
  toggleFilter: (group: keyof ProductFilters, value: string) => void
  clearFilters: () => void
  sort: SortOption
  setSort: (s: SortOption) => void
  resultCount: number
}

export function FilterDrawer({
  open,
  onClose,
  products,
  filters,
  toggleFilter,
  clearFilters,
  sort,
  setSort,
  resultCount,
}: FilterDrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm bg-black border-l border-line flex flex-col">
        <div className="flex items-center justify-between px-5 h-16 border-b border-line shrink-0">
          <h2 className="text-xs tracking-widest uppercase text-paper">Filter &amp; Sort</h2>
          <button onClick={onClose} aria-label="Close" className="text-paper">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          <div className="py-5 border-b border-line">
            <h3 className="text-xs tracking-widest uppercase text-paper mb-3.5">Sort</h3>
            <div className="space-y-2.5">
              {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
                <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="mobile-sort"
                    checked={sort === opt}
                    onChange={() => setSort(opt)}
                    className="w-4 h-4 accent-paper"
                  />
                  <span className="text-sm text-paper/80">{sortLabels[opt]}</span>
                </label>
              ))}
            </div>
          </div>
          <FilterPanel products={products} filters={filters} toggleFilter={toggleFilter} clearFilters={clearFilters} />
        </div>

        <div className="shrink-0 p-5 border-t border-line">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-paper text-black text-xs tracking-widest uppercase"
          >
            Show {resultCount} {resultCount === 1 ? 'Result' : 'Results'}
          </button>
        </div>
      </div>
    </div>
  )
}
