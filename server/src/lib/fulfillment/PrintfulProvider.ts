import type { FulfillmentProvider, FulfillmentOrderResult, FulfillmentTracking } from './FulfillmentProvider.js'
import type { Order } from '../../models/Order.js'
import { productRepository } from '../../data/productsDb.js'
import { variantKey } from '../../models/Product.js'

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
    if (!this.apiKey) {
      throw new Error('Printful is not fully configured — missing API credentials.')
    }

    // sync_variant_id (not the generic catalog variant_id) — these come from
    // OUR store's synced products in Printful, which is where the actual
    // WITD print designs live. Looked up per line item via
    // product.providerVariantMappings, keyed by "<color>-<size>" (see
    // variantKey in models/Product.ts). Missing a mapping throws rather than
    // silently submitting a malformed/wrong-design order to a live account.
    const items = await Promise.all(
      order.items.map(async (item) => {
        const product = await productRepository.findById(item.productId)
        const syncVariantId = product?.providerVariantMappings[variantKey(item.color, item.size)]
        if (!syncVariantId) {
          throw new Error(
            `No Printful variant mapping for "${item.name}" (${item.color}/${item.size}) — set it in the admin panel before this order can be fulfilled.`
          )
        }
        return { sync_variant_id: Number(syncVariantId), quantity: item.quantity }
      })
    )

    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        external_id: order.id,
        recipient: order.shippingAddress,
        items,
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
