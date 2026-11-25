import { useLocale } from '@/hooks/useLocale'

export function ManifestoSection() {
  const { t } = useLocale()
  const lines = [t('manifesto.line1'), t('manifesto.line2'), t('manifesto.line3')]
  return (
    <section className="bg-black border-t border-line">
      <div className="max-w-content mx-auto px-5 md:px-8 py-28 md:py-36">
        <div className="space-y-4 md:space-y-6">
          {lines.map((line) => (
            <p key={line} className="font-display text-2xl md:text-4xl lg:text-5xl text-paper/90 max-w-4xl">
              {line}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
