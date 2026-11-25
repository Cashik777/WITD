import { useEffect, useState } from 'react'
import { LL } from './LL'
import { useLocale } from '@/hooks/useLocale'

// Mobile visitors tend to scroll straight past the Hero's "Shop the Drop"
// button without clicking it, and nothing else on the homepage keeps a shop
// entry point within reach after that. Same visibility approach as
// StickyMobileBuyBar: a direct getBoundingClientRect() check on scroll, not
// an IntersectionObserver — an observer's callback can lag behind a fast
// mobile swipe and the bar fails to appear until the next scroll settles.
export function StickyMobileShopBar() {
  const [visible, setVisible] = useState(false)
  const { t } = useLocale()

  useEffect(() => {
    const checkPosition = () => {
      const el = document.getElementById('hero-section')
      if (!el) return
      const { bottom } = el.getBoundingClientRect()
      setVisible(bottom < 0)
    }

    checkPosition()
    window.addEventListener('scroll', checkPosition, { passive: true })
    window.addEventListener('resize', checkPosition)
    return () => {
      window.removeEventListener('scroll', checkPosition)
      window.removeEventListener('resize', checkPosition)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black border-t border-line px-5 py-3">
      <LL
        to="/shop"
        className="block text-center py-3 bg-paper text-black text-xs tracking-widest uppercase"
      >
        {t('hero.shopDrop')}
      </LL>
    </div>
  )
}
