import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { convertThroughUsd, describeRateSource, formatNumber } from '../lib/fx'
import type { SupportedFx } from '../lib/geoCurrency'
import type { SiteOutletContext } from '../siteOutletContext'

export function ConverterPage() {
  const { state, from, to, setFromUser, setToUser, swapCurrencies, geoHint } = useOutletContext<SiteOutletContext>()
  const [amount, setAmount] = useState(100)

  const convertedLabel = useMemo(() => {
    const rates = state.snapshot?.rates
    if (!rates) return '…'
    if (from === to) return formatNumber(amount, 4)
    const converted = convertThroughUsd(amount, from, to, rates)
    if (converted == null || !Number.isFinite(converted)) return '…'
    return formatNumber(converted, 6)
  }, [amount, from, to, state.snapshot?.rates])

  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 md:px-6 md:pt-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Tools</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-heading)] md:text-4xl">Currency converter</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text)]">
        Convert between USD, EUR, GBP, and NGN using the same admin-published snapshot as the rest of the site.
      </p>

      <div className="mt-10">
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-4 shadow-[var(--shadow-lg)] md:p-8">
          <div className="mb-6 flex flex-col gap-1 border-b border-[var(--border)] pb-6">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-heading)]">Live snapshot</h2>
              <p className="text-sm text-[var(--text-muted)]">Uses the same rates as the home board.</p>
              {geoHint ? <p className="mt-2 text-xs leading-relaxed text-[var(--accent)]">{geoHint}</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-6">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 md:p-5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                You send
              </label>
              <input
                type="number"
                min={0}
                className="mt-2 w-full border-0 bg-transparent font-mono text-3xl font-semibold tabular-nums text-[var(--text-heading)] outline-none focus:ring-0 md:text-4xl"
                value={Number.isFinite(amount) ? amount : 0}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <select
                className="mt-4 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-semibold text-[var(--text-heading)] outline-none focus:border-[var(--accent-border)] focus:ring-2 focus:ring-[var(--accent)]/25"
                value={from}
                onChange={(e) => setFromUser(e.target.value as SupportedFx)}
              >
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
                <option value="NGN">NGN (Nigerian Naira)</option>
              </select>
            </div>

            <div className="flex justify-center md:items-center md:pt-8">
              <button
                type="button"
                title="Swap currencies"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-hover)] text-[var(--accent)] transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-muted)]"
                onClick={() => swapCurrencies()}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M7 16V4m0 0L3 8m4-4 4 4m6-4v12m0 0l4-4m-4 4-4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 md:p-5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                They get
              </label>
              <div className="mt-2 min-h-[2.5rem] font-mono text-3xl font-semibold tabular-nums text-[var(--text-heading)] md:min-h-[2.75rem] md:text-4xl">
                {convertedLabel}
              </div>
              <select
                className="mt-4 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-semibold text-[var(--text-heading)] outline-none focus:border-[var(--accent-border)] focus:ring-2 focus:ring-[var(--accent)]/25"
                value={to}
                onChange={(e) => setToUser(e.target.value as SupportedFx)}
              >
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
                <option value="NGN">NGN (Nigerian Naira)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-[var(--text-muted)] md:text-left">
        {state.snapshot ? (
          <>
            Source: <span className="text-[var(--text)]">{describeRateSource(state.snapshot)}</span>. Indicative only, not
            for trading execution.
          </>
        ) : (
          <>
            Rates appear after you publish from <span className="font-mono text-[var(--text)]">admin.html</span>.
          </>
        )}
      </p>
    </section>
  )
}
