import { useMemo, useState } from "react";
import { useRows } from "@meridian/app";
import { BarChart, DonutChart } from "@meridian/ui";
import { ArrowDown, ArrowUp, ChevronRight, Columns3, Database, Search, X } from "lucide-react";

type Dataset = "accounts" | "account_work";
type Column = { id: string; label: string };

const accountColumns: Column[] = [
  { id: "account_id", label: "Account ID" },
  { id: "account_name", label: "Account name" },
  { id: "region", label: "Region" },
  { id: "industry", label: "Industry" },
  { id: "current_plan", label: "Current plan" },
  { id: "status", label: "Status" },
  { id: "account_owner", label: "Account owner" },
  { id: "csm", label: "CSM" },
  { id: "signup_date", label: "Signup date" },
  { id: "last_feature_use_date", label: "Last feature use" },
  { id: "adopted_feature_count", label: "Adopted features" },
  { id: "monthly_active_users", label: "Monthly active users" },
  { id: "total_billed", label: "Total billed" },
  { id: "paid_invoice_count", label: "Paid invoices" },
  { id: "unpaid_invoice_count", label: "Unpaid invoices" },
];
const workColumns: Column[] = [
  { id: "account_id", label: "Account ID" },
  { id: "notes", label: "Account management notes" },
  { id: "follow_up_date", label: "Follow-up date" },
];

const displayValue = (value: unknown) => value == null || value === "" ? "—" : String(value);
const numberFormat = new Intl.NumberFormat();

export function AccountData() {
  const [dataset, setDataset] = useState<Dataset>("accounts");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [sort, setSort] = useState<{ column: string; direction: "asc" | "desc" }>({ column: "account_name", direction: "asc" });
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(accountColumns.slice(0, 8).map(column => column.id));

  const columns = dataset === "accounts" ? accountColumns : workColumns;
  const baseFilters = useMemo(() => {
    const result: any[] = [];
    if (regionFilter) result.push({ column: "region", values: [regionFilter] });
    return result;
  }, [regionFilter]);
  const filters = useMemo(() => {
    const result = [...baseFilters];
    if (statusFilter) result.push({ column: "status", values: [statusFilter] });
    if (planFilter) result.push({ column: "current_plan", values: [planFilter] });
    return result;
  }, [baseFilters, statusFilter, planFilter]);

  const accountRead = useRows("accounts", {
    filters: dataset === "accounts" ? filters : [],
    search: dataset === "accounts" ? search : "",
    sort: [{ column: sort.column as any, direction: sort.direction }],
    limit: 1000,
  });
  const workRead = useRows("account_work", {
    search: dataset === "account_work" ? search : "",
    sort: [{ column: sort.column as any, direction: sort.direction }],
    limit: 1000,
  });
  const statusGroups = useRows("accounts", {
    filters: [...baseFilters, ...(planFilter ? [{ column: "current_plan", values: [planFilter] }] : [])],
    groupBy: "status",
    limit: 1000,
  });
  const planGroups = useRows("accounts", {
    filters: [...baseFilters, ...(statusFilter ? [{ column: "status", values: [statusFilter] }] : [])],
    groupBy: "current_plan",
    limit: 1000,
  });
  const accountTotal = useRows("accounts", { filters, search, limit: 1 });

  const read = dataset === "accounts" ? accountRead : workRead;
  const rows = read.rows as unknown as Record<string, unknown>[];
  const shownColumns = columns.filter(column => visibleColumns.includes(column.id));

  const switchDataset = (next: Dataset) => {
    setDataset(next);
    setSearchInput("");
    setSearch("");
    setSelected(null);
    setSort(next === "accounts" ? { column: "account_name", direction: "asc" } : { column: "account_id", direction: "asc" });
    setVisibleColumns((next === "accounts" ? accountColumns : workColumns).slice(0, next === "accounts" ? 8 : 3).map(column => column.id));
  };

  const toggleSort = (column: string) => {
    setSort(current => ({ column, direction: current.column === column && current.direction === "asc" ? "desc" : "asc" }));
  };
  const toggleColumn = (id: string) => {
    setVisibleColumns(current => current.includes(id) ? current.filter(column => column !== id) : [...current, id]);
  };
  const togglePlan = (value: unknown) => {
    const plan = String(value ?? "");
    if (plan) setPlanFilter(current => current === plan ? "" : plan);
  };
  const toggleStatus = (value: unknown) => {
    const status = String(value ?? "");
    if (status) setStatusFilter(current => current === status ? "" : status);
  };
  const clearAccountFilters = () => {
    setStatusFilter("");
    setRegionFilter("");
    setPlanFilter("");
  };

  return (
    <section className="data-view data-workspace">
      <header className="data-hero">
        <div className="data-heading">
          <p className="eyebrow">GOVERNED WORKBOOK · EXPLORER</p>
          <h3>Find the signal<br /><em>in your data.</em></h3>
          <p>Explore account records and account-management work in one focused workspace.</p>
        </div>
        <div className="data-hero-mark"><Database size={25} /><span>Live workbook</span></div>
      </header>

      {dataset === "accounts" && <section className="data-insights" aria-label="Account distribution filters">
        <div className="insights-heading">
          <div><p className="eyebrow">PORTFOLIO SIGNALS</p><h4>Account distribution</h4></div>
          <span>Distributions respect region and the other chart selection.</span>
        </div>
        <div className="data-charts">
          <article className="card chart-card distribution-card plan-card">
            <div className="distribution-heading"><div><span className="eyebrow">PLAN MIX</span><h5>Accounts by plan</h5></div><span className="chart-scope">Status-aware · all matching accounts</span></div>
            <div className="chart-interactive" aria-label="Select a plan to filter accounts">
              <BarChart data={planGroups.rows} x="current_plan" y="count" title="" legend="none" rounded={true} horizontal={true} height={220} loading={planGroups.loading} colors={["#247a68"]} dataLabels={true} format="compact" onSelect={row => togglePlan(row.current_plan)} />
            </div>
            {planGroups.error && <p className="chart-error">{planGroups.error}</p>}
            {!planGroups.loading && !planGroups.error && !planGroups.rows.length && <p className="chart-empty">No plan distribution available.</p>}
            <div className="chart-footnote">Choose a bar to filter the account table. Select it again to remove the filter.</div>
          </article>
          <article className="card chart-card distribution-card status-card">
            <div className="distribution-heading"><div><span className="eyebrow">ACCOUNT HEALTH</span><h5>Accounts by status</h5></div><span className="chart-scope">Plan-aware · all matching accounts</span></div>
            <div className="status-chart-layout">
              <div className="chart-interactive status-donut" aria-label="Select a status segment to filter accounts">
                <DonutChart data={statusGroups.rows} label="status" value="count" centerLabel={numberFormat.format(statusGroups.rows.reduce((sum: number, row: any) => sum + (Number(row.count) || 0), 0))} legend="none" loading={statusGroups.loading} colors={["#247a68", "#b8d7c8", "#dcebe3"]} onSelect={row => toggleStatus(row.status)} />
              </div>
              <div className="status-legend" aria-label="Status filters">
                {statusGroups.rows.map((row: any, index: number) => <button key={String(row.status)} className={`status-legend-item ${statusFilter === row.status ? "active" : ""}`} onClick={() => toggleStatus(row.status)} title={`Filter accounts with status ${displayValue(row.status)}`}>
                  <span className={`legend-swatch swatch-${index % 3}`} />
                  <span className="legend-label">{displayValue(row.status)}</span>
                  <strong>{numberFormat.format(row.count)}</strong>
                </button>)}
                {!statusGroups.loading && !statusGroups.error && !statusGroups.rows.length && <span className="chart-empty">No status distribution available.</span>}
              </div>
            </div>
            {statusGroups.error && <p className="chart-error">{statusGroups.error}</p>}
          </article>
        </div>
        {(statusFilter || planFilter || regionFilter) && <div className="active-filters" aria-label="Active account filters">
          <span className="active-filter-label">Filtering by</span>
          {regionFilter && <button className="filter-chip" onClick={() => setRegionFilter("")}>Region: {regionFilter}<X size={13} /></button>}
          {statusFilter && <button className="filter-chip" onClick={() => setStatusFilter("")}>Status: {statusFilter}<X size={13} /></button>}
          {planFilter && <button className="filter-chip" onClick={() => setPlanFilter("")}>Plan: {planFilter}<X size={13} /></button>}
          <button className="clear-filters-button" onClick={clearAccountFilters}>Clear all</button>
        </div>}
      </section>}

      <div className={`data-master-detail ${selected ? "has-selection" : ""}`}>
        <section className="data-explorer card">
          <div className="dataset-bar">
            <div className="dataset-intro"><span className="eyebrow">DATASETS</span><span>Choose a table to explore</span></div>
            <div className="dataset-switch" role="tablist" aria-label="Datasets">
              <button className={dataset === "accounts" ? "dataset-tab active" : "dataset-tab"} onClick={() => switchDataset("accounts")} role="tab" aria-selected={dataset === "accounts"}><span>Accounts</span><small>Portfolio records</small></button>
              <button className={dataset === "account_work" ? "dataset-tab active" : "dataset-tab"} onClick={() => switchDataset("account_work")} role="tab" aria-selected={dataset === "account_work"}><span>Account work</span><small>Notes &amp; follow-up</small></button>
            </div>
          </div>

          <div className="explorer-toolbar">
            <label className="data-search"><Search size={18} /><input value={searchInput} onChange={event => { const value = event.target.value; setSearchInput(value); setSearch(value); }} placeholder={dataset === "accounts" ? "Search all account fields…" : "Search notes and follow-up records…"} /><kbd>↵</kbd></label>
            {dataset === "accounts" && <div className="data-filters">
              <label><span>Status</span><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">All statuses</option>{statusGroups.rows.map((row: any) => row.status != null && <option key={String(row.status)} value={String(row.status)}>{String(row.status)}</option>)}</select></label>
              <label><span>Region</span><select value={regionFilter} onChange={event => setRegionFilter(event.target.value)}><option value="">All regions</option>{Array.from(new Set((accountRead.rows as any[]).map(row => row.region).filter(Boolean))).sort().map(region => <option key={String(region)} value={String(region)}>{String(region)}</option>)}</select></label>
              <label><span>Plan</span><select value={planFilter} onChange={event => setPlanFilter(event.target.value)}><option value="">All plans</option>{planGroups.rows.map((row: any) => row.current_plan != null && <option key={String(row.current_plan)} value={String(row.current_plan)}>{String(row.current_plan)}</option>)}</select></label>
            </div>}
            <details className="column-menu"><summary><Columns3 size={16} /> Columns</summary><div className="column-menu-popover"><strong>Visible columns</strong>{columns.map(column => <label key={column.id}><input type="checkbox" checked={visibleColumns.includes(column.id)} onChange={() => toggleColumn(column.id)} />{column.label}</label>)}</div></details>
          </div>

          <div className="table-status" aria-live="polite">
            <span><strong>{read.loading ? "…" : read.total.toLocaleString()}</strong> matching records</span>
            <span>{read.total > rows.length ? `Showing ${rows.length.toLocaleString()} of ${read.total.toLocaleString()}` : `${rows.length.toLocaleString()} rows shown`}</span>
          </div>

          {read.error ? <div className="data-state data-state-error"><strong>We couldn’t load this dataset.</strong><span>{read.error}</span></div> :
            read.loading && !rows.length ? <div className="data-table-skeleton" aria-label="Loading dataset">{Array.from({ length: 6 }, (_, index) => <div className="data-skeleton-row" key={index} />)}</div> :
            !rows.length ? <div className="data-state"><div className="data-empty-icon"><Search size={20} /></div><strong>No matching records</strong><span>Try a different search or adjust the filters.</span></div> :
            <div className="data-table-wrap"><table className="data-table">
              <thead><tr>{shownColumns.map(column => <th key={column.id}><button onClick={() => toggleSort(column.id)}>{column.label}{sort.column === column.id && (sort.direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th>)}<th className="inspect-heading">Inspect</th></tr></thead>
              <tbody>{rows.map((row, index) => {
                const rowKey = String(row.__row_id ?? row.account_id ?? index);
                const active = selected && String(selected.__row_id ?? selected.account_id) === String(row.__row_id ?? row.account_id);
                return <tr key={rowKey} className={active ? "selected-row" : ""} aria-selected={!!active} tabIndex={0} onClick={() => setSelected(row)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(row); } }}>
                  {shownColumns.map(column => <td key={column.id} className={`data-cell-${column.id}`}>{displayValue(row[column.id])}</td>)}
                  <td className="inspect-cell"><button aria-label={`Inspect record ${displayValue(row.account_id)}`} onClick={event => { event.stopPropagation(); setSelected(row); }}><ChevronRight size={17} /></button></td>
                </tr>;
              })}</tbody>
            </table></div>}
          {!read.error && read.total > rows.length && <p className="data-limit-note">This view is limited to the first {rows.length.toLocaleString()} matching rows. Search or refine the dataset to explore more.</p>}
        </section>

        {selected && <aside className="record-inspector card" aria-label="Record inspector">
          <div className="inspector-heading"><div><p className="eyebrow">RECORD INSPECTOR</p><h4>{displayValue(selected.account_name ?? `Account ${displayValue(selected.account_id)}`)}</h4></div><button className="icon-button" aria-label="Close record inspector" onClick={() => setSelected(null)}><X size={17} /></button></div>
          <dl>{columns.map(column => <div key={column.id}><dt>{column.label}</dt><dd>{displayValue(selected[column.id])}</dd></div>)}</dl>
        </aside>}
      </div>
      {dataset === "accounts" && <span className="visually-hidden" aria-live="polite">{accountTotal.loading ? "Updating account total" : `${accountTotal.total.toLocaleString()} matching accounts`}</span>}
    </section>
  );
}