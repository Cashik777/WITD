import { useEffect, useRef, useState, type ReactNode } from 'react'
import { WitdSymbol } from '@/components/WitdSymbol'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

// Focuses (scales up, brightens) whichever philosophy section is centered
// in the viewport as the page scrolls, and dims the rest — makes reading
// feel guided rather than a flat wall of paragraphs. Hovering a section
// (mouse or, on touch, a tap-and-hold) forces it into focus too, regardless
// of scroll position.
function FocusSection({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Only counts as "in view" while inside the middle band of the
    // viewport, so the currently-centered section is the one that lights
    // up as you scroll past it rather than anything merely on-screen.
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const focused = inView || hovered

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`transition-all duration-500 ease-witd ${focused ? 'opacity-100 scale-100' : 'opacity-45 scale-[0.96]'} ${className}`}
    >
      {children}
    </div>
  )
}

export default function About() {
  useDocumentMeta('About — WITD', 'The idea behind WITD, shipping, returns, and how to reach us.')
  return (
    <div>
      <section className="max-w-content mx-auto px-5 md:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
        <h1 className="font-display text-5xl md:text-7xl text-paper max-w-3xl leading-[0.95]">
          Wake in the dream.
        </h1>
      </section>

      <section className="border-t border-line">
        <FocusSection className="max-w-content mx-auto px-5 md:px-8 py-20 md:py-28 grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16">
          <h2 className="text-xs tracking-widest uppercase text-mist">The Dream</h2>
          <p className="font-display text-2xl md:text-3xl text-paper/90 leading-snug max-w-2xl">
            Most of life runs on autopilot — habit, reaction, the next notification. It has the texture of a dream:
            vivid while it&rsquo;s happening, hard to remember why you made half the choices you made.
          </p>
        </FocusSection>
      </section>

      <section className="border-t border-line bg-[#0F0F0D]">
        <FocusSection className="max-w-content mx-auto px-5 md:px-8 py-20 md:py-28 grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16">
          <h2 className="text-xs tracking-widest uppercase text-mist">The Observer</h2>
          <p className="font-display text-2xl md:text-3xl text-paper/90 leading-snug max-w-2xl">
            There&rsquo;s a part of you that notices the dream instead of just living inside it. WITD is built for
            that part — the observer behind the noise, watching, awake.
          </p>
        </FocusSection>
      </section>

      <section className="border-t border-line">
        <FocusSection className="max-w-content mx-auto px-5 md:px-8 py-20 md:py-28 grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16">
          <h2 className="text-xs tracking-widest uppercase text-mist">The Choice</h2>
          <p className="font-display text-2xl md:text-3xl text-paper/90 leading-snug max-w-2xl">
            Waking up doesn&rsquo;t change the dream. It changes what you do inside it. Once you notice you&rsquo;re
            choosing, you can&rsquo;t fully go back to pretending you weren&rsquo;t.
          </p>
        </FocusSection>
      </section>

      <section className="border-t border-line bg-[#0F0F0D]">
        <FocusSection className="max-w-content mx-auto px-5 md:px-8 py-24 md:py-32 flex flex-col items-center text-center">
          <h2 className="text-xs tracking-widest uppercase text-mist mb-10">The Symbol</h2>
          <WitdSymbol className="w-20 h-20 md:w-28 md:h-28 text-paper" />
          <p className="mt-10 text-sm md:text-base text-paper/75 max-w-md leading-relaxed">
            Three arcs, one center. The arcs are the raw material of perception — what gets fed in. The bar at the
            center is the observer, the fixed point that decides what to do with it.
          </p>
        </FocusSection>
      </section>

      <section className="border-t border-line">
        <FocusSection className="max-w-content mx-auto px-5 md:px-8 py-20 md:py-28 grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16">
          <h2 className="text-xs tracking-widest uppercase text-mist">The Clothes</h2>
          <p className="font-display text-2xl md:text-3xl text-paper/90 leading-snug max-w-2xl">
            Heavyweight cotton, boxy fits, and small marks instead of loud logos. Built to be worn daily by people
            who&rsquo;d rather the clothes stay quiet and let the wearer do the talking.
          </p>
        </FocusSection>
      </section>

      <section id="shipping" className="border-t border-line scroll-mt-20">
        <div className="max-w-content mx-auto px-5 md:px-8 py-16 grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16">
          <h2 className="text-xs tracking-widest uppercase text-mist">Shipping</h2>
          <p className="text-sm text-paper/70 max-w-xl leading-relaxed">
            Orders ship within 3–5 business days from Toronto, Canada. Domestic shipping is flat-rate; free on
            orders over $150 CAD. International shipping times vary by destination.
          </p>
        </div>
      </section>

      <section id="returns" className="border-t border-line scroll-mt-20">
        <div className="max-w-content mx-auto px-5 md:px-8 py-16 grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16">
          <h2 className="text-xs tracking-widest uppercase text-mist">Returns</h2>
          <p className="text-sm text-paper/70 max-w-xl leading-relaxed">
            Unworn items in original condition can be returned within 14 days of delivery. Reach out through the
            contact details below to start a return.
          </p>
        </div>
      </section>

      <section id="contact" className="border-t border-line scroll-mt-20">
        <div className="max-w-content mx-auto px-5 md:px-8 py-16 grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16">
          <h2 className="text-xs tracking-widest uppercase text-mist">Contact</h2>
          <p className="text-sm text-paper/70 max-w-xl leading-relaxed">
            hello@wakeinthedream.com
          </p>
        </div>
      </section>
    </div>
  )
}
