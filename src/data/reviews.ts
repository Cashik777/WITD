// No reviews have been written yet — this is the First Drop. Keep this file
// empty (not fabricated) until real customer reviews exist; the product page
// reads through it and shows an honest "No reviews yet" state.

export interface Review {
  id: string
  productId: string
  author: string
  rating: number // 1-5
  fitRating: 'runs small' | 'true to size' | 'runs large'
  title: string
  body: string
  createdAt: string
}

export const reviews: Review[] = []

export function getReviewsForProduct(productId: string): Review[] {
  return reviews.filter((r) => r.productId === productId)
}

export function getFitSummary(productId: string): { average: number; count: number } | null {
  const productReviews = getReviewsForProduct(productId)
  if (productReviews.length === 0) return null
  const average = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
  return { average, count: productReviews.length }
}
