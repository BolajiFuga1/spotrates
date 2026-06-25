import { fetchNigeriaFxNewsItems } from '../../lib/nigeriaFxNews.mjs'
import {
  getCachedNewsItems,
  getNewsCacheFetchedAt,
  isNewsCacheFresh,
  setNewsCache,
} from '../../lib/news/cache.mjs'

/** Vercel serverless — same JSON shape as Express `GET /api/public/nigeria-fx-news`. */
export default async function handler(req, res) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  if (isNewsCacheFresh()) {
    const items = getCachedNewsItems()
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800')
    return res.status(200).json({
      ok: true,
      items,
      fetchedAt: getNewsCacheFetchedAt(),
    })
  }

  try {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 16_000)
    let items
    try {
      items = await fetchNigeriaFxNewsItems({ limit: 40, signal: ac.signal })
    } finally {
      clearTimeout(t)
    }

    const cached = getCachedNewsItems()
    if (!items.length && cached.length) {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=3600')
      return res.status(200).json({
        ok: true,
        items: cached,
        stale: true,
        fetchedAt: getNewsCacheFetchedAt(),
      })
    }
    if (!items.length) {
      return res.status(502).json({ ok: false, error: 'No recent news items available' })
    }

    setNewsCache(items)
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600')
    return res.status(200).json({
      ok: true,
      items,
      fetchedAt: getNewsCacheFetchedAt(),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Request failed'
    const cached = getCachedNewsItems()
    if (cached.length) {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=3600')
      return res.status(200).json({
        ok: true,
        items: cached,
        stale: true,
        fetchedAt: getNewsCacheFetchedAt(),
      })
    }
    return res.status(502).json({ ok: false, error: msg })
  }
}
