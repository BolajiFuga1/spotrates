import { publicRatesBaseUrl } from './manualRatesApi'

export type CbnOfficialQuote = {
  ratedate: string
  buying: number
  central: number
  selling: number
  sourceUrl: string
  fetchedAtMs: number
}

type CbnApiOk = {
  ok: true
  ratedate: string
  buying: number
  central: number
  selling: number
  sourceUrl: string
}

type CbnApiErr = { ok: false; error?: string }

/** Prefer flat path first — Vercel reliably maps `api/cbn-official-usd.js`; nested `api/public/` can be slower to cold-start. */
const CBN_PROXY_PATHS = ['/api/cbn-official-usd', '/api/public/cbn-official-usd'] as const

function joinApiBase(base: string, path: string): string {
  if (!base) return path
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

function cbnFetchBaseCandidates(): string[] {
  if (typeof window === 'undefined') return []
  if (publicRatesBaseUrl() === null) return []

  const out: string[] = []
  const seen = new Set<string>()

  function push(base: string) {
    const b = base.replace(/\/$/, '')
    if (seen.has(b)) return
    seen.add(b)
    out.push(b)
  }

  // Same origin first: Vercel / Netlify serverless and full-stack hosts serve CBN here even when
  // VITE_RATES_API_URL points manual rates at another server (common misconfiguration).
  push('')

  const configured = publicRatesBaseUrl()
  if (configured !== null && configured !== '') {
    push(configured)
  }

  return out
}

/** Latest CBN published US DOLLAR (₦ per $1) via our API proxy (avoids browser CORS). */
export async function fetchCbnOfficialUsdNgn(signal?: AbortSignal): Promise<CbnOfficialQuote | null> {
  for (const base of cbnFetchBaseCandidates()) {
    for (const path of CBN_PROXY_PATHS) {
      const url = joinApiBase(base, path)
      try {
        const res = await fetch(url, { signal, headers: { accept: 'application/json' } })
        if (!res.ok) continue
        const data = (await res.json()) as CbnApiOk | CbnApiErr
        if (!data || data.ok !== true) continue
        return {
          ratedate: data.ratedate,
          buying: data.buying,
          central: data.central,
          selling: data.selling,
          sourceUrl: data.sourceUrl,
          fetchedAtMs: Date.now(),
        }
      } catch {
        continue
      }
    }
  }
  return null
}
