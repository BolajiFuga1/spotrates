import { useEffect, useState } from 'react'
import { fetchCbnOfficialUsdNgn, type CbnOfficialQuote } from './cbnOfficialRate'

const DEFAULT_REFRESH_MS = 60 * 60 * 1000

export function useCbnOfficialRate(refreshEveryMs = DEFAULT_REFRESH_MS) {
  const [quote, setQuote] = useState<CbnOfficialQuote | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
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
    const id = window.setInterval(() => void load(), refreshEveryMs)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [refreshEveryMs])

  return { quote, error, loading }
}
