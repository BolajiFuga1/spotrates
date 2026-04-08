import { type FormEvent, useCallback, useEffect, useState } from 'react'

type RatesRes = {
  active: boolean
  ngnPerUsd: number | ''
  ngnPerGbp: number | ''
  ngnPerEur: number | ''
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

export function AdminApp() {
  const [booting, setBooting] = useState(true)
  const [bootError, setBootError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [ngnUsd, setNgnUsd] = useState('')
  const [ngnGbp, setNgnGbp] = useState('')
  const [ngnEur, setNgnEur] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [manualActive, setManualActive] = useState(false)

  const loadRates = useCallback(async () => {
    const r = await api<RatesRes>('/api/admin/rates')
    setManualActive(r.active)
    if (r.ngnPerUsd !== '') setNgnUsd(String(r.ngnPerUsd))
    if (r.ngnPerGbp !== '') setNgnGbp(String(r.ngnPerGbp))
    if (r.ngnPerEur !== '') setNgnEur(String(r.ngnPerEur))
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
    const u = Number.parseFloat(ngnUsd)
    const g = Number.parseFloat(ngnGbp)
    const eur = Number.parseFloat(ngnEur)
    if (![u, g, eur].every((n) => Number.isFinite(n) && n > 0)) {
      setFormError('Enter a valid naira amount for dollar, pound, and euro (each must be greater than zero).')
      return
    }
    setBusy(true)
    try {
      await api('/api/admin/rates', {
        method: 'PUT',
        body: JSON.stringify({
          active: true,
          ngnPerUsd: u,
          ngnPerGbp: g,
          ngnPerEur: eur,
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
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Admin</div>
            <h1 className="mt-1 text-2xl font-bold text-[var(--text-heading)]">Set rates manually</h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
              Type how many <strong className="text-[var(--text)]">naira (₦)</strong> equal{' '}
              <strong className="text-[var(--text)]">one US dollar</strong>, <strong className="text-[var(--text)]">one British pound</strong>, and{' '}
              <strong className="text-[var(--text)]">one euro</strong>. Click <em>Save &amp; publish</em> to push them to the public
              site. No password for now.
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
            <p className="mt-2 text-xs text-amber-200/70">
              Local: run <span className="font-mono">npm run dev:full</span> so Vite proxies <span className="font-mono">/api</span>.
              Vercel: connect <strong>Redis (Upstash)</strong> under Storage and redeploy. Saving rates returns 503 until Redis is
              linked. If you see “Unauthorized”, turn off <span className="font-mono">SPOTRATES_ADMIN_AUTH</span> or log in via
              the API.
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
            <div className="grid gap-5 md:grid-cols-1">
              <ManualRateCard
                title="US Dollar"
                code="USD · $"
                description="How many naira for one US dollar"
                placeholder="e.g. 1430"
                value={ngnUsd}
                onChange={setNgnUsd}
              />
              <ManualRateCard
                title="British pound"
                code="GBP · £"
                description="How many naira for one pound sterling"
                placeholder="e.g. 1820"
                value={ngnGbp}
                onChange={setNgnGbp}
              />
              <ManualRateCard
                title="Euro"
                code="EUR · €"
                description="How many naira for one euro"
                placeholder="e.g. 1560"
                value={ngnEur}
                onChange={setNgnEur}
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

        <p className="mt-8 text-xs leading-relaxed text-[var(--text-muted)]">
          To require a password again later, set <span className="font-mono">SPOTRATES_ADMIN_AUTH=1</span> and{' '}
          <span className="font-mono">ADMIN_PASSWORD</span> on the API (see <span className="font-mono">.env.example</span>
          ).
        </p>
      </div>
    </div>
  )
}

function ManualRateCard(props: {
  title: string
  code: string
  description: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-[var(--text-heading)]">{props.title}</h2>
        <span className="font-mono text-xs font-semibold text-[var(--accent)]">{props.code}</span>
      </div>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{props.description}</p>
      <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Rate in naira
      </label>
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
          className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 font-mono text-lg tabular-nums text-[var(--text-heading)] outline-none"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
