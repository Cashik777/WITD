import { Link } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/lib/format'
import { calculateShipping, amountToFreeShipping, shippingPolicy } from '@/lib/store'
import { useCurrency } from '@/context/CurrencyContext'
import { CartItem } from './CartItem'
import { PairsWellWith } from './PairsWellWith'
import { CloseIcon, BagIcon } from './icons'

export function CartDrawer() {
  const { lines, isOpen, closeCart, subtotal, lastAdded } = useCart()
  const { currency: activeCurrency } = useCurrency()
  const currency = lines[0]?.currency ?? activeCurrency

  const shipping = calculateShipping(subtotal, currency)
  const total = subtotal + shipping
  const remaining = amountToFreeShipping(subtotal, currency)
  const policy = shippingPolicy(currency)
  const progressPct = Math.min(100, (subtotal / policy.freeShippingThreshold) * 100)

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ease-witd ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeCart}
      />
      <div
        className={`absolute inset-y-0 right-0 w-full sm:w-[420px] bg-black border-l border-line flex flex-col transition-transform duration-300 ease-witd ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-line shrink-0">
          <h2 className="text-xs tracking-widest uppercase text-paper">
            Cart {lines.length > 0 && `(${lines.length})`}
          </h2>
          <button onClick={closeCart} aria-label="Close cart" className="text-paper">
            <CloseIcon />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <BagIcon className="w-8 h-8 text-mist" />
            <p className="text-sm text-mist">Your cart is empty.</p>
            <Link
              to="/shop"
              onClick={closeCart}
              className="px-6 py-3 bg-paper text-black text-xs tracking-widest uppercase"
            >
              Shop the Drop
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {lastAdded && (
                <p className="px-6 py-3 bg-paper/10 border-b border-line text-xs text-paper">
                  Added: {lastAdded.name} ({lastAdded.color} / {lastAdded.size})
                </p>
              )}

              <div className="px-6 py-4 border-b border-line">
                <p className="text-xs text-paper mb-2">
                  {remaining > 0
                    ? `Shipping is ${formatPrice(10000, currency)}. Add ${formatPrice(remaining, currency)} more and it's free.`
                    : "You've unlocked free shipping"}
                </p>
                <div className="h-1 bg-line overflow-hidden">
                  <div className="h-full bg-paper transition-all duration-300" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              <div className="px-6">
                {lines.map((line) => (
                  <CartItem key={`${line.productId}-${line.size}-${line.color}`} line={line} />
                ))}
              </div>

              <PairsWellWith lines={lines} />
            </div>

            <div className="shrink-0 px-6 py-5 border-t border-line space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-mist">Subtotal</span>
                <span className="text-paper">{formatPrice(subtotal, currency)}</span>
              </div>
              <p className="text-xs text-mist">
                Shipping: {shipping === 0 ? 'Free' : formatPrice(shipping, currency)} &middot; taxes calculated at
                checkout.
              </p>
              <Link
                to="/checkout"
                onClick={closeCart}
                className="block w-full text-center py-3.5 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors"
              >
                Checkout {formatPrice(total, currency)}
              </Link>
              <div className="flex items-center justify-between text-xs">
                <button onClick={closeCart} className="text-mist hover:text-paper underline underline-offset-4">
                  Continue Shopping
                </button>
                <Link to="/cart" onClick={closeCart} className="text-mist hover:text-paper underline underline-offset-4">
                  View Full Cart
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
