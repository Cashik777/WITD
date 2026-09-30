// Abstract stand-in for real photography on the homepage "WITD Idea" panel —
// a single point of focus with awareness rippling outward through scattered
// noise, echoing the copy (noticing the dream instead of just living inside
// it) without leaning on the logo to carry the idea.
const noise = [
  { x: 55, y: 80, r: 1.4 }, { x: 320, y: 60, r: 1.1 }, { x: 350, y: 140, r: 1.6 },
  { x: 40, y: 200, r: 1.2 }, { x: 300, y: 380, r: 1.4 }, { x: 70, y: 400, r: 1.1 },
  { x: 330, y: 300, r: 1.3 }, { x: 60, y: 320, r: 1.5 }, { x: 280, y: 150, r: 1.0 },
  { x: 130, y: 440, r: 1.2 }, { x: 270, y: 450, r: 1.1 }, { x: 100, y: 60, r: 1.3 },
]

export function IdeaVisual() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#161513] border border-line">
      <svg viewBox="0 0 400 500" className="w-full h-full" aria-hidden="true">
        <defs>
          <radialGradient id="idea-glow" cx="50%" cy="47%" r="65%">
            <stop offset="0%" stopColor="#1C1B17" />
            <stop offset="100%" stopColor="#0B0B0A" />
          </radialGradient>
          <radialGradient id="idea-point" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F4F2EC" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F4F2EC" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="500" fill="url(#idea-glow)" />
        {[70, 120, 170, 220, 270].map((r, i) => (
          <circle
            key={r}
            cx="200"
            cy="235"
            r={r}
            fill="none"
            stroke="#F4F2EC"
            strokeOpacity={0.1 - i * 0.017}
            strokeWidth="1"
          />
        ))}
        {noise.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={n.r} fill="#F4F2EC" fillOpacity="0.35" />
        ))}
        <circle cx="200" cy="235" r="26" fill="url(#idea-point)" />
        <circle cx="200" cy="235" r="3.5" fill="#F4F2EC" />
      </svg>
    </div>
  )
}
