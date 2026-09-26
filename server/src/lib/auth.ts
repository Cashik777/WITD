import bcrypt from 'bcryptjs'
import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set.')
  return secret
}

export const isAuthConfigured = Boolean(process.env.SESSION_SECRET)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signSession(userId: string): string {
  const expires = Date.now() + SESSION_TTL_MS
  const payload = `${userId}.${expires}`
  const sig = createHmac('sha256', sessionSecret()).update(payload).digest('hex')
  return Buffer.from(`${payload}.${sig}`).toString('base64url')
}

export function verifySession(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const [userId, expiresStr, sig] = decoded.split('.')
    if (!userId || !expiresStr || !sig) return null
    if (Date.now() > Number(expiresStr)) return null
    const expected = createHmac('sha256', sessionSecret()).update(`${userId}.${expiresStr}`).digest('hex')
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    return userId
  } catch {
    return null
  }
}
