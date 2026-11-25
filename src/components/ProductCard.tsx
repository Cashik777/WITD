import { useState, type MouseEvent } from 'react'
import { LL } from './LL'
import { useLocale } from '@/hooks/useLocale'
import type { Product } from '@/types/product'
import { formatPrice } from '@/lib/format'
import { getProductPrice } from '@/lib/price'
import { useCart } from '@/hooks/useCart'
import { useCurrency } from '@/context/CurrencyContext'
import { SwatchDot } from './SwatchDot'
import { productImage } from '@/lib/productImage'
import { localizedProductText } from '@/lib/productText'
import { useFilterLabels } from '@/hooks/useFilterLabels'
import { sizeLabel } from '@/lib/sizeLabel'

export function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false)
  const [pickingSize, setPickingSize] = useState(false)
  const { addItem, openCart } = useCart()
  const { currency } = useCurrency()
  const { t, locale } = useLocale()
  const { colorLabel } = useFilterLabels()
  const { name } = localizedProductText(product, locale)
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
    <LL
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
          src={productImage(product.images[0], 600, 750)}
          srcSet={`${productImage(product.images[0], 400, 500)} 400w, ${productImage(product.images[0], 600, 750)} 600w`}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          alt={name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-witd ${
            hovered && product.hoverImage ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
        />
        {product.hoverImage && (
          <img
            src={productImage(product.hoverImage, 600, 750)}
            srcSet={`${productImage(product.hoverImage, 400, 500)} 400w, ${productImage(product.hoverImage, 600, 750)} 600w`}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
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
              <span className="text-[10px] tracking-widest uppercase bg-paper text-black px-2 py-1">{t('product.new')}</span>
            )}
            {soldOut && (
              <span className="text-[10px] tracking-widest uppercase bg-black/70 text-paper px-2 py-1 border border-line">
                {t('product.soldOut')}
              </span>
            )}
            {!soldOut && product.availability === 'low_stock' && (
              <span className="text-[10px] tracking-widest uppercase bg-black/70 text-paper px-2 py-1 border border-line">
                {t('product.lowStock')}
              </span>
            )}
          </div>
        )}

        {!soldOut && !pickingSize && (
          <button
            onClick={openSizePicker}
            className="absolute bottom-0 left-0 right-0 py-3 bg-paper text-black text-[11px] tracking-widest uppercase opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 ease-witd hidden md:block"
          >
            {t('product.quickAdd')}
          </button>
        )}

        {pickingSize && (
          <div className="absolute bottom-0 left-0 right-0 bg-paper p-2.5">
            <p className="text-[10px] tracking-widest uppercase text-black/60 mb-1.5 px-0.5">{t('product.selectSize')}</p>
            <div className="flex flex-wrap gap-1.5">
              {product.availableSizes.map((s) => (
                <button
                  key={s}
                  onClick={(e) => pickSize(e, s)}
                  className="px-2.5 py-1.5 text-[11px] bg-black text-paper hover:bg-black/80 transition-colors"
                >
                  {sizeLabel(s, t)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {product.bestseller && (
            <p className="text-[10px] tracking-widest uppercase text-paper/50 mb-1">{t('product.bestseller')}</p>
          )}
          <h3 className="text-sm text-paper">{name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {product.colors.map((c) => (
              <SwatchDot key={c} color={c} className="w-3 h-3 shrink-0 rounded-full border border-paper/20" title={colorLabel(c)} />
            ))}
          </div>
        </div>
        <span className="text-sm text-paper/80 whitespace-nowrap">{formatPrice(getProductPrice(product, currency), currency)}</span>
      </div>
    </LL>
  )
}
