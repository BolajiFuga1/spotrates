import { filterRecentArticles } from './filter.mjs'

export const NEWS_TTL_MS = 15 * 60 * 1000
/** Bump when feed logic changes to invalidate stale in-memory cache. */
export const CACHE_VERSION = 3

let newsCache = { at: 0, items: [], version: 0 }

export function getCachedNewsItems() {
  if (newsCache.version !== CACHE_VERSION) return []
  return filterRecentArticles(newsCache.items)
}

export function isNewsCacheFresh() {
  const items = getCachedNewsItems()
  return Date.now() - newsCache.at < NEWS_TTL_MS && items.length > 0
}

export function setNewsCache(items) {
  newsCache = { at: Date.now(), items, version: CACHE_VERSION }
}

export function getNewsCacheFetchedAt() {
  return newsCache.at ? new Date(newsCache.at).toISOString() : new Date().toISOString()
}
