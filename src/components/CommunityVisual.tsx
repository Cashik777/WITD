import { useEffect, useRef } from 'react'

// Abstract stand-in for real photography on the "Join the community" panel —
// an organic node network (closer to neurons firing than a logo lockup).
// The nodes themselves react to the cursor: whichever ones are nearest get
// pulled toward it (falling off with distance), so moving the mouse feels
// like dragging the mesh around — then everything eases back to its rest
// position once the cursor leaves.
const homeNodes = [
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

const VIEW_W = 400
const VIEW_H = 300
const PULL_RADIUS = 150
const MAX_PULL = 0.85
const EASE = 0.15

export function CommunityVisual() {
  const svgRef = useRef<SVGSVGElement>(null)
  const circleRefs = useRef<(SVGCircleElement | null)[]>([])
  const lineRefs = useRef<(SVGLineElement | null)[]>([])
  const positions = useRef(homeNodes.map((n) => ({ x: n.x, y: n.y })))
  const mouse = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const toSvgPoint = (clientX: number, clientY: number) => {
      const rect = svg.getBoundingClientRect()
      return {
        x: ((clientX - rect.left) / rect.width) * VIEW_W,
        y: ((clientY - rect.top) / rect.height) * VIEW_H,
      }
    }

    const onMove = (e: MouseEvent) => {
      mouse.current = toSvgPoint(e.clientX, e.clientY)
    }
    const onLeave = () => {
      mouse.current = null
    }
    svg.addEventListener('mousemove', onMove)
    svg.addEventListener('mouseleave', onLeave)

    let raf = 0
    const tick = () => {
      const m = mouse.current
      const pos = positions.current
      for (let i = 0; i < homeNodes.length; i++) {
        const home = homeNodes[i]
        let targetX = home.x
        let targetY = home.y
        if (m) {
          const dx = m.x - home.x
          const dy = m.y - home.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const influence = Math.max(0, 1 - dist / PULL_RADIUS)
          const pull = influence * influence * MAX_PULL
          targetX = home.x + dx * pull
          targetY = home.y + dy * pull
        }
        pos[i].x += (targetX - pos[i].x) * EASE
        pos[i].y += (targetY - pos[i].y) * EASE

        const circle = circleRefs.current[i]
        if (circle) {
          circle.setAttribute('cx', String(pos[i].x))
          circle.setAttribute('cy', String(pos[i].y))
        }
      }
      edges.forEach(([a, b], i) => {
        const line = lineRefs.current[i]
        if (line) {
          line.setAttribute('x1', String(pos[a].x))
          line.setAttribute('y1', String(pos[a].y))
          line.setAttribute('x2', String(pos[b].x))
          line.setAttribute('y2', String(pos[b].y))
        }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      svg.removeEventListener('mousemove', onMove)
      svg.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0F0F0D] border border-line">
      <svg ref={svgRef} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-full" aria-hidden="true">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            ref={(el) => {
              lineRefs.current[i] = el
            }}
            x1={homeNodes[a].x}
            y1={homeNodes[a].y}
            x2={homeNodes[b].x}
            y2={homeNodes[b].y}
            stroke="#8F8B82"
            strokeOpacity="0.3"
            strokeWidth="1"
          />
        ))}
        {homeNodes.map((n, i) => (
          <circle
            key={i}
            ref={(el) => {
              circleRefs.current[i] = el
            }}
            cx={n.x}
            cy={n.y}
            r={i % 4 === 0 ? 3.5 : 2.5}
            fill="#F4F2EC"
            fillOpacity="0.55"
          />
        ))}
      </svg>
    </div>
  )
}
