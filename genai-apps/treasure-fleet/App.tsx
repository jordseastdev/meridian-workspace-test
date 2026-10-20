import React, { useEffect, useMemo, useRef, useState } from "react";
import { addRow, updateRow, useRows, useUser } from "@meridian/app";
import type { Filter } from "@meridian/app";
import { BarChart, LineChart } from "@meridian/ui";
import {
  Anchor, ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, Check, ChevronDown,
  ChevronRight, CircleAlert, Clock3, Compass, LayoutGrid, List, MapPin, Plus,
  RefreshCw, Search, Ship, SlidersHorizontal, X,
} from "lucide-react";

type SortField = "total_billed" | "unpaid_invoice_count" | "signup_date" | "account_name";
type ViewMode = "cards" | "table";
type Account = ReturnType<typeof useRows<"accounts">>["rows"][number];
type Work = ReturnType<typeof useRows<"account_work">>["rows"][number];

const SORTS: { field: SortField; label: string; direction: "asc" | "desc" }[] = [
  { field: "account_name", label: "Account name", direction: "asc" },
  { field: "total_billed", label: "Lifetime billed", direction: "desc" },
  { field: "unpaid_invoice_count", label: "Unpaid invoices", direction: "desc" },
  { field: "signup_date", label: "Signup date", direction: "desc" },
];

function validDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function fmtDate(value: string | null | undefined): string {
  const date = validDate(value);
  return date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
}
function fmtMoney(value: number | null | undefined): string {
  return value == null ? "—" : new Intl.NumberFormat(undefined, {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(value);
}
function fmtNumber(value: number | null | undefined): string {
  return value == null ? "—" : value.toLocaleString();
}
function monthOf(value: string | null | undefined): string | null {
  const date = validDate(value);
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : null;
}
function monthLabel(month: string): string {
  const [year, number] = month.split("-").map(Number);
  return new Date(year, number - 1, 1).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}
function monthRange(start: string, end: string): string[] {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  const result: string[] = [];
  for (let year = sy, month = sm; year < ey || (year === ey && month <= em);) {
    result.push(`${year}-${String(month).padStart(2, "0")}`);
    if (++month === 13) { month = 1; year++; }
  }
  return result;
}
function idFor(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function PirateAccountTreasureApp() {
  const user = useUser();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [region, setRegion] = useState("");
  const [owner, setOwner] = useState("");
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [signupMonth, setSignupMonth] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("account_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [mode, setMode] = useState<ViewMode>("cards");
  const [chartsOpen, setChartsOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [savedViewName, setSavedViewName] = useState("");
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [workForm, setWorkForm] = useState({ next_step: "", follow_up_date: "", assigned_to: "" });
  const [noteText, setNoteText] = useState("");
  const [workFeedback, setWorkFeedback] = useState("");
  const [workError, setWorkError] = useState("");
  const [noteFeedback, setNoteFeedback] = useState("");
  const [noteError, setNoteError] = useState("");
  const [savingWork, setSavingWork] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [savingView, setSavingView] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(50);

  const filters: Filter<"accounts">[] = [];
  if (status) filters.push({ column: "status", values: [status] });
  if (plan) filters.push({ column: "current_plan", values: [plan] });
  if (region) filters.push({ column: "region", values: [region] });
  if (owner) filters.push({ column: "account_owner", values: [owner] });
  if (unpaidOnly) filters.push({ column: "unpaid_invoice_count", min: 1 });
  if (signupMonth) {
    const [year, month] = signupMonth.split("-").map(Number);
    const from = `${signupMonth}-01`;
    const to = new Date(year, month, 0).toISOString().slice(0, 10);
    filters.push({ column: "signup_date", min: from, max: to });
  }

  const query = { filters, search, sort: [{ column: sortBy, direction: sortDirection }, { column: "account_id" as const, direction: "asc" as const }], limit };
  const accounts = useRows("accounts", query);
  const completeAccounts = useRows("accounts", {
    filters, search,
    sort: [{ column: "account_id", direction: "asc" }],
    limit: 1000,
  });
  const unpaidAccounts = useRows("accounts", {
    filters: [...filters, { column: "unpaid_invoice_count", min: 1 }],
    search,
    limit: 1,
  });
  const statuses = useRows("accounts", { groupBy: "status", limit: 100 });
  const plans = useRows("accounts", { groupBy: "current_plan", limit: 100 });
  const regions = useRows("accounts", { groupBy: "region", limit: 100 });
  const owners = useRows("accounts", { groupBy: "account_owner", limit: 100 });
  const statusChart = useRows("accounts", { filters, search, groupBy: "status", limit: 100 });
  const regionChart = useRows("accounts", { filters, search, groupBy: "region", limit: 100 });
  const monthlyDates = useRows("accounts", {
    filters, search, groupBy: "signup_date",
    sort: [{ column: "signup_date", direction: "desc" }], limit: 50000,
  });
  const workRows = useRows("account_work", {
    filters: selectedId === null ? [] : [{ column: "account_id", values: [selectedId] }],
    limit: 1, enabled: selectedId !== null,
  });
  const activities = useRows("account_activity", {
    filters: selectedId === null ? [] : [{ column: "account_id", values: [selectedId] }],
    sort: [{ column: "created_at", direction: "desc" }], limit: 100, enabled: selectedId !== null,
  });
  const savedViews = useRows("saved_views", { sort: [{ column: "created_at", direction: "desc" }], limit: 100 });
  const detail = useRows("accounts", {
    filters: selectedId === null ? [] : [{ column: "account_id", values: [selectedId] }],
    limit: 1, enabled: selectedId !== null,
  });

  const filterKey = `${search}|${status}|${plan}|${region}|${owner}|${unpaidOnly}|${signupMonth}`;
  const priorKey = useRef(filterKey);
  useEffect(() => {
    if (priorKey.current !== filterKey) { setPage(0); priorKey.current = filterKey; }
  }, [filterKey]);

  const allComplete = completeAccounts.total <= completeAccounts.rows.length;
  const summaryReady = !completeAccounts.loading && !completeAccounts.error;
  const summaryError = completeAccounts.error || (!allComplete
    ? "Lifetime billed is only available when all matching account rows can be read. Narrow the filters to 1,000 accounts or fewer."
    : "");
  const lifetimeBilled = allComplete
    ? completeAccounts.rows.reduce((sum, row) => sum + (row.total_billed ?? 0), 0)
    : null;
  const unpaidCount = unpaidAccounts.total;

  const monthCounts = useMemo(() => {
    const values = new Map<string, number>();
    for (const row of monthlyDates.rows) {
      const month = monthOf(row.signup_date);
      if (month) values.set(month, (values.get(month) || 0) + row.count);
    }
    return values;
  }, [monthlyDates.rows]);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const completedMonths = [...monthCounts.keys()].filter(month => month < currentMonth).sort();
  const latestMonth = completedMonths.at(-1) || "";
  const signupTotal = latestMonth ? monthCounts.get(latestMonth) || 0 : 0;
  const chartMonths = completedMonths.length ? monthRange(completedMonths[0], latestMonth) : [];
  const trendData = chartMonths.map(month => ({ month: monthLabel(month), count: monthCounts.get(month) || 0 }));
  const chartComplete = monthlyDates.total <= monthlyDates.rows.length;

  const selected = detail.rows[0];
  const work = workRows.rows[0] as Work | undefined;
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (selectedId !== null) {
      returnFocusRef.current = document.activeElement as HTMLElement;
      closeRef.current?.focus();
    } else {
      returnFocusRef.current?.focus();
    }
  }, [selectedId]);
  useEffect(() => {
    if (selectedId === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setSelectedId(null); return; }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const items = drawerRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]');
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedId]);

  useEffect(() => {
    if (selectedId === null) return;
    setWorkForm({
      next_step: work?.next_step || "",
      follow_up_date: work?.follow_up_date?.slice(0, 10) || "",
      assigned_to: work?.assigned_to || "",
    });
    setWorkFeedback(""); setWorkError(""); setNoteFeedback(""); setNoteError(""); setNoteText("");
  }, [selectedId, work?.next_step, work?.follow_up_date, work?.assigned_to]);

  const resetFilters = () => {
    setSearch(""); setStatus(""); setPlan(""); setRegion(""); setOwner("");
    setUnpaidOnly(false); setSignupMonth("");
  };
  const openAccount = (id: number | null, target?: HTMLElement) => {
    if (id == null) return;
    if (target) returnFocusRef.current = target;
    setSelectedId(id);
  };
  const removeChip = (key: string) => {
    if (key === "search") setSearch("");
    if (key === "status") setStatus("");
    if (key === "plan") setPlan("");
    if (key === "region") setRegion("");
    if (key === "owner") setOwner("");
    if (key === "unpaid") setUnpaidOnly(false);
    if (key === "signup") setSignupMonth("");
  };
  const applyStatus = (value: string) => { setStatus(value); setPage(0); };
  const applyRegion = (value: string) => { setRegion(value); setPage(0); };

  const saveWork = async () => {
    if (selectedId === null) return;
    setSavingWork(true); setWorkFeedback(""); setWorkError("");
    try {
      await updateRow("account_work", String(selectedId), {
        next_step: workForm.next_step || null,
        follow_up_date: workForm.follow_up_date || null,
        assigned_to: workForm.assigned_to || null,
      });
      setWorkFeedback("Saved");
      window.setTimeout(() => setWorkFeedback(""), 4000);
    } catch (error) {
      setWorkError(`Could not save follow-up details. ${error instanceof Error ? error.message : "Try again."}`);
    } finally { setSavingWork(false); }
  };
  const saveNote = async () => {
    if (selectedId === null || !noteText.trim()) return;
    setSavingNote(true); setNoteFeedback(""); setNoteError("");
    try {
      await addRow("account_activity", { account_id: selectedId, note: noteText.trim() });
      setNoteText(""); setNoteFeedback("Note added");
      window.setTimeout(() => setNoteFeedback(""), 4000);
    } catch (error) {
      setNoteError(`Could not add note. ${error instanceof Error ? error.message : "Try again."}`);
    } finally { setSavingNote(false); }
  };
  const configuration = () => JSON.stringify({
    version: 1, search, status, plan, region, owner, unpaidOnly, signupMonth,
    sortBy, sortDirection, mode, chartsOpen,
  });
  const saveView = async () => {
    const name = savedViewName.trim();
    if (!name) { setFailure("Enter a name for this saved view."); return; }
    setSavingView(true); setFailure(""); setMessage("");
    try {
      await addRow("saved_views", { view_name: name, configuration: configuration() });
      setSavedViewName(""); setMessage("View saved");
      window.setTimeout(() => setMessage(""), 4000);
    } catch (error) { setFailure(`Could not save view. ${error instanceof Error ? error.message : "Try again."}`); }
    finally { setSavingView(false); }
  };
  const loadView = (raw: string | null) => {
    if (!raw) return;
    try {
      const config = JSON.parse(raw);
      if (config.version !== 1 || typeof config.search !== "string"
        || !["cards", "table"].includes(config.mode)
        || !SORTS.some(item => item.field === config.sortBy)
        || !["asc", "desc"].includes(config.sortDirection)
        || [config.status, config.plan, config.region, config.owner].some(value => value != null && typeof value !== "string")
        || (config.signupMonth && !/^\d{4}-\d{2}$/.test(config.signupMonth))) throw new Error();
      setSearch(config.search); setStatus(config.status || ""); setPlan(config.plan || "");
      setRegion(config.region || ""); setOwner(config.owner || "");
      setUnpaidOnly(config.unpaidOnly === true); setSignupMonth(config.signupMonth || "");
      setSortBy(config.sortBy); setSortDirection(config.sortDirection);
      setMode(config.mode); setChartsOpen(config.chartsOpen !== false);
      setPage(0); setMessage("View loaded"); setFailure("");
      window.setTimeout(() => setMessage(""), 4000);
    } catch { setFailure("This saved view has an invalid configuration. Save a new view to replace it."); }
  };

  const sortRows = (field: SortField) => {
    const next = SORTS.find(item => item.field === field)!;
    if (sortBy === field) setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDirection(next.direction); }
    setPage(0);
  };
  const sortButton = (field: SortField, label: string) => (
    <button className="table-sort" type="button" onClick={() => sortRows(field)}>
      {label} {sortBy === field ? sortDirection === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} /> : <ArrowUpDown size={13} />}
    </button>
  );
  const sortedOptions = (rows: { count: number; [key: string]: unknown }[], key: string) =>
    [...rows].map(row => row[key]).filter((v): v is string => typeof v === "string").sort();

  const chips: { key: string; label: string }[] = [];
  if (search) chips.push({ key: "search", label: `Search: ${search}` });
  if (status) chips.push({ key: "status", label: `Status: ${status}` });
  if (plan) chips.push({ key: "plan", label: `Plan: ${plan}` });
  if (region) chips.push({ key: "region", label: `Region: ${region}` });
  if (owner) chips.push({ key: "owner", label: `Owner: ${owner}` });
  if (unpaidOnly) chips.push({ key: "unpaid", label: "Has unpaid invoices" });
  if (signupMonth) chips.push({ key: "signup", label: `Signup: ${monthLabel(signupMonth)}` });
  const visibleStart = page * limit;
  const shown = Math.min(accounts.rows.length, Math.max(0, accounts.total - visibleStart));
  const dueDate = validDate(work?.follow_up_date);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dueState = dueDate ? dueDate < today ? "Overdue" : dueDate.toDateString() === today.toDateString() ? "Due today" : `Due ${fmtDate(work?.follow_up_date)}` : "";

  const selectKpi = (kind: "all" | "billed" | "unpaid" | "signup") => {
    if (kind === "all") resetFilters();
    if (kind === "billed") { setSortBy("total_billed"); setSortDirection("desc"); }
    if (kind === "unpaid") setUnpaidOnly(true);
    if (kind === "signup" && latestMonth) setSignupMonth(latestMonth);
    setPage(0);
  };

  return (
    <main className="app">
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark"><Anchor size={22} /></div>
            <div><div className="eyebrow">Meridian · Account intelligence</div><h1>Pirate Account Treasure</h1></div>
          </div>
          <div className="top-note"><Compass size={16} /> Account command deck</div>
        </header>

        <section className="hero">
          <div><h2>Account command deck</h2><p>Review the fleet, set the next step, and keep follow-ups on course.</p></div>
          <div className="saved-controls">
            <select aria-label="Load saved view" value="" onChange={event => {
              const selectedView = savedViews.rows.find(row => row.view_id === event.target.value);
              if (selectedView) loadView(selectedView.configuration);
            }}>
              <option value="">Saved views</option>
              {savedViews.rows.map(row => <option key={row.view_id} value={row.view_id || ""}>{row.view_name}</option>)}
            </select>
            <input aria-label="Saved view name" placeholder="View name" value={savedViewName} onChange={event => setSavedViewName(event.target.value)} />
            <button className="btn btn-secondary" disabled={savingView} onClick={saveView}>{savingView ? "Saving…" : "Save view"}</button>
          </div>
        </section>

        <section className="summary-grid" aria-label="Filtered account summaries">
          <button className={`summary-card ${!chips.length ? "selected" : ""}`} onClick={() => selectKpi("all")}>
            <span>Filtered accounts</span>{accounts.loading ? <div className="kpi-skeleton" aria-label="Loading account count" /> : accounts.error ? <strong className="kpi-error">Unavailable</strong> : <strong>{fmtNumber(accounts.total)}</strong>}<small>All accounts matching this view</small>
          </button>
          <button className={`summary-card ${sortBy === "total_billed" && sortDirection === "desc" ? "selected" : ""}`} onClick={() => selectKpi("billed")}>
            <span>Lifetime total billed · USD</span>{completeAccounts.loading ? <div className="kpi-skeleton" aria-label="Loading lifetime billed" /> : summaryError ? <strong className="kpi-error">Unavailable</strong> : <strong>{fmtMoney(lifetimeBilled)}</strong>}<small>Lifetime total billed, not recurring revenue</small>
          </button>
          <button className={`summary-card ${unpaidOnly ? "selected" : ""}`} onClick={() => selectKpi("unpaid")}>
            <span>Accounts with unpaid invoices</span>{unpaidAccounts.loading ? <div className="kpi-skeleton" aria-label="Loading unpaid account count" /> : unpaidAccounts.error ? <strong className="kpi-error">Unavailable</strong> : <strong>{fmtNumber(unpaidCount)}</strong>}<small>Filtered accounts with unpaid balance count</small>
          </button>
          <button className={`summary-card ${signupMonth === latestMonth && !!latestMonth ? "selected" : ""}`} onClick={() => selectKpi("signup")} disabled={!latestMonth}>
            <span>New signups · {latestMonth ? monthLabel(latestMonth) : "completed month unavailable"}</span>
            {monthlyDates.loading ? <div className="kpi-skeleton" aria-label="Loading signup count" /> : monthlyDates.error || !chartComplete ? <strong className="kpi-error">Unavailable</strong> : <strong>{latestMonth ? fmtNumber(signupTotal) : "—"}</strong>}
            <small>Latest completed month represented in matching data</small>
          </button>
        </section>
        {(accounts.error || completeAccounts.error || unpaidAccounts.error || monthlyDates.error || (summaryError && !completeAccounts.loading)) && <div className="error" role="alert"><CircleAlert size={17} /> {summaryError || accounts.error || unpaidAccounts.error || monthlyDates.error} <button className="text-button" onClick={() => { accounts.refresh(); completeAccounts.refresh(); unpaidAccounts.refresh(); monthlyDates.refresh(); }}><RefreshCw size={14} /> Retry KPI data</button></div>}

        <section className="controls" aria-label="Search and filter accounts">
          <div className="search-wrap"><Search size={17} /><input aria-label="Search accounts" placeholder="Search accounts" value={search} onChange={event => setSearch(event.target.value)} /></div>
          <select aria-label="Filter by status" value={status} onChange={event => applyStatus(event.target.value)}><option value="">All statuses</option>{sortedOptions(statuses.rows, "status").map(value => <option key={value}>{value}</option>)}</select>
          <select aria-label="Filter by plan" value={plan} onChange={event => setPlan(event.target.value)}><option value="">All plans</option>{sortedOptions(plans.rows, "current_plan").map(value => <option key={value}>{value}</option>)}</select>
          <select aria-label="Filter by region" value={region} onChange={event => applyRegion(event.target.value)}><option value="">All regions</option>{sortedOptions(regions.rows, "region").map(value => <option key={value}>{value}</option>)}</select>
          <select aria-label="Filter by account owner" value={owner} onChange={event => setOwner(event.target.value)}><option value="">All account owners</option>{sortedOptions(owners.rows, "account_owner").map(value => <option key={value}>{value}</option>)}</select>
        </section>
        {chips.length > 0 && <div className="active-filters"><span>Active filters</span>{chips.map(chip => <button className="filter-chip" key={chip.key} onClick={() => removeChip(chip.key)}>{chip.label}<X size={13} /></button>)}<button className="text-button" onClick={resetFilters}>Clear all</button></div>}

        <section className="chart-section">
          <button className="section-toggle" aria-expanded={chartsOpen} onClick={() => setChartsOpen(!chartsOpen)}>
            <SlidersHorizontal size={17} /> Account charts <ChevronDown size={16} className={chartsOpen ? "" : "collapsed"} />
          </button>
          {chartsOpen && <div className="charts-grid">
            <div className="panel chart-panel"><h3>Signups over time</h3>
              <p className="muted">{chartMonths.length ? `${monthLabel(chartMonths[0])} to ${monthLabel(latestMonth)} · completed months only` : "No completed-month signup dates in this view."}</p>
              {monthlyDates.error ? <ErrorState text={`Signup trend failed to load: ${monthlyDates.error}`} retry={() => monthlyDates.refresh()} />
                : monthlyDates.loading ? <div className="skeleton chart-skeleton" />
                : !chartComplete ? <ErrorState text="The signup trend exceeds the complete date-group limit. Narrow the search or filters." />
                : !trendData.length ? <EmptyState text="No signup dates are available for completed months." />
                : <LineChart data={trendData} x="month" y="count" legend="none" format="number" curve="linear" dots />}
            </div>
            <div className="panel chart-panel"><h3>Accounts by status</h3><p className="muted">Select a status to filter accounts.</p>
              {statusChart.error ? <ErrorState text={statusChart.error} retry={() => statusChart.refresh()} /> : statusChart.loading ? <div className="skeleton chart-skeleton" /> : statusChart.rows.length === 0 ? <EmptyState text="No status groups match these filters." /> :
                <><BarChart data={statusChart.rows} x="status" y="count" horizontal rounded loading={statusChart.loading} />
                  <div className="chart-options">{statusChart.rows.map(row => <button key={String(row.status)} className={`filter-chip ${status === row.status ? "active" : ""}`} onClick={() => applyStatus(status === row.status ? "" : String(row.status))}>{String(row.status)} · {fmtNumber(row.count)}</button>)}</div></>}
            </div>
            <div className="panel chart-panel"><h3>Accounts by region</h3><p className="muted">Select a region to filter accounts.</p>
              {regionChart.error ? <ErrorState text={regionChart.error} retry={() => regionChart.refresh()} /> : regionChart.loading ? <div className="skeleton chart-skeleton" /> : regionChart.rows.length === 0 ? <EmptyState text="No region groups match these filters." /> :
                <><BarChart data={regionChart.rows} x="region" y="count" horizontal rounded loading={regionChart.loading} />
                  <div className="chart-options">{regionChart.rows.map(row => <button key={String(row.region)} className={`filter-chip ${region === row.region ? "active" : ""}`} onClick={() => applyRegion(region === row.region ? "" : String(row.region))}>{String(row.region)} · {fmtNumber(row.count)}</button>)}</div></>}
            </div>
          </div>}
        </section>

        <section className="workspace">
          <div className="workspace-head">
            <div><h2>Account workspace</h2><p className="muted">{accounts.loading ? "Loading accounts…" : `Showing ${accounts.rows.length} of ${fmtNumber(accounts.total)} matching accounts`}</p></div>
            <div className="workspace-actions">
              <label className="sort-control">Sort by <select aria-label="Sort accounts by" value={sortBy} onChange={event => {
                const field = event.target.value as SortField;
                setSortBy(field); setSortDirection(SORTS.find(item => item.field === field)?.direction || "desc"); setPage(0);
              }}>{SORTS.map(item => <option key={item.field} value={item.field}>{item.label}</option>)}</select></label>
              <button className={`icon-toggle ${mode === "cards" ? "active" : ""}`} aria-label="Card view" aria-pressed={mode === "cards"} onClick={() => setMode("cards")}><LayoutGrid size={17} /></button>
              <button className={`icon-toggle ${mode === "table" ? "active" : ""}`} aria-label="Table view" aria-pressed={mode === "table"} onClick={() => setMode("table")}><List size={18} /></button>
            </div>
          </div>
          {accounts.error ? <ErrorState text={`Accounts failed to load: ${accounts.error}`} retry={() => accounts.refresh()} />
            : accounts.loading && !accounts.rows.length ? <div className={mode === "cards" ? "manifest" : ""}><div className="skeleton" /><div className="skeleton" /></div>
            : accounts.total === 0 ? <EmptyState text={search || chips.length ? "No accounts match this search and filter set." : "No accounts are available yet."} action={chips.length ? <button className="btn btn-secondary" onClick={resetFilters}>Clear filters</button> : undefined} />
            : mode === "cards" ? <div className="manifest">{accounts.rows.map(account => (
              <AccountCard key={account.__row_id} account={account} onOpen={openAccount} />
            ))}</div> : <div className="table-wrap"><table className="account-table">
              <thead><tr><th>{sortButton("account_name", "Account")}</th><th>Status</th><th>Plan</th><th>Region</th><th>Account owner</th><th>{sortButton("signup_date", "Signed up")}</th><th>{sortButton("total_billed", "Lifetime billed")}</th><th>{sortButton("unpaid_invoice_count", "Unpaid")}</th></tr></thead>
              <tbody>{accounts.rows.map(account => <tr key={account.__row_id} tabIndex={0} onClick={event => openAccount(account.account_id, event.currentTarget)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openAccount(account.account_id, event.currentTarget); } }}>
                <td><strong>{account.account_name || "Unnamed account"}</strong><br /><span className="muted">{account.domain || "Domain not recorded"}</span></td><td>{account.status || "—"}</td><td>{account.current_plan || "—"}</td><td>{account.region || "—"}</td><td>{account.account_owner || "—"}</td><td>{fmtDate(account.signup_date)}</td><td>{fmtMoney(account.total_billed)}</td><td>{fmtNumber(account.unpaid_invoice_count)}</td>
              </tr>)}</tbody>
            </table></div>}
          {accounts.total > 0 && <div className="pagination">
            <button className="btn btn-secondary" disabled={page === 0} onClick={() => setPage(Math.max(0, page - 1))}>Previous</button>
            <span>Page {page + 1} of {Math.max(1, Math.ceil(accounts.total / limit))}</span>
            <label>Rows <select value={limit} onChange={event => { setLimit(Number(event.target.value)); setPage(0); }}><option value={50}>50</option><option value={100}>100</option><option value={200}>200</option></select></label>
            <button className="btn btn-secondary" disabled={visibleStart + shown >= accounts.total} onClick={() => setPage(page + 1)}>Next</button>
          </div>}
        </section>
      </div>

      {selectedId !== null && <div className="detail-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedId(null); }}>
        <aside className="detail-panel" ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="detail-heading" aria-describedby="detail-description">
          <div className="detail-top"><div className="eyebrow"><Anchor size={13} /> Account dossier</div><button ref={closeRef} className="close" aria-label="Close account details" onClick={() => setSelectedId(null)}><X size={19} /></button></div>
          {detail.loading ? <div className="skeleton detail-skeleton" aria-label="Loading account details" />
            : detail.error ? <ErrorState text={`Account details failed to load: ${detail.error}`} retry={() => detail.refresh()} />
            : !selected ? <EmptyState text="This account is no longer available." />
            : <>
              <h2 id="detail-heading">{selected.account_name || "Unnamed account"}</h2>
              <p id="detail-description" className="detail-domain">{selected.domain || "Domain not recorded"}</p>
              {dueState && <div className={`due-banner ${dueState === "Overdue" ? "overdue" : ""}`}><Clock3 size={17} /><span>{dueState} · {fmtDate(work?.follow_up_date)}</span></div>}
              <div className="detail-badges"><span className={`status-pill ${selected.status === "Churned" ? "churned" : ""}`}>{selected.status || "Status unknown"}</span><span className="tag plan">{selected.current_plan || "Plan unknown"}</span>{selected.billing_period && <span className="tag">{selected.billing_period} billing</span>}</div>
              <h3 className="section-title">Account details</h3>
              <div className="detail-grid">
                <DetailItem label="Lifetime total billed" value={fmtMoney(selected.total_billed)} money />
                <DetailItem label="Invoice activity" value={`${fmtNumber(selected.paid_invoice_count)} paid · ${fmtNumber(selected.unpaid_invoice_count)} unpaid · ${fmtNumber(selected.invoice_count)} total`} />
                <DetailItem label="Feature adoption" value={`${fmtNumber(selected.adopted_feature_count)} adopted of ${fmtNumber(selected.feature_record_count)} recorded`} />
                <DetailItem label="Monthly active users" value={fmtNumber(selected.total_monthly_active_users)} />
                <DetailItem label="Region · industry" value={`${selected.region || "—"} · ${selected.industry || "—"}`} />
                <DetailItem label="Company size" value={`${selected.company_size || "—"}${selected.employee_count != null ? ` · ${fmtNumber(selected.employee_count)} employees` : ""}`} />
                <DetailItem label="Account owner" value={selected.account_owner || "—"} />
                <DetailItem label="Customer success manager" value={selected.csm || "—"} />
                <DetailItem label="Acquisition source" value={selected.acquisition_source || "—"} />
                <DetailItem label="Starting seats · discount" value={`${fmtNumber(selected.starting_seats)} · ${selected.contract_discount == null ? "—" : `${selected.contract_discount}%`}`} />
                <DetailItem label="Signup" value={fmtDate(selected.signup_date)} /><DetailItem label="Converted" value={fmtDate(selected.converted_date)} />
                <DetailItem label="First feature use" value={fmtDate(selected.first_feature_use_date)} /><DetailItem label="Last feature use" value={fmtDate(selected.last_feature_use_date)} />
                <DetailItem label="Last invoice" value={fmtDate(selected.last_invoice_date)} /><DetailItem label="Last paid" value={fmtDate(selected.last_paid_date)} />
                {selected.churned_date && <DetailItem label="Churned" value={fmtDate(selected.churned_date)} />}
                {selected.churn_reason && <DetailItem label="Churn reason" value={selected.churn_reason} />}
              </div>

              <h3 className="section-title">Follow-up</h3>
              {workRows.loading ? <div className="skeleton form-skeleton" aria-label="Loading saved follow-up" /> : workRows.error ? <ErrorState text={`Follow-up details failed to load: ${workRows.error}`} retry={() => workRows.refresh()} /> :
                <div className="workflow-form">
                  <label>Next step<textarea rows={3} value={workForm.next_step} onChange={event => setWorkForm({ ...workForm, next_step: event.target.value })} placeholder="Record the next account action" /></label>
                  <label>Follow-up date<input type="date" value={workForm.follow_up_date} onChange={event => setWorkForm({ ...workForm, follow_up_date: event.target.value })} /></label>
                  <label>Follow-up assignee<input value={workForm.assigned_to} onChange={event => setWorkForm({ ...workForm, assigned_to: event.target.value })} placeholder="Assign a follow-up owner" /></label>
                  <div className="form-actions"><button className="btn btn-primary" disabled={savingWork} onClick={saveWork}>{savingWork ? "Saving…" : "Save follow-up"}</button>{workFeedback && <span className="success"><Check size={15} />{workFeedback}</span>}</div>
                  {workError && <div className="inline-error" role="alert">{workError}</div>}
                </div>}

              <h3 className="section-title">Account notes</h3>
              <div className="workflow-form">
                <label>Add a note<textarea rows={3} value={noteText} onChange={event => setNoteText(event.target.value)} placeholder="Write a note for this account" /></label>
                <div className="form-actions"><button className="btn btn-primary" disabled={savingNote || !noteText.trim()} onClick={saveNote}>{savingNote ? "Saving…" : "Add note"}</button>{noteFeedback && <span className="success"><Check size={15} />{noteFeedback}</span>}</div>
                {noteError && <div className="inline-error" role="alert">{noteError}</div>}
              </div>
              {activities.error ? <ErrorState text={`Note history failed to load: ${activities.error}`} retry={() => activities.refresh()} />
                : activities.loading && !activities.rows.length ? <div className="skeleton form-skeleton" aria-label="Loading notes" />
                : !activities.rows.length ? <EmptyState text="No notes recorded for this account yet." />
                : <ol className="activity-list">{activities.rows.map(row => <li key={row.__row_id}><p>{row.note || ""}</p><div>{row.created_by || "Unknown author"} · {fmtDate(row.created_at)}</div></li>)}</ol>}
            </>}
        </aside>
      </div>}
      {message && <div className="toast" role="status">{message}</div>}
      {failure && <div className="toast toast-error" role="alert">{failure}<button aria-label="Dismiss message" onClick={() => setFailure("")}><X size={14} /></button></div>}
    </main>
  );
}

function DetailItem({ label, value, money = false }: { label: string; value: string; money?: boolean }) {
  return <div className="detail-item"><div className="metric-label">{label}</div><div className={`metric-value ${money ? "money" : ""}`}>{value}</div></div>;
}
function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
  return <div className="empty"><Ship size={22} /><p>{text}</p>{action}</div>;
}
function ErrorState({ text, retry }: { text: string; retry?: () => void }) {
  return <div className="error" role="alert"><CircleAlert size={17} /><span>{text}</span>{retry && <button className="text-button" onClick={retry}><RefreshCw size={14} /> Retry</button>}</div>;
}
function AccountCard({ account, onOpen }: { account: Account; onOpen: (id: number | null, target?: HTMLElement) => void }) {
  const open = (event: React.MouseEvent<HTMLElement>) => onOpen(account.account_id, event.currentTarget);
  return <article className="card" tabIndex={0} role="button" aria-label={`Open ${account.account_name || "account"} dossier`} onClick={open} onKeyDown={event => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(account.account_id, event.currentTarget); }
  }}>
    <div className="card-head"><div><div className="card-name">{account.account_name || "Unnamed account"}</div><div className="card-domain">{account.domain || "Domain not recorded"}</div></div>
      <span className={`status-pill ${account.status === "Churned" ? "churned" : ""}`}>{account.status || "Status unknown"}</span></div>
    <div className="card-meta"><span className="tag plan">{account.current_plan || "Plan unknown"}</span>{account.region && <span className="tag"><MapPin size={12} /> {account.region}</span>}{account.company_size && <span className="tag">{account.company_size}</span>}</div>
    <div className="card-bottom">
      <div><div className="metric-label">Lifetime billed</div><div className="metric-value money">{fmtMoney(account.total_billed)}</div></div>
      <div><div className="metric-label">Adopted / recorded</div><div className="metric-value">{fmtNumber(account.adopted_feature_count)} / {fmtNumber(account.feature_record_count)}</div></div>
      <div><div className="metric-label">Signed up</div><div className="metric-value">{fmtDate(account.signup_date)}</div></div>
      <div><div className="metric-label">Unpaid invoices</div><div className="metric-value">{fmtNumber(account.unpaid_invoice_count)}</div></div>
    </div>
    <div className="card-meta"><span className="tag">{account.account_owner || "No account owner"}</span>{account.csm && <span className="tag">CSM · {account.csm}</span>}<ChevronRight size={16} className="card-chevron" /></div>
  </article>;
}

const STYLES = `
:root{color-scheme:dark;--accent:#2f79d8;--surface:#102635;--surface-raised:#142d3c;--ink:#f4f7fb;--muted:#9eafc3;--line:#294252;--accent-soft:#dce8f6;--teal:#70b7ac;--danger:#e18e77;--radius:14px;--space-1:4px;--space-2:8px;--space-3:12px;--space-4:16px;--space-5:22px;--space-6:30px;--font-body:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;--font-display:ui-serif,Georgia,serif;--font-figure:ui-monospace,SFMono-Regular,monospace;--shadow:0 12px 32px #0002;--navy:#061326}
*{box-sizing:border-box}body{margin:0;background:var(--navy);color:var(--ink);font-family:var(--font-body)}button,input,select,textarea{font:inherit}button{color:inherit}.app{min-height:100vh;background:radial-gradient(ellipse at 50% -20%,#123b72 0,transparent 48%),var(--navy);padding:26px clamp(16px,4vw,54px) 60px}.shell{max-width:1440px;margin:auto}
.topbar{display:flex;justify-content:space-between;align-items:center;gap:18px;border-bottom:1px solid var(--line);padding:0 0 20px}.brand{display:flex;align-items:center;gap:13px}.brand-mark{width:44px;height:44px;display:grid;place-items:center;border:1px solid #467bc4;border-radius:14px;color:var(--accent-soft);background:linear-gradient(145deg,#174783,#0e202d);box-shadow:0 5px 20px #0003}.eyebrow{color:var(--accent-soft);font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:750}h1{font:600 clamp(22px,3vw,30px)/1.1 var(--font-display);margin:4px 0 0;letter-spacing:-.03em}.top-note,.muted{color:var(--muted);font-size:13px}.top-note{display:flex;align-items:center;gap:8px}
.hero{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding:26px 0 20px}.hero h2,.workspace h2{font:600 clamp(25px,3vw,35px)/1.1 var(--font-display);letter-spacing:-.025em;margin:0 0 8px}.hero p,.workspace-head p{margin:0;color:var(--muted);font-size:14px;line-height:1.5}.saved-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.saved-controls input,.saved-controls select,.sort-control select,.pagination select{min-height:42px;border:1px solid var(--line);border-radius:9px;background:#102432;color:var(--ink);padding:0 11px;min-width:125px}
.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.summary-card{min-width:0;text-align:left;display:flex;flex-direction:column;gap:7px;border:1px solid var(--line);border-radius:var(--radius);background:linear-gradient(145deg,#112836,#0d202c);padding:16px;cursor:pointer;transition:border-color .18s,background .18s}.summary-card:hover,.summary-card.selected{border-color:#467bc4;background:#122d43}.summary-card:disabled{opacity:.6;cursor:not-allowed}.summary-card span{font-size:12px;color:var(--muted)}.summary-card strong{font:600 clamp(22px,2.5vw,30px) var(--font-figure);font-variant-numeric:tabular-nums;color:var(--accent-soft);overflow-wrap:anywhere}.summary-card small{font-size:11px;line-height:1.4;color:var(--muted)}
.controls{border:1px solid var(--line);background:#0c1e2a;border-radius:var(--radius);padding:12px;margin-top:18px;display:grid;grid-template-columns:minmax(0,1.5fr) repeat(4,minmax(0,1fr));gap:9px;box-shadow:var(--shadow)}.controls>*{min-width:0}.controls select{min-width:0;width:100%;font-size:13px}.kpi-skeleton{height:31px;width:72%;border-radius:6px;background:linear-gradient(90deg,#102432 25%,#17303e 45%,#102432 65%);background-size:200% 100%;animation:shimmer 1.4s infinite}.kpi-error{font:600 14px var(--font-body)!important;color:#edb09a!important}.search-wrap{position:relative}.search-wrap svg{position:absolute;top:13px;left:13px;color:var(--muted)}.search-wrap input,.controls select,.workflow-form input,.workflow-form textarea{width:100%;min-height:44px;border:1px solid #304858;border-radius:9px;background:#102432;color:var(--ink);outline:none}.search-wrap input{padding:0 12px 0 40px}.search-wrap input::placeholder,.workflow-form input::placeholder,.workflow-form textarea::placeholder{color:#a0afbd}.controls select{padding:0 10px}.search-wrap input:focus,.controls select:focus,.saved-controls input:focus,.saved-controls select:focus,.workflow-form input:focus,.workflow-form textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px #2f79d833}
.active-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px}.active-filters>span{font-size:12px;color:var(--muted)}.filter-chip{display:inline-flex;align-items:center;gap:6px;min-height:34px;border:1px solid #385264;border-radius:999px;background:#102432;color:var(--ink);padding:0 10px;font-size:12px;cursor:pointer}.filter-chip:hover,.filter-chip.active{border-color:var(--accent);background:#122d50}
.chart-section{margin-top:20px}.section-toggle{display:flex;align-items:center;gap:9px;min-height:44px;border:0;background:transparent;color:var(--ink);font-weight:650;cursor:pointer;padding:0 4px}.section-toggle svg:last-child{transition:transform .18s}.section-toggle .collapsed{transform:rotate(-90deg)}.charts-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;margin-top:8px}.panel{min-width:0;border:1px solid var(--line);border-radius:var(--radius);background:linear-gradient(145deg,#112836,#0d202c);padding:17px}.chart-panel h3{font:600 19px var(--font-display);margin:0 0 5px}.chart-panel .muted{margin:0 0 12px;font-size:12px}.chart-panel:nth-child(3){grid-column:1/-1}.chart-options{display:flex;flex-wrap:wrap;gap:7px;margin-top:6px}.chart-skeleton{height:230px}
.workspace{margin-top:28px}.workspace-head{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;margin-bottom:12px}.workspace h2{font-size:27px;margin-bottom:5px}.workspace-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.sort-control{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)}.sort-control select{min-width:150px}.icon-toggle{display:grid;place-items:center;min-width:42px;min-height:42px;border:1px solid var(--line);border-radius:9px;background:#102432;color:var(--muted);cursor:pointer}.icon-toggle.active{border-color:#467bc4;color:var(--accent-soft);background:#122d50}
.manifest{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.card{position:relative;min-width:0;border:1px solid var(--line);border-radius:var(--radius);padding:17px;background:linear-gradient(145deg,#112836,#0d202c);transition:transform .18s,border-color .18s,background .18s;cursor:pointer;overflow:hidden}.card:hover{transform:translateY(-2px);border-color:#467bc4;background:linear-gradient(145deg,#173b68,#102531)}.card:focus-visible,.close:focus-visible,.btn:focus-visible,.summary-card:focus-visible,.sort-button:focus-visible,.icon-toggle:focus-visible,.filter-chip:focus-visible{outline:2px solid var(--accent);outline-offset:3px}.card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.card-name{font-size:17px;font-weight:680;line-height:1.3;overflow-wrap:anywhere}.card-domain{color:var(--muted);font-size:12px;margin-top:4px;overflow-wrap:anywhere}.status-pill{display:inline-flex;align-items:center;border:1px solid #3d625c;border-radius:999px;color:#a9d7c7;background:#173a37;padding:5px 9px;font-size:11px;white-space:nowrap}.status-pill.churned{border-color:#754d43;background:#392722;color:#edb09a}.card-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px;align-items:center}.tag{display:inline-flex;align-items:center;gap:4px;border:1px solid #2d4654;border-radius:7px;padding:5px 8px;color:#c0cbd0;font-size:11px}.tag.plan{color:var(--accent-soft);border-color:#42638b;background:#172e48}.card-bottom{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;border-top:1px solid #263e4b;margin-top:14px;padding-top:13px}.metric-label{color:var(--muted);font-size:10px;letter-spacing:.07em;text-transform:uppercase;margin-bottom:5px}.metric-value{font-size:13px;font-weight:600;color:#e9e6dc;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.metric-value.money{color:var(--accent-soft)}.card-chevron{margin-left:auto;color:var(--muted)}
.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:12px}.account-table{width:100%;border-collapse:collapse;text-align:left;font-size:13px}.account-table th,.account-table td{padding:11px 12px;border-bottom:1px solid var(--line);vertical-align:top}.account-table th{color:var(--accent-soft);font-size:11px;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}.account-table td{color:#dce2dc;overflow-wrap:anywhere}.account-table tbody tr{cursor:pointer}.account-table tbody tr:hover,.account-table tbody tr:focus{background:#142d3c;outline:none}.table-sort{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:inherit;cursor:pointer;text-transform:inherit;letter-spacing:inherit;min-height:36px;padding:0}
.pagination{display:flex;justify-content:flex-end;align-items:center;gap:12px;margin-top:14px;color:var(--muted);font-size:12px}.pagination label{display:flex;align-items:center;gap:6px}.pagination select{min-width:64px}
.btn{min-height:42px;border:1px solid transparent;border-radius:9px;padding:0 13px;font-weight:650;cursor:pointer;transition:background .18s,border-color .18s}.btn-primary{background:var(--accent);color:white}.btn-primary:hover{background:#3e88e8}.btn-secondary{border-color:#385264;background:#102432;color:var(--ink)}.btn-secondary:hover{border-color:#5b7588;background:#17303e}.btn:disabled{opacity:.55;cursor:not-allowed}.text-button{display:inline-flex;align-items:center;gap:6px;min-height:36px;border:0;background:transparent;color:var(--accent-soft);cursor:pointer;padding:0 7px}.text-button:hover{text-decoration:underline}
.empty,.error{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;border:1px solid var(--line);border-radius:var(--radius);background:#102432;padding:24px;text-align:center;color:var(--muted);grid-column:1/-1}.empty{flex-direction:column}.empty p{margin:0}.error{color:#edb09a}.skeleton{height:170px;border:1px solid var(--line);border-radius:var(--radius);background:linear-gradient(90deg,#102432 25%,#17303e 45%,#102432 65%);background-size:200% 100%;animation:shimmer 1.4s infinite}.detail-skeleton{height:220px;margin-top:20px}@keyframes shimmer{to{background-position:-200% 0}}
.detail-backdrop{position:fixed;inset:0;background:#02080dcc;z-index:5;display:flex;justify-content:flex-end}.detail-panel{width:min(620px,100%);height:100%;overflow:auto;background:linear-gradient(160deg,#122c3b,#091923);border-left:1px solid #52614a;padding:24px clamp(16px,4vw,32px);box-shadow:-20px 0 60px #0005}.detail-top{display:flex;justify-content:space-between;align-items:center}.close{border:1px solid var(--line);background:#102432;border-radius:10px;width:42px;height:42px;display:grid;place-items:center;cursor:pointer}.detail-panel h2{font:600 30px/1.12 var(--font-display);margin:24px 0 7px;overflow-wrap:anywhere}.detail-domain{color:var(--muted);overflow-wrap:anywhere}.detail-badges{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.section-title{font-size:12px;text-transform:uppercase;letter-spacing:.13em;color:var(--accent-soft);margin:24px 0 11px}.detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.detail-item{padding:12px;border:1px solid var(--line);border-radius:10px;background:#102431;min-width:0}.detail-item .metric-value{font-size:13px;line-height:1.45}.detail-item .metric-value.money{font-size:18px}.due-banner{display:flex;align-items:center;gap:9px;padding:11px 13px;border:1px solid #3d625c;border-radius:10px;color:#b4ddd0;background:#173a37;margin:14px 0}.due-banner.overdue{border-color:#754d43;color:#edb09a;background:#392722}.workflow-form{display:grid;gap:12px}.workflow-form label{display:grid;gap:6px;color:#c3ced5;font-size:12px}.workflow-form input,.workflow-form textarea{padding:10px 11px;resize:vertical}.form-actions{display:flex;align-items:center;gap:12px}.success{display:inline-flex;align-items:center;gap:5px;color:#a9d7c7;font-size:13px}.inline-error{color:#edb09a;font-size:13px;line-height:1.5}.form-skeleton{height:160px}.activity-list{list-style:none;margin:0;padding:0}.activity-list li{padding:13px 0;border-bottom:1px solid var(--line)}.activity-list p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5;margin:0 0 7px}.activity-list li div{font-size:12px;color:var(--muted)}.toast{position:fixed;z-index:10;right:18px;bottom:18px;border:1px solid #3d625c;border-radius:10px;background:#173a37;color:#b4ddd0;padding:12px 16px;box-shadow:var(--shadow)}.toast-error{display:flex;gap:10px;align-items:center;border-color:#754d43;background:#392722;color:#edb09a}.toast-error button{background:transparent;border:0;cursor:pointer;color:inherit;min-width:32px;min-height:32px}
@media(max-width:980px){.controls{grid-template-columns:repeat(2,minmax(0,1fr))}.search-wrap{grid-column:1/-1}.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.saved-controls{justify-content:flex-start}.workspace-head{align-items:flex-start;flex-direction:column}}
@media(max-width:660px){.app{padding:18px 14px 40px}.top-note{display:none}.hero{align-items:flex-start;flex-direction:column}.saved-controls{width:100%}.saved-controls input{flex:1;min-width:100px}.controls{grid-template-columns:1fr 1fr}.search-wrap{grid-column:1/-1}.summary-grid{gap:8px}.summary-card{padding:12px}.charts-grid{grid-template-columns:1fr}.chart-panel:nth-child(3){grid-column:auto}.manifest{grid-template-columns:1fr}.card-bottom{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:13px}.workspace-actions{width:100%}.sort-control{flex:1}.sort-control select{min-width:0;flex:1}.table-wrap{overflow-x:auto}.account-table{min-width:850px}.pagination{justify-content:center;flex-wrap:wrap}.detail-grid{grid-template-columns:1fr 1fr}}
@media(max-width:380px){.controls{grid-template-columns:1fr}.search-wrap{grid-column:auto}.summary-grid{grid-template-columns:1fr}.detail-grid{grid-template-columns:1fr}.saved-controls>*{width:100%}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}
::selection{background:#2f79d866;color:#fff}*:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
`;

export default function PirateAccountTreasureAppStyled() {
  return <><style>{STYLES}</style><PirateAccountTreasureApp /></>;
}