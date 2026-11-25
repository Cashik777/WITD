import { useNavigate } from 'react-router-dom'
import type { SyntheticEvent } from 'react'
import { WitdSymbol } from './WitdSymbol'
import { CloseIcon } from './icons'
import { LL } from './LL'
import { useLocale } from '@/hooks/useLocale'

interface MobileNavProps {
  open: boolean
  onClose: () => void
  links: { label: string; to: string }[]
}

export function MobileNav({ open, onClose, links }: MobileNavProps) {
  const navigate = useNavigate()
  const { t, path } = useLocale()

  // A plain <Link onClick> relies on the browser synthesizing a click after
  // the tap — which, on this panel specifically, real phones (and a
  // dispatched TouchEvent in testing) don't reliably do, leaving the link
  // completely dead on touch despite working fine with a mouse. Navigating
  // explicitly on touchend — and preventDefault to stop a duplicate
  // synthesized click from firing — makes it work regardless of whether
  // that synthesis happens.
  const go = (to: string) => (e: SyntheticEvent) => {
    e.preventDefault()
    onClose()
    navigate(path(to))
  }

  return (
    <div
      className={`fixed inset-0 z-50 md:hidden transition-visibility ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ease-witd ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute inset-y-0 left-0 w-[84%] max-w-sm bg-black border-r border-line flex flex-col transition-transform duration-300 ease-witd ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-line">
          <LL to="/" onClick={go('/')} onTouchEnd={go('/')} className="flex items-center gap-2.5">
            <WitdSymbol className="w-6 h-6 text-paper" />
            <span className="font-display text-lg text-paper">WITD</span>
          </LL>
          <button aria-label={t('nav.closeMenu')} onClick={onClose} className="text-paper">
            <CloseIcon />
          </button>
        </div>

        <nav className="flex flex-col px-5 py-6 gap-1">
          {links.map((link) => (
            <LL
              key={link.label}
              to={link.to}
              onClick={go(link.to)}
              onTouchEnd={go(link.to)}
              className="py-3.5 text-sm tracking-widest uppercase text-paper border-b border-line/60"
            >
              {link.label}
            </LL>
          ))}
        </nav>

        <div className="mt-auto px-5 py-6 text-xs text-mist tracking-wide">
          {t('mobileNav.tagline')}
        </div>
      </div>
    </div>
  )
}
