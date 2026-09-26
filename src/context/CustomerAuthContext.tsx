import { createContext, useEffect, useState, type ReactNode } from 'react'

interface CustomerAuthValue {
  email: string | null
  loading: boolean
  register: (email: string, password: string) => Promise<string | null>
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
}

export const CustomerAuthContext = createContext<CustomerAuthValue | null>(null)

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/account/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEmail(data?.email ?? null))
      .catch(() => setEmail(null))
      .finally(() => setLoading(false))
  }, [])

  const submit = async (path: string, email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return data.error || 'Something went wrong.'
      setEmail(data.email)
      return null
    } catch {
      return 'Could not reach the server. Please try again.'
    }
  }

  const register = (email: string, password: string) => submit('/api/account/register', email, password)
  const login = (email: string, password: string) => submit('/api/account/login', email, password)

  const logout = async () => {
    await fetch('/api/account/logout', { method: 'POST', credentials: 'include' })
    setEmail(null)
  }

  return (
    <CustomerAuthContext.Provider value={{ email, loading, register, login, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  )
}
