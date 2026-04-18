import { formatNumber, type FeaturedRates } from './fx'

/** Lowercase, collapse spaces, strip most punctuation for matching. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function makeBotReply(
  inputRaw: string,
  rates: FeaturedRates | null,
  ratesSourceLine: string | null | undefined,
): string {
  const raw = inputRaw.trim()
  if (!raw) return "Type a question and I'll help."

  const input = raw.toLowerCase()
  const n = norm(raw)
  const hasRates = !!rates

  if (/(^|\b)(hi|hello|hey)\b/.test(input) || /good\s*(morning|afternoon|evening)/.test(input)) {
    return (
      'Hi! I can explain E-lloydsFX services (PTA/BTA, remittances, delivery, bank deposits), or published FX rates ' +
      '(USD/GBP/EUR vs NGN). Try “What is PTA?” or “USD to naira”.'
    )
  }

  if (/\b(help|what can you|commands)\b/.test(input)) {
    return (
      'Try asking about:\n' +
      '• Rates: “USD to NGN”, “pound to naira”, “euro rate”\n' +
      '• Site: “refresh”, “where do rates come from”\n' +
      '• E-lloydsFX: “PTA”, “BTA”, “remittance”, “delivery”, “cashless”\n' +
      'Or open the Services section on this page for full details.'
    )
  }

  if (/(service|germaine|e-lloyds|elloyds|bdc|what do you offer|what services)/.test(input)) {
    return (
      'E-lloydsFX offers cash forex purchase/sale, PTA & BTA (CBN-authorized limits apply), remittances (school fees, ' +
      'medical, utilities, and more), inflows, deliveries, bank deposits, accounts at major banks, and cashless ' +
      'payments (wire/deposit). See “Our services” on this page for the full breakdown.'
    )
  }

  if (/\bpta\b|personal travel allowance/.test(input)) {
    return (
      'PTA (Personal Travel Allowance): E-lloydsFX is CBN-authorized. Travelers can buy FX up to $4,000 per quarter ' +
      '(or GBP/EUR equivalent). You cannot buy PTA and BTA for the same trip (both in the same quarter is allowed). ' +
      'PTA is only for your nuclear family (spouse + up to two children over 12). No PTA/BTA for travel to some ' +
      'West African destinations or visa-free places—see Services for details.'
    )
  }

  if (/\bbta\b|business travel allowance/.test(input)) {
    return (
      'BTA (Business Travel Allowance): E-lloydsFX is CBN-authorized. Up to $5,000 per quarter (or GBP/EUR equivalent). ' +
      'You cannot buy BTA and PTA for the same trip. Full rules are under “Our services” on this page.'
    )
  }

  if (/remitt|wire|transfer|school fee|medical fee|mortgage|utility|subscription|insurance premium/.test(input)) {
    return (
      'E-lloydsFX arranges FX remittances for travel allowances, mortgages, school fees, medical fees, card bills, ' +
      'utilities, hospital and rent bills, subscriptions, professional fees, and life insurance premiums—see the list ' +
      'under “Foreign exchange remittance services” on this page.'
    )
  }

  if (/delivery|deliveries|traffic/.test(input)) {
    return (
      'E-lloydsFX offers delivery for larger currency purchases; smaller amounts may incur a small delivery fee—' +
      'popular with clients who want to avoid traffic.'
    )
  }

  if (/bank deposit|deposit.*forex|forex.*account/.test(input)) {
    return (
      'We can help deposit purchased forex to your bank—often straight to your FX account so you can settle foreign ' +
      'goods or services faster.'
    )
  }

  if (/multiple bank|which bank|account/.test(input)) {
    return (
      'E-lloydsFX holds accounts across major Nigerian banks so customers can pay or receive through the bank that ' +
      'suits them best.'
    )
  }

  if (/cashless|pay cash|wire funds|deposit/.test(input)) {
    return (
      'E-lloydsFX is cashless for buying forex—you can wire or deposit to our accounts instead of bringing cash.'
    )
  }

  if (/inflow|credit.*purpose|larger.*wire/.test(input)) {
    return (
      'We can source larger wires for direct credit when customers prefer an inflow to holding physical cash.'
    )
  }

  if (/(update|refresh|how\s*often|every\s*how)/.test(input)) {
    return 'Published rates on this page refetch about every 60 seconds. You can also tap “Refresh” in the header.'
  }

  if (/(source|where.*rate|who set|api|how.*rate)/.test(input)) {
    return (
      ratesSourceLine?.trim() ||
      'Rates here are published from the E-lloydsFX admin dashboard only—not live scraped market feeds.'
    )
  }

  const mentionsUsd = /\b(usd|dollar|\$)\b/.test(n)
  const mentionsGbp = /\b(gbp|pound|sterling|£)\b/.test(n)
  const mentionsEur = /\b(eur|euro|€)\b/.test(n)
  const mentionsNgn = /\b(ngn|naira|₦)\b/.test(n)

  if ((mentionsUsd && mentionsNgn) || /\b(usd|dollar).{0,24}(ngn|naira)\b/.test(input)) {
    return hasRates
      ? `About 1 USD ≈ ${formatNumber(rates!.usdToNgn, 6)} NGN (published mid on this page).`
      : 'Rates are still loading—publish USD/NGN from admin if you see errors, then try again.'
  }

  if ((mentionsGbp && mentionsNgn) || /\b(gbp|pound).{0,24}(ngn|naira)\b/.test(input)) {
    return hasRates
      ? `About 1 GBP ≈ ${formatNumber(rates!.gbpToNgn, 6)} NGN (published mid on this page).`
      : 'Rates are still loading—check admin publish status and retry.'
  }

  if ((mentionsEur && mentionsNgn) || /\b(eur|euro).{0,24}(ngn|naira)\b/.test(input)) {
    return hasRates
      ? `About 1 EUR ≈ ${formatNumber(rates!.eurToNgn, 6)} NGN (published mid on this page).`
      : 'Rates are still loading—check admin publish status and retry.'
  }

  if ((mentionsUsd && mentionsGbp) || /\b(usd|dollar).{0,24}(gbp|pound)\b/.test(input)) {
    return hasRates
      ? `About 1 USD ≈ ${formatNumber(rates!.usdToGbp, 6)} GBP.`
      : 'Rates are still loading—try again shortly.'
  }

  if ((mentionsUsd && mentionsEur) || /\b(usd|dollar).{0,24}(eur|euro)\b/.test(input)) {
    return hasRates
      ? `About 1 USD ≈ ${formatNumber(rates!.usdToEur, 6)} EUR.`
      : 'Rates are still loading—try again shortly.'
  }

  // Single-word or short asks: "naira", "usd rate", "euro"
  if (hasRates && (/\brate\b|\bprice\b|\bhow much\b/.test(n) || n === 'usd' || n === 'dollar')) {
    if (mentionsNgn || /\bnaira\b/.test(input)) {
      return `USD/NGN ≈ ${formatNumber(rates!.usdToNgn, 6)}. I can also answer GBP/NGN or EUR/NGN—just ask “pound to naira”.`
    }
    return `1 USD ≈ ${formatNumber(rates!.usdToNgn, 6)} NGN on the current snapshot. Ask “GBP to NGN” for pounds.`
  }

  if (hasRates && (/\bpound\b|\bgbp\b/.test(input) || n === 'gbp')) {
    return `1 GBP ≈ ${formatNumber(rates!.gbpToNgn, 6)} NGN on the current snapshot.`
  }

  if (hasRates && (/\beuro\b|\beur\b/.test(input) || n === 'eur')) {
    return `1 EUR ≈ ${formatNumber(rates!.eurToNgn, 6)} NGN on the current snapshot.`
  }

  if (hasRates && /\bnaira\b|\bngn\b/.test(input) && !mentionsUsd && !mentionsGbp && !mentionsEur) {
    return (
      `Published mids: USD/NGN ${formatNumber(rates!.usdToNgn, 4)}, GBP/NGN ${formatNumber(rates!.gbpToNgn, 4)}, EUR/NGN ${formatNumber(rates!.eurToNgn, 4)}. ` +
      'Ask for a specific pair if you need more precision.'
    )
  }

  if (hasRates) {
    return (
      'I did not match that exactly. Published snapshot right now:\n' +
      `• USD/NGN ${formatNumber(rates!.usdToNgn, 4)}\n` +
      `• GBP/NGN ${formatNumber(rates!.gbpToNgn, 4)}\n` +
      `• EUR/NGN ${formatNumber(rates!.eurToNgn, 4)}\n` +
      'Try “help”, “PTA”, “remittance”, or a pair like “dollar to naira”.'
    )
  }

  return (
    'Rates are not loaded yet (admin may need to publish). Meanwhile I can explain E-lloydsFX services—try ' +
    '“help”, “PTA”, “BTA”, or “remittance”. You can also read “Our services” on this page.'
  )
}
