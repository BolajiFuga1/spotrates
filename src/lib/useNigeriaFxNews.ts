import { useCallback, useEffect, useRef, useState } from 'react'
import { publicRatesBaseUrl } from './manualRatesApi'
import type { NewsApiResponse, NewsItem } from './newsTypes'

const REFRESH_MS = 15 * 60 * 1000

type NewsState = {
  items: NewsItem[]
  loading: boolean
  error: string | null
  stale: boolean
}

export function useNigeriaFxNews(refreshEveryMs = REFRESH_MS) {
  const [state, setState] = useState<NewsState>({
    items: [],
    loading: true,
    error: null,
    stale: false,
  })
  const abortRef = useRef<AbortController | null>(null)

  const refresh = useCallback(async () => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    setState((prev) => ({ ...prev, loading: prev.items.length === 0, error: null }))

    const base = publicRatesBaseUrl() ?? ''
    const url = `${base}/api/public/nigeria-fx-news`

    try {
      const r = await fetch(url, { signal: ac.signal })
      const data = (await r.json()) as NewsApiResponse
      if (!data.ok) throw new Error(data.error || 'Failed to load news')
      setState({
        items: data.items,
        loading: false,
        error: null,
        stale: Boolean(data.stale),
      })
    } catch (e) {
      if (ac.signal.aborted) return
      const msg = e instanceof Error ? e.message : 'Failed to load news'
      setState((prev) => ({
        ...prev,
        loading: false,
        error: prev.items.length ? null : msg,
        stale: prev.items.length > 0 ? prev.stale : false,
      }))
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => void refresh(), 0)
    const id = window.setInterval(() => void refresh(), refreshEveryMs)
    return () => {
      window.clearTimeout(t)
      window.clearInterval(id)
      abortRef.current?.abort()
    }
  }, [refresh, refreshEveryMs])

  return { ...state, refresh }
}
