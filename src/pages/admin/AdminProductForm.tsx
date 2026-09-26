import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApi } from '@/lib/adminApi'
import type { Product } from '@/types/product'

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const CATEGORIES: Product['category'][] = ['T-Shirts', 'Hoodies', 'Outerwear', 'Accessories']
const AVAILABILITY: Product['availability'][] = ['in_stock', 'low_stock', 'sold_out', 'coming_soon']
const PROVIDERS: Product['fulfillmentProvider'][] = ['printful', 'printify', 'mock']

interface FormState {
  name: string
  slug: string
  description: string
  idea: string
  price: number
  currency: Product['currency']
  category: Product['category']
  collection: string
  colors: string[]
  sizes: string[]
  availableSizes: string[]
  materials: string
  fit: string
  careInstructions: string
  sku: string
  tags: string[]
  featured: boolean
  new: boolean
  bestseller: boolean
  availability: Product['availability']
  fulfillmentProvider: Product['fulfillmentProvider']
  images: string[]
  hoverImage: string
}

const emptyProduct: FormState = {
  name: '',
  slug: '',
  description: '',
  idea: '',
  price: 0,
  currency: 'CAD',
  category: 'T-Shirts',
  collection: 'First Drop',
  colors: [],
  sizes: ALL_SIZES,
  availableSizes: [],
  materials: '',
  fit: '',
  careInstructions: '',
  sku: '',
  tags: [],
  featured: false,
  new: false,
  bestseller: false,
  availability: 'in_stock',
  fulfillmentProvider: 'mock',
  images: [],
  hoverImage: '',
}

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyProduct)
  const [colorsInput, setColorsInput] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit) return
    adminApi.listProducts().then((data) => {
      const product = (data.products as Product[]).find((p) => p.id === id)
      if (!product) return
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description,
        idea: product.idea ?? '',
        price: product.price,
        currency: product.currency,
        category: product.category,
        collection: product.collection,
        colors: product.colors,
        sizes: product.sizes,
        availableSizes: product.availableSizes,
        materials: product.materials,
        fit: product.fit,
        careInstructions: product.careInstructions,
        sku: product.sku,
        tags: product.tags,
        featured: product.featured,
        new: product.new,
        bestseller: product.bestseller,
        availability: product.availability,
        fulfillmentProvider: product.fulfillmentProvider,
        images: product.images,
        hoverImage: product.hoverImage ?? '',
      })
      setColorsInput(product.colors.join(', '))
      setTagsInput(product.tags.join(', '))
    })
  }, [id, isEdit])

  const toggleSize = (size: string) => {
    setForm((f) => ({
      ...f,
      availableSizes: f.availableSizes.includes(size)
        ? f.availableSizes.filter((s) => s !== size)
        : [...f.availableSizes, size],
    }))
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const { url } = await adminApi.uploadImage(file)
        urls.push(url)
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls], hoverImage: f.hoverImage || urls[0] }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeImage = (url: string) => {
    setForm((f) => ({ ...f, images: f.images.filter((i) => i !== url) }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const colors = colorsInput.split(',').map((c) => c.trim()).filter(Boolean)
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
    // Simple default: the same uploaded image set applies to every color.
    // Fine for a first pass — swap in per-color uploads later if needed.
    const imagesByColor = Object.fromEntries(colors.map((c) => [c, form.images]))
    const payload = { ...form, colors, tags, imagesByColor }

    try {
      if (isEdit) {
        await adminApi.updateProduct(id!, payload)
      } else {
        await adminApi.createProduct(payload)
      }
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full bg-transparent border border-mist/50 focus:border-paper px-3 py-2.5 text-sm text-paper outline-none transition-colors'
  const label = 'block text-xs tracking-widest uppercase text-paper mb-1.5'

  return (
    <div>
      <h1 className="font-display text-2xl text-paper mb-6">{isEdit ? 'Edit Product' : 'New Product'}</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Name</label>
            <input required className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className={label}>Slug (blank = auto)</label>
            <input className={input} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
        </div>

        <div>
          <label className={label}>Description</label>
          <textarea className={input} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className={label}>The Idea (optional editorial blurb)</label>
          <textarea className={input} rows={2} value={form.idea} onChange={(e) => setForm({ ...form, idea: e.target.value })} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={label}>Price</label>
            <input required type="number" min={0} step="0.01" className={input} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </div>
          <div>
            <label className={label}>Currency</label>
            <select className={input} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as Product['currency'] })}>
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className={label}>SKU</label>
            <input className={input} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Category</label>
            <select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Product['category'] })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Collection</label>
            <input className={input} value={form.collection} onChange={(e) => setForm({ ...form, collection: e.target.value })} />
          </div>
        </div>

        <div>
          <label className={label}>Colors (comma-separated)</label>
          <input className={input} placeholder="Black, White, Dark Stone" value={colorsInput} onChange={(e) => setColorsInput(e.target.value)} />
        </div>

        <div>
          <label className={label}>Available Sizes</label>
          <div className="flex gap-2">
            {ALL_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSize(s)}
                className={`px-3 py-1.5 text-xs border ${form.availableSizes.includes(s) ? 'bg-paper text-black border-paper' : 'border-mist/50 text-paper/70'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Materials</label>
            <input className={input} value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} />
          </div>
          <div>
            <label className={label}>Fit</label>
            <input className={input} value={form.fit} onChange={(e) => setForm({ ...form, fit: e.target.value })} />
          </div>
        </div>
        <div>
          <label className={label}>Care Instructions</label>
          <input className={input} value={form.careInstructions} onChange={(e) => setForm({ ...form, careInstructions: e.target.value })} />
        </div>
        <div>
          <label className={label}>Tags (comma-separated)</label>
          <input className={input} value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Availability</label>
            <select className={input} value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value as Product['availability'] })}>
              {AVAILABILITY.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Fulfillment Provider</label>
            <select className={input} value={form.fulfillmentProvider} onChange={(e) => setForm({ ...form, fulfillmentProvider: e.target.value as Product['fulfillmentProvider'] })}>
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {(['featured', 'new', 'bestseller'] as const).map((flag) => (
            <label key={flag} className="flex items-center gap-2 text-sm text-paper/80 cursor-pointer">
              <input
                type="checkbox"
                checked={form[flag]}
                onChange={(e) => setForm({ ...form, [flag]: e.target.checked })}
                className="w-4 h-4 accent-paper"
              />
              {flag}
            </label>
          ))}
        </div>

        <div>
          <label className={label}>Images</label>
          <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} className="text-sm text-paper/70" />
          {uploading && <p className="text-xs text-mist mt-1">Uploading…</p>}
          {form.images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {form.images.map((url) => (
                <div key={url} className="relative w-20 h-24 bg-[#151412]">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-paper text-black text-xs rounded-full"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-mist mt-2">
            The same image set is applied to every color listed above — assign different photos per color later if
            needed.
          </p>
        </div>

        {error && <p className="text-xs text-[#B5674F]">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-6 py-3 border border-mist/50 text-paper text-xs tracking-widest uppercase hover:border-paper transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
