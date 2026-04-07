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

/** Latest CBN published US DOLLAR (₦ per $1) via our API proxy (avoids browser CORS). */
export async function fetchCbnOfficialUsdNgn(signal?: AbortSignal): Promise<CbnOfficialQuote | null> {
  const base = publicRatesBaseUrl()
  if (base === null) return null
  const url = base ? `${base}/api/public/cbn-official-usd` : '/api/public/cbn-official-usd'
  try {
    const res = await fetch(url, { signal, headers: { accept: 'application/json' } })
    if (!res.ok) return null
    const data = (await res.json()) as CbnApiOk | CbnApiErr
    if (!data || data.ok !== true) return null
    return {
      ratedate: data.ratedate,
      buying: data.buying,
      central: data.central,
      selling: data.selling,
      sourceUrl: data.sourceUrl,
      fetchedAtMs: Date.now(),
    }
  } catch {
    return null
  }
}
