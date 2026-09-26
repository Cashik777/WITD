import Stripe from 'stripe'

// Reads STRIPE_SECRET_KEY at startup. If it's missing (e.g. running this
// project for the first time before any keys are added), we don't crash the
// whole server — we just disable the Stripe-dependent routes and tell the
// caller clearly, so the rest of the storefront (browsing, cart) still works
// during local development.
const secretKey = process.env.STRIPE_SECRET_KEY

export const stripe = secretKey
  ? new Stripe(secretKey, { apiVersion: '2024-06-20' })
  : null

export const isStripeConfigured = Boolean(secretKey)
