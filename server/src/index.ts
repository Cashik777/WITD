import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { checkoutRouter } from './routes/checkout.js'
import { webhookRouter } from './routes/webhooks.js'
import { ordersRouter } from './routes/orders.js'
import { discordAuthRouter } from './routes/discordAuth.js'
import { productsRouter } from './routes/products.js'
import { categoriesRouter } from './routes/categories.js'
import { adminAuthRouter } from './routes/adminAuth.js'
import { adminRouter } from './routes/admin.js'
import { accountRouter } from './routes/account.js'
import { newsletterRouter } from './routes/newsletter.js'
import { isStripeConfigured } from './lib/stripe.js'
import { orderRepository, isUsingDatabase } from './data/db.js'
import { productRepository } from './data/productsDb.js'
import { isDiscordConfigured } from './lib/discord.js'
import { isAuthConfigured } from './lib/auth.js'
import { isCloudinaryConfigured } from './lib/cloudinary.js'
import { isEmailConfigured, isNewsletterConfigured } from './lib/email.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT ? Number(process.env.PORT) : 4242
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(cors({ origin: FRONTEND_URL, credentials: true }))
app.use(cookieParser())

// IMPORTANT: the Stripe webhook route needs the raw, unparsed request body
// to verify the signature — it must be mounted with express.raw() BEFORE
// the global express.json() below, and matched by exact path so json()
// never touches it.
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRouter)

app.use(express.json())
app.use('/api', checkoutRouter)
app.use('/api', ordersRouter)
app.use('/api', discordAuthRouter)
app.use('/api', productsRouter)
app.use('/api', categoriesRouter)
app.use('/api/admin', adminAuthRouter)
app.use('/api/admin', adminRouter)
app.use('/api', accountRouter)
app.use('/api', newsletterRouter)

app.get('/api/health', async (_req, res) => {
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

// Serve the built frontend (repo root `npm run build`) so one process on one
// port can host the whole site behind a reverse proxy — only used when the
// built assets exist; in local dev the Vite dev server (port 5173) handles
// the frontend instead and this block is a no-op.
const distPath = path.resolve(__dirname, '../../dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`WITD server listening on http://localhost:${PORT}`)
  if (!isStripeConfigured) {
    console.warn('STRIPE_SECRET_KEY is not set — checkout will return 503 until it is added to server/.env')
  }
  if (!isAuthConfigured) {
    console.warn('SESSION_SECRET is not set — admin login will return 503 until it is added to server/.env')
  }
})
