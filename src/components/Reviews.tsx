import { getFitSummary, getReviewsForProduct } from '@/data/reviews'

export function Reviews({ productId }: { productId: string }) {
  const productReviews = getReviewsForProduct(productId)
  const fit = getFitSummary(productId)

  return (
    <section className="mt-20 border-t border-line pt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl md:text-2xl text-paper">Reviews</h2>
        {fit && (
          <span className="text-xs text-mist">
            {fit.average.toFixed(1)} / 5 &middot; {fit.count} {fit.count === 1 ? 'review' : 'reviews'}
          </span>
        )}
      </div>

      {productReviews.length === 0 ? (
        <p className="text-sm text-mist">
          No reviews yet — you'd be the first. This is the First Drop; come back once it's out in the world.
        </p>
      ) : (
        <div className="space-y-6">
          {productReviews.map((r) => (
            <div key={r.id} className="border-b border-line pb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-paper">{r.author}</span>
                <span className="text-xs text-mist">{r.rating} / 5 &middot; fit: {r.fitRating}</span>
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
