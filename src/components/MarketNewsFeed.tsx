import { useEffect, useState } from 'react'
import { publicRatesBaseUrl } from '../lib/manualRatesApi'

type NewsItem = {
  id: string
  title: string
  url: string
  description: string
  publishedAt: string | null
  sourceName: string | null
}

type ApiResponse =
  | { ok: true; items: NewsItem[]; stale?: boolean }
  | { ok: false; error: string }

export function MarketNewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stale, setStale] = useState(false)

  useEffect(() => {
    const base = publicRatesBaseUrl() ?? ''
    const url = `${base}/api/public/nigeria-fx-news`
    let cancelled = false
    void fetch(url)
      .then(async (r) => {
        const data = (await r.json()) as ApiResponse
        if (!data.ok) throw new Error(data.error || 'Failed to load news')
        if (cancelled) return
        setItems(data.items)
        setStale(Boolean(data.stale))
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load news')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[var(--accent)]">News</p>
          <h2 className="mt-1 text-base font-semibold text-[var(--text-heading)] md:text-lg">
            Headlines from Google News and BBC Africa. Tap a row to open the full article.
          </h2>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
        {loading ? (
          <p className="p-5 text-sm text-[var(--text-muted)]">Loading headlines…</p>
        ) : null}
        {error ? (
          <p className="p-5 text-sm text-red-500">{error}</p>
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <p className="p-5 text-sm text-[var(--text-muted)]">No articles available right now.</p>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <ul className="divide-y divide-[var(--border)]">
            {items.map((item) => (
              <li key={item.id} className="transition-colors hover:bg-[var(--surface-hover)]">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block cursor-pointer p-4 no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] md:p-5"
                >
                  <div className="flex flex-wrap items-center gap-2 gap-y-1">
                    {item.sourceName ? (
                      <span className="rounded-full bg-[var(--accent-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
                        {item.sourceName}
                      </span>
                    ) : (
                      <span className="rounded-full bg-[var(--accent-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
                        News
                      </span>
                    )}
                    {item.publishedAt ? (
                      <span className="text-xs text-[var(--text-muted)]">{item.publishedAt}</span>
                    ) : null}
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                      Read article ↗
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-[var(--text-heading)] md:text-base">{item.title}</h3>
                  {item.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{item.description}</p>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="border-t border-[var(--border)] px-4 py-3 text-[11px] leading-relaxed text-[var(--text-muted)] md:px-5">
          Each link opens the publisher&apos;s page (often via Google News) in a new tab. Headlines are fetched on the
          server and cached briefly. Not financial advice.
          {stale ? <span className="mt-1 block text-amber-600">Showing cached headlines after a fetch issue.</span> : null}
        </p>
      </div>
    </div>
  )
}
