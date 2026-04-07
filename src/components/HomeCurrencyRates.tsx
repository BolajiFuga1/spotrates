import { formatNumber, type FeaturedRates } from '../lib/fx'

type Props = {
  featured: FeaturedRates | null
  loading: boolean
  hasError: boolean
}

const cards = [
  {
    code: 'USD',
    name: 'US Dollar',
    flag: '🇺🇸',
    accent: 'from-sky-500/20 to-transparent',
  },
  {
    code: 'NGN',
    name: 'Nigerian Naira',
    flag: '🇳🇬',
    accent: 'from-emerald-500/20 to-transparent',
  },
  {
    code: 'GBP',
    name: 'British Pound',
    flag: '🇬🇧',
    accent: 'from-violet-500/20 to-transparent',
  },
  {
    code: 'EUR',
    name: 'Euro',
    flag: '🇪🇺',
    accent: 'from-amber-500/15 to-transparent',
  },
] as const

export function HomeCurrencyRates(props: Props) {
  const { featured, loading, hasError } = props

  return (
    <div id="live-rates" className="scroll-mt-28">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Live spot (USD base)</h2>
          <p className="mt-1 text-sm text-[var(--text)]">Mid-market reference for USD, NGN, GBP, and EUR.</p>
        </div>
        {hasError && !featured ? (
          <p className="text-xs font-medium text-red-500">Showing last good values if available — refresh to retry.</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const isUsd = c.code === 'USD'
          const isNgn = c.code === 'NGN'
          const isGbp = c.code === 'GBP'
          const isEur = c.code === 'EUR'

          let primary = '—'
          let unit = ''
          let secondary: string | null = null

          if (featured) {
            if (isUsd) {
              primary = '1.00'
              unit = 'Reference'
            } else if (isNgn) {
              primary = formatNumber(featured.usdToNgn, 2)
              unit = 'NGN per 1 USD'
            } else if (isGbp) {
              primary = formatNumber(featured.usdToGbp, 4)
              unit = 'GBP per 1 USD'
              secondary = `1 GBP ≈ ${formatNumber(featured.gbpToNgn, 2)} NGN`
            } else if (isEur) {
              primary = formatNumber(featured.usdToEur, 4)
              unit = 'EUR per 1 USD'
              secondary = `1 EUR ≈ ${formatNumber(featured.eurToNgn, 2)} NGN`
            }
          }

          return (
            <article
              key={c.code}
              className="group relative overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-lg)] transition hover:border-[var(--accent-border)]"
            >
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b ${c.accent} opacity-80`}
                aria-hidden
              />
              <div className="relative p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-xl shadow-sm"
                      aria-hidden
                    >
                      {c.flag}
                    </span>
                    <div>
                      <div className="font-mono text-lg font-bold tracking-tight text-[var(--text-heading)]">{c.code}</div>
                      <div className="text-xs font-medium text-[var(--text-muted)]">{c.name}</div>
                    </div>
                  </div>
                  {loading && !featured ? (
                    <span className="rounded-full bg-[var(--accent-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                      …
                    </span>
                  ) : featured ? (
                    <span className="rounded-full bg-[var(--positive-dim)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--positive)]">
                      Live
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 border-t border-[var(--border)] pt-5">
                  {loading && !featured ? (
                    <div className="space-y-2">
                      <div className="h-9 w-3/4 max-w-[12rem] animate-pulse rounded-lg bg-[var(--border)]" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--border)]" />
                    </div>
                  ) : (
                    <>
                      <div
                        className={`font-mono font-bold tabular-nums text-[var(--text-heading)] ${isUsd ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}`}
                      >
                        {isUsd ? (
                          <span className="tracking-tight">{primary}</span>
                        ) : (
                          <span>{primary}</span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs font-medium leading-snug text-[var(--text-muted)]">{unit}</p>
                      {secondary ? (
                        <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text)]">
                          {secondary}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
