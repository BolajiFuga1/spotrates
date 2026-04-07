import { useEffect, useMemo, useState } from 'react'
import { formatNumber, type FeaturedRates } from '../lib/fx'

const STORAGE_KEY = 'spotrates_prev_featured_v1'

type StoredSnapshot = { usdToNgn: number; gbpToNgn: number; eurToNgn: number }

type Trend = 'up' | 'down' | 'flat'

type FeedItem = {
  id: string
  title: string
  body: string
  tag: string
  when: string
  trend?: Trend
  /** External article or official page — whole card opens this in a new tab. */
  url: string
}

const EDITORIAL: FeedItem[] = [
  {
    id: 'ed-1',
    title: 'Official CBN window vs parallel market: why the spread matters',
    body: 'Many Nigerians still price big-ticket items, school fees, and imports against parallel or street rates, while banks quote closer to the official window. The numbers on SpotRates are indicative mids—always confirm with your bank, BDC, or fintech before you trade.',
    tag: 'Nigeria',
    when: 'Today',
    url: 'https://www.cbn.gov.ng/rates/ExchRateByCurrency.html',
  },
  {
    id: 'ed-2',
    title: 'Lagos & Abuja: dollar liquidity often drives short-term Naira moves',
    body: 'Seasonal demand (school resumption, holidays, election cycles) and oil-revenue flows can tighten or ease USD supply. When USD/NGN shifts on our board, it reflects the data source we use—not every counter in Ikeja or Wuse will match it tick for tick.',
    tag: 'Nigeria',
    when: 'Today',
    url: 'https://www.cbn.gov.ng/monetary-policy/',
  },
  {
    id: 'ed-3',
    title: 'Remittances and diaspora transfers',
    body: 'Nigerians abroad sending home compare card rates, bank SWIFT, and apps. GBP/NGN and EUR/NGN on this page are built from the same snapshot as USD/NGN so your mental math stays consistent when you switch currencies.',
    tag: 'Remittances',
    when: 'This week',
    url: 'https://www.worldbank.org/en/topic/migrationremittancesdiasporaissues/brief/migration-remittances-data',
  },
  {
    id: 'ed-4',
    title: 'SMEs, import invoices, and “dollar scarcity” talk',
    body: 'Small businesses quoting in naira but paying suppliers in dollars feel FX volatility first. Use our converter and table for planning, then lock in your actual rate with your bank or licensed operator—spreads and limits still apply.',
    tag: 'Business',
    when: 'This week',
    url: 'https://www.trade.gov/country-commercial-guides/nigeria-trade-barriers-imports',
  },
  {
    id: 'ed-5',
    title: 'Disclaimer: not a Nigerian bank or BDC',
    body: 'SpotRates is a demo-style rate board for learning and quick estimates. It is not CBN policy, not a licensed bureau de change, and not financial advice. For regulated FX, use CBN-licensed institutions and official channels.',
    tag: 'Education',
    when: 'Ongoing',
    url: 'https://www.cbn.gov.ng/for-everyone/',
  },
]

function pctChange(prev: number, next: number) {
  if (!Number.isFinite(prev) || prev === 0) return null
  return ((next - prev) / prev) * 100
}

function trendFromDelta(pct: number | null): Trend {
  if (pct == null || !Number.isFinite(pct)) return 'flat'
  if (pct > 0.02) return 'up'
  if (pct < -0.02) return 'down'
  return 'flat'
}

export function MarketNewsFeed(props: { featured: FeaturedRates | null }) {
  const [dynamic, setDynamic] = useState<FeedItem[]>([])

  useEffect(() => {
    const f = props.featured
    if (!f) return

    let prev: StoredSnapshot | null = null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as unknown
        if (
          parsed &&
          typeof parsed === 'object' &&
          'usdToNgn' in parsed &&
          'gbpToNgn' in parsed &&
          'eurToNgn' in parsed
        ) {
          prev = parsed as StoredSnapshot
        }
      }
    } catch {
      /* ignore */
    }

    const nextDynamic: FeedItem[] = []

    if (prev && typeof prev.usdToNgn === 'number') {
      const pUsd = pctChange(prev.usdToNgn, f.usdToNgn)
      if (pUsd != null && Math.abs(pUsd) >= 0.005) {
        const tr = trendFromDelta(pUsd)
        nextDynamic.push({
          id: 'dyn-usd-ngn',
          title:
            tr === 'up'
              ? 'Dollar firmer vs naira vs your last check'
              : tr === 'down'
                ? 'Dollar softer vs naira vs your last check'
                : 'USD/NGN little changed since your last check',
          body: `Mid rate is about ${formatNumber(f.usdToNgn, 2)} NGN per $1 (${pUsd >= 0 ? '+' : ''}${pUsd.toFixed(3)}% vs previous snapshot on this device).`,
          tag: 'Pair watch',
          when: 'Just now',
          trend: tr,
          url: 'https://www.cbn.gov.ng/rates/ExchRateByCurrency.html',
        })
      }
    }

    if (prev && typeof prev.eurToNgn === 'number') {
      const pEur = pctChange(prev.eurToNgn, f.eurToNgn)
      if (pEur != null && Math.abs(pEur) >= 0.005) {
        const tr = trendFromDelta(pEur)
        nextDynamic.push({
          id: 'dyn-eur-ngn',
          title:
            tr === 'up' ? 'Euro gained vs naira since your last visit' : tr === 'down' ? 'Euro eased vs naira since your last visit' : 'EUR/NGN stable vs your last visit',
          body: `About ${formatNumber(f.eurToNgn, 2)} NGN per €1 (${pEur >= 0 ? '+' : ''}${pEur.toFixed(3)}%).`,
          tag: 'Pair watch',
          when: 'Just now',
          trend: tr,
          url: 'https://www.cbn.gov.ng/rates/ExchRateByCurrency.html',
        })
      }
    }

    if (prev && typeof prev.gbpToNgn === 'number') {
      const pGbp = pctChange(prev.gbpToNgn, f.gbpToNgn)
      if (pGbp != null && Math.abs(pGbp) >= 0.005) {
        const tr = trendFromDelta(pGbp)
        nextDynamic.push({
          id: 'dyn-gbp-ngn',
          title:
            tr === 'up' ? 'Pound strengthened vs naira on this snapshot' : tr === 'down' ? 'Pound weakened vs naira on this snapshot' : 'GBP/NGN barely moved',
          body: `About ${formatNumber(f.gbpToNgn, 2)} NGN per £1 (${pGbp >= 0 ? '+' : ''}${pGbp.toFixed(3)}%).`,
          tag: 'Pair watch',
          when: 'Just now',
          trend: tr,
          url: 'https://www.cbn.gov.ng/rates/ExchRateByCurrency.html',
        })
      }
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          usdToNgn: f.usdToNgn,
          gbpToNgn: f.gbpToNgn,
          eurToNgn: f.eurToNgn,
        }),
      )
    } catch {
      /* ignore */
    }

    setDynamic(nextDynamic)
  }, [props.featured])

  const items = useMemo(() => [...dynamic, ...EDITORIAL], [dynamic])

  return (
    <div id="news" className="scroll-mt-28">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--accent)]">Nigeria FX feed</h2>
          <p className="mt-1 text-base font-semibold text-[var(--text-heading)] md:text-lg">
            Naira context, remittances & business notes—plus moves vs your last visit
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
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
                  <span className="rounded-full bg-[var(--accent-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
                    {item.tag}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{item.when}</span>
                  {item.trend === 'up' ? (
                    <span className="text-xs font-semibold text-[var(--positive)]">▲</span>
                  ) : null}
                  {item.trend === 'down' ? (
                    <span className="text-xs font-semibold text-red-500">▼</span>
                  ) : null}
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                    Open ↗
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-[var(--text-heading)] md:text-base">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{item.body}</p>
              </a>
            </li>
          ))}
        </ul>
        <p className="border-t border-[var(--border)] px-4 py-3 text-[11px] leading-relaxed text-[var(--text-muted)] md:px-5">
          Tap any row to open the linked site in a new tab. Editorial lines point to official or reference pages; “Pair
          watch” links to CBN published rates for context. Not financial advice.
        </p>
      </div>
    </div>
  )
}
