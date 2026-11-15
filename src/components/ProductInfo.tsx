import type { Product } from '@/types/product'
import { formatPrice } from '@/lib/format'
import { getProductPrice } from '@/lib/price'
import { store, shippingPolicy } from '@/lib/store'
import { useCurrency } from '@/context/CurrencyContext'
import type { useProductPurchase } from '@/hooks/useProductPurchase'
import { SizeSelector } from './SizeSelector'
import { ColorSelector } from './ColorSelector'
import { NotifyMeForm } from './NotifyMeForm'
import { Accordion } from './Accordion'

interface ProductInfoProps {
  product: Product
  purchase: ReturnType<typeof useProductPurchase>
  onOpenGuide: () => void
}

// Just the purchase-decision half (name, price, color/size, buy buttons) —
// this stays beside the gallery in the two-column grid. The idea/fit/
// material/shipping/details accordion used to live here too, but once the
// gallery column (now a smaller centered photo + thumbnail row, not a
// full-height image) got shorter than this column, the accordion ended up
// sharing a row with a big slab of visually empty space next to it. See
// ProductDetailsAccordion below, which ProductDetail.tsx now renders full-
// width underneath both columns instead.
export function ProductInfo({ product, purchase, onOpenGuide }: ProductInfoProps) {
  const { color, setColor, size, selectSize, needsSize, soldOut, addToCart, buyNow } = purchase
  const { currency } = useCurrency()
  const price = getProductPrice(product, currency)
  const policy = shippingPolicy(currency)

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl text-paper">{product.name}</h1>
      <p className="mt-2 text-lg text-paper/80">{formatPrice(price, currency)}</p>
      <p className="mt-5 text-sm text-paper/70 leading-relaxed max-w-md">{product.description}</p>

      {soldOut && (
        <p className="mt-4 text-xs tracking-widest uppercase text-paper/60 border border-line inline-block px-3 py-2">
          Sold Out
        </p>
      )}

      <div className="mt-8 space-y-7">
        {product.colors.length > 0 && <ColorSelector colors={product.colors} selected={color} onSelect={setColor} />}

        <div id="size-selector">
          <SizeSelector
            sizes={product.sizes}
            availableSizes={soldOut ? [] : product.availableSizes}
            selected={size}
            onSelect={selectSize}
            onOpenGuide={onOpenGuide}
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
              {size ? `Add to Cart — ${formatPrice(price, currency)}` : 'Select a Size'}
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
              Free shipping on orders over {formatPrice(policy.freeShippingThreshold, currency)} &middot;{' '}
              {formatPrice(policy.shippingFlatRate, currency)} flat rate otherwise
            </p>
            <p>
              {store.returnWindowDays}-day returns &middot; ships in {store.fulfillmentDaysMin}–
              {store.fulfillmentDaysMax} business days &middot; {store.shipsTo}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// The idea/fit/material/shipping/details accordion, split out from
// ProductInfo so ProductDetail.tsx can render it full-width below the
// gallery+purchase-info grid instead of squeezed into just the right
// column.
export function ProductDetailsAccordion({ product, onOpenGuide }: { product: Product; onOpenGuide: () => void }) {
  const { currency } = useCurrency()
  const policy = shippingPolicy(currency)

  return (
    <div className="max-w-2xl">
      {product.idea && (
        <Accordion title="The Idea" defaultOpen>
          <p>{product.idea}</p>
        </Accordion>
      )}
      <Accordion title="Fit & Size">
        <p>{product.fit}</p>
        <button onClick={onOpenGuide} className="mt-2 text-paper underline underline-offset-4 hover:text-paper/70">
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
          orders over {formatPrice(policy.freeShippingThreshold, currency)}. Returns accepted within{' '}
          {store.returnWindowDays} days of delivery for unworn items in original condition. Ships to{' '}
          {store.shipsTo}.
        </p>
      </Accordion>
      <Accordion title="Details">
        <p>SKU {product.sku}</p>
      </Accordion>
    </div>
  )
}
