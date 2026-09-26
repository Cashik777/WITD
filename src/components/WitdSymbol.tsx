// The WITD mark: an aperture/eye built from three arcs (the RGB components of
// perception) around a single pupil bar (the observer). This is a
// placeholder built to spec — swap the arc/pupil markup for final production
// artwork any time; every call site just renders <WitdSymbol /> so nothing
// else needs to change. See also /public/assets/brand/witd-symbol.svg and
// witd-logo.svg for static-file versions (favicon, OG image, etc).

export function WitdSymbol({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label="WITD symbol" role="img">
      <path d="M50 12 A38 38 0 0 1 82.9 69" fill="none" stroke="#3E6B52" strokeWidth="9" strokeLinecap="round" />
      <path d="M82.9 69 A38 38 0 0 1 17.1 69" fill="none" stroke="#3A5578" strokeWidth="9" strokeLinecap="round" />
      <path d="M17.1 69 A38 38 0 0 1 50 12" fill="none" stroke="#8C4A3E" strokeWidth="9" strokeLinecap="round" />
      <rect x="46" y="32" width="8" height="36" rx="4" fill="currentColor" />
    </svg>
  )
}
