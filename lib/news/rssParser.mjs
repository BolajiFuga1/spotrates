import crypto from 'node:crypto'

export function stripCdata(s) {
  const t = s.trim()
  const m = /^<!\[CDATA\[([\s\S]*?)\]\]>$/i.exec(t)
  return m ? m[1] : s
}

export function stripTags(s) {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
}

export function decHtmlEntities(str) {
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

export function cleanText(s) {
  return stripTags(decHtmlEntities(s)).replace(/\s+/g, ' ').trim()
}

export function getXmlText(block, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = re.exec(block)
  if (!m) return ''
  return stripCdata(m[1]).trim()
}

export function getXmlAttr(block, tag, attr) {
  const re = new RegExp(`<${tag}\\b[^>]*\\b${attr}=["']([^"']+)["']`, 'i')
  const m = re.exec(block)
  return m ? m[1].trim() : ''
}

export function truncate(s, n) {
  if (s.length <= n) return s
  return `${s.slice(0, n - 1)}…`
}

export function itemId(url) {
  return crypto.createHash('sha256').update(url).digest('base64url').slice(0, 22)
}

/**
 * @param {string} pubDate
 * @returns {string | null}
 */
export function parsePubDate(pubDate) {
  if (!pubDate) return null
  const d = new Date(pubDate)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

/** @param {string} url */
function isUsableImageUrl(url) {
  if (!/^https?:\/\//i.test(url)) return false
  const lower = url.toLowerCase()
  if (lower.includes('logo') || lower.includes('favicon') || lower.includes('placeholder')) return false
  if (lower.endsWith('.svg')) return false
  return true
}

/**
 * @param {string} block
 */
export function extractImageUrl(block) {
  const mediaContent = getXmlAttr(block, 'media:content', 'url') || getXmlAttr(block, 'media:thumbnail', 'url')
  if (mediaContent && isUsableImageUrl(mediaContent)) return mediaContent

  const enclosureUrl = getXmlAttr(block, 'enclosure', 'url')
  const enclosureType = getXmlAttr(block, 'enclosure', 'type')
  if (enclosureUrl && isUsableImageUrl(enclosureUrl) && /image\//i.test(enclosureType)) {
    return enclosureUrl
  }

  const encoded = getXmlText(block, 'content:encoded') || getXmlText(block, 'description')
  const imgMatch = /<img\b[^>]*\bsrc=["']([^"']+)["']/i.exec(encoded)
  if (imgMatch && isUsableImageUrl(imgMatch[1])) return imgMatch[1]

  return null
}

/**
 * @param {string} xml
 * @param {number} max
 * @param {string | null} [defaultSource]
 */
export function parseRss2Items(xml, max = 40, defaultSource = null) {
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

    const rawPub = getXmlText(block, 'pubDate') || getXmlText(block, 'dc:date') || getXmlText(block, 'updated')
    const rawDesc = getXmlText(block, 'description') || getXmlText(block, 'content:encoded')
    const description = rawDesc ? truncate(cleanText(rawDesc), 280) : ''
    const publishedAt = parsePubDate(rawPub ? cleanText(rawPub) : '')

    const srcM = /<source\b[^>]*(?:url="([^"]*)")?[^>]*>([^<]*)<\/source>/i.exec(block)
    const sourceName = srcM && srcM[2] ? cleanText(srcM[2]) : defaultSource

    items.push({
      id: itemId(url),
      title,
      url,
      description,
      publishedAt,
      sourceName,
      imageUrl: extractImageUrl(block),
    })
  }
  return items
}
