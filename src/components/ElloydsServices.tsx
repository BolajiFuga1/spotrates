/** E-lloydsFX services copy for the public Services section. */
export function ElloydsServices() {
  return (
    <div className="mt-8 space-y-10">
      <div
        id="service-forex-cash"
        className="scroll-mt-28 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)] md:p-8"
      >
        <h3 className="text-base font-bold text-[var(--text-heading)]">Cash purchase &amp; sales (forex)</h3>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">
          Call us at <strong className="text-[var(--text-heading)]">E-lloydsFX</strong> for your cash purchase and sales of
          forex to discuss and agree on rates for immediate payment.
        </p>
      </div>

      <div
        id="service-pta-bta"
        className="scroll-mt-28 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)] md:p-8"
      >
        <h3 className="text-base font-bold text-[var(--text-heading)]">Sale of personal / business travel allowance</h3>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">
          E-lloydsFX is authorized by the <strong className="text-[var(--text-heading)]">Central Bank of Nigeria</strong> as
          a BDC for the sale of <strong className="text-[var(--text-heading)]">Business Travel Allowance (BTA)</strong> and{' '}
          <strong className="text-[var(--text-heading)]">Personal Travel Allowance (PTA)</strong>. All intending travelers
          can purchase foreign currency from us up to a quarterly limit of{' '}
          <strong className="text-[var(--text-heading)]">$5,000</strong> (BTA) and{' '}
          <strong className="text-[var(--text-heading)]">$4,000</strong> (PTA) respectively, or its equivalent in GBP and EUR.
        </p>
        <p className="mt-4 text-sm font-semibold text-[var(--text-heading)]">Kindly note:</p>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--text)]">
          <li>
            Customers cannot purchase both PTA and BTA on the same trip, but may purchase both within the same quarter.
          </li>
          <li>
            Customers can only purchase PTA for members of their immediate (nuclear) family: husband/wife and a maximum of
            two (2) children over 12 years old.
          </li>
          <li>
            Customers traveling to West African countries and places that do not require a visa will not be allowed to
            purchase BTA/PTA.
          </li>
        </ul>
      </div>

      <div
        id="service-fx-payments"
        className="scroll-mt-28 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)] md:p-8"
      >
        <h3 className="text-base font-bold text-[var(--text-heading)]">Foreign exchange payment services</h3>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">
          At E-lloydsFX, we also arrange foreign exchange payment services for:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--text)]">
          <li>Business and personal travel allowances</li>
          <li>Mortgage payment</li>
          <li>School fees</li>
          <li>Medical fees</li>
          <li>Credit card bills</li>
          <li>Utility bills</li>
          <li>Hospital bills</li>
          <li>Rent bills</li>
          <li>Subscriptions</li>
          <li>Professional fees</li>
          <li>Life insurance premiums</li>
        </ul>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div
          id="service-cash-delivery"
          className="scroll-mt-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        >
          <h3 className="text-sm font-bold text-[var(--text-heading)]">Deliveries</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
            E-lloydsFX provides delivery services for customers who purchase larger amounts of currency. For smaller
            amounts, we may request a small delivery charge. Clients use this to avoid traffic gridlock.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="text-sm font-bold text-[var(--text-heading)]">Bank deposits</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
            We help customers deposit forex bought into banks, often to pay for foreign goods or services, with funds paid
            straight to their forex accounts at a local bank so they can complete transactions faster.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="text-sm font-bold text-[var(--text-heading)]">Multiple banks</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
            E-lloydsFX maintains accounts at all major banks in the country, making it easy for customers to transact with
            us.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-muted)] p-6 md:p-8">
        <h3 className="text-base font-bold text-[var(--text-heading)]">Cashless service</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
          E-lloydsFX does not require customers to pay cash for forex. Customers can wire funds or deposit in our accounts as
          they prefer.
        </p>
      </div>
    </div>
  )
}
