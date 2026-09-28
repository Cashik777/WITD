# WITD — Wake In The Dream

Independent streetwear ecommerce storefront. Brand voice: mysterious, minimal, premium, philosophical,
slightly futuristic — never psychedelic, never generic "AI fashion brand," never neon/crypto/gaming-site
looking. Hierarchy is BRAND → WORLD → PRODUCT → PURCHASE, but checkout UX must stay best-in-class.

Talk to the user in Russian. Everything in the repo (UI copy, code, comments, commits) stays in English.

## Stack

- Root: Vite + React 18 + TypeScript + Tailwind + react-router-dom (the storefront).
- `server/`: Express + Stripe + TypeScript (payments + fulfillment). Dev proxies `/api` → `:4242`.
- Products live only in `src/data/products.ts` (frontend) and `server/src/data/products.ts` (backend
  price/variant validation copy) — never hardcode product data in a page. The two catalogs are a known,
  intentional duplication until there's a real database; see the comment at the top of each file.
- Shipping/returns policy is centralized in `src/lib/store.ts` (`calculateShipping`, `amountToFreeShipping`)
  — read from there, never restate `$150`/`$12`/`14 days` as literals on a page.

## Brand system

- Palette: near-black `#0B0B0A`, off-white `#F4F2EC`, gray `#8F8B82`, line `#26251F`. Fonts: Fraunces
  (display/headings), Space Grotesk (UI). Almost no accent color.
- Symbol: `WitdSymbol.tsx` + `public/assets/brand/witd-symbol.svg` / `witd-logo.svg` — four-letter
  eye/observer mark, RGB arcs = perception, black bar = pupil. These are placeholders for a final logo;
  keep the concept, don't genericize it.
- Product photography is SVG silhouette placeholders at `public/assets/products/{color}-{front,back}.svg`
  (one pair per color, reused across products), wired through `Product.imagesByColor`. Swap these files (or
  point `imagesByColor` at real photography) when real photos exist — nothing else needs to change. Hero
  background is likewise a placeholder SVG at `public/assets/hero/witd-hero.svg`.

## Status (2026-09-26)

Found a pre-built `witd-storefront.zip` in the user's Downloads and unzipped it into this directory rather
than building from scratch (per this project's standing rule: always check for existing code first — see
step 0 of the original task brief if you need the full spec again). Since then, in one session:

- Ran `npm install` + `npm run build` in both `/` and `/server`, fixed the one real gap (missing
  `@types/node` for `vite.config.ts`'s use of `path`/`__dirname`) — both now build clean.
- Full manual QA pass (desktop + mobile widths) against the original 6-section spec surfaced real gaps
  between what the code claimed to implement (per its own README) and what it actually did. Fixed:
  - **Product/hero images were completely broken** (`/products/*.jpg` paths pointing at files that never
    existed) — generated real SVG silhouette placeholders and an `imagesByColor` field so the gallery
    actually updates when you change color (it didn't before — color and gallery state weren't connected).
  - **Quick Add on product cards was auto-selecting the first available size** — an explicit "never do
    this" rule in the brief (Baymard: don't guess size on the customer's behalf). Now opens an inline size
    picker; nothing is added until a size is explicitly clicked.
  - **Filters had no counts and never disabled empty options**, and the category nav showed
    Hoodies/Outerwear/Accessories tabs with zero products in them. Added `countByOption` in
    `src/lib/filters.ts`, wired through `FilterPanel`/`FilterDrawer`, and the Shop page category ribbon
    now only lists categories that actually have stock.
  - **Add to Cart button didn't do the "Select a Size" → "Add to Cart — $45" transform** the brief called
    for — it just said "Add to Cart" always and relied on a separate error message.
  - Missing entirely: `src/lib/store.ts` (shipping/returns were hardcoded independently in `CartPage.tsx`
    and `Checkout.tsx`, drifting risk), the top announcement bar ("Free shipping over $150 / Free 14-day
    returns"), the cart drawer's free-shipping progress bar / "Added: …" plaquette / "Pairs well with" /
    direct-to-`/checkout` button with total / Continue Shopping & View Full Cart links, the checkout page's
    Cart→Details→Payment→Done step indicator and mobile-collapsible order summary, the
    `PAYMENTS_NOT_OPEN_MESSAGE` copy, sold-out products' "Notify Me" form, and the reviews layer
    (`src/data/reviews.ts`, honest "No reviews yet" state). All added.
  - Sticky mobile buy bar (`StickyMobileBuyBar.tsx`) implemented with a scroll-position `getBoundingClientRect`
    check, not an `IntersectionObserver` — the brief specifically flagged that an observer's callback lags
    behind a fast mobile swipe and the bar fails to appear.
  - Mobile product gallery: swipeable snap-scroll track with dots, replacing a thumbnail-grid-only layout
    that had no mobile-specific treatment.
- Verified end-to-end via DOM/JS inspection (the in-session browser screenshot tool was unreliable this
  session — rendered a tiny/blank viewport regardless of resize — so verification leaned on
  `get_page_text`/`read_page`/`javascript_exec` instead of visual screenshots): home → shop (filters +
  counts) → product (color swap, size selection, button transform, notify-me on a sold-out product) →
  quick add (size picker, no auto-select) → cart drawer (added banner, shipping progress, pairs-well-with,
  checkout button) → checkout (steps, mobile collapsible summary, "payments not open" message) → mobile
  widths (filter drawer, swipe gallery, sticky buy bar). All confirmed working.
- Pushed to `https://github.com/Cashik777/WITD` (`main`), commit `5a58a93`.

## Update (2026-09-26, same day)

- **Final logo swapped in.** User provided the real WITD mark (as a PDF, then as a clean `Finish.svg`).
  Extracted the exact path data and replaced the placeholder arcs in `WitdSymbol.tsx`,
  `public/assets/brand/witd-symbol.svg` (also the favicon), and `witd-logo.svg` (symbol + wordmark
  lockup). Colors are the real fixed brand colors now (`#ec1c24` red, `#3f48cb` blue, `#6bff00` green,
  `#000` black) — no longer `currentColor`, since this is a fixed-identity mark. Pushed as commit
  `16b87e7`.
- **Real payment/fulfillment keys were provided in chat and written to `server/.env`** (gitignored, not
  committed — verified). Backend restarted and confirms `stripeConfigured: true`.
  - **STRIPE_SECRET_KEY is a LIVE key (`sk_live_...`), not test-mode.** The user pasted this directly in
    chat without specifying test vs. live. This means `/api/create-checkout-session` will create *real*
    Stripe Checkout Sessions capable of processing real charges — Stripe's test card (4242 4242 4242 4242)
    from the README's local-testing instructions will NOT work against it (that only works with
    `sk_test_...`). **Do not run an end-to-end checkout test against this key** without the user explicitly
    confirming they want a real transaction, or until/unless they swap in a `sk_test_...` key instead.
    `STRIPE_PUBLISHABLE_KEY` and `STRIPE_WEBHOOK_SECRET` were not provided — webhook signature
    verification (and therefore fulfillment-on-payment) will not work until `STRIPE_WEBHOOK_SECRET` is set
    (see README's "Testing the payment flow locally" section for how to get one via `stripe listen`).
  - `PRINTFUL_API_KEY` and `PRINTIFY_API_KEY` were provided and written in, but `PRINTFUL_STORE_ID` and
    `PRINTIFY_SHOP_ID` were not — per `server/src/lib/fulfillment/index.ts`, both providers require *both*
    the key and the id to activate, so fulfillment still falls back to `MockProvider` until those ids are
    supplied. `providerVariantMappings` are also still all placeholders regardless.
  - These keys were pasted as plaintext chat messages — worth a heads-up to the user that, if this
    conversation is ever shared or exported, the live Stripe key in particular should be rotated from the
    Stripe Dashboard rather than assumed safe.

## Next steps

1. Confirm the Stripe key situation above (live vs. test) before treating checkout as ready to exercise
   end-to-end. Supply `STRIPE_WEBHOOK_SECRET`, `PRINTFUL_STORE_ID`, `PRINTIFY_SHOP_ID` when available.
2. Real product photography and hero image — still placeholders (logo/symbol is now final, see above).
3. Real Printful/Printify variant mappings (`providerVariantMappings` is `{}`/`PLACEHOLDER` everywhere) —
   fill in once real POD products exist.
4. One shared product data source instead of the two hand-maintained catalog copies (frontend + server).
5. A real database for orders — `InMemoryOrderRepository` in `server/src/data/db.ts` loses everything on
   restart; swap in a Postgres/Supabase-backed implementation of the same `OrderRepository` interface.
6. Stripe/Printful/Printify keys are now connected (see the 2026-09-26 update above for exactly what's set
   and what's missing) — this reverses the original "don't connect yet" instruction, but only because the
   user explicitly handed over keys unprompted. Keep the general rule for anything *not* explicitly
   provided: don't go proactively asking for more keys/credentials in a given session unless told to.

## Update (2026-09-28) — the site is now live on Render at wakeinthedream.com

Deployed to Render with a Postgres (Neon) backend, real payment/fulfillment/Discord/Cloudinary keys, a full
admin panel (product CRUD with Cloudinary image upload, category/subcategory management, order viewing,
login+password auth), and optional customer accounts with order history. Since then, three more fixes went
in from user-reported issues, all pushed and confirmed live:

- **Header nav bug**: SHOP and NEW DROP both underlined simultaneously — react-router's `NavLink` only
  matches on `pathname`, and both links point at `/shop` (one plain, one with `?collection=New%20Drop`).
  Replaced with a custom active-match in `Header.tsx` that also compares the `collection` query param.
- **Admin panel mobile responsiveness**: `AdminLayout`'s header nav, `AdminCategories`'s add-group/add-
  subgroup forms, and `AdminProductForm`'s field grids were fixed-width/fixed-column and didn't adapt below
  ~600px. Made them stack vertically / wrap on small screens.
- **Customer email verification**: registration now requires entering a 6-digit code sent to the customer's
  email before the account can log in (`server/src/lib/verificationCode.ts` for generation/hashing/expiry,
  `server/src/lib/email.ts` for sending via Resend's REST API). **`RESEND_API_KEY` has not been provided** —
  until it is, `sendVerificationEmail` falls back to logging the code server-side instead of emailing it
  (mirrors the `MockProvider` fallback pattern for fulfillment), so registration works in dev but real
  customers in production won't receive an actual email yet. Set `RESEND_API_KEY` (and optionally
  `EMAIL_FROM`, defaults to `WITD <onboarding@resend.dev>`) as a Render env var to turn on real sending —
  Resend's free tier needs no domain verification if sending from `onboarding@resend.dev`.
