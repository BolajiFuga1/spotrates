const CBN_EXCHANGE_JSON = 'https://www.cbn.gov.ng/api/GetAllExchangeRates'
const CBN_RATES_PAGE = 'https://www.cbn.gov.ng/rates/ExchRateByCurrency.html'

/** Vercel serverless — same JSON shape as Express `GET /api/public/cbn-official-usd`. */
export default async function handler(req, res) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 14_000)
    let r
    try {
      r = await fetch(CBN_EXCHANGE_JSON, {
        signal: ac.signal,
        headers: {
          accept: 'application/json',
          'user-agent': 'SpotRatesBoard/1.0 (rates display; +https://www.cbn.gov.ng)',
        },
      })
    } finally {
      clearTimeout(t)
    }
    if (!r.ok) {
      return res.status(502).json({ ok: false, error: `CBN responded ${r.status}` })
    }
    const data = await r.json()
    if (!Array.isArray(data)) {
      return res.status(502).json({ ok: false, error: 'Unexpected CBN payload' })
    }
    const usd = data.filter(
      (row) =>
        row &&
        typeof row.currency === 'string' &&
        row.currency.trim().toUpperCase() === 'US DOLLAR' &&
        typeof row.ratedate === 'string',
    )
    if (usd.length === 0) {
      return res.status(502).json({ ok: false, error: 'No US DOLLAR row from CBN' })
    }
    usd.sort((a, b) => String(b.ratedate).localeCompare(String(a.ratedate)))
    const row = usd[0]
    const buying = Number(row.buyingrate)
    const central = Number(row.centralrate)
    const selling = Number(row.sellingrate)
    if (![buying, central, selling].every((n) => Number.isFinite(n) && n > 0)) {
      return res.status(502).json({ ok: false, error: 'Invalid CBN US DOLLAR numbers' })
    }
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400')
    return res.status(200).json({
      ok: true,
      ratedate: row.ratedate,
      buying,
      central,
      selling,
      sourceUrl: CBN_RATES_PAGE,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Request failed'
    return res.status(502).json({ ok: false, error: msg })
  }
}
