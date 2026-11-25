import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LL } from '@/components/LL'
import { useCart } from '@/hooks/useCart'
import { useCustomerAuth } from '@/hooks/useCustomerAuth'
import { useLocale } from '@/hooks/useLocale'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

// Stripe redirects here after a successful payment
// (success_url includes ?session_id={CHECKOUT_SESSION_ID}, set server-side).
export default function OrderConfirmation() {
  useDocumentMeta('Order Confirmed — WITD')
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { clearCart } = useCart()
  const { email: accountEmail } = useCustomerAuth()
  const { t } = useLocale()
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    clearCart()
    fetch(`/api/orders/${sessionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setOrderNumber(data?.orderNumber ?? null))
      .catch(() => setOrderNumber(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-24 md:py-32 text-center">
      <h1 className="font-display text-4xl md:text-6xl text-paper">{t('orderConfirmation.title')}</h1>
      <p className="mt-4 text-base text-paper/75">{t('orderConfirmation.subtitle')}</p>

      {sessionId ? (
        orderNumber ? (
          <>
            <p className="mt-8 text-xs text-mist">
              {t('orderConfirmation.orderNumber')} <span className="text-paper/70">{orderNumber}</span>
            </p>
            <p className="mt-2 text-xs text-mist max-w-sm mx-auto">{t('orderConfirmation.saveThis')}</p>
            {!accountEmail && (
              <p className="mt-6 text-xs text-paper/60">
                {t('orderConfirmation.trackLater')}{' '}
                <LL to="/account" className="text-paper underline underline-offset-4 hover:text-paper/70">
                  {t('orderConfirmation.createAccount')}
                </LL>{' '}
                {t('orderConfirmation.withSameEmail')}
              </p>
            )}
          </>
        ) : (
          <p className="mt-8 text-xs text-mist">
            {t('orderConfirmation.reference')} <span className="text-paper/70">{sessionId}</span>
          </p>
        )
      ) : (
        <p className="mt-8 text-sm text-paper/60 max-w-md mx-auto">{t('orderConfirmation.noReference')}</p>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <LL
          to="/shop"
          className="inline-block px-8 py-3.5 border border-paper/50 text-paper text-xs tracking-widest uppercase hover:border-paper transition-colors"
        >
          {t('cart.continueShopping')}
        </LL>
        {orderNumber && (
          <LL
            to="/verify"
            className="inline-block px-8 py-3.5 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors"
          >
            {t('orderConfirmation.verifyForCommunity')}
          </LL>
        )}
      </div>
    </div>
  )
}
