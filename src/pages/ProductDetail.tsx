import { useParams, Link, Navigate } from 'react-router-dom'
import { useProducts } from '@/hooks/useProducts'
import { ProductGallery } from '@/components/ProductGallery'
import { ProductInfo } from '@/components/ProductInfo'
import { ProductGrid } from '@/components/ProductGrid'
import { Reviews } from '@/components/Reviews'
import { StickyMobileBuyBar } from '@/components/StickyMobileBuyBar'
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
  const recentlyViewed = trimToFullRows(useRecentlyViewed(product?.id))
  const purchase = useProductPurchase(product)
  useDocumentMeta(product ? `${product.name} — WITD` : 'WITD', product?.description)

  if (!product) return loading ? null : <Navigate to="/404" replace />

  const related = trimToFullRows(getRelatedProducts(product))
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
        <ProductInfo product={product} purchase={purchase} />
      </div>

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
