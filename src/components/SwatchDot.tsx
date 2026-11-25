import { colorSwatch } from '@/lib/colorSwatch'

// Renders a colourway's swatch dot. Most colors are one flat fill; a
// patterned colourway (camo, etc.) maps to a 2-hex array in colorSwatch and
// is rendered as two solid, independently-clipped halves instead of a
// gradient — a gradient's color-stop boundary gets antialiased/blurred by
// the rasterizer and reads as slightly off-center (flagged directly, more
// than once); two opaque layers cut with clip-path at exactly 50% have no
// interpolation to blur, so the seam lands exactly on center every time.
export function SwatchDot({ color, className, title }: { color: string; className: string; title?: string }) {
  const value = colorSwatch[color]
  if (Array.isArray(value)) {
    const [left, right] = value
    return (
      <span className={`relative block overflow-hidden ${className}`} style={{ backgroundColor: left }} title={title}>
        <span className="absolute inset-0" style={{ backgroundColor: right, clipPath: 'inset(0 0 0 50%)' }} />
      </span>
    )
  }
  return <span className={className} style={{ backgroundColor: value ?? '#8F8B82' }} title={title} />
}
