import type { Order } from '../models/Order.js'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'WITD <noreply@wakeinthedream.com>'
const NEWSLETTER_AUDIENCE_ID = process.env.RESEND_NEWSLETTER_AUDIENCE_ID

export const isEmailConfigured = Boolean(RESEND_API_KEY)
export const isNewsletterConfigured = Boolean(RESEND_API_KEY && NEWSLETTER_AUDIENCE_ID)

// Without a RESEND_API_KEY (not yet provided — see CLAUDE.md), verification
// still works end-to-end in dev: the code just lands in the server log
// instead of an inbox, mirroring how MockProvider stands in for
// Printful/Printify until real fulfillment keys are set.
export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  if (!isEmailConfigured) {
    console.warn(`[email] RESEND_API_KEY not set — verification code for ${to}: ${code}`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject: 'Your WITD verification code',
      html: `
        <div style="font-family: sans-serif; max-width: 480px;">
          <p>Your Wake In The Dream verification code is:</p>
          <p style="font-size: 32px; letter-spacing: 6px; font-weight: bold;">${code}</p>
          <p style="color: #666; font-size: 13px;">This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to send verification email (${res.status}): ${text}`)
  }
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

  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #26251F; color: #F4F2EC; font-size: 14px;">
            ${item.name}<br />
            <span style="color: #8F8B82; font-size: 12px;">${item.color} / ${item.size} &middot; Qty ${item.quantity}</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #26251F; color: #F4F2EC; font-size: 14px; text-align: right; white-space: nowrap;">
            ${formatMoney(item.unitPrice * item.quantity, order.currency)}
          </td>
        </tr>`
    )
    .join('')

  const summaryRow = (label: string, value: string) => `
    <tr>
      <td style="padding: 4px 0; color: #8F8B82; font-size: 13px;">${label}</td>
      <td style="padding: 4px 0; color: #8F8B82; font-size: 13px; text-align: right;">${value}</td>
    </tr>`

  const addr = order.shippingAddress
  const addressBlock = addr
    ? `
      <p style="margin: 0 0 4px; color: #F4F2EC; font-size: 13px;">${addr.name ?? ''}</p>
      <p style="margin: 0; color: #8F8B82; font-size: 13px; line-height: 1.6;">
        ${addr.line1 ?? ''}${addr.line2 ? `, ${addr.line2}` : ''}<br />
        ${[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}<br />
        ${addr.country ?? ''}
      </p>`
    : ''

  const html = `
    <div style="background: #0B0B0A; padding: 40px 20px; font-family: 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 480px; margin: 0 auto;">
        <p style="color: #8F8B82; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 24px;">WITD</p>
        <h1 style="color: #F4F2EC; font-size: 28px; font-weight: 400; margin: 0 0 8px;">Order Confirmed.</h1>
        <p style="color: #8F8B82; font-size: 14px; margin: 0 0 32px;">You&rsquo;re officially awake.</p>

        <p style="color: #8F8B82; font-size: 13px; margin: 0 0 24px;">
          Order <span style="color: #F4F2EC;">${order.orderNumber}</span>
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          ${itemRows}
        </table>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
          ${summaryRow('Subtotal', formatMoney(order.subtotal, order.currency))}
          ${order.discount > 0 ? summaryRow('Discount', `&minus;${formatMoney(order.discount, order.currency)}`) : ''}
          ${summaryRow('Shipping', order.shipping === 0 ? 'Free' : formatMoney(order.shipping, order.currency))}
          ${order.tax > 0 ? summaryRow('Tax', formatMoney(order.tax, order.currency)) : ''}
          <tr>
            <td style="padding: 12px 0 0; color: #F4F2EC; font-size: 14px; border-top: 1px solid #26251F;">Total</td>
            <td style="padding: 12px 0 0; color: #F4F2EC; font-size: 14px; text-align: right; border-top: 1px solid #26251F;">
              ${formatMoney(order.total, order.currency)}
            </td>
          </tr>
        </table>

        ${
          addressBlock
            ? `<p style="color: #8F8B82; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin: 0 0 8px;">Shipping to</p>${addressBlock}<div style="margin-bottom: 32px;"></div>`
            : ''
        }

        <p style="color: #8F8B82; font-size: 12px; line-height: 1.6; margin: 0;">
          Ships in 3&ndash;5 business days. Save this order number with your email to verify your purchase for
          community access.
        </p>
      </div>
    </div>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject: `Order confirmed — ${order.orderNumber}`,
      html,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to send order confirmation email (${res.status}): ${text}`)
  }
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
