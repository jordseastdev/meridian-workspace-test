import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X, Save, RotateCcw, UserRound } from "lucide-react";
import { useRows, updateRow } from "@meridian/app";
import type { Row } from "@meridian/app";
import { AccountData } from "./AccountData";

const PAGE_SIZE = 25;
const START_DATE = "2022-01-02";
const END_DATE = "2025-09-28";

type Account = Row<"accounts">;
type Work = Row<"account_work">;
type Props = { notice: string; setNotice: (value: string) => void };

const text = (value: unknown) => value == null || value === "" ? "—" : String(value);
const date = (value: string | null) => value ? value : "—";
const integer = (value: number | null) => value == null ? "—" : new Intl.NumberFormat().format(value);
const money = (value: number | null) => value == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

function Pill({ children }: { children: string }) {
  return <span className="pill">{children}</span>;
}

function SkeletonRows() {
  return <div className="skeleton-list" aria-label="Loading accounts">{Array.from({ length: 5 }, (_, i) => <div className="skeleton-row" key={i} />)}</div>;
}

export function AccountWorkspace({ notice, setNotice }: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [owner, setOwner] = useState("");
  const [csm, setCsm] = useState("");
  const [from, setFrom] = useState(START_DATE);
  const [to, setTo] = useState(END_DATE);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [collected, setCollected] = useState<Account[]>([]);
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [activeTab, setActiveTab] = useState<"accounts" | "data">("accounts");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(() => {
    const result: any[] = [
      { column: "signup_date", min: from || undefined, max: to || undefined },
    ];
    if (region) result.push({ column: "region", values: [region] });
    if (status) result.push({ column: "status", values: [status] });
    if (plan) result.push({ column: "current_plan", values: [plan] });
    if (owner) result.push({ column: "account_owner", values: [owner] });
    if (csm === "__unassigned") result.push({ column: "csm", values: [null] });
    else if (csm) result.push({ column: "csm", values: [csm] });
    if (cursor !== undefined) result.push({ column: "account_id", min: cursor + 1 });
    return result;
  }, [region, status, plan, owner, csm, from, to, cursor]);

  const read = useRows("accounts", {
    filters,
    search,
    sort: [{ column: "account_id", direction: "asc" }],
    limit: 1000,
  });

  const countRead = useRows("accounts", {
    filters: useMemo(() => {
      const result: any[] = [{ column: "signup_date", min: from || undefined, max: to || undefined }];
      if (region) result.push({ column: "region", values: [region] });
      if (status) result.push({ column: "status", values: [status] });
      if (plan) result.push({ column: "current_plan", values: [plan] });
      if (owner) result.push({ column: "account_owner", values: [owner] });
      if (csm === "__unassigned") result.push({ column: "csm", values: [null] });
      else if (csm) result.push({ column: "csm", values: [csm] });
      return result;
    }, [region, status, plan, owner, csm, from, to]),
    search,
    limit: 1,
  });

  const identity = [search, region, status, plan, owner, csm, from, to].join("|");
  const [loadedIdentity, setLoadedIdentity] = useState(identity);

  useEffect(() => {
    if (loadedIdentity !== identity) {
      setCollected([]);
      setCursor(undefined);
      setPage(0);
      setLoadedIdentity(identity);
      return;
    }
    if (read.loading || read.error || !read.rows.length) return;
    setCollected(previous => {
      const known = new Set(previous.map(row => row.account_id));
      const next = [...previous, ...(read.rows as Account[]).filter(row => !known.has(row.account_id))];
      return next;
    });
    const last = read.rows[read.rows.length - 1] as Account;
    if (read.total > read.rows.length && last?.account_id != null && cursor !== last.account_id) {
      setCursor(last.account_id);
    }
  }, [read.rows, read.loading, read.error, identity, loadedIdentity, read.total, cursor]);

  const selectedRead = useRows("accounts", {
    filters: [{ column: "account_id", values: [picked] }],
    limit: 1,
    enabled: picked !== null,
  });
  const workRead = useRows("account_work", {
    filters: [{ column: "account_id", values: [picked] }],
    limit: 1,
    enabled: picked !== null,
  });
  const account = (selectedRead.rows as Account[])[0];
  const work = (workRead.rows as Work[])[0];

  useEffect(() => {
    if (picked === null || workRead.loading) return;
    setNotes(work?.notes ?? "");
    setFollowUp(work?.follow_up_date ?? "");
    setFeedback("");
  }, [picked, workRead.loading, work?.notes, work?.follow_up_date]);

  const dirty = !!work && (notes !== (work.notes ?? "") || followUp !== (work.follow_up_date ?? ""));
  const pageCount = Math.max(1, Math.ceil(collected.length / PAGE_SIZE));
  const visible = collected.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const uniqueOptions = (key: keyof Account) => Array.from(new Set(collected.map(a => a[key]).filter((v): v is string => typeof v === "string" && !!v))).sort();

  const changeSelection = (id: number) => {
    if (picked !== null && dirty && !window.confirm("Discard your unsaved changes and open another account?")) return;
    setPicked(id);
    setFeedback("");
  };

  const handleSave = async () => {
    if (!work || !account) return;
    setSaving(true);
    setFeedback("");
    try {
      await updateRow("account_work", work, {
        notes: notes || null,
        follow_up_date: followUp || null,
      });
      setFeedback("Saved");
      setNotice(`Saved account ${account.account_id}`);
      setTimeout(() => setFeedback(""), 4000);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    setNotes(work?.notes ?? "");
    setFollowUp(work?.follow_up_date ?? "");
    setFeedback("");
  };

  const clearFilters = () => {
    setRegion(""); setStatus(""); setPlan(""); setOwner(""); setCsm("");
    setFrom(START_DATE); setTo(END_DATE);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">M</div>
        <div className="brand-copy"><span className="eyebrow">MERIDIAN · CUSTOMER OPERATIONS</span><h1>Accounts</h1></div>
        <div className="topbar-right"><span className="live-dot" /> Governed account data</div>
      </header>

      <section className="intro">
        <div><p className="eyebrow">ACCOUNT DIRECTORY</p><h2>YAHHHHH<br /><em>YAHHHHH</em></h2></div>
        <p className="intro-note">Search your portfolio, review account activity, and keep follow-up notes close to the facts.</p>
      </section>

      <nav className="view-tabs" aria-label="Account views">
        <button className={`view-tab ${activeTab === "accounts" ? "active" : ""}`} onClick={() => setActiveTab("accounts")}>Accounts</button>
        <button className={`view-tab ${activeTab === "data" ? "active" : ""}`} onClick={() => setActiveTab("data")}>Data</button>
      </nav>

      {activeTab === "data" ? <AccountData /> : <section className="workspace">
        <div className="directory card">
          <div className="directory-heading">
            <div><p className="eyebrow">PORTFOLIO</p><h3>Account directory</h3></div>
            <span className="result-count">{countRead.loading ? "…" : integer(countRead.total)} <small>matching</small></span>
          </div>
          <label className="searchbox"><Search size={18} /><input value={searchInput} onChange={e => { setSearchInput(e.target.value); setPage(0); }} placeholder="Search account name or ID" /><kbd>⌕</kbd></label>
          <div className="filters-title"><SlidersHorizontal size={15} /><span>Refine accounts</span><button className="text-button" onClick={clearFilters}>Reset</button></div>
          <div className="filter-grid">
            <label>Region<select value={region} onChange={e => setRegion(e.target.value)}><option value="">All regions</option>{uniqueOptions("region").map(v => <option key={v}>{v}</option>)}</select></label>
            <label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{uniqueOptions("status").map(v => <option key={v}>{v}</option>)}</select></label>
            <label>Current plan<select value={plan} onChange={e => setPlan(e.target.value)}><option value="">All plans</option>{uniqueOptions("current_plan").map(v => <option key={v}>{v}</option>)}</select></label>
            <label>Account owner<select value={owner} onChange={e => setOwner(e.target.value)}><option value="">All owners</option>{uniqueOptions("account_owner").map(v => <option key={v}>{v}</option>)}</select></label>
            <label>CSM<select value={csm} onChange={e => setCsm(e.target.value)}><option value="">All CSMs</option><option value="__unassigned">Unassigned</option>{uniqueOptions("csm").map(v => <option key={v}>{v}</option>)}</select></label>
            <div className="date-filter"><span>Signup date</span><div><input aria-label="Signup date from" type="date" value={from} onChange={e => setFrom(e.target.value)} /><span>to</span><input aria-label="Signup date to" type="date" value={to} onChange={e => setTo(e.target.value)} /></div></div>
          </div>
          <div className="list-meta"><span>{read.loading && collected.length === 0 ? "Loading accounts…" : `Showing ${visible.length ? page * PAGE_SIZE + 1 : 0}–${Math.min((page + 1) * PAGE_SIZE, collected.length)} of ${integer(countRead.total)}`}</span><span>One account per ID</span></div>
          {read.error ? <div className="state-message error">{read.error}</div> : read.loading && !collected.length ? <SkeletonRows /> : !visible.length ? <div className="empty-state"><Search size={22} /><strong>No accounts found</strong><span>Try changing the search or filters.</span></div> : (
            <div className="account-list">
              {visible.map(row => <button key={row.account_id} className={`account-row ${picked === row.account_id ? "selected" : ""}`} onClick={() => row.account_id != null && changeSelection(row.account_id)}>
                <span className="avatar">{(row.account_name || "A").slice(0, 1).toUpperCase()}</span>
                <span className="account-summary"><strong>{text(row.account_name)}</strong><small>ID {text(row.account_id)} <i>·</i> {text(row.region)}</small></span>
                <span className="row-plan"><Pill>{text(row.status)}</Pill><small>{text(row.current_plan)}</small></span>
                <ChevronRight className="row-chevron" size={17} />
              </button>)}
            </div>
          )}
          <div className="pagination"><span>Page {Math.min(page + 1, pageCount)} of {pageCount}</span><div><button className="icon-button" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} aria-label="Previous page"><ChevronLeft size={18} /></button><button className="icon-button" disabled={(page + 1) * PAGE_SIZE >= collected.length} onClick={() => setPage(p => p + 1)} aria-label="Next page"><ChevronRight size={18} /></button></div></div>
        </div>

        <aside className="detail-panel card">
          {!picked ? <div className="detail-empty"><div className="empty-icon"><UserRound size={24} /></div><p className="eyebrow">ACCOUNT DETAILS</p><h3>Select an account</h3><p>Choose a record from the directory to review its profile and manage follow-up notes.</p></div> :
          selectedRead.loading || workRead.loading ? <div className="detail-loading"><div className="skeleton-block" /><div className="skeleton-block short" /><div className="skeleton-block" /></div> :
          account ? <div className="detail-content">
            <div className="detail-head"><div><p className="eyebrow">ACCOUNT PROFILE</p><h3>{text(account.account_name)}</h3><span className="account-id">Account ID {text(account.account_id)}</span></div><button className="icon-button close-button" aria-label="Close account details" onClick={() => { if (!dirty || window.confirm("Discard your unsaved changes and close this account?")) setPicked(null); }}><X size={18} /></button></div>
            <div className="detail-tags"><Pill>{text(account.status)}</Pill><Pill>{text(account.current_plan)}</Pill></div>
            <div className="facts-grid">
              <Fact label="Region" value={account.region} /><Fact label="Industry" value={account.industry} />
              <Fact label="Account owner" value={account.account_owner} /><Fact label="CSM" value={account.csm} />
              <Fact label="Signup date" value={date(account.signup_date)} /><Fact label="Last feature use" value={date(account.last_feature_use_date)} />
              <Fact label="Adopted features" value={integer(account.adopted_feature_count)} /><Fact label="Monthly active users" value={integer(account.monthly_active_users)} />
              <Fact label="Total billed · incl. tax" value={money(account.total_billed)} /><Fact label="Paid invoices" value={integer(account.paid_invoice_count)} />
              <Fact label="Unpaid invoices" value={integer(account.unpaid_invoice_count)} />
            </div>
            <p className="ma u-note">Monthly active users is summed across features, not distinct people.</p>
            <div className="notes-section">
              <div className="section-heading"><div><p className="eyebrow">ACCOUNT WORK</p><h4>Notes &amp; follow-up</h4></div>{dirty && <span className="dirty-mark">Unsaved changes</span>}</div>
              <label className="field-label">Account Management Notes<textarea rows={5} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add current account-management notes…" /></label>
              <label className="field-label">Follow-up Date<input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} /></label>
              {dirty && <div className="review-box"><strong>Pending changes</strong><div><span>Notes</span><p><b>Before</b>{work?.notes || "No notes"}<b>After</b>{notes || "No notes"}</p></div><div><span>Follow-up date</span><p><b>Before</b>{work?.follow_up_date || "Not set"}<b>After</b>{followUp || "Not set"}</p></div></div>}
              <div className="save-row"><button className="btn btn-primary" disabled={!dirty || saving || !work} onClick={handleSave}><Save size={16} />{saving ? "Saving…" : "Save changes"}</button><button className="btn btn-secondary" disabled={!dirty || saving} onClick={cancelEdit}><RotateCcw size={15} />Cancel</button>{feedback && <span className={feedback === "Saved" ? "feedback success" : "feedback error"} role="status">{feedback}</span>}</div>
            </div>
          </div> : <div className="state-message">Account details could not be loaded.</div>}
        </aside>
      </section>}
      {notice && <div className="visually-hidden" aria-live="polite">{notice}</div>}
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string | number | null }) {
  return <div className="fact"><span>{label}</span><strong>{text(value)}</strong></div>;
}