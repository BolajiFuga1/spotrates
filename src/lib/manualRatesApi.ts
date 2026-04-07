import type { FxSnapshot } from './fx'

/** Same base used for `/api/public/*` — local dev is `''` (Vite proxy). */
export function publicRatesBaseUrl(): string | null {
  const env = import.meta.env.VITE_RATES_API_URL
  if (typeof env === 'string' && env.trim()) {
    return env.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    const h = window.location.hostname
    if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.local')) {
      return ''
    }
  }
  return null
}

/**
 * When the admin API has published manual rates, returns a snapshot; otherwise null.
 * Local dev uses same-origin `/api` via Vite proxy; production can set VITE_RATES_API_URL.
 */
export async function fetchManualPublicSnapshot(
  signal?: AbortSignal,
): Promise<FxSnapshot | null> {
  const base = publicRatesBaseUrl()
  if (base === null) return null
  const url = base ? `${base}/api/public/rates` : '/api/public/rates'
  try {
    const res = await fetch(url, { signal, headers: { accept: 'application/json' } })
    if (!res.ok) return null
    const data = (await res.json()) as {
      active?: boolean
      rates?: { NGN?: number; GBP?: number; EUR?: number }
      updatedAtMs?: number
    }
    if (!data.active || !data.rates) return null
    const { NGN, GBP, EUR } = data.rates
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
      fetchedAtMs: typeof data.updatedAtMs === 'number' ? data.updatedAtMs : Date.now(),
      provider: 'admin.manual',
    }
  } catch {
    return null
  }
}
