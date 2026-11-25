import type { Product } from '@/types/product'
import type { Locale } from './locale'

// The print on the garment itself is always English — that's fixed, it's
// ink on fabric. The storefront's own description/idea copy about it can
// still be translated; this resolves which version to show, falling back
// to the English original wherever a language or a specific field hasn't
// been translated yet.
export function localizedProductText(product: Product, locale: Locale) {
  const tr = locale !== 'en' ? product.translations?.[locale] : undefined
  return {
    description: tr?.description || product.description,
    idea: tr?.idea || product.idea,
  }
}
