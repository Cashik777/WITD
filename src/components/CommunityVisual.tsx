import { CursorTrail } from './CursorTrail'

// Abstract stand-in for real photography on the "Join the community" panel —
// an organic node network (closer to neurons firing than a logo lockup):
// each point connects to its nearest neighbors rather than radiating from
// one center, so it reads as a decentralized, still-growing group rather
// than a hub with the brand mark stamped in the middle.
const nodes = [
  { x: 55, y: 55 }, { x: 140, y: 40 }, { x: 230, y: 60 }, { x: 320, y: 45 },
  { x: 370, y: 115 }, { x: 40, y: 130 }, { x: 125, y: 115 }, { x: 205, y: 135 },
  { x: 290, y: 130 }, { x: 355, y: 210 }, { x: 75, y: 210 }, { x: 160, y: 200 },
  { x: 245, y: 215 }, { x: 45, y: 265 }, { x: 130, y: 270 }, { x: 215, y: 270 },
  { x: 300, y: 260 },
]

const edges: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [1, 6], [2, 7], [3, 8], [4, 8],
  [5, 6], [6, 7], [7, 8], [8, 9], [5, 10], [6, 11], [7, 11], [7, 12], [8, 12],
  [9, 12], [9, 16], [10, 11], [11, 12], [12, 16], [10, 13], [11, 14], [12, 15],
  [13, 14], [14, 15], [15, 16],
]

export function CommunityVisual() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0F0F0D] border border-line">
      <svg viewBox="0 0 400 300" className="w-full h-full" aria-hidden="true">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="#8F8B82"
            strokeOpacity="0.3"
            strokeWidth="1"
          />
        ))}
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={i % 4 === 0 ? 3.5 : 2.5} fill="#F4F2EC" fillOpacity="0.55" />
        ))}
      </svg>
      <CursorTrail color="#F4F2EC" />
    </div>
  )
}
