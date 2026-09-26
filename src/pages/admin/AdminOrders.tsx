import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/adminApi'
import { formatPrice } from '@/lib/format'

interface AdminOrder {
  id: string
  orderNumber: string
  paymentStatus: string
  fulfillmentStatus: string
  customer: { email?: string }
  total: number
  currency: string
  createdAt: string
  items: { name: string; size: string; color: string; quantity: number }[]
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi
      .listOrders()
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

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
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-paper/60">
                {o.items.map((i) => `${i.name} (${i.color}/${i.size}) ×${i.quantity}`).join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
