export interface CartLine {
  productId: string
  slug: string
  name: string
  image: string
  price: number
  currency: string
  size: string
  color: string
  quantity: number
  sku: string
}

export interface CartState {
  lines: CartLine[]
}
