import { useEffect, useState } from 'react'
import { getProductById } from '@/data/products'
import type { Product } from '@/types/product'

const STORAGE_KEY = 'witd:recently-viewed'
const MAX_ITEMS = 8

export function useRecentlyViewed(currentProductId?: string) {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      setIds(raw ? (JSON.parse(raw) as string[]) : [])
    } catch {
      setIds([])
    }
  }, [])

  useEffect(() => {
    if (!currentProductId) return
    setIds((prev) => {
      const next = [currentProductId, ...prev.filter((id) => id !== currentProductId)].slice(0, MAX_ITEMS)
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* best-effort only */
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProductId])

  const products: Product[] = ids
    .filter((id) => id !== currentProductId)
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p))

  return products
}
