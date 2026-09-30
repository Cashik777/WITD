import { WitdSymbol } from './WitdSymbol'

// Abstract stand-in for real photography on the homepage "WITD Idea" panel —
// the symbol at rest, with perception rippling outward from it. Matches the
// section's copy (noticing the dream instead of just living inside it)
// without needing a product/lifestyle photo shoot.
export function IdeaVisual() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#161513] border border-line">
      <svg viewBox="0 0 400 500" className="w-full h-full" aria-hidden="true">
        <defs>
          <radialGradient id="idea-glow" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#1C1B17" />
            <stop offset="100%" stopColor="#0B0B0A" />
          </radialGradient>
        </defs>
        <rect width="400" height="500" fill="url(#idea-glow)" />
        {[95, 150, 205, 260].map((r, i) => (
          <circle
            key={r}
            cx="200"
            cy="235"
            r={r}
            fill="none"
            stroke="#F4F2EC"
            strokeOpacity={0.09 - i * 0.018}
            strokeWidth="1"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <WitdSymbol className="w-40 md:w-48 -translate-y-6" />
      </div>
    </div>
  )
}
