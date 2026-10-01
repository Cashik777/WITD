import { Router } from 'express'
import multer from 'multer'
import { randomUUID } from 'crypto'
import { requireAdmin } from '../lib/requireAdmin.js'
import { productRepository } from '../data/productsDb.js'
import { orderRepository, isUsingDatabase } from '../data/db.js'
import { categoryRepository } from '../data/categoriesDb.js'
import { isCloudinaryConfigured, uploadImage } from '../lib/cloudinary.js'
import { isStripeConfigured } from '../lib/stripe.js'
import { isDiscordConfigured } from '../lib/discord.js'
import { isAuthConfigured } from '../lib/auth.js'
import { isEmailConfigured, isNewsletterConfigured } from '../lib/email.js'
import type { Product } from '../models/Product.js'

export const adminRouter = Router()
adminRouter.use(requireAdmin)

adminRouter.get('/health', async (_req, res) => {
  res.json({
    ok: true,
    stripeConfigured: isStripeConfigured,
    printfulConfigured: Boolean(process.env.PRINTFUL_API_KEY && process.env.PRINTFUL_STORE_ID),
    printifyConfigured: Boolean(process.env.PRINTIFY_API_KEY && process.env.PRINTIFY_SHOP_ID),
    databaseConfigured: isUsingDatabase,
    databaseConnected: await orderRepository.ping(),
    productsDbConnected: await productRepository.ping(),
    discordConfigured: isDiscordConfigured,
    authConfigured: isAuthConfigured,
    uploadsConfigured: isCloudinaryConfigured,
    emailConfigured: isEmailConfigured,
    newsletterConfigured: isNewsletterConfigured,
  })
})

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Builds a full Product from a partial admin-form payload, filling in
// reasonable defaults for anything omitted — the admin form doesn't force
// every field, but the storefront (and checkout validation) assumes all of
// them exist.
function productFromBody(body: Record<string, unknown>, existing?: Product): Omit<Product, 'createdAt' | 'updatedAt'> {
  const name = (body.name as string) ?? existing?.name ?? ''
  return {
    id: existing?.id ?? (body.id as string) ?? randomUUID(),
    slug: (body.slug as string) || existing?.slug || slugify(name),
    name,
    description: (body.description as string) ?? existing?.description ?? '',
    idea: (body.idea as string) ?? existing?.idea,
    price: Number(body.price ?? existing?.price ?? 0),
    priceUSD:
      body.priceUSD !== undefined && body.priceUSD !== null && body.priceUSD !== ''
        ? Number(body.priceUSD)
        : (existing?.priceUSD ?? null),
    currency: (body.currency as Product['currency']) ?? existing?.currency ?? 'CAD',
    category: (body.category as string) ?? existing?.category ?? '',
    collection: (body.collection as string) ?? existing?.collection ?? 'First Drop',
    images: (body.images as string[]) ?? existing?.images ?? [],
    hoverImage: (body.hoverImage as string) ?? existing?.hoverImage,
    imagesByColor: (body.imagesByColor as Record<string, string[]>) ?? existing?.imagesByColor ?? {},
    colors: (body.colors as string[]) ?? existing?.colors ?? [],
    sizes: (body.sizes as string[]) ?? existing?.sizes ?? ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    availableSizes: (body.availableSizes as string[]) ?? existing?.availableSizes ?? [],
    materials: (body.materials as string) ?? existing?.materials ?? '',
    fit: (body.fit as string) ?? existing?.fit ?? '',
    careInstructions: (body.careInstructions as string) ?? existing?.careInstructions ?? '',
    sku: (body.sku as string) ?? existing?.sku ?? '',
    tags: (body.tags as string[]) ?? existing?.tags ?? [],
    featured: Boolean(body.featured ?? existing?.featured ?? false),
    new: Boolean(body.new ?? existing?.new ?? false),
    bestseller: Boolean(body.bestseller ?? existing?.bestseller ?? false),
    availability: (body.availability as Product['availability']) ?? existing?.availability ?? 'in_stock',
    fulfillmentProvider: (body.fulfillmentProvider as Product['fulfillmentProvider']) ?? existing?.fulfillmentProvider ?? 'mock',
    providerProductId: (body.providerProductId as string) ?? existing?.providerProductId ?? null,
    providerVariantMappings: (body.providerVariantMappings as Product['providerVariantMappings']) ?? existing?.providerVariantMappings ?? {},
  }
}

adminRouter.get('/products', async (_req, res) => {
  const products = await productRepository.findAll()
  res.json({ products })
})

adminRouter.post('/products', async (req, res) => {
  try {
    const draft = productFromBody(req.body)
    if (!draft.name || !draft.price) {
      return res.status(400).json({ error: 'Name and price are required.' })
    }
    const now = new Date().toISOString()
    const product = await productRepository.create({ ...draft, createdAt: now, updatedAt: now })
    res.status(201).json({ product })
  } catch (err) {
    console.error('Create product failed', err)
    res.status(500).json({ error: 'Could not create product — check the slug is unique.' })
  }
})

adminRouter.put('/products/:id', async (req, res) => {
  const existing = await productRepository.findById(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Product not found.' })
  try {
    const patch = productFromBody(req.body, existing)
    const updated = await productRepository.update(req.params.id, patch)
    res.json({ product: updated })
  } catch (err) {
    console.error('Update product failed', err)
    res.status(500).json({ error: 'Could not update product.' })
  }
})

adminRouter.delete('/products/:id', async (req, res) => {
  const removed = await productRepository.remove(req.params.id)
  if (!removed) return res.status(404).json({ error: 'Product not found.' })
  res.json({ ok: true })
})

adminRouter.post('/upload', upload.single('file'), async (req, res) => {
  if (!isCloudinaryConfigured) {
    return res.status(503).json({ error: 'Image uploads are not configured yet.' })
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' })
  }
  try {
    const url = await uploadImage(req.file.buffer)
    res.json({ url })
  } catch (err) {
    console.error('Image upload failed', err)
    res.status(500).json({ error: 'Upload failed. Please try again.' })
  }
})

adminRouter.get('/orders', async (_req, res) => {
  const orders = await orderRepository.findAll()
  res.json({ orders })
})

// Deliberately only for abandoned/test checkouts, not a general "cancel an
// order" tool — paymentStatus !== 'pending' means Stripe actually processed
// something for it (paid, refunded, etc.), and deleting that row would
// destroy real accounting history rather than just clearing clutter.
adminRouter.delete('/orders/:id', async (req, res) => {
  const order = await orderRepository.findById(req.params.id)
  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.paymentStatus !== 'pending') {
    return res.status(409).json({ error: 'Only pending (abandoned/test) orders can be deleted.' })
  }
  const removed = await orderRepository.remove(req.params.id)
  res.json({ removed })
})

adminRouter.get('/categories', async (_req, res) => {
  const categories = await categoryRepository.findAll()
  res.json({ categories })
})

adminRouter.post('/categories', async (req, res) => {
  const name = String(req.body?.name ?? '').trim()
  if (!name) return res.status(400).json({ error: 'Name is required.' })
  const parentId = req.body?.parentId ? String(req.body.parentId) : null
  try {
    const category = await categoryRepository.create({ name, slug: slugify(name), parentId })
    res.status(201).json({ category })
  } catch (err) {
    console.error('Create category failed', err)
    res.status(500).json({ error: 'Could not create category — check the name is unique.' })
  }
})

adminRouter.put('/categories/:id', async (req, res) => {
  const name = req.body?.name !== undefined ? String(req.body.name).trim() : undefined
  const parentId = req.body?.parentId !== undefined ? (req.body.parentId ? String(req.body.parentId) : null) : undefined
  if (parentId === req.params.id) {
    return res.status(400).json({ error: 'A category cannot be its own parent.' })
  }
  try {
    const updated = await categoryRepository.update(req.params.id, {
      ...(name !== undefined ? { name, slug: slugify(name) } : {}),
      ...(parentId !== undefined ? { parentId } : {}),
    })
    if (!updated) return res.status(404).json({ error: 'Category not found.' })
    res.json({ category: updated })
  } catch (err) {
    console.error('Update category failed', err)
    res.status(500).json({ error: 'Could not update category.' })
  }
})

adminRouter.delete('/categories/:id', async (req, res) => {
  const target = await categoryRepository.findById(req.params.id)
  if (!target) return res.status(404).json({ error: 'Category not found.' })

  // Product.category stores the category *name* (matching the original
  // seed data), not its id — simple and human-readable, at the cost of a
  // product becoming orphaned if a category is later renamed rather than
  // recreated. Fine at this catalog's scale.
  const products = await productRepository.findAll()
  if (products.some((p) => p.category === target.name)) {
    return res.status(409).json({ error: 'Move or reassign products out of this category before deleting it.' })
  }
  const categories = await categoryRepository.findAll()
  if (categories.some((c) => c.parentId === req.params.id)) {
    return res.status(409).json({ error: 'Delete or reassign subcategories before deleting this category.' })
  }
  await categoryRepository.remove(req.params.id)
  res.json({ ok: true })
})
