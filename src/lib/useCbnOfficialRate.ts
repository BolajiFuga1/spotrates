import { useEffect, useState } from 'react'
import { fetchCbnOfficialUsdNgn, type CbnOfficialQuote } from './cbnOfficialRate'
import { publicRatesBaseUrl } from './manualRatesApi'

const DEFAULT_REFRESH_MS = 60 * 60 * 1000

const CBN_RATES_PAGE = 'https://www.cbn.gov.ng/rates/ExchRateByCurrency.html'

export function useCbnOfficialRate(refreshEveryMs = DEFAULT_REFRESH_MS) {
  const [quote, setQuote] = useState<CbnOfficialQuote | undefined>()
  const [error, setError] = useState<string | undefined>()
  /** GitHub/GitLab Pages: no server proxy; CBN blocks browser CORS — show link instead of an error. */
  const [staticPages, setStaticPages] = useState(
    () => typeof window !== 'undefined' && publicRatesBaseUrl() === null,
  )
  const [loading, setLoading] = useState(
    () => typeof window === 'undefined' || publicRatesBaseUrl() !== null,
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (publicRatesBaseUrl() === null) {
        setStaticPages(true)
        setLoading(false)
        setQuote(undefined)
        setError(undefined)
        return
      }
      setStaticPages(false)
      setLoading(true)
      setError(undefined)
      try {
        const q = await fetchCbnOfficialUsdNgn()
        if (cancelled) return
        setQuote(q ?? undefined)
        if (!q) setError('CBN rate unavailable (check API / network).')
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    if (publicRatesBaseUrl() === null) {
      return () => {
        cancelled = true
      }
    }
    const id = window.setInterval(() => void load(), refreshEveryMs)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [refreshEveryMs])

  return { quote, error, loading, staticPages, cbnRatesPageUrl: CBN_RATES_PAGE }
}
