import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { store, shippingPolicy } from '@/lib/store'
import { formatPrice } from '@/lib/format'

const cadPolicy = shippingPolicy('CAD')
const usdPolicy = shippingPolicy('USD')

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
  return (
    <section className="max-w-content mx-auto px-5 md:px-8 pt-16 pb-10 md:pt-24 md:pb-14">
      <h1 className="font-display text-4xl md:text-6xl text-paper leading-[0.95]">{title}</h1>
      <p className="mt-4 text-xs tracking-widest uppercase text-mist">Last updated — October 2026</p>
    </section>
  )
}

export function Privacy() {
  return (
    <div>
      <Hero title="Privacy Policy" />

      <Row label="The Basics">
        <p>
          This describes what WITD collects when you use wakeinthedream.com, why, and who it&rsquo;s shared with.
          Using the site means you&rsquo;re okay with this policy.
        </p>
      </Row>

      <Row label="What We Collect">
        <p>
          <span className="text-paper/85">Order info</span> — email, shipping address, and the items you buy, so we
          can fulfill and ship your order.
        </p>
        <p>
          <span className="text-paper/85">Account info (optional)</span> — email and a hashed password if you
          create an account, plus first name, last name, and age if you choose to add them. None of this is
          required to check out; guest checkout is the default.
        </p>
        <p>
          <span className="text-paper/85">Payment info</span> — we never see or store your card details. Payment is
          handled by our payment processor; we only receive confirmation that a payment succeeded.
        </p>
        <p>
          <span className="text-paper/85">Discord (optional)</span> — if you connect Discord to verify community
          access, we receive your Discord user ID and confirmation that you hold the relevant role. We don&rsquo;t
          read your messages or server activity.
        </p>
        <p>
          <span className="text-paper/85">Site cookies</span> — a signed session cookie if you log into an account,
          and your cart contents, stored locally in your browser so it survives a page reload.
        </p>
      </Row>

      <Row label="Who It's Shared With">
        <p>Only the service providers that need it to do their job — nothing is sold to anyone.</p>
        <p>
          <span className="text-paper/85">A payment processor</span> handles your payment — we never see or store
          your card details. <span className="text-paper/85">Print and fulfillment partners</span> print and ship
          your order, so they receive your name, shipping address, and items ordered.{' '}
          <span className="text-paper/85">An email provider</span> sends account-related emails (verification
          codes, order confirmations). <span className="text-paper/85">An image hosting provider</span> hosts
          product photography and isn&rsquo;t involved in handling customer data.
        </p>
      </Row>

      <Row label="How Long We Keep It">
        <p>
          Order records are kept for accounting and warranty/return purposes. If you have an account, your profile
          stays until you ask us to delete it. Cart contents stored in your browser stay only on your device.
        </p>
      </Row>

      <Row label="Your Rights">
        <p>
          You can ask us what data we hold on you, correct it, or have it deleted — email{' '}
          <a href="mailto:hello@wakeinthedream.com" className="text-paper border-b border-paper/40 hover:border-paper transition-colors">
            hello@wakeinthedream.com
          </a>{' '}
          and we&rsquo;ll handle it. Deleting account data doesn&rsquo;t erase past order records we&rsquo;re
          required to keep for accounting.
        </p>
      </Row>

      <Row label="Children">
        <p>WITD isn&rsquo;t directed at children, and we don&rsquo;t knowingly collect data from anyone under 13.</p>
      </Row>

      <Row label="Changes">
        <p>
          If this policy changes in a way that matters, we&rsquo;ll update the date at the top. Continuing to use
          the site after a change means you accept the update.
        </p>
      </Row>

      <Row label="Contact">
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
  return (
    <div>
      <Hero title="Terms of Service" />

      <Row label="Agreement">
        <p>By placing an order or otherwise using wakeinthedream.com, you agree to the terms below.</p>
      </Row>

      <Row label="Orders & Payment">
        <p>
          Prices are shown in CAD or USD depending on your location and charged at checkout accordingly. We
          validate product, price, and stock server-side at the moment you check out — a price shown to you may
          change if a listing is updated before you complete payment. An order is confirmed once payment succeeds;
          you&rsquo;ll get an email confirmation.
        </p>
      </Row>

      <Row label="Shipping">
        <p>
          Orders ship within {store.fulfillmentDaysMin}–{store.fulfillmentDaysMax} business days. Shipping is a
          flat {formatPrice(cadPolicy.shippingFlatRate, 'CAD')}, free on orders over{' '}
          {formatPrice(cadPolicy.freeShippingThreshold, 'CAD')} ({formatPrice(usdPolicy.shippingFlatRate, 'USD')}{' '}
          flat / free over {formatPrice(usdPolicy.freeShippingThreshold, 'USD')} for USD orders). We ship to{' '}
          {store.shipsTo}.
        </p>
      </Row>

      <Row label="Returns">
        <p>
          Unworn items in their original condition can be returned within {store.returnWindowDays} days of delivery
          — see the{' '}
          <Link to="/about#returns" className="text-paper border-b border-paper/40 hover:border-paper transition-colors">
            Returns
          </Link>{' '}
          section for how to start one.
        </p>
      </Row>

      <Row label="Discount Codes">
        <p>
          Codes earned on the site are single-use, expire one hour after being earned, and only apply to a first
          order on an email address with no prior completed purchase. We can void a code or cancel an order if we
          reasonably believe it was obtained through abuse of the system rather than genuine use.
        </p>
      </Row>

      <Row label="Accounts">
        <p>
          Creating an account is optional. If you do, you&rsquo;re responsible for keeping your login credentials
          confidential and for what happens under your account. Give us accurate info — it&rsquo;s what we use to
          ship your order and reach you if something goes wrong with it.
        </p>
      </Row>

      <Row label="Intellectual Property">
        <p>
          The WITD name, symbol, designs, and site content belong to WITD. Buying a product doesn&rsquo;t give you
          rights to reproduce the designs or branding.
        </p>
      </Row>

      <Row label="Acceptable Use">
        <p>
          Don&rsquo;t use the site to do anything illegal, attempt to compromise it, or interfere with other
          customers&rsquo; use of it.
        </p>
      </Row>

      <Row label="Liability">
        <p>
          We aren&rsquo;t liable for indirect or consequential damages arising from your use of the site or
          products, beyond what&rsquo;s required by applicable law. Nothing here limits rights you have as a
          consumer that can&rsquo;t be waived under Canadian law.
        </p>
      </Row>

      <Row label="Governing Law">
        <p>These terms are governed by the laws of Ontario, Canada.</p>
      </Row>

      <Row label="Changes">
        <p>
          We may update these terms; the date at the top reflects the latest revision. Continuing to use the site
          after a change means you accept it.
        </p>
      </Row>

      <Row label="Contact">
        <p>
          <a href="mailto:hello@wakeinthedream.com" className="text-paper border-b border-paper/40 hover:border-paper transition-colors">
            hello@wakeinthedream.com
          </a>
        </p>
      </Row>
    </div>
  )
}
