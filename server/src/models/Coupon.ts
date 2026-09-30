export interface Coupon {
  id: string
  code: string
  percentOff: number
  used: boolean
  usedByEmail: string | null
  createdAt: string
  usedAt: string | null
}
