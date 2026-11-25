import type { ReactNode } from 'react'
import { LL } from '@/components/LL'
import { store, shippingPolicy } from '@/lib/store'
import { formatPrice } from '@/lib/format'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useLocale } from '@/hooks/useLocale'

const cadPolicy = shippingPolicy('CAD')
const usdPolicy = shippingPolicy('USD')
const eurPolicy = shippingPolicy('EUR')

// Matches the label-left / copy-right row pattern already used for
// Shipping/Returns/Contact on the About page, rather than a generic
// bullet-point legal-page layout — so these read as part of the same site
// instead of a dropped-in template.
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-line">
      <div className="max-w-content mx-auto px-5 md:px-8 py-10 md:py-12 grid md:grid-cols-[1fr_2fr] gap-4 md:gap-16">
        <h2 className="text-xs tracking-widest uppercase text-mist">{label}</h2>
        <div className="text-sm text-paper/70 leading-relaxed max-w-xl space-y-3">{children}</div>
      </div>
    </div>
  )
}

function Hero({ title }: { title: string }) {
  const { t } = useLocale()
  return (
    <section className="max-w-content mx-auto px-5 md:px-8 pt-16 pb-10 md:pt-24 md:pb-14">
      <h1 className="font-display text-4xl md:text-6xl text-paper leading-[0.95]">{title}</h1>
      <p className="mt-4 text-xs tracking-widest uppercase text-mist">{t('legal.lastUpdated')}</p>
    </section>
  )
}

export function Privacy() {
  useDocumentMeta('Privacy Policy — WITD', 'What WITD collects when you use wakeinthedream.com, why, and who it is shared with.')
  const { t } = useLocale()
  return (
    <div>
      <Hero title={t('legal.privacy.title')} />

      <Row label={t('legal.privacy.basicsLabel')}>
        <p>{t('legal.privacy.basicsBody')}</p>
      </Row>

      <Row label={t('legal.privacy.collectLabel')}>
        <p>
          <span className="text-paper/85">{t('legal.privacy.orderInfoLabel')}</span> {t('legal.privacy.orderInfoBody')}
        </p>
        <p>
          <span className="text-paper/85">{t('legal.privacy.accountInfoLabel')}</span> {t('legal.privacy.accountInfoBody')}
        </p>
        <p>
          <span className="text-paper/85">{t('legal.privacy.paymentInfoLabel')}</span> {t('legal.privacy.paymentInfoBody')}
        </p>
        <p>
          <span className="text-paper/85">{t('legal.privacy.discordLabel')}</span> {t('legal.privacy.discordBody')}
        </p>
        <p>
          <span className="text-paper/85">{t('legal.privacy.cookiesLabel')}</span> {t('legal.privacy.cookiesBody')}
        </p>
      </Row>

      <Row label={t('legal.privacy.sharedLabel')}>
        <p>{t('legal.privacy.sharedIntro')}</p>
        <p>
          <span className="text-paper/85">{t('legal.privacy.paymentProcessorLabel')}</span> {t('legal.privacy.paymentProcessorBody')}{' '}
          <span className="text-paper/85">{t('legal.privacy.fulfillmentLabel')}</span> {t('legal.privacy.fulfillmentBody')}{' '}
          <span className="text-paper/85">{t('legal.privacy.emailProviderLabel')}</span> {t('legal.privacy.emailProviderBody')}{' '}
          <span className="text-paper/85">{t('legal.privacy.imageHostLabel')}</span> {t('legal.privacy.imageHostBody')}
        </p>
      </Row>

      <Row label={t('legal.privacy.retentionLabel')}>
        <p>{t('legal.privacy.retentionBody')}</p>
      </Row>

      <Row label={t('legal.privacy.rightsLabel')}>
        <p>
          {t('legal.privacy.rightsBodyBefore')}{' '}
          <a href="mailto:hello@wakeinthedream.com" className="text-paper border-b border-paper/40 hover:border-paper transition-colors">
            hello@wakeinthedream.com
          </a>{' '}
          {t('legal.privacy.rightsBodyAfter')}
        </p>
      </Row>

      <Row label={t('legal.privacy.childrenLabel')}>
        <p>{t('legal.privacy.childrenBody')}</p>
      </Row>

      <Row label={t('legal.changesLabel')}>
        <p>{t('legal.privacy.changesBody')}</p>
      </Row>

      <Row label={t('footer.contact')}>
        <p>
          <a href="mailto:hello@wakeinthedream.com" className="text-paper border-b border-paper/40 hover:border-paper transition-colors">
            hello@wakeinthedream.com
          </a>
        </p>
      </Row>
    </div>
  )
}

export function Terms() {
  useDocumentMeta('Terms of Service — WITD', 'The terms that apply when you place an order or use wakeinthedream.com.')
  const { t } = useLocale()
  return (
    <div>
      <Hero title={t('legal.terms.title')} />

      <Row label={t('legal.terms.agreementLabel')}>
        <p>{t('legal.terms.agreementBody')}</p>
      </Row>

      <Row label={t('legal.terms.ordersPaymentLabel')}>
        <p>{t('legal.terms.ordersPaymentBody')}</p>
      </Row>

      <Row label={t('footer.shipping')}>
        <p>
          {t('legal.terms.shippingBody', {
            min: store.fulfillmentDaysMin,
            max: store.fulfillmentDaysMax,
            cadFlat: formatPrice(cadPolicy.shippingFlatRate, 'CAD'),
            cadFree: formatPrice(cadPolicy.freeShippingThreshold, 'CAD'),
            usdFlat: formatPrice(usdPolicy.shippingFlatRate, 'USD'),
            usdFree: formatPrice(usdPolicy.freeShippingThreshold, 'USD'),
            eurFlat: formatPrice(eurPolicy.shippingFlatRate, 'EUR'),
            eurFree: formatPrice(eurPolicy.freeShippingThreshold, 'EUR'),
            shipsTo: store.shipsTo,
          })}
        </p>
      </Row>

      <Row label={t('footer.returns')}>
        <p>
          {t('legal.terms.returnsBodyBefore', { days: store.returnWindowDays })}{' '}
          <LL to="/about#returns" className="text-paper border-b border-paper/40 hover:border-paper transition-colors">
            {t('footer.returns')}
          </LL>{' '}
          {t('legal.terms.returnsBodyAfter')}
        </p>
      </Row>

      <Row label={t('legal.terms.discountCodesLabel')}>
        <p>{t('legal.terms.discountCodesBody')}</p>
      </Row>

      <Row label={t('legal.terms.accountsLabel')}>
        <p>{t('legal.terms.accountsBody')}</p>
      </Row>

      <Row label={t('legal.terms.ipLabel')}>
        <p>{t('legal.terms.ipBody')}</p>
      </Row>

      <Row label={t('legal.terms.acceptableUseLabel')}>
        <p>{t('legal.terms.acceptableUseBody')}</p>
      </Row>

      <Row label={t('legal.terms.liabilityLabel')}>
        <p>{t('legal.terms.liabilityBody')}</p>
      </Row>

      <Row label={t('legal.terms.governingLawLabel')}>
        <p>{t('legal.terms.governingLawBody')}</p>
      </Row>

      <Row label={t('legal.changesLabel')}>
        <p>{t('legal.terms.changesBody')}</p>
      </Row>

      <Row label={t('footer.contact')}>
        <p>
          <a href="mailto:hello@wakeinthedream.com" className="text-paper border-b border-paper/40 hover:border-paper transition-colors">
            hello@wakeinthedream.com
          </a>
        </p>
      </Row>
    </div>
  )
}
