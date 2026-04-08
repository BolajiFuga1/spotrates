import { getRedis, readManualStore } from '../lib/manualRatesStore.js'

/** Same JSON as Express `GET /api/public/rates` (Vercel serverless + Upstash Redis). */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const redis = getRedis()
  const s = await readManualStore(redis)
  if (!s.active || !s.rates?.NGN || !s.rates?.GBP || !s.rates?.EUR) {
    return res.status(200).json({ active: false })
  }
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120')
  return res.status(200).json({
    active: true,
    base: 'USD',
    rates: {
      NGN: s.rates.NGN,
      GBP: s.rates.GBP,
      EUR: s.rates.EUR,
    },
    updatedAtMs: s.updatedAtMs ?? Date.now(),
  })
}
