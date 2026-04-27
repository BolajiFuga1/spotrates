export function AboutPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 md:px-6 md:pt-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">About</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-heading)] md:text-4xl">About us</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text)]">
        <strong className="text-[var(--text-heading)]">e-lloyds Bureau de Change Limited</strong> is a CBN-regulated bureau
        de change. The summary below reflects how we work with clients across Nigeria.
      </p>

      <div className="mt-10 space-y-10">
        <div className="scroll-mt-28 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)] md:p-8">
          <h2 className="text-base font-bold text-[var(--text-heading)]">Who we are</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">
            e-lloyds Bureau de Change Limited is a fully licensed foreign exchange services provider, authorized and
            regulated by the Central Bank of Nigeria. Incorporated in 2008 under the Companies and Allied Matters Act, we
            have over a decade of experience delivering trusted and efficient foreign exchange solutions in Nigeria.
          </p>
        </div>

        <div className="scroll-mt-28 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)] md:p-8">
          <h2 className="text-base font-bold text-[var(--text-heading)]">Our commitment</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">
            We are committed to providing accurate, up-to-date market information and competitive exchange rates to
            individuals, businesses, and institutions. Our approach is built on transparency, speed, and reliability so
            our clients can transact with confidence in a constantly evolving financial environment.
          </p>
        </div>

        <div className="scroll-mt-28 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)] md:p-8">
          <h2 className="text-base font-bold text-[var(--text-heading)]">Compliance &amp; professionalism</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">
            At e-lloyds, compliance and professionalism are at the core of everything we do. We adhere strictly to
            regulatory standards while maintaining strong internal controls to safeguard our operations and our
            customers.
          </p>
        </div>

        <div className="scroll-mt-28 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)] md:p-8">
          <h2 className="text-base font-bold text-[var(--text-heading)]">Our goal</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">
            Our goal is simple: to be a dependable partner for foreign exchange services, delivering value through
            integrity, consistency, and excellent customer service.
          </p>
        </div>
      </div>
    </section>
  )
}
