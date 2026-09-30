import { useEffect, useRef } from 'react'
import { CursorTrail } from './CursorTrail'

// A small "trace the shape" toy standing in for real photography on the
// homepage "WITD Idea" panel — echoes the copy (noticing something instead
// of just moving through it) by rewarding attention: trace the outline with
// the cursor, and once it's fully connected, it dissolves into the next
// shape. All checkpoint/segment state is written directly to the DOM via
// refs on each pointer move rather than through React state, since this
// fires on every mousemove and a re-render per hit would be wasteful.
interface Point {
  x: number
  y: number
}

const VIEW_W = 400
const VIEW_H = 500
const CENTER: Point = { x: 200, y: 250 }
const N = 48
const HIT_RADIUS = 20
const COMPLETE_RATIO = 0.92

function circlePoints(): Point[] {
  const R = 140
  return Array.from({ length: N }, (_, i) => {
    const t = (i / N) * Math.PI * 2
    return { x: CENTER.x + Math.cos(t) * R, y: CENTER.y + Math.sin(t) * R }
  })
}

function polygonPoints(sides: number, rotationDeg: number, R: number): Point[] {
  const verts = Array.from({ length: sides }, (_, i) => {
    const t = (rotationDeg * Math.PI) / 180 + (i / sides) * Math.PI * 2
    return { x: CENTER.x + Math.cos(t) * R, y: CENTER.y + Math.sin(t) * R }
  })
  const perSide = N / sides
  const pts: Point[] = []
  for (let s = 0; s < sides; s++) {
    const a = verts[s]
    const b = verts[(s + 1) % sides]
    for (let k = 0; k < perSide; k++) {
      const t = k / perSide
      pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    }
  }
  return pts
}

function spiralPoints(): Point[] {
  const turns = 2.5
  const maxR = 150
  return Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1)
    const angle = t * Math.PI * 2 * turns
    const r = t * maxR
    return { x: CENTER.x + Math.cos(angle) * r, y: CENTER.y + Math.sin(angle) * r }
  })
}

const SHAPES: { points: Point[]; closed: boolean }[] = [
  { points: circlePoints(), closed: true },
  { points: polygonPoints(3, -90, 150), closed: true },
  { points: polygonPoints(4, -45, 150), closed: true },
  { points: spiralPoints(), closed: false },
]

export function IdeaVisual() {
  const svgRef = useRef<SVGSVGElement>(null)
  const groupRef = useRef<SVGGElement>(null)
  const ghostRef = useRef<SVGPolylineElement>(null)
  const hintRef = useRef<HTMLParagraphElement>(null)
  const pointRefs = useRef<(SVGCircleElement | null)[]>([])
  const segRefs = useRef<(SVGLineElement | null)[]>([])
  const shapeIndex = useRef(0)
  const lit = useRef<boolean[]>(new Array(N).fill(false))
  const litCount = useRef(0)
  const transitioning = useRef(false)
  const hintHidden = useRef(false)
  const timeouts = useRef<number[]>([])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const applyShape = (index: number) => {
      const shape = SHAPES[index]
      const pts = shape.points
      const ghostPts = shape.closed ? [...pts, pts[0]] : pts
      ghostRef.current?.setAttribute('points', ghostPts.map((p) => `${p.x},${p.y}`).join(' '))

      pts.forEach((p, i) => {
        const c = pointRefs.current[i]
        if (!c) return
        c.setAttribute('cx', String(p.x))
        c.setAttribute('cy', String(p.y))
        c.setAttribute('r', '2.5')
        c.setAttribute('fill-opacity', '0.35')
      })

      const segCount = shape.closed ? N : N - 1
      for (let i = 0; i < N; i++) {
        const line = segRefs.current[i]
        if (!line) continue
        if (i < segCount) {
          const a = pts[i]
          const b = pts[(i + 1) % N]
          line.setAttribute('x1', String(a.x))
          line.setAttribute('y1', String(a.y))
          line.setAttribute('x2', String(b.x))
          line.setAttribute('y2', String(b.y))
          line.setAttribute('stroke-opacity', '0')
          line.style.display = ''
        } else {
          line.style.display = 'none'
        }
      }

      lit.current = new Array(N).fill(false)
      litCount.current = 0
    }

    const updateSegments = () => {
      const shape = SHAPES[shapeIndex.current]
      const segCount = shape.closed ? N : N - 1
      for (let i = 0; i < segCount; i++) {
        const bothLit = lit.current[i] && lit.current[(i + 1) % N]
        const line = segRefs.current[i]
        if (line) line.setAttribute('stroke-opacity', bothLit ? '0.8' : '0')
      }
    }

    const startTransition = () => {
      transitioning.current = true
      for (let i = 0; i < N; i++) {
        const c = pointRefs.current[i]
        if (c) {
          c.setAttribute('fill-opacity', '1')
          c.setAttribute('r', '4')
        }
        const line = segRefs.current[i]
        if (line) line.setAttribute('stroke-opacity', '0.9')
      }
      const group = groupRef.current
      const t1 = window.setTimeout(() => {
        if (group) group.style.opacity = '0'
        const t2 = window.setTimeout(() => {
          shapeIndex.current = (shapeIndex.current + 1) % SHAPES.length
          applyShape(shapeIndex.current)
          if (group) {
            void group.getBoundingClientRect() // force reflow so the opacity change below transitions in
            group.style.opacity = '1'
          }
          transitioning.current = false
        }, 400)
        timeouts.current.push(t2)
      }, 500)
      timeouts.current.push(t1)
    }

    const toSvgPoint = (clientX: number, clientY: number) => {
      const rect = svg.getBoundingClientRect()
      return {
        x: ((clientX - rect.left) / rect.width) * VIEW_W,
        y: ((clientY - rect.top) / rect.height) * VIEW_H,
      }
    }

    const onMove = (e: MouseEvent) => {
      if (transitioning.current) return
      const p = toSvgPoint(e.clientX, e.clientY)
      const pts = SHAPES[shapeIndex.current].points
      let newlyLit = false
      for (let i = 0; i < N; i++) {
        if (lit.current[i]) continue
        const dx = p.x - pts[i].x
        const dy = p.y - pts[i].y
        if (dx * dx + dy * dy <= HIT_RADIUS * HIT_RADIUS) {
          lit.current[i] = true
          litCount.current++
          newlyLit = true
          const c = pointRefs.current[i]
          if (c) {
            c.setAttribute('fill-opacity', '1')
            c.setAttribute('r', '4')
          }
        }
      }
      if (newlyLit) {
        updateSegments()
        if (!hintHidden.current && hintRef.current) {
          hintHidden.current = true
          hintRef.current.style.opacity = '0'
        }
        if (litCount.current >= Math.ceil(N * COMPLETE_RATIO)) {
          startTransition()
        }
      }
    }

    applyShape(shapeIndex.current)
    svg.addEventListener('mousemove', onMove)

    return () => {
      svg.removeEventListener('mousemove', onMove)
      timeouts.current.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#161513] border border-line">
      <svg ref={svgRef} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-full" aria-hidden="true">
        <defs>
          <radialGradient id="idea-glow" cx="50%" cy="47%" r="65%">
            <stop offset="0%" stopColor="#1C1B17" />
            <stop offset="100%" stopColor="#0B0B0A" />
          </radialGradient>
        </defs>
        <rect width={VIEW_W} height={VIEW_H} fill="url(#idea-glow)" />
        <g ref={groupRef} style={{ transition: 'opacity 400ms ease', opacity: 1 }}>
          <polyline ref={ghostRef} fill="none" stroke="#F4F2EC" strokeOpacity="0.15" strokeWidth="1" />
          {Array.from({ length: N }).map((_, i) => (
            <line
              key={`seg-${i}`}
              ref={(el) => {
                segRefs.current[i] = el
              }}
              stroke="#F4F2EC"
              strokeWidth="1.5"
              strokeOpacity="0"
              style={{ transition: 'stroke-opacity 200ms ease' }}
            />
          ))}
          {Array.from({ length: N }).map((_, i) => (
            <circle
              key={`pt-${i}`}
              ref={(el) => {
                pointRefs.current[i] = el
              }}
              r="2.5"
              fill="#F4F2EC"
              fillOpacity="0.35"
              style={{ transition: 'fill-opacity 200ms ease, r 200ms ease' }}
            />
          ))}
        </g>
      </svg>
      <CursorTrail color="#F4F2EC" />
      <p
        ref={hintRef}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] tracking-widest uppercase text-paper/40 pointer-events-none transition-opacity duration-500"
      >
        Trace the shape
      </p>
    </div>
  )
}
