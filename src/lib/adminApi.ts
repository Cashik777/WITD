const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4242'

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    credentials: 'include',
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`)
  return data
}

export const adminApi = {
  listProducts: () => request('/admin/products'),
  createProduct: (body: unknown) => request('/admin/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id: string, body: unknown) =>
    request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id: string) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  listOrders: () => request('/admin/orders'),
  uploadImage: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request('/admin/upload', { method: 'POST', body: form })
  },
}
