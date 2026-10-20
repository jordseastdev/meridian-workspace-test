import React, { useEffect, useState } from "react";
import { useRows, updateRow, useUser } from "@meridian/app";
import type { Row } from "@meridian/app";
import { CalendarDays, Check, ChevronRight, Search, UserRound, X } from "lucide-react";
import "./styles.css";

type WorkRow = Row<"account_work">;

function AccountCard({ account, onPick }: { account: WorkRow; onPick: (account: WorkRow) => void }) {
  return (
    <button className="card account-card" onClick={() => onPick(account)}>
      <div className="cardtop">
        <div className="accountname">{account.account_name || "Unnamed account"}</div>
        <ChevronRight size={16} className="chevron" />
      </div>
      <div className="owner"><UserRound size={13} />{account.owner || "No account owner"}</div>
      <div className="details">
        <div><div className="detail-label">Renewal date</div><div className="detail-value">{account.renewal_date || "No renewal date"}</div></div>
        <div><div className="detail-label">Current MRR</div><div className="detail-value">{account.current_mrr == null ? "Unavailable" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(account.current_mrr)}</div></div>
      </div>
      <div className="workfields">
        <div><span>Next step</span><p>{account.next_step || "Add next step"}</p></div>
        <div><span>Step owner</span><p>{account.step_owner || "Unassigned"}</p></div>
      </div>
    </button>
  );
}

export default function RenewalBoard() {
  const user = useUser();
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [pickedAccount, setPickedAccount] = useState<WorkRow | null>(null);
  const [step, setStep] = useState("");
  const [stepOwner, setStepOwner] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [filter, setFilter] = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = (offset: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  };
  const todayString = day(0);
  const day30 = day(30);
  const day90 = day(90);
  const common = { search: filter, sort: [{ column: "renewal_date" as const, direction: "asc" as const }], limit: 50 };
  const overdue = useRows("account_work", { ...common, filters: [{ column: "renewal_date", max: day(-1) }] });
  const next30 = useRows("account_work", { ...common, filters: [{ column: "renewal_date", min: todayString, max: day30 }] });
  const next90 = useRows("account_work", { ...common, filters: [{ column: "renewal_date", min: day(31), max: day90 }] });
  const later = useRows("account_work", { ...common, filters: [{ column: "renewal_date", min: day(91) }] });
  const noDate = useRows("account_work", { ...common, filters: [{ column: "renewal_date", values: [null] }] });
  const accountsResult = useRows("accounts", { search: filter, limit: 1 });
  const pickedQuery = useRows("account_work", {
    filters: pickedId == null ? [] : [{ column: "account_id", values: [pickedId] }],
    enabled: pickedId != null,
    limit: 1,
  });
  const workForPicked = pickedQuery.rows[0] as WorkRow | undefined;

  useEffect(() => {
    if (pickedId == null || pickedQuery.loading) return;
    setStep(workForPicked?.next_step ?? "");
    setStepOwner(workForPicked?.step_owner ?? "");
  }, [pickedId, pickedQuery.loading, workForPicked?.next_step, workForPicked?.step_owner]);

  const save = async () => {
    if (pickedId == null || !workForPicked) return;
    setSaving(true);
    setNotice(null);
    try {
      await updateRow("account_work", String(pickedId), {
        next_step: step.trim() || null,
        step_owner: stepOwner.trim() || null,
      });
      setNotice({ text: "Saved" });
      setTimeout(() => setNotice(current => current?.text === "Saved" ? null : current), 4000);
    } catch (e) {
      setNotice({ text: e instanceof Error ? e.message : "Could not save changes.", error: true });
    } finally {
      setSaving(false);
    }
  };

  const closePanel = () => {
    setPickedId(null);
    setPickedAccount(null);
    setNotice(null);
  };

  const lanes = [
    { title: "Overdue", subtitle: "Before today", result: overdue },
    { title: "Next 30 days", subtitle: "Today through day 30", result: next30 },
    { title: "31–90 days", subtitle: "Days 31 through 90", result: next90 },
    { title: "Later", subtitle: "More than 90 days away", result: later },
    { title: "No renewal date", subtitle: "Date not present in source", result: noDate },
  ];

  return (
    <main className="app">
      <header className="topline">
        <div className="brand"><div className="brandmark"><CalendarDays size={17} /></div><span>Meridian</span><span className="brand-divider">/</span><span className="brand-section">Renewals</span></div>
        <div className="user">{user.name}</div>
      </header>

      <section className="hero">
        <div>
          <h1>Renewals, in focus</h1>
          <p className="subtitle">A clear view of what’s coming up—and the next step for every account.</p>
        </div>
        <div className="summary"><strong>{accountsResult.loading ? "—" : accountsResult.total}</strong><span>accounts</span></div>
      </section>

      <section className="workspace" aria-label="Renewal timing workspace">
        <div className="toolbar">
          <label className="searchbox"><Search size={16} /><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find an account" aria-label="Find an account" /></label>
          <div className="updated">Search across all renewal timing lanes</div>
        </div>

        {(overdue.error || next30.error || next90.error || later.error || noDate.error || accountsResult.error) && (
          <div className="errorbar" role="alert">{overdue.error || next30.error || next90.error || later.error || noDate.error || accountsResult.error}</div>
        )}

        <section className="board" aria-label="Accounts by renewal timing">
          {lanes.map(({ title, subtitle, result }) => {
            const accounts = result.rows as WorkRow[];
            return (
              <section className="lane" key={title}>
                <div className="lanehead">
                  <div className="lanetitle">
                    <div className="laneicon"><CalendarDays size={15} /></div>
                    <div><h2>{title}</h2><p>{subtitle}</p></div>
                  </div>
                  <span className="count">{result.loading ? "—" : result.total}</span>
                </div>
                <div className="cards">
                  {result.loading ? <><div className="skeleton" /><div className="skeleton" /></> :
                    accounts.length ? accounts.map(account => (
                      <AccountCard key={account.account_id ?? account.__row_id} account={account} onPick={selected => {
                        setPickedAccount(selected);
                        setPickedId(selected.account_id);
                        setNotice(null);
                      }} />
                    )) : <div className="empty">{filter ? "No accounts match this search." : "No accounts in this renewal window."}</div>}
                  {!result.loading && result.total > accounts.length && (
                    <div className="updated showing">Showing {accounts.length} of {result.total} accounts.</div>
                  )}
                </div>
              </section>
            );
          })}
        </section>
      </section>

      {pickedId != null && (
        <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) closePanel(); }}>
          <aside className="panel" role="dialog" aria-modal="true" aria-label="Edit renewal plan">
            <div className="paneltop">
              <div><div className="eyebrow">Renewal plan</div><h2>{pickedAccount?.account_name || "Account"}</h2></div>
              <button className="close" aria-label="Close" onClick={closePanel}><X size={18} /></button>
            </div>
            <div className="panelmeta">
              <span className="metaitem"><UserRound size={15} />{pickedAccount?.owner || "No account owner"}</span>
              <span className="metaitem">Account ID {pickedAccount?.account_id ?? "Unavailable"}</span>
              <span className="metaitem">Renewal {pickedAccount?.renewal_date || "Not dated"}</span>
            </div>
            {pickedQuery.loading ? <><div className="skeleton" /><div className="skeleton" /></> :
              !workForPicked ? <div className="missing">There isn’t an editable renewal-plan record for this account yet.</div> : <>
                <label className="formlabel" htmlFor="next-step">Next step</label>
                <div className="hint">Capture the action that will move this renewal forward.</div>
                <textarea id="next-step" value={step} onChange={(e) => setStep(e.target.value)} placeholder="Add the next action…" />
                <label className="formlabel" htmlFor="step-owner">Next step owner</label>
                <input className="textinput" id="step-owner" value={stepOwner} onChange={(e) => setStepOwner(e.target.value)} placeholder="Who’s responsible?" />
                <button className="save" onClick={save} disabled={saving}>{saving ? "Saving…" : <><Check size={17} /> Save renewal plan</>}</button>
                {notice && <div className={`notice ${notice.error ? "bad" : ""}`} role="status">{notice.text}</div>}
              </>}
          </aside>
        </div>
      )}
    </main>
  );
}