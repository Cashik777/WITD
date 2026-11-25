import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { WitdSymbol } from './WitdSymbol'
import { SearchIcon, BagIcon, UserIcon, MenuIcon } from './icons'
import { useCart } from '@/hooks/useCart'
import { useCurrency } from '@/context/CurrencyContext'
import { formatPrice } from '@/lib/format'
import { shippingPolicy, store } from '@/lib/store'
import { MobileNav } from './MobileNav'
import { LL } from './LL'
import { useLocale } from '@/hooks/useLocale'
import { supportedLocales, localeLabels, stripLocalePrefix } from '@/lib/locale'

function useNavLinks() {
  const { t } = useLocale()
  return [
    { label: t('nav.shop'), to: '/shop' },
    { label: t('nav.newDrop'), to: '/shop?collection=New%20Drop' },
    { label: t('nav.about'), to: '/about' },
    { label: t('nav.community'), to: '/community' },
  ]
}

// SHOP and NEW DROP both point at /shop (one plain, one with a ?collection=
// filter), so react-router's NavLink — which only matches on pathname —
// used to mark both active at once whenever either was selected. Match on
// the full pathname+search instead so exactly one link is active.
function isNavLinkActive(to: string, pathname: string, search: string): boolean {
  const [linkPath, linkQuery] = to.split('?')
  if (linkPath !== pathname) return false
  const linkCollection = new URLSearchParams(linkQuery ?? '').get('collection')
  const currentCollection = new URLSearchParams(search).get('collection')
  return linkCollection === currentCollection
}

function LanguageSwitcher() {
  const { locale } = useLocale()
  const location = useLocation()
  const bare = stripLocalePrefix(location.pathname)

  return (
    <div className="flex items-center text-[11px] tracking-widest">
      {supportedLocales.map((l, i) => (
        <Link
          key={l}
          to={`${l === 'en' ? '' : `/${l}`}${bare}${location.search}`}
          className={`px-1.5 ${i === 0 ? '' : 'border-l border-line'} ${
            locale === l ? 'text-paper' : 'text-mist hover:text-paper/80'
          } transition-colors`}
        >
          {localeLabels[l]}
        </Link>
      ))}
    </div>
  )
}

function CurrencySwitcher() {
  const { t } = useLocale()
  const { currency, setCurrency, locked } = useCurrency()

  return (
    <div
      className={`flex items-center text-[11px] tracking-widest ${locked ? 'opacity-40' : ''}`}
      title={locked ? t('header.currencyLocked') : undefined}
    >
      {(['CAD', 'USD', 'EUR'] as const).map((c, i) => (
        <button
          key={c}
          onClick={() => !locked && setCurrency(c)}
          disabled={locked}
          className={`px-1.5 ${i === 0 ? '' : 'border-l border-line'} ${
            currency === c ? 'text-paper' : 'text-mist hover:text-paper/80'
          } ${locked ? 'cursor-not-allowed' : ''} transition-colors`}
        >
          {c}
        </button>
      ))}
    </div>
  )
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount, openCart } = useCart()
  const { currency } = useCurrency()
  const policy = shippingPolicy(currency)
  const location = useLocation()
  const { t } = useLocale()
  const navLinks = useNavLinks()
  const barePathname = stripLocalePrefix(location.pathname)

  return (
    <>
      <div className="sticky top-0 z-50 bg-black border-b border-line">
        <p className="max-w-content mx-auto px-5 md:px-8 h-9 flex items-center justify-center text-center text-[11px] tracking-wide text-paper/70">
          {t('header.freeShipping', { amount: formatPrice(policy.freeShippingThreshold, currency) })} &nbsp;/&nbsp;{' '}
          {t('header.freeReturns', { days: store.returnWindowDays })}
        </p>
      </div>
      <header className="sticky top-9 z-40 bg-black/95 backdrop-blur border-b border-line">
        <div className="max-w-content mx-auto px-5 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <button
            className="md:hidden text-paper"
            aria-label={t('nav.openMenu')}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </button>

          <LL to="/" className="flex items-center gap-2.5 shrink-0" aria-label="WITD home">
            <WitdSymbol className="w-6 h-6 md:w-7 md:h-7 text-paper" />
            <span className="font-display text-lg md:text-xl tracking-wide text-paper">WITD</span>
          </LL>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = isNavLinkActive(link.to, barePathname, location.search)
              return (
                <LL
                  key={link.label}
                  to={link.to}
                  className="relative group text-xs tracking-widest uppercase text-paper/80 hover:text-paper transition-colors duration-200 pb-1"
                >
                  {link.label}
                  <span
                    className={`absolute left-0 -bottom-0.5 h-px w-full bg-paper origin-left transition-transform duration-300 ease-witd ${
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </LL>
              )
            })}
          </nav>

          <div className="flex items-center gap-4 md:gap-5 text-paper">
            <LanguageSwitcher />
            <CurrencySwitcher />
            <LL to="/search" aria-label={t('nav.search')} className="hover:opacity-70 transition-opacity">
              <SearchIcon />
            </LL>
            <LL to="/account" aria-label={t('nav.account')} className="hidden md:inline-flex hover:opacity-70 transition-opacity">
              <UserIcon />
            </LL>
            <button
              aria-label={`${t('nav.cart')}, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
              onClick={openCart}
              className="relative hover:opacity-70 transition-opacity"
            >
              <BagIcon />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-paper text-black text-[10px] leading-4 text-center font-sans font-medium">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} links={navLinks} />
    </>
  )
}
