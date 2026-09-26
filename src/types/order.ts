// Mirrors the shape used by the server. Kept here so the frontend can type
// the (future) order-status view without importing server code.
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type FulfillmentStatus =
  | 'pending'
  | 'submitted'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'failed'

export interface OrderSummary {
  id: string
  paymentStatus: PaymentStatus
  fulfillmentStatus: FulfillmentStatus
  total: number
  currency: string
  createdAt: string
}
