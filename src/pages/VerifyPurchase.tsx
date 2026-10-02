import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

const ERROR_MESSAGES: Record<string, string> = {
  expired: 'That verification link expired. Please verify your purchase again.',
  not_found: "We couldn't confirm that order. Please verify your purchase again.",
  discord_failed: 'Discord declined the connection. Please try again.',
  missing_params: 'Something went wrong on the way back from Discord. Please try again.',
}

export default function VerifyPurchase() {
  useDocumentMeta('Verify Your Purchase — WITD')
  const [searchParams] = useSearchParams()
  const callbackSuccess = searchParams.get('success') === '1'
  const callbackError = searchParams.get('error')
  const channelUrl = searchParams.get('channel') || 'https://discord.com/channels/@me'

  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(callbackError ? ERROR_MESSAGES[callbackError] ?? 'Something went wrong.' : null)

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
      setError(data.error || 'Something went wrong.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-20 md:py-28">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="font-display text-4xl md:text-5xl text-paper">Verify Your Purchase</h1>
        <p className="mt-4 text-sm text-paper/70 leading-relaxed">
          Every WITD piece carries a way into the community — access that only opens once your purchase is
          confirmed. Enter your order number and the email you checked out with.
        </p>

        {callbackSuccess ? (
          <div className="mt-10 border border-line p-8">
            <p className="text-sm text-paper mb-4">You&rsquo;re in. Welcome to WITD.</p>
            <a
              href={channelUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-8 py-3.5 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors"
            >
              Open Discord
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-4 text-left">
            <div>
              <label className="block text-xs tracking-widest uppercase text-paper mb-2">Order Number</label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="WITD-XXXXXX"
                className="w-full bg-transparent border border-mist/50 focus:border-paper px-4 py-3 text-sm text-paper placeholder:text-mist outline-none transition-colors uppercase"
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-paper mb-2">Order Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent border border-mist/50 focus:border-paper px-4 py-3 text-sm text-paper placeholder:text-mist outline-none transition-colors"
              />
            </div>

            {error && <p className="text-xs text-[#B5674F]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
            >
              {loading ? 'Checking…' : 'Verify'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
