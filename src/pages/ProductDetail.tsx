import { useParams, Link, Navigate } from 'react-router-dom'
import { getProductBySlug, getRelatedProducts } from '@/data/products'
import { ProductGallery } from '@/components/ProductGallery'
import { ProductInfo } from '@/components/ProductInfo'
import { ProductGrid } from '@/components/ProductGrid'
import { Reviews } from '@/components/Reviews'
import { StickyMobileBuyBar } from '@/components/StickyMobileBuyBar'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { useProductPurchase } from '@/hooks/useProductPurchase'

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const product = slug ? getProductBySlug(slug) : undefined
  const recentlyViewed = useRecentlyViewed(product?.id)
  const purchase = useProductPurchase(product)

  if (!product) return <Navigate to="/404" replace />

  const related = getRelatedProducts(product)
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

      <div className="grid md:grid-cols-2 gap-10 md:gap-16">
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
