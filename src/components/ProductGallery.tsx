import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { productImage } from '@/lib/productImage'
import { useLocale } from '@/hooks/useLocale'

// Larger than other image contexts on the site — both the desktop hover
// zoom and the mobile pinch zoom scale this same loaded image up to ~2.2x,
// so it needs real headroom above its on-screen display size to stay sharp.
const GALLERY_WIDTH = 1400
const GALLERY_HEIGHT = 1750

// Source photos are 2000x2000px (Lanczos-upscaled + unsharp-masked from the
// original 1000x1000 Printful mockups — see scripts/upscale_products.py —
// since Printful's own API/dashboard both cap mockup exports at 1000px).
// That doubles the real sampling headroom a zoom can draw on before the
// browser's own interpolation becomes visible, so these caps sit close to
// the original pre-mitigation values again.
const MOBILE_MAX_ZOOM = 2.2
const DOUBLE_TAP_ZOOM = 2

// How far (as a fraction of the viewport width) a mobile swipe has to travel
// before release counts as "go to the next/previous photo" rather than
// snapping back to the one you started on.
const SWIPE_COMMIT_RATIO = 0.18
// How many pixels of movement decide whether a touch is a horizontal swipe
// (page the gallery) or a vertical one (scroll the page) in the first
// place — see the gesture-commit comment on the track's touch handlers.
const AXIS_COMMIT_PX = 8

// Desktop-only hover zoom: follows the cursor instead of just scaling from
// the center, so whatever part of the garment you're pointing at is what
// gets magnified — a flat center-zoom would usually magnify the wrong spot.
// onClick advances to the next photo — a second, more discoverable way to
// page through besides the small arrow buttons, since clicking the photo
// itself is what most people try first.
function ZoomableImage({ src, alt, onClick }: { src: string; alt: string; onClick?: () => void }) {
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
      className="aspect-[4/5] bg-[#151412] overflow-hidden cursor-pointer"
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => setZoomed(false)}
      onMouseMove={onMouseMove}
      onClick={onClick}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 ease-out"
        style={{ transform: zoomed ? 'scale(2.2)' : 'scale(1)', transformOrigin: origin }}
      />
    </div>
  )
}

// Mobile pinch-to-zoom + double-tap, confined to the photo itself. Swiping
// between photos and scrolling the page are both handled one level up, by
// the track in ProductGallery — this component only ever calls
// preventDefault for a gesture that's actually zooming or panning a zoomed
// photo, so it never competes with that.
function MobileZoomableImage({
  src,
  alt,
  isActive,
  onZoomChange,
}: {
  src: string
  alt: string
  isActive: boolean
  onZoomChange: (zoomed: boolean) => void
}) {
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
    onZoomChange(state.current.scale > 1.01)
  }

  const reset = (animated: boolean) => {
    state.current = { scale: 1, x: 0, y: 0 }
    apply(animated)
  }

  // Swiping away from this slide (or switching color) should land the next
  // view at 1x, not however the last person left it zoomed.
  useEffect(() => {
    if (!isActive) reset(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div ref={containerRef} className="w-full h-full shrink-0 overflow-hidden">
      <img ref={imgRef} src={src} alt={alt} className="w-full h-full object-cover" draggable={false} />
    </div>
  )
}

// Left/right chevron for the desktop carousel's prev/next buttons.
function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path
        d={direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const { t } = useLocale()
  const [active, setActive] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const zoomedRef = useRef(false)
  const activeRef = useRef(0)
  activeRef.current = active

  const setTrackTransform = (index: number, dragPx: number, animated: boolean) => {
    const track = trackRef.current
    const viewport = viewportRef.current
    if (!track || !viewport) return
    const widthPx = viewport.clientWidth || 1
    let dragPercent = (dragPx / widthPx) * 100
    // Resistance past the first/last photo — a drag that goes nowhere still
    // gives a little visual "give" instead of feeling like a dead stop.
    if ((index === 0 && dragPx > 0) || (index === images.length - 1 && dragPx < 0)) {
      dragPercent *= 0.3
    }
    track.style.transition = animated ? 'transform 250ms ease-out' : 'none'
    track.style.transform = `translateX(calc(${-index * 100}% + ${dragPercent}%))`
  }

  // Reset to the first image whenever the color (and therefore the image
  // set) changes, and keep the mobile track in sync.
  useEffect(() => {
    setActive(0)
    setTrackTransform(0, 0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images])

  useEffect(() => {
    setTrackTransform(active, 0, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  // The mobile track used to rely on native overflow-x-auto scroll-snap,
  // with touch-action telling the browser which axis to hand it versus the
  // page's own vertical scroll. In practice that axis guess was exactly
  // that — a guess — and felt inconsistent (reported directly: "sometimes
  // it works, sometimes I just drag the photo"). This instead commits to an
  // axis explicitly, in JS, the first moment a touch has moved more than
  // AXIS_COMMIT_PX: mostly-horizontal movement takes over the gesture to
  // page between photos (and calls preventDefault from then on so the page
  // doesn't also try to scroll); mostly-vertical movement does nothing at
  // all here, leaving the browser's native page scroll completely
  // unobstructed for the rest of that gesture. Once a zoomed photo is
  // panning (zoomedRef, set by MobileZoomableImage), this track ignores
  // touches entirely and lets that component handle them on its own.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const gesture = { mode: 'none' as 'none' | 'horizontal' | 'vertical', startX: 0, startY: 0, lastDx: 0 }

    const onTouchStart = (e: TouchEvent) => {
      if (zoomedRef.current || e.touches.length !== 1) {
        gesture.mode = 'none'
        return
      }
      gesture.mode = 'none'
      gesture.startX = e.touches[0].clientX
      gesture.startY = e.touches[0].clientY
      gesture.lastDx = 0
    }

    const onTouchMove = (e: TouchEvent) => {
      if (zoomedRef.current || e.touches.length !== 1) return
      const dx = e.touches[0].clientX - gesture.startX
      const dy = e.touches[0].clientY - gesture.startY

      if (gesture.mode === 'none' && (Math.abs(dx) > AXIS_COMMIT_PX || Math.abs(dy) > AXIS_COMMIT_PX)) {
        gesture.mode = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
      }
      if (gesture.mode === 'horizontal') {
        e.preventDefault()
        gesture.lastDx = dx
        setTrackTransform(activeRef.current, dx, false)
      }
      // mode === 'vertical': untouched on purpose — the browser scrolls the page.
    }

    const onTouchEnd = () => {
      if (gesture.mode !== 'horizontal') return
      const el2 = viewportRef.current
      const widthPx = el2?.clientWidth || 1
      const ratio = gesture.lastDx / widthPx
      const current = activeRef.current
      let next = current
      if (ratio < -SWIPE_COMMIT_RATIO && current < images.length - 1) next = current + 1
      else if (ratio > SWIPE_COMMIT_RATIO && current > 0) next = current - 1
      gesture.mode = 'none'
      if (next !== current) setActive(next)
      else setTrackTransform(current, 0, true)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length])

  // Wraps at both ends on desktop (arrows have no page-number readout, so a
  // dead stop at the last photo reads as "broken button," not "end of
  // list") — mobile's drag release above clamps instead, which suits a
  // physical swipe gesture better than a sudden wraparound jump would.
  const goTo = (delta: number) => setActive((a) => (a + delta + images.length) % images.length)

  return (
    <div>
      {/* Mobile: swipeable track with dots. aspect-[4/5] matches the photos'
          own ratio (GALLERY_WIDTH/HEIGHT below) — this used to be
          aspect-square, which made object-cover crop a meaningful strip off
          the top and bottom of every photo on a phone. */}
      <div ref={viewportRef} className="md:hidden w-full overflow-hidden aspect-[4/5] bg-[#151412]">
        <div ref={trackRef} className="flex w-full h-full">
          {images.map((img, i) => (
            <MobileZoomableImage
              key={img + i}
              src={productImage(img, GALLERY_WIDTH, GALLERY_HEIGHT)}
              alt={name}
              isActive={active === i}
              onZoomChange={(z) => {
                zoomedRef.current = z
              }}
            />
          ))}
        </div>
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

      {/* Desktop: one photo at a time with prev/next arrows, not a static
          grid of every angle at once — a 2-column grid of 4 photos read as
          four small squares instead of one photo worth looking closely at.
          Capped at max-w-md and centered rather than filling (and hugging
          the left edge of) the whole half-width column — at a normal
          desktop window that column is wide enough to blow the photo up to
          an uncomfortable, hard-to-take-in size.
          A thumbnail row here was the first fix for the empty space that
          leaves next to the info column's longer idea/size/material/
          shipping text, but low-res thumbnails that "show nothing useful"
          were worse than the gap they covered (reported directly). Sticky
          positioning instead: the photo stays in view while the (often
          taller) info column scrolls past it, so there's never a visible
          gap to begin with — it only unsticks once this whole grid row
          itself has scrolled by, right as the full-width details section
          below takes over. 116px = the sticky announcement bar (36px) +
          header (80px) stacked on top of it (Header.tsx). */}
      <div className="hidden md:block md:sticky md:top-[116px] max-w-md mx-auto">
        <div className="relative">
          <ZoomableImage
            src={productImage(images[active], GALLERY_WIDTH, GALLERY_HEIGHT)}
            alt={name}
            onClick={() => goTo(1)}
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(-1)}
                aria-label={t('common.previousPhoto')}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 text-paper hover:bg-black/70 transition-colors"
              >
                <Arrow direction="left" />
              </button>
              <button
                type="button"
                onClick={() => goTo(1)}
                aria-label={t('common.nextPhoto')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 text-paper hover:bg-black/70 transition-colors"
              >
                <Arrow direction="right" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
