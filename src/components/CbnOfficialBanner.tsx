import { useCbnOfficialRate } from '../lib/useCbnOfficialRate'

function formatNgn(n: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n)
}

export function CbnOfficialBanner() {
  const { quote, error, loading, staticPages, cbnRatesPageUrl } = useCbnOfficialRate()

  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-center md:px-6">
      <p className="text-xs leading-relaxed text-[var(--text)] md:text-sm">
        <span className="font-semibold text-[var(--text-heading)]">CBN official US dollar</span>
        {staticPages ? (
          <span className="mt-1 block text-[var(--text-muted)] sm:mt-0 sm:inline sm:ml-2">
            On this static site, open the{' '}
            <a
              href={cbnRatesPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            >
              CBN exchange rates page
            </a>{' '}
            for live numbers.
          </span>
        ) : loading && !quote ? (
          <span className="ml-2 text-[var(--text-muted)]">Loading…</span>
        ) : quote ? (
          <span className="mt-1 block text-[var(--text-muted)] sm:mt-0 sm:inline sm:ml-2">
            Central rate{' '}
            <span className="font-mono font-semibold tabular-nums text-[var(--accent)]">₦{formatNgn(quote.central)}</span>
            <span> per $1</span>
            <span>, CBN date {quote.ratedate}. </span>
            <a
              href={quote.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block font-medium text-[var(--accent)] underline-offset-2 hover:underline sm:mt-0"
            >
              View on CBN
            </a>
          </span>
        ) : (
          <span className="ml-2 text-[var(--text-muted)]">{error ?? 'Unavailable'}</span>
        )}
      </p>
    </div>
  )
}
