import { useState } from "react";
import { useRows } from "@meridian/app";
import { BarChart } from "@meridian/ui";

export function Revenue({ search, overview = false }: { search: string; overview?: boolean }) {
  const [sortColumn, setSortColumn] = useState<"month" | "movement_type" | "mrr_change">("month");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const movement = useRows("mrr_movements", { search, sort: [{ column: sortColumn, direction: sortDirection }], limit: 50 });
  const grouped = useRows("mrr_movements", { search, groupBy: "movement_type" });
  const monthly = useRows("monthly_mrr", { search, sort: [{ column: "month", direction: "desc" }], limit: 12 });
  return <section className={`card ${overview ? "overview-panel" : "content-panel"}`}>
    <div className="section-title"><div><h2>{overview ? "Recurring revenue movements" : "MRR movements"}</h2><p>Recorded changes in monthly recurring revenue by movement type.</p></div>{!overview && <div className="table-controls"><select aria-label="Sort movements by" value={sortColumn} onChange={(e) => setSortColumn(e.target.value as typeof sortColumn)}><option value="month">Month</option><option value="movement_type">Movement type</option><option value="mrr_change">MRR change</option></select><button className="sort-toggle" onClick={() => setSortDirection(sortDirection === "desc" ? "asc" : "desc")}>{sortDirection === "desc" ? "Descending" : "Ascending"}</button></div>}</div>
    {!overview && <div className="chart-wrap"><BarChart data={grouped.rows} x="movement_type" y="count" title="Movement records by type" legend="none" rounded loading={grouped.loading} /></div>}
    {movement.error || monthly.error ? <div className="error-state">Could not load revenue records. Try again.</div> : movement.loading ? <div className="skeleton table-skeleton" aria-label="Loading revenue records" /> :
      movement.rows.length === 0 ? <div className="empty-state">{search ? "No revenue records match this search." : "No revenue records are available."}</div> :
      <><div className="table-scroll"><table><thead><tr><th>Month</th><th>Account ID</th><th>Movement</th><th>MRR change</th></tr></thead><tbody>
        {movement.rows.slice(0, overview ? 5 : 50).map((r) => <tr key={r.__row_id}><td>{r.month || "—"}</td><td>{r.account_id ?? "—"}</td><td>{r.movement_type || "—"}</td><td className="numeric">{r.mrr_change == null ? "—" : r.mrr_change.toLocaleString(undefined, { style: "currency", currency: "USD" })}</td></tr>)}
      </tbody></table></div>{!overview && <div className="table-foot">Showing {Math.min(movement.rows.length, 50)} of {movement.total.toLocaleString()} movement records</div>}
      <div className="subsection-title"><h3>Latest monthly MRR records</h3><span className="muted">Newest first · up to 12 records</span></div>
      <div className="table-scroll"><table><thead><tr><th>Month</th><th>Account ID</th><th>Plan</th><th>MRR</th><th>ARR</th></tr></thead><tbody>{monthly.rows.slice(0, overview ? 3 : 12).map((r) => <tr key={r.__row_id}><td>{r.month || "—"}</td><td>{r.account_id ?? "—"}</td><td>{r.plan_name || "—"}</td><td className="numeric">{r.mrr == null ? "—" : r.mrr.toLocaleString(undefined, { style: "currency", currency: "USD" })}</td><td className="numeric">{r.arr == null ? "—" : r.arr.toLocaleString(undefined, { style: "currency", currency: "USD" })}</td></tr>)}</tbody></table></div></>}
  </section>;
}