import { useState, type FormEvent } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4242'

type Result = { inviteUrl: string } | { error: string } | null

export default function VerifyPurchase() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`${API_BASE}/api/verify-purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email }),
      })
      const data = await res.json()
      setResult(res.ok ? { inviteUrl: data.inviteUrl } : { error: data.error || 'Something went wrong.' })
    } catch {
      setResult({ error: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-20 md:py-28">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="font-display text-4xl md:text-5xl text-paper">Verify Your Purchase</h1>
        <p className="mt-4 text-sm text-paper/70 leading-relaxed">
          Every WITD piece carries a way into the community — not a link anyone can share, one that only opens once
          your purchase is confirmed. Enter your order number and the email you checked out with.
        </p>

        {result && 'inviteUrl' in result ? (
          <div className="mt-10 border border-line p-8">
            <p className="text-sm text-paper mb-4">You&rsquo;re verified.</p>
            <a
              href={result.inviteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-8 py-3.5 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors"
            >
              Join the Discord
            </a>
            <p className="mt-4 text-xs text-mist">This link works once — don&rsquo;t share it.</p>
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

            {result && 'error' in result && <p className="text-xs text-[#B5674F]">{result.error}</p>}

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
