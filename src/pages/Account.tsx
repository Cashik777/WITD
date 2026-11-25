import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '@/hooks/useCustomerAuth'
import { formatPrice } from '@/lib/format'
import { Accordion } from '@/components/Accordion'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useLocale } from '@/hooks/useLocale'

interface AccountOrder {
  orderNumber: string
  paymentStatus: string
  fulfillmentStatus: string
  total: number
  currency: string
  createdAt: string
  trackingNumber: string | null
  trackingUrl: string | null
  items: { name: string; size: string; color: string; quantity: number }[]
}

function OrderHistory() {
  const { t } = useLocale()
  const [orders, setOrders] = useState<AccountOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [resuming, setResuming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/account/orders', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { orders: [] }))
      .then((data) => setOrders(data.orders ?? []))
      .finally(() => setLoading(false))
  }, [])

  const handleResume = async (orderNumber: string) => {
    setResuming(orderNumber)
    setError(null)
    try {
      const res = await fetch(`/api/checkout/resume/${orderNumber}`, { method: 'POST', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('account.couldNotResume'))
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : t('account.couldNotResume'))
      setResuming(null)
    }
  }

  if (loading) return <p className="text-sm text-mist">{t('account.loading')}</p>
  if (orders.length === 0) {
    return <p className="text-sm text-mist">{t('account.noOrders')}</p>
  }

  return (
    <div>
      <div className="border border-line divide-y divide-line">
        {orders.map((o) => {
          const pending = o.paymentStatus === 'pending'
          return (
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
                    {o.trackingNumber && (
                      <>
                        {' · '}
                        {o.trackingUrl ? (
                          <a
                            href={o.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 hover:text-paper"
                          >
                            {t('account.track', { number: o.trackingNumber })}
                          </a>
                        ) : (
                          o.trackingNumber
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-paper/60">
                {o.items.map((i) => `${i.name} (${i.color}/${i.size}) ×${i.quantity}`).join(', ')}
              </p>
              {pending && (
                <button
                  onClick={() => handleResume(o.orderNumber)}
                  disabled={resuming === o.orderNumber}
                  className="mt-3 px-5 py-2 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
                >
                  {resuming === o.orderNumber ? t('account.redirecting') : t('account.payNow')}
                </button>
              )}
            </div>
          )
        })}
      </div>
      {error && <p className="mt-3 text-xs text-[#B5674F]">{error}</p>}
    </div>
  )
}

const input =
  'w-full bg-transparent border border-mist/50 focus:border-paper px-4 py-3 text-sm text-paper placeholder:text-mist outline-none transition-colors'

function ProfileForm() {
  const { t } = useLocale()
  const { profile, updateProfile } = useCustomerAuth()
  const [firstName, setFirstName] = useState(profile.firstName ?? '')
  const [lastName, setLastName] = useState(profile.lastName ?? '')
  const [age, setAge] = useState(profile.age != null ? String(profile.age) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    const err = await updateProfile({
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      age: age.trim() ? Number(age) : null,
    })
    setSaving(false)
    if (err) setError(err)
    else setSaved(true)
  }

  return (
    <div className="mt-12 border-t border-line">
      <Accordion title={t('account.myProfile')}>
        <p className="text-xs text-mist mb-5">{t('account.profileOptional')}</p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <input placeholder={t('account.firstName')} value={firstName} onChange={(e) => setFirstName(e.target.value)} className={input} />
          <input placeholder={t('account.lastName')} value={lastName} onChange={(e) => setLastName(e.target.value)} className={input} />
          <input
            placeholder={t('account.age')}
            type="number"
            min={1}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={`${input} sm:col-span-1`}
          />
          {error && <p className="text-xs text-[#B5674F] sm:col-span-2">{error}</p>}
          {saved && !error && <p className="text-xs text-paper/60 sm:col-span-2">{t('account.saved')}</p>}
          <button
            type="submit"
            disabled={saving}
            className="sm:col-span-2 w-fit px-6 py-3 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
          >
            {saving ? t('account.saving') : t('account.save')}
          </button>
        </form>
      </Accordion>
    </div>
  )
}

function VerifyEmailForm() {
  const { t, path } = useLocale()
  const { pendingVerificationEmail, verifyEmail, resendCode, cancelVerification } = useCustomerAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)
    const err = await verifyEmail(code)
    setLoading(false)
    if (err) setError(err)
    // Freshly activated — send them to the shop rather than parking them on
    // an empty order-history page.
    else navigate(path('/shop'))
  }

  const handleResend = async () => {
    setResending(true)
    setError(null)
    setNotice(null)
    const err = await resendCode()
    setResending(false)
    if (err) setError(err)
    else setNotice(t('account.newCodeOnWay'))
  }

  return (
    <div className="max-w-sm mx-auto">
      <h2 className="text-sm text-paper mb-2">{t('account.checkYourEmail')}</h2>
      <p className="text-xs text-mist mb-6">
        {t('account.codeSentToBefore')} <span className="text-paper/80">{pendingVerificationEmail}</span>.{' '}
        {t('account.codeSentToAfter')}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          placeholder={t('account.sixDigitCode')}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className={`${input} tracking-[0.3em] text-center`}
        />
        {error && <p className="text-xs text-[#B5674F]">{error}</p>}
        {notice && <p className="text-xs text-paper/60">{notice}</p>}
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full py-3.5 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
        >
          {loading ? t('account.verifying') : t('account.verify')}
        </button>
      </form>
      <div className="mt-4 flex items-center justify-between text-xs">
        <button onClick={handleResend} disabled={resending} className="text-paper/60 underline underline-offset-4 hover:text-paper disabled:opacity-50">
          {resending ? t('account.sending') : t('account.resendCode')}
        </button>
        <button onClick={cancelVerification} className="text-paper/60 underline underline-offset-4 hover:text-paper">
          {t('account.useDifferentEmail')}
        </button>
      </div>
    </div>
  )
}

function AuthForms() {
  const { t, path } = useLocale()
  const { register, login, pendingVerificationEmail } = useCustomerAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (pendingVerificationEmail) return <VerifyEmailForm />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    if (mode === 'login') {
      const result = await login(email, password)
      setLoading(false)
      if (result === 'ok') navigate(path('/shop'))
      else if (result !== 'pending') setError(result)
    } else {
      const err = await register(email, password)
      setLoading(false)
      if (err) setError(err)
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex gap-6 mb-6 justify-center">
        <button
          onClick={() => setMode('login')}
          className={`text-xs tracking-widest uppercase pb-1 border-b ${mode === 'login' ? 'text-paper border-paper' : 'text-paper/50 border-transparent'}`}
        >
          {t('account.logIn')}
        </button>
        <button
          onClick={() => setMode('register')}
          className={`text-xs tracking-widest uppercase pb-1 border-b ${mode === 'register' ? 'text-paper border-paper' : 'text-paper/50 border-transparent'}`}
        >
          {t('account.createAccount')}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          placeholder={t('account.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
        <input
          type="password"
          required
          placeholder={mode === 'register' ? t('account.passwordMin') : t('account.password')}
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
          {loading ? t('account.pleaseWait') : mode === 'login' ? t('account.logIn') : t('account.createAccount')}
        </button>
      </form>
    </div>
  )
}

export default function Account() {
  const { t } = useLocale()
  useDocumentMeta(t('meta.accountTitle'))
  const { email, loading, logout } = useCustomerAuth()

  if (loading) return null

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-16 md:py-24">
      {email ? (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-paper">{t('account.yourOrders')}</h1>
              <p className="text-sm text-mist mt-1">{email}</p>
            </div>
            <button onClick={logout} className="text-xs tracking-widest uppercase text-paper/60 hover:text-paper">
              {t('account.logOut')}
            </button>
          </div>
          <OrderHistory />
          <ProfileForm />
        </div>
      ) : (
        <>
          <h1 className="font-display text-3xl md:text-4xl text-paper mb-10 text-center">{t('account.accountTitle')}</h1>
          <AuthForms />
        </>
      )}
    </div>
  )
}
