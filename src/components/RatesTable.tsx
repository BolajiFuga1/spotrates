import { formatNumber } from '../lib/fx'

export type RateRow = { pair: string; code: string; rate: number; note: string }

export function RatesTable(props: { rows: RateRow[]; loading: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3 md:px-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">Live watchlist</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Mid rates from USD base snapshot</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)] text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <th className="px-4 py-3 md:px-5">Pair</th>
              <th className="px-4 py-3 md:px-5">Code</th>
              <th className="px-4 py-3 text-right md:px-5">Mid rate</th>
              <th className="hidden px-4 py-3 md:table-cell md:px-5">Description</th>
            </tr>
          </thead>
          <tbody>
            {props.loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-4 md:px-5" colSpan={4}>
                      <div className="h-4 w-40 animate-pulse rounded bg-[var(--border)]" />
                    </td>
                  </tr>
                ))
              : props.rows.length === 0
                ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-[var(--text-muted)] md:px-5" colSpan={4}>
                        No rate data available. Try refreshing.
                      </td>
                    </tr>
                  )
                : props.rows.map((row) => (
                  <tr
                    key={row.code}
                    className="border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--surface-hover)]"
                  >
                    <td className="px-4 py-3.5 font-semibold text-[var(--text-heading)] md:px-5">{row.pair}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--text-muted)] md:px-5">{row.code}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-base font-semibold text-[var(--text-heading)] md:px-5">
                      {formatNumber(row.rate, 6)}
                    </td>
                    <td className="hidden max-w-xs px-4 py-3.5 text-[var(--text)] md:table-cell md:px-5">{row.note}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
