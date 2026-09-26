import { useEffect, useRef, useState } from 'react'

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
          <div key={img + i} className="aspect-[4/5] bg-[#151412] overflow-hidden">
            <img src={img} alt={name} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  )
}
