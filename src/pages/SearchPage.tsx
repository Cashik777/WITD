import { useSearchParams } from 'react-router-dom'
import { useProducts } from '@/hooks/useProducts'
import { searchProducts } from '@/lib/search'
import { SearchBar } from '@/components/SearchBar'
import { ProductGrid } from '@/components/ProductGrid'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export default function SearchPage() {
  const { products } = useProducts()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const results = searchProducts(products, query)
  useDocumentMeta(query ? `"${query}" — Search — WITD` : 'Search — WITD')

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-12 md:py-16">
      <div className="max-w-xl">
        <SearchBar initialQuery={query} autoFocus />
      </div>

      <div className="mt-12">
        {!query ? (
          <p className="text-sm text-mist">Search by product name, category, collection, or tag.</p>
        ) : results.length === 0 ? (
          <div className="py-16">
            <p className="text-paper text-lg font-display">No results for &ldquo;{query}&rdquo;.</p>
            <p className="mt-2 text-sm text-mist">Try a different search, or browse the full shop.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-mist mb-8">
              {results.length} result{results.length === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
            </p>
            <ProductGrid products={results} />
          </>
        )}
      </div>
    </div>
  )
}
