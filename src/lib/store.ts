// Single source of truth for storewide commerce policy. Shipping, returns,
// and fulfillment copy should always read from here rather than being
// restated (and risking drift) on individual pages.

export const store = {
  currency: 'CAD' as const,
  shippingFlatRate: 12,
  freeShippingThreshold: 150,
  returnWindowDays: 14,
  fulfillmentDaysMin: 3,
  fulfillmentDaysMax: 5,
  shipsTo: 'Canada & USA',
}

export function calculateShipping(subtotal: number): number {
  if (subtotal <= 0) return 0
  return subtotal >= store.freeShippingThreshold ? 0 : store.shippingFlatRate
}

export function amountToFreeShipping(subtotal: number): number {
  return Math.max(0, store.freeShippingThreshold - subtotal)
}
