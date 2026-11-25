import type { Product } from '@/types/product'
import type { Locale } from './locale'

// Matches against the English catalog fields (name/category/collection/tags)
// plus, when browsing a translated locale, that locale's translated
// name/description/idea — so a French shopper typing "loup" finds "Un Loup
// Déguisé en Mouton" even though the underlying catalog data (and the URL/
// filter values) stay English. Category/collection stay untranslated here
// since matching is forgiving substring search, not exact filtering.
export function searchProducts(products: Product[], query: string, locale: Locale = 'en'): Product[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return products.filter((p) => {
    const translated = locale !== 'en' ? p.translations?.[locale] : undefined
    const haystack = [
      p.name,
      p.category,
      p.collection,
      ...p.tags,
      translated?.name,
      translated?.description,
      translated?.idea,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}
