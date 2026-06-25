import { formatNewsDate } from '../lib/formatNewsDate'
import type { NewsCategory, NewsItem } from '../lib/newsTypes'
import { useNigeriaFxNews } from '../lib/useNigeriaFxNews'

const CATEGORY_STYLES: Record<NewsCategory, string> = {
  CBN: 'bg-[#143061]/10 text-[#143061] dark:bg-[#143061]/30 dark:text-[#93b4e8]',
  BDC: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  'Exchange Rate': 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  Forex: 'bg-[var(--accent-muted)] text-[var(--accent)]',
  'Monetary Policy': 'bg-violet-500/15 text-violet-800 dark:text-violet-300',
  Remittance: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
  'FX Market': 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
}

function NewsCardImage({ item }: { item: NewsItem }) {
  if (!item.imageUrl) {
    return (
      <div
        className="flex h-full min-h-[140px] w-full items-center justify-center bg-gradient-to-br from-[var(--accent-muted)] to-[var(--surface-hover)] md:min-h-0 md:w-44 md:shrink-0 lg:w-52"
        aria-hidden
      >
        <span className="text-3xl opacity-40">📰</span>
      </div>
    )
  }

  return (
    <div className="relative h-40 w-full shrink-0 overflow-hidden bg-[var(--surface-hover)] md:h-auto md:w-44 lg:w-52">
      <img
        src={item.imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    </div>
  )
}

function NewsCard({ item }: { item: NewsItem }) {
  const when = formatNewsDate(item.publishedAt)

  return (
    <article className="flex flex-col overflow-hidden transition-colors hover:bg-[var(--surface-hover)] md:flex-row">
      <NewsCardImage item={item} />
      <div className="flex min-w-0 flex-1 flex-col p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2 gap-y-1">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CATEGORY_STYLES[item.category]}`}
          >
            {item.category}
          </span>
          {item.sourceName ? (
            <span className="text-[11px] font-semibold text-[var(--text-muted)]">{item.sourceName}</span>
          ) : null}
          {when ? <time className="text-[11px] text-[var(--text-muted)]">{when}</time> : null}
        </div>

        <h3 className="mt-2 text-base font-bold leading-snug text-[var(--text-heading)] md:text-lg">{item.title}</h3>

        {item.description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--text)]">{item.description}</p>
        ) : null}

        <div className="mt-4">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white no-underline transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Read more
            <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </article>
  )
}

export function MarketNewsFeed() {
  const { items, loading, error, stale } = useNigeriaFxNews()

  return (
    <div>
      <header className="mb-6">
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--accent)]">Forex &amp; BDC News</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-heading)] md:text-3xl">
          Nigerian FX market headlines
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--text)]">
          Automated feed from CBN announcements, Reuters, Nairametrics, BusinessDay, TheCable, Channels TV, Punch,
          Vanguard, and other trusted sources. Only articles from May 2026 onward are shown. Refreshes every 15 minutes.
        </p>
      </header>

      <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
        {loading && items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">Fetching latest Forex and BDC headlines…</p>
          </div>
        ) : null}

        {error ? (
          <p className="border-b border-[var(--border)] p-5 text-sm text-red-500" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--text-muted)]">No relevant articles available right now.</p>
        ) : null}

        {items.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {items.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        ) : null}

        <footer className="border-t border-[var(--border)] px-4 py-3 text-[11px] leading-relaxed text-[var(--text-muted)] md:px-5">
          Articles open on the original publisher&apos;s website. Headlines are aggregated server-side, filtered for
          Nigerian FX relevance, deduplicated, and cached for performance.
          {stale ? (
            <span className="mt-1 block font-medium text-amber-600">
              Showing cached headlines after a temporary fetch issue.
            </span>
          ) : null}
        </footer>
      </div>
    </div>
  )
}
