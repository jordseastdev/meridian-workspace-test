import { useRows } from "@meridian/app";
import { LineChart } from "@meridian/ui";
import { QueryError } from "./components/QueryState";

export function MonthlyRecurringRevenue() {
  const trend = useRows("revenue", {
    groupBy: "month",
    filters: [{ column: "month", min: "2024-10-01", max: "2025-09-01" }],
    sort: [{ column: "month", direction: "desc" }],
    limit: 12,
  });
  const points = [...trend.rows].reverse();
  return (
    <section id="trend" className="section">
      <div className="section-heading">
        <h2>Monthly recurring revenue</h2>
        <span className="muted">October 2024 – September 2025</span>
      </div>
      <div className="card chart-card">
        {trend.error ? <QueryError message={trend.error} retry={trend.refresh} /> : (
          <LineChart data={points} x="month" y="total_mrr" labels={{ total_mrr: "MRR" }} format="currency" height={280} curve="linear" dots grid legend="none" loading={trend.loading} />
        )}
        <p className="chart-note">Monthly snapshots across all accounts. Each point is that month’s total MRR.</p>
      </div>
    </section>
  );
}