export interface Customer {
  id: string
  email: string
  passwordHash: string
  emailVerified: boolean
  createdAt: string
}

// A pending 6-digit code sent to a customer's email at registration (or
// re-sent at an unverified login attempt). Stored hashed, never in plaintext.
export interface EmailVerification {
  codeHash: string
  expiresAt: string
  attempts: number
}
