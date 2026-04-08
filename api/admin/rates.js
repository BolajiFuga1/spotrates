import {
  fromUsdBase,
  getRedis,
  readManualStore,
  toUsdBase,
  writeManualStore,
} from '../lib/manualRatesStore.js'
import { adminCookieName, parseCookies, verifySession } from '../lib/adminSession.js'

const ADMIN_AUTH_ENABLED = process.env.SPOTRATES_ADMIN_AUTH === '1'
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim()

function adminAuthorized(req) {
  if (!ADMIN_AUTH_ENABLED) return true
  const cookies = parseCookies(req.headers.cookie)
  return Boolean(verifySession(cookies[adminCookieName()]))
}

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return {}
}

/** Same behavior as Express admin rates routes (Vercel + Upstash Redis). */
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  if (!adminAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  const redis = getRedis()

  if (req.method === 'GET') {
    const s = await readManualStore(redis)
    if (!s.rates?.NGN) {
      return res.status(200).json({
        active: s.active,
        ngnPerUsd: '',
        ngnPerGbp: '',
        ngnPerEur: '',
        updatedAtMs: s.updatedAtMs,
      })
    }
    const d = fromUsdBase(s.rates)
    return res.status(200).json({
      active: s.active,
      ngnPerUsd: d.ngnPerUsd,
      ngnPerGbp: d.ngnPerGbp,
      ngnPerEur: d.ngnPerEur,
      updatedAtMs: s.updatedAtMs,
    })
  }

  if (!redis) {
    return res.status(503).json({
      ok: false,
      error:
        'Redis is not configured for this deployment. In Vercel: open this project → Storage → Create database → Redis (Upstash) → connect to this project. Then Settings → Environment Variables: ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN) exist for Production. Redeploy the project, then try Save again.',
    })
  }

  const body = readJsonBody(req)

  if (body.active === false) {
    const prev = await readManualStore(redis)
    await writeManualStore(redis, {
      active: false,
      rates: prev.rates,
      updatedAtMs: Date.now(),
    })
    return res.status(200).json({ ok: true })
  }

  const u = Number(body.ngnPerUsd)
  const g = Number(body.ngnPerGbp)
  const e = Number(body.ngnPerEur)
  if (![u, g, e].every((n) => Number.isFinite(n) && n > 0)) {
    return res.status(400).json({
      ok: false,
      error: 'Enter positive numbers: naira per US dollar, per pound, and per euro.',
    })
  }
  const rates = toUsdBase(u, g, e)
  const updatedAtMs = Date.now()
  await writeManualStore(redis, { active: true, rates, updatedAtMs })
  return res.status(200).json({ ok: true, rates, updatedAtMs })
}
