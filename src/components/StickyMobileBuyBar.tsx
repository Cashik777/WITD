import { useEffect, useState } from 'react'
import type { Product } from '@/types/product'
import { formatPrice } from '@/lib/format'
import { getProductPrice } from '@/lib/price'
import { useCurrency } from '@/context/CurrencyContext'
import type { useProductPurchase } from '@/hooks/useProductPurchase'

interface StickyMobileBuyBarProps {
  product: Product
  purchase: ReturnType<typeof useProductPurchase>
}

// Visibility is driven by checking the real buy button's position on each
// scroll event, not an IntersectionObserver — an observer's callback can
// lag behind a fast mobile swipe and the bar fails to appear until the next
// scroll settles. A direct getBoundingClientRect() check on scroll has no
// such lag.
export function StickyMobileBuyBar({ product, purchase }: StickyMobileBuyBarProps) {
  const { size, addToCart, soldOut } = purchase
  const [visible, setVisible] = useState(false)
  const { currency } = useCurrency()

  useEffect(() => {
    if (soldOut) return

    const checkPosition = () => {
      const el = document.getElementById('primary-buy-cta')
      if (!el) return
      const { bottom } = el.getBoundingClientRect()
      setVisible(bottom < 0)
    }

    checkPosition()
    window.addEventListener('scroll', checkPosition, { passive: true })
    window.addEventListener('resize', checkPosition)
    return () => {
      window.removeEventListener('scroll', checkPosition)
      window.removeEventListener('resize', checkPosition)
    }
  }, [soldOut])

  if (soldOut || !visible) return null

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black border-t border-line px-5 py-3 flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-paper truncate">{product.name}</p>
        <p className="text-xs text-mist">{formatPrice(getProductPrice(product, currency), currency)}</p>
      </div>
      <button
        onClick={addToCart}
        disabled={!size}
        className="shrink-0 px-6 py-3 bg-paper text-black text-xs tracking-widest uppercase disabled:opacity-60"
      >
        {size ? 'Add to Cart' : 'Select a Size'}
      </button>
    </div>
  )
}
