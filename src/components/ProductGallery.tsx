import { useEffect, useRef, useState, type MouseEvent } from 'react'

// Max zoom is deliberately capped near the real ceiling of the source
// photography, not an arbitrary "feels nice" number: the product shots are
// 1000x1000px, but object-cover on this slide's 4:5 box already downscales
// them to roughly 49% of native resolution at 1x on a typical phone width —
// so ~2x of further zoom lands right back at native pixel density, and
// anything past that is just upscaling blur, not real detail.
const MOBILE_MAX_ZOOM = 2.2
const DOUBLE_TAP_ZOOM = 2

// Desktop-only hover zoom: follows the cursor instead of just scaling from
// the center, so whatever part of the garment you're pointing at is what
// gets magnified — a flat center-zoom would usually magnify the wrong spot.
function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [zoomed, setZoomed] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setOrigin(`${x}% ${y}%`)
  }

  return (
    <div
      className="aspect-[4/5] bg-[#151412] overflow-hidden cursor-zoom-in"
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => setZoomed(false)}
      onMouseMove={onMouseMove}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 ease-out"
        style={{ transform: zoomed ? 'scale(1.9)' : 'scale(1)', transformOrigin: origin }}
      />
    </div>
  )
}

// Mobile pinch-to-zoom + double-tap, confined to the photo itself.
// Previously there was no touch handling at all here, so a pinch gesture
// fell through to the browser's own default — which zooms the *entire
// page* (header, nav, everything), not just the image. `touch-action:
// pan-x` on the container is what actually fixes that: it tells the browser
// "only native single-finger horizontal panning is allowed here," which
// both preserves the existing swipe-between-photos gesture AND excludes
// native pinch-zoom outright, leaving pinch free for this component's own
// JS handling without the two fighting each other.
//
// Gesture state lives in a ref and is applied straight to the img's own
// style, the same direct-DOM pattern Hero.tsx/IdeaVisual.tsx already use
// for scroll/pointer-driven transforms — going through React state on every
// touchmove would mean a re-render per frame of a drag, which visibly lags.
function MobileZoomableImage({ src, alt, isActive }: { src: string; alt: string; isActive: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const state = useRef({ scale: 1, x: 0, y: 0 })
  const gesture = useRef({
    mode: 'none' as 'none' | 'pinch' | 'pan',
    startDist: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    panStartX: 0,
    panStartY: 0,
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
  })

  const apply = (animated = false) => {
    const img = imgRef.current
    if (!img) return
    img.style.transition = animated ? 'transform 200ms ease-out' : 'none'
    img.style.transform = `translate(${state.current.x}px, ${state.current.y}px) scale(${state.current.scale})`
  }

  const reset = (animated: boolean) => {
    state.current = { scale: 1, x: 0, y: 0 }
    apply(animated)
  }

  // Swiping away from this slide (or switching color) should land the next
  // view at 1x, not however the last person left it zoomed.
  useEffect(() => {
    if (!isActive) reset(false)
  }, [isActive])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const clamp = (x: number, y: number, s: number, rect: DOMRect) => {
      const maxX = (rect.width * (s - 1)) / 2
      const maxY = (rect.height * (s - 1)) / 2
      return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) }
    }

    const onTouchStart = (e: TouchEvent) => {
      const g = gesture.current
      const s = state.current
      if (e.touches.length === 2) {
        e.preventDefault()
        g.mode = 'pinch'
        g.startDist = dist(e.touches)
        g.startScale = s.scale
        g.startX = s.x
        g.startY = s.y
        return
      }
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      const now = Date.now()
      const isDoubleTap =
        now - g.lastTapTime < 300 && Math.hypot(touch.clientX - g.lastTapX, touch.clientY - g.lastTapY) < 30
      if (isDoubleTap) {
        g.lastTapTime = 0
        const rect = el.getBoundingClientRect()
        if (s.scale > 1) {
          reset(true)
        } else {
          const tx = (rect.width / 2 - (touch.clientX - rect.left)) * (DOUBLE_TAP_ZOOM - 1)
          const ty = (rect.height / 2 - (touch.clientY - rect.top)) * (DOUBLE_TAP_ZOOM - 1)
          const c = clamp(tx, ty, DOUBLE_TAP_ZOOM, rect)
          state.current = { scale: DOUBLE_TAP_ZOOM, x: c.x, y: c.y }
          apply(true)
        }
        return
      }
      g.lastTapTime = now
      g.lastTapX = touch.clientX
      g.lastTapY = touch.clientY

      if (s.scale > 1) {
        e.preventDefault()
        g.mode = 'pan'
        g.panStartX = touch.clientX - s.x
        g.panStartY = touch.clientY - s.y
      } else {
        g.mode = 'none'
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      const g = gesture.current
      const s = state.current
      if (g.mode === 'pinch' && e.touches.length === 2) {
        e.preventDefault()
        const rect = el.getBoundingClientRect()
        const newScale = Math.min(MOBILE_MAX_ZOOM, Math.max(1, g.startScale * (dist(e.touches) / g.startDist)))
        const c = clamp(g.startX, g.startY, newScale, rect)
        state.current = { scale: newScale, x: c.x, y: c.y }
        apply()
      } else if (g.mode === 'pan' && e.touches.length === 1) {
        e.preventDefault()
        const touch = e.touches[0]
        const rect = el.getBoundingClientRect()
        const c = clamp(touch.clientX - g.panStartX, touch.clientY - g.panStartY, s.scale, rect)
        state.current = { ...s, x: c.x, y: c.y }
        apply()
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length > 0) return
      gesture.current.mode = 'none'
      if (state.current.scale <= 1.02) reset(true)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: false })
    el.addEventListener('touchcancel', onTouchEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full shrink-0 snap-center overflow-hidden touch-pan-x">
      <img ref={imgRef} src={src} alt={alt} className="w-full h-full object-cover" draggable={false} />
    </div>
  )
}

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  // Reset to the first image whenever the color (and therefore the image
  // set) changes, and keep the mobile swipe track in sync.
  useEffect(() => {
    setActive(0)
    trackRef.current?.scrollTo({ left: 0 })
  }, [images])

  const onTrackScroll = () => {
    const el = trackRef.current
    if (!el || el.clientWidth === 0) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div>
      {/* Mobile: swipeable track with dots. Desktop: large two-column stack. */}
      <div
        ref={trackRef}
        onScroll={onTrackScroll}
        className="flex md:hidden overflow-x-auto snap-x snap-mandatory aspect-[4/5] bg-[#151412] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((img, i) => (
          <MobileZoomableImage key={img + i} src={img} alt={name} isActive={active === i} />
        ))}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex md:hidden justify-center gap-1.5">
          {images.map((img, i) => (
            <span
              key={img + i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${active === i ? 'bg-paper' : 'bg-mist/40'}`}
            />
          ))}
        </div>
      )}

      <div className="hidden md:grid grid-cols-2 gap-3">
        {images.map((img, i) => (
          <ZoomableImage key={img + i} src={img} alt={name} />
        ))}
      </div>
    </div>
  )
}
