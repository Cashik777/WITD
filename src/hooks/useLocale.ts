import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { getLocaleFromPathname, localizePath, type Locale } from '@/lib/locale'

// Single source of truth for "what language is this page in" — read from
// the URL (not from i18next's own state, which only tracks the last call to
// changeLanguage and could go stale across a client-side route change that
// swaps /fr/... for /de/...). Also keeps i18next's active language in sync,
// so t() inside this render and any `<Trans>`-style usage sees the right copy.
export function useLocale() {
  const { pathname } = useLocation()
  const locale = getLocaleFromPathname(pathname)
  const { t, i18n } = useTranslation()

  useEffect(() => {
    if (i18n.language !== locale) i18n.changeLanguage(locale)
  }, [locale, i18n])

  return { locale, t, path: (p: string) => localizePath(p, locale) }
}

export type { Locale }
