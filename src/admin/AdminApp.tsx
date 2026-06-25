import { type FormEvent, useCallback, useEffect, useState } from 'react'

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

function setIfNumber(setter: (v: string) => void, value: number | '') {
  if (value !== '') setter(String(value))
}

export function AdminApp() {
  const [booting, setBooting] = useState(true)
  const [bootError, setBootError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
    setIfNumber(setUsdBuy, r.usdBuy)
    setIfNumber(setUsdSell, r.usdSell)
    setIfNumber(setGbpBuy, r.gbpBuy)
    setIfNumber(setGbpSell, r.gbpSell)
    setIfNumber(setEurBuy, r.eurBuy)
    setIfNumber(setEurSell, r.eurSell)
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
    const pairs = [
      { label: 'US dollar', buy: Number.parseFloat(usdBuy), sell: Number.parseFloat(usdSell) },
      { label: 'British pound', buy: Number.parseFloat(gbpBuy), sell: Number.parseFloat(gbpSell) },
      { label: 'Euro', buy: Number.parseFloat(eurBuy), sell: Number.parseFloat(eurSell) },
    ]
    if (!pairs.every((p) => Number.isFinite(p.buy) && Number.isFinite(p.sell) && p.buy > 0 && p.sell > 0)) {
      setFormError('Enter valid buy and sell naira rates for dollar, pound, and euro (each greater than zero).')
      return
    }
    if (!pairs.every((p) => p.sell > p.buy)) {
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
      await loadRates()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  async function onDeactivate() {
    if (!confirm('Turn off manual rates? The public site will use automatic sources again.')) return
    setBusy(true)
    setFormError(null)
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
      <div className="mx-auto max-w-2xl">
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
            <h1 className="mt-3 text-2xl font-bold text-[var(--text-heading)]">Set buy &amp; sell rates</h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
              Enter <strong className="text-[var(--text)]">buy</strong> and <strong className="text-[var(--text)]">sell</strong>{' '}
              naira rates for each currency. Visitors can toggle between them on the home page. Sell should be higher than
              buy.
            </p>
          </div>
          <a
            href="/"
            className="inline-flex items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-muted)] px-4 py-2 text-sm font-semibold text-[var(--accent)]"
          >
            View site
          </a>
        </header>

        {bootError ? (
          <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <p className="font-semibold">Could not reach the API</p>
            <p className="mt-1 text-amber-200/80">{bootError}</p>
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

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                manualActive
                  ? 'bg-[var(--positive-dim)] text-[var(--positive)]'
                  : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
              }`}
            >
              {manualActive ? 'Published on public site' : 'Automatic sources in use'}
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
                onBuyChange={setUsdBuy}
                onSellChange={setUsdSell}
              />
              <DeskRateCard
                title="British pound"
                code="GBP (£)"
                buy={gbpBuy}
                sell={gbpSell}
                onBuyChange={setGbpBuy}
                onSellChange={setGbpSell}
              />
              <DeskRateCard
                title="Euro"
                code="EUR (€)"
                buy={eurBuy}
                sell={eurSell}
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
                Stop using manual rates
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
  onBuyChange: (v: string) => void
  onSellChange: (v: string) => void
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-[var(--text-heading)]">{props.title}</h2>
        <span className="font-mono text-xs font-semibold text-[var(--accent)]">{props.code}</span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <RateInput label="Buy rate (₦)" value={props.buy} onChange={props.onBuyChange} />
        <RateInput label="Sell rate (₦)" value={props.sell} onChange={props.onSellChange} />
      </div>
    </div>
  )
}

function RateInput(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{props.label}</span>
      <div className="mt-2 flex items-stretch overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] focus-within:border-[var(--accent-border)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20">
        <span className="flex items-center border-r border-[var(--border)] bg-[var(--surface-hover)] px-3 text-sm font-semibold text-[var(--text-muted)]">
          ₦
        </span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 font-mono text-lg tabular-nums text-[var(--text-heading)] outline-none"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        />
      </div>
    </label>
  )
}
