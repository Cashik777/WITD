import { useParams, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { LL } from '@/components/LL'
import { useLocale } from '@/hooks/useLocale'
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
import { localizedProductText } from '@/lib/productText'
import { useCategoryLabel } from '@/hooks/useFilterLabels'

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
  const navigate = useNavigate()
  const location = useLocation()
  const { t, path, locale } = useLocale()
  const categoryLabel = useCategoryLabel()
  const localized = product ? localizedProductText(product, locale) : undefined
  useDocumentMeta(localized ? `${localized.name} — WITD` : 'WITD', localized?.description)

  // location.key is 'default' only for the very first history entry this
  // tab has — i.e. there's nothing in OUR history to go back to (a direct
  // link, a new tab, a page refresh). Anywhere else, the person navigated
  // here from somewhere in the app, so take them back to exactly that
  // rather than always landing on the shop/category page.
  const goBack = () => {
    if (location.key === 'default') {
      navigate(path('/shop'))
    } else {
      navigate(-1)
    }
  }

  if (!product) return loading ? null : <Navigate to="/404" replace />

  const { name: productName } = localizedProductText(product, locale)
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
      <nav className="text-xs text-mist mb-8 flex items-center">
        <button
          onClick={goBack}
          aria-label={t('product.goBack')}
          className="mr-3 p-1 -ml-1 hover:text-paper transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <LL to="/shop" className="hover:text-paper">
          {t('nav.shop')}
        </LL>
        <span className="mx-2">/</span>
        <LL to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-paper">
          {categoryLabel(product.category)}
        </LL>
        <span className="mx-2">/</span>
        <span className="text-paper/70">{productName}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
        <ProductGallery images={galleryImages} name={productName} />
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
          <h2 className="font-display text-2xl md:text-3xl text-paper mb-10">{t('product.youMayAlsoLike')}</h2>
          <ProductGrid products={related} />
        </section>
      )}

      {recentlyViewed.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-xl md:text-2xl text-paper mb-8">{t('product.recentlyViewed')}</h2>
          <ProductGrid products={recentlyViewed} />
        </section>
      )}
    </div>
  )
}
