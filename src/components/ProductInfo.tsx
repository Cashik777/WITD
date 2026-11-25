import type { Product } from '@/types/product'
import { formatPrice } from '@/lib/format'
import { getProductPrice } from '@/lib/price'
import { store, shippingPolicy } from '@/lib/store'
import { useCurrency } from '@/context/CurrencyContext'
import { useLocale } from '@/hooks/useLocale'
import { localizedProductText } from '@/lib/productText'
import { translateFit, translateMaterials, translateCare } from '@/lib/productSpecLabels'
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
  const { t, locale } = useLocale()
  const price = getProductPrice(product, currency)
  const policy = shippingPolicy(currency)
  const { name, description } = localizedProductText(product, locale)

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl text-paper">{name}</h1>
      <p className="mt-2 text-lg text-paper/80">{formatPrice(price, currency)}</p>
      <p className="mt-5 text-sm text-paper/70 leading-relaxed max-w-md">{description}</p>

      {soldOut && (
        <p className="mt-4 text-xs tracking-widest uppercase text-paper/60 border border-line inline-block px-3 py-2">
          {t('product.soldOut')}
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
          {needsSize && <p className="mt-2 text-xs text-[#B5674F]">{t('product.pleaseSelectSize')}</p>}
        </div>
      </div>

      {soldOut ? (
        <div className="mt-8">
          <p className="text-xs tracking-widest uppercase text-paper mb-2">{t('product.notifyMe')}</p>
          <p className="text-sm text-mist">{t('product.notifyMeBody', { name })}</p>
          <NotifyMeForm productName={name} />
        </div>
      ) : (
        <>
          <div id="primary-buy-cta" className="mt-8 flex flex-col gap-3">
            <button
              onClick={addToCart}
              disabled={!size}
              className="w-full py-4 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-60"
            >
              {size ? t('product.addToCartWithPrice', { price: formatPrice(price, currency) }) : t('product.selectSize')}
            </button>
            <button
              onClick={buyNow}
              className="w-full py-4 border border-paper text-paper text-xs tracking-widest uppercase hover:bg-paper hover:text-black transition-colors"
            >
              {t('product.buyNow')}
            </button>
          </div>

          <div className="mt-5 space-y-1.5 text-xs text-mist">
            <p>
              {t('product.freeShippingOver', { amount: formatPrice(policy.freeShippingThreshold, currency) })} &middot;{' '}
              {t('product.flatRateOtherwise', { amount: formatPrice(policy.shippingFlatRate, currency) })}
            </p>
            <p>
              {t('product.returnsShipsIn', {
                days: store.returnWindowDays,
                min: store.fulfillmentDaysMin,
                max: store.fulfillmentDaysMax,
                shipsTo: store.shipsTo,
              })}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// Split out from ProductInfo so ProductDetail.tsx can render it full-width
// below the gallery+purchase-info grid instead of squeezed into just the
// right column. A plain accordion stack stretched across the full width
// just left a long empty stretch beside it (reported directly, with a
// screenshot) — text accordions don't get more useful by getting wider.
// Instead: The Idea is the one editorial/brand-voice item here (the other
// four are pure logistics), already defaultOpen, and on the homepage its
// equivalent ("The WITD Idea" in Home.tsx) already gets this same large
// font-display treatment — so it earns the left half as a standalone
// statement instead of another accordion row, with the practical stuff
// (Fit & Size, Material & Care, Shipping & Returns, Details) stacked in
// the right half. Two columns that both do something, rather than one
// column and a void.
export function ProductDetailsAccordion({ product, onOpenGuide }: { product: Product; onOpenGuide: () => void }) {
  const { currency } = useCurrency()
  const { t, locale } = useLocale()
  const policy = shippingPolicy(currency)
  const { idea } = localizedProductText(product, locale)

  return (
    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
      {idea ? (
        <p className="font-display text-2xl md:text-3xl lg:text-4xl text-paper/90 leading-snug max-w-lg mx-auto text-center">
          {idea}
        </p>
      ) : (
        <div />
      )}
      <div>
        <Accordion title={t('product.fitAndSize')} defaultOpen>
          <p>{translateFit(product.fit, locale)}</p>
          <button onClick={onOpenGuide} className="mt-2 text-paper underline underline-offset-4 hover:text-paper/70">
            {t('product.viewSizeGuide')}
          </button>
        </Accordion>
        <Accordion title={t('product.materialAndCare')}>
          <p>{translateMaterials(product.materials, locale)}</p>
          <p className="mt-2">{translateCare(product.careInstructions, locale)}</p>
        </Accordion>
        <Accordion title={t('product.shippingAndReturns')}>
          <p>
            {t('product.shippingReturnsBody', {
              min: store.fulfillmentDaysMin,
              max: store.fulfillmentDaysMax,
              amount: formatPrice(policy.freeShippingThreshold, currency),
              days: store.returnWindowDays,
              shipsTo: store.shipsTo,
            })}
          </p>
        </Accordion>
        <Accordion title={t('product.details')}>
          <p>{t('product.sku', { sku: product.sku })}</p>
        </Accordion>
      </div>
    </div>
  )
}
