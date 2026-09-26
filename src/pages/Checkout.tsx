import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/lib/format'
import { calculateShipping } from '@/lib/store'
import { ChevronDown } from '@/components/icons'

const PAYMENTS_NOT_OPEN_MESSAGE = 'Payments are not open yet — your cart is saved.'

const steps = ['Cart', 'Details', 'Payment', 'Done'] as const

function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 text-xs tracking-widest uppercase mb-10">
      {steps.map((step, i) => (
        <li key={step} className="flex items-center gap-2">
          <span className={i <= current ? 'text-paper' : 'text-mist/50'}>{step}</span>
          {i < steps.length - 1 && <span className="text-mist/30">&rarr;</span>}
        </li>
      ))}
    </ol>
  )
}

export default function Checkout() {
  const { lines, subtotal } = useCart()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const shipping = calculateShipping(subtotal)
  const total = subtotal + shipping

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      // The server re-validates every product id, size, color and price
      // against its own data — never trust the browser's numbers. See
      // server/src/routes/checkout.ts.
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || undefined,
          items: lines.map((l) => ({
            productId: l.productId,
            size: l.size,
            color: l.color,
            quantity: l.quantity,
          })),
        }),
      })

      if (!res.ok) {
        if (res.status === 503) throw new Error(PAYMENTS_NOT_OPEN_MESSAGE)
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Checkout is not available right now (${res.status}).`)
      }

      const { url } = await res.json()
      if (!url) throw new Error('No checkout URL was returned.')
      window.location.href = url
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong starting checkout. Please try again.'
      )
      setLoading(false)
    }
  }

  if (lines.length === 0) {
    return (
      <div className="max-w-content mx-auto px-5 md:px-8 py-24 text-center">
        <p className="text-paper/70 mb-6">Your cart is empty.</p>
        <Link to="/shop" className="inline-block px-7 py-3.5 bg-paper text-black text-xs tracking-widest uppercase">
          Shop the Drop
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-12 md:py-16">
      <h1 className="font-display text-4xl md:text-5xl text-paper mb-6">Checkout</h1>
      <CheckoutSteps current={1} />

      <div className="md:hidden mb-8 border border-line">
        <button
          onClick={() => setSummaryOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-xs tracking-widest uppercase text-paper"
        >
          <span>
            {summaryOpen ? 'Hide' : 'Show'} Order Summary &middot; {lines.length} {lines.length === 1 ? 'item' : 'items'}
          </span>
          <span className="flex items-center gap-2">
            {formatPrice(total)}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>
        {summaryOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-line pt-4">
            {lines.map((l) => (
              <div key={`${l.productId}-${l.size}-${l.color}`} className="flex justify-between text-sm">
                <span className="text-paper/80">
                  {l.name} ({l.color}/{l.size}) &times; {l.quantity}
                </span>
                <span className="text-paper">{formatPrice(l.price * l.quantity, l.currency)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-3 border-t border-line">
              <span className="text-mist">Subtotal</span>
              <span className="text-paper">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-mist">Shipping</span>
              <span className="text-paper">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-[1fr_400px] gap-12">
        <div>
          <label className="block text-xs tracking-widest uppercase text-paper mb-3">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-transparent border border-mist/50 focus:border-paper px-4 py-3 text-sm text-paper placeholder:text-mist outline-none transition-colors"
          />
          <p className="mt-3 text-xs text-mist leading-relaxed">
            Shipping address and payment are collected securely on the next step through Stripe Checkout — WITD
            never sees or stores your card details.
          </p>

          {error && (
            <div className="mt-6 border border-line px-4 py-3 text-sm text-paper/80">
              <p>{error}</p>
              {error !== PAYMENTS_NOT_OPEN_MESSAGE && (
                <p className="mt-1 text-xs text-mist">
                  This storefront is running in test mode without live Stripe/fulfillment credentials connected yet.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="mt-8 w-full md:w-auto px-10 py-4 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Redirecting to payment…' : 'Continue to Payment'}
          </button>
        </div>

        <div className="hidden md:block border border-line p-6 h-fit space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-paper">Order Summary</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {lines.map((l) => (
              <div key={`${l.productId}-${l.size}-${l.color}`} className="flex justify-between text-sm">
                <span className="text-paper/80">
                  {l.name} ({l.color}/{l.size}) &times; {l.quantity}
                </span>
                <span className="text-paper">{formatPrice(l.price * l.quantity, l.currency)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm pt-3 border-t border-line">
            <span className="text-mist">Subtotal</span>
            <span className="text-paper">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-mist">Shipping</span>
            <span className="text-paper">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
          </div>
          <div className="flex justify-between text-sm pt-3 border-t border-line">
            <span className="text-paper">Total</span>
            <span className="text-paper">{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
