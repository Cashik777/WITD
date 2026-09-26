import type { Product, ProductFilters } from '@/types/product'
import { filterOptions, availabilityLabels, countByOption, categoryOptions } from '@/lib/filters'

interface FilterPanelProps {
  products: Product[]
  filters: ProductFilters
  toggleFilter: (group: keyof ProductFilters, value: string) => void
  clearFilters: () => void
}

function CheckboxGroup({
  title,
  options,
  selected,
  counts,
  onToggle,
  labels,
}: {
  title: string
  options: readonly string[]
  selected: string[]
  counts: Record<string, number>
  onToggle: (value: string) => void
  labels?: Record<string, string>
}) {
  return (
    <div className="py-5 border-b border-line">
      <h3 className="text-xs tracking-widest uppercase text-paper mb-3.5">{title}</h3>
      <div className="space-y-2.5">
        {options.map((opt) => {
          const count = counts[opt] ?? 0
          const disabled = count === 0 && !selected.includes(opt)
          return (
            <label
              key={opt}
              className={`flex items-center gap-2.5 group ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                disabled={disabled}
                onChange={() => onToggle(opt)}
                className="w-4 h-4 accent-paper bg-transparent border border-mist"
              />
              <span className="text-sm text-paper/80 group-hover:text-paper transition-colors flex-1">
                {labels?.[opt] ?? opt}
              </span>
              <span className="text-xs text-mist">{count}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export function FilterPanel({ products, filters, toggleFilter, clearFilters }: FilterPanelProps) {
  const hasActive =
    filters.category.length + filters.size.length + filters.color.length + filters.collection.length + filters.availability.length > 0

  return (
    <div>
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-xs tracking-widest uppercase text-paper">Filter</h2>
        {hasActive && (
          <button onClick={clearFilters} className="text-xs text-mist hover:text-paper underline underline-offset-4">
            Clear All
          </button>
        )}
      </div>

      <CheckboxGroup
        title="Category"
        options={categoryOptions(products)}
        selected={filters.category}
        counts={countByOption(products, filters, 'category')}
        onToggle={(v) => toggleFilter('category', v)}
      />
      <CheckboxGroup
        title="Size"
        options={filterOptions.size}
        selected={filters.size}
        counts={countByOption(products, filters, 'size')}
        onToggle={(v) => toggleFilter('size', v)}
      />
      <CheckboxGroup
        title="Color"
        options={filterOptions.color}
        selected={filters.color}
        counts={countByOption(products, filters, 'color')}
        onToggle={(v) => toggleFilter('color', v)}
      />
      <CheckboxGroup
        title="Collection"
        options={filterOptions.collection}
        selected={filters.collection}
        counts={countByOption(products, filters, 'collection')}
        onToggle={(v) => toggleFilter('collection', v)}
      />
      <CheckboxGroup
        title="Availability"
        options={filterOptions.availability}
        selected={filters.availability}
        counts={countByOption(products, filters, 'availability')}
        onToggle={(v) => toggleFilter('availability', v)}
        labels={availabilityLabels}
      />
    </div>
  )
}
