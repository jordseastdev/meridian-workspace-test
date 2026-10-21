import { useState } from "react";
import { useRows } from "@meridian/app";
import { BarChart } from "@meridian/ui";

export function Adoption({ search, overview = false }: { search: string; overview?: boolean }) {
  const [adopted, setAdopted] = useState("");
  const [sortColumn, setSortColumn] = useState<"last_used_date" | "feature" | "monthly_active_users">("last_used_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const filters = adopted === "" ? [] : [{ column: "adopted" as const, values: [adopted === "true"] }];
  const list = useRows("feature_adoption", { search, filters, sort: [{ column: sortColumn, direction: sortDirection }], limit: 50 });
  const groups = useRows("feature_adoption", { search, filters, groupBy: "feature" });
  return <section className={`card ${overview ? "overview-panel" : "content-panel"}`}>
    <div className="section-title"><div><h2>{overview ? "Feature adoption" : "Feature adoption records"}</h2><p>Adoption and usage observations by account and feature.</p></div>{!overview && <div className="table-controls"><select aria-label="Filter adoption" value={adopted} onChange={(e) => setAdopted(e.target.value)}><option value="">All adoption states</option><option value="true">Adopted</option><option value="false">Not adopted</option></select><select aria-label="Sort adoption records by" value={sortColumn} onChange={(e) => setSortColumn(e.target.value as typeof sortColumn)}><option value="last_used_date">Last used</option><option value="feature">Feature</option><option value="monthly_active_users">Monthly active users</option></select><button className="sort-toggle" onClick={() => setSortDirection(sortDirection === "desc" ? "asc" : "desc")}>{sortDirection === "desc" ? "Descending" : "Ascending"}</button></div>}</div>
    {!overview && <div className="chart-wrap"><BarChart data={groups.rows} x="feature" y="count" title="Records by feature" legend="none" rounded loading={groups.loading} /></div>}
    {list.error ? <div className="error-state">Could not load feature adoption. Try again.</div> : list.loading ? <div className="skeleton table-skeleton" aria-label="Loading adoption records" /> : list.rows.length === 0 ? <div className="empty-state">{search || adopted ? "No feature records match this search or filter." : "No feature adoption records are available."}</div> :
      <><div className="table-scroll"><table><thead><tr><th>Account ID</th><th>Feature</th><th>Category</th><th>Adopted</th><th>First used</th><th>Last used</th><th>Monthly active users</th></tr></thead><tbody>{list.rows.slice(0, overview ? 5 : 50).map((r) => <tr key={r.__row_id}><td>{r.account_id ?? "—"}</td><td className="strong-cell">{r.feature || "—"}</td><td>{r.feature_category || "—"}</td><td><span className={`pill ${r.adopted ? "good" : "neutral"}`}>{r.adopted ? "Adopted" : "Not adopted"}</span></td><td>{r.first_used_date || "—"}</td><td>{r.last_used_date || "—"}</td><td className="numeric">{r.monthly_active_users ?? "—"}</td></tr>)}</tbody></table></div>{!overview && <div className="table-foot">Showing {Math.min(list.rows.length, 50)} of {list.total.toLocaleString()} feature records</div>}</>}
  </section>;
}