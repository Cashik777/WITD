import { Link } from 'react-router-dom'
import { WitdSymbol } from './WitdSymbol'

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/wakeinthedream/' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@wake.in.the.dream' },
  { label: 'X', href: 'https://x.com/WakeInTheDream' },
  { label: 'YouTube', href: 'https://www.youtube.com/channel/UCZBcpjr5Cs3xxTqEB1xvYtA' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61595157624382' },
  { label: 'Pinterest', href: 'https://ca.pinterest.com/WakeInTheDream/' },
]

const columns = [
  {
    heading: 'Shop',
    links: [
      { label: 'All Products', to: '/shop' },
      { label: 'New Drop', to: '/shop?collection=New%20Drop' },
      { label: 'Bestsellers', to: '/shop?collection=Bestsellers' },
    ],
  },
  {
    heading: 'WITD',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Community', to: '/community' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Shipping', to: '/about#shipping' },
      { label: 'Returns', to: '/about#returns' },
      { label: 'Contact', to: '/about#contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-black border-t border-line">
      <div className="max-w-content mx-auto px-5 md:px-8 py-16 grid grid-cols-2 md:grid-cols-6 gap-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <WitdSymbol className="w-7 h-7 text-paper" />
            <span className="font-display text-xl text-paper">WITD</span>
          </div>
          <p className="text-sm text-mist max-w-[26ch]">
            Wake in the dream. Clothing for those who choose to stay conscious inside it.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.heading}>
            <h3 className="text-xs tracking-widest uppercase text-paper mb-4">{col.heading}</h3>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="relative inline-block group text-sm text-mist hover:text-paper transition-colors duration-200">
                    {link.label}
                    <span className="absolute left-0 -bottom-0.5 h-px w-full bg-paper scale-x-0 origin-left transition-transform duration-300 ease-witd group-hover:scale-x-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-content mx-auto px-5 md:px-8 py-6 border-t border-line flex flex-col md:flex-row gap-3 items-center justify-between">
        <p className="text-xs text-mist">&copy; {new Date().getFullYear()} WITD. All rights reserved.</p>
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
