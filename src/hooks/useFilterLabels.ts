import { useLocale } from './useLocale'
import { translateColor } from '@/lib/colorLabels'

// The "smart" collections (New Drop/Bestsellers/Limited), availability
// states, and the catalog's category names are each a fixed, known set this
// code defines — those get real display labels per language. Garment
// colorways are a bigger, admin-managed list but still finite in practice
// (see colorLabels.ts), translated the same way. The underlying value used
// for filtering logic/URLs (filters.collection, p.availability, p.category,
// p.colors) always stays the original English string — only what's
// rendered changes.
export function useFilterLabels() {
  const { t, locale } = useLocale()
  return {
    collectionLabels: {
      'New Drop': t('filters.collectionNewDrop'),
      Bestsellers: t('filters.collectionBestsellers'),
      Limited: t('filters.collectionLimited'),
    } as Record<string, string>,
    availabilityLabels: {
      in_stock: t('filters.availabilityInStock'),
      low_stock: t('filters.availabilityLowStock'),
      sold_out: t('filters.availabilitySoldOut'),
      coming_soon: t('filters.availabilityComingSoon'),
    } as Record<string, string>,
    categoryLabels: {
      'T-Shirts': t('filters.categoryTShirts'),
      Hoodies: t('filters.categoryHoodies'),
      Sweatpants: t('filters.categorySweatpants'),
      Accessories: t('filters.categoryAccessories'),
    } as Record<string, string>,
    colorLabel: (color: string) => translateColor(color, locale),
  }
}

// Standalone version for places that only need the category label and
// don't already pull in the rest of useFilterLabels (product breadcrumb,
// the Shop page's category ribbon).
export function useCategoryLabel() {
  const { t } = useLocale()
  const labels: Record<string, string> = {
    'T-Shirts': t('filters.categoryTShirts'),
    Hoodies: t('filters.categoryHoodies'),
    Sweatpants: t('filters.categorySweatpants'),
    Accessories: t('filters.categoryAccessories'),
  }
  return (category: string) => labels[category] ?? category
}
