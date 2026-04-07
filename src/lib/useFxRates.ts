import { useEffect, useMemo, useRef, useState } from 'react'
import { computeFeaturedRates, fetchManualRatesSnapshot, type FxSnapshot } from './fx'

export type FxState =
  | { status: 'idle' | 'loading'; snapshot?: FxSnapshot; error?: undefined }
  | { status: 'ready'; snapshot: FxSnapshot; error?: undefined }
  | { status: 'error'; snapshot?: FxSnapshot; error: string }

export function useFxRates(refreshEveryMs = 60_000) {
  const [state, setState] = useState<FxState>({ status: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  async function refresh() {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    setState((prev) => ({
      status: prev.snapshot ? 'loading' : 'loading',
      snapshot: prev.snapshot,
      error: undefined,
    }))

    try {
      const snapshot = await fetchManualRatesSnapshot(ac.signal)
      setState({ status: 'ready', snapshot })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setState((prev) => ({
        status: 'error',
        snapshot: prev.snapshot,
        error: msg,
      }))
    }
  }

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), refreshEveryMs)
    return () => {
      window.clearInterval(id)
      abortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshEveryMs])

  const featured = useMemo(() => {
    if (!state.snapshot) return null
    try {
      return computeFeaturedRates(state.snapshot)
    } catch {
      return null
    }
  }, [state.snapshot])

  return { state, featured, refresh }
}

