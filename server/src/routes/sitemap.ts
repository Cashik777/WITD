import { Router } from 'express'
import { productRepository } from '../data/productsDb.js'

export const sitemapRouter = Router()

const SITE = 'https://wakeinthedream.com'

const STATIC_PATHS = ['/', '/shop', '/about', '/community', '/search', '/privacy', '/terms']

function urlEntry(loc: string, changefreq: string, priority: string): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
}

// Generated on every request rather than written to a static file — the
// product catalog changes through the admin panel, and a stale sitemap
// (missing new products, still listing removed ones) is worse than no
// sitemap at all for how crawlers trust it going forward.
sitemapRouter.get('/sitemap.xml', async (_req, res) => {
  const products = await productRepository.findAll()
  const entries = [
    ...STATIC_PATHS.map((p) => urlEntry(`${SITE}${p}`, p === '/' ? 'daily' : 'weekly', p === '/' ? '1.0' : '0.6')),
    ...products.map((p) => urlEntry(`${SITE}/product/${p.slug}`, 'weekly', '0.8')),
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`
  res.set('Content-Type', 'application/xml').send(xml)
})
