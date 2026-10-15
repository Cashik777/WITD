import type { Order } from '../models/Order.js'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'WITD <noreply@wakeinthedream.com>'
const NEWSLETTER_AUDIENCE_ID = process.env.RESEND_NEWSLETTER_AUDIENCE_ID

export const isEmailConfigured = Boolean(RESEND_API_KEY)
export const isNewsletterConfigured = Boolean(RESEND_API_KEY && NEWSLETTER_AUDIENCE_ID)

// Shared visual language for every transactional email — one dark card on a
// starfield void, one serif/sans pairing, one wordmark. Email-safe font
// stacks: a serif display face for anything that wants the site's Fraunces
// feel, and system sans for everything else. No webfont is loaded — Outlook,
// most webmail, and many mobile mail apps strip <link>/@import in email, so
// designing around the fallback (not the enhancement) is what actually keeps
// this consistent everywhere.
const serif = `Georgia, 'Times New Roman', Times, serif`
const sans = `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
const ink = '#F4F2EC' // primary text
const mist = '#9A968D' // secondary text — one muted tone only, not three
const line = '#242019' // hairline dividers
const bg = '#0B0B0A'
const card = '#100F0C' // a hair lighter than bg, just enough to read as a card

// A quiet easter egg, not a feature: a faint scattered-dot "starfield" on
// the void around the card, never on the card itself (that stays clean and
// readable). Pure CSS radial-gradient, no image — clients that ignore
// background-image (Outlook chief among them) just fall back to the solid
// bg color already in use, no broken-image risk either way.
const starfield = `background-color: ${bg}; background-image: radial-gradient(circle, rgba(154,150,141,0.12) 1px, transparent 1.4px); background-size: 25px 25px; background-position: 6px 4px;`

const hairlineRule = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="height: 1px; line-height: 1px; font-size: 1px; background: ${line};">&nbsp;</td></tr>
  <tr><td style="height: 3px; line-height: 1px; font-size: 1px;">&nbsp;</td></tr>
  <tr><td style="height: 1px; line-height: 1px; font-size: 1px; background: ${line};">&nbsp;</td></tr>
</table>`

// Wraps a card's inner content (everything between the title/subtitle and
// the closing tagline) in the shared wordmark + card + footer shell used by
// every email this brand sends. `title`/`subtitle` render exactly like
// "Order Confirmed" / "You're officially awake." did originally.
function renderEmailShell(opts: { docTitle: string; title: string; subtitle: string; bodyHtml: string }): string {
  const { docTitle, title, subtitle, bodyHtml } = opts
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <title>${docTitle}</title>
  </head>
  <body style="margin: 0; padding: 0; ${starfield}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${starfield}">
      <tr>
        <td align="center" style="padding: 48px 16px; ${starfield}">

          <!-- Wordmark -->
          <table role="presentation" width="100%" style="max-width: 520px;" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding-bottom: 40px;">
                <span style="font-family: ${sans}; font-size: 12px; letter-spacing: 3px; color: ${mist};">&#9651;&nbsp;&nbsp;</span><span style="font-family: ${sans}; font-size: 13px; letter-spacing: 7px; color: ${ink};">WITD</span><span style="font-family: ${sans}; font-size: 12px; letter-spacing: 3px; color: ${mist};">&nbsp;&nbsp;&#9661;</span>
              </td>
            </tr>
          </table>

          <!-- Card -->
          <table role="presentation" width="100%" style="max-width: 520px; background: ${card}; border: 1px solid ${line};" cellpadding="0" cellspacing="0">

            <tr>
              <td align="center" style="padding: 52px 36px 8px;">
                <h1 style="margin: 0; font-family: ${serif}; font-weight: 400; font-size: 32px; line-height: 1.25; color: ${ink};">
                  ${title}
                </h1>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 0 36px 40px;">
                <p style="margin: 0; font-family: ${serif}; font-style: italic; font-size: 15px; color: ${mist};">
                  ${subtitle}
                </p>
              </td>
            </tr>

            ${bodyHtml}

            <tr>
              <td align="center" style="padding: 44px 36px 44px;">
                <p style="margin: 0 0 14px; font-family: ${sans}; font-size: 13px; color: #3A362D;">&#9671;</p>
                <p style="margin: 0; font-family: ${serif}; font-style: italic; font-size: 13px; color: ${mist};">
                  The dream does not end. You wake up inside it.
                </p>
              </td>
            </tr>

          </table>

          <table role="presentation" width="100%" style="max-width: 520px;" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding-top: 28px;">
                <p style="margin: 0; font-family: ${sans}; font-size: 11px; color: #4D4A42;">Wake In The Dream &middot; wakeinthedream.com</p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to send email (${res.status}): ${text}`)
  }
}

// Without a RESEND_API_KEY (not yet provided — see CLAUDE.md), verification
// still works end-to-end in dev: the code just lands in the server log
// instead of an inbox, mirroring how MockProvider stands in for
// Printful/Printify until real fulfillment keys are set.
export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  if (!isEmailConfigured) {
    console.warn(`[email] RESEND_API_KEY not set — verification code for ${to}: ${code}`)
    return
  }

  const bodyHtml = `
    <tr>
      <td style="padding: 0 36px;">
        ${hairlineRule}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 22px 0; font-family: ${sans}; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: ${mist};">
              Verification&nbsp;Code<br />
              <span style="font-size: 22px; letter-spacing: 6px; color: ${ink};">${code}</span>
            </td>
          </tr>
        </table>
        ${hairlineRule}
      </td>
    </tr>

    <tr>
      <td style="padding: 36px 36px 0;">
        <p style="margin: 0; font-family: ${sans}; font-size: 12px; line-height: 1.8; color: ${mist};">
          This code expires in 15 minutes. If you didn&rsquo;t request this, you can safely ignore this email.
        </p>
      </td>
    </tr>`

  const html = renderEmailShell({
    docTitle: 'Verification Code — WITD',
    title: 'Verification Code',
    subtitle: 'A small proof you&rsquo;re really here.',
    bodyHtml,
  })

  await sendEmail(to, 'Your WITD verification code', html)
}

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).format(amount)

// Fired from the Stripe webhook once an order is marked paid — the only
// customer-facing confirmation that an order went through, since the
// on-site /order-confirmation page is only reachable immediately after the
// Stripe redirect and can't be revisited later. Mirrors sendVerificationEmail's
// log-instead-of-send fallback when Resend isn't configured.
export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  const to = order.customer.email
  if (!to) {
    console.warn(`[email] Order ${order.orderNumber} has no customer email — skipping confirmation.`)
    return
  }
  if (!isEmailConfigured) {
    console.warn(`[email] RESEND_API_KEY not set — order confirmation for ${order.orderNumber} not sent.`)
    return
  }

  // Product photos are already padded to a fixed 4:5 ratio on a near-black
  // background (see cloudinary.ts), so a plain width/height resize to
  // another 4:5 box (56x70) never distorts or needs cropping — no
  // object-fit required, which email clients support inconsistently anyway.
  const itemRows = order.items
    .map(
      (item, i) => `
        <tr>
          <td style="padding: ${i === 0 ? '0' : '26px'} 0 26px; ${i === order.items.length - 1 ? '' : `border-bottom: 1px solid ${line};`} vertical-align: top;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                ${
                  item.image
                    ? `<td style="width: 56px; padding-right: 16px; vertical-align: top;">
                        <img src="${item.image}" width="56" height="70" alt="" style="display: block; border: 1px solid ${line};" />
                      </td>`
                    : ''
                }
                <td style="font-family: ${serif}; font-size: 16px; color: ${ink}; vertical-align: top;">
                  ${item.name}
                  <div style="font-family: ${sans}; font-size: 12px; color: ${mist}; margin-top: 5px; letter-spacing: 0.2px;">
                    ${item.color} &nbsp;&middot;&nbsp; ${item.size} &nbsp;&middot;&nbsp; Qty ${item.quantity}
                  </div>
                </td>
                <td style="font-family: ${sans}; font-size: 14px; color: ${ink}; text-align: right; white-space: nowrap; vertical-align: top; padding-left: 16px;">
                  ${formatMoney(item.unitPrice * item.quantity, order.currency)}
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    )
    .join('')

  const summaryRow = (label: string, value: string) => `
    <tr>
      <td style="padding: 5px 0; font-family: ${sans}; font-size: 13px; color: ${mist};">${label}</td>
      <td style="padding: 5px 0; font-family: ${sans}; font-size: 13px; color: ${mist}; text-align: right;">${value}</td>
    </tr>`

  const addr = order.shippingAddress
  const addressSection = addr
    ? `
      <tr>
        <td style="padding: 32px 36px 0;">
          <p style="margin: 0 0 12px; font-family: ${sans}; font-size: 10px; letter-spacing: 1.8px; text-transform: uppercase; color: ${mist};">Shipping To</p>
          <p style="margin: 0 0 3px; font-family: ${sans}; font-size: 14px; color: ${ink};">${addr.name ?? ''}</p>
          <p style="margin: 0; font-family: ${sans}; font-size: 13px; line-height: 1.7; color: ${mist};">
            ${addr.line1 ?? ''}${addr.line2 ? `, ${addr.line2}` : ''}<br />
            ${[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}<br />
            ${addr.country ?? ''}
          </p>
        </td>
      </tr>`
    : ''

  const bodyHtml = `
    <tr>
      <td style="padding: 0 36px;">
        ${hairlineRule}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 22px 0; font-family: ${sans}; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: ${mist};">
              Order&nbsp;No.<br />
              <span style="font-size: 15px; letter-spacing: 3px; color: ${ink};">${order.orderNumber}</span>
            </td>
          </tr>
        </table>
        ${hairlineRule}
      </td>
    </tr>

    <tr>
      <td style="padding: 36px 36px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${itemRows}
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 28px 36px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${summaryRow('Subtotal', formatMoney(order.subtotal, order.currency))}
          ${order.discount > 0 ? summaryRow('Discount', `&minus;${formatMoney(order.discount, order.currency)}`) : ''}
          ${summaryRow('Shipping', order.shipping === 0 ? 'Free' : formatMoney(order.shipping, order.currency))}
          ${order.tax > 0 ? summaryRow('Tax', formatMoney(order.tax, order.currency)) : ''}
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 16px 36px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid ${line};">
          <tr>
            <td style="padding-top: 16px; font-family: ${sans}; font-size: 15px; color: ${ink};">Total</td>
            <td style="padding-top: 16px; font-family: ${sans}; font-size: 15px; color: ${ink}; text-align: right;">${formatMoney(order.total, order.currency)}</td>
          </tr>
        </table>
      </td>
    </tr>

    ${addressSection}

    <tr>
      <td style="padding: 36px 36px 0;">
        <p style="margin: 0; font-family: ${sans}; font-size: 12px; line-height: 1.8; color: ${mist};">
          Ships in 3&ndash;5 business days. Keep this order number with your email on hand to verify the
          purchase for community access.
        </p>
      </td>
    </tr>`

  const html = renderEmailShell({
    docTitle: 'Order Confirmed — WITD',
    title: 'Order Confirmed',
    subtitle: 'You&rsquo;re officially awake.',
    bodyHtml,
  })

  await sendEmail(to, `Order confirmed — ${order.orderNumber}`, html)
}

// Adds an address to the Resend Audience backing the "Enter the dream"
// newsletter signup (see Newsletter.tsx). Resend's contacts endpoint upserts
// by email, so re-subscribing an existing address is a harmless no-op.
export async function subscribeToNewsletter(email: string): Promise<void> {
  if (!isNewsletterConfigured) {
    throw new Error('Newsletter signup is not configured (RESEND_NEWSLETTER_AUDIENCE_ID missing).')
  }

  const res = await fetch(`https://api.resend.com/audiences/${NEWSLETTER_AUDIENCE_ID}/contacts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to subscribe to newsletter (${res.status}): ${text}`)
  }
}
