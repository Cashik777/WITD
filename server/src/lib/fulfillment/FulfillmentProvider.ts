import type { Order } from '../../models/Order.js'

export interface FulfillmentOrderResult {
  fulfillmentOrderId: string
  status: 'submitted' | 'failed'
}

export interface FulfillmentTracking {
  status: string
  trackingNumber: string | null
  trackingUrl: string | null
}

// Every provider (Printful, Printify, or a future one) implements this same
// shape. Routes and the webhook handler only ever talk to this interface —
// never to a provider's SDK/API directly — so adding or switching providers
// never requires touching order/checkout logic.
export interface FulfillmentProvider {
  name: 'printful' | 'printify' | 'mock'
  createOrder(order: Order): Promise<FulfillmentOrderResult>
  getOrder(fulfillmentOrderId: string): Promise<FulfillmentTracking>
  cancelOrder(fulfillmentOrderId: string): Promise<void>
  getTracking(fulfillmentOrderId: string): Promise<FulfillmentTracking>
}
