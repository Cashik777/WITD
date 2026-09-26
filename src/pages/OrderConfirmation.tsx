import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'

// Stripe redirects here after a successful payment
// (success_url includes ?session_id={CHECKOUT_SESSION_ID}, set server-side).
// Once the order-lookup API exists, fetch GET /api/orders/:sessionId here to
// show real order + tracking details instead of this generic confirmation.
export default function OrderConfirmation() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { clearCart } = useCart()

  useEffect(() => {
    if (sessionId) clearCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-24 md:py-32 text-center">
      <h1 className="font-display text-4xl md:text-6xl text-paper">Order Confirmed.</h1>
      <p className="mt-4 text-base text-paper/75">You&rsquo;re officially awake.</p>

      {sessionId ? (
        <p className="mt-8 text-xs text-mist">
          Reference: <span className="text-paper/70">{sessionId}</span>
        </p>
      ) : (
        <p className="mt-8 text-sm text-paper/60 max-w-md mx-auto">
          We couldn&rsquo;t find a payment reference for this page. If you just completed a purchase, check your
          email for a confirmation from Stripe.
        </p>
      )}

      <Link
        to="/shop"
        className="inline-block mt-10 px-8 py-3.5 border border-paper/50 text-paper text-xs tracking-widest uppercase hover:border-paper transition-colors"
      >
        Continue Shopping
      </Link>
    </div>
  )
}
