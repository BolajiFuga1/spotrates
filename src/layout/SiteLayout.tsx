import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Chatbot } from '../components/Chatbot'
import { useFxRates } from '../lib/useFxRates'
import { useGeoCurrencies } from '../lib/useGeoCurrencies'
import { describeRateSource, formatNumber } from '../lib/fx'
import { FOOTER_SITE_LINKS, FOOTER_TOOLS_LINKS, SITE_NAV } from '../siteNav'

function navClass(isActive: boolean) {
  return [
    'rounded-lg px-2.5 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-[var(--surface)] text-[var(--text-heading)]'
      : 'text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--text-heading)]',
  ].join(' ')
}

export function SiteLayout() {
  const { state, featured, refresh } = useFxRates(60_000)
  const geo = useGeoCurrencies()
  const [navOpen, setNavOpen] = useState(false)

  const statusLabel =
    state.status === 'ready' ? 'Admin rates' : state.status === 'error' ? 'Awaiting admin' : 'Loading'

  const tickerPairs = useMemo(
    () =>
      [
        ['USD/NGN', featured ? formatNumber(featured.usdToNgn, 4) : '…'],
        ['EUR/NGN', featured ? formatNumber(featured.eurToNgn, 4) : '…'],
        ['GBP/NGN', featured ? formatNumber(featured.gbpToNgn, 4) : '…'],
        ['USD/GBP', featured ? formatNumber(featured.usdToGbp, 6) : '…'],
        ['USD/EUR', featured ? formatNumber(featured.usdToEur, 6) : '…'],
        ['Refresh', '60s'],
      ] as const,
    [featured],
  )

  return (
    <>
      <div className="border-b border-[var(--border)] bg-[var(--ticker-bg)]">
        <div className="overflow-hidden">
          <div className="animate-ticker inline-flex items-center gap-8 whitespace-nowrap px-4 py-2.5">
            {tickerPairs.map(([k, v]) => (
              <span key={k} className="inline-flex items-baseline gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">{k}</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-white">{v}</span>
              </span>
            ))}
            <span className="inline-flex w-8 shrink-0" aria-hidden />
            {tickerPairs.map(([k, v]) => (
              <span key={`d-${k}`} className="inline-flex items-baseline gap-2" aria-hidden>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">{k}</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-white">{v}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 md:px-6 md:py-4">
          <Link to="/" className="flex min-w-0 items-center gap-3 text-left" onClick={() => setNavOpen(false)}>
            <img
              src="/elloydsfx-logo.png"
              alt="E-lloydsFX"
              className="h-16 w-auto max-w-[min(380px,62vw)] shrink-0 object-contain object-left md:h-[4.5rem] md:max-w-[min(420px,52vw)] lg:h-[5rem] lg:max-w-[min(460px,45vw)]"
              width={1024}
              height={1024}
            />
            <div className="min-w-0 border-l border-[var(--border)] pl-3">
              <div className="text-base font-bold tracking-tight text-[var(--text-heading)]">E-lloydsFX</div>
            </div>
          </Link>

          <nav className="hidden max-w-xl flex-wrap items-center justify-end gap-1 md:flex lg:max-w-none" aria-label="Primary">
            {SITE_NAV.map(({ label, to }) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => navClass(isActive)}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden items-center lg:flex" title={statusLabel}>
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
              {SITE_NAV.map(({ label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-3 text-sm font-medium hover:bg-[var(--surface)] ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-heading)]'}`
                  }
                  onClick={() => setNavOpen(false)}
                >
                  {label}
                </NavLink>
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

      <main>
        <Outlet context={{ state, featured, refresh, ...geo }} />
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-10">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <img
                src="/elloydsfx-logo.png"
                alt="E-lloydsFX"
                className="h-14 w-auto max-w-[280px] shrink-0 object-contain object-left md:h-16 md:max-w-[320px] lg:h-[4.25rem] lg:max-w-[360px]"
                width={1024}
                height={1024}
              />
              <div className="min-w-0">
                <div className="text-sm font-bold text-[var(--text-heading)]">E-lloydsFX</div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Site</h3>
              <nav className="mt-3 flex flex-col gap-2 text-sm" aria-label="Footer">
                {FOOTER_SITE_LINKS.map(({ label, to }) => (
                  <Link key={to} to={to} className="text-[var(--text)] hover:text-[var(--text-heading)]">
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Tools</h3>
              <nav className="mt-3 flex flex-col gap-2 text-sm" aria-label="Footer tools">
                {FOOTER_TOOLS_LINKS.map(({ label, to }) => (
                  <Link key={to} to={to} className="text-[var(--text)] hover:text-[var(--text-heading)]">
                    {label}
                  </Link>
                ))}
                <a href="./admin.html" className="text-[var(--text)] hover:text-[var(--text-heading)]">
                  Admin dashboard
                </a>
              </nav>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Location</h3>
              <address className="mt-3 not-italic text-sm leading-relaxed text-[var(--text)]">
                E-lloydsFX
                <br />
                Suite 11, Matia Mall Orchid Road, Lekki Phase II
                <br />
                Lagos, Nigeria
              </address>
              <p className="mt-2 text-xs text-[var(--text-muted)]">Office hours: Monday to Friday, 9:00 to 17:00 WAT</p>
            </div>
          </div>
          <p className="mt-10 border-t border-[var(--border)] pt-6 text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} E-lloydsFX. Not financial advice. Rates are indicative only.
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
