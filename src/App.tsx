import { CbnOfficialBanner } from './components/CbnOfficialBanner'
import { Chatbot } from './components/Chatbot'
import { HomeCurrencyRates } from './components/HomeCurrencyRates'
import { RatesTable, type RateRow } from './components/RatesTable'
import { MarketNewsFeed } from './components/MarketNewsFeed'
import { VsNairaPanel } from './components/VsNairaPanel'
import { useFxRates } from './lib/useFxRates'
import { useGeoCurrencies } from './lib/useGeoCurrencies'
import { useMemo, useState } from 'react'
import { convertThroughUsd, describeRateSource, formatNumber } from './lib/fx'
import type { SupportedFx } from './lib/geoCurrency'

const SITE_NAV = [
  ['Home', '#home'],
  ['About us', '#about-us'],
  ['Services', '#services'],
  ['Nigeria FX', '#news'],
  ['₦ vs $ € £', '#vs-naira'],
  ['Converter', '#converter'],
] as const

/** Shown in the footer Tools column only (not in the top navbar). */
const FOOTER_TOOLS_EXTRA = [
  ['Watchlist', '#rates'],
  ['Disclosure', '#disclosure'],
] as const

function App() {
  const { state, featured, refresh } = useFxRates(60_000)
  const { from, to, setFromUser, setToUser, swapCurrencies, geoHint, countryCode } = useGeoCurrencies()
  const viewerInNigeria = countryCode === 'NG'
  const [navOpen, setNavOpen] = useState(false)
  const [amount, setAmount] = useState(100)

  const updatedAtLabel = state.snapshot
    ? new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(state.snapshot.fetchedAtMs))
    : null

  const convertedLabel = useMemo(() => {
    const rates = state.snapshot?.rates
    if (!rates) return '—'
    if (from === to) return formatNumber(amount, 4)
    const converted = convertThroughUsd(amount, from, to, rates)
    if (converted == null || !Number.isFinite(converted)) return '—'
    return formatNumber(converted, 6)
  }, [amount, from, to, state.snapshot?.rates])

  const tableRows: RateRow[] = useMemo(() => {
    if (!featured) return []
    return [
      {
        pair: 'USD / NGN',
        code: 'USDNGN',
        rate: featured.usdToNgn,
        note: '1 US Dollar in Nigerian Naira',
      },
      {
        pair: 'EUR / NGN',
        code: 'EURNGN',
        rate: featured.eurToNgn,
        note: '1 Euro in Nigerian Naira',
      },
      {
        pair: 'GBP / NGN',
        code: 'GBPNGN',
        rate: featured.gbpToNgn,
        note: '1 British Pound in Nigerian Naira',
      },
      {
        pair: 'USD / GBP',
        code: 'USDGBP',
        rate: featured.usdToGbp,
        note: '1 US Dollar in British Pounds',
      },
      {
        pair: 'USD / EUR',
        code: 'USDEUR',
        rate: featured.usdToEur,
        note: '1 US Dollar in Euros',
      },
    ]
  }, [featured])

  const tickerPairs = useMemo(
    () =>
      [
        ['USD/NGN', featured ? formatNumber(featured.usdToNgn, 4) : '—'],
        ['EUR/NGN', featured ? formatNumber(featured.eurToNgn, 4) : '—'],
        ['GBP/NGN', featured ? formatNumber(featured.gbpToNgn, 4) : '—'],
        ['USD/GBP', featured ? formatNumber(featured.usdToGbp, 6) : '—'],
        ['USD/EUR', featured ? formatNumber(featured.usdToEur, 6) : '—'],
        ['Refresh', '60s'],
      ] as const,
    [featured],
  )

  const statusLabel =
    state.status === 'ready' ? 'Admin rates' : state.status === 'error' ? 'Awaiting admin' : 'Loading'

  return (
    <>
      <div className="border-b border-[var(--border)] bg-[var(--ticker-bg)]">
        <div className="overflow-hidden">
          <div className="animate-ticker inline-flex items-center gap-8 whitespace-nowrap px-4 py-2.5">
            {tickerPairs.map(([k, v]) => (
              <span key={k} className="inline-flex items-baseline gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{k}</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-[var(--text-heading)]">{v}</span>
              </span>
            ))}
            <span className="inline-flex w-8 shrink-0" aria-hidden />
            {tickerPairs.map(([k, v]) => (
              <span key={`d-${k}`} className="inline-flex items-baseline gap-2" aria-hidden>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{k}</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-[var(--text-heading)]">{v}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <a href="#home" className="flex items-center gap-3 text-left">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-muted)] font-mono text-sm font-bold text-[var(--accent)]">
              FX
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-[var(--text-heading)]">SpotRates</div>
              <div className="text-xs text-[var(--text-muted)]">USD · NGN · GBP · EUR</div>
            </div>
          </a>

          <nav className="hidden max-w-xl flex-wrap items-center justify-end gap-1 md:flex lg:max-w-none" aria-label="Primary">
            {SITE_NAV.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface)] hover:text-[var(--text-heading)]"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden items-center gap-2 lg:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  state.status === 'error'
                    ? 'bg-red-500'
                    : state.status === 'ready'
                      ? 'bg-[var(--positive)] shadow-[0_0_12px_color-mix(in_srgb,var(--positive)_55%,transparent)]'
                      : 'bg-[var(--text-muted)]'
                }`}
                aria-hidden
              />
              <span className="max-w-[200px] truncate text-xs text-[var(--text-muted)]">
                {updatedAtLabel ?? '—'}
              </span>
            </div>

            <button
              type="button"
              className="hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--text-heading)] transition hover:border-[var(--accent-border)] hover:bg-[var(--surface-hover)] md:inline-flex"
              onClick={() => void refresh()}
            >
              Refresh
            </button>

            <button
              type="button"
              className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] md:hidden"
              aria-label={navOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              <span className="block h-0.5 w-5 rounded-full bg-[var(--text-heading)]" />
              <span className="block h-0.5 w-5 rounded-full bg-[var(--text-heading)]" />
              <span className="block h-0.5 w-5 rounded-full bg-[var(--text-heading)]" />
            </button>
          </div>
        </div>

        {navOpen ? (
          <div className="border-t border-[var(--border)] bg-[var(--bg-elevated)] md:hidden">
            <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3" aria-label="Mobile">
              {SITE_NAV.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-[var(--text-heading)] hover:bg-[var(--surface)]"
                  onClick={() => setNavOpen(false)}
                >
                  {label}
                </a>
              ))}
              <button
                type="button"
                className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm font-semibold text-[var(--text-heading)]"
                onClick={() => {
                  setNavOpen(false)
                  void refresh()
                }}
              >
                Refresh rates
              </button>
            </nav>
          </div>
        ) : null}
      </header>

      <CbnOfficialBanner />

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 md:px-6 md:pt-12">
          <div id="home" className="scroll-mt-28">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Admin-set rates</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-heading)] md:text-4xl">
                Convert &amp; compare major pairs
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text)]">
                Dollar, pound, and euro vs naira come only from your admin dashboard — no automatic market feeds.
                The page rechecks every 60 seconds after you publish updates.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-heading)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--positive)]" />
                {statusLabel}
              </span>
              {state.status === 'error' ? (
                <span className="text-xs text-red-500">{state.error}</span>
              ) : null}
            </div>
          </div>
          </div>

          <div className="mt-10">
            <VsNairaPanel
              featured={featured}
              loading={state.status === 'loading' || state.status === 'idle'}
              hasError={state.status === 'error'}
              viewerInNigeria={viewerInNigeria}
            />
          </div>

          <div className="mt-10">
            <HomeCurrencyRates
              featured={featured}
              loading={state.status === 'loading' || state.status === 'idle'}
              hasError={state.status === 'error'}
            />
          </div>

          <div id="converter" className="mt-10 scroll-mt-28">
            <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-4 shadow-[var(--shadow-lg)] md:p-8">
              <div className="mb-6 flex flex-col gap-1 border-b border-[var(--border)] pb-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-heading)]">Currency converter</h2>
                  <p className="text-sm text-[var(--text-muted)]">Uses the same live snapshot as the table below.</p>
                  {geoHint ? (
                    <p className="mt-2 text-xs leading-relaxed text-[var(--accent)]">{geoHint}</p>
                  ) : null}
                </div>
                <div className="font-mono text-xs text-[var(--text-muted)]">
                  {updatedAtLabel ? `As of ${updatedAtLabel}` : 'Loading timestamp…'}
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
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="NGN">NGN — Nigerian Naira</option>
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
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="NGN">NGN — Nigerian Naira</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div id="rates" className="mt-10 scroll-mt-28">
            <RatesTable rows={tableRows} loading={!featured && state.status !== 'error'} />
            <p className="mt-4 text-center text-xs text-[var(--text-muted)] md:text-left">
              {state.snapshot ? (
                <>
                  Source:{' '}
                  <span className="text-[var(--text)]">{describeRateSource(state.snapshot)}</span> Crosses stay aligned
                  with the same snapshot — not for trading execution.
                </>
              ) : (
                <>
                  Rates appear after you publish from <span className="font-mono text-[var(--text)]">admin.html</span>.
                </>
              )}
            </p>
          </div>

          <div className="mt-14">
            <MarketNewsFeed featured={featured} />
          </div>

          <div id="services" className="mt-14 scroll-mt-28">
            <h2 className="text-lg font-bold text-[var(--text-heading)]">Services</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text)]">
              Everything on SpotRates is built around clear, comparable mid-market numbers — whether you are budgeting,
              sending money, or teaching FX basics.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  {
                    t: 'Live rate board',
                    d: 'Dollar, pound, and euro vs naira on one screen, refreshed every minute with a full watchlist table.',
                    href: '#vs-naira',
                  },
                  {
                    t: 'Currency converter',
                    d: 'Convert between USD, EUR, GBP, and NGN using the same snapshot as the rest of the page.',
                    href: '#converter',
                  },
                  {
                    t: 'FX assistant',
                    d: 'Quick answers on pairs and refresh timing — open the chat bubble anytime.',
                    href: '#converter',
                  },
                  {
                    t: 'Nigeria FX feed',
                    d: 'Naira-focused context—CBN vs parallel awareness, remittances, SMEs—plus pair watch when mids move vs your last visit.',
                    href: '#news',
                  },
                  {
                    t: 'Geo-smart defaults',
                    d: 'Converter currencies default from your region when possible, without locking you in.',
                    href: '#converter',
                  },
                  {
                    t: 'Transparency',
                    d: 'Source, methodology, and disclaimers spelled out — no hidden spreads on our numbers.',
                    href: '#disclosure',
                  },
                ] as const
              ).map((s) => (
                <a
                  key={s.t}
                  href={s.href}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent-border)] hover:bg-[var(--surface-hover)]"
                >
                  <h3 className="text-sm font-bold text-[var(--text-heading)]">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{s.d}</p>
                  <span className="mt-3 inline-block text-xs font-semibold text-[var(--accent)]">Learn more →</span>
                </a>
              ))}
            </div>
          </div>

          <div id="about-us" className="mt-14 scroll-mt-28">
            <h2 className="text-lg font-bold text-[var(--text-heading)]">About us</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <h3 className="text-sm font-semibold text-[var(--text-heading)]">Who we are</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
                  SpotRates is an FX board for USD, GBP, EUR, and NGN with one pipeline — admin-published rates only —
                  so the hero cards, converter, and watchlist always agree.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <h3 className="text-sm font-semibold text-[var(--text-heading)]">Why it exists</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
                  Published numbers are whatever your team enters in admin — useful for a single source of truth on
                  your desk or branch boards. We are not a broker and do not move money.
                </p>
              </div>
            </div>
          </div>

          <div id="disclosure" className="mt-14 scroll-mt-28">
            <h2 className="text-lg font-bold text-[var(--text-heading)]">Disclosure</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <h3 className="text-sm font-semibold text-[var(--text-heading)]">Methodology</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
                  The admin saves one USD-based snapshot (NGN, GBP, EUR per USD). This site derives crosses (GBP→NGN,
                  EUR→NGN, etc.) so every widget matches.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <h3 className="text-sm font-semibold text-[var(--text-heading)]">Not financial advice</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
                  Banks, cards, and remittance services apply their own spreads and fees. Confirm amounts with your
                  provider before you send money.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <details className="group border-b border-[var(--border)] p-5 last:border-0 open:bg-[var(--surface-hover)]">
                <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--text-heading)] [&::-webkit-details-marker]:hidden">
                  How often do rates update?
                </summary>
                <p className="mt-3 text-sm text-[var(--text)]">
                  The browser refetches published admin rates every 60 seconds, or tap Refresh. Changing rates requires the
                  admin dashboard.
                </p>
              </details>
              <details className="group border-b border-[var(--border)] p-5 last:border-0 open:bg-[var(--surface-hover)]">
                <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--text-heading)] [&::-webkit-details-marker]:hidden">
                  How does the converter choose my default currencies?
                </summary>
                <p className="mt-3 text-sm text-[var(--text)]">
                  Your browser&apos;s language/region suggests an initial pair (for example Nigeria → NGN, UK → GBP,
                  US → USD). When possible, we refine that using your approximate country from your IP address
                  (via ipapi.co). Change either dropdown anytime — that clears the location hint.
                </p>
              </details>
              <details className="group p-5 open:bg-[var(--surface-hover)]">
                <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--text-heading)] [&::-webkit-details-marker]:hidden">
                  Does the chatbot use AI?
                </summary>
                <p className="mt-3 text-sm text-[var(--text)]">
                  It matches common questions and answers from the rates loaded on this page — no external model calls.
                </p>
              </details>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-10">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-muted)] font-mono text-xs font-bold text-[var(--accent)]">
                FX
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-heading)]">SpotRates</div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                  Admin-published USD-based FX board for NGN, USD, GBP, and EUR.
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Site</h3>
              <nav className="mt-3 flex flex-col gap-2 text-sm" aria-label="Footer">
                {SITE_NAV.slice(0, 4).map(([label, href]) => (
                  <a key={href} href={href} className="text-[var(--text)] hover:text-[var(--text-heading)]">
                    {label}
                  </a>
                ))}
              </nav>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Tools</h3>
              <nav className="mt-3 flex flex-col gap-2 text-sm" aria-label="Footer tools">
                {SITE_NAV.slice(4).map(([label, href]) => (
                  <a key={href} href={href} className="text-[var(--text)] hover:text-[var(--text-heading)]">
                    {label}
                  </a>
                ))}
                {FOOTER_TOOLS_EXTRA.map(([label, href]) => (
                  <a key={href} href={href} className="text-[var(--text)] hover:text-[var(--text-heading)]">
                    {label}
                  </a>
                ))}
                <a href="#live-rates" className="text-[var(--text)] hover:text-[var(--text-heading)]">
                  Spot rates grid
                </a>
                <a href="./admin.html" className="text-[var(--text)] hover:text-[var(--text-heading)]">
                  Admin dashboard
                </a>
              </nav>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Location</h3>
              <address className="mt-3 not-italic text-sm leading-relaxed text-[var(--text)]">
                SpotRates (Demo)
                <br />
                12 Admiralty Way, Lekki Phase I
                <br />
                Lagos, Nigeria
              </address>
              <p className="mt-2 text-xs text-[var(--text-muted)]">Office hours: Mon–Fri, 9:00–17:00 WAT (demo)</p>
            </div>
          </div>
          <p className="mt-10 border-t border-[var(--border)] pt-6 text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} SpotRates demo · Not financial advice · Rates are indicative only
          </p>
        </div>
      </footer>

      <Chatbot
        rates={featured}
        ratesSourceLine={state.snapshot ? describeRateSource(state.snapshot) : null}
      />
    </>
  )
}

export default App
