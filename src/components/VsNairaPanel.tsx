import { formatNumber, type FeaturedRates } from '../lib/fx'

type Props = {
  featured: FeaturedRates | null
  loading: boolean
  hasError: boolean
  /** When true, headline speaks to “where you are” (e.g. Nigeria). */
  viewerInNigeria: boolean
}

const rows = [
  {
    key: 'usd',
    label: 'US Dollar',
    flag: '🇺🇸',
    pairLabel: '1 USD',
    getValue: (f: FeaturedRates) => formatNumber(f.usdToNgn, 2),
    suffix: 'NGN',
    sub: 'Dollar to naira (mid)',
  },
  {
    key: 'gbp',
    label: 'British Pound',
    flag: '🇬🇧',
    pairLabel: '1 GBP',
    getValue: (f: FeaturedRates) => formatNumber(f.gbpToNgn, 2),
    suffix: 'NGN',
    sub: 'Pound to naira (mid)',
  },
  {
    key: 'eur',
    label: 'Euro',
    flag: '🇪🇺',
    pairLabel: '1 EUR',
    getValue: (f: FeaturedRates) => formatNumber(f.eurToNgn, 2),
    suffix: 'NGN',
    sub: 'Euro to naira (mid)',
  },
] as const

export function VsNairaPanel(props: Props) {
  const { featured, loading, hasError, viewerInNigeria } = props

  return (
    <div id="vs-naira" className="scroll-mt-28">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--accent)]">
            {viewerInNigeria ? 'Rates where you are' : 'Versus Nigerian Naira'}
          </h2>
          <p className="mt-1 max-w-2xl text-base font-semibold text-[var(--text-heading)] md:text-lg">
            {viewerInNigeria
              ? 'Dollar, pound, and euro — each priced in naira from the same live snapshot.'
              : 'How much ₦ for one dollar, one pound, and one euro (indicative mid rates).'}
          </p>
        </div>
        {hasError && !featured ? (
          <p className="text-xs font-medium text-red-500">Stale or missing data — tap Refresh.</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {rows.map((row) => (
          <article
            key={row.key}
            className="relative overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-5 shadow-[var(--shadow-lg)] md:p-6"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[var(--accent)]/50 to-transparent"
              aria-hidden
            />
            <div className="flex items-center gap-3">
              <span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] text-2xl"
                aria-hidden
              >
                {row.flag}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{row.label}</div>
                <div className="mt-0.5 text-sm font-medium text-[var(--text)]">{row.pairLabel}</div>
              </div>
            </div>

            <div className="mt-5">
              {loading && !featured ? (
                <div className="space-y-2">
                  <div className="h-10 w-full max-w-[14rem] animate-pulse rounded-lg bg-[var(--border)]" />
                  <div className="h-3 w-24 animate-pulse rounded bg-[var(--border)]" />
                </div>
              ) : featured ? (
                <>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-3xl font-bold tabular-nums tracking-tight text-[var(--text-heading)] md:text-4xl">
                      {row.getValue(featured)}
                    </span>
                    <span className="text-lg font-semibold text-[var(--text-muted)]">{row.suffix}</span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-[var(--text-muted)]">{row.sub}</p>
                </>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">—</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
