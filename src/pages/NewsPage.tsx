import { useEffect } from 'react'
import { MarketNewsFeed } from '../components/MarketNewsFeed'
import { usePageMeta } from '../lib/usePageMeta'

const PAGE_TITLE = 'Forex & BDC News — Nigerian FX Headlines | e-lloyds'
const PAGE_DESCRIPTION =
  'Latest Nigerian foreign exchange, Bureau De Change, CBN policy, naira exchange rate, and currency market news from trusted sources including Reuters, Nairametrics, and BusinessDay.'

export function NewsPage() {
  usePageMeta({ title: PAGE_TITLE, description: PAGE_DESCRIPTION })

  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'news-page-jsonld'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Nigerian Forex & BDC News',
      description: PAGE_DESCRIPTION,
      isPartOf: { '@type': 'WebSite', name: 'e-lloyds' },
    })
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [])

  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 md:px-6 md:pt-12" aria-label="Forex and BDC news">
      <MarketNewsFeed />
    </section>
  )
}
