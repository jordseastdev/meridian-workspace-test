import { useState } from "react";
import { useRows } from "@meridian/app";
import { DonutChart } from "@meridian/ui";

const limit = 50;
export function Accounts({ search, overview = false }: { search: string; overview?: boolean }) {
  const [status, setStatus] = useState("");
  const [sortColumn, setSortColumn] = useState<"signup_date" | "account_name" | "status">("signup_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const filters = status ? [{ column: "status" as const, values: [status] }] : [];
  const list = useRows("accounts", { search, filters, sort: [{ column: sortColumn, direction: sortDirection }], limit });
  const groups = useRows("accounts", { search, filters, groupBy: "status" });
  const title = overview ? "Account acquisition & retention" : "Account records";

  return <section className={`card ${overview ? "overview-panel" : "content-panel"}`}>
    <div className="section-title"><div><h2>{title}</h2><p>Signup history alongside current account status and ownership.</p></div>
      {!overview && <div className="table-controls"><select aria-label="Filter by account status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option>Active</option><option>Free</option><option>Churned</option></select><select aria-label="Sort accounts by" value={sortColumn} onChange={(e) => setSortColumn(e.target.value as typeof sortColumn)}><option value="signup_date">Signup date</option><option value="account_name">Account name</option><option value="status">Status</option></select><button className="sort-toggle" aria-label={`Sort ${sortDirection === "desc" ? "ascending" : "descending"}`} onClick={() => setSortDirection(sortDirection === "desc" ? "asc" : "desc")}>{sortDirection === "desc" ? "Newest first" : "Oldest first"}</button></div>}
    </div>
    {!overview && <div className="chart-wrap compact-chart"><DonutChart data={groups.rows} label="status" value="count" centerLabel="Accounts" legend="right" loading={groups.loading} /></div>}
    {list.error ? <div className="error-state">Could not load account records. Try again.</div> : list.loading ? <div className="skeleton table-skeleton" aria-label="Loading accounts" /> :
      list.rows.length === 0 ? <div className="empty-state">{search || status ? "No accounts match this search or filter." : "No account records are available."}</div> :
      <><div className="table-scroll"><table><thead><tr><th>Account</th><th>Signup date</th><th>Plan</th><th>Status</th><th>Region</th><th>Owner</th><th>Churn reason</th></tr></thead>
        <tbody>{list.rows.slice(0, overview ? 6 : limit).map((r) => <tr key={r.__row_id}><td className="strong-cell">{r.account_name || "—"}<small>#{r.account_id ?? "—"} · {r.acquisition_source || "—"}</small></td><td>{r.signup_date || "—"}</td><td>{r.current_plan || "—"}</td><td><span className={`pill ${r.status === "Active" ? "good" : r.status === "Churned" ? "bad" : "neutral"}`}>{r.status || "Unknown"}</span></td><td>{r.region || "—"}</td><td>{r.account_owner || "—"}</td><td className="long-cell">{r.churn_reason || "—"}</td></tr>)}</tbody></table></div>
        {!overview && <div className="table-foot">Showing {Math.min(list.rows.length, limit)} of {list.total.toLocaleString()} accounts</div>}</>}
  </section>;
}