import { LL } from './LL'
import { CommunityVisual } from './CommunityVisual'
import { useLocale } from '@/hooks/useLocale'

export function CommunitySection() {
  const { t } = useLocale()
  return (
    <section className="bg-[#0F0F0D] border-t border-line">
      <div className="max-w-content mx-auto px-5 md:px-8 py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="font-display text-3xl md:text-4xl text-paper">{t('community.joinTitle')}</h2>
          <p className="mt-4 text-sm text-paper/70 max-w-md leading-relaxed">{t('community.joinBody')}</p>
          <LL
            to="/community"
            className="inline-block mt-7 px-7 py-3.5 border border-paper/50 text-paper text-xs tracking-widest uppercase hover:border-paper transition-colors"
          >
            {t('community.enterCommunity')}
          </LL>
        </div>
        <div className="aspect-[4/3]">
          <CommunityVisual />
        </div>
      </div>
    </section>
  )
}
