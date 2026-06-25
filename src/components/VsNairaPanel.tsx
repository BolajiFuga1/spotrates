import { useState } from 'react'
import { formatNumber, type FeaturedRates } from '../lib/fx'

export type RateSide = 'buy' | 'sell'

type Props = {
  featured: FeaturedRates | null
  loading: boolean
  hasError: boolean
  viewerInNigeria: boolean
}

const rows = [
  {
    key: 'usd',
    label: 'US Dollar',
    flag: '🇺🇸',
    pairLabel: '1 USD',
    suffix: 'NGN',
    buy: (f: FeaturedRates) => f.usdToNgnBuy,
    sell: (f: FeaturedRates) => f.usdToNgnSell,
    subBuy: 'Dollar to naira (buy)',
    subSell: 'Dollar to naira (sell)',
  },
  {
    key: 'gbp',
    label: 'British Pound',
    flag: '🇬🇧',
    pairLabel: '1 GBP',
    suffix: 'NGN',
    buy: (f: FeaturedRates) => f.gbpToNgnBuy,
    sell: (f: FeaturedRates) => f.gbpToNgnSell,
    subBuy: 'Pound to naira (buy)',
    subSell: 'Pound to naira (sell)',
  },
  {
    key: 'eur',
    label: 'Euro',
    flag: '🇪🇺',
    pairLabel: '1 EUR',
    suffix: 'NGN',
    buy: (f: FeaturedRates) => f.eurToNgnBuy,
    sell: (f: FeaturedRates) => f.eurToNgnSell,
    subBuy: 'Euro to naira (buy)',
    subSell: 'Euro to naira (sell)',
  },
] as const

function RateSideToggle({ value, onChange }: { value: RateSide; onChange: (side: RateSide) => void }) {
  return (
    <div
      role="group"
      aria-label="Show buy or sell rates"
      className="relative inline-grid w-full max-w-xs grid-cols-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-1 sm:w-auto"
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-lg bg-[var(--accent)] shadow-sm transition-transform duration-200 ease-out ${
          value === 'sell' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'
        }`}
        style={{ left: '4px' }}
      />
      {(
        [
          ['buy', 'Buy rate'],
          ['sell', 'Sell rate'],
        ] as const
      ).map(([side, label]) => (
        <button
          key={side}
          type="button"
          aria-pressed={value === side}
          onClick={() => onChange(side)}
          className={`relative z-10 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
            value === side ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function VsNairaPanel(props: Props) {
  const { featured, loading, hasError, viewerInNigeria } = props
  const [side, setSide] = useState<RateSide>('sell')

  return (
    <div id="vs-naira" className="scroll-mt-28">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--accent)]">
            {viewerInNigeria ? 'Rates where you are' : 'Versus Nigerian Naira'}
          </h2>
          <p className="mt-1 max-w-2xl text-base font-semibold text-[var(--text-heading)] md:text-lg">
            {viewerInNigeria
              ? 'Dollar, pound, and euro, each priced in naira. Toggle buy or sell desk rates.'
              : 'How much ₦ for one dollar, one pound, and one euro — switch between buy and sell rates.'}
          </p>
        </div>
        <RateSideToggle value={side} onChange={setSide} />
      </div>

      {hasError && !featured ? (
        <p className="mb-4 text-xs font-medium text-red-500">Stale or missing data. Tap Refresh.</p>
      ) : null}

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
                      {formatNumber(side === 'buy' ? row.buy(featured) : row.sell(featured), 2)}
                    </span>
                    <span className="text-lg font-semibold text-[var(--text-muted)]">{row.suffix}</span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-[var(--text-muted)]">
                    {side === 'buy' ? row.subBuy : row.subSell}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No rate yet</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
