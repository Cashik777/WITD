import { useLocale } from './useLocale'

// Category and color options come straight from admin-managed data (actual
// garment colorways, category names) and stay as-is in every language —
// there's no fixed list to translate ahead of time. The "smart" collections
// (New Drop/Bestsellers/Limited) and availability states, by contrast, are
// a fixed, known set this code defines — those get real display labels per
// language, while the underlying value used for filtering logic/URLs
// (filters.collection, p.availability) stays the original English string.
export function useFilterLabels() {
  const { t } = useLocale()
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
  }
}
