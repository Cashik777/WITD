// Builds create-product payloads for the 3 new Printful hoodies (added
// 2026-11), writes them to _new_hoodies_payloads.json. POSTs run from an
// authenticated admin browser tab, same as create_new_tees.cjs.
const fs = require('fs')
const path = require('path')

const variantsData = JSON.parse(
  fs.readFileSync(
    'C:/Users/Dgello/AppData/Local/Temp/claude/b0147d3e513e77ed/501aafd9-efb8-4267-b818-a1e7c4117703/scratchpad/new_hoodies_variants.json',
    'utf8'
  )
)

const PRODUCTS = {
  'illusion-of-knowing': {
    printfulId: '497323392',
    name: 'Illusion of Knowing',
    colors: [
      'Black',
      'Purple',
      'Charcoal Heather',
      'Alpine Green',
      'Army',
      'Storm Blue',
      'Duck Camo',
      'Sandstone',
      'Dusty Sage',
      'Grey Heather',
      'Bone',
      'White',
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    sku: 'WITD-HOOD-IOK',
    price: 110,
    priceUSD: 85,
    priceEUR: 93,
    description: "The warning came from the wrong animal to be believed.",
    idea: "The wolf told her the shepherd would eat her. She didn't believe him — he feeds her, he gives her a home. She was right about who was lying. She was wrong about who was safe.",
  },
  'ancient-dream': {
    printfulId: '497611180',
    name: 'ANCIENT DREAM',
    colors: ['Black', 'Stone'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    sku: 'WITD-HOOD-AND',
    price: 182,
    priceUSD: 141,
    priceEUR: 154,
    description: "Before it was your reality, it was somebody's dream.",
    idea: "Something old enough to be made of stars dreamed you up first. You just woke up inside it and started calling it real.",
  },
  'the-freedom-to-choose': {
    printfulId: '498352521',
    name: 'The Freedom to Choose',
    colors: ['G. Dyed Black Rock', 'G. Dyed Blue Grey', 'G. Dyed Misty Grey', 'G. Dyed Blush'],
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    sku: 'WITD-HOOD-FTC',
    price: 146,
    priceUSD: 113,
    priceEUR: 124,
    description: "Every door costs something, whichever side you're standing on.",
    idea: "The free bird asked what it's like to never fly. The caged bird asked what it's like to live without walls. Both already knew the answer — that's exactly why they asked.",
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
    const images = [`/products/${slug}/${colorSlug(firstColor)}-front`, `/products/${slug}/${colorSlug(firstColor)}-back`]
    const imagesByColor = {}
    for (const c of def.colors) {
      imagesByColor[c] = [`/products/${slug}/${colorSlug(c)}-front`, `/products/${slug}/${colorSlug(c)}-back`]
    }

    const variants = variantsData[def.printfulId].variants
    const providerVariantMappings = {}
    for (const v of variants) {
      if (def.colors.includes(v.color)) providerVariantMappings[`${v.color}-${v.size}`] = String(v.id)
    }

    const payload = {
      name: def.name,
      slug,
      description: def.description,
      idea: def.idea,
      price: def.price,
      priceUSD: def.priceUSD,
      priceEUR: def.priceEUR,
      currency: 'CAD',
      category: 'Hoodies',
      collection: 'First Drop',
      images,
      hoverImage: images[1],
      imagesByColor,
      colors: def.colors,
      sizes: def.sizes,
      availableSizes: def.sizes,
      materials: '100% cotton, 10oz fleece',
      fit: 'Unisex, true to size',
      careInstructions: 'Machine wash cold, inside out. Do not iron on print/embroidery.',
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
  const outPath = path.join(__dirname, '_new_hoodies_payloads.json')
  fs.writeFileSync(outPath, JSON.stringify(payloads, null, 2))
  console.log(`Wrote ${payloads.length} payloads to ${outPath}`)
}

main()
