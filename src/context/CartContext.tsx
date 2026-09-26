import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartLine } from '@/types/cart'
import type { Product } from '@/types/product'

const STORAGE_KEY = 'witd:cart'

interface CartContextValue {
  lines: CartLine[]
  isOpen: boolean
  lastAdded: CartLine | null
  openCart: () => void
  closeCart: () => void
  addItem: (product: Product, size: string, color: string, quantity?: number) => void
  removeItem: (productId: string, size: string, color: string) => void
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void
  clearCart: () => void
  subtotal: number
  itemCount: number
}

export const CartContext = createContext<CartContextValue | null>(null)

function loadInitial(): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartLine[]) : []
  } catch {
    // Cart persistence is a convenience only — corrupt/blocked storage should
    // never crash the storefront, just start from an empty cart.
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadInitial)
  const [isOpen, setIsOpen] = useState(false)
  const [lastAdded, setLastAdded] = useState<CartLine | null>(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* ignore — see note in loadInitial */
    }
  }, [lines])

  const addItem = useCallback((product: Product, size: string, color: string, quantity = 1) => {
    const addedLine: CartLine = {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.imagesByColor[color]?.[0] ?? product.images[0],
      price: product.price,
      currency: product.currency,
      size,
      color,
      quantity,
      sku: product.sku,
    }
    setLines((prev) => {
      const existing = prev.find(
        (l) => l.productId === product.id && l.size === size && l.color === color
      )
      if (existing) {
        return prev.map((l) =>
          l === existing ? { ...l, quantity: l.quantity + quantity } : l
        )
      }
      return [...prev, addedLine]
    })
    setLastAdded(addedLine)
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((productId: string, size: string, color: string) => {
    setLines((prev) => prev.filter((l) => !(l.productId === productId && l.size === size && l.color === color)))
  }, [])

  const updateQuantity = useCallback((productId: string, size: string, color: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((l) =>
          l.productId === productId && l.size === size && l.color === color ? { ...l, quantity } : l
        )
        .filter((l) => l.quantity > 0)
    )
  }, [])

  const clearCart = useCallback(() => setLines([]), [])
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => {
    setIsOpen(false)
    setLastAdded(null)
  }, [])

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.price * l.quantity, 0), [lines])
  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines])

  const value: CartContextValue = {
    lines,
    isOpen,
    lastAdded,
    openCart,
    closeCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    itemCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
