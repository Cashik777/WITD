# WITD — Wake In The Dream

Storefront + ecommerce backend for the WITD streetwear brand. Two apps in this repo:

```
/            Frontend — Vite + React + TypeScript + Tailwind (the storefront)
/server      Backend  — Express + Stripe + fulfillment-provider abstraction
```

## Running it locally

Two terminals:

```bash
# 1) Backend
cd server
npm install
cp .env.example .env      # then fill in your Stripe TEST-mode keys (see below)
npm run dev                # http://localhost:4242

# 2) Frontend
npm install
npm run dev                 # http://localhost:5173
```

The frontend proxies `/api/*` to `http://localhost:4242` in dev (see `vite.config.ts`), and calls it directly via
`VITE_API_BASE_URL` in production — set that env var on whatever host serves the frontend.

This project was written by hand in a sandboxed environment with no network access, so `npm install` has **not**
been run against it yet. Do that first and fix up anything a fresh `npm install` surfaces (dependency versions
drift over time) before relying on it.

---

## What's implemented

**Storefront (frontend)**
- All 9 pages from the brief: Home, Shop, Product Detail, About, Community, Cart, Checkout, Search, 404 (plus
  Privacy/Terms/Account stubs and an Order Confirmation page for the Stripe redirect).
- Centralized product data (`src/data/products.ts`) — 8 mock First Drop tees, typed via `src/types/product.ts`.
  Swap the array for a real API/CMS call later; nothing else needs to change.
- Scalable filtering/sorting (category, size, color, collection, availability, price) with removable chips, a
  desktop sidebar and a mobile filter drawer.
- Cart with a slide-out drawer + full cart page, persisted to `localStorage` (persistence only — see below).
- Product page with gallery, size/color selection, a size guide modal, accordions, related products, and
  recently-viewed (also `localStorage`, non-authoritative).
- Real product search (name/category/collection/tags).
- The WITD symbol as a reusable component (`src/components/WitdSymbol.tsx`) plus static placeholders at
  `/public/assets/brand/witd-symbol.svg` and `witd-logo.svg` — swap those files for final production artwork any
  time without touching code.
- Mobile-first responsive layout, reduced-motion support, focus states.

**Backend (payments + fulfillment architecture)**
- `POST /api/create-checkout-session` — validates every product id, size, color and quantity against the
  server's own catalog (`server/src/data/products.ts`), computes price server-side, creates a Stripe Checkout
  Session, and only *then* redirects the browser to Stripe. The browser's prices are never trusted.
- `POST /api/webhooks/stripe` — verifies the Stripe signature, is idempotent (duplicate events and duplicate
  `paid` transitions are both guarded against), and only triggers fulfillment after payment is confirmed.
- `FulfillmentProvider` interface with three implementations: `PrintfulProvider`, `PrintifyProvider` (both real
  API calls, gated behind their env vars), and `MockProvider` (used automatically when no real provider is
  configured, so you can exercise the whole paid → fulfilled flow without any real POD account).
- `Order` model + a swappable `OrderRepository` (in-memory today; the interface is what a Postgres/Supabase
  implementation would plug into — see the comment at the top of `server/src/data/db.ts`).
- `.env.example` in both `/` and `/server` — no real keys anywhere in the repo, `.env` is git-ignored.

---

## What remains before this can go live

1. **Real product photography.** Every image path (`/products/*.jpg`, `/hero/*.jpg`) is a placeholder — the code
   comments in `src/data/products.ts` and `Hero.tsx` mark exactly where to drop real files in.
2. **Real Printful/Printify variant mappings.** `providerVariantMappings` on each product (both the frontend and
   server copies) is empty — fill these in once real POD products exist, and remove the `'PLACEHOLDER'`
   variant ids in `PrintfulProvider.ts` / `PrintifyProvider.ts`.
3. **One shared product data source.** Right now the frontend (`src/data/products.ts`) and backend
   (`server/src/data/products.ts`) are two hand-maintained copies with the same shape. Fine for this stage;
   before launch, point both at one real database (or a shared package) so they can't drift out of sync.
4. **A real database for orders.** Swap `InMemoryOrderRepository` in `server/src/data/db.ts` for a
   Postgres/Supabase-backed implementation of the same `OrderRepository` interface — orders currently vanish on
   every server restart.
5. **Final brand artwork.** The WITD symbol/logo SVGs are geometric placeholders matching the brief's
   description (three arcs for R/G/B perception, center bar for the observer) — swap for production files.
6. **Build verification.** This was written without the ability to run `npm install` — do a full `npm install &&
   npm run build` on both apps and fix anything a real TypeScript/bundler pass flags.

## Environment variables you'll eventually need

**`/server/.env`** (never commit this):
```
STRIPE_SECRET_KEY=sk_test_...        # Stripe Dashboard → Developers → API keys (use a TEST key first)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...      # from `stripe listen` locally, or the Dashboard webhook endpoint in production
PRINTFUL_API_KEY=                    # Printful → Settings → Stores → API
PRINTFUL_STORE_ID=
PRINTIFY_API_KEY=                    # Printify → My Profile → Connections → API
PRINTIFY_SHOP_ID=
PORT=4242
FRONTEND_URL=http://localhost:5173   # used to build Stripe success/cancel redirect URLs
```

**`/.env`** (frontend):
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...   # not required yet — Stripe Checkout is hosted, not embedded
VITE_API_BASE_URL=http://localhost:4242
```

### Testing the payment flow locally
1. Fill in a Stripe **test-mode** secret key in `server/.env`.
2. Run `stripe listen --forward-to localhost:4242/api/webhooks/stripe` (Stripe CLI) and copy the `whsec_...` it
   prints into `STRIPE_WEBHOOK_SECRET`.
3. Add something to cart → Checkout → use Stripe's test card `4242 4242 4242 4242`, any future expiry/CVC.
4. You should land on `/order-confirmation`, and the server console should log a `[MockProvider]` line (or a real
   Printful/Printify call, once those are configured) confirming fulfillment was triggered.

Never send real payment or fulfillment credentials through this repo — `.env` files are git-ignored specifically
so that doesn't happen by accident.
