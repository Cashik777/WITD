// Migration for the 3 new Printful hoodies (added 2026-11-22/23/24).
// Same trim+flatten+resize pipeline as migrate_product_images.cjs /
// migrate_new_tees_images.cjs.
//
// Archive 50 (Illusion of Knowing / Independent SS4500) holds up to 6 raw
// front variants and 6 raw back variants PER COLOR, like the tee batch did
// — Printful's dashboard batch-export again, not one pre-picked shot. But
// unlike the tees, there's no single "front index == back index" rule that
// holds across every color here (one color, Duck Camo, only has 3 of each
// and is missing the otherwise-common tightly-matched pair). So instead of
// a fixed index, for every color we trim every front and every back
// candidate, and pick whichever front+back PAIR has the closest matching
// aspect ratio — that's what actually keeps the two photos the same scale
// in the gallery, which is the thing that was flagged before on the tees.
//
// Archives 51 (ANCIENT DREAM) and 52 (The Freedom to Choose) each hold
// exactly one front and one back shot per color already — no picking
// needed, same as the original 13 products.
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

// Strips EVERYTHING non-alphanumeric, for matching an official Printful
// color name (e.g. "G. Dyed Black Rock") against however its filename
// happened to render that name (e.g. "g.-dyed-black-rock") without having
// to reverse-engineer Printful's own slug quirks.
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

const PRODUCTS = {
  'illusion-of-knowing': {
    archive: 50,
    prefix: 'unisex-midweight-hoodie',
    multi: true,
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
  },
  'ancient-dream': {
    archive: 51,
    prefix: 'unisex-sculpted-heavyweight-hoodie',
    multi: false,
    colors: ['Black', 'Stone'],
  },
  'the-freedom-to-choose': {
    archive: 52,
    prefix: 'unisex-garment-dyed-chaser-vintage-hoodie',
    multi: false,
    colors: ['G. Dyed Black Rock', 'G. Dyed Blue Grey', 'G. Dyed Misty Grey', 'G. Dyed Blush'],
  },
}

async function trimmedRatio(file) {
  const t = await sharp(file).trim().toBuffer({ resolveWithObject: true })
  return t.info.width / t.info.height
}

async function run() {
  const report = []

  for (const [slug, { archive, prefix, multi, colors }] of Object.entries(PRODUCTS)) {
    const dir = path.join(DOWNLOADS, `archive (${archive})`)
    const files = fs.readdirSync(dir)
    const re = new RegExp(`^${prefix}-(.+)-(front|back)-[a-f0-9]+\\.png$`, 'i')

    // normalizedColorKey -> { front: [paths], back: [paths] }
    const byColor = {}
    for (const f of files) {
      const m = f.match(re)
      if (!m) continue
      const [, colorRaw, view] = m
      const key = normalize(colorRaw)
      byColor[key] = byColor[key] || { front: [], back: [] }
      byColor[key][view].push(path.join(dir, f))
    }

    const outProductDir = path.join(OUT_DIR, slug)
    fs.mkdirSync(outProductDir, { recursive: true })

    for (const color of colors) {
      const key = normalize(color)
      const cs = slugify(color)
      const variants = byColor[key]
      if (!variants || !variants.front.length || !variants.back.length) {
        report.push(`NO PHOTOS: ${slug} / "${color}" — found: ${Object.keys(byColor).join(', ')}`)
        continue
      }

      let frontPick = variants.front[0]
      let backPick = variants.back[0]

      if (multi) {
        // Pick the front+back pair with the closest matching trimmed
        // aspect ratio, so the two photos read as the same garment at the
        // same scale rather than two different sized shots.
        const frontRatios = await Promise.all(variants.front.map(trimmedRatio))
        const backRatios = await Promise.all(variants.back.map(trimmedRatio))
        let best = { diff: Infinity, fi: 0, bi: 0 }
        for (let fi = 0; fi < frontRatios.length; fi++) {
          for (let bi = 0; bi < backRatios.length; bi++) {
            const diff = Math.abs(frontRatios[fi] - backRatios[bi])
            if (diff < best.diff) best = { diff, fi, bi }
          }
        }
        frontPick = variants.front[best.fi]
        backPick = variants.back[best.bi]
      }

      for (const [view, src] of [
        ['front', frontPick],
        ['back', backPick],
      ]) {
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
        `OK: ${slug} / ${color} (front=${path.basename(frontPick)}, back=${path.basename(backPick)}, front candidates=${variants.front.length}, back candidates=${variants.back.length})`
      )
    }
  }

  fs.writeFileSync(path.join(__dirname, '_new_hoodies_migration_report.txt'), report.join('\n'))
  console.log(report.join('\n'))
  console.log(`\nDone. ${report.filter((r) => r.startsWith('OK')).length} color entries processed.`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
