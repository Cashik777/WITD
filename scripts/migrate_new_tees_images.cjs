// One-time migration for the 11 new Printful tee designs (added 2026-11),
// mirrors migrate_product_images.cjs exactly (same .trim()+flatten+resize
// pipeline, same output layout) since these are the same kind of raw
// Printful mockup exports the original migration consumed.
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const DOWNLOADS = 'C:/Users/Dgello/Downloads'
const OUT_DIR = path.join(__dirname, '..', 'public', 'products')
const BG = '#151412'

const SIZES = [
  [400, 500],
  [600, 750],
  [900, 1200],
  [1400, 1750],
  [200, 240],
  [180, 210],
  [112, 140],
  [96, 120],
]

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// product slug -> { archives: [n, ...], colors: [official Printful color names] }
const PRODUCTS = {
  unbound: { archives: [49], colors: ['Black', 'Vintage Black', 'Asphalt', 'Silver', 'Ash', 'Vintage White', 'White'] },
  'only-now': { archives: [48], colors: ['Black', 'Vintage Black', 'Dark Grey', 'Silver', 'Vintage White', 'White'] },
  'the-one': { archives: [46], colors: ['Black', 'Vintage Black', 'Asphalt', 'Silver', 'Ash', 'White'] },
  'the-guide': { archives: [45], colors: ['Black', 'Vintage Black', 'Asphalt', 'Silver', 'Ash', 'Vintage White', 'White'] },
  everhome: { archives: [44], colors: ['Black', 'Vintage Black', 'Dark Grey', 'Silver', 'Ash', 'Vintage White', 'White'] },
  'look-again': { archives: [43], colors: ['Black', 'Vintage Black', 'Dark Grey', 'Ash', 'Vintage White', 'White'] },
  'beyond-instinct': { archives: [42], colors: ['Black', 'Vintage Black', 'Asphalt', 'Silver', 'Ash', 'White'] },
  'the-golden-rule': { archives: [41, 47], colors: ['Black', 'Vintage Black', 'Dark Grey', 'Silver', 'Ash', 'White'] },
  oneness: { archives: [40], colors: ['Black', 'Vintage Black', 'Dark Grey', 'Ash', 'Vintage White', 'White'] },
  'no-limits': { archives: [39], colors: ['Black', 'Vintage Black', 'Oxblood Black', 'Vintage White', 'Solid White Blend', 'White'] },
  'the-unbearable': { archives: [33, 34, 38], colors: ['Black', 'Vintage Black', 'Navy', 'Ash', 'Vintage White', 'White'] },
}

async function run() {
  const report = []

  for (const [slug, { archives, colors }] of Object.entries(PRODUCTS)) {
    // colorSlug -> { front?: path, back?: path } — merged across all archives
    // for this product (some products' mockups were split across 2-3
    // archives by Printful's batch size limit).
    const byColor = {}
    for (const n of archives) {
      const dir = path.join(DOWNLOADS, `archive (${n})`)
      const files = fs.readdirSync(dir)
      const re = /^unisex-staple-t-shirt-(.+)-(front|back)-[a-f0-9]+\.png$/i
      for (const f of files) {
        const m = f.match(re)
        if (!m) continue
        const [, colorSlug, view] = m
        byColor[colorSlug] = byColor[colorSlug] || {}
        // first match wins — if a color+view appears in more than one
        // archive for this product, they're duplicates/retries, not
        // different content.
        if (!byColor[colorSlug][view]) byColor[colorSlug][view] = path.join(dir, f)
      }
    }

    const outProductDir = path.join(OUT_DIR, slug)
    fs.mkdirSync(outProductDir, { recursive: true })

    for (const color of colors) {
      const cs = slugify(color)
      const files = byColor[cs]
      if (!files) {
        report.push(`NO PHOTOS: ${slug} / "${color}" (slug "${cs}") — found colors: ${Object.keys(byColor).join(', ')}`)
        continue
      }
      for (const view of ['front', 'back']) {
        const src = files[view]
        if (!src) continue
        for (const [w, h] of SIZES) {
          const outPath = path.join(outProductDir, `${cs}-${view}-${w}x${h}.jpg`)
          await sharp(src)
            .trim()
            .flatten({ background: BG })
            .resize(w, h, { fit: 'contain', background: BG })
            .jpeg({ quality: 82 })
            .toFile(outPath)
        }
      }
      report.push(`OK: ${slug} / ${color} (front=${!!files.front} back=${!!files.back})`)
    }
  }

  fs.writeFileSync(path.join(__dirname, '_new_tees_migration_report.txt'), report.join('\n'))
  console.log(report.join('\n'))
  console.log(`\nDone. ${report.filter((r) => r.startsWith('OK')).length} color entries processed.`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
