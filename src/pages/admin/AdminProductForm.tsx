import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApi } from '@/lib/adminApi'
import type { Product } from '@/types/product'
import type { Category } from '@/types/category'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']
const AVAILABILITY: Product['availability'][] = ['in_stock', 'low_stock', 'sold_out', 'coming_soon']
const PROVIDERS: Product['fulfillmentProvider'][] = ['printful', 'printify', 'mock']

interface FormState {
  name: string
  slug: string
  description: string
  idea: string
  price: number
  priceUSD: number | null
  priceEUR: number | null
  currency: Product['currency']
  category: string
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
}

interface ColorImages {
  front: string
  back: string
}

const emptyProduct: FormState = {
  name: '',
  slug: '',
  description: '',
  idea: '',
  price: 0,
  priceUSD: null,
  priceEUR: null,
  currency: 'CAD',
  category: '',
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
}

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  useDocumentMeta(isEdit ? 'Edit Product — WITD Admin' : 'New Product — WITD Admin')

  const [form, setForm] = useState(emptyProduct)
  const [colorsInput, setColorsInput] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [colorImages, setColorImages] = useState<Record<string, ColorImages>>({})
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Colors are free-typed as a comma list; photo slots below are keyed by
  // the exact color string, so the slots only line up with the final
  // `colors` array once names here match what's typed above.
  const colorList = colorsInput.split(',').map((c) => c.trim()).filter(Boolean)

  useEffect(() => {
    adminApi.listCategories().then((data) => {
      const list = data.categories as Category[]
      setCategories(list)
      // Default a new product to the first available category rather than
      // leaving it blank — nothing downstream expects an empty category.
      if (!isEdit && list.length > 0) {
        setForm((f) => (f.category ? f : { ...f, category: list[0].name }))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        priceUSD: product.priceUSD,
        priceEUR: product.priceEUR,
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
      })
      setColorsInput(product.colors.join(', '))
      setTagsInput(product.tags.join(', '))
      setColorImages(
        Object.fromEntries(
          Object.entries(product.imagesByColor).map(([color, imgs]) => [
            color,
            { front: imgs[0] ?? '', back: imgs[1] ?? '' },
          ])
        )
      )
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

  const handleSlotUpload = async (color: string, slot: keyof ColorImages, file: File) => {
    const key = `${color}:${slot}`
    setUploadingKey(key)
    setError(null)
    try {
      const { url } = await adminApi.uploadImage(file)
      setColorImages((prev) => {
        const current = prev[color] ?? { front: '', back: '' }
        return { ...prev, [color]: { ...current, [slot]: url } }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploadingKey(null)
    }
  }

  const removeSlotImage = (color: string, slot: keyof ColorImages) => {
    setColorImages((prev) => {
      const current = prev[color] ?? { front: '', back: '' }
      return { ...prev, [color]: { ...current, [slot]: '' } }
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const colors = colorsInput.split(',').map((c) => c.trim()).filter(Boolean)
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
    const imagesByColor = Object.fromEntries(
      colors.map((c) => {
        const ci = colorImages[c] ?? { front: '', back: '' }
        return [c, [ci.front, ci.back].filter(Boolean)]
      })
    )
    const images = colors.length > 0 ? imagesByColor[colors[0]] ?? [] : []
    const hoverImage = images[1] ?? ''
    const payload = { ...form, colors, tags, images, hoverImage, imagesByColor }

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div>
            <label className={label}>Price (CAD)</label>
            <input required type="number" min={0} step="0.01" className={input} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </div>
          <div>
            <label className={label}>Price (USD)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="defaults to CAD"
              className={input}
              value={form.priceUSD ?? ''}
              onChange={(e) => setForm({ ...form, priceUSD: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </div>
          <div>
            <label className={label}>Price (EUR)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="defaults to CAD"
              className={input}
              value={form.priceEUR ?? ''}
              onChange={(e) => setForm({ ...form, priceEUR: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </div>
          <div>
            <label className={label}>Base Currency</label>
            <select className={input} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as Product['currency'] })}>
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <label className={label}>SKU</label>
            <input className={input} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Category</label>
            <select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories
                .filter((c) => !c.parentId)
                .flatMap((group) => [
                  <option key={group.id} value={group.name}>{group.name}</option>,
                  ...categories
                    .filter((sub) => sub.parentId === group.id)
                    .map((sub) => (
                      <option key={sub.id} value={sub.name}>&nbsp;&nbsp;— {sub.name}</option>
                    )),
                ])}
            </select>
            <p className="mt-1.5 text-xs text-mist">
              Need a new one? Add it on the <a href="/admin/categories" className="underline underline-offset-4">Categories</a> page first.
            </p>
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
          <div className="flex gap-2 flex-wrap">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="flex gap-6 flex-wrap">
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
          <label className={label}>Product Photos</label>
          <p className="text-xs text-mist mb-3">
            Upload a front (required) and back (optional) photo for each color — type colors above first.
          </p>
          {colorList.length === 0 ? (
            <p className="text-xs text-mist">Add colors above first — photo slots appear here per color.</p>
          ) : (
            <div className="space-y-4">
              {colorList.map((color) => {
                const ci = colorImages[color] ?? { front: '', back: '' }
                return (
                  <div key={color} className="border border-mist/30 p-3">
                    <p className="text-xs tracking-widest uppercase text-paper mb-2">{color}</p>
                    <div className="flex gap-4 flex-wrap">
                      {(['front', 'back'] as const).map((slot) => {
                        const url = ci[slot]
                        const key = `${color}:${slot}`
                        const isUploading = uploadingKey === key
                        return (
                          <div key={slot}>
                            <p className="text-[10px] tracking-widest uppercase text-mist mb-1">
                              {slot}
                              {slot === 'back' ? ' (optional)' : ''}
                            </p>
                            {url ? (
                              <div className="relative w-20 h-24 bg-[#151412]">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeSlotImage(color, slot)}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-paper text-black text-xs rounded-full"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center justify-center w-20 h-24 bg-[#151412] border border-dashed border-mist/40 text-[10px] text-mist text-center px-1 cursor-pointer">
                                {isUploading ? 'Uploading…' : 'Upload'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={isUploading}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleSlotUpload(color, slot, file)
                                    e.target.value = ''
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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
