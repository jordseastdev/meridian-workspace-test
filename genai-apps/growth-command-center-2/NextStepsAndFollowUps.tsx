import { useEffect, useState } from "react";
import { useRows, updateRow, type Row, type Filter } from "@meridian/app";
import { Check, ArrowUpRight } from "lucide-react";
import { Empty, Loading, QueryError } from "./components/QueryState";
import { dateLabel, errorMessage, followupFilters, numberLabel } from "./lib";

function FollowupItem({ row, account, accountLoading, accountError, onSelect }: {
  row: Row<"followups">;
  account?: Row<"accounts">;
  accountLoading: boolean;
  accountError?: string;
  onSelect: (id: number) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (feedback === "Saved") {
      const timer = setTimeout(() => setFeedback(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);
  async function toggle() {
    setSaving(true);
    setFeedback("");
    setFailed(false);
    try {
      await updateRow("followups", row, { work_status: row.work_status === "Done" ? "Not started" : "Done" });
      setFeedback("Saved");
    } catch (error) {
      setFailed(true);
      setFeedback(`Could not update status. ${errorMessage(error)} Try again.`);
    } finally {
      setSaving(false);
    }
  }
  return (
    <article className={`followup-item ${row.work_status === "Done" ? "is-done" : ""}`}>
      <div className="followup-main">
        <button className="account-name-button" disabled={row.account_id == null} onClick={() => row.account_id !== null && onSelect(row.account_id)}>
          {account?.name || (accountLoading ? "Loading account…" : `Account ${row.account_id ?? "not set"}`)}<ArrowUpRight size={15} />
        </button>
        {accountError && <span className="error-text">Account name could not load. Open account detail to retry.</span>}
        <p className="next-step-text">{row.next_step || "No next step written. Open the account to add one."}</p>
        <div className="followup-meta"><span className={`pill ${row.priority === "High" ? "pill-priority" : ""}`}>{row.priority ? `${row.priority} priority` : "Priority not set"}</span><span>{row.work_status || "Not started"}</span><span>Follow-up: {dateLabel(row.follow_up_date)}</span></div>
      </div>
      <div className="followup-action">
        <button className="btn" disabled={saving} onClick={toggle} aria-pressed={row.work_status === "Done"}><Check size={16} />{saving ? "Saving…" : row.work_status === "Done" ? "Reopen next step" : "Mark Done"}</button>
        <span role={failed ? "alert" : "status"} className={failed ? "error-text" : "success-text"}>{feedback}</span>
      </div>
    </article>
  );
}

export function NextStepsAndFollowUps({ onSelect }: { onSelect: (id: number) => void }) {
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const filters: Filter<"followups">[] = followupFilters(priority, status);
  if (from || until) filters.push({ column: "follow_up_date", ...(from ? { min: from } : {}), ...(until ? { max: until } : {}) });
  const rows = useRows("followups", { filters, search, sort: [{ column: "follow_up_date", direction }, { column: "account_id", direction: "asc" }], limit: 50 });
  const accountIds = rows.rows.flatMap(row => row.account_id === null ? [] : [row.account_id]);
  const accounts = useRows("accounts", {
    filters: [{ column: "account_id", values: accountIds }],
    limit: 50,
    enabled: accountIds.length > 0,
  });
  const accountsById = new Map(accounts.rows.map(account => [account.account_id, account]));
  const clear = () => { setPriority(""); setStatus(""); setSearch(""); setFrom(""); setUntil(""); };
  const filtered = Boolean(priority || status || search || from || until);
  return (
    <section id="followups" className="section">
      <div className="section-heading">
        <div><h2>Next steps and follow-ups</h2><p className="muted">Saved work across all accounts, independent of the selected revenue month.</p></div>
      </div>
      <div className="card workspace">
        <div className="workspace-toolbar">
          <input className="standalone-search" aria-label="Search saved follow-ups" placeholder="Search next steps, status, priority, or Account ID…" value={search} onChange={e => setSearch(e.target.value)} />
          <span className="result-count">{rows.loading ? "Finding follow-ups…" : rows.error ? "Count unavailable" : `${numberLabel(rows.total)} matches`}</span>
        </div>
        <div className="filter-grid followup-filters">
          <label>Priority<select value={priority} onChange={e => setPriority(e.target.value)}><option value="">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select></label>
          <label>Follow-up Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option><option>Not started</option><option>In progress</option><option>Done</option></select></label>
          <label>Follow-up from<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
          <label>Follow-up through<input type="date" value={until} onChange={e => setUntil(e.target.value)} /></label>
          <label>Date order<select value={direction} onChange={e => setDirection(e.target.value as "asc" | "desc")}><option value="asc">Earliest first</option><option value="desc">Latest first</option></select></label>
        </div>
        <div className="filter-note"><span>Blank statuses display as Not started. Date filters exclude undated work.</span>{filtered && <button className="btn btn-small" onClick={clear}>Clear filters</button>}</div>
        {rows.error ? <QueryError message={rows.error} retry={rows.refresh} /> : rows.loading && rows.rows.length === 0 ? <Loading label="Loading follow-ups" /> : rows.total === 0 ? (
          <Empty title={filtered ? "No follow-ups match" : "No follow-up records yet"}>{filtered ? <button className="btn" onClick={clear}>Clear search and filters</button> : "Open an account to review its linked follow-up record."}</Empty>
        ) : (
          <div>
            {rows.rows.map(row => <FollowupItem key={row.__row_id} row={row} account={accountsById.get(row.account_id)} accountLoading={row.account_id !== null && accounts.loading} accountError={accounts.error} onSelect={onSelect} />)}
            <div className="list-footer">Showing {numberLabel(rows.rows.length)} of {numberLabel(rows.total)} follow-ups{rows.total > rows.rows.length ? ". Use priority, status, or a date range to focus the list." : "."}</div>
          </div>
        )}
      </div>
    </section>
  );
}