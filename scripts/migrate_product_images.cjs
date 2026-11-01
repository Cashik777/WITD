// One-time migration: pull product photography out of Downloads/archive (N)
// folders (Printful's raw transparent mockup exports, saved locally by the
// user) and produce the same fixed-size JPEGs the site/emails need, flattened
// onto the brand's dark canvas (#151412) exactly like the old Cloudinary
// pipeline did (b_rgb:151412 + c_fill). Output goes to public/products/ so
// Vite bundles it into dist/ and the existing express.static(dist) serves it
// — no external image service involved at all.
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const DOWNLOADS = 'C:/Users/Dgello/Downloads'
const OUT_DIR = path.join(__dirname, '..', 'public', 'products')
const CATALOG = require('./_catalog_snapshot.json')
const BG = '#151412'

// Sizes actually requested across the codebase (ProductCard srcset,
// FeaturedCard, ProductGallery, CartItem, PairsWellWith, both email sizes).
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

// archive folder -> { productSlug, filenamePrefix }
const ARCHIVES = {
  3: { slug: 'life-is-a-reflection-of-what-you-believe-tee', prefix: 'unisex-staple-t-shirt' },
  4: { slug: 'fool-me-if-you-can-tee', prefix: 'unisex-staple-t-shirt' },
  5: { slug: 'a-wolf-in-sheep-s-clothing-tee', prefix: 'unisex-staple-t-shirt' },
  6: { slug: 'where-are-we-running-tee', prefix: 'unisex-staple-t-shirt' },
  7: { slug: 'snake-catcher-tee', prefix: 'unisex-staple-t-shirt' },
  8: { slug: 'live-this-life-tee', prefix: 'unisex-staple-t-shirt' },
  9: { slug: 'got-you-tee', prefix: 'unisex-staple-t-shirt' },
  10: { slug: 'the-kindest-security-staff-tee', prefix: 'unisex-staple-t-shirt' },
  11: { slug: 'the-kindest-security-officer-tee', prefix: 'unisex-staple-t-shirt' },
  12: { slug: 'we-are-one-tee', prefix: 'unisex-staple-t-shirt' },
  13: { slug: 'i-am-we-tee', prefix: 'unisex-staple-t-shirt' },
  14: { slug: 'who-is-my-friend-tee', prefix: 'unisex-staple-t-shirt' },
  15: { slug: 'witd-logo-tee', prefix: 'unisex-staple-t-shirt' },
  16: { slug: 'witd-hoodie', prefix: 'unisex-heavyweight-hooded-sweatshirt' },
  17: { slug: 'garment-dyed-sweatpants', prefix: 'unisex-garment-dyed-fleece-sweatpants' },
  18: { slug: 'cuffed-beanie', prefix: 'cuffed-beanie' },
  20: { slug: 'pigment-dyed-sweatpants', prefix: 'unisex-pigment-dyed-sweatpants' },
  21: { slug: 'everyday-sweatpants', prefix: 'unisex-fleece-sweatpants' },
  22: { slug: 'distressed-dad-hat', prefix: 'distressed-dad-hat' },
  23: { slug: 'sunwashed-trucker-cap', prefix: 'sunwashed-trucker-cap' },
}

async function run() {
  const report = []

  for (const [n, { slug, prefix }] of Object.entries(ARCHIVES)) {
    const dir = path.join(DOWNLOADS, `archive (${n})`)
    const files = fs.readdirSync(dir)
    const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(.+)-(front|back|zoomed-in)-[a-f0-9]+\\.png$`, 'i')

    // colorSlug -> { front?: path, back?: path }
    const byColor = {}
    for (const f of files) {
      const m = f.match(re)
      if (!m) continue
      const [, colorSlug, view] = m
      if (view === 'zoomed-in') continue
      byColor[colorSlug] = byColor[colorSlug] || {}
      byColor[colorSlug][view] = path.join(dir, f)
    }

    const product = CATALOG.find((p) => p.slug === slug)
    if (!product) {
      report.push(`MISSING PRODUCT for archive ${n} (${slug})`)
      continue
    }

    const outProductDir = path.join(OUT_DIR, slug)
    fs.mkdirSync(outProductDir, { recursive: true })

    for (const color of product.colors) {
      const cs = slugify(color)
      const files = byColor[cs]
      if (!files) {
        report.push(`NO PHOTOS: ${slug} / "${color}" (slug "${cs}") — archive (${n}) has: ${Object.keys(byColor).join(', ')}`)
        continue
      }
      for (const view of ['front', 'back']) {
        const src = files[view]
        if (!src) continue
        for (const [w, h] of SIZES) {
          const outPath = path.join(outProductDir, `${cs}-${view}-${w}x${h}.jpg`)
          // .trim() first: Printful's mockup canvas leaves a lot of empty
          // transparent margin around the actual garment (confirmed directly
          // on the trucker cap — only 1445 of 2000px tall was real content).
          // 'contain' (not 'cover') after that: a cap's trimmed box is much
          // more landscape than a tee's, so cropping it to fill a 4:5 box
          // zoomed in hard and cut the brim off — 'contain' always shows the
          // whole garment, scaled to fit, padding any leftover with the same
          // dark background flatten() already applied. Matches Cloudinary's
          // original c_pad behavior instead of its c_fill.
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

  fs.writeFileSync(path.join(__dirname, '_migration_report.txt'), report.join('\n'))
  console.log(report.join('\n'))
  console.log(`\nDone. ${report.filter((r) => r.startsWith('OK')).length} color entries processed.`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
