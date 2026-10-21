import { useState } from "react";
import { Activity, ChevronDown, ChevronUp, CircleDollarSign, CalendarDays, Layers3, UserRound } from "lucide-react";
import { useRows } from "@meridian/app";

type Account = {
  __row_id: string; account_id: number | null; account: string | null; owner: string | null;
  csm: string | null; region: string | null; plan: string | null; mrr: number | null;
  renewal: string | null; past_due: number | null; adopted: number | null; features: number | null;
  last_used: string | null; pipeline: number | null; lane: string | null;
};
type Props = { result: { rows: Account[]; total: number; loading: boolean; error?: string }; search: string };

const money = (n: number | null) => n == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const date = (v: string | null) => {
  if (!v) return "Not set";
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? v : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(d);
};

export function AccountQueue({ result, search }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const accountIds = result.rows.flatMap(a => a.account_id == null ? [] : [a.account_id]);
  const work = useRows("account_work", {
    filters: accountIds.length ? [{ column: "account_id", values: accountIds }] : [],
    limit: 50,
    enabled: accountIds.length > 0,
  });
  const pickedAccount = result.rows.find(a => a.account_id === picked);
  return (
    <div className="queue-layout">
      <section className="queue-panel" aria-label="Account list">
        <div className="queue-heading">
          <div><h2>Accounts</h2><p>{result.total.toLocaleString()} matching accounts</p></div>
          <span className="sort-note">Ordered by past-due balance</span>
        </div>
        {result.error ? <div className="error-state">Accounts could not be loaded. Try changing a filter or refreshing the page.</div> :
          result.loading && !result.rows.length ? <div className="skeleton-list" aria-label="Loading accounts">{[1,2,3,4].map(n => <div className="skeleton-row" key={n}><i /><span /><span /></div>)}</div> :
          !result.rows.length ? <div className="empty-state"><h3>{search ? "No matching accounts" : "No accounts in this view"}</h3><p>{search ? "Try another search or clear filters." : "Change the filters to see accounts in other action lanes."}</p></div> :
          <>
            {result.total > result.rows.length && <p className="showing-note">Showing {result.rows.length} of {result.total.toLocaleString()} accounts</p>}
            <div className="account-list">{result.rows.map(a => {
              const isPicked = picked === a.account_id;
              return <button className={`account-row ${isPicked ? "selected" : ""}`} key={a.__row_id} onClick={() => setPicked(isPicked ? null : a.account_id)}>
                <span className="account-main">
                  <span className="account-title">{a.account || "Unnamed account"} {isPicked ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                  <span className="account-sub">{a.owner || "Owner not set"} <span className="dot">·</span> {a.region || "Region not set"} <span className="dot">·</span> {a.plan || "Plan not set"}</span>
                  <span className="account-tags"><span className={`pill ${a.past_due && a.past_due > 0 ? "pill-alert" : ""}`}>{a.lane || "No action lane"}</span>
                    {a.past_due != null && a.past_due > 0 && <span className="pill pill-alert">Past due</span>}
                    {a.adopted != null && a.adopted <= 2 && <span className="pill pill-warm">Low adoption</span>}</span>
                </span>
                <span className="account-metrics">
                  <span><small>Active MRR</small><b>{money(a.mrr)}</b></span>
                  <span className={a.past_due && a.past_due > 0 ? "due-value" : ""}><small>Past due</small><b>{money(a.past_due)}</b></span>
                  <span><small>Adoption</small><b>{a.adopted ?? "—"}<em> / {a.features ?? "—"} features</em></b></span>
                </span>
                {isPicked && pickedAccount && <AccountDetail account={pickedAccount} work={work} />}
              </button>;
            })}</div>
          </>}
      </section>
      <aside className="side-note">
        <div className="side-note-title"><CircleDollarSign size={18} /><h2>Prioritize the work</h2></div>
        <p>Accounts are ordered by past-due balance, then adopted feature count. Use the filters to focus on overdue balances or accounts with low adoption.</p>
        <div className="side-rule" />
        <div className="side-note-title"><Layers3 size={17} /><h3>Account signals</h3></div>
        <p>Review renewal timing, feature usage and open pipeline alongside each account’s follow-up plan.</p>
      </aside>
    </div>
  );
}

function AccountDetail({ account, work }: { account: Account; work: { rows: ReturnType<typeof useRows<"account_work">>["rows"]; loading: boolean; error?: string } }) {
  const saved = work.rows.find(row => row.account_id === account.account_id);
  return <div className="detail-panel" onClick={e => e.stopPropagation()}>
    <div className="detail-grid">
      <div className="detail-item"><CalendarDays size={15} /><span><small>First renewal</small><b>{date(account.renewal)}</b></span></div>
      <div className="detail-item"><Activity size={15} /><span><small>Last feature use j</small><b>{date(account.last_used)}</b></span></div>
      <div className="detail-item"><CircleDollarSign size={15} /><span><small>Open pipeline</small><b>{money(account.pipeline)}</b></span></div>
      <div className="detail-item"><UserRound size={15} /><span><small>Customer success manager</small><b>{account.csm || "Not set"}</b></span></div>
    </div>
    {work.error ? <p className="error-inline">Follow-up details could not be loaded.</p> :
      work.loading && !saved ? <div className="detail-loading">Loading follow-up…</div> :
      saved ? <FollowUpForm key={saved.__row_id} row={saved} /> : <p className="error-inline">No follow-up record is available for this account.</p>}
  </div>;
}

function FollowUpForm({ row }: { row: NonNullable<ReturnType<typeof useRows<"account_work">>["rows"][number]> }) {
  const [step, setStep] = useState(row.next_step || "");
  const [followDate, setFollowDate] = useState(row.follow_up_date || "");
  const [status, setStatus] = useState(row.follow_up_status || "Not started");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const save = async () => {
    setSaving(true); setNotice(""); setError("");
    try {
      const { updateRow } = await import("@meridian/app");
      await updateRow("account_work", row, {
        next_step: step || null,
        follow_up_date: followDate || null,
        follow_up_status: status,
      });
      setNotice("Saved");
      window.setTimeout(() => setNotice(""), 3500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Follow-up could not be saved. Try again.");
    } finally { setSaving(false); }
  };
  return <div className="followup">
    <h3>Follow-up</h3>
    <label className="field-label">Next step<textarea value={step} onChange={e => setStep(e.target.value)} placeholder="Add the next account action" rows={2} /></label>
    <div className="followup-row">
      <label className="field-label">Follow-up date<input type="date" value={followDate} onChange={e => setFollowDate(e.target.value)} /></label>
      <label className="field-label">Status<select value={status} onChange={e => setStatus(e.target.value as typeof status)}><option>Not started</option><option>In progress</option><option>Done</option></select></label>
      <button className="btn btn-primary save-button" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save next step"}</button>
    </div>
    {notice && <span className="save-notice" role="status">{notice}</span>}
    {error && <p className="error-inline" role="alert">{error}</p>}
  </div>;
}