const LOCALE_BY_CURRENCY: Record<string, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  CAD: 'en-CA',
}

export const formatPrice = (amount: number, currency: string = 'CAD') =>
  new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency] ?? 'en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
