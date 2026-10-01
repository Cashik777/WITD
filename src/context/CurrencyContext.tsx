import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Currency = 'CAD' | 'USD'

const STORAGE_KEY = 'witd:currency'

interface CurrencyContextValue {
  currency: Currency
  // False until geo-detection (or a saved manual choice) has resolved —
  // lets callers avoid a CAD->USD flash on first paint if they care to.
  ready: boolean
  setCurrency: (currency: Currency) => void
  // The switcher gets disabled while the cart has items, to avoid ending up
  // with cart lines priced in two different currencies at once — see the
  // comment in CartContext.tsx. This just tracks whether *something* has
  // locked the switcher; CartContext is the one that actually sets it.
  locked: boolean
  setLocked: (locked: boolean) => void
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('CAD')
  const [ready, setReady] = useState(false)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'CAD' || saved === 'USD') {
      setCurrencyState(saved)
      setReady(true)
      return
    }
    fetch('/api/geo')
      .then((res) => res.json())
      .then((data: { currency?: string }) => {
        if (data.currency === 'USD') setCurrencyState('USD')
      })
      .catch(() => {
        /* geo lookup failing just means we stay on the CAD default */
      })
      .finally(() => setReady(true))
  }, [])

  const setCurrency = (next: Currency) => {
    setCurrencyState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  return (
    <CurrencyContext.Provider value={{ currency, ready, setCurrency, locked, setLocked }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider')
  return ctx
}
