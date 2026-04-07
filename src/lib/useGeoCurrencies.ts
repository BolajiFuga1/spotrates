import { useCallback, useEffect, useRef, useState } from 'react'
import {
  defaultPairForCountry,
  fetchCountryCodeFromIp,
  guessCountryFromLocale,
  regionDisplayName,
  type SupportedFx,
} from './geoCurrency'

export function useGeoCurrencies() {
  const userEditedRef = useRef(false)

  const [countryCode, setCountryCode] = useState<string | null>(() => guessCountryFromLocale())

  const [from, setFrom] = useState<SupportedFx>(
    () => defaultPairForCountry(guessCountryFromLocale()).from,
  )
  const [to, setTo] = useState<SupportedFx>(
    () => defaultPairForCountry(guessCountryFromLocale()).to,
  )
  const [geoHint, setGeoHint] = useState<string | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      const code = await fetchCountryCodeFromIp(ac.signal)
      if (ac.signal.aborted) return
      if (code) setCountryCode(code)
      if (ac.signal.aborted || userEditedRef.current) return
      if (!code) return

      const pair = defaultPairForCountry(code)
      setFrom(pair.from)
      setTo(pair.to)
      const place = regionDisplayName(code)
      setGeoHint(
        place
          ? `Currencies defaulted using your detected location (${place}).`
          : 'Currencies defaulted using your detected location.',
      )
    })()
    return () => ac.abort()
  }, [])

  const setFromUser = useCallback((next: SupportedFx) => {
    userEditedRef.current = true
    setGeoHint(null)
    setFrom(next)
  }, [])

  const setToUser = useCallback((next: SupportedFx) => {
    userEditedRef.current = true
    setGeoHint(null)
    setTo(next)
  }, [])

  const swapCurrencies = useCallback(() => {
    userEditedRef.current = true
    setGeoHint(null)
    setFrom(to)
    setTo(from)
  }, [from, to])

  return { from, to, setFromUser, setToUser, swapCurrencies, geoHint, countryCode }
}
