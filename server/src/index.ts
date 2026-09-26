import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import express from 'express'
import cors from 'cors'
import { checkoutRouter } from './routes/checkout.js'
import { webhookRouter } from './routes/webhooks.js'
import { isStripeConfigured } from './lib/stripe.js'
import { orderRepository, isUsingDatabase } from './data/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT ? Number(process.env.PORT) : 4242
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(cors({ origin: FRONTEND_URL }))

// IMPORTANT: the Stripe webhook route needs the raw, unparsed request body
// to verify the signature — it must be mounted with express.raw() BEFORE
// the global express.json() below, and matched by exact path so json()
// never touches it.
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRouter)

app.use(express.json())
app.use('/api', checkoutRouter)

app.get('/api/health', async (_req, res) => {
  res.json({
    ok: true,
    stripeConfigured: isStripeConfigured,
    printfulConfigured: Boolean(process.env.PRINTFUL_API_KEY && process.env.PRINTFUL_STORE_ID),
    printifyConfigured: Boolean(process.env.PRINTIFY_API_KEY && process.env.PRINTIFY_SHOP_ID),
    databaseConfigured: isUsingDatabase,
    databaseConnected: await orderRepository.ping(),
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
})
