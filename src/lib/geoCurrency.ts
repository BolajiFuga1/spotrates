import type { SupportedFxCode } from './fx'

export type SupportedFx = SupportedFxCode

/** Euro-area & other ISO codes commonly treated as EUR for FX defaults. */
const EUR_COUNTRY_CODES = new Set([
  'AD',
  'AT',
  'BE',
  'HR',
  'CY',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'MC',
  'ME',
  'NL',
  'PT',
  'SM',
  'SK',
  'SI',
  'ES',
  'VA',
])

/** ISO 3166-1 alpha-2 from `navigator.language` / `Accept-Language` style tags (e.g. en-NG → NG). */
export function guessCountryFromLocale(): string | null {
  if (typeof navigator === 'undefined' || typeof Intl === 'undefined' || typeof Intl.Locale === 'undefined') {
    return null
  }
  try {
    const primary = new Intl.Locale(navigator.language).region
    if (primary && /^[A-Z]{2}$/i.test(primary)) return primary.toUpperCase()
  } catch {
    /* ignore */
  }
  const langs = navigator.languages
  if (langs) {
    for (const lang of langs) {
      try {
        const r = new Intl.Locale(lang).region
        if (r && /^[A-Z]{2}$/i.test(r)) return r.toUpperCase()
      } catch {
        /* ignore */
      }
    }
  }
  return null
}

/**
 * Map country → default "You send" / "They get".
 * Only uses currencies this app supports; everyone else keeps USD ↔ NGN.
 */
export function defaultPairForCountry(countryCode: string | null): {
  from: SupportedFx
  to: SupportedFx
} {
  if (!countryCode) return { from: 'USD', to: 'NGN' }
  const c = countryCode.toUpperCase()

  if (c === 'NG') return { from: 'NGN', to: 'USD' }
  if (['GB', 'GG', 'IM', 'JE'].includes(c)) return { from: 'GBP', to: 'USD' }
  if (c === 'US') return { from: 'USD', to: 'NGN' }
  if (EUR_COUNTRY_CODES.has(c)) return { from: 'EUR', to: 'NGN' }

  return { from: 'USD', to: 'NGN' }
}

export function regionDisplayName(countryCode: string | null): string | null {
  if (!countryCode || !/^[A-Z]{2}$/i.test(countryCode)) return null
  try {
    return (
      new Intl.DisplayNames(undefined, { type: 'region' }).of(countryCode.toUpperCase()) ?? null
    )
  } catch {
    return null
  }
}

/** HTTPS geolocation by IP (no API key; respect rate limits in production). */
export async function fetchCountryCodeFromIp(signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', {
      signal,
      headers: { accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { error?: boolean; reason?: string; country_code?: string }
    if (data.error || typeof data.country_code !== 'string') return null
    const code = data.country_code.toUpperCase()
    return /^[A-Z]{2}$/.test(code) ? code : null
  } catch {
    return null
  }
}
