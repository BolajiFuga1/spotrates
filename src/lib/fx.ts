export type FxProvider = 'admin.manual'

export type FxSnapshot = {
  base: 'USD'
  rates: Record<string, number>
  fetchedAtMs: number
  provider: FxProvider
}

/** Currencies supported in the converter UI (USD-base snapshot). */
export type SupportedFxCode = 'USD' | 'GBP' | 'NGN' | 'EUR'

/**
 * Loads rates published from the admin dashboard only (GET /api/public/rates).
 * No external FX APIs are used.
 */
export async function fetchManualRatesSnapshot(signal?: AbortSignal): Promise<FxSnapshot> {
  const { fetchManualPublicSnapshot } = await import('./manualRatesApi')
  const snap = await fetchManualPublicSnapshot(signal)
  if (snap) return snap
  throw new Error(
    'No published rates yet. Open admin.html, enter naira rates for dollar, pound, and euro, then Save & publish. ' +
      'For static hosting, build with VITE_RATES_API_URL pointing at your API (same origin or CORS-enabled).',
  )
}

export function describeRateSource(_snapshot: FxSnapshot): string {
  return 'Rates are set only from the SpotRates admin dashboard (not from external market APIs).'
}

export type FeaturedRates = {
  usdToNgn: number
  usdToGbp: number
  usdToEur: number
  gbpToNgn: number
  eurToNgn: number
}

export function computeFeaturedRates(snapshot: FxSnapshot): FeaturedRates {
  const usdToNgn = snapshot.rates.NGN
  const usdToGbp = snapshot.rates.GBP
  const usdToEur = snapshot.rates.EUR
  if (
    typeof usdToNgn !== 'number' ||
    typeof usdToGbp !== 'number' ||
    typeof usdToEur !== 'number'
  ) {
    throw new Error('Missing NGN, GBP, or EUR rates in provider response')
  }

  const gbpToNgn = usdToNgn / usdToGbp
  const eurToNgn = usdToNgn / usdToEur

  return { usdToNgn, usdToGbp, usdToEur, gbpToNgn, eurToNgn }
}

/** Convert `amount` of `from` into `to` using USD-base rates (same convention as the snapshot). */
export function convertThroughUsd(
  amount: number,
  from: SupportedFxCode,
  to: SupportedFxCode,
  rates: Record<string, number>,
): number | null {
  const gbp = rates.GBP
  const ngn = rates.NGN
  const eur = rates.EUR
  if (typeof gbp !== 'number' || typeof ngn !== 'number' || typeof eur !== 'number') {
    return null
  }

  let usd = amount
  switch (from) {
    case 'GBP':
      usd = amount / gbp
      break
    case 'NGN':
      usd = amount / ngn
      break
    case 'EUR':
      usd = amount / eur
      break
    case 'USD':
      break
  }

  switch (to) {
    case 'USD':
      return usd
    case 'GBP':
      return usd * gbp
    case 'NGN':
      return usd * ngn
    case 'EUR':
      return usd * eur
  }
}

export function formatNumber(n: number, digits = 4) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(n)
}
