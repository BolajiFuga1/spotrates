import { useOutletContext } from 'react-router-dom'
import { ServicesHighlightCards } from '../components/ServicesHighlightCards'
import { VsNairaPanel } from '../components/VsNairaPanel'
import type { SiteOutletContext } from '../siteOutletContext'
import heroCheetah from '../assets/hero-cheetah.png'

export function HomePage() {
  const { state, featured, refresh, countryCode } = useOutletContext<SiteOutletContext>()
  const viewerInNigeria = countryCode === 'NG'

  return (
    <>
      <div className="relative">
        <img
          src={heroCheetah}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 z-0 hidden h-full w-auto max-w-[70%] select-none object-contain object-right-bottom md:block"
        />
        <section className="relative mx-auto max-w-6xl px-4 pb-10 pt-8 md:px-6 md:pt-12">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-heading)] md:text-5xl lg:text-6xl">
            Not just transactions,
            <br />
            We manage your FX needs.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text)]">
            Access competitive rates, fast processing, and reliable support, designed to simplify every step of your
            currency exchange.
          </p>
          {state.status === 'error' ? <p className="mt-2 text-xs text-red-500">{state.error}</p> : null}
          <button
            type="button"
            className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-heading)] md:hidden"
            onClick={() => void refresh()}
          >
            Refresh
          </button>
        </div>

        <div className="relative z-10 mt-10" id="live-rates">
          <VsNairaPanel
            featured={featured}
            loading={state.status === 'loading' || state.status === 'idle'}
            hasError={state.status === 'error'}
            viewerInNigeria={viewerInNigeria}
          />
        </div>
        </section>
      </div>
      <ServicesHighlightCards />
    </>
  )
}
