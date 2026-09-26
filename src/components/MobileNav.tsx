import { Link } from 'react-router-dom'
import { WitdSymbol } from './WitdSymbol'
import { CloseIcon } from './icons'

interface MobileNavProps {
  open: boolean
  onClose: () => void
  links: { label: string; to: string }[]
}

export function MobileNav({ open, onClose, links }: MobileNavProps) {
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
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
            <WitdSymbol className="w-6 h-6 text-paper" />
            <span className="font-display text-lg text-paper">WITD</span>
          </Link>
          <button aria-label="Close menu" onClick={onClose} className="text-paper">
            <CloseIcon />
          </button>
        </div>

        <nav className="flex flex-col px-5 py-6 gap-1">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={onClose}
              className="py-3.5 text-sm tracking-widest uppercase text-paper border-b border-line/60"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto px-5 py-6 text-xs text-mist tracking-wide">
          WAKE IN THE DREAM.
        </div>
      </div>
    </div>
  )
}
