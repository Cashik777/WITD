import { useEffect, useState } from 'react'
import { LL } from '@/components/LL'
import { useCart } from '@/hooks/useCart'
import { useCustomerAuth } from '@/hooks/useCustomerAuth'
import { formatPrice } from '@/lib/format'
import { calculateShipping } from '@/lib/store'
import { useCurrency } from '@/context/CurrencyContext'
import { useLocale } from '@/hooks/useLocale'
import { useFilterLabels } from '@/hooks/useFilterLabels'
import { useProducts } from '@/hooks/useProducts'
import { localizedProductText } from '@/lib/productText'
import { sizeLabel } from '@/lib/sizeLabel'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { ChevronDown } from '@/components/icons'

function CheckoutSteps({ current }: { current: number }) {
  const { t } = useLocale()
  const steps = [t('checkout.stepCart'), t('checkout.stepDetails'), t('checkout.stepPayment'), t('checkout.stepDone')]
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
  const { t, locale } = useLocale()
  useDocumentMeta(t('meta.checkoutTitle'))
  const { colorLabel } = useFilterLabels()
  const { getProductById } = useProducts()
  // Same snapshot-vs-live-catalog reasoning as CartItem.tsx: resolve each
  // line's name against the current locale instead of trusting whatever
  // language was active when it was added to the cart.
  const lineName = (productId: string, fallback: string) => {
    const product = getProductById(productId)
    return product ? localizedProductText(product, locale).name : fallback
  }
  const PAYMENTS_NOT_OPEN_MESSAGE = t('checkout.paymentsNotOpen')
  const { lines, subtotal } = useCart()
  const { currency: activeCurrency } = useCurrency()
  const currency = lines[0]?.currency ?? activeCurrency
  const { email: accountEmail } = useCustomerAuth()
  const [email, setEmail] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)

  // The trace-the-shape toy on the homepage writes its earned code here once
  // 20 shapes are completed — prefill it so the reward doesn't require
  // copy-pasting, but leave it editable. Skip a code that's already expired
  // (the toy itself clears these keys once it notices, but that only runs
  // while the homepage panel is mounted, so a stale pair can still be
  // sitting in localStorage if the customer jumped straight to checkout).
  useEffect(() => {
    const earned = window.localStorage.getItem('witd_quest_coupon')
    const expiresAt = Number(window.localStorage.getItem('witd_quest_coupon_expires'))
    if (earned && Number.isFinite(expiresAt) && expiresAt > Date.now()) setCouponCode(earned)
  }, [])

  // Logged-in customers shouldn't have to retype an email we already know —
  // prefill (and lock) it from their account instead. useState's initializer
  // only runs on mount, and CustomerAuthContext's /account/me check is still
  // in flight at that point, so this has to happen in an effect once it
  // resolves rather than in the useState call above.
  useEffect(() => {
    if (accountEmail) setEmail(accountEmail)
  }, [accountEmail])

  // handleCheckout's success path never resets `loading` — it doesn't need
  // to, since window.location.href = url is about to navigate away from
  // this page entirely. But if the browser restores this exact page from
  // bfcache (hitting Back from Stripe, or from anywhere after), that stuck
  // loading=true comes back with it — the button is permanently disabled,
  // stuck on "Redirecting to payment…", with no way to retry. This is
  // exactly what breaks after editing the cart (e.g. dropping back under
  // the free-shipping threshold) and returning to checkout. pageshow's
  // `persisted` flag is true specifically for a bfcache restore, so reset
  // loading there instead of on every normal mount.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setLoading(false)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  const shipping = calculateShipping(subtotal, currency)
  const total = subtotal + shipping

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const handleCheckout = async () => {
    if (!emailValid) {
      setError(t('checkout.enterValidEmail'))
      return
    }
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
          email: email.trim(),
          couponCode: couponCode.trim() || undefined,
          currency,
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
        throw new Error(body.error || t('checkout.checkoutUnavailable', { status: res.status }))
      }

      const { url } = await res.json()
      if (!url) throw new Error(t('checkout.noCheckoutUrl'))
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : t('checkout.somethingWentWrong'))
      setLoading(false)
    }
  }

  if (lines.length === 0) {
    return (
      <div className="max-w-content mx-auto px-5 md:px-8 py-24 text-center">
        <p className="text-paper/70 mb-6">{t('cart.empty')}</p>
        <LL to="/shop" className="inline-block px-7 py-3.5 bg-paper text-black text-xs tracking-widest uppercase">
          {t('hero.shopDrop')}
        </LL>
      </div>
    )
  }

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-12 md:py-16">
      <h1 className="font-display text-4xl md:text-5xl text-paper mb-6">{t('cart.checkout')}</h1>
      <CheckoutSteps current={1} />

      <div className="md:hidden mb-8 border border-line">
        <button
          onClick={() => setSummaryOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-xs tracking-widest uppercase text-paper"
        >
          <span>
            {t(
              `checkout.${summaryOpen ? 'hide' : 'show'}Summary${lines.length === 1 ? '' : '_plural'}`,
              { count: lines.length }
            )}
          </span>
          <span className="flex items-center gap-2">
            {formatPrice(total, currency)}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>
        {summaryOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-line pt-4">
            {lines.map((l) => (
              <div key={`${l.productId}-${l.size}-${l.color}`} className="flex justify-between text-sm">
                <span className="text-paper/80">
                  {lineName(l.productId, l.name)} ({colorLabel(l.color)}/{sizeLabel(l.size, t)}) &times; {l.quantity}
                </span>
                <span className="text-paper">{formatPrice(l.price * l.quantity, l.currency)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-3 border-t border-line">
              <span className="text-mist">{t('cart.subtotal')}</span>
              <span className="text-paper">{formatPrice(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-mist">{t('cart.shipping')}</span>
              <span className="text-paper">{shipping === 0 ? t('cart.free') : formatPrice(shipping, currency)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-[1fr_400px] gap-12">
        <div>
          <label className="block text-xs tracking-widest uppercase text-paper mb-3">{t('checkout.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={Boolean(accountEmail)}
            placeholder={t('product.emailPlaceholder')}
            className={`w-full bg-transparent border border-mist/50 focus:border-paper px-4 py-3 text-sm text-paper placeholder:text-mist outline-none transition-colors ${accountEmail ? 'opacity-70 cursor-not-allowed' : ''}`}
          />
          {accountEmail && <p className="mt-2 text-xs text-mist">{t('checkout.usingAccountEmail')}</p>}

          <label className="block text-xs tracking-widest uppercase text-paper mb-3 mt-6">{t('checkout.couponCode')}</label>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder={t('checkout.optional')}
            className="w-full bg-transparent border border-mist/50 focus:border-paper px-4 py-3 text-sm text-paper placeholder:text-mist outline-none transition-colors tracking-widest"
          />

          <p className="mt-3 text-xs text-mist leading-relaxed">{t('checkout.securityNote')}</p>

          {error && (
            <div className="mt-6 border border-line px-4 py-3 text-sm text-paper/80">
              <p>{error}</p>
              {error !== PAYMENTS_NOT_OPEN_MESSAGE && (
                <p className="mt-1 text-xs text-mist">{t('checkout.testModeNote')}</p>
              )}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading || !emailValid}
            className="mt-8 w-full md:w-auto px-10 py-4 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading ? t('checkout.redirecting') : t('checkout.continueToPayment')}
          </button>
        </div>

        <div className="hidden md:block border border-line p-6 h-fit space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-paper">{t('cart.orderSummary')}</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {lines.map((l) => (
              <div key={`${l.productId}-${l.size}-${l.color}`} className="flex justify-between text-sm">
                <span className="text-paper/80">
                  {lineName(l.productId, l.name)} ({colorLabel(l.color)}/{sizeLabel(l.size, t)}) &times; {l.quantity}
                </span>
                <span className="text-paper">{formatPrice(l.price * l.quantity, l.currency)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm pt-3 border-t border-line">
            <span className="text-mist">{t('cart.subtotal')}</span>
            <span className="text-paper">{formatPrice(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-mist">{t('cart.shipping')}</span>
            <span className="text-paper">{shipping === 0 ? t('cart.free') : formatPrice(shipping, currency)}</span>
          </div>
          <div className="flex justify-between text-sm pt-3 border-t border-line">
            <span className="text-paper">{t('cart.total')}</span>
            <span className="text-paper">{formatPrice(total, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
