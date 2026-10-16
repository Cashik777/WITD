const AFTERSHIP_API_KEY = process.env.AFTERSHIP_API_KEY
const API_BASE = 'https://api.aftership.com/tracking/2024-04'

export const isAfterShipConfigured = Boolean(AFTERSHIP_API_KEY)

// Printful only ever knows a package was handed to a carrier (package_shipped)
// — it has no idea whether it actually arrived. AfterShip polls the carrier
// directly and is the only source in this stack for a real "Delivered"
// signal, which is why sendDeliveredEmail (see lib/email.ts) otherwise has
// no automated trigger at all.
//
// Printful's shipment.carrier is a human-readable name ("USPS", "Canada
// Post"); AfterShip identifies couriers by lowercase-dash slug. Known ones
// are mapped below — anything unmapped is submitted without a slug, which
// AfterShip auto-detects from the tracking number format (slightly less
// reliable, but never a hard failure).
const CARRIER_SLUGS: Record<string, string> = {
  usps: 'usps',
  ups: 'ups',
  fedex: 'fedex',
  dhl: 'dhl',
  'dhl express': 'dhl',
  'canada post': 'canada-post',
  purolator: 'purolator',
  'royal mail': 'royal-mail',
}

export async function registerTracking(trackingNumber: string, carrierName?: string | null): Promise<void> {
  if (!isAfterShipConfigured) return

  const slug = carrierName ? CARRIER_SLUGS[carrierName.trim().toLowerCase()] : undefined

  const res = await fetch(`${API_BASE}/trackings`, {
    method: 'POST',
    headers: {
      'as-api-key': AFTERSHIP_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tracking: { tracking_number: trackingNumber, ...(slug ? { slug } : {}) } }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`AfterShip tracking registration failed (${res.status}): ${text}`)
  }
}
