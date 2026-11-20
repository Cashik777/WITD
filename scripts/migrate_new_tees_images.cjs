// One-time migration for the 11 new Printful tee designs (added 2026-11),
// mirrors migrate_product_images.cjs (same .trim()+flatten+resize pipeline,
// same output layout).
//
// IMPORTANT: unlike the original 13 products (whose archives held exactly
// one pre-picked photo per color+view), these new archives hold 5 raw
// mockup variants per color+view — Printful's dashboard exports every
// framing/angle it generated, not just one, and they are NOT just cosmetic
// crops of each other — their trimmed-garment bounding boxes have
// genuinely different aspect ratios (checked with sharp .trim()), which is
// why picking the wrong one made front and back look like two different
// sized photos once placed in the same fixed-size frame (flagged
// directly). The old 13 products' front and back photos share essentially
// the same trimmed aspect ratio (~0.73-0.74). Checked by eye + by trimmed
// ratio across multiple products/colors: of the 5 front variants, variant
// 3 (index 2) is both the one with that matching ~0.74 ratio AND the
// regular boxy unisex build (not the noticeably more athletic build some
// of the other variants show); variant 3 (index 2) of the 5 back variants
// matches it almost exactly already. So: front -> 3rd file (index 2),
// back -> 3rd file (index 2) — the same position in both lists.
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

// product slug -> { archive: single source archive number (each one
// independently has the full color set with the 5-variant structure —
// no need to merge across archives), colors: official Printful color list }
const PRODUCTS = {
  unbound: { archive: 49, colors: ['Black', 'Vintage Black', 'Asphalt', 'Silver', 'Ash', 'Vintage White', 'White'] },
  'only-now': { archive: 48, colors: ['Black', 'Vintage Black', 'Dark Grey', 'Silver', 'Vintage White', 'White'] },
  'the-one': { archive: 46, colors: ['Black', 'Vintage Black', 'Asphalt', 'Silver', 'Ash', 'White'] },
  'the-guide': { archive: 45, colors: ['Black', 'Vintage Black', 'Asphalt', 'Silver', 'Ash', 'Vintage White', 'White'] },
  everhome: { archive: 44, colors: ['Black', 'Vintage Black', 'Dark Grey', 'Silver', 'Ash', 'Vintage White', 'White'] },
  'look-again': { archive: 43, colors: ['Black', 'Vintage Black', 'Dark Grey', 'Ash', 'Vintage White', 'White'] },
  'beyond-instinct': { archive: 42, colors: ['Black', 'Vintage Black', 'Asphalt', 'Silver', 'Ash', 'White'] },
  'the-golden-rule': { archive: 41, colors: ['Black', 'Vintage Black', 'Dark Grey', 'Silver', 'Ash', 'White'] },
  oneness: { archive: 40, colors: ['Black', 'Vintage Black', 'Dark Grey', 'Ash', 'Vintage White', 'White'] },
  'no-limits': { archive: 39, colors: ['Black', 'Vintage Black', 'Oxblood Black', 'Vintage White', 'Solid White Blend', 'White'] },
  'the-unbearable': { archive: 33, colors: ['Black', 'Vintage Black', 'Navy', 'Ash', 'Vintage White', 'White'] },
}

const FRONT_INDEX = 2 // 3rd of 5
const BACK_INDEX = 2 // 3rd of 5

async function run() {
  const report = []

  for (const [slug, { archive, colors }] of Object.entries(PRODUCTS)) {
    const dir = path.join(DOWNLOADS, `archive (${archive})`)
    const files = fs.readdirSync(dir)
    // plain front/back only — excludes front-and-back composites, left/right
    // sleeve close-ups, which share the "unisex-staple-t-shirt-{color}-"
    // prefix but aren't what we want here.
    const re = /^unisex-staple-t-shirt-(.+)-(front|back)-[a-f0-9]+\.png$/i

    // colorSlug -> { front: [paths sorted by hash], back: [paths sorted by hash] }
    const byColor = {}
    for (const f of files) {
      const m = f.match(re)
      if (!m) continue
      const [, colorSlug, view] = m
      byColor[colorSlug] = byColor[colorSlug] || { front: [], back: [] }
      byColor[colorSlug][view].push(path.join(dir, f))
    }
    for (const cs of Object.keys(byColor)) {
      byColor[cs].front.sort()
      byColor[cs].back.sort()
    }

    const outProductDir = path.join(OUT_DIR, slug)
    fs.mkdirSync(outProductDir, { recursive: true })

    for (const color of colors) {
      const cs = slugify(color)
      const variants = byColor[cs]
      if (!variants) {
        report.push(`NO PHOTOS: ${slug} / "${color}" (slug "${cs}") — found colors: ${Object.keys(byColor).join(', ')}`)
        continue
      }
      const picks = {
        front: variants.front[FRONT_INDEX] ?? variants.front[variants.front.length - 1],
        back: variants.back[BACK_INDEX] ?? variants.back[variants.back.length - 1],
      }
      for (const view of ['front', 'back']) {
        const src = picks[view]
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
      report.push(
        `OK: ${slug} / ${color} (front=${picks.front ? path.basename(picks.front) : 'MISSING'}, back=${picks.back ? path.basename(picks.back) : 'MISSING'}, front variants=${variants.front.length}, back variants=${variants.back.length})`
      )
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
