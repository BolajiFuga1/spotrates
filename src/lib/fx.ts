export type FxProvider = 'admin.manual'

export type DeskPair = {
  buy: number
  sell: number
  mid: number
}

export type FxDesk = {
  USD: DeskPair
  GBP: DeskPair
  EUR: DeskPair
}

export type FxSnapshot = {
  base: 'USD'
  rates: Record<string, number>
  desk?: FxDesk
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

export function describeRateSource(snapshot: FxSnapshot): string {
  if (snapshot.provider !== 'admin.manual') {
    return 'Rates come from the e-lloydsFX admin dashboard.'
  }
  return 'Rates come from the e-lloydsFX admin dashboard.'
}

export type FeaturedRates = {
  usdToNgn: number
  usdToNgnBuy: number
  usdToNgnSell: number
  usdToGbp: number
  usdToEur: number
  gbpToNgn: number
  gbpToNgnBuy: number
  gbpToNgnSell: number
  eurToNgn: number
  eurToNgnBuy: number
  eurToNgnSell: number
}

function defaultSpread(mid: number) {
  return Math.max(3, Math.round(mid * 0.004))
}

function deriveDeskPair(mid: number): DeskPair {
  const spread = defaultSpread(mid)
  return { buy: mid - spread, sell: mid + spread, mid }
}

function resolveDeskFromSnapshot(snapshot: FxSnapshot): FxDesk {
  if (snapshot.desk) return snapshot.desk

  const usdToNgn = snapshot.rates.NGN
  const usdToGbp = snapshot.rates.GBP
  const usdToEur = snapshot.rates.EUR
  const gbpToNgn = usdToNgn / usdToGbp
  const eurToNgn = usdToNgn / usdToEur

  return {
    USD: deriveDeskPair(usdToNgn),
    GBP: deriveDeskPair(gbpToNgn),
    EUR: deriveDeskPair(eurToNgn),
  }
}

export function computeFeaturedRates(snapshot: FxSnapshot): FeaturedRates {
  const usdToGbp = snapshot.rates.GBP
  const usdToEur = snapshot.rates.EUR
  if (typeof usdToGbp !== 'number' || typeof usdToEur !== 'number') {
    throw new Error('Missing GBP or EUR rates in provider response')
  }

  const desk = resolveDeskFromSnapshot(snapshot)

  return {
    usdToNgn: desk.USD.mid,
    usdToNgnBuy: desk.USD.buy,
    usdToNgnSell: desk.USD.sell,
    usdToGbp,
    usdToEur,
    gbpToNgn: desk.GBP.mid,
    gbpToNgnBuy: desk.GBP.buy,
    gbpToNgnSell: desk.GBP.sell,
    eurToNgn: desk.EUR.mid,
    eurToNgnBuy: desk.EUR.buy,
    eurToNgnSell: desk.EUR.sell,
  }
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
