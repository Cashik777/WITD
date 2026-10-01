import { Router } from 'express'

export const geoRouter = Router()

// Render's domain is fronted by Cloudflare (confirmed via response headers on
// wakeinthedream.com), which sets cf-ipcountry on every request for free —
// no external API call needed in the common case. Falls back to a free
// IP-geolocation lookup (no API key) using the client's IP if that header
// is ever missing, e.g. in local dev.
async function detectCountry(req: import('express').Request): Promise<string | null> {
  const cfCountry = req.headers['cf-ipcountry']
  if (typeof cfCountry === 'string' && cfCountry.length === 2 && cfCountry !== 'XX') {
    return cfCountry.toUpperCase()
  }

  const forwardedFor = req.headers['x-forwarded-for']
  const ip = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : req.ip
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('::ffff:127.')) return null

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(2000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { countryCode?: string }
    return data.countryCode ? data.countryCode.toUpperCase() : null
  } catch {
    return null
  }
}

geoRouter.get('/geo', async (req, res) => {
  const country = await detectCountry(req)
  const currency = country === 'CA' ? 'CAD' : 'USD'
  res.json({ country, currency })
})
