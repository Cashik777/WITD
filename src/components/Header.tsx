import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { WitdSymbol } from './WitdSymbol'
import { SearchIcon, BagIcon, UserIcon, MenuIcon } from './icons'
import { useCart } from '@/hooks/useCart'
import { MobileNav } from './MobileNav'

const navLinks = [
  { label: 'SHOP', to: '/shop' },
  { label: 'NEW DROP', to: '/shop?collection=New%20Drop' },
  { label: 'ABOUT', to: '/about' },
  { label: 'COMMUNITY', to: '/community' },
]

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

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount, openCart } = useCart()
  const location = useLocation()

  return (
    <>
      <div className="sticky top-0 z-50 bg-black border-b border-line">
        <p className="max-w-content mx-auto px-5 md:px-8 h-9 flex items-center justify-center text-center text-[11px] tracking-wide text-paper/70">
          Free shipping over $150 &nbsp;/&nbsp; Free 14-day returns
        </p>
      </div>
      <header className="sticky top-9 z-40 bg-black/95 backdrop-blur border-b border-line">
        <div className="max-w-content mx-auto px-5 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <button
            className="md:hidden text-paper"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </button>

          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="WITD home">
            <WitdSymbol className="w-6 h-6 md:w-7 md:h-7 text-paper" />
            <span className="font-display text-lg md:text-xl tracking-wide text-paper">WITD</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = isNavLinkActive(link.to, location.pathname, location.search)
              return (
                <Link
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
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-4 md:gap-5 text-paper">
            <Link to="/search" aria-label="Search" className="hover:opacity-70 transition-opacity">
              <SearchIcon />
            </Link>
            <Link to="/account" aria-label="Account" className="hidden md:inline-flex hover:opacity-70 transition-opacity">
              <UserIcon />
            </Link>
            <button
              aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
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
