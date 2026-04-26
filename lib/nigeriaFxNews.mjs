import crypto from 'node:crypto'

const DEFAULT_FEEDS = [
  'https://news.google.com/rss/search?q=Nigeria+naira+forex+central+bank&hl=en&gl=NG&ceid=NG:en',
  'https://feeds.bbci.co.uk/news/world/africa/rss.xml',
]

function stripCdata(s) {
  const t = s.trim()
  const m = /^<!\[CDATA\[([\s\S]*?)\]\]>$/i.exec(t)
  return m ? m[1] : s
}

function stripTags(s) {
  return s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
}

function decHtmlEntities(str) {
  let s = str
  for (let i = 0; i < 4; i++) {
    s = s
      .replace(/&nbsp;/gi, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-fA-F]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/&amp;/g, '&')
  }
  return s
}

function cleanText(s) {
  return stripTags(decHtmlEntities(s)).replace(/\s+/g, ' ').trim()
}

function getXmlText(block, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = re.exec(block)
  if (!m) return ''
  return stripCdata(m[1]).trim()
}

function truncate(s, n) {
  if (s.length <= n) return s
  return `${s.slice(0, n - 1)}…`
}

function itemId(url) {
  return crypto.createHash('sha256').update(url).digest('base64url').slice(0, 22)
}

/**
 * @param {string} xml
 * @param {number} max
 */
export function parseRss2Items(xml, max = 40) {
  const items = []
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi
  let m
  while ((m = itemRe.exec(xml)) !== null && items.length < max) {
    const block = m[1]
    const rawTitle = getXmlText(block, 'title')
    const rawLink = getXmlText(block, 'link')
    if (!rawTitle || !rawLink) continue
    const title = cleanText(rawTitle)
    const url = rawLink.trim().replace(/\s+/g, '')
    if (!/^https?:\/\//i.test(url)) continue
    const rawPub = getXmlText(block, 'pubDate')
    const rawDesc = getXmlText(block, 'description')
    const description = rawDesc ? truncate(cleanText(rawDesc), 320) : ''
    const publishedAt = rawPub ? cleanText(rawPub) : null
    const srcM = /<source\b[^>]*(?:url="([^"]*)")?[^>]*>([^<]*)<\/source>/i.exec(block)
    const sourceName = srcM && srcM[2] ? cleanText(srcM[2]) : null
    items.push({
      id: itemId(url),
      title,
      url,
      description,
      publishedAt,
      sourceName,
    })
  }
  return items
}

/**
 * @param {{ limit?: number, signal?: AbortSignal, feeds?: string[] }} [opts]
 */
export async function fetchNigeriaFxNewsItems(opts = {}) {
  const limit = typeof opts.limit === 'number' && opts.limit > 0 ? opts.limit : 28
  const { signal } = opts
  const feeds = Array.isArray(opts.feeds) && opts.feeds.length > 0 ? opts.feeds : DEFAULT_FEEDS
  const perFeed = Math.min(24, Math.ceil((limit * 3) / feeds.length))
  const merged = []
  for (const feedUrl of feeds) {
    try {
      const r = await fetch(feedUrl, {
        signal,
        headers: {
          'user-agent': 'SpotRatesBoard/1.0 (RSS reader; +https://www.cbn.gov.ng)',
          accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
      })
      if (!r.ok) continue
      const xml = await r.text()
      merged.push(...parseRss2Items(xml, perFeed))
    } catch {
      /* try next feed */
    }
  }
  const seen = new Set()
  const out = []
  for (const it of merged) {
    if (seen.has(it.url)) continue
    seen.add(it.url)
    out.push(it)
    if (out.length >= limit) break
  }
  return out
}
