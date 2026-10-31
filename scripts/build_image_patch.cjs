// Builds the exact { images, hoverImage, imagesByColor } patch for each
// product, pointing at the newly migrated local static files instead of the
// now-dead Cloudinary URLs. Output is consumed by hand (pasted into a
// fetch() run in an authenticated admin browser tab) since applying it
// requires an admin login this script can't and shouldn't perform itself.
const fs = require('fs')
const path = require('path')

const CATALOG = require('./_catalog_snapshot.json')
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// cuffed-beanie has no second angle in the recovered local photos (the old
// Cloudinary hoverImage for it is simply gone) — fall back to the front
// photo for both slots rather than leaving a broken image reference.
const NO_BACK = new Set(['cuffed-beanie', 'sunwashed-trucker-cap'])

const patches = CATALOG.map((p) => {
  const base = (color, view) => `/products/${p.slug}/${slugify(color)}-${view}`
  const pair = (color) => (NO_BACK.has(p.slug) ? [base(color, 'front')] : [base(color, 'front'), base(color, 'back')])

  const defaultColor = p.colors[0]
  const imagesByColor = Object.fromEntries(p.colors.map((c) => [c, pair(c)]))

  return {
    id: p.id,
    slug: p.slug,
    patch: {
      images: pair(defaultColor),
      hoverImage: pair(defaultColor)[1] ?? '',
      imagesByColor,
    },
  }
})

fs.writeFileSync(path.join(__dirname, '_image_patches.json'), JSON.stringify(patches, null, 2))
console.log(`Wrote ${patches.length} patches to scripts/_image_patches.json`)
