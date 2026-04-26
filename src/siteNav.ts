export const SITE_NAV = [
  { label: 'Home', to: '/' },
  { label: 'About us', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'News', to: '/news' },
  { label: 'Converter', to: '/converter' },
] as const

export const FOOTER_SITE_LINKS = SITE_NAV.slice(0, 4)

export const FOOTER_TOOLS_LINKS = [
  SITE_NAV[4],
  { label: 'Disclosure', to: '/disclosure' },
  { label: 'FX overview', to: '/' },
] as const

export function routerBasename(): string {
  const b = import.meta.env.BASE_URL || '/'
  if (b === './' || b === '.') return '/'
  return b.replace(/\/$/, '') || '/'
}
