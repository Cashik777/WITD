import { useParams, Link, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { ProductGallery } from '@/components/ProductGallery'
import { ProductInfo, ProductDetailsAccordion } from '@/components/ProductInfo'
import { ProductGrid } from '@/components/ProductGrid'
import { Reviews } from '@/components/Reviews'
import { StickyMobileBuyBar } from '@/components/StickyMobileBuyBar'
import { SizeGuideModal } from '@/components/SizeGuideModal'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { useProductPurchase } from '@/hooks/useProductPurchase'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

// ProductGrid is a 4-column grid at desktop width (2 on mobile, 3 on
// tablet) — a count like 5 or 9 renders one full row plus a single
// lonely item dangling under it, which reads as broken rather than just
// "a shorter list." Recently Viewed in particular can be any length up to
// 7 depending on browsing history, so it's the one actually at risk of
// landing on an awkward remainder; trimming down to the last full row of 4
// only kicks in once there's more than one row to begin with — a single
// partial row (1-4 items) is completely normal and isn't touched.
const ROW_SIZE = 4
function trimToFullRows<T>(items: T[]): T[] {
  return items.length > ROW_SIZE ? items.slice(0, Math.floor(items.length / ROW_SIZE) * ROW_SIZE) : items
}

export default function ProductDetail() {
  const { getProductBySlug, getRelatedProducts, loading } = useProducts()
  const { slug } = useParams<{ slug: string }>()
  const product = slug ? getProductBySlug(slug) : undefined
  const recentlyViewedRaw = useRecentlyViewed(product?.id)
  const purchase = useProductPurchase(product)
  const [guideOpen, setGuideOpen] = useState(false)
  useDocumentMeta(product ? `${product.name} — WITD` : 'WITD', product?.description)

  if (!product) return loading ? null : <Navigate to="/404" replace />

  const related = trimToFullRows(getRelatedProducts(product))
  // Recently Viewed shouldn't repeat whatever You May Also Like is already
  // showing right above it on the same page — seeing the same tee twice in
  // two different "here's something for you" lists reads as a bug, not two
  // genuinely different recommendations.
  const relatedIds = new Set(related.map((p) => p.id))
  const recentlyViewed = trimToFullRows(recentlyViewedRaw.filter((p) => !relatedIds.has(p.id)))
  const galleryImages = (purchase.color && product.imagesByColor[purchase.color]) || product.images

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-8 md:py-12">
      <nav className="text-xs text-mist mb-8">
        <Link to="/shop" className="hover:text-paper">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-paper">
          {product.category}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-paper/70">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
        <ProductGallery images={galleryImages} name={product.name} />
        <ProductInfo product={product} purchase={purchase} onOpenGuide={() => setGuideOpen(true)} />
      </div>

      {/* Full-width, not confined to the right-hand column: once the
          gallery shrank to a centered max-w-md photo + thumbnail row, the
          old layout had this accordion sharing a row with a slab of empty
          space in the (now shorter) image column next to it. */}
      <div className="mt-10 md:mt-12">
        <ProductDetailsAccordion product={product} onOpenGuide={() => setGuideOpen(true)} />
      </div>

      <SizeGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />

      <StickyMobileBuyBar product={product} purchase={purchase} />

      <Reviews productId={product.id} />

      {related.length > 0 && (
        <section className="mt-24 md:mt-32">
          <h2 className="font-display text-2xl md:text-3xl text-paper mb-10">You May Also Like</h2>
          <ProductGrid products={related} />
        </section>
      )}

      {recentlyViewed.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-xl md:text-2xl text-paper mb-8">Recently Viewed</h2>
          <ProductGrid products={recentlyViewed} />
        </section>
      )}
    </div>
  )
}
