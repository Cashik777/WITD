import { supportedLocales, type Locale } from '@/i18n/config'

export { supportedLocales }
export type { Locale }

export const localeLabels: Record<Locale, string> = { en: 'EN', fr: 'FR', de: 'DE', es: 'ES' }

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (supportedLocales as readonly string[]).includes(value)
}

// English is the site's default and carries no URL prefix (every existing
// link/bookmark/share already assumes that) — fr/de/es get a leading
// /fr, /de, /es segment instead. Building every internal link through this
// means adding a language later is a one-line change to supportedLocales,
// not a hunt through every <Link to="...">.
export function localizePath(path: string, locale: Locale): string {
  if (locale === 'en') return path
  return `/${locale}${path.startsWith('/') ? path : `/${path}`}`
}

// Strips a known locale prefix off a pathname, e.g. "/fr/shop" -> "/shop",
// "/shop" -> "/shop". Used to figure out "what page am I on" independent of
// language, e.g. for the language switcher to rebuild the same page in a
// different locale.
export function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/(fr|de|es)(\/.*|$)/)
  if (!match) return pathname
  return match[2] || '/'
}

// The inverse read: which locale does this pathname's prefix say we're in.
export function getLocaleFromPathname(pathname: string): Locale {
  const match = pathname.match(/^\/(fr|de|es)(\/|$)/)
  return match ? (match[1] as Locale) : 'en'
}
