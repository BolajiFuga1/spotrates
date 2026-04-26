export function DisclosurePage() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 md:px-6 md:pt-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Legal</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-heading)] md:text-4xl">Disclosure</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-semibold text-[var(--text-heading)]">Methodology</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
            The admin saves one USD based snapshot (NGN, GBP, and EUR per USD). This site derives crosses such as GBP to
            NGN and EUR to NGN so every widget matches.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-semibold text-[var(--text-heading)]">Not financial advice</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
            Banks, cards, and remittance services apply their own spreads and fees. Confirm amounts with your provider
            before you send money.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <details className="group border-b border-[var(--border)] p-5 last:border-0 open:bg-[var(--surface-hover)]">
          <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--text-heading)] [&::-webkit-details-marker]:hidden">
            How often do rates update?
          </summary>
          <p className="mt-3 text-sm text-[var(--text)]">
            The browser refetches published admin rates every 60 seconds, or tap Refresh. Changing rates requires the admin
            dashboard.
          </p>
        </details>
        <details className="group border-b border-[var(--border)] p-5 last:border-0 open:bg-[var(--surface-hover)]">
          <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--text-heading)] [&::-webkit-details-marker]:hidden">
            How does the converter choose my default currencies?
          </summary>
          <p className="mt-3 text-sm text-[var(--text)]">
            Your browser language and region suggest a starting pair (for example Nigeria and NGN, UK and GBP, US and
            USD). When we can, we refine that from your approximate country via your IP address (ipapi.co). Change either
            dropdown whenever you like; that clears the location hint.
          </p>
        </details>
        <details className="group p-5 open:bg-[var(--surface-hover)]">
          <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--text-heading)] [&::-webkit-details-marker]:hidden">
            Does the chatbot use AI?
          </summary>
          <p className="mt-3 text-sm text-[var(--text)]">
            It matches common questions to short answers from the rates and text on this page. Nothing is sent to an
            external AI service.
          </p>
        </details>
      </div>
    </section>
  )
}
