import { useEffect, useRef, useState, type ReactNode } from 'react'
import { WitdSymbol } from '@/components/WitdSymbol'
import { useLocale } from '@/hooks/useLocale'
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
  const { t } = useLocale()
  return (
    <div>
      <section className="max-w-content mx-auto px-5 md:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
        <h1 className="font-display text-5xl md:text-7xl text-paper max-w-3xl leading-[0.95]">
          {t('hero.title')}
        </h1>
      </section>

      <section className="border-t border-line">
        <FocusSection className="max-w-content mx-auto px-5 md:px-8 py-20 md:py-28 grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16">
          <h2 className="text-xs tracking-widest uppercase text-mist">{t('about.dreamTitle')}</h2>
          <p className="font-display text-2xl md:text-3xl text-paper/90 leading-snug max-w-2xl">{t('about.dreamBody')}</p>
        </FocusSection>
      </section>

      <section className="border-t border-line bg-[#0F0F0D]">
        <FocusSection className="max-w-content mx-auto px-5 md:px-8 py-20 md:py-28 grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16">
          <h2 className="text-xs tracking-widest uppercase text-mist">{t('about.observerTitle')}</h2>
          <p className="font-display text-2xl md:text-3xl text-paper/90 leading-snug max-w-2xl">{t('about.observerBody')}</p>
        </FocusSection>
      </section>

      <section className="border-t border-line">
        <FocusSection className="max-w-content mx-auto px-5 md:px-8 py-20 md:py-28 grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16">
          <h2 className="text-xs tracking-widest uppercase text-mist">{t('about.choiceTitle')}</h2>
          <p className="font-display text-2xl md:text-3xl text-paper/90 leading-snug max-w-2xl">{t('about.choiceBody')}</p>
        </FocusSection>
      </section>

      <section className="border-t border-line bg-[#0F0F0D]">
        <FocusSection className="max-w-content mx-auto px-5 md:px-8 py-24 md:py-32 flex flex-col items-center text-center">
          <h2 className="text-xs tracking-widest uppercase text-mist mb-10">{t('about.symbolTitle')}</h2>
          <WitdSymbol className="w-20 h-20 md:w-28 md:h-28 text-paper" />
          <p className="mt-10 text-sm md:text-base text-paper/75 max-w-md leading-relaxed">{t('about.symbolBody')}</p>
        </FocusSection>
      </section>

      <section className="border-t border-line">
        <FocusSection className="max-w-content mx-auto px-5 md:px-8 py-20 md:py-28 grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16">
          <h2 className="text-xs tracking-widest uppercase text-mist">{t('about.clothesTitle')}</h2>
          <p className="font-display text-2xl md:text-3xl text-paper/90 leading-snug max-w-2xl">{t('about.clothesBody')}</p>
        </FocusSection>
      </section>

      <section id="shipping" className="border-t border-line scroll-mt-20">
        <div className="max-w-content mx-auto px-5 md:px-8 py-16 grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16">
          <h2 className="text-xs tracking-widest uppercase text-mist">{t('footer.shipping')}</h2>
          <p className="text-sm text-paper/70 max-w-xl leading-relaxed">{t('about.shippingBody')}</p>
        </div>
      </section>

      <section id="returns" className="border-t border-line scroll-mt-20">
        <div className="max-w-content mx-auto px-5 md:px-8 py-16 grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16">
          <h2 className="text-xs tracking-widest uppercase text-mist">{t('footer.returns')}</h2>
          <p className="text-sm text-paper/70 max-w-xl leading-relaxed">{t('about.returnsBody')}</p>
        </div>
      </section>

      <section id="contact" className="border-t border-line scroll-mt-20">
        <div className="max-w-content mx-auto px-5 md:px-8 py-16 grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16">
          <h2 className="text-xs tracking-widest uppercase text-mist">{t('footer.contact')}</h2>
          <p className="text-sm text-paper/70 max-w-xl leading-relaxed">hello@wakeinthedream.com</p>
        </div>
      </section>
    </div>
  )
}
