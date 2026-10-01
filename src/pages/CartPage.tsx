import { Link } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/lib/format'
import { calculateShipping } from '@/lib/store'
import { useCurrency } from '@/context/CurrencyContext'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { CartItem } from '@/components/CartItem'

export default function CartPage() {
  useDocumentMeta('Cart — WITD')
  const { lines, subtotal } = useCart()
  const { currency: activeCurrency } = useCurrency()
  const currency = lines[0]?.currency ?? activeCurrency
  const shipping = calculateShipping(subtotal, currency)
  const total = subtotal + shipping

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-12 md:py-16">
      <h1 className="font-display text-4xl md:text-5xl text-paper mb-10">Cart</h1>

      {lines.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-paper/70 mb-6">Your cart is empty.</p>
          <Link to="/shop" className="inline-block px-7 py-3.5 bg-paper text-black text-xs tracking-widest uppercase">
            Shop the Drop
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_360px] gap-12">
          <div>
            {lines.map((line) => (
              <CartItem key={`${line.productId}-${line.size}-${line.color}`} line={line} />
            ))}
          </div>

          <div className="border border-line p-6 h-fit space-y-4">
            <h2 className="text-xs tracking-widest uppercase text-paper">Order Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-mist">Subtotal</span>
              <span className="text-paper">{formatPrice(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-mist">Shipping</span>
              <span className="text-paper">{shipping === 0 ? 'Free' : formatPrice(shipping, currency)}</span>
            </div>
            <div className="flex justify-between text-sm pt-3 border-t border-line">
              <span className="text-paper">Total</span>
              <span className="text-paper">{formatPrice(total, currency)}</span>
            </div>
            <Link
              to="/checkout"
              className="block w-full text-center py-3.5 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors"
            >
              Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
