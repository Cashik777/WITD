export interface Customer {
  id: string
  email: string
  passwordHash: string
  emailVerified: boolean
  // Entirely optional — collected from the account page after registration,
  // never required at signup. Lets us understand the customer base (e.g.
  // age distribution) without adding friction to an already-optional flow.
  firstName: string | null
  lastName: string | null
  age: number | null
  createdAt: string
}

export interface CustomerProfile {
  firstName: string | null
  lastName: string | null
  age: number | null
}

// A pending 6-digit code sent to a customer's email at registration (or
// re-sent at an unverified login attempt). Stored hashed, never in plaintext.
export interface EmailVerification {
  codeHash: string
  expiresAt: string
  attempts: number
}
