import { useState } from "react";
import { useRows } from "@meridian/app";
import { DonutChart } from "@meridian/ui";

export function Billing({ search, overview = false }: { search: string; overview?: boolean }) {
  const [status, setStatus] = useState("");
  const filters = status ? [{ column: "status" as const, values: [status] }] : [];
  const list = useRows("invoices", { search, filters, sort: [{ column: "invoice_date", direction: "desc" }], limit: 50 });
  const groups = useRows("invoices", { search, filters, groupBy: "status" });
  return <section className={`card ${overview ? "overview-panel" : "content-panel"}`}>
    <div className="section-title"><div><h2>{overview ? "Invoice collection" : "Invoice records"}</h2><p>Invoice status, due dates, payment method, and recorded collection.</p></div>{!overview && <select aria-label="Filter invoice status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option>Paid</option><option>Paid Late</option><option>Written Off</option></select>}</div>
    {!overview && <div className="chart-wrap compact-chart"><DonutChart data={groups.rows} label="status" value="count" centerLabel="Invoices" legend="right" loading={groups.loading} /></div>}
    {list.error ? <div className="error-state">Could not load invoice records. Try again.</div> : list.loading ? <div className="skeleton table-skeleton" aria-label="Loading invoice records" /> : list.rows.length === 0 ? <div className="empty-state">{search || status ? "No invoices match this search or filter." : "No invoice records are available."}</div> :
      <><div className="table-scroll"><table><thead><tr><th>Invoice</th><th>Account</th><th>Invoice date</th><th>Due date</th><th>Plan</th><th>Payment</th><th>Total</th><th>Paid date</th><th>Status</th></tr></thead><tbody>{list.rows.slice(0, overview ? 5 : 50).map((r) => <tr key={r.__row_id}><td className="strong-cell">{r.invoice_id || "—"}</td><td>{r.account_id ?? "—"}</td><td>{r.invoice_date || "—"}</td><td>{r.due_date || "—"}</td><td>{r.plan_name || "—"}</td><td>{r.payment_method || "—"}</td><td className="numeric">{r.invoice_total == null ? "—" : r.invoice_total.toLocaleString(undefined, { style: "currency", currency: "USD" })}</td><td>{r.paid_date || "—"}</td><td><span className={`pill ${r.status === "Paid" ? "good" : r.status === "Written Off" ? "bad" : "neutral"}`}>{r.status || "Unknown"}</span></td></tr>)}</tbody></table></div>{!overview && <div className="table-foot">Showing {Math.min(list.rows.length, 50)} of {list.total.toLocaleString()} invoices</div>}</>}
  </section>;
}