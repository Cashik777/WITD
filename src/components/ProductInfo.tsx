import { useState } from 'react'
import type { Product } from '@/types/product'
import { formatPrice } from '@/lib/format'
import { store } from '@/lib/store'
import type { useProductPurchase } from '@/hooks/useProductPurchase'
import { SizeSelector } from './SizeSelector'
import { ColorSelector } from './ColorSelector'
import { SizeGuideModal } from './SizeGuideModal'
import { NotifyMeForm } from './NotifyMeForm'
import { Accordion } from './Accordion'

interface ProductInfoProps {
  product: Product
  purchase: ReturnType<typeof useProductPurchase>
}

export function ProductInfo({ product, purchase }: ProductInfoProps) {
  const { color, setColor, size, selectSize, needsSize, soldOut, addToCart, buyNow } = purchase
  const [guideOpen, setGuideOpen] = useState(false)

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl text-paper">{product.name}</h1>
      <p className="mt-2 text-lg text-paper/80">{formatPrice(product.price, product.currency)}</p>
      <p className="mt-5 text-sm text-paper/70 leading-relaxed max-w-md">{product.description}</p>

      {soldOut && (
        <p className="mt-4 text-xs tracking-widest uppercase text-paper/60 border border-line inline-block px-3 py-2">
          Sold Out
        </p>
      )}

      <div className="mt-8 space-y-7">
        {product.colors.length > 0 && <ColorSelector colors={product.colors} selected={color} onSelect={setColor} />}

        <div>
          <SizeSelector
            sizes={product.sizes}
            availableSizes={soldOut ? [] : product.availableSizes}
            selected={size}
            onSelect={selectSize}
            onOpenGuide={() => setGuideOpen(true)}
          />
          {needsSize && <p className="mt-2 text-xs text-[#B5674F]">Please select a size.</p>}
        </div>
      </div>

      {soldOut ? (
        <div className="mt-8">
          <p className="text-xs tracking-widest uppercase text-paper mb-2">Notify Me</p>
          <p className="text-sm text-mist">Get an email if {product.name} is restocked.</p>
          <NotifyMeForm productName={product.name} />
        </div>
      ) : (
        <>
          <div id="primary-buy-cta" className="mt-8 flex flex-col gap-3">
            <button
              onClick={addToCart}
              disabled={!size}
              className="w-full py-4 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-60"
            >
              {size ? `Add to Cart — ${formatPrice(product.price, product.currency)}` : 'Select a Size'}
            </button>
            <button
              onClick={buyNow}
              className="w-full py-4 border border-paper text-paper text-xs tracking-widest uppercase hover:bg-paper hover:text-black transition-colors"
            >
              Buy Now
            </button>
          </div>

          <div className="mt-5 space-y-1.5 text-xs text-mist">
            <p>
              Free shipping on orders over {formatPrice(store.freeShippingThreshold, product.currency)} &middot;{' '}
              {formatPrice(store.shippingFlatRate, product.currency)} flat rate otherwise
            </p>
            <p>
              {store.returnWindowDays}-day returns &middot; ships in {store.fulfillmentDaysMin}–
              {store.fulfillmentDaysMax} business days &middot; {store.shipsTo}
            </p>
          </div>
        </>
      )}

      <div className="mt-12">
        {product.idea && (
          <Accordion title="The Idea" defaultOpen>
            <p>{product.idea}</p>
          </Accordion>
        )}
        <Accordion title="Fit & Size">
          <p>{product.fit}</p>
          <button
            onClick={() => setGuideOpen(true)}
            className="mt-2 text-paper underline underline-offset-4 hover:text-paper/70"
          >
            View size guide
          </button>
        </Accordion>
        <Accordion title="Material & Care">
          <p>{product.materials}</p>
          <p className="mt-2">{product.careInstructions}</p>
        </Accordion>
        <Accordion title="Shipping & Returns">
          <p>
            Orders ship within {store.fulfillmentDaysMin}–{store.fulfillmentDaysMax} business days. Free shipping on
            orders over {formatPrice(store.freeShippingThreshold, product.currency)}. Returns accepted within{' '}
            {store.returnWindowDays} days of delivery for unworn items in original condition. Ships to{' '}
            {store.shipsTo}.
          </p>
        </Accordion>
        <Accordion title="Details">
          <p>SKU {product.sku}</p>
        </Accordion>
      </div>

      <SizeGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  )
}
