/** @typedef {'Forex' | 'CBN' | 'Exchange Rate' | 'BDC' | 'Monetary Policy' | 'Remittance' | 'FX Market'} NewsCategory */

const FX_KEYWORDS = [
  'forex',
  'foreign exchange',
  ' fx ',
  'fx market',
  'currency market',
  'currency trading',
  'interbank',
  'parallel market',
  'black market',
  'official rate',
  'exchange rate',
  'naira',
  'ngn',
  'dollar rate',
  'pound rate',
  'euro rate',
  'usd/ngn',
  'gbp/ngn',
  'eur/ngn',
  'devaluation',
  'depreciation',
  'appreciation',
  'currency swap',
  'fx liquidity',
  'fx policy',
  'fx regulation',
  'autonomous fx',
  'investors and exporters',
  'i&e window',
  'naipex',
  'domiciliary',
  'swift transfer',
]

const CBN_KEYWORDS = ['cbn', 'central bank of nigeria', 'central bank', 'godwin emefiele', 'yemi cardoso']

const BDC_KEYWORDS = ['bureau de change', 'bdc', 'bureaux de change', 'money changer', 'money changing']

const MONETARY_KEYWORDS = [
  'monetary policy',
  'policy rate',
  'mpr',
  'interest rate',
  'cash reserve',
  'liquidity ratio',
  'open market operation',
  'treasury bill',
  'inflation target',
]

const REMITTANCE_KEYWORDS = ['remittance', 'diaspora', 'inbound transfer', 'outbound transfer', 'western union', 'moneygram']

const EXCLUDE_KEYWORDS = [
  'football',
  'premier league',
  'afcon',
  'nollywood',
  'bbnaija',
  'wedding',
  'funeral',
  'gospel',
  'entertainment',
  'celebrity',
  'movie',
  'music video',
  'big brother',
  'reality show',
  'fashion week',
  'beauty pageant',
]

/** @param {string} text */
function normalize(text) {
  return ` ${text.toLowerCase().replace(/[^a-z0-9$/.]+/g, ' ')} `
}

/** @param {string} haystack @param {string[]} needles */
function containsAny(haystack, needles) {
  const n = normalize(haystack)
  return needles.some((kw) => n.includes(normalize(kw)))
}

/** @param {{ title: string; description?: string }} item @param {boolean} [strict] */
export function isRelevantFxNews(item, strict = false) {
  const blob = `${item.title} ${item.description ?? ''}`

  if (containsAny(blob, EXCLUDE_KEYWORDS)) return false

  const hasFx = containsAny(blob, FX_KEYWORDS)
  const hasCbn = containsAny(blob, CBN_KEYWORDS)
  const hasBdc = containsAny(blob, BDC_KEYWORDS)
  const hasMonetary = containsAny(blob, MONETARY_KEYWORDS)
  const hasRemittance = containsAny(blob, REMITTANCE_KEYWORDS)

  const n = normalize(blob)
  const nigeriaContext =
    n.includes(' nigeria ') ||
    n.includes(' nigerian ') ||
    n.includes(' naira ') ||
    n.includes(' cbn ') ||
    n.includes(' lagos ') ||
    n.includes(' abuja ')

  const relevant = hasFx || hasCbn || hasBdc || hasMonetary || hasRemittance
  if (!relevant) return false
  if (strict && !nigeriaContext && !hasCbn && !hasBdc) return false

  return true
}

/** @param {{ title: string; description?: string; sourceName?: string | null }} item @returns {NewsCategory} */
export function categorizeNewsItem(item) {
  const blob = `${item.title} ${item.description ?? ''} ${item.sourceName ?? ''}`

  if (containsAny(blob, CBN_KEYWORDS)) return 'CBN'
  if (containsAny(blob, BDC_KEYWORDS)) return 'BDC'
  if (containsAny(blob, REMITTANCE_KEYWORDS)) return 'Remittance'
  if (containsAny(blob, MONETARY_KEYWORDS)) return 'Monetary Policy'
  if (containsAny(blob, ['exchange rate', 'naira', 'usd/ngn', 'dollar rate', 'parallel market', 'official rate'])) {
    return 'Exchange Rate'
  }
  if (containsAny(blob, ['forex', 'foreign exchange', ' fx ', 'fx market', 'currency market'])) return 'Forex'
  return 'FX Market'
}

/** @param {string} title */
export function normalizeTitleKey(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .slice(0, 120)
}

/** Only show articles from May 2026 onward. */
export const RECENCY_MIN_MS = Date.parse('2026-05-01T00:00:00.000Z')

/** Drop articles older than this many days (rolling window). */
export const MAX_ARTICLE_AGE_DAYS = 45

/**
 * @param {string | null | undefined} publishedAt
 * @param {number} [nowMs]
 */
export function isRecentArticle(publishedAt, nowMs = Date.now()) {
  if (!publishedAt) return false
  const ms = Date.parse(publishedAt)
  if (Number.isNaN(ms)) return false
  if (ms < RECENCY_MIN_MS) return false
  const maxAgeMs = MAX_ARTICLE_AGE_DAYS * 24 * 60 * 60 * 1000
  if (nowMs - ms > maxAgeMs) return false
  return true
}

/**
 * @param {Array<{ publishedAt?: string | null }>} items
 * @param {number} [nowMs]
 */
export function filterRecentArticles(items, nowMs = Date.now()) {
  return items.filter((item) => isRecentArticle(item.publishedAt, nowMs))
}
