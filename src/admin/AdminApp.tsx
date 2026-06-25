import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

type RatesRes = {
  active: boolean
  usdBuy: number | ''
  usdSell: number | ''
  gbpBuy: number | ''
  gbpSell: number | ''
  eurBuy: number | ''
  eurSell: number | ''
  updatedAtMs: number | null
}

function messageFromApiError(data: unknown, status: number): string {
  if (!data || typeof data !== 'object') {
    return `Request failed (${status})`
  }
  const o = data as { error?: unknown; message?: unknown }
  const raw = o.error ?? o.message
  if (typeof raw === 'string') return raw
  if (raw != null && typeof raw === 'object' && 'message' in raw && typeof (raw as { message: unknown }).message === 'string') {
    return (raw as { message: string }).message
  }
  try {
    return JSON.stringify(raw)
  } catch {
    return `Request failed (${status})`
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...init?.headers,
    },
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) {
    throw new Error(messageFromApiError(data, res.status))
  }
  return data as T
}

function rateToField(value: number | ''): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
}

function parseRate(value: string): number | null {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

function formatMid(buy: string, sell: string): string | null {
  const b = parseRate(buy)
  const s = parseRate(sell)
  if (b == null || s == null) return null
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format((b + s) / 2)
}

export function AdminApp() {
  const [booting, setBooting] = useState(true)
  const [bootError, setBootError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saveOk, setSaveOk] = useState(false)

  const [usdBuy, setUsdBuy] = useState('')
  const [usdSell, setUsdSell] = useState('')
  const [gbpBuy, setGbpBuy] = useState('')
  const [gbpSell, setGbpSell] = useState('')
  const [eurBuy, setEurBuy] = useState('')
  const [eurSell, setEurSell] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [manualActive, setManualActive] = useState(false)

  const loadRates = useCallback(async () => {
    const r = await api<RatesRes>('/api/admin/rates')
    setManualActive(r.active)
    setUsdBuy(rateToField(r.usdBuy))
    setUsdSell(rateToField(r.usdSell))
    setGbpBuy(rateToField(r.gbpBuy))
    setGbpSell(rateToField(r.gbpSell))
    setEurBuy(rateToField(r.eurBuy))
    setEurSell(rateToField(r.eurSell))
    setSavedAt(
      r.updatedAtMs
        ? new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date(r.updatedAtMs))
        : null,
    )
    setBootError(null)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await loadRates()
      } catch (e) {
        if (!cancelled) {
          setBootError(e instanceof Error ? e.message : 'Could not load admin data')
        }
      } finally {
        if (!cancelled) setBooting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadRates])

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSaveOk(false)
    const pairs = [
      { label: 'US dollar', buy: parseRate(usdBuy), sell: parseRate(usdSell) },
      { label: 'British pound', buy: parseRate(gbpBuy), sell: parseRate(gbpSell) },
      { label: 'Euro', buy: parseRate(eurBuy), sell: parseRate(eurSell) },
    ]
    if (pairs.some((p) => p.buy == null || p.sell == null)) {
      setFormError('Enter valid buy and sell naira rates for dollar, pound, and euro.')
      return
    }
    if (pairs.some((p) => p.sell! <= p.buy!)) {
      setFormError('Sell rate must be higher than buy rate for each currency.')
      return
    }
    setBusy(true)
    try {
      await api('/api/admin/rates', {
        method: 'PUT',
        body: JSON.stringify({
          active: true,
          usdBuy: pairs[0].buy,
          usdSell: pairs[0].sell,
          gbpBuy: pairs[1].buy,
          gbpSell: pairs[1].sell,
          eurBuy: pairs[2].buy,
          eurSell: pairs[2].sell,
        }),
      })
      setManualActive(true)
      setSaveOk(true)
      await loadRates()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  async function onDeactivate() {
    if (!confirm('Turn off manual rates? The public site will stop showing your published desk rates.')) return
    setBusy(true)
    setFormError(null)
    setSaveOk(false)
    try {
      await api('/api/admin/rates', {
        method: 'PUT',
        body: JSON.stringify({ active: false }),
      })
      setManualActive(false)
      await loadRates()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <p className="text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] md:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <img
                src="/elloydsfx-logo.png"
                alt="e-lloydsFX"
                className="h-14 w-auto max-w-[300px] object-contain object-left sm:h-16 sm:max-w-[360px]"
                width={1024}
                height={1024}
              />
              <span className="rounded-md border border-[var(--accent-border)] bg-[var(--accent-muted)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                Admin
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-[var(--text-heading)]">Buy &amp; sell desk rates</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
              Set how many <strong className="text-[var(--text)]">naira (₦)</strong> you pay or charge for each unit of
              foreign currency. These values power the <strong className="text-[var(--text)]">Buy rate</strong> /{' '}
              <strong className="text-[var(--text)]">Sell rate</strong> toggle on the public home page.
            </p>
          </div>
          <a
            href="/"
            className="inline-flex shrink-0 items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-muted)] px-4 py-2 text-sm font-semibold text-[var(--accent)]"
          >
            View site
          </a>
        </header>

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm leading-relaxed text-[var(--text)]">
          <p>
            <strong className="text-[var(--text-heading)]">Buy rate</strong> — naira you pay when a customer sells FX to
            you (lower).
          </p>
          <p className="mt-1">
            <strong className="text-[var(--text-heading)]">Sell rate</strong> — naira you charge when a customer buys FX
            from you (higher).
          </p>
        </div>

        {bootError ? (
          <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <p className="font-semibold">Could not reach the API</p>
            <p className="mt-1 text-amber-200/80">{bootError}</p>
            <p className="mt-2 text-xs text-amber-200/70">
              Local: run <span className="font-mono">npm run dev:full</span>. Production: ensure Redis is linked on
              Vercel, then redeploy.
            </p>
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-[var(--accent)] underline"
              onClick={() => {
                setBooting(true)
                void loadRates()
                  .catch((e) => setBootError(e instanceof Error ? e.message : 'Failed'))
                  .finally(() => setBooting(false))
              }}
            >
              Retry
            </button>
          </div>
        ) : null}

        {saveOk ? (
          <div
            className="mt-6 rounded-xl border border-[var(--positive)]/40 bg-[var(--positive-dim)] px-4 py-3 text-sm text-[var(--positive)]"
            role="status"
          >
            Rates published. The home page buy/sell toggle now shows these values.
          </div>
        ) : null}

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                manualActive
                  ? 'bg-[var(--positive-dim)] text-[var(--positive)]'
                  : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
              }`}
            >
              {manualActive ? 'Live on website' : 'Not published yet'}
            </span>
            {savedAt ? <span className="text-xs text-[var(--text-muted)]">Last saved: {savedAt}</span> : null}
          </div>

          <form className="mt-6 space-y-6" onSubmit={onSave}>
            <div className="grid gap-5">
              <DeskRateCard
                title="US Dollar"
                code="USD ($)"
                buy={usdBuy}
                sell={usdSell}
                buyPlaceholder="1380"
                sellPlaceholder="1395"
                onBuyChange={setUsdBuy}
                onSellChange={setUsdSell}
              />
              <DeskRateCard
                title="British pound"
                code="GBP (£)"
                buy={gbpBuy}
                sell={gbpSell}
                buyPlaceholder="1830"
                sellPlaceholder="1850"
                onBuyChange={setGbpBuy}
                onSellChange={setGbpSell}
              />
              <DeskRateCard
                title="Euro"
                code="EUR (€)"
                buy={eurBuy}
                sell={eurSell}
                buyPlaceholder="1575"
                sellPlaceholder="1595"
                onBuyChange={setEurBuy}
                onSellChange={setEurSell}
              />
            </div>
            {formError ? <p className="text-sm text-red-500">{formError}</p> : null}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={busy || Boolean(bootError)}
                className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-muted)] px-6 py-3 text-sm font-bold text-[var(--accent)] disabled:opacity-40"
              >
                {busy ? 'Saving…' : 'Save & publish'}
              </button>
              <button
                type="button"
                disabled={busy || !manualActive || Boolean(bootError)}
                onClick={() => void onDeactivate()}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-3 text-sm font-semibold text-[var(--text-heading)] disabled:opacity-40"
              >
                Unpublish rates
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function DeskRateCard(props: {
  title: string
  code: string
  buy: string
  sell: string
  buyPlaceholder: string
  sellPlaceholder: string
  onBuyChange: (v: string) => void
  onSellChange: (v: string) => void
}) {
  const mid = useMemo(() => formatMid(props.buy, props.sell), [props.buy, props.sell])

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-[var(--text-heading)]">{props.title}</h2>
        <span className="font-mono text-xs font-semibold text-[var(--accent)]">{props.code}</span>
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Naira per 1 {props.code.split(' ')[0]}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <RateInput
          label="Buy rate"
          hint="You pay customer"
          placeholder={props.buyPlaceholder}
          value={props.buy}
          onChange={props.onBuyChange}
        />
        <RateInput
          label="Sell rate"
          hint="Customer pays you"
          placeholder={props.sellPlaceholder}
          value={props.sell}
          onChange={props.onSellChange}
        />
      </div>
      {mid ? (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Mid (converter): <span className="font-mono font-semibold text-[var(--text-heading)]">₦{mid}</span>
        </p>
      ) : null}
    </div>
  )
}

function RateInput(props: {
  label: string
  hint: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{props.label}</span>
      <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">{props.hint}</span>
      <div className="mt-2 flex items-stretch overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] focus-within:border-[var(--accent-border)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20">
        <span className="flex items-center border-r border-[var(--border)] bg-[var(--surface-hover)] px-3 text-sm font-semibold text-[var(--text-muted)]">
          ₦
        </span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          placeholder={props.placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 font-mono text-lg tabular-nums text-[var(--text-heading)] outline-none placeholder:text-[var(--text-muted)]/50"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        />
      </div>
    </label>
  )
}
