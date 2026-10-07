import type { Product } from '@/types/product'
import type { Currency } from '@/context/CurrencyContext'

// Single place that decides "which number do we actually show/charge" for a
// product — CAD is the base price, USD/EUR fall back to it if a product was
// never given its own converted price (shouldn't happen once the catalog is
// fully backfilled, but a sold-for-$0 bug is worse than a CAD number
// showing briefly under a different label).
export function getProductPrice(product: Product, currency: Currency): number {
  if (currency === 'USD') return product.priceUSD ?? product.price
  if (currency === 'EUR') return product.priceEUR ?? product.price
  return product.price
}
