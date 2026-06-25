/**
 * Google News queries include `when:60d` and `after:2026-05-01` for recency.
 * Direct publisher feeds are filtered server-side by publication date.
 * @type {Array<{ url: string; label: string; strictFilter: boolean }>}
 */
export const NEWS_FEEDS = [
  {
    url: 'https://news.google.com/rss/search?q=Nigeria+(naira+OR+forex+OR+%22exchange+rate%22+OR+CBN+OR+%22bureau+de+change%22+OR+BDC)+when:60d+after:2026-05-01&hl=en&gl=NG&ceid=NG:en',
    label: 'Google News',
    strictFilter: false,
  },
  {
    url: 'https://news.google.com/rss/search?q=site:cbn.gov.ng+when:60d+after:2026-05-01&hl=en&gl=NG&ceid=NG:en',
    label: 'CBN',
    strictFilter: false,
  },
  {
    url: 'https://news.google.com/rss/search?q=site:nairametrics.com+(naira+OR+forex+OR+CBN+OR+exchange+OR+currency)+when:60d+after:2026-05-01&hl=en&gl=NG&ceid=NG:en',
    label: 'Nairametrics',
    strictFilter: false,
  },
  {
    url: 'https://news.google.com/rss/search?q=site:businessday.ng+(forex+OR+naira+OR+CBN+OR+currency+OR+%22exchange+rate%22)+when:60d+after:2026-05-01&hl=en&gl=NG&ceid=NG:en',
    label: 'BusinessDay',
    strictFilter: false,
  },
  {
    url: 'https://news.google.com/rss/search?q=site:thecable.ng+(naira+OR+forex+OR+CBN+OR+currency)+when:60d+after:2026-05-01&hl=en&gl=NG&ceid=NG:en',
    label: 'TheCable',
    strictFilter: false,
  },
  {
    url: 'https://news.google.com/rss/search?q=site:punchng.com+(naira+OR+forex+OR+%22exchange+rate%22+OR+CBN)+when:60d+after:2026-05-01&hl=en&gl=NG&ceid=NG:en',
    label: 'Punch',
    strictFilter: false,
  },
  {
    url: 'https://news.google.com/rss/search?q=site:vanguardngr.com+(naira+OR+forex+OR+CBN+OR+currency)+when:60d+after:2026-05-01&hl=en&gl=NG&ceid=NG:en',
    label: 'Vanguard',
    strictFilter: false,
  },
  {
    url: 'https://news.google.com/rss/search?q=site:channelstv.com+(naira+OR+forex+OR+currency+OR+CBN)+when:60d+after:2026-05-01&hl=en&gl=NG&ceid=NG:en',
    label: 'Channels TV',
    strictFilter: false,
  },
  {
    url: 'https://news.google.com/rss/search?q=site:reuters.com+Nigeria+(naira+OR+forex+OR+currency)+when:60d+after:2026-05-01&hl=en&gl=NG&ceid=NG:en',
    label: 'Reuters',
    strictFilter: false,
  },
  {
    url: 'https://news.google.com/rss/search?q=Nigeria+(remittance+OR+diaspora)+(naira+OR+forex+OR+dollar)+when:60d+after:2026-05-01&hl=en&gl=NG&ceid=NG:en',
    label: 'Google News',
    strictFilter: false,
  },
  {
    url: 'https://nairametrics.com/feed/',
    label: 'Nairametrics',
    strictFilter: true,
  },
  {
    url: 'https://businessday.ng/feed/',
    label: 'BusinessDay',
    strictFilter: true,
  },
  {
    url: 'https://punchng.com/topics/business/feed/',
    label: 'Punch',
    strictFilter: true,
  },
  {
    url: 'https://www.vanguardngr.com/category/business/feed/',
    label: 'Vanguard',
    strictFilter: true,
  },
  {
    url: 'https://www.channelstv.com/category/business/feed/',
    label: 'Channels TV',
    strictFilter: true,
  },
]

export const FETCH_HEADERS = {
  'user-agent': 'SpotRatesBoard/2.0 (RSS reader; +https://www.cbn.gov.ng)',
  accept: 'application/rss+xml, application/xml, text/xml, */*',
  'cache-control': 'no-cache',
}

export const FETCH_TIMEOUT_MS = 16_000
