import { useEffect, useRef } from 'react'

// A small endless toy standing in for real photography on the homepage
// "WITD Idea" panel — a snake made of bubbles wanders the panel and grows a
// new segment every so often; moving the cursor near a bubble pops it. The
// snake never "loses" — pop it down to nothing and a fresh one spawns a
// moment later. Runs entirely on canvas via a single rAF loop (no React
// state per frame — the segment/burst arrays are plain mutable closures).
interface Segment {
  x: number
  y: number
}

interface Burst {
  x: number
  y: number
  start: number
}

const SPACING = 32
const BUBBLE_R = 16
const POP_RADIUS = 34
const MAX_SEGMENTS = 30
const GROWTH_INTERVAL = 650
const BURST_DURATION = 320
const WANDER_STRENGTH = 0.06
const SPEED = 0.09
const MARGIN = 40
const FOLLOW_EASE = 0.35

export function IdeaVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hintRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let bgGradient: CanvasGradient | null = null
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      bgGradient = ctx.createRadialGradient(width / 2, height * 0.47, 0, width / 2, height * 0.47, Math.max(width, height) * 0.65)
      bgGradient.addColorStop(0, '#1C1B17')
      bgGradient.addColorStop(1, '#0B0B0A')
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    let segments: Segment[] = []
    let bursts: Burst[] = []
    const head = { vx: 0, vy: 0 }
    let lastGrowth = 0
    let respawnAt = 0
    let hintShown = false

    // Starts from a single bubble at a random spot each time — not pinned to
    // the center or an edge — and grows outward from there via the same
    // per-interval growth below.
    const spawnSnake = () => {
      const angle = Math.random() * Math.PI * 2
      head.vx = Math.cos(angle) * SPEED
      head.vy = Math.sin(angle) * SPEED
      segments = [
        {
          x: MARGIN + Math.random() * (width - MARGIN * 2),
          y: MARGIN + Math.random() * (height - MARGIN * 2),
        },
      ]
    }
    spawnSnake()

    const mouse = { x: -9999, y: -9999 }
    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      if (!hintShown && hintRef.current) {
        hintShown = true
        hintRef.current.style.opacity = '0'
      }
    }
    const onLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }
    parent.addEventListener('mousemove', onMove)
    parent.addEventListener('mouseleave', onLeave)

    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(now - last, 50)
      last = now

      if (segments.length === 0) {
        if (respawnAt === 0) respawnAt = now + 500
        else if (now >= respawnAt) {
          respawnAt = 0
          spawnSnake()
        }
      } else {
        head.vx += (Math.random() - 0.5) * WANDER_STRENGTH
        head.vy += (Math.random() - 0.5) * WANDER_STRENGTH
        const speed = Math.hypot(head.vx, head.vy) || 1
        head.vx = (head.vx / speed) * SPEED
        head.vy = (head.vy / speed) * SPEED

        const h = segments[0]
        let nx = h.x + head.vx * dt
        let ny = h.y + head.vy * dt
        if (nx < MARGIN) {
          nx = MARGIN
          head.vx = Math.abs(head.vx)
        }
        if (nx > width - MARGIN) {
          nx = width - MARGIN
          head.vx = -Math.abs(head.vx)
        }
        if (ny < MARGIN) {
          ny = MARGIN
          head.vy = Math.abs(head.vy)
        }
        if (ny > height - MARGIN) {
          ny = height - MARGIN
          head.vy = -Math.abs(head.vy)
        }
        h.x = nx
        h.y = ny

        for (let i = 1; i < segments.length; i++) {
          const prev = segments[i - 1]
          const cur = segments[i]
          const dx = prev.x - cur.x
          const dy = prev.y - cur.y
          const dist = Math.hypot(dx, dy) || 0.0001
          if (dist > SPACING) {
            const correction = (dist - SPACING) * FOLLOW_EASE
            cur.x += (dx / dist) * correction
            cur.y += (dy / dist) * correction
          }
        }

        if (now - lastGrowth > GROWTH_INTERVAL && segments.length < MAX_SEGMENTS) {
          lastGrowth = now
          const tail = segments[segments.length - 1]
          segments.push({ x: tail.x, y: tail.y })
        }

        const survivors: Segment[] = []
        for (const s of segments) {
          const d = Math.hypot(s.x - mouse.x, s.y - mouse.y)
          if (d < POP_RADIUS) {
            bursts.push({ x: s.x, y: s.y, start: now })
          } else {
            survivors.push(s)
          }
        }
        segments = survivors
      }

      ctx.clearRect(0, 0, width, height)
      if (bgGradient) {
        ctx.fillStyle = bgGradient
        ctx.fillRect(0, 0, width, height)
      }

      if (segments.length > 1) {
        ctx.strokeStyle = 'rgba(143,139,130,0.35)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(segments[0].x, segments[0].y)
        for (let i = 1; i < segments.length; i++) ctx.lineTo(segments[i].x, segments[i].y)
        ctx.stroke()
      }

      for (const s of segments) {
        const grad = ctx.createRadialGradient(s.x - BUBBLE_R * 0.3, s.y - BUBBLE_R * 0.3, 0.5, s.x, s.y, BUBBLE_R)
        grad.addColorStop(0, 'rgba(244,242,236,0.9)')
        grad.addColorStop(1, 'rgba(244,242,236,0.25)')
        ctx.beginPath()
        ctx.fillStyle = grad
        ctx.arc(s.x, s.y, BUBBLE_R, 0, Math.PI * 2)
        ctx.fill()
      }

      bursts = bursts.filter((b) => now - b.start < BURST_DURATION)
      for (const b of bursts) {
        const t = (now - b.start) / BURST_DURATION
        ctx.beginPath()
        ctx.strokeStyle = `rgba(244,242,236,${1 - t})`
        ctx.lineWidth = 1.5
        ctx.arc(b.x, b.y, BUBBLE_R + t * 28, 0, Math.PI * 2)
        ctx.stroke()
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      parent.removeEventListener('mousemove', onMove)
      parent.removeEventListener('mouseleave', onLeave)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#161513] border border-line">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <p
        ref={hintRef}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] tracking-widest uppercase text-paper/40 pointer-events-none transition-opacity duration-500"
      >
        Pop the bubbles
      </p>
    </div>
  )
}
