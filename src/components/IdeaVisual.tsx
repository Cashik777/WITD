import { useEffect, useRef, useState } from 'react'
import { CursorTrail } from './CursorTrail'

// A small "trace the shape" toy standing in for real photography on the
// homepage "WITD Idea" panel — echoes the copy (noticing something instead
// of just moving through it) by rewarding attention: trace the outline with
// the cursor, and once it's fully connected, it dissolves into the next
// shape from a large, shuffled set (circles, polygons, stars, a spiral,
// a heart, an infinity loop, a cross, an arrow, flowers...). All
// checkpoint/segment state is written directly to the DOM via refs on each
// pointer move rather than through React state, since this fires on every
// mousemove and a re-render per hit would be wasteful.
interface Point {
  x: number
  y: number
}

const VIEW_W = 400
const VIEW_H = 500
const CENTER: Point = { x: 200, y: 250 }
const N = 48
const HIT_RADIUS = 20
const HIT_RADIUS_TOUCH = 34
const COMPLETE_RATIO = 0.85

// Trace 20 shapes and earn 20% off. Progress itself is intentionally NOT
// persisted — a fresh page load always starts the quest over at 20, so
// there's always a reward available to go earn. That's safe to be generous
// with because the thing that actually matters (checkout.ts) gates the
// discount on email, not on the code itself: a code only redeems on an
// email with no prior paid order, so refreshing for more codes doesn't get
// anyone more than one working discount per email they control. The earned
// code+expiry DO get written to localStorage, purely so Checkout.tsx can
// prefill it without the customer having to copy-paste.
const QUEST_TOTAL = 20
const QUEST_COUPON_KEY = 'witd_quest_coupon'
const QUEST_COUPON_EXPIRES_KEY = 'witd_quest_coupon_expires'

function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// navigator.clipboard?.writeText(...).then(...) throws when
// navigator.clipboard is undefined — optional chaining just makes the whole
// call resolve to undefined, and undefined has no .then. That's a real dead
// end on browsers/contexts without the Clipboard API (some mobile in-app
// webviews), so this falls back to the old execCommand('copy') trick via a
// hidden textarea, and never throws either way.
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to the legacy path below
  }
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

// Every shape is reduced to a dense vertex path, then resampled down to
// exactly N evenly-spaced-by-arc-length checkpoints — so wildly different
// shapes (a star's short inner edges vs. a heart's long sweeping curves)
// all end up with consistent, fair-to-trace point spacing.
function distributeAlongVertices(vertices: Point[], closed: boolean, count: number): Point[] {
  const segCount = closed ? vertices.length : vertices.length - 1
  const lengths: number[] = []
  let total = 0
  for (let i = 0; i < segCount; i++) {
    const a = vertices[i]
    const b = vertices[(i + 1) % vertices.length]
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    lengths.push(len)
    total += len
  }
  const pts: Point[] = []
  for (let k = 0; k < count; k++) {
    const target = (k / count) * total
    let acc = 0
    for (let i = 0; i < segCount; i++) {
      if (acc + lengths[i] >= target || i === segCount - 1) {
        const a = vertices[i]
        const b = vertices[(i + 1) % vertices.length]
        const t = lengths[i] > 0 ? Math.min(1, Math.max(0, (target - acc) / lengths[i])) : 0
        pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
        break
      }
      acc += lengths[i]
    }
  }
  return pts
}

function regularPolygon(sides: number, rotationDeg: number, R: number): Point[] {
  return Array.from({ length: sides }, (_, i) => {
    const t = (rotationDeg * Math.PI) / 180 + (i / sides) * Math.PI * 2
    return { x: CENTER.x + Math.cos(t) * R, y: CENTER.y + Math.sin(t) * R }
  })
}

function star(points: number, innerRatio: number, rotationDeg: number, outerR: number): Point[] {
  const innerR = outerR * innerRatio
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outerR : innerR
    const t = (rotationDeg * Math.PI) / 180 + (i / (points * 2)) * Math.PI * 2
    return { x: CENTER.x + Math.cos(t) * r, y: CENTER.y + Math.sin(t) * r }
  })
}

function circle(R: number): Point[] {
  return Array.from({ length: 96 }, (_, i) => {
    const t = (i / 96) * Math.PI * 2
    return { x: CENTER.x + Math.cos(t) * R, y: CENTER.y + Math.sin(t) * R }
  })
}

function spiral(turns: number, maxR: number, clockwise: boolean): Point[] {
  const dir = clockwise ? 1 : -1
  return Array.from({ length: 160 }, (_, i) => {
    const t = i / 159
    const angle = dir * t * Math.PI * 2 * turns
    const r = t * maxR
    return { x: CENTER.x + Math.cos(angle) * r, y: CENTER.y + Math.sin(angle) * r }
  })
}

function heart(scale: number): Point[] {
  return Array.from({ length: 120 }, (_, i) => {
    const t = (i / 120) * Math.PI * 2
    const x = 16 * Math.sin(t) ** 3
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    return { x: CENTER.x + x * scale, y: CENTER.y + y * scale }
  })
}

function infinity(R: number): Point[] {
  return Array.from({ length: 140 }, (_, i) => {
    const t = (i / 140) * Math.PI * 2
    const denom = 1 + Math.sin(t) * Math.sin(t)
    return { x: CENTER.x + (R * Math.cos(t)) / denom, y: CENTER.y + (R * Math.sin(t) * Math.cos(t)) / denom }
  })
}

function flower(petals: number, R: number): Point[] {
  return Array.from({ length: 160 }, (_, i) => {
    const t = (i / 160) * Math.PI * 2
    const r = R * Math.cos(petals * t)
    return { x: CENTER.x + Math.cos(t) * r, y: CENTER.y + Math.sin(t) * r }
  })
}

function fromLocalVerts(raw: [number, number][]): Point[] {
  return raw.map(([x, y]) => ({ x: CENTER.x + x, y: CENTER.y + y }))
}

function cross(a: number, w: number): Point[] {
  return fromLocalVerts([
    [-w, -a], [w, -a], [w, -w], [a, -w], [a, w], [w, w],
    [w, a], [-w, a], [-w, w], [-a, w], [-a, -w], [-w, -w],
  ])
}

function arrow(s: number): Point[] {
  return fromLocalVerts([
    [0, -s], [s * 0.6, -s * 0.35], [s * 0.3, -s * 0.35], [s * 0.3, s],
    [-s * 0.3, s], [-s * 0.3, -s * 0.35], [-s * 0.6, -s * 0.35],
  ])
}

// Sized a bit smaller than the panel could fit (R ~120 instead of ~150) so
// the traceable area sits with real margin from the panel edges — easier to
// reach every point comfortably with a fingertip instead of hugging the
// border.
const RAW_SHAPES: { verts: Point[]; closed: boolean }[] = [
  { verts: circle(112), closed: true },
  { verts: regularPolygon(3, -90, 120), closed: true },
  { verts: regularPolygon(3, 90, 120), closed: true },
  { verts: regularPolygon(4, 0, 120), closed: true },
  { verts: regularPolygon(4, 45, 120), closed: true },
  { verts: regularPolygon(5, -90, 120), closed: true },
  { verts: regularPolygon(6, 0, 120), closed: true },
  { verts: regularPolygon(7, -90, 120), closed: true },
  { verts: regularPolygon(8, 0, 120), closed: true },
  { verts: regularPolygon(9, -90, 120), closed: true },
  { verts: regularPolygon(10, 0, 120), closed: true },
  { verts: regularPolygon(11, -90, 120), closed: true },
  { verts: regularPolygon(12, 0, 120), closed: true },
  { verts: star(4, 0.45, 0, 120), closed: true },
  { verts: star(5, 0.5, -90, 120), closed: true },
  { verts: star(5, 0.65, -90, 120), closed: true },
  { verts: star(6, 0.55, 0, 120), closed: true },
  { verts: star(6, 0.7, 0, 120), closed: true },
  { verts: star(7, 0.55, -90, 120), closed: true },
  { verts: star(8, 0.6, 0, 120), closed: true },
  { verts: star(8, 0.45, 0, 120), closed: true },
  { verts: star(9, 0.55, -90, 120), closed: true },
  { verts: star(10, 0.6, 0, 120), closed: true },
  { verts: star(12, 0.65, 0, 120), closed: true },
  { verts: spiral(2.5, 120, true), closed: false },
  { verts: spiral(2.5, 120, false), closed: false },
  { verts: spiral(4, 112, true), closed: false },
  { verts: heart(6.8), closed: true },
  { verts: infinity(120), closed: true },
  { verts: cross(96, 32), closed: true },
  { verts: arrow(120), closed: true },
  { verts: flower(5, 120), closed: true },
  { verts: flower(3, 120), closed: true },
]

// Reduce every raw shape to exactly N checkpoints up front, and shuffle the
// order once per page load so the cycle doesn't play identically every time.
const SHAPES: { points: Point[]; closed: boolean }[] = RAW_SHAPES.map((s) => ({
  points: distributeAlongVertices(s.verts, s.closed, N),
  closed: s.closed,
}))
for (let i = SHAPES.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1))
  ;[SHAPES[i], SHAPES[j]] = [SHAPES[j], SHAPES[i]]
}

export function IdeaVisual() {
  const svgRef = useRef<SVGSVGElement>(null)
  const groupRef = useRef<SVGGElement>(null)
  const ghostRef = useRef<SVGPolylineElement>(null)
  const pointRefs = useRef<(SVGCircleElement | null)[]>([])
  const segRefs = useRef<(SVGLineElement | null)[]>([])
  const shapeIndex = useRef(0)
  const lit = useRef<boolean[]>(new Array(N).fill(false))
  const litCount = useRef(0)
  const transitioning = useRef(false)
  const timeouts = useRef<number[]>([])

  const [remaining, setRemaining] = useState(QUEST_TOTAL)
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [couponExpiresAt, setCouponExpiresAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [copied, setCopied] = useState(false)
  const [claimFailed, setClaimFailed] = useState(false)
  const [claimAttempt, setClaimAttempt] = useState(0)

  // Fires the moment the 20th shape is completed — claims the code
  // server-side and persists it (code + expiry) so the reward survives a
  // reload. A flaky connection (more likely on mobile) used to leave this
  // permanently stuck — one failed fetch and the effect's dependencies
  // never changed again, so it never got a second try. Now a failure
  // retries automatically with a short backoff, and if it keeps failing,
  // shows a manual retry instead of silently doing nothing forever.
  useEffect(() => {
    if (remaining > 0 || couponCode) return
    let cancelled = false
    setClaimFailed(false)
    fetch('/api/coupons/claim', { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error(`claim failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled || !data.code) throw new Error('claim response missing code')
        window.localStorage.setItem(QUEST_COUPON_KEY, data.code)
        setCouponCode(data.code)
        if (data.expiresAt) {
          const ts = new Date(data.expiresAt).getTime()
          window.localStorage.setItem(QUEST_COUPON_EXPIRES_KEY, String(ts))
          setCouponExpiresAt(ts)
        }
      })
      .catch(() => {
        if (cancelled) return
        if (claimAttempt < 3) {
          window.setTimeout(() => {
            if (!cancelled) setClaimAttempt((n) => n + 1)
          }, 1500)
        } else {
          setClaimFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [remaining, couponCode, claimAttempt])

  // Ticks the countdown while a code is live, and resets the whole quest
  // once it lapses — the code is single-use anyway, so there's no reason to
  // keep showing a dead one instead of letting them earn a fresh one.
  useEffect(() => {
    if (!couponCode || !couponExpiresAt) return
    if (now >= couponExpiresAt) {
      window.localStorage.removeItem(QUEST_COUPON_KEY)
      window.localStorage.removeItem(QUEST_COUPON_EXPIRES_KEY)
      setCouponCode(null)
      setCouponExpiresAt(null)
      setRemaining(QUEST_TOTAL)
      return
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [couponCode, couponExpiresAt, now])

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

      setRemaining((prev) => (prev > 0 ? prev - 1 : prev))
    }

    // The panel isn't always the viewBox's own 4:5 ratio (it's a square on
    // mobile), so the default preserveAspectRatio="xMidYMid meet" letterboxes
    // the content — centers it and scales it to fit the narrower dimension,
    // not a plain stretch-to-fill. A naive rect.width/rect.height ratio
    // ignores that letterbox offset entirely, which quietly put every touch
    // point off from where the shape is actually drawn on a non-4:5 panel.
    const toSvgPoint = (clientX: number, clientY: number) => {
      const rect = svg.getBoundingClientRect()
      const scale = Math.min(rect.width / VIEW_W, rect.height / VIEW_H)
      const offsetX = (rect.width - VIEW_W * scale) / 2
      const offsetY = (rect.height - VIEW_H * scale) / 2
      return {
        x: (clientX - rect.left - offsetX) / scale,
        y: (clientY - rect.top - offsetY) / scale,
      }
    }

    const handlePoint = (clientX: number, clientY: number, hitRadius: number) => {
      if (transitioning.current) return
      const p = toSvgPoint(clientX, clientY)
      const pts = SHAPES[shapeIndex.current].points
      let newlyLit = false
      for (let i = 0; i < N; i++) {
        if (lit.current[i]) continue
        const dx = p.x - pts[i].x
        const dy = p.y - pts[i].y
        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
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
        if (litCount.current >= Math.ceil(N * COMPLETE_RATIO)) {
          startTransition()
        }
      }
    }

    const onMouseMove = (e: MouseEvent) => handlePoint(e.clientX, e.clientY, HIT_RADIUS)
    // A touchmove here would otherwise just scroll the page — preventDefault
    // so dragging a finger traces the shape instead, the same as a mouse. A
    // fingertip is far less precise than a cursor, so touch gets a
    // noticeably bigger hit radius than the mouse does.
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return
      e.preventDefault()
      handlePoint(touch.clientX, touch.clientY, HIT_RADIUS_TOUCH)
    }

    applyShape(shapeIndex.current)
    svg.addEventListener('mousemove', onMouseMove)
    svg.addEventListener('touchstart', onTouchMove, { passive: false })
    svg.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      svg.removeEventListener('mousemove', onMouseMove)
      svg.removeEventListener('touchstart', onTouchMove)
      svg.removeEventListener('touchmove', onTouchMove)
      timeouts.current.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden rounded-t-2xl bg-[#161513] border border-line flex flex-col">
      <style>{`
        @keyframes wq-pop {
          0% { transform: scale(0.82); opacity: 0; }
          65% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div className="shrink-0 text-center py-3 px-4 border-b border-line">
        {couponCode ? (
          <button
            onClick={() => {
              copyText(couponCode).then((ok) => {
                if (!ok) return
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1500)
              })
            }}
            className="w-full"
          >
            <p className="text-[10px] tracking-widest uppercase text-mist">
              20% off unlocked — tap to copy
              {couponExpiresAt != null && ` · ${formatCountdown(couponExpiresAt - now)}`}
            </p>
            <p className="mt-0.5 text-lg font-display italic tracking-wide text-paper animate-[wq-pop_420ms_ease]">
              {copied ? 'Copied!' : couponCode}
            </p>
          </button>
        ) : remaining === 0 && claimFailed ? (
          <button
            onClick={() => {
              setClaimFailed(false)
              setClaimAttempt(0)
            }}
            className="w-full"
          >
            <p className="text-[10px] tracking-widest uppercase text-mist">Couldn't reach the server</p>
            <p className="mt-0.5 text-lg font-display italic tracking-wide text-paper">Tap to try again</p>
          </button>
        ) : remaining === 0 ? (
          <p className="text-lg font-display italic tracking-wide text-paper animate-pulse">Unlocking your code…</p>
        ) : remaining < QUEST_TOTAL ? (
          <div key={remaining} className="animate-[wq-pop_420ms_ease]">
            <p className="text-[10px] tracking-widest uppercase text-mist">You got</p>
            <p className="mt-0.5 text-lg font-display italic tracking-wide text-paper">
              +{QUEST_TOTAL - remaining}% off your first order
            </p>
          </div>
        ) : (
          <p className="text-lg font-display italic tracking-wide text-paper animate-pulse">
            Connect all the dots
          </p>
        )}
      </div>

      <div className="relative flex-1 min-h-0">
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
      </div>
    </div>
  )
}
