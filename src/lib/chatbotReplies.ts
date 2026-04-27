import { formatNumber, type FeaturedRates } from './fx'

/** WhatsApp deep link: opens app on mobile, WhatsApp Web / desktop client where supported. */
export const WHATSAPP_SPECIALIST_HREF =
  'https://wa.me/2348094705599?text=' + encodeURIComponent('Hello E-lloydsFX, I have a question.')

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
    /(usd|dollar|\$|eur|euro|gbp|pound|£|naira|ngn|₦|rate|convert|conversion|fx|forex|currency|mid|pair|cross|snapshot)/.test(
      n,
    )
  ) {
    return true
  }
  if (/\d/.test(raw) && /(usd|eur|gbp|ngn|naira|dollar|pound|euro)/i.test(raw)) return true
  return false
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
        'Rates: “USD to NGN”, “pound to naira”, “euro rate”.\n' +
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
        'Rates here are entered in the E-lloydsFX admin dashboard. We do not scrape live market feeds.',
    )
  }

  const mentionsUsd = /\b(usd|dollar|\$)\b/.test(n)
  const mentionsGbp = /\b(gbp|pound|sterling|£)\b/.test(n)
  const mentionsEur = /\b(eur|euro|€)\b/.test(n)
  const mentionsNgn = /\b(ngn|naira|₦)\b/.test(n)

  if ((mentionsUsd && mentionsNgn) || /\b(usd|dollar).{0,24}(ngn|naira)\b/.test(input)) {
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
