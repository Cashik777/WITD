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
- Not yet pushed to GitHub as of writing this file — see "Next steps."

## Next steps

1. `git init` (if not already), commit, push to `https://github.com/Cashik777/WITD` (`main`, currently
   empty, public).
2. Real product photography, hero image, and final logo/symbol artwork — all current visuals are
   intentional placeholders (see "Brand system" above for exactly what to swap).
3. Real Printful/Printify variant mappings (`providerVariantMappings` is `{}`/`PLACEHOLDER` everywhere) —
   fill in once real POD products exist.
4. One shared product data source instead of the two hand-maintained catalog copies (frontend + server).
5. A real database for orders — `InMemoryOrderRepository` in `server/src/data/db.ts` loses everything on
   restart; swap in a Postgres/Supabase-backed implementation of the same `OrderRepository` interface.
6. Stripe/Printful/Printify keys: **do not connect these or ask the user for them unless explicitly
   instructed to in a given session** — this has been an explicit standing instruction on this project.
   The mock/unconfigured paths (`MockProvider`, the 503 + "Payments are not open yet" message) are
   intentional and should keep working until that instruction changes.
