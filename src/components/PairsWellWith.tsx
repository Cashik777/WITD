import { useState } from 'react'
import type { MouseEvent } from 'react'
import { useProducts } from '@/hooks/useProducts'
import type { CartLine } from '@/types/cart'
import { formatPrice } from '@/lib/format'
import { useCart } from '@/hooks/useCart'

// A small, honest cross-sell: other in-stock First Drop pieces not already
// in the cart. No real "frequently bought together" data exists yet, so
// this stays a simple catalog pick rather than pretending otherwise.
export function PairsWellWith({ lines }: { lines: CartLine[] }) {
  const { products } = useProducts()
  const { addItem } = useCart()
  const [pickingId, setPickingId] = useState<string | null>(null)
  const inCartIds = new Set(lines.map((l) => l.productId))

  const suggestions = products
    .filter((p) => !inCartIds.has(p.id) && p.availability !== 'sold_out' && p.availableSizes.length > 0)
    .slice(0, 2)

  if (suggestions.length === 0) return null

  const pickSize = (e: MouseEvent, productId: string, size: string) => {
    e.preventDefault()
    const product = products.find((p) => p.id === productId)
    if (!product) return
    addItem(product, size, product.colors[0], 1)
    setPickingId(null)
  }

  return (
    <div className="border-t border-line px-6 py-5">
      <h3 className="text-xs tracking-widest uppercase text-paper mb-3">Pairs Well With</h3>
      <div className="space-y-3">
        {suggestions.map((p) => (
          <div key={p.id} className="flex items-center gap-3">
            <div className="w-12 h-14 bg-[#151412] shrink-0 overflow-hidden">
              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-paper truncate">{p.name}</p>
              <p className="text-xs text-mist">{formatPrice(p.price, p.currency)}</p>
            </div>
            {pickingId === p.id ? (
              <div className="flex flex-wrap gap-1 justify-end max-w-[140px]">
                {p.availableSizes.map((s) => (
                  <button
                    key={s}
                    onClick={(e) => pickSize(e, p.id, s)}
                    className="px-2 py-1 text-[10px] border border-line text-paper hover:border-paper"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => setPickingId(p.id)}
                className="shrink-0 text-xs text-paper underline underline-offset-4 hover:text-paper/70"
              >
                Add
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
