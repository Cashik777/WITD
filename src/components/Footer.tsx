import { LL } from './LL'
import { WitdSymbol } from './WitdSymbol'
import { useLocale } from '@/hooks/useLocale'

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/wakeinthedream/' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@wake.in.the.dream' },
  { label: 'X', href: 'https://x.com/WakeInTheDream' },
  { label: 'YouTube', href: 'https://www.youtube.com/channel/UCZBcpjr5Cs3xxTqEB1xvYtA' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61595157624382' },
  { label: 'Pinterest', href: 'https://ca.pinterest.com/WakeInTheDream/' },
]

function useColumns() {
  const { t } = useLocale()
  return [
    {
      heading: t('footer.shop'),
      links: [
        { label: t('footer.allProducts'), to: '/shop' },
        { label: t('footer.newDrop'), to: '/shop?collection=New%20Drop' },
        { label: t('footer.bestsellers'), to: '/shop?collection=Bestsellers' },
      ],
    },
    {
      heading: t('footer.witd'),
      links: [
        { label: t('footer.about'), to: '/about' },
        { label: t('footer.community'), to: '/community' },
      ],
    },
    {
      heading: t('footer.support'),
      links: [
        { label: t('footer.shipping'), to: '/about#shipping' },
        { label: t('footer.returns'), to: '/about#returns' },
        { label: t('footer.contact'), to: '/about#contact' },
      ],
    },
    {
      heading: t('footer.legal'),
      links: [
        { label: t('footer.privacy'), to: '/privacy' },
        { label: t('footer.terms'), to: '/terms' },
      ],
    },
  ]
}

export function Footer() {
  const { t } = useLocale()
  const columns = useColumns()
  return (
    <footer className="bg-black border-t border-line">
      <div className="max-w-content mx-auto px-5 md:px-8 py-16 grid grid-cols-2 md:grid-cols-6 gap-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <WitdSymbol className="w-7 h-7 text-paper" />
            <span className="font-display text-xl text-paper">WITD</span>
          </div>
          <p className="text-sm text-mist max-w-[26ch]">{t('footer.tagline')}</p>
        </div>

        {columns.map((col) => (
          <div key={col.heading}>
            <h3 className="text-xs tracking-widest uppercase text-paper mb-4">{col.heading}</h3>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <LL to={link.to} className="relative inline-block group text-sm text-mist hover:text-paper transition-colors duration-200">
                    {link.label}
                    <span className="absolute left-0 -bottom-0.5 h-px w-full bg-paper scale-x-0 origin-left transition-transform duration-300 ease-witd group-hover:scale-x-100" />
                  </LL>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-content mx-auto px-5 md:px-8 py-6 border-t border-line flex flex-col md:flex-row gap-3 items-center justify-between">
        <p className="text-xs text-mist">
          &copy; {new Date().getFullYear()} WITD. {t('footer.rights')}
        </p>
        <div className="flex flex-wrap gap-5">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-block group text-xs text-mist hover:text-paper transition-colors duration-200"
            >
              {social.label}
              <span className="absolute left-0 -bottom-0.5 h-px w-full bg-paper scale-x-0 origin-left transition-transform duration-300 ease-witd group-hover:scale-x-100" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
