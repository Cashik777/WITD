import { useState, type FormEvent } from 'react'

// No backend endpoint exists for restock notifications yet — this captures
// the email client-side and confirms, same as the newsletter form. Wire it
// to a real list (or the backend) before launch.
export function NotifyMeForm({ productName }: { productName: string }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <p className="mt-4 text-sm text-paper/70 border border-line px-4 py-3">
        You're on the list — we'll email you if {productName} comes back.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="Email for restock notification"
        className="flex-1 min-w-0 bg-transparent border border-mist/50 focus:border-paper px-4 py-3 text-sm text-paper placeholder:text-mist outline-none transition-colors"
      />
      <button
        type="submit"
        className="shrink-0 px-5 py-3 border border-paper text-paper text-xs tracking-widest uppercase hover:bg-paper hover:text-black transition-colors"
      >
        Notify Me
      </button>
    </form>
  )
}
