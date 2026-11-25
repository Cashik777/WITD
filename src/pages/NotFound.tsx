import { LL } from '@/components/LL'
import { WitdSymbol } from '@/components/WitdSymbol'
import { useLocale } from '@/hooks/useLocale'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export default function NotFound() {
  const { t } = useLocale()
  useDocumentMeta(t('meta.notFoundTitle'))
  return (
    <div className="max-w-content mx-auto px-5 md:px-8 py-32 flex flex-col items-center text-center">
      <WitdSymbol className="w-12 h-12 text-paper/60 mb-8" />
      <h1 className="font-display text-3xl md:text-4xl text-paper">{t('notFound.title')}</h1>
      <p className="mt-4 text-sm text-mist">{t('notFound.subtitle')}</p>
      <LL
        to="/"
        className="inline-block mt-10 px-8 py-3.5 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors"
      >
        {t('notFound.backHome')}
      </LL>
    </div>
  )
}
