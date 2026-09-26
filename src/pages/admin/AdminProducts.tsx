import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '@/lib/adminApi'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/types/product'

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    adminApi
      .listProducts()
      .then((data) => setProducts(data.products))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return
    try {
      await adminApi.deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-paper">Products</h1>
        <Link
          to="/admin/products/new"
          className="px-5 py-2.5 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors"
        >
          + New Product
        </Link>
      </div>

      {error && <p className="text-xs text-[#B5674F] mb-4">{error}</p>}
      {loading ? (
        <p className="text-sm text-mist">Loading…</p>
      ) : (
        <div className="border border-line divide-y divide-line">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 px-4 py-3">
              <div className="w-12 h-14 bg-[#151412] shrink-0 overflow-hidden">
                {p.images[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-paper truncate">{p.name}</p>
                <p className="text-xs text-mist">
                  {p.category} · {p.availability} · {formatPrice(p.price, p.currency)}
                </p>
              </div>
              <Link
                to={`/admin/products/${p.id}/edit`}
                className="text-xs text-paper underline underline-offset-4 hover:text-paper/70"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(p.id, p.name)}
                className="text-xs text-[#B5674F] underline underline-offset-4 hover:text-[#B5674F]/70"
              >
                Delete
              </button>
            </div>
          ))}
          {products.length === 0 && <p className="px-4 py-6 text-sm text-mist">No products yet.</p>}
        </div>
      )}
    </div>
  )
}
