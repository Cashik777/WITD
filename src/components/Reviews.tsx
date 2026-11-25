import { getFitSummary, getReviewsForProduct } from '@/data/reviews'
import { useLocale } from '@/hooks/useLocale'

export function Reviews({ productId }: { productId: string }) {
  const productReviews = getReviewsForProduct(productId)
  const fit = getFitSummary(productId)
  const { t } = useLocale()

  return (
    <section className="mt-20 border-t border-line pt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl md:text-2xl text-paper">{t('reviews.title')}</h2>
        {fit && (
          <span className="text-xs text-mist">
            {t('reviews.ratingSummary', {
              average: fit.average.toFixed(1),
              count: fit.count,
              unit: t(fit.count === 1 ? 'reviews.review' : 'reviews.reviews'),
            })}
          </span>
        )}
      </div>

      {productReviews.length === 0 ? (
        <p className="text-sm text-mist">{t('reviews.noReviews')}</p>
      ) : (
        <div className="space-y-6">
          {productReviews.map((r) => (
            <div key={r.id} className="border-b border-line pb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-paper">{r.author}</span>
                <span className="text-xs text-mist">{t('reviews.ratingFit', { rating: r.rating, fitRating: r.fitRating })}</span>
              </div>
              <p className="mt-2 text-sm text-paper/80">{r.title}</p>
              <p className="mt-1 text-sm text-paper/60 leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
