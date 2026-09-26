// ---------------------------------------------------------------------------
// SERVER-SIDE PRODUCT CATALOG (source of truth for price/variant validation)
//
// This intentionally mirrors src/data/products.ts on the frontend. The
// server NEVER trusts a price, product id, or variant sent by the browser —
// every checkout request is re-validated against this list instead.
//
// KNOWN SIMPLIFICATION: right now this is a second hand-maintained copy of
// the catalog. Before going live, replace both this file and the frontend's
// with reads from one real source (a database, or a shared package/workspace
// imported by both apps) so the two can never drift out of sync.
// ---------------------------------------------------------------------------

export interface ServerProduct {
  id: string
  name: string
  price: number // in major currency units, e.g. dollars — converted to cents at Stripe call time
  currency: 'cad' | 'usd'
  availableSizes: string[]
  colors: string[]
  fulfillmentProvider: 'printful' | 'printify' | 'mock'
  providerProductId: string | null
  providerVariantMappings: Record<string, string>
}

export const products: ServerProduct[] = [
  { id: 'witd-001', name: 'God Is My Friend Tee', price: 45, currency: 'cad', availableSizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'White'], fulfillmentProvider: 'printful', providerProductId: null, providerVariantMappings: {} },
  { id: 'witd-002', name: 'WITD Observer Tee', price: 48, currency: 'cad', availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['Black', 'Dark Stone'], fulfillmentProvider: 'printful', providerProductId: null, providerVariantMappings: {} },
  { id: 'witd-003', name: 'Wake In The Dream Tee', price: 45, currency: 'cad', availableSizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Black', 'White', 'Off-White'], fulfillmentProvider: 'printful', providerProductId: null, providerVariantMappings: {} },
  { id: 'witd-004', name: 'Snake Catcher Tee', price: 48, currency: 'cad', availableSizes: ['S', 'M', 'L'], colors: ['Black'], fulfillmentProvider: 'printful', providerProductId: null, providerVariantMappings: {} },
  { id: 'witd-005', name: 'Fool Me If You Can Tee', price: 45, currency: 'cad', availableSizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['White', 'Black'], fulfillmentProvider: 'printify', providerProductId: null, providerVariantMappings: {} },
  { id: 'witd-006', name: 'WITD Symbol Tee', price: 48, currency: 'cad', availableSizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Black', 'White'], fulfillmentProvider: 'printful', providerProductId: null, providerVariantMappings: {} },
  { id: 'witd-007', name: 'Where Are We Running? Tee', price: 45, currency: 'cad', availableSizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Dark Stone'], fulfillmentProvider: 'printify', providerProductId: null, providerVariantMappings: {} },
  { id: 'witd-008', name: 'Security / Forgiveness Tee', price: 45, currency: 'cad', availableSizes: [], colors: ['White', 'Off-White'], fulfillmentProvider: 'printify', providerProductId: null, providerVariantMappings: {} },
]

export const getServerProduct = (id: string) => products.find((p) => p.id === id)
