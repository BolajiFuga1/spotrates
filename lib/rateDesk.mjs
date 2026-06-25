/**
 * @param {number} ngnPerUsd
 * @param {number} ngnPerGbp
 * @param {number} ngnPerEur
 */
export function toUsdBase(ngnPerUsd, ngnPerGbp, ngnPerEur) {
  return {
    NGN: ngnPerUsd,
    GBP: ngnPerUsd / ngnPerGbp,
    EUR: ngnPerUsd / ngnPerEur,
  }
}

/** @param {{ NGN: number; GBP: number; EUR: number }} r */
export function fromUsdBase(r) {
  return {
    ngnPerUsd: r.NGN,
    ngnPerGbp: r.NGN / r.GBP,
    ngnPerEur: r.NGN / r.EUR,
  }
}

/**
 * BDC desk rates: buy (BDC buys FX from customer) and sell (BDC sells FX to customer).
 * Sell is typically higher than buy.
 */

/** @param {number} mid */
export function defaultSpread(mid) {
  return Math.max(3, Math.round(mid * 0.004))
}

/**
 * @param {number} ngnPerUsd
 * @param {number} ngnPerGbp
 * @param {number} ngnPerEur
 */
export function deriveDeskFromMid(ngnPerUsd, ngnPerGbp, ngnPerEur) {
  const pair = (mid) => {
    const spread = defaultSpread(mid)
    return { buy: mid - spread, sell: mid + spread, mid }
  }
  return {
    USD: pair(ngnPerUsd),
    GBP: pair(ngnPerGbp),
    EUR: pair(ngnPerEur),
  }
}

/**
 * @param {{ USD?: { buy?: number; sell?: number; mid?: number }; GBP?: object; EUR?: object } | null | undefined} desk
 * @param {number} ngnPerUsd
 * @param {number} ngnPerGbp
 * @param {number} ngnPerEur
 */
export function resolveDesk(desk, ngnPerUsd, ngnPerGbp, ngnPerEur) {
  const fallback = deriveDeskFromMid(ngnPerUsd, ngnPerGbp, ngnPerEur)
  const merge = (code, mid, fb) => {
    const d = desk?.[code]
    if (
      d &&
      typeof d.buy === 'number' &&
      typeof d.sell === 'number' &&
      Number.isFinite(d.buy) &&
      Number.isFinite(d.sell) &&
      d.buy > 0 &&
      d.sell > 0
    ) {
      const m = typeof d.mid === 'number' && Number.isFinite(d.mid) ? d.mid : (d.buy + d.sell) / 2
      return { buy: d.buy, sell: d.sell, mid: m }
    }
    return fb
  }
  return {
    USD: merge('USD', ngnPerUsd, fallback.USD),
    GBP: merge('GBP', ngnPerGbp, fallback.GBP),
    EUR: merge('EUR', ngnPerEur, fallback.EUR),
  }
}

/**
 * @param {{ USD: { mid: number }; GBP: { mid: number }; EUR: { mid: number } }} desk
 */
export function deskToUsdBase(desk) {
  return {
    NGN: desk.USD.mid,
    GBP: desk.USD.mid / desk.GBP.mid,
    EUR: desk.USD.mid / desk.EUR.mid,
  }
}

/**
 * @param {{ buy: number; sell: number }} usd
 * @param {{ buy: number; sell: number }} gbp
 * @param {{ buy: number; sell: number }} eur
 */
export function buildDeskFromInputs(usd, gbp, eur) {
  const pair = (buy, sell) => ({ buy, sell, mid: (buy + sell) / 2 })
  return {
    USD: pair(usd.buy, usd.sell),
    GBP: pair(gbp.buy, gbp.sell),
    EUR: pair(eur.buy, eur.sell),
  }
}

/**
 * @param {{ active?: boolean, rates?: { NGN?: number; GBP?: number; EUR?: number } | null, desk?: object | null, updatedAtMs?: number | null }} store
 */
export function buildPublicRatesPayload(store) {
  if (!store.active || !store.rates?.NGN || !store.rates?.GBP || !store.rates?.EUR) {
    return { active: false }
  }
  const { ngnPerUsd, ngnPerGbp, ngnPerEur } = fromUsdBase(store.rates)
  const desk = resolveDesk(store.desk, ngnPerUsd, ngnPerGbp, ngnPerEur)
  return {
    active: true,
    base: 'USD',
    rates: store.rates,
    desk,
    updatedAtMs: store.updatedAtMs ?? Date.now(),
  }
}

/**
 * @param {{ active?: boolean, rates?: object | null, desk?: object | null, updatedAtMs?: number | null }} store
 */
export function buildAdminRatesResponse(store) {
  if (!store.rates?.NGN) {
    return {
      active: store.active,
      usdBuy: '',
      usdSell: '',
      gbpBuy: '',
      gbpSell: '',
      eurBuy: '',
      eurSell: '',
      updatedAtMs: store.updatedAtMs,
    }
  }
  const { ngnPerUsd, ngnPerGbp, ngnPerEur } = fromUsdBase(store.rates)
  const desk = resolveDesk(store.desk, ngnPerUsd, ngnPerGbp, ngnPerEur)
  return {
    active: store.active,
    usdBuy: desk.USD.buy,
    usdSell: desk.USD.sell,
    gbpBuy: desk.GBP.buy,
    gbpSell: desk.GBP.sell,
    eurBuy: desk.EUR.buy,
    eurSell: desk.EUR.sell,
    updatedAtMs: store.updatedAtMs,
  }
}

/**
 * Parse admin PUT body into buy/sell pairs (desk fields or legacy single mids).
 * @param {Record<string, unknown>} body
 */
export function parseAdminSaveBody(body) {
  const deskFields = [
    { buy: Number(body.usdBuy), sell: Number(body.usdSell) },
    { buy: Number(body.gbpBuy), sell: Number(body.gbpSell) },
    { buy: Number(body.eurBuy), sell: Number(body.eurSell) },
  ]
  const hasDeskInput = ['usdBuy', 'usdSell', 'gbpBuy', 'gbpSell', 'eurBuy', 'eurSell'].some(
    (k) => body[k] !== undefined && body[k] !== '',
  )

  let pairs = deskFields
  if (!hasDeskInput) {
    const u = Number(body.ngnPerUsd)
    const g = Number(body.ngnPerGbp)
    const e = Number(body.ngnPerEur)
    if ([u, g, e].every((n) => Number.isFinite(n) && n > 0)) {
      const desk = deriveDeskFromMid(u, g, e)
      pairs = [
        { buy: desk.USD.buy, sell: desk.USD.sell },
        { buy: desk.GBP.buy, sell: desk.GBP.sell },
        { buy: desk.EUR.buy, sell: desk.EUR.sell },
      ]
    }
  }

  if (!pairs.every((p) => Number.isFinite(p.buy) && Number.isFinite(p.sell) && p.buy > 0 && p.sell > 0)) {
    return {
      ok: false,
      error: 'Enter positive buy and sell rates for dollar, pound, and euro.',
    }
  }
  if (!pairs.every((p) => p.sell > p.buy)) {
    return {
      ok: false,
      error: 'Sell rate must be higher than buy rate for each currency.',
    }
  }

  const desk = buildDeskFromInputs(pairs[0], pairs[1], pairs[2])
  const rates = deskToUsdBase(desk)
  return { ok: true, desk, rates }
}
