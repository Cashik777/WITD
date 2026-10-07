// Single source of truth for storewide commerce policy. Shipping, returns,
// and fulfillment copy should always read from here rather than being
// restated (and risking drift) on individual pages.
import type { Currency } from '@/context/CurrencyContext'

// Flat shipping is set well above what fulfillment actually costs us per
// order — checked against real Printful rates (mostly $7-16 CAD depending
// on destination) — so that "add a bit more for free shipping" is a real
// nudge toward the threshold, not a rounding error. The EUR rate is a
// conservative estimate (Printful's EU destinations typically run a bit
// above US international) pending the same real-rate check CAD/USD got —
// revisit before volume gets large.
const SHIPPING_POLICY: Record<Currency, { shippingFlatRate: number; freeShippingThreshold: number }> = {
  CAD: { shippingFlatRate: 30, freeShippingThreshold: 150 },
  USD: { shippingFlatRate: 24, freeShippingThreshold: 120 },
  EUR: { shippingFlatRate: 28, freeShippingThreshold: 140 },
}

export const store = {
  returnWindowDays: 14,
  fulfillmentDaysMin: 3,
  fulfillmentDaysMax: 5,
  shipsTo: 'Canada, USA & Europe',
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
