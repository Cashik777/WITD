import { createContext, useEffect, useState, type ReactNode } from 'react'

interface AdminAuthValue {
  email: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
}

export const AdminAuthContext = createContext<AdminAuthValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEmail(data?.email ?? null))
      .catch(() => setEmail(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (loginEmail: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password }),
      })
      const data = await res.json()
      if (!res.ok) return data.error || 'Login failed.'
      setEmail(data.email)
      return null
    } catch {
      // A network-level failure here (not a 4xx/5xx response) would
      // otherwise leave the caller's loading state stuck forever, since
      // nothing downstream ever gets a resolved/rejected result to act on.
      return 'Could not reach the server. Please try again.'
    }
  }

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    setEmail(null)
  }

  return <AdminAuthContext.Provider value={{ email, loading, login, logout }}>{children}</AdminAuthContext.Provider>
}
