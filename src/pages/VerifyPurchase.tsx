import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useLocale } from '@/hooks/useLocale'

export default function VerifyPurchase() {
  const { t } = useLocale()
  useDocumentMeta(t('meta.verifyPurchaseTitle'))
  const [searchParams] = useSearchParams()
  const callbackSuccess = searchParams.get('success') === '1'
  const callbackError = searchParams.get('error')
  const channelUrl = searchParams.get('channel') || 'https://discord.com/channels/@me'

  const ERROR_MESSAGES: Record<string, string> = {
    expired: t('verifyPurchase.errorExpired'),
    not_found: t('verifyPurchase.errorNotFound'),
    discord_failed: t('verifyPurchase.errorDiscordFailed'),
    missing_params: t('verifyPurchase.errorMissingParams'),
  }

  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    callbackError ? ERROR_MESSAGES[callbackError] ?? t('verifyPurchase.errorGeneric') : null,
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/verify-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email }),
      })
      const data = await res.json()
      if (res.ok && data.authorizeUrl) {
        window.location.href = data.authorizeUrl
        return
      }
      setError(data.error || t('verifyPurchase.errorGeneric'))
    } catch {
      setError(t('verifyPurchase.errorGenericRetry'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-20 md:py-28">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="font-display text-4xl md:text-5xl text-paper">{t('verifyPurchase.title')}</h1>
        <p className="mt-4 text-sm text-paper/70 leading-relaxed">{t('verifyPurchase.body')}</p>

        {callbackSuccess ? (
          <div className="mt-10 border border-line p-8">
            <p className="text-sm text-paper mb-4">{t('verifyPurchase.welcomeIn')}</p>
            <a
              href={channelUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-8 py-3.5 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors"
            >
              {t('verifyPurchase.openDiscord')}
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-4 text-left">
            <div>
              <label className="block text-xs tracking-widest uppercase text-paper mb-2">{t('verifyPurchase.orderNumber')}</label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder={t('verifyPurchase.orderNumberPlaceholder')}
                className="w-full bg-transparent border border-mist/50 focus:border-paper px-4 py-3 text-sm text-paper placeholder:text-mist outline-none transition-colors uppercase"
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-paper mb-2">{t('verifyPurchase.orderEmail')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('product.emailPlaceholder')}
                className="w-full bg-transparent border border-mist/50 focus:border-paper px-4 py-3 text-sm text-paper placeholder:text-mist outline-none transition-colors"
              />
            </div>

            {error && <p className="text-xs text-[#B5674F]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
            >
              {loading ? t('verifyPurchase.checking') : t('account.verify')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
