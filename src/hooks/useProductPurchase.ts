import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product } from '@/types/product'
import { useCart } from './useCart'

// Shared selection + add-to-cart/buy-now logic so the main product form and
// the sticky mobile buy bar (which mirrors it once you've scrolled past the
// real one) can't drift out of sync.
export function useProductPurchase(product: Product | undefined) {
  const [color, setColor] = useState<string | null>(product?.colors[0] ?? null)
  const [size, setSize] = useState<string | null>(null)
  const [needsSize, setNeedsSize] = useState(false)
  const { addItem, openCart } = useCart()
  const navigate = useNavigate()

  const soldOut = product?.availability === 'sold_out'

  const selectSize = (s: string) => {
    setSize(s)
    setNeedsSize(false)
  }

  const requireSelection = () => {
    if (!size) {
      setNeedsSize(true)
      return false
    }
    return true
  }

  const addToCart = () => {
    if (!product || !requireSelection() || !color) return
    addItem(product, size!, color, 1)
    openCart()
  }

  const buyNow = () => {
    if (!product || !requireSelection() || !color) return
    addItem(product, size!, color, 1)
    navigate('/checkout')
  }

  return { color, setColor, size, selectSize, needsSize, soldOut, addToCart, buyNow }
}
