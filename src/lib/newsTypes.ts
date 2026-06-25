export type NewsCategory =
  | 'Forex'
  | 'CBN'
  | 'Exchange Rate'
  | 'BDC'
  | 'Monetary Policy'
  | 'Remittance'
  | 'FX Market'

export type NewsItem = {
  id: string
  title: string
  url: string
  description: string
  publishedAt: string | null
  sourceName: string | null
  imageUrl: string | null
  category: NewsCategory
}

export type NewsApiResponse =
  | { ok: true; items: NewsItem[]; stale?: boolean; fetchedAt?: string }
  | { ok: false; error: string }
