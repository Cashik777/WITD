import { forwardRef } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { useLocale } from '@/hooks/useLocale'

// Drop-in replacement for react-router's <Link> that prefixes `to` with the
// current /fr, /de, /es segment (or leaves it bare for English) — so every
// internal link on a translated page stays on that language instead of
// bouncing back to English. External hrefs, #anchors on the same page, and
// mailto:/tel: links pass through untouched; only app-internal paths
// (starting with "/") get localized.
export const LL = forwardRef<HTMLAnchorElement, LinkProps>(function LL({ to, ...props }, ref) {
  const { path } = useLocale()
  const localizedTo =
    typeof to === 'string' && to.startsWith('/')
      ? path(to)
      : typeof to === 'object' && to.pathname?.startsWith('/')
        ? { ...to, pathname: path(to.pathname) }
        : to
  return <Link ref={ref} to={localizedTo} {...props} />
})
