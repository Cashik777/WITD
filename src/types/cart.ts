import type { Currency } from '@/context/CurrencyContext'

export interface CartLine {
  productId: string
  slug: string
  name: string
  image: string
  price: number
  currency: Currency
  size: string
  color: string
  quantity: number
  sku: string
}

export interface CartState {
  lines: CartLine[]
}
