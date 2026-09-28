const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'WITD <onboarding@resend.dev>'

export const isEmailConfigured = Boolean(RESEND_API_KEY)

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
