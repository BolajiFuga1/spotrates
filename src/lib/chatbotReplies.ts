import { formatNumber, type FeaturedRates } from './fx'

/** WhatsApp deep link: opens app on mobile, WhatsApp Web / desktop client where supported. */
export const WHATSAPP_SPECIALIST_HREF =
  'https://wa.me/2348094705599?text=' + encodeURIComponent('Hello e-lloydsFX, I have a question.')

export type BotReply = {
  text: string
  /** Show “Talk to a specialist” when the question is not covered by on-site content. */
  talkToSpecialist?: boolean
}

function r(text: string, talkToSpecialist?: boolean): BotReply {
  return talkToSpecialist ? { text, talkToSpecialist: true } : { text }
}

/** Lowercase, collapse spaces, strip most punctuation for matching. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** User seems to be asking about published FX on this site (vs random trivia). */
function wantsSiteRatesContext(n: string, raw: string): boolean {
  if (
    /(usd|dollar|dollars|\$|eur|euro|gbp|pound|£|naira|ngn|₦|rate|convert|conversion|fx|forex|currency|mid|pair|cross|snapshot)/.test(
      n,
    )
  ) {
    return true
  }
  if (/\d/.test(raw) && /(usd|eur|gbp|ngn|naira|dollars?|pound|euro)/i.test(raw)) return true
  return false
}

type FxCode = 'NGN' | 'USD' | 'GBP' | 'EUR'

function tokenToFx(tok: string): FxCode | null {
  const s = tok.toLowerCase().trim()
  if (/^(naira|ngn|₦)$/.test(s)) return 'NGN'
  if (/^(usd|dollar|dollars|\$)$/.test(s)) return 'USD'
  if (/^(gbp|pound|pounds|£)$/.test(s)) return 'GBP'
  if (/^(eur|euro|euros|€)$/.test(s)) return 'EUR'
  return null
}

/** Parse a quantity (million, thousand, k, or digits) from user text. */
function extractAmount(low: string): number | null {
  const ml = low.match(/(\d+(?:\.\d+)?)\s*million\b/)
  if (ml) return Number(ml[1]) * 1e6
  const bl = low.match(/(\d+(?:\.\d+)?)\s*billion\b/)
  if (bl) return Number(bl[1]) * 1e9
  if (/\bone million\b/.test(low)) return 1e6
  if (/\btwo million\b/.test(low)) return 2e6
  const k = low.match(/(\d+(?:\.\d+)?)\s*k\b(?![a-z])/)
  if (k) return Number(k[1]) * 1e3
  const th = low.match(/(\d+(?:\.\d+)?)\s*thousand\b/)
  if (th) return Number(th[1]) * 1e3
  const big = low.match(/\b(\d{1,3}(?:,\d{3})+|\d{4,})(?:\.\d+)?\b/)
  if (big) return Number(big[1].replace(/,/g, ''))
  const sm = low.match(/\b(\d+(?:\.\d+)?)\b/)
  if (sm) {
    const v = Number(sm[1])
    if (v > 0 && Number.isFinite(v)) return v
  }
  return null
}

function firstIndex(low: string, re: RegExp): number {
  const m = low.match(re)
  return m?.index ?? 999999
}

/** Infer source/target when exactly two FX codes appear (by first occurrence). */
function inferConversionPair(low: string): { from: FxCode; to: FxCode } | null {
  const explicit = low.match(
    /\bfrom\s+(\S+)\s+to\s+(\S+)/i,
  )
  if (explicit) {
    const a = tokenToFx(explicit[1])
    const b = tokenToFx(explicit[2])
    if (a && b && a !== b) return { from: a, to: b }
  }

  const present: FxCode[] = []
  const flags: Record<FxCode, RegExp> = {
    NGN: /(naira|ngn|₦)/i,
    USD: /\b(usd|dollar|dollars|\$)\b/i,
    GBP: /\b(gbp|pound|pounds|£)\b/i,
    EUR: /\b(eur|euro|euros|€)\b/i,
  }
  ;(['NGN', 'USD', 'GBP', 'EUR'] as const).forEach((c) => {
    if (flags[c].test(low)) present.push(c)
  })
  const uniq = [...new Set(present)]
  if (uniq.length !== 2) return null

  const [c1, c2] = uniq
  const i1 = firstIndex(low, flags[c1])
  const i2 = firstIndex(low, flags[c2])
  return i1 <= i2 ? { from: c1, to: c2 } : { from: c2, to: c1 }
}

/** Convert using same USD-base mids as the public converter. */
function convertWithFeatured(amount: number, from: FxCode, to: FxCode, R: FeaturedRates): number | null {
  if (from === to) return amount
  let usd = amount
  switch (from) {
    case 'USD':
      break
    case 'NGN':
      usd = amount / R.usdToNgn
      break
    case 'GBP':
      usd = amount / R.usdToGbp
      break
    case 'EUR':
      usd = amount / R.usdToEur
      break
    default:
      return null
  }
  switch (to) {
    case 'USD':
      return usd
    case 'NGN':
      return usd * R.usdToNgn
    case 'GBP':
      return usd * R.usdToGbp
    case 'EUR':
      return usd * R.usdToEur
    default:
      return null
  }
}

function labelFx(c: FxCode): string {
  switch (c) {
    case 'NGN':
      return 'NGN'
    case 'USD':
      return 'USD'
    case 'GBP':
      return 'GBP'
    case 'EUR':
      return 'EUR'
  }
}

/** Reply with computed conversion from published mids, or null to fall through. */
function tryConversionAnswer(low: string, rates: FeaturedRates): BotReply | null {
  const conversionIntent =
    /convert|exchange|worth|what\s*(?:is|'s)|how much|how many|equals?|into\b|\bin\b(?!\s+total)|calculate/.test(low)
  const pair = inferConversionPair(low)
  if (!pair) return null

  const amount = extractAmount(low)
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return null

  const looksLikeQuote =
    conversionIntent ||
    /million|billion|thousand|\b\d{4,}\b|,\d{3}/.test(low) ||
    (amount >= 1000 && /(naira|ngn|₦|usd|dollar|dollars|gbp|pound|eur|euro)/i.test(low))

  if (!looksLikeQuote) return null

  const out = convertWithFeatured(amount, pair.from, pair.to, rates)
  if (out == null || !Number.isFinite(out)) return null

  const digitsOut = pair.to === 'NGN' ? 2 : pair.to === 'USD' ? 2 : 4
  const digitsIn = pair.from === 'NGN' ? 0 : pair.from === 'USD' ? 2 : 4

  return r(
    `Using the published mids on this site (same as the converter): ${formatNumber(amount, digitsIn)} ${labelFx(pair.from)} → about ${formatNumber(out, digitsOut)} ${labelFx(pair.to)}. Mid only: 1 USD = ${formatNumber(rates.usdToNgn, 4)} NGN.`,
  )
}

export function makeBotReply(
  inputRaw: string,
  rates: FeaturedRates | null,
  ratesSourceLine: string | null | undefined,
): BotReply {
  const raw = inputRaw.trim()
  if (!raw) return r("Ask something and I'll look it up on this site.")

  const input = raw.toLowerCase()
  const n = norm(raw)
  const hasRates = !!rates

  if (/(^|\b)(hi|hello|hey)\b/.test(input) || /good\s*(morning|afternoon|evening)/.test(input)) {
    return r(
      'Hello! I stick to what is published here: the FX mids (USD, GBP, EUR, NGN) and the wording on Services (PTA, BTA, international payments, delivery, and the rest). Say help if you want examples, or ask something like USD to naira.',
    )
  }

  if (/\b(thanks|thank you|ty|cheers)\b/.test(input)) {
    return r('You are welcome. Say help anytime if you want more examples.')
  }

  if (/\b(bye|goodbye)\b/.test(input)) {
    return r('Take care. Published rates refresh about every minute, or tap Refresh in the header.')
  }

  if (/\b(help|what can you|commands)\b/.test(input)) {
    return r(
      'I pull answers from this website only. You can ask about:\n' +
        'Rates: “USD to NGN”, “what is 1 million naira in dollars”, “pound to naira”, “euro rate”.\n' +
        'This site: “refresh”, “where do rates come from”.\n' +
        'Services: PTA, BTA, payments, delivery, cashless.\n' +
        'For the full service text, open Services in the menu.',
    )
  }

  if (/(service|e-lloyds|elloyds|bdc|what do you offer|what services)/.test(input)) {
    return r(
      'On the Services page we list cash forex buy and sell, PTA and BTA (CBN rules apply), cross-border payments, deliveries, bank deposits, accounts at major banks, and cashless payments. Open Services in the menu for the exact wording.',
    )
  }

  if (/\bpta\b|personal travel allowance/.test(input)) {
    return r(
      'From Services: PTA is CBN authorized, up to $4,000 per quarter (or GBP or EUR equivalent). You cannot use PTA and BTA on the same trip. PTA is for your immediate family only (spouse plus up to two children over 12). Some destinations are excluded. See Services for the full list.',
    )
  }

  if (/\bbta\b|business travel allowance/.test(input)) {
    return r(
      'From Services: BTA is CBN authorized, up to $5,000 per quarter (or GBP or EUR equivalent). You cannot use BTA and PTA on the same trip. See Services for details.',
    )
  }

  if (/remitt|wire|transfer|school fee|medical fee|mortgage|utility|subscription|insurance premium/.test(input)) {
    return r(
      'Services lists the kinds of international payment services we help with (travel allowances, mortgages, school fees, card bills, utilities, and more). Open that page for the full bullet list.',
    )
  }

  if (/delivery|deliveries|traffic/.test(input)) {
    return r(
      'Services says we can deliver larger currency purchases. Smaller amounts may have a small delivery fee. Many clients use delivery to skip sitting in traffic.',
    )
  }

  if (/bank deposit|deposit.*forex|forex.*account/.test(input)) {
    return r(
      'Services explains that we help deposit purchased forex at your bank, often into your FX account when you are paying for foreign goods or services.',
    )
  }

  if (/multiple bank|which bank|account/.test(input)) {
    return r(
      'Services notes that we keep accounts at major Nigerian banks so you can deal through whichever bank suits you.',
    )
  }

  if (/cashless|pay cash|wire funds|deposit/.test(input)) {
    return r(
      'Services says buying forex with us is cashless: you can wire or deposit to our accounts instead of bringing cash.',
    )
  }

  if (/(update|refresh|how\s*often|every\s*how)/.test(input)) {
    return r('Published rates on this site refetch about every 60 seconds. You can also tap Refresh in the header.')
  }

  if (/(source|where.*rate|who set|api|how.*rate)/.test(input)) {
    return r(
      ratesSourceLine?.trim() ||
        'Rates here are entered in the e-lloydsFX admin dashboard. We do not scrape live market feeds.',
    )
  }

  const mentionsUsd = /\b(usd|dollar|dollars|\$)\b/.test(n)
  const mentionsGbp = /\b(gbp|pound|sterling|£)\b/.test(n)
  const mentionsEur = /\b(eur|euro|€)\b/.test(n)
  const mentionsNgn = /\b(ngn|naira|₦)\b/.test(n)

  if (hasRates && rates) {
    const converted = tryConversionAnswer(input, rates)
    if (converted) return converted
  }

  if ((mentionsUsd && mentionsNgn) || /\b(usd|dollar|dollars).{0,24}(ngn|naira)\b/.test(input)) {
    return hasRates
      ? r(`Right now about 1 USD is ${formatNumber(rates!.usdToNgn, 6)} NGN, same mid as the converter and home page.`)
      : r(
          'USD/NGN is not published on the site yet. Someone on the team can help on WhatsApp.',
          true,
        )
  }

  if ((mentionsGbp && mentionsNgn) || /\b(gbp|pound).{0,24}(ngn|naira)\b/.test(input)) {
    return hasRates
      ? r(`Right now about 1 GBP is ${formatNumber(rates!.gbpToNgn, 6)} NGN, same mid as on this site.`)
      : r('GBP/NGN is not loaded yet. Someone on the team can help on WhatsApp.', true)
  }

  if ((mentionsEur && mentionsNgn) || /\b(eur|euro).{0,24}(ngn|naira)\b/.test(input)) {
    return hasRates
      ? r(`Right now about 1 EUR is ${formatNumber(rates!.eurToNgn, 6)} NGN, same mid as on this site.`)
      : r('EUR/NGN is not loaded yet. Someone on the team can help on WhatsApp.', true)
  }

  if ((mentionsUsd && mentionsGbp) || /\b(usd|dollar).{0,24}(gbp|pound)\b/.test(input)) {
    return hasRates
      ? r(`Right now about 1 USD is ${formatNumber(rates!.usdToGbp, 6)} GBP on the published mid.`)
      : r('Cross rates are not loaded yet. Someone on the team can help on WhatsApp.', true)
  }

  if ((mentionsUsd && mentionsEur) || /\b(usd|dollar).{0,24}(eur|euro)\b/.test(input)) {
    return hasRates
      ? r(`Right now about 1 USD is ${formatNumber(rates!.usdToEur, 6)} EUR on the published mid.`)
      : r('Cross rates are not loaded yet. Someone on the team can help on WhatsApp.', true)
  }

  if (hasRates && (/\brate\b|\bprice\b|\bhow much\b/.test(n) || n === 'usd' || n === 'dollar')) {
    if (mentionsNgn || /\bnaira\b/.test(input)) {
      return r(
        `USD/NGN is about ${formatNumber(rates!.usdToNgn, 6)} on this site. You can also ask pound to naira for GBP/NGN.`,
      )
    }
    return r(`1 USD is about ${formatNumber(rates!.usdToNgn, 6)} NGN on the current published snapshot.`)
  }

  if (hasRates && (/\bpound\b|\bgbp\b/.test(input) || n === 'gbp')) {
    return r(`1 GBP is about ${formatNumber(rates!.gbpToNgn, 6)} NGN on the current published snapshot.`)
  }

  if (hasRates && (/\beuro\b|\beur\b/.test(input) || n === 'eur')) {
    return r(`1 EUR is about ${formatNumber(rates!.eurToNgn, 6)} NGN on the current published snapshot.`)
  }

  if (hasRates && /\bnaira\b|\bngn\b/.test(input) && !mentionsUsd && !mentionsGbp && !mentionsEur) {
    return r(
      `Published right now on this site: USD/NGN ${formatNumber(rates!.usdToNgn, 4)}, GBP/NGN ${formatNumber(rates!.gbpToNgn, 4)}, EUR/NGN ${formatNumber(rates!.eurToNgn, 4)}. Ask for a pair if you need more detail.`,
    )
  }

  if (hasRates && wantsSiteRatesContext(n, raw)) {
    return r(
      'I could not match that to a specific line on the site. Here are the published mids:\n' +
        `USD/NGN ${formatNumber(rates!.usdToNgn, 4)}\n` +
        `GBP/NGN ${formatNumber(rates!.gbpToNgn, 4)}\n` +
        `EUR/NGN ${formatNumber(rates!.eurToNgn, 4)}\n` +
        'Try help, PTA, or something like dollar to naira.',
    )
  }

  if (hasRates) {
    return r(
      'That is outside what we publish on this website. Tap below to message a specialist on WhatsApp.',
      true,
    )
  }

  return r(
    'Rates are not on the site yet so I cannot quote numbers. Say help for service topics, or use WhatsApp below to reach the team.',
    true,
  )
}
