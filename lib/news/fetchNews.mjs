import { NEWS_FEEDS, FETCH_HEADERS, FETCH_TIMEOUT_MS } from './feeds.mjs'
import { parseRss2Items } from './rssParser.mjs'
import { isRelevantFxNews, categorizeNewsItem, normalizeTitleKey, filterRecentArticles } from './filter.mjs'

const logPrefix = '[nigeria-fx-news]'

/**
 * @param {string} feedUrl
 * @param {string} label
 * @param {AbortSignal} [signal]
 */
async function fetchFeed(feedUrl, label, signal) {
  const r = await fetch(feedUrl, { signal, headers: FETCH_HEADERS })
  if (!r.ok) {
    console.warn(`${logPrefix} feed HTTP ${r.status}: ${label}`)
    return []
  }
  const xml = await r.text()
  return parseRss2Items(xml, 30, label)
}

/**
 * @param {typeof NEWS_FEEDS} feeds
 * @param {number} perFeed
 * @param {AbortSignal} [signal]
 */
async function fetchAllFeeds(feeds, perFeed, signal) {
  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const raw = await fetchFeed(feed.url, feed.label, signal)
      return raw
        .filter((item) => isRelevantFxNews(item, feed.strictFilter))
        .map((item) => ({
          ...item,
          sourceName: item.sourceName || feed.label,
          category: categorizeNewsItem(item),
        }))
    }),
  )

  const merged = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      merged.push(...result.value)
    } else {
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason)
      console.warn(`${logPrefix} feed failed: ${reason}`)
    }
  }
  return merged
}

/** @param {Array<Record<string, unknown>>} items @param {number} limit */
function dedupeAndSort(items, limit) {
  const recent = filterRecentArticles(items)
  const seenUrls = new Set()
  const seenTitles = new Set()
  const out = []

  const sorted = [...recent].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0
    return tb - ta
  })

  for (const item of sorted) {
    if (seenUrls.has(item.url)) continue
    const titleKey = normalizeTitleKey(item.title)
    if (titleKey && seenTitles.has(titleKey)) continue
    seenUrls.add(item.url)
    if (titleKey) seenTitles.add(titleKey)
    out.push(item)
    if (out.length >= limit) break
  }

  return out
}

/**
 * @param {{ limit?: number; signal?: AbortSignal; feeds?: typeof NEWS_FEEDS }} [opts]
 */
export async function fetchNigeriaFxNewsItems(opts = {}) {
  const limit = typeof opts.limit === 'number' && opts.limit > 0 ? opts.limit : 36
  const feeds = Array.isArray(opts.feeds) && opts.feeds.length > 0 ? opts.feeds : NEWS_FEEDS
  const perFeed = Math.min(20, Math.ceil((limit * 2) / feeds.length))

  let signal = opts.signal
  let timeoutId
  if (!signal) {
    const ac = new AbortController()
    timeoutId = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
    signal = ac.signal
  }

  try {
    const merged = await fetchAllFeeds(feeds, perFeed, signal)
    return dedupeAndSort(merged, limit)
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}
