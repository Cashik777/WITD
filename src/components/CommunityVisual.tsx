import { WitdSymbol } from './WitdSymbol'

// Abstract stand-in for real photography on the "Join the community" panel —
// a loose constellation of observers (small nodes) connected around the
// mark, standing in for "a growing group of people" without stock photos of
// strangers pretending to be a community that doesn't exist yet.
const nodes = [
  { x: 60, y: 60 }, { x: 340, y: 50 }, { x: 40, y: 220 }, { x: 355, y: 200 },
  { x: 110, y: 255 }, { x: 290, y: 255 }, { x: 70, y: 150 }, { x: 320, y: 130 },
]
const center = { x: 200, y: 150 }

export function CommunityVisual() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0F0F0D] border border-line">
      <svg viewBox="0 0 400 300" className="w-full h-full" aria-hidden="true">
        {nodes.map((n, i) => (
          <line
            key={`l-${i}`}
            x1={center.x}
            y1={center.y}
            x2={n.x}
            y2={n.y}
            stroke="#8F8B82"
            strokeOpacity="0.25"
            strokeWidth="1"
          />
        ))}
        {nodes.map((n, i) => (
          <circle key={`n-${i}`} cx={n.x} cy={n.y} r={i % 3 === 0 ? 3.5 : 2.5} fill="#F4F2EC" fillOpacity="0.5" />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <WitdSymbol className="w-16 md:w-20" />
      </div>
    </div>
  )
}
