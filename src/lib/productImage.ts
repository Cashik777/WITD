// Product photos are pre-rendered locally (see scripts/migrate_product_images.cjs)
// into every fixed size the site actually displays — a build-time step, not
// a runtime image service, since the catalog is small and photos change
// rarely. `base` is the logical path stored on the product (e.g.
// "/products/snake-catcher-tee/black-front"); this just appends the
// requested box, matching one of the files the migration script generated.
export function productImage(base: string, width: number, height: number): string {
  return `${base}-${width}x${height}.jpg`
}
