import type { CartLine } from '@/types/cart'
import { formatPrice } from '@/lib/format'
import { useCart } from '@/hooks/useCart'
import { useLocale } from '@/hooks/useLocale'
import { useFilterLabels } from '@/hooks/useFilterLabels'
import { sizeLabel } from '@/lib/sizeLabel'
import { useProducts } from '@/hooks/useProducts'
import { localizedProductText } from '@/lib/productText'
import { MinusIcon, PlusIcon, CloseIcon } from './icons'
import { productImage } from '@/lib/productImage'

export function CartItem({ line }: { line: CartLine }) {
  const { updateQuantity, removeItem } = useCart()
  const { t, locale } = useLocale()
  const { colorLabel } = useFilterLabels()
  const { getProductById } = useProducts()
  // The cart line's own `name` is a snapshot taken at add-to-cart time (same
  // pattern as its price/currency), so it stays in whichever language was
  // active then. Re-resolving against the live catalog here means an item
  // added in French still reads in French if the shopper later switches to
  // German — falls back to the snapshot only if the product can't be found
  // (e.g. since discontinued).
  const product = getProductById(line.productId)
  const name = product ? localizedProductText(product, locale).name : line.name

  return (
    <div className="flex gap-4 py-5 border-b border-line">
      <div className="w-20 h-24 bg-[#151412] shrink-0 overflow-hidden">
        <img src={productImage(line.image, 200, 240)} alt={name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm text-paper">{name}</h3>
            <p className="text-xs text-mist mt-1">
              {colorLabel(line.color)} / {sizeLabel(line.size, t)}
            </p>
          </div>
          <button
            onClick={() => removeItem(line.productId, line.size, line.color)}
            aria-label={t('cart.removeItem')}
            className="text-mist hover:text-paper shrink-0"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center border border-line">
            <button
              onClick={() => updateQuantity(line.productId, line.size, line.color, line.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center text-paper/80 hover:text-paper"
              aria-label={t('cart.decreaseQuantity')}
            >
              <MinusIcon className="w-3.5 h-3.5" />
            </button>
            <span className="w-7 text-center text-xs text-paper">{line.quantity}</span>
            <button
              onClick={() => updateQuantity(line.productId, line.size, line.color, line.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center text-paper/80 hover:text-paper"
              aria-label={t('cart.increaseQuantity')}
            >
              <PlusIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-sm text-paper">{formatPrice(line.price * line.quantity, line.currency)}</span>
        </div>
      </div>
    </div>
  )
}
