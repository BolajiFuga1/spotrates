import { Link } from 'react-router-dom'

function IconBanknote(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className} aria-hidden>
      <path
        d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M8 12h8M10 9v6M14 9v6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function IconCash(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className} aria-hidden>
      <path
        d="M12 4v2M12 18v2M6 12H4M20 12h-2M7.05 7.05 5.64 5.64M18.36 18.36l-1.41-1.41M7.05 16.95l-1.41 1.41M18.36 5.64l-1.41 1.41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function IconCard(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className} aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.75" />
      <path d="M7 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconDelivery(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className} aria-hidden>
      <path
        d="M1 13h10v7H1v-7Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M11 17h2.5l3.5-4.5V9h3l2.5 2.5V17H11"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="20" r="1.75" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="20" r="1.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

const HIGHLIGHTS = [
  {
    id: 'service-forex-cash',
    title: 'Cash purchase sales forex',
    Icon: IconBanknote,
  },
  {
    id: 'service-pta-bta',
    title: 'PTA & BTA',
    Icon: IconCash,
  },
  {
    id: 'service-fx-payments',
    title: 'Credit card payments',
    Icon: IconCard,
  },
  {
    id: 'service-cash-delivery',
    title: 'Cash delivery',
    Icon: IconDelivery,
  },
] as const

export function ServicesHighlightCards() {
  return (
    <section className="bg-[var(--brand-orange)] text-white" aria-labelledby="services-highlight-heading">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="text-center">
          <h2 id="services-highlight-heading" className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Our Services
          </h2>
        </div>

        <ul className="mt-10 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {HIGHLIGHTS.map(({ id, title, Icon }) => (
            <li key={id}>
              <article className="flex h-full flex-col items-center rounded-xl border border-white/25 bg-white/[0.07] px-6 py-8 text-center shadow-sm backdrop-blur-sm transition hover:border-white/40 hover:bg-white/[0.12] md:px-7 md:py-9">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/25 text-white ring-1 ring-white/15">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-base font-bold leading-snug text-white md:text-lg">{title}</h3>
                <Link
                  to={`/services#${id}`}
                  className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-white/90 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Learn more
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
