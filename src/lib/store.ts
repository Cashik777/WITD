// Single source of truth for storewide commerce policy. Shipping, returns,
// and fulfillment copy should always read from here rather than being
// restated (and risking drift) on individual pages.
import type { Currency } from '@/context/CurrencyContext'

// Flat shipping is set well above what fulfillment actually costs us per
// order — checked against real Printful rates (mostly $7-16 CAD depending
// on destination) — so that "add a bit more for free shipping" is a real
// nudge toward the threshold, not a rounding error.
const SHIPPING_POLICY: Record<Currency, { shippingFlatRate: number; freeShippingThreshold: number }> = {
  CAD: { shippingFlatRate: 30, freeShippingThreshold: 150 },
  USD: { shippingFlatRate: 24, freeShippingThreshold: 120 },
}

export const store = {
  returnWindowDays: 14,
  fulfillmentDaysMin: 3,
  fulfillmentDaysMax: 5,
  shipsTo: 'Canada & USA',
}

export function shippingPolicy(currency: Currency) {
  return SHIPPING_POLICY[currency]
}

export function calculateShipping(subtotal: number, currency: Currency = 'CAD'): number {
  if (subtotal <= 0) return 0
  const policy = SHIPPING_POLICY[currency]
  return subtotal >= policy.freeShippingThreshold ? 0 : policy.shippingFlatRate
}

export function amountToFreeShipping(subtotal: number, currency: Currency = 'CAD'): number {
  return Math.max(0, SHIPPING_POLICY[currency].freeShippingThreshold - subtotal)
}
