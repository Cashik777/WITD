import { useEffect, useState, type FormEvent } from 'react'
import { useCustomerAuth } from '@/hooks/useCustomerAuth'
import { formatPrice } from '@/lib/format'

interface AccountOrder {
  orderNumber: string
  paymentStatus: string
  fulfillmentStatus: string
  total: number
  currency: string
  createdAt: string
  trackingNumber: string | null
  items: { name: string; size: string; color: string; quantity: number }[]
}

function OrderHistory() {
  const [orders, setOrders] = useState<AccountOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/account/orders', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { orders: [] }))
      .then((data) => setOrders(data.orders ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-mist">Loading…</p>
  if (orders.length === 0) {
    return <p className="text-sm text-mist">No orders yet — anything you buy with this email will show up here.</p>
  }

  return (
    <div className="border border-line divide-y divide-line">
      {orders.map((o) => (
        <div key={o.orderNumber} className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-paper">{o.orderNumber}</p>
              <p className="text-xs text-mist">{new Date(o.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-paper">{formatPrice(o.total, o.currency)}</p>
              <p className="text-xs text-mist">
                {o.paymentStatus} · {o.fulfillmentStatus}
                {o.trackingNumber ? ` · ${o.trackingNumber}` : ''}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-paper/60">
            {o.items.map((i) => `${i.name} (${i.color}/${i.size}) ×${i.quantity}`).join(', ')}
          </p>
        </div>
      ))}
    </div>
  )
}

function AuthForms() {
  const { register, login } = useCustomerAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const err = mode === 'login' ? await login(email, password) : await register(email, password)
    setLoading(false)
    if (err) setError(err)
  }

  const input =
    'w-full bg-transparent border border-mist/50 focus:border-paper px-4 py-3 text-sm text-paper placeholder:text-mist outline-none transition-colors'

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex gap-6 mb-6 justify-center">
        <button
          onClick={() => setMode('login')}
          className={`text-xs tracking-widest uppercase pb-1 border-b ${mode === 'login' ? 'text-paper border-paper' : 'text-paper/50 border-transparent'}`}
        >
          Log In
        </button>
        <button
          onClick={() => setMode('register')}
          className={`text-xs tracking-widest uppercase pb-1 border-b ${mode === 'register' ? 'text-paper border-paper' : 'text-paper/50 border-transparent'}`}
        >
          Create Account
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
        <input
          type="password"
          required
          placeholder={mode === 'register' ? 'Password (min. 8 characters)' : 'Password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
        {error && <p className="text-xs text-[#B5674F]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}

export default function Account() {
  const { email, loading, logout } = useCustomerAuth()

  if (loading) return null

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-16 md:py-24">
      {email ? (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-paper">Your Orders</h1>
              <p className="text-sm text-mist mt-1">{email}</p>
            </div>
            <button onClick={logout} className="text-xs tracking-widest uppercase text-paper/60 hover:text-paper">
              Log Out
            </button>
          </div>
          <OrderHistory />
        </div>
      ) : (
        <>
          <h1 className="font-display text-3xl md:text-4xl text-paper mb-10 text-center">Account</h1>
          <AuthForms />
        </>
      )}
    </div>
  )
}
