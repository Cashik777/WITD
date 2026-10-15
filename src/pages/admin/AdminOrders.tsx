import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/adminApi'
import { formatPrice } from '@/lib/format'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

interface AdminOrder {
  id: string
  orderNumber: string
  paymentStatus: string
  fulfillmentStatus: string
  customer: { email?: string }
  total: number
  currency: string
  createdAt: string
  trackingNumber: string | null
  trackingUrl: string | null
  items: { name: string; size: string; color: string; quantity: number }[]
}

const FULFILLMENT_STATUSES = ['pending', 'submitted', 'in_production', 'shipped', 'delivered', 'cancelled', 'failed']

const input = 'w-full bg-transparent border border-mist/50 focus:border-paper px-3 py-2 text-xs text-paper placeholder:text-mist outline-none transition-colors'

// Manual fallback for fulfillment status / tracking — the Printful webhook
// fills this in automatically, but this covers Printify orders (no webhook
// wired up yet), a missed webhook delivery, or correcting a mistake.
function EditOrderForm({ order, onSaved }: { order: AdminOrder; onSaved: (updated: AdminOrder) => void }) {
  const [fulfillmentStatus, setFulfillmentStatus] = useState(order.fulfillmentStatus)
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? '')
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const data = await adminApi.updateOrder(order.id, { fulfillmentStatus, trackingNumber, trackingUrl })
      onSaved(data.order)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-line grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-[10px] tracking-widest uppercase text-mist mb-1">Fulfillment Status</label>
        <select value={fulfillmentStatus} onChange={(e) => setFulfillmentStatus(e.target.value)} className={input}>
          {FULFILLMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[10px] tracking-widest uppercase text-mist mb-1">Tracking Number</label>
        <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className={input} />
      </div>
      <div>
        <label className="block text-[10px] tracking-widest uppercase text-mist mb-1">Tracking URL</label>
        <input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} className={input} />
      </div>
      {error && <p className="sm:col-span-3 text-xs text-[#B5674F]">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="sm:col-span-3 w-fit px-5 py-2 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

export default function AdminOrders() {
  useDocumentMeta('Orders — WITD Admin')
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    adminApi
      .listOrders()
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSaved = (updated: AdminOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    setEditingId(null)
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-paper mb-6">Orders</h1>

      {error && <p className="text-xs text-[#B5674F] mb-4">{error}</p>}
      {loading ? (
        <p className="text-sm text-mist">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-mist">No orders yet.</p>
      ) : (
        <div className="border border-line divide-y divide-line">
          {orders.map((o) => (
            <div key={o.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-paper">{o.orderNumber}</p>
                  <p className="text-xs text-mist">{o.customer.email ?? 'no email'} · {new Date(o.createdAt).toLocaleString()}</p>
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
              <button
                onClick={() => setEditingId(editingId === o.id ? null : o.id)}
                className="mt-2 text-[10px] tracking-widest uppercase text-paper/60 hover:text-paper underline underline-offset-4"
              >
                {editingId === o.id ? 'Cancel' : 'Edit Fulfillment'}
              </button>
              {editingId === o.id && <EditOrderForm order={o} onSaved={handleSaved} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
