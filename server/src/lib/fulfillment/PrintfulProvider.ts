import type { FulfillmentProvider, FulfillmentOrderResult, FulfillmentTracking } from './FulfillmentProvider.js'
import type { Order } from '../../models/Order.js'

const API_BASE = 'https://api.printful.com'

// Real Printful integration, gated entirely behind PRINTFUL_API_KEY /
// PRINTFUL_STORE_ID. With no key set, this provider is simply never
// selected (see index.ts in this folder) — MockProvider is used instead.
export class PrintfulProvider implements FulfillmentProvider {
  name = 'printful' as const
  private apiKey: string
  private storeId: string

  constructor(apiKey: string, storeId: string) {
    this.apiKey = apiKey
    this.storeId = storeId
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'X-PF-Store-Id': this.storeId,
      'Content-Type': 'application/json',
    }
  }

  async createOrder(order: Order): Promise<FulfillmentOrderResult> {
    // Real product/variant mapping (product.providerVariantMappings) must be
    // filled in before this call will work — see src/data/products.ts. Until
    // then this intentionally throws rather than silently submitting a
    // malformed order to a live Printful account.
    const missingMappings = order.items.some((item) => !item.productId)
    if (missingMappings || !this.apiKey) {
      throw new Error('Printful is not fully configured — missing API credentials or variant mappings.')
    }

    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        external_id: order.id,
        recipient: order.shippingAddress,
        items: order.items.map((item) => ({
          // `variant_id` below is a PLACEHOLDER — replace with the real
          // Printful variant id from providerVariantMappings once the
          // catalog is connected.
          variant_id: 'PLACEHOLDER',
          quantity: item.quantity,
        })),
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Printful order creation failed (${res.status}): ${body}`)
    }

    const data = (await res.json()) as { result: { id: number } }
    return { fulfillmentOrderId: String(data.result.id), status: 'submitted' }
  }

  async getOrder(fulfillmentOrderId: string): Promise<FulfillmentTracking> {
    const res = await fetch(`${API_BASE}/orders/${fulfillmentOrderId}`, { headers: this.headers() })
    if (!res.ok) throw new Error(`Printful getOrder failed (${res.status})`)
    const data = (await res.json()) as { result: { status: string; shipments?: { tracking_number: string; tracking_url: string }[] } }
    const shipment = data.result.shipments?.[0]
    return {
      status: data.result.status,
      trackingNumber: shipment?.tracking_number ?? null,
      trackingUrl: shipment?.tracking_url ?? null,
    }
  }

  async cancelOrder(fulfillmentOrderId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/orders/${fulfillmentOrderId}`, {
      method: 'DELETE',
      headers: this.headers(),
    })
    if (!res.ok) throw new Error(`Printful cancelOrder failed (${res.status})`)
  }

  async getTracking(fulfillmentOrderId: string): Promise<FulfillmentTracking> {
    return this.getOrder(fulfillmentOrderId)
  }
}
