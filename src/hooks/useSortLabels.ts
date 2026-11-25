import type { SortOption } from '@/types/product'
import { useLocale } from './useLocale'

export function useSortLabels(): Record<SortOption, string> {
  const { t } = useLocale()
  return {
    featured: t('sort.featured'),
    newest: t('sort.newest'),
    'price-asc': t('sort.priceAsc'),
    'price-desc': t('sort.priceDesc'),
  }
}
