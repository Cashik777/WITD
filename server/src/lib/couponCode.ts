import { randomBytes } from 'crypto'

// Same alphabet/shape as generateOrderNumber() in orderNumber.ts — short,
// human-typeable, excludes visually ambiguous characters (0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateCouponCode(): string {
  const bytes = randomBytes(6)
  let code = ''
  for (const byte of bytes) {
    code += ALPHABET[byte % ALPHABET.length]
  }
  return `WITD-${code}`
}
