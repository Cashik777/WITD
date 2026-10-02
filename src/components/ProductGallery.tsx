import { useEffect, useRef, useState, type MouseEvent } from 'react'

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
          <img
            key={img + i}
            src={img}
            alt={name}
            className="w-full h-full shrink-0 snap-center object-cover"
          />
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
