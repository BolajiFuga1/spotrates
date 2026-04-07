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

const CBN_PROXY_PATHS = ['/api/public/cbn-official-usd', '/api/cbn-official-usd'] as const

function joinApiBase(base: string, path: string): string {
  if (!base) return path
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

/** Latest CBN published US DOLLAR (₦ per $1) via our API proxy (avoids browser CORS). */
export async function fetchCbnOfficialUsdNgn(signal?: AbortSignal): Promise<CbnOfficialQuote | null> {
  const apiBase = publicRatesBaseUrl()
  if (apiBase === null) return null

  for (const path of CBN_PROXY_PATHS) {
    const url = joinApiBase(apiBase, path)
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
  return null
}
