import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function AdminLogin() {
  const { email, login } = useAdminAuth()
  const navigate = useNavigate()
  const [formEmail, setFormEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (email) return <Navigate to="/admin" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const err = await login(formEmail, password)
    setLoading(false)
    if (err) setError(err)
    else navigate('/admin')
  }

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-24 md:py-32">
      <div className="max-w-sm mx-auto">
        <h1 className="font-display text-3xl text-paper mb-8">Admin</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs tracking-widest uppercase text-paper mb-2">Email</label>
            <input
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full bg-transparent border border-mist/50 focus:border-paper px-4 py-3 text-sm text-paper outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase text-paper mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-mist/50 focus:border-paper px-4 py-3 text-sm text-paper outline-none transition-colors"
            />
          </div>
          {error && <p className="text-xs text-[#B5674F]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
