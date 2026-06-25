import { disconnectRedis, getRedis, readManualStore } from '../lib/manualRatesStore.js'
import { buildPublicRatesPayload } from '../../lib/rateDesk.mjs'

/** Same JSON as Express `GET /api/public/rates` (Vercel serverless + Upstash Redis). */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const redis = getRedis()
  try {
    const s = await readManualStore(redis)
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120')
    return res.status(200).json(buildPublicRatesPayload(s))
  } finally {
    await disconnectRedis(redis)
  }
}
