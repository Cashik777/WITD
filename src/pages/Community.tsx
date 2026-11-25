import { LL } from '@/components/LL'
import { useLocale } from '@/hooks/useLocale'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export default function Community() {
  const { t } = useLocale()
  useDocumentMeta(t('meta.communityTitle'), t('meta.communityDescription'))
  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-20 md:py-28">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl md:text-6xl text-paper leading-tight">{t('communityPage.title')}</h1>
        <p className="mt-6 text-base text-paper/75 leading-relaxed">{t('communityPage.body')}</p>
      </div>

      <div className="mt-16 border border-line p-10 md:p-16 flex flex-col items-start gap-6">
        <span className="text-xs tracking-widest uppercase text-mist">{t('communityPage.comingSoon')}</span>
        <h2 className="font-display text-2xl md:text-3xl text-paper max-w-lg">{t('communityPage.openingSoon')}</h2>
        <p className="text-sm text-paper/70 max-w-md">{t('communityPage.dedicatedSpace')}</p>
        <button
          disabled
          className="mt-2 px-7 py-3.5 border border-mist/40 text-mist text-xs tracking-widest uppercase cursor-not-allowed"
        >
          {t('community.enterCommunity')}
        </button>
      </div>

      <p className="mt-8 text-sm text-paper/60">
        {t('communityPage.alreadyOwn')}{' '}
        <LL to="/verify" className="text-paper underline underline-offset-4 hover:text-paper/70">
          {t('communityPage.verifyPurchase')}
        </LL>
        .
      </p>
    </div>
  )
}
