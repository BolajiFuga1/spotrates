import { Link } from 'react-router-dom'
import { ElloydsServices } from '../components/ElloydsServices'

export function ServicesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 md:px-6 md:pt-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Services</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-heading)] md:text-4xl">Our services</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text)]">
        <strong className="text-[var(--text-heading)]">E-lloydsFX</strong> offers the FX and remittance services below. This
        site also publishes indicative rates (USD, GBP, EUR, NGN) for quick reference alongside our desk services.
      </p>
      <div className="mt-10">
        <ElloydsServices />
      </div>
      <div className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">On this website</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              {
                t: 'FX overview',
                d: 'Dollar, pound, and euro vs naira on one screen with admin-published mids.',
                to: '/' as const,
              },
              {
                t: 'Currency converter',
                d: 'Convert between USD, EUR, GBP, and NGN using the same snapshot as the home board.',
                to: '/converter' as const,
              },
              {
                t: 'News',
                d: 'Headlines from trusted sources. Open a row to read the full article in a new tab.',
                to: '/news' as const,
              },
            ] as const
          ).map((s) => (
            <Link
              key={s.t}
              to={s.to}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent-border)] hover:bg-[var(--surface-hover)]"
            >
              <h3 className="text-sm font-bold text-[var(--text-heading)]">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{s.d}</p>
              <span className="mt-3 inline-block text-xs font-semibold text-[var(--accent)]">Open</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
