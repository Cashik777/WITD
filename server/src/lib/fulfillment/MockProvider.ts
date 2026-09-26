import type { FulfillmentProvider, FulfillmentOrderResult, FulfillmentTracking } from './FulfillmentProvider.js'
import type { Order } from '../../models/Order.js'

// Used automatically whenever no real provider credentials are configured,
// so the full paid -> fulfillment flow can be exercised end-to-end (and
// tested) without ever calling a real Printful/Printify account.
export class MockProvider implements FulfillmentProvider {
  name = 'mock' as const

  async createOrder(order: Order): Promise<FulfillmentOrderResult> {
    console.log(`[MockProvider] would submit order ${order.id} for production`, {
      items: order.items.map((i) => `${i.quantity}x ${i.name} (${i.color}/${i.size})`),
    })
    return { fulfillmentOrderId: `mock_${order.id}`, status: 'submitted' }
  }

  async getOrder(_fulfillmentOrderId: string): Promise<FulfillmentTracking> {
    return { status: 'in_production', trackingNumber: null, trackingUrl: null }
  }

  async cancelOrder(fulfillmentOrderId: string): Promise<void> {
    console.log(`[MockProvider] would cancel ${fulfillmentOrderId}`)
  }

  async getTracking(_fulfillmentOrderId: string): Promise<FulfillmentTracking> {
    return { status: 'in_production', trackingNumber: null, trackingUrl: null }
  }
}
