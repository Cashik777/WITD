import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { checkoutRouter } from './routes/checkout.js'
import { webhookRouter } from './routes/webhooks.js'
import { isStripeConfigured } from './lib/stripe.js'

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

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    stripeConfigured: isStripeConfigured,
    printfulConfigured: Boolean(process.env.PRINTFUL_API_KEY && process.env.PRINTFUL_STORE_ID),
    printifyConfigured: Boolean(process.env.PRINTIFY_API_KEY && process.env.PRINTIFY_SHOP_ID),
  })
})

app.listen(PORT, () => {
  console.log(`WITD server listening on http://localhost:${PORT}`)
  if (!isStripeConfigured) {
    console.warn('STRIPE_SECRET_KEY is not set — checkout will return 503 until it is added to server/.env')
  }
})
