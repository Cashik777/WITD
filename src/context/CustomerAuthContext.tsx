import { createContext, useEffect, useState, type ReactNode } from 'react'

export interface CustomerProfile {
  firstName: string | null
  lastName: string | null
  age: number | null
}

const emptyProfile: CustomerProfile = { firstName: null, lastName: null, age: null }

interface CustomerAuthValue {
  email: string | null
  profile: CustomerProfile
  loading: boolean
  // Set once a register (or an unverified login) triggers a code email —
  // the UI switches to the "enter your code" step while this is set.
  pendingVerificationEmail: string | null
  register: (email: string, password: string) => Promise<string | null>
  // Resolves to 'ok' once actually logged in, 'pending' if it instead
  // triggered a verification code (check pendingVerificationEmail), or an
  // error string.
  login: (email: string, password: string) => Promise<'ok' | 'pending' | string>
  verifyEmail: (code: string) => Promise<string | null>
  resendCode: () => Promise<string | null>
  cancelVerification: () => void
  updateProfile: (profile: CustomerProfile) => Promise<string | null>
  logout: () => Promise<void>
}

export const CustomerAuthContext = createContext<CustomerAuthValue | null>(null)

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<CustomerProfile>(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null)

  const applyAccountData = (data: any) => {
    setEmail(data.email)
    setProfile({ firstName: data.firstName ?? null, lastName: data.lastName ?? null, age: data.age ?? null })
  }

  useEffect(() => {
    fetch('/api/account/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) applyAccountData(data)
      })
      .catch(() => setEmail(null))
      .finally(() => setLoading(false))
  }, [])

  const submit = async (path: string, body: Record<string, string>, method = 'POST'): Promise<{ data: any; ok: boolean }> => {
    const res = await fetch(path, {
      method,
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

  const login = async (email: string, password: string): Promise<'ok' | 'pending' | string> => {
    try {
      const { data, ok } = await submit('/api/account/login', { email, password })
      if (!ok) {
        if (data.verificationRequired) {
          setPendingVerificationEmail(email)
          return 'pending'
        }
        return data.error || 'Something went wrong.'
      }
      applyAccountData(data)
      return 'ok'
    } catch {
      return 'Could not reach the server. Please try again.'
    }
  }

  const verifyEmail = async (code: string): Promise<string | null> => {
    if (!pendingVerificationEmail) return 'Nothing to verify.'
    try {
      const { data, ok } = await submit('/api/account/verify-email', { email: pendingVerificationEmail, code })
      if (!ok) return data.error || 'Something went wrong.'
      applyAccountData(data)
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

  const updateProfile = async (next: CustomerProfile): Promise<string | null> => {
    try {
      const { data, ok } = await submit(
        '/api/account/profile',
        { firstName: next.firstName ?? '', lastName: next.lastName ?? '', age: next.age?.toString() ?? '' },
        'PATCH'
      )
      if (!ok) return data.error || 'Something went wrong.'
      applyAccountData(data)
      return null
    } catch {
      return 'Could not reach the server. Please try again.'
    }
  }

  const logout = async () => {
    await fetch('/api/account/logout', { method: 'POST', credentials: 'include' })
    setEmail(null)
    setProfile(emptyProfile)
  }

  return (
    <CustomerAuthContext.Provider
      value={{ email, profile, loading, pendingVerificationEmail, register, login, verifyEmail, resendCode, cancelVerification, updateProfile, logout }}
    >
      {children}
    </CustomerAuthContext.Provider>
  )
}
