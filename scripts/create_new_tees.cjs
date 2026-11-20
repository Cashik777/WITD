// Builds the create-product payloads for the 11 new Printful tees (added
// 2026-11) and writes them to _new_tees_payloads.json. The actual POSTs run
// from an authenticated admin browser tab (session-cookie auth, no API
// token for this endpoint), not from this script directly — see
// _new_tees_create_report.json / the browser automation step instead.
// Run only after price is confirmed — see PRICE_TIERS below.
const fs = require('fs')
const path = require('path')

const variantsData = JSON.parse(
  fs.readFileSync(
    'C:/Users/Dgello/AppData/Local/Temp/claude/b0147d3e513e77ed/501aafd9-efb8-4267-b818-a1e7c4117703/scratchpad/new_tees_variants.json',
    'utf8'
  )
)

// Two cost tiers: front+back+sleeve-emblem vs front+sleeve-emblem only
// (The Unbearable has no back print — see migrate_new_tees_images.cjs).
const PRICE_TIERS = {
  standard: { price: 65, priceUSD: 50, priceEUR: 55 }, // CAD 32.70 COGS x2
  frontOnly: { price: 48, priceUSD: 37, priceEUR: 40 }, // CAD 24.20 COGS x2
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']

// slug -> { printfulId, colors (in display order), tier, sku }
const PRODUCTS = {
  unbound: {
    printfulId: '496722360',
    name: 'UNBOUND',
    colors: ['Black', 'Vintage Black', 'Asphalt', 'Silver', 'Ash', 'Vintage White', 'White'],
    tier: 'standard',
    sku: 'WITD-TEE-UNBD',
  },
  'only-now': {
    printfulId: '496646133',
    name: 'Only Now',
    colors: ['Black', 'Vintage Black', 'Dark Grey', 'Silver', 'Vintage White', 'White'],
    tier: 'standard',
    sku: 'WITD-TEE-ONW',
  },
  'the-one': {
    printfulId: '495946339',
    name: 'THE ONE',
    colors: ['Black', 'Vintage Black', 'Asphalt', 'Silver', 'Ash', 'White'],
    tier: 'standard',
    sku: 'WITD-TEE-ONE',
  },
  'the-guide': {
    printfulId: '495868425',
    name: 'The Guide',
    colors: ['Black', 'Vintage Black', 'Asphalt', 'Silver', 'Ash', 'Vintage White', 'White'],
    tier: 'standard',
    sku: 'WITD-TEE-GDE',
  },
  everhome: {
    printfulId: '495855170',
    name: 'Everhome',
    colors: ['Black', 'Vintage Black', 'Dark Grey', 'Silver', 'Ash', 'Vintage White', 'White'],
    tier: 'standard',
    sku: 'WITD-TEE-EVH',
  },
  'look-again': {
    printfulId: '495766040',
    name: 'Look Again',
    colors: ['Black', 'Vintage Black', 'Dark Grey', 'Ash', 'Vintage White', 'White'],
    tier: 'standard',
    sku: 'WITD-TEE-LKA',
  },
  'beyond-instinct': {
    printfulId: '495468313',
    name: 'Beyond Instinct',
    colors: ['Black', 'Vintage Black', 'Asphalt', 'Silver', 'Ash', 'White'],
    tier: 'standard',
    sku: 'WITD-TEE-BYI',
  },
  'the-golden-rule': {
    printfulId: '495449445',
    name: 'THE GOLDEN RULE',
    colors: ['Black', 'Vintage Black', 'Dark Grey', 'Silver', 'Ash', 'White'],
    tier: 'standard',
    sku: 'WITD-TEE-TGR',
  },
  oneness: {
    printfulId: '495399980',
    name: 'ONENESS',
    colors: ['Black', 'Vintage Black', 'Dark Grey', 'Ash', 'Vintage White', 'White'],
    tier: 'standard',
    sku: 'WITD-TEE-ONS',
  },
  'no-limits': {
    printfulId: '495330466',
    name: 'NO LIMITS',
    colors: ['Black', 'Vintage Black', 'Oxblood Black', 'Vintage White', 'Solid White Blend', 'White'],
    tier: 'standard',
    sku: 'WITD-TEE-NLM',
  },
  'the-unbearable': {
    printfulId: '493596443',
    name: 'The Unbearable',
    colors: ['Black', 'Vintage Black', 'Navy', 'Ash', 'Vintage White', 'White'],
    tier: 'frontOnly',
    sku: 'WITD-TEE-UNBR',
  },
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function main() {
  const payloads = []
  for (const [slug, def] of Object.entries(PRODUCTS)) {
    const colorSlug = (c) => slugify(c)
    const firstColor = def.colors[0]
    const images = [
      `/products/${slug}/${colorSlug(firstColor)}-front`,
      `/products/${slug}/${colorSlug(firstColor)}-back`,
    ]
    const imagesByColor = {}
    for (const c of def.colors) {
      imagesByColor[c] = [`/products/${slug}/${colorSlug(c)}-front`, `/products/${slug}/${colorSlug(c)}-back`]
    }

    const variants = variantsData[def.printfulId].variants
    const providerVariantMappings = {}
    for (const v of variants) {
      if (def.colors.includes(v.color)) providerVariantMappings[`${v.color}-${v.size}`] = String(v.id)
    }

    const tier = PRICE_TIERS[def.tier]
    const payload = {
      name: def.name,
      slug,
      description: '',
      idea: null,
      price: tier.price,
      priceUSD: tier.priceUSD,
      priceEUR: tier.priceEUR,
      currency: 'CAD',
      category: 'T-Shirts',
      collection: 'First Drop',
      images,
      hoverImage: images[1],
      imagesByColor,
      colors: def.colors,
      sizes: SIZES,
      availableSizes: SIZES,
      materials: '100% combed ring-spun cotton (heather colors may contain polyester)',
      fit: 'Unisex, true to size',
      careInstructions: 'Machine wash cold, inside out. Tumble dry low. Do not iron directly on print.',
      sku: def.sku,
      tags: [],
      featured: false,
      new: true,
      bestseller: false,
      availability: 'in_stock',
      fulfillmentProvider: 'printful',
      providerProductId: def.printfulId,
      providerVariantMappings,
    }

    payloads.push(payload)
  }
  const outPath = path.join(__dirname, '_new_tees_payloads.json')
  fs.writeFileSync(outPath, JSON.stringify(payloads, null, 2))
  console.log(`Wrote ${payloads.length} payloads to ${outPath}`)
}

main()
