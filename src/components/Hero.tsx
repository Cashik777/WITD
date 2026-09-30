import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// The two rings, three perception arcs, and center "pupil" are inlined
// (rather than the static /assets/hero/witd-hero.svg <img>) so scrolling can
// drive them directly — each ring/arc spins at its own rate/direction for a
// layered parallax feel, and the pupil "blinks" every so often as you scroll
// past it, echoing the WitdSymbol eye motif instead of sitting static.
const CENTER = { x: 1160, y: 420 }
const originStyle = { transformBox: 'view-box' as const, transformOrigin: `${CENTER.x}px ${CENTER.y}px` }

// The full 1600x1000 artwork puts the eye off-center (toward the right,
// balancing the headline on the left on desktop) — preserveAspectRatio=
// "xMidYMid slice" crops that box around its own geometric center (x=800),
// not around the eye (x=1160). On a narrow/tall phone viewport, width is
// the dimension that gets cropped to cover the screen, and the crop window
// was landing mostly to the LEFT of the eye — it barely showed, off-
// balance compared to the desktop composition. A separate viewBox, cropped
// tight and centered directly on the eye, fixes that: any further
// slice-cropping to fit a narrow screen stays symmetric around it instead.
const DESKTOP_VIEWBOX = '0 0 1600 1000'
const MOBILE_VIEWBOX = `${CENTER.x - 400} ${CENTER.y - 400} 800 800`

// Lags behind the page scroll instead of moving 1:1 with it — scrolling
// down still sends it up and off, just more slowly, so it doesn't vanish as
// abruptly as plain in-flow content would.
const PARALLAX_LAG = 0.35

export function Hero() {
  const ring1Ref = useRef<SVGCircleElement>(null)
  const ring2Ref = useRef<SVGCircleElement>(null)
  const arc1Ref = useRef<SVGPathElement>(null)
  const arc2Ref = useRef<SVGPathElement>(null)
  const arc3Ref = useRef<SVGPathElement>(null)
  const pupilRef = useRef<SVGCircleElement>(null)
  const parallaxRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    let ticking = false
    let lastBlinkY = window.scrollY
    let blinkTimeout: number | undefined

    const blink = () => {
      const p = pupilRef.current
      if (!p) return
      p.style.transition = 'transform 110ms ease'
      p.style.transform = 'scaleY(0.15)'
      blinkTimeout = window.setTimeout(() => {
        p.style.transform = 'scaleY(1)'
      }, 120)
    }

    const apply = () => {
      const y = window.scrollY
      if (parallaxRef.current) parallaxRef.current.style.transform = `translateY(${y * PARALLAX_LAG}px)`
      if (ring1Ref.current) ring1Ref.current.style.transform = `rotate(${y * 0.04}deg)`
      if (ring2Ref.current) ring2Ref.current.style.transform = `rotate(${-y * 0.07}deg)`
      if (arc1Ref.current) arc1Ref.current.style.transform = `rotate(${y * 0.1}deg)`
      if (arc2Ref.current) arc2Ref.current.style.transform = `rotate(${-y * 0.13}deg)`
      if (arc3Ref.current) arc3Ref.current.style.transform = `rotate(${y * 0.16}deg)`

      if (Math.abs(y - lastBlinkY) > 140) {
        lastBlinkY = y
        blink()
      }
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(apply)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (blinkTimeout) window.clearTimeout(blinkTimeout)
    }
  }, [])

  return (
    <section className="relative h-[92vh] min-h-[560px] w-full overflow-hidden bg-black">
      <div ref={parallaxRef} className="absolute inset-0">
        <svg
          viewBox={isMobile ? MOBILE_VIEWBOX : DESKTOP_VIEWBOX}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full opacity-70"
          aria-hidden="true"
        >
          <rect width="1600" height="1000" fill="#0B0B0A" />
          <g style={{ transform: 'rotate(180deg)', ...originStyle }}>
            <circle ref={ring1Ref} cx={CENTER.x} cy={CENTER.y} r="340" fill="none" stroke="#26251F" strokeWidth="1.5" style={originStyle} />
            <circle ref={ring2Ref} cx={CENTER.x} cy={CENTER.y} r="230" fill="none" stroke="#26251F" strokeWidth="1.5" style={originStyle} />
            <path ref={arc1Ref} d="M 900 420 A 260 260 0 0 1 1420 420" fill="none" stroke="#8FA98F" strokeWidth="2.5" opacity="0.35" style={originStyle} />
            <path ref={arc2Ref} d="M 940 340 A 260 300 0 0 1 1400 500" fill="none" stroke="#7E93B0" strokeWidth="2.5" opacity="0.3" style={originStyle} />
            <path ref={arc3Ref} d="M 960 520 A 260 260 0 0 1 1360 320" fill="none" stroke="#AD7B6E" strokeWidth="2.5" opacity="0.3" style={originStyle} />
            <circle ref={pupilRef} cx={CENTER.x} cy={CENTER.y} r="26" fill="#0B0B0A" stroke="#F4F2EC" strokeWidth="2" opacity="0.55" style={originStyle} />
          </g>
        </svg>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/30" />

      <div className="relative h-full max-w-content mx-auto px-5 md:px-8 flex flex-col justify-end pb-16 md:pb-20">
        <h1 className="font-display text-[13vw] md:text-[6.5vw] leading-[0.95] text-paper max-w-4xl">
          Wake in the dream.
        </h1>
        <p className="mt-5 text-sm md:text-base tracking-widest uppercase text-paper/80">
          You are here. Now choose how to move.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            to="/shop"
            className="px-7 py-3.5 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors duration-200"
          >
            Shop the Drop
          </Link>
          <Link
            to="/about"
            className="px-7 py-3.5 border border-paper/50 text-paper text-xs tracking-widest uppercase hover:border-paper transition-colors duration-200"
          >
            Enter WITD
          </Link>
        </div>
      </div>
    </section>
  )
}
