import { createContext, useEffect, useState, type ReactNode } from 'react'

interface CustomerAuthValue {
  email: string | null
  loading: boolean
  // Set once a register (or an unverified login) triggers a code email —
  // the UI switches to the "enter your code" step while this is set.
  pendingVerificationEmail: string | null
  register: (email: string, password: string) => Promise<string | null>
  login: (email: string, password: string) => Promise<string | null>
  verifyEmail: (code: string) => Promise<string | null>
  resendCode: () => Promise<string | null>
  cancelVerification: () => void
  logout: () => Promise<void>
}

export const CustomerAuthContext = createContext<CustomerAuthValue | null>(null)

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/account/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEmail(data?.email ?? null))
      .catch(() => setEmail(null))
      .finally(() => setLoading(false))
  }, [])

  const submit = async (path: string, body: Record<string, string>): Promise<{ data: any; ok: boolean }> => {
    const res = await fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return { data, ok: res.ok }
  }

  const register = async (email: string, password: string): Promise<string | null> => {
    try {
      const { data, ok } = await submit('/api/account/register', { email, password })
      if (!ok) return data.error || 'Something went wrong.'
      setPendingVerificationEmail(data.email)
      return null
    } catch {
      return 'Could not reach the server. Please try again.'
    }
  }

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const { data, ok } = await submit('/api/account/login', { email, password })
      if (!ok) {
        if (data.verificationRequired) {
          setPendingVerificationEmail(email)
          return null
        }
        return data.error || 'Something went wrong.'
      }
      setEmail(data.email)
      return null
    } catch {
      return 'Could not reach the server. Please try again.'
    }
  }

  const verifyEmail = async (code: string): Promise<string | null> => {
    if (!pendingVerificationEmail) return 'Nothing to verify.'
    try {
      const { data, ok } = await submit('/api/account/verify-email', { email: pendingVerificationEmail, code })
      if (!ok) return data.error || 'Something went wrong.'
      setEmail(data.email)
      setPendingVerificationEmail(null)
      return null
    } catch {
      return 'Could not reach the server. Please try again.'
    }
  }

  const resendCode = async (): Promise<string | null> => {
    if (!pendingVerificationEmail) return 'Nothing to resend.'
    try {
      const { data, ok } = await submit('/api/account/resend-code', { email: pendingVerificationEmail })
      if (!ok) return data.error || 'Something went wrong.'
      return null
    } catch {
      return 'Could not reach the server. Please try again.'
    }
  }

  const cancelVerification = () => setPendingVerificationEmail(null)

  const logout = async () => {
    await fetch('/api/account/logout', { method: 'POST', credentials: 'include' })
    setEmail(null)
  }

  return (
    <CustomerAuthContext.Provider
      value={{ email, loading, pendingVerificationEmail, register, login, verifyEmail, resendCode, cancelVerification, logout }}
    >
      {children}
    </CustomerAuthContext.Provider>
  )
}
