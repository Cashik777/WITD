import type { FulfillmentProvider, FulfillmentOrderResult, FulfillmentTracking } from './FulfillmentProvider.js'
import type { Order } from '../../models/Order.js'

const API_BASE = 'https://api.printify.com/v1'

// Structural twin of PrintfulProvider — same interface, same "throw until
// real credentials + variant mappings exist" guard. Kept deliberately
// unexpanded (per the brief: no unnecessary API surface) until Printify is
// actually the provider in use for a given product.
export class PrintifyProvider implements FulfillmentProvider {
  name = 'printify' as const
  private apiKey: string
  private shopId: string

  constructor(apiKey: string, shopId: string) {
    this.apiKey = apiKey
    this.shopId = shopId
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  async createOrder(order: Order): Promise<FulfillmentOrderResult> {
    if (!this.apiKey) {
      throw new Error('Printify is not fully configured — missing API credentials or variant mappings.')
    }

    const res = await fetch(`${API_BASE}/shops/${this.shopId}/orders.json`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        external_id: order.id,
        line_items: order.items.map((item) => ({
          // PLACEHOLDER — replace with real Printify variant/product ids
          // from providerVariantMappings once the catalog is connected.
          variant_id: 'PLACEHOLDER',
          quantity: item.quantity,
        })),
        address_to: order.shippingAddress,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Printify order creation failed (${res.status}): ${body}`)
    }

    const data = (await res.json()) as { id: string }
    return { fulfillmentOrderId: data.id, status: 'submitted' }
  }

  async getOrder(fulfillmentOrderId: string): Promise<FulfillmentTracking> {
    const res = await fetch(`${API_BASE}/shops/${this.shopId}/orders/${fulfillmentOrderId}.json`, {
      headers: this.headers(),
    })
    if (!res.ok) throw new Error(`Printify getOrder failed (${res.status})`)
    const data = (await res.json()) as { status: string; shipments?: { carrier: string; number: string }[] }
    const shipment = data.shipments?.[0]
    return { status: data.status, trackingNumber: shipment?.number ?? null, trackingUrl: null }
  }

  async cancelOrder(fulfillmentOrderId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/shops/${this.shopId}/orders/${fulfillmentOrderId}/cancel.json`, {
      method: 'POST',
      headers: this.headers(),
    })
    if (!res.ok) throw new Error(`Printify cancelOrder failed (${res.status})`)
  }

  async getTracking(fulfillmentOrderId: string): Promise<FulfillmentTracking> {
    return this.getOrder(fulfillmentOrderId)
  }
}
