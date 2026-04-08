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
          <>
            <span className="mx-2 hidden text-[var(--text-muted)] sm:inline" aria-hidden>
              ·
            </span>
            <span className="ml-2 text-[var(--text-muted)]">
              Live figures load on the full app (with API). On this static site, see the{' '}
              <a
                href={cbnRatesPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
              >
                CBN exchange rates page
              </a>
              .
            </span>
          </>
        ) : loading && !quote ? (
          <span className="ml-2 text-[var(--text-muted)]">Loading…</span>
        ) : quote ? (
          <>
            <span className="mx-2 hidden text-[var(--text-muted)] sm:inline" aria-hidden>
              ·
            </span>
            <span className="mt-1 block sm:mt-0 sm:inline">
              Central rate{' '}
              <span className="font-mono font-semibold tabular-nums text-[var(--accent)]">
                ₦{formatNgn(quote.central)}
              </span>
              <span className="text-[var(--text-muted)]"> per $1</span>
              <span className="mx-1.5 text-[var(--text-muted)]">·</span>
              <span className="text-[var(--text-muted)]">CBN date {quote.ratedate}</span>
            </span>
            <span className="mx-2 hidden text-[var(--text-muted)] md:inline" aria-hidden>
              ·
            </span>
            <a
              href={quote.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block font-medium text-[var(--accent)] underline-offset-2 hover:underline md:mt-0"
            >
              View on CBN
            </a>
          </>
        ) : (
          <span className="ml-2 text-[var(--text-muted)]">{error ?? 'Unavailable'}</span>
        )}
      </p>
    </div>
  )
}
