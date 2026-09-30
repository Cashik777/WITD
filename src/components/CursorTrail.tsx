import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  r: number
}

// Scoped cursor-follow particle trail (à la antigravity.google), confined to
// whatever container renders it — listens for mousemove on the parent
// element rather than the window, and draws into a canvas sized to match.
export function CursorTrail({ color = '#F4F2EC', className = '' }: { color?: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(parent)

    let particles: Particle[] = []
    let lastEmit = 0

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const now = performance.now()
      if (now - lastEmit < 16) return
      lastEmit = now
      for (let i = 0; i < 2; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4 - 0.15,
          life: 0,
          maxLife: 700 + Math.random() * 500,
          r: 1 + Math.random() * 1.8,
        })
      }
      if (particles.length > 160) particles.splice(0, particles.length - 160)
    }
    parent.addEventListener('mousemove', onMove)
    const onLeave = () => {
      particles = []
    }
    parent.addEventListener('mouseleave', onLeave)

    let raf = 0
    let lastFrame = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(now - lastFrame, 50)
      lastFrame = now
      ctx.clearRect(0, 0, width, height)
      particles = particles.filter((p) => p.life < p.maxLife)
      for (const p of particles) {
        p.life += dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        const t = p.life / p.maxLife
        ctx.beginPath()
        ctx.fillStyle = color
        ctx.globalAlpha = (1 - t) * 0.6
        ctx.arc(p.x, p.y, p.r * (1 - t * 0.3), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      parent.removeEventListener('mousemove', onMove)
      parent.removeEventListener('mouseleave', onLeave)
      resizeObserver.disconnect()
    }
  }, [color])

  return <canvas ref={canvasRef} className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden="true" />
}
