// Minimal hand-rolled line icons — keeps the storefront dependency-free.
// Swap for a proper icon set later if desired; call sites only rely on
// className/size props so the swap is contained here.

type IconProps = { className?: string }

export const SearchIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
  </svg>
)

export const BagIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 8h12l-1 13H7L6 8z" strokeLinejoin="round" />
    <path d="M9 8V6a3 3 0 016 0v2" strokeLinecap="round" />
  </svg>
)

export const UserIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20c1.6-3.6 4.4-5.4 7.5-5.4s5.9 1.8 7.5 5.4" strokeLinecap="round" />
  </svg>
)

export const MenuIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
  </svg>
)

export const CloseIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
  </svg>
)

export const ChevronDown = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const PlusIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
)

export const MinusIcon = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M5 12h14" strokeLinecap="round" />
  </svg>
)
