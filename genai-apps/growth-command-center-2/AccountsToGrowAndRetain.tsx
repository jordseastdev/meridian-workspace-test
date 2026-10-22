import { useCallback, useMemo, useState } from "react";
import { useRows, type Filter } from "@meridian/app";
import { Search, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { Empty, Loading, QueryError } from "./components/QueryState";
import { FollowupAccountScope } from "./components/FollowupAccountScope";
import { followupFilters, numberLabel } from "./lib";

export function AccountsToGrowAndRetain({ onSelect }: { onSelect: (id: number) => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [region, setRegion] = useState("");
  const [owner, setOwner] = useState("");
  const [priority, setPriority] = useState("");
  const [workStatus, setWorkStatus] = useState("");
  const [scope, setScope] = useState<{ key: string; ids: number[] } | null>(null);
  const scopeKey = JSON.stringify([priority, workStatus]);
  const needsScope = Boolean(priority || workStatus);
  const ready = !needsScope || scope?.key === scopeKey;
  const onResolved = useCallback((ids: number[]) => {
    setScope(previous => previous?.key === scopeKey && JSON.stringify(previous.ids) === JSON.stringify(ids) ? previous : { key: scopeKey, ids });
  }, [scopeKey]);
  const linkedFilters = useMemo(() => followupFilters(priority, workStatus), [priority, workStatus]);

  const statuses = useRows("accounts", { groupBy: "status", limit: 1000 });
  const plans = useRows("accounts", { groupBy: "plan", limit: 1000 });
  const regions = useRows("accounts", { groupBy: "region", limit: 1000 });
  const owners = useRows("accounts", { groupBy: "owner", limit: 1000 });
  const allAccounts = useRows("accounts", { limit: 1 });

  const filters: Filter<"accounts">[] = [];
  if (status) filters.push({ column: "status", values: [status] });
  if (plan) filters.push({ column: "plan", values: [plan] });
  if (region) filters.push({ column: "region", values: [region] });
  if (owner) filters.push({ column: "owner", values: [owner] });
  if (needsScope) filters.push({ column: "account_id", values: scope?.key === scopeKey ? scope.ids : [] });
  const accounts = useRows("accounts", {
    filters, search, sort: [{ column: "name", direction: "asc" }], limit: 50, enabled: ready,
  });
  const hasFilters = Boolean(search || status || plan || region || owner || priority || workStatus);
  const clear = () => { setSearch(""); setStatus(""); setPlan(""); setRegion(""); setOwner(""); setPriority(""); setWorkStatus(""); };
  const optionsError = statuses.error || plans.error || regions.error || owners.error;

  return (
    <section id="accounts" className="section">
      <div className="section-heading">
        <div><h2>Accounts to grow and retain</h2><p className="muted">Current account facts, one row per account. Choose an account to plan the next step.</p></div>
        {!allAccounts.loading && !allAccounts.error && <span className="pill">{numberLabel(allAccounts.total)} accounts</span>}
      </div>
      <div className="card workspace">
        <div className="workspace-toolbar">
          <div className="search-input"><Search size={18} /><input aria-label="Search accounts" placeholder="Search accounts, owners, plans…" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <span className="result-count">{ready && !accounts.loading && !accounts.error ? `${numberLabel(accounts.total)} matches` : "Finding accounts…"}</span>
        </div>
        <div className="filter-grid">
          <label>Account Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{statuses.rows.map(row => row.status && <option key={row.status}>{row.status}</option>)}</select></label>
          <label>Current Plan<select value={plan} onChange={e => setPlan(e.target.value)}><option value="">All plans</option>{plans.rows.map(row => row.plan && <option key={row.plan}>{row.plan}</option>)}</select></label>
          <label>Region<select value={region} onChange={e => setRegion(e.target.value)}><option value="">All regions</option>{regions.rows.map(row => row.region && <option key={row.region}>{row.region}</option>)}</select></label>
          <label>Account Owner<select value={owner} onChange={e => setOwner(e.target.value)}><option value="">All owners</option>{owners.rows.map(row => row.owner && <option key={row.owner}>{row.owner}</option>)}</select></label>
          <label>Follow-up Priority<select value={priority} onChange={e => setPriority(e.target.value)}><option value="">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select></label>
          <label>Follow-up Status<select value={workStatus} onChange={e => setWorkStatus(e.target.value)}><option value="">All follow-up statuses</option><option>Not started</option><option>In progress</option><option>Done</option></select></label>
        </div>
        <div className="filter-note"><span><SlidersHorizontal size={14} /> Priority is chosen by your team, not an observed risk score.</span>{hasFilters && <button className="btn btn-small" onClick={clear}>Clear filters</button>}</div>
        {optionsError && <QueryError message={optionsError} retry={() => { statuses.refresh(); plans.refresh(); regions.refresh(); owners.refresh(); }} />}
        {needsScope && <FollowupAccountScope key={scopeKey} filters={linkedFilters} onResolved={onResolved} />}
        {!ready || accounts.loading ? <Loading label="Loading accounts" /> : accounts.error ? <QueryError message={accounts.error} retry={accounts.refresh} /> : accounts.total === 0 ? (
          <Empty title={hasFilters ? "No accounts match these filters" : "No accounts yet"}>{hasFilters ? <button className="btn" onClick={clear}>Clear search and filters</button> : "Accounts will appear when they are available in the workbook."}</Empty>
        ) : (
          <div className="account-list">
            <div className="account-row account-table-head"><span>Account</span><span>Current plan</span><span>Account owner</span><span>Lifecycle status</span><span /></div>
            {accounts.rows.map(account => (
              <button key={account.__row_id} className="account-row" disabled={account.account_id == null} onClick={() => account.account_id !== null && onSelect(account.account_id)}>
                <span><strong>{account.name || "Unnamed account"}</strong><small>{account.region || "Region not set"} · {account.industry || "Industry not set"}</small></span>
                <span className="account-plan">{account.plan || "Not set"}</span>
                <span className="account-owner">{account.owner || "Not set"}</span>
                <span><span className={`pill ${account.status === "Active" ? "pill-positive" : ""}`}>{account.status || "Not set"}</span></span>
                <ArrowUpRight size={17} className="row-arrow" />
              </button>
            ))}
            <div className="list-footer">Showing {numberLabel(accounts.rows.length)} of {numberLabel(accounts.total)} accounts{accounts.total > accounts.rows.length ? ". Refine your search or filters to find more." : "."}</div>
          </div>
        )}
      </div>
    </section>
  );
}