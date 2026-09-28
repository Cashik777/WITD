import { createHash, randomInt, timingSafeEqual } from 'crypto'

const CODE_TTL_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5
const RESEND_COOLDOWN_MS = 30 * 1000

export function generateCode(): string {
  return String(randomInt(100000, 1000000))
}

export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export function codeExpiresAt(): string {
  return new Date(Date.now() + CODE_TTL_MS).toISOString()
}

export function isExpired(expiresAt: string): boolean {
  return Date.now() > new Date(expiresAt).getTime()
}

export function isWithinResendCooldown(expiresAt: string): boolean {
  const sentAt = new Date(expiresAt).getTime() - CODE_TTL_MS
  return Date.now() - sentAt < RESEND_COOLDOWN_MS
}

export function hasAttemptsRemaining(attempts: number): boolean {
  return attempts < MAX_ATTEMPTS
}

export function codeMatches(code: string, codeHash: string): boolean {
  const a = Buffer.from(hashCode(code))
  const b = Buffer.from(codeHash)
  return a.length === b.length && timingSafeEqual(a, b)
}
