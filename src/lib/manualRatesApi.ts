import type { FxSnapshot } from './fx'

/**
 * Base URL for `/api/public/*` (CBN proxy, published rates).
 * - `''` = same origin (local Vite proxy, Render/Fly/custom Node serving the app + API).
 * - `https://…` = `VITE_RATES_API_URL` when the API is on another host.
 * - `null` = static host only (e.g. *.github.io) — no `/api` on this origin; use `rates.json` for board rates.
 */
export function publicRatesBaseUrl(): string | null {
  const env = import.meta.env.VITE_RATES_API_URL
  if (typeof env === 'string' && env.trim()) {
    return env.replace(/\/$/, '')
  }
  if (typeof window === 'undefined') return null
  const h = window.location.hostname
  if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.local')) {
    return ''
  }
  if (h.endsWith('.github.io') || h.endsWith('.gitlab.io')) {
    return null
  }
  return ''
}

function parsePublicRatesPayload(data: unknown): FxSnapshot | null {
  if (!data || typeof data !== 'object') return null
  const o = data as {
    active?: boolean
    rates?: { NGN?: number; GBP?: number; EUR?: number }
    updatedAtMs?: number
  }
  if (!o.active || !o.rates) return null
  const { NGN, GBP, EUR } = o.rates
  if (
    typeof NGN !== 'number' ||
    typeof GBP !== 'number' ||
    typeof EUR !== 'number' ||
    !Number.isFinite(NGN) ||
    !Number.isFinite(GBP) ||
    !Number.isFinite(EUR)
  ) {
    return null
  }
  return {
    base: 'USD',
    rates: { NGN, GBP, EUR },
    fetchedAtMs: typeof o.updatedAtMs === 'number' ? o.updatedAtMs : Date.now(),
    provider: 'admin.manual',
  }
}

/** Same folder as the built site (e.g. GitHub Pages): `public/rates.json` → `/spotrates/rates.json`. */
function staticRatesJsonUrl(): string {
  const b = import.meta.env.BASE_URL || '/'
  return b.endsWith('/') ? `${b}rates.json` : `${b}/rates.json`
}

/**
 * When the admin API has published manual rates, returns a snapshot; otherwise null.
 * Local dev uses same-origin `/api` via Vite proxy; production can set VITE_RATES_API_URL.
 * On static hosts (GitHub Pages), falls back to `rates.json` next to the built `index.html`.
 */
export async function fetchManualPublicSnapshot(
  signal?: AbortSignal,
): Promise<FxSnapshot | null> {
  const apiBase = publicRatesBaseUrl()
  if (apiBase !== null) {
    const url = apiBase ? `${apiBase}/api/public/rates` : '/api/public/rates'
    try {
      const res = await fetch(url, { signal, headers: { accept: 'application/json' } })
      if (res.ok) {
        const data = (await res.json()) as unknown
        const parsed = parsePublicRatesPayload(data)
        if (parsed) return parsed
      }
    } catch {
      /* try static file below */
    }
  }

  try {
    const res = await fetch(staticRatesJsonUrl(), {
      signal,
      headers: { accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as unknown
    return parsePublicRatesPayload(data)
  } catch {
    return null
  }
}
