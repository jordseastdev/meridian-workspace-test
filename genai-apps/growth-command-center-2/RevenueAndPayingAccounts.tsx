import { useRows } from "@meridian/app";
import { Stat } from "@meridian/ui";
import { QueryError } from "./components/QueryState";
import { monthLabel } from "./lib";

export function RevenueAndPayingAccounts({ month }: { month: string }) {
  const data = useRows("revenue", { filters: [{ column: "month", values: [month] }], limit: 1 });
  return (
    <section id="revenue" className="section">
      <div className="section-heading">
        <h2>Revenue and paying accounts</h2>
        <span className="muted">{monthLabel(month)} only</span>
      </div>
      {data.error ? <QueryError message={data.error} retry={data.refresh} /> : (
        <>
          <div className="stats-grid">
            <div className="stat-surface"><Stat label="Total MRR" value={data.totals.total_mrr} format="currency" loading={data.loading} size="lg" /></div>
            <div className="stat-surface"><Stat label="Total ARR" value={data.totals.total_arr} format="currency" loading={data.loading} size="lg" /></div>
            <div className="stat-surface"><Stat label="Recurring Revenue Accounts" value={data.totals.paying_accounts} format="number" loading={data.loading} size="lg" /></div>
            <div className="stat-surface"><Stat label="Average Revenue per Account" value={data.totals.arpa} format="currency" loading={data.loading} size="lg" /></div>
          </div>
          {!data.loading && data.total === 0 && <p className="muted">No revenue snapshot for this month. Choose another revenue month.</p>}
        </>
      )}
    </section>
  );
}