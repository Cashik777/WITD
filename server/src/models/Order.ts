export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export type FulfillmentStatus =
  | 'pending'
  | 'submitted'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'failed'

export interface OrderItem {
  productId: string
  name: string
  size: string
  color: string
  quantity: number
  unitPrice: number // dollars, validated server-side at order-creation time
}

export interface ShippingAddress {
  name?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export interface Order {
  id: string
  orderNumber: string
  stripeSessionId: string
  paymentStatus: PaymentStatus
  fulfillmentStatus: FulfillmentStatus
  customer: { email?: string }
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  currency: string
  shippingAddress: ShippingAddress | null
  createdAt: string
  updatedAt: string
  fulfillmentProvider: 'printful' | 'printify' | 'mock' | null
  fulfillmentOrderId: string | null
  trackingNumber: string | null
  discordVerifiedAt: string | null
}
