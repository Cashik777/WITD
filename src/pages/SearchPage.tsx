import { useSearchParams } from 'react-router-dom'
import { useProducts } from '@/hooks/useProducts'
import { searchProducts } from '@/lib/search'
import { SearchBar } from '@/components/SearchBar'
import { ProductGrid } from '@/components/ProductGrid'
import { useLocale } from '@/hooks/useLocale'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export default function SearchPage() {
  const { products } = useProducts()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const results = searchProducts(products, query)
  const { t } = useLocale()
  useDocumentMeta(query ? t('meta.searchTitleWithQuery', { query }) : t('meta.searchTitle'))

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-12 md:py-16">
      <div className="max-w-xl">
        <SearchBar initialQuery={query} autoFocus />
      </div>

      <div className="mt-12">
        {!query ? (
          <p className="text-sm text-mist">{t('search.hint')}</p>
        ) : results.length === 0 ? (
          <div className="py-16">
            <p className="text-paper text-lg font-display">{t('search.noResults', { query })}</p>
            <p className="mt-2 text-sm text-mist">{t('search.tryDifferent')}</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-mist mb-8">
              {t(results.length === 1 ? 'search.resultCount' : 'search.resultCount_plural', {
                count: results.length,
                query,
              })}
            </p>
            <ProductGrid products={results} />
          </>
        )}
      </div>
    </div>
  )
}
