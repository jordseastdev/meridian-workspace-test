import { useRows } from "@meridian/app";
import { BarChart, Stat } from "@meridian/ui";
import { QueryError } from "./components/QueryState";
import { monthLabel } from "./lib";

export function WhatDrivesGrowth({ month }: { month: string }) {
  const drivers = useRows("movements", {
    filters: [{ column: "month", values: [month] }],
    groupBy: "type",
    sort: [{ column: "net", direction: "desc" }],
    limit: 100,
  });
  const totals = useRows("movements", { filters: [{ column: "month", values: [month] }], limit: 1 });
  const positive = drivers.rows.map(row => ({ ...row, gain: row.net != null && row.net >= 0 ? row.net : null, loss: row.net != null && row.net < 0 ? row.net : null }));

  return (
    <section id="drivers" className="section">
      <div className="section-heading">
        <h2>What drives growth</h2>
        <span className="muted">{monthLabel(month)} · MRR change</span>
      </div>
      <div className="drivers-layout card">
        <div className="drivers-chart">
          {drivers.error ? <QueryError message={drivers.error} retry={drivers.refresh} /> : (
            <BarChart data={positive} x="type" y={["gain", "loss"]} labels={{ gain: "Added MRR", loss: "Lost MRR" }} colors={["#197466", "#b34d43"]} horizontal stacked format="currency" height={290} legend="none" grid rounded loading={drivers.loading} />
          )}
        </div>
        <div className="drivers-summary">
          {totals.error ? <QueryError message={totals.error} retry={totals.refresh} /> : (
            <Stat label="Net MRR change" value={totals.totals.net} format="currency" loading={totals.loading} size="lg" />
          )}
          <p>New business adds revenue. Expansion and upgrades grow existing accounts; contraction, downgrades, and churn reduce it.</p>
          <div className="legend"><span className="legend-dot gain" /> Added MRR <span className="legend-dot loss" /> Lost MRR</div>
          <span className="muted">Losses retain their source sign.</span>
        </div>
      </div>
    </section>
  );
}