import { useState, type FormEvent } from 'react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-black border-t border-line">
      <div className="max-w-content mx-auto px-5 md:px-8 py-24 text-center">
        <h2 className="font-display text-3xl md:text-5xl text-paper">Enter the dream.</h2>
        <p className="mt-4 text-sm text-mist max-w-md mx-auto">
          First access to new drops, restocks, and the occasional thought worth having.
        </p>

        {submitted ? (
          <p className="mt-8 text-sm text-paper">You&rsquo;re in. Welcome to WITD.</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex max-w-sm mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 bg-transparent border border-mist/50 focus:border-paper px-4 py-3 text-sm text-paper placeholder:text-mist outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
            >
              {loading ? '…' : 'Join'}
            </button>
          </form>
        )}
        {error && <p className="mt-4 text-xs text-[#B5674F]">{error}</p>}
      </div>
    </section>
  )
}
