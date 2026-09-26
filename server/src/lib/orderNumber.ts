import { randomBytes } from 'crypto'

// Short, human-typeable order number shown to the customer (order
// confirmation, purchase-verification form) — separate from the internal
// UUID `id`, which is never customer-facing. Excludes visually ambiguous
// characters (0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateOrderNumber(): string {
  const bytes = randomBytes(6)
  let code = ''
  for (const byte of bytes) {
    code += ALPHABET[byte % ALPHABET.length]
  }
  return `WITD-${code}`
}
