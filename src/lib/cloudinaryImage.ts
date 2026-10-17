// Every product photo is stored as one full-resolution (1920x2400) Cloudinary
// URL regardless of where it's displayed — a 150px cart thumbnail was
// downloading the exact same multi-megabyte PNG as the full product-page
// gallery (confirmed via PageSpeed Insights: ~14 MB of avoidable image
// weight on the homepage alone). Cloudinary computes resized/re-encoded
// derivatives on the fly from URL parameters, no re-upload needed, so
// appending one more transformation step at request time is enough:
// f_auto lets Cloudinary pick whichever modern format (WebP/AVIF) the
// browser supports, q_auto picks a visually-equivalent quality
// automatically, and c_fill/w/h crop+downscale to the size actually shown.
//
// The new step must be inserted right before the /v<version>/ segment, not
// simply after '/upload/' — stuck in front, it would crop to the target
// size BEFORE the existing background-removal + pad-to-canvas steps ran,
// which then re-stretch back to their own fixed 1920x2400 output and
// silently undo the resize entirely.
export function cloudinaryResize(url: string, width: number, height: number): string {
  const match = url.match(/^(.*\/upload\/)(.*?)(\/v\d+\/.*)$/)
  if (!match) return url
  const [, prefix, existingTransforms, versionAndPath] = match
  return `${prefix}${existingTransforms}/w_${width},h_${height},c_fill,f_auto,q_auto${versionAndPath}`
}
