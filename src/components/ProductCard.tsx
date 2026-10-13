import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '@/types/product'
import { formatPrice } from '@/lib/format'
import { getProductPrice } from '@/lib/price'
import { useCart } from '@/hooks/useCart'
import { useCurrency } from '@/context/CurrencyContext'
import { colorSwatch } from '@/lib/colorSwatch'

export function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false)
  const [pickingSize, setPickingSize] = useState(false)
  const { addItem, openCart } = useCart()
  const { currency } = useCurrency()
  const soldOut = product.availability === 'sold_out'

  const openSizePicker = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (soldOut || product.availableSizes.length === 0) return
    setPickingSize(true)
  }

  // Quick add always requires an explicit size choice — never assume the
  // first available size on the customer's behalf.
  const pickSize = (e: MouseEvent, size: string) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, size, product.colors[0], 1)
    setPickingSize(false)
    openCart()
  }

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      onTouchCancel={() => setHovered(false)}
    >
      <div className="relative aspect-[4/5] bg-[#151412] overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-witd ${
            hovered && product.hoverImage ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
        />
        {product.hoverImage && (
          <img
            src={product.hoverImage}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-witd ${
              hovered ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
          />
        )}

        {(product.new || soldOut || product.availability === 'low_stock') && (
          <div className="absolute top-3 left-3 flex gap-2">
            {product.new && !soldOut && (
              <span className="text-[10px] tracking-widest uppercase bg-paper text-black px-2 py-1">New</span>
            )}
            {soldOut && (
              <span className="text-[10px] tracking-widest uppercase bg-black/70 text-paper px-2 py-1 border border-line">
                Sold Out
              </span>
            )}
            {!soldOut && product.availability === 'low_stock' && (
              <span className="text-[10px] tracking-widest uppercase bg-black/70 text-paper px-2 py-1 border border-line">
                Low Stock
              </span>
            )}
          </div>
        )}

        {/* Small stacked square in the opposite corner from New/Sold Out/Low
            Stock so it never collides with them, and short enough per line
            that it can't wrap across the garment underneath. */}
        {product.bestseller && !soldOut && (
          <div className="absolute top-3 right-3 flex flex-col items-center leading-tight text-[9px] tracking-widest uppercase bg-black/70 text-paper px-2 py-1.5 border border-line">
            <span>Best</span>
            <span>Seller</span>
          </div>
        )}

        {!soldOut && !pickingSize && (
          <button
            onClick={openSizePicker}
            className="absolute bottom-0 left-0 right-0 py-3 bg-paper text-black text-[11px] tracking-widest uppercase opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 ease-witd hidden md:block"
          >
            Quick Add
          </button>
        )}

        {pickingSize && (
          <div className="absolute bottom-0 left-0 right-0 bg-paper p-2.5">
            <p className="text-[10px] tracking-widest uppercase text-black/60 mb-1.5 px-0.5">Select a Size</p>
            <div className="flex flex-wrap gap-1.5">
              {product.availableSizes.map((s) => (
                <button
                  key={s}
                  onClick={(e) => pickSize(e, s)}
                  className="px-2.5 py-1.5 text-[11px] bg-black text-paper hover:bg-black/80 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm text-paper">{product.name}</h3>
          <div className="mt-1.5 flex gap-1.5">
            {product.colors.map((c) => (
              <span
                key={c}
                className="w-3 h-3 rounded-full border border-paper/20"
                style={{ backgroundColor: colorSwatch[c] ?? '#8F8B82' }}
                title={c}
              />
            ))}
          </div>
        </div>
        <span className="text-sm text-paper/80 whitespace-nowrap">{formatPrice(getProductPrice(product, currency), currency)}</span>
      </div>
    </Link>
  )
}
