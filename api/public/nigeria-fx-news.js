import { fetchNigeriaFxNewsItems } from '../../lib/nigeriaFxNews.mjs'

let newsCache = { at: 0, items: [] }
const NEWS_TTL_MS = 15 * 60 * 1000

/** Vercel serverless — same JSON shape as Express `GET /api/public/nigeria-fx-news`. */
export default async function handler(req, res) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const fresh = Date.now() - newsCache.at < NEWS_TTL_MS && newsCache.items.length > 0
  if (fresh) {
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600')
    return res.status(200).json({ ok: true, items: newsCache.items })
  }

  try {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 16_000)
    let items
    try {
      items = await fetchNigeriaFxNewsItems({ limit: 30, signal: ac.signal })
    } finally {
      clearTimeout(t)
    }
    if (!items.length && newsCache.items.length) {
      res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=86400')
      return res.status(200).json({ ok: true, items: newsCache.items, stale: true })
    }
    if (!items.length) {
      return res.status(502).json({ ok: false, error: 'No news items available' })
    }
    newsCache = { at: Date.now(), items }
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=86400')
    return res.status(200).json({ ok: true, items })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Request failed'
    if (newsCache.items.length) {
      res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=86400')
      return res.status(200).json({ ok: true, items: newsCache.items, stale: true })
    }
    return res.status(502).json({ ok: false, error: msg })
  }
}
