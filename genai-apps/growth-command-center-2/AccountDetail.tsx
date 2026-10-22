import { useEffect, useRef } from "react";
import { useRows } from "@meridian/app";
import { Stat } from "@meridian/ui";
import { X } from "lucide-react";
import { FollowupForm } from "./components/FollowupForm";
import { Empty, Loading, QueryError } from "./components/QueryState";
import { dateLabel, monthLabel, numberLabel } from "./lib";

export function AccountDetail({ accountId, month, onClose }: { accountId: number; month: string; onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  const account = useRows("accounts", { filters: [{ column: "account_id", values: [accountId] }], limit: 1 });
  const revenue = useRows("revenue", { filters: [{ column: "account_id", values: [accountId] }, { column: "month", values: [month] }], limit: 1 });
  const adoption = useRows("adoption", { filters: [{ column: "account_id", values: [accountId] }], sort: [{ column: "feature", direction: "asc" }], limit: 100 });
  const followup = useRows("followups", { filters: [{ column: "account_id", values: [accountId] }], limit: 1 });
  const facts = account.rows[0];

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const controls = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keyboard);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="detail-panel" role="dialog" aria-modal="true" aria-labelledby="account-title" ref={dialog} tabIndex={-1}>
        <header className="detail-header">
          <div><span className="muted">Account detail</span><h2 id="account-title">{facts?.name || (account.loading ? "Loading account…" : "Account")}</h2></div>
          <button className="btn btn-icon" aria-label="Close account detail" onClick={onClose}><X size={21} /></button>
        </header>
        <div className="detail-body">
          {account.loading ? <Loading label="Loading account facts" /> : account.error ? <QueryError message={account.error} retry={account.refresh} /> : !facts ? <Empty title="Account not found">Close this panel and choose another account.</Empty> : (
            <section className="detail-section">
              <h3>Account facts</h3>
              <dl className="facts-grid">
                <div><dt>Lifecycle status</dt><dd>{facts.status || "Not set"}</dd></div>
                <div><dt>Current plan</dt><dd>{facts.plan || "Not set"}</dd></div>
                <div><dt>Account owner</dt><dd>{facts.owner || "Not set"}</dd></div>
                <div><dt>Customer success manager</dt><dd>{facts.csm || "Not set"}</dd></div>
                <div><dt>Region</dt><dd>{facts.region || "Not set"}</dd></div>
                <div><dt>Industry</dt><dd>{facts.industry || "Not set"}</dd></div>
                <div><dt>Acquisition source</dt><dd>{facts.channel || "Not set"}</dd></div>
                <div><dt>Signup date</dt><dd>{dateLabel(facts.signup)}</dd></div>
                <div><dt>Converted date</dt><dd>{dateLabel(facts.converted)}</dd></div>
                <div><dt>Churned date</dt><dd>{dateLabel(facts.churned)}</dd></div>
                {facts.churn_reason && <div className="span-full"><dt>Churn reason</dt><dd>{facts.churn_reason}</dd></div>}
              </dl>
            </section>
          )}
          <section className="detail-section">
            <h3>Revenue · {monthLabel(month)}</h3>
            <p className="muted">Historical snapshot for this account, not its current plan.</p>
            {revenue.error ? <QueryError message={revenue.error} retry={revenue.refresh} /> : revenue.loading ? <Loading label="Loading account revenue" /> : revenue.total === 0 ? <Empty title="No revenue record for this month">This account has no snapshot in the selected revenue month.</Empty> : (
              <>
                <div className="detail-stats">
                  <Stat label="MRR" value={revenue.totals.total_mrr} format="currency" size="sm" />
                  <Stat label="ARR" value={revenue.totals.total_arr} format="currency" size="sm" />
                  <Stat label="Seats" value={revenue.totals.total_seats} format="number" size="sm" />
                </div>
                <p className="field-note">Snapshot plan: {revenue.rows[0]?.plan || "Not set"}</p>
              </>
            )}
          </section>
          <section className="detail-section">
            <h3>Feature adoption</h3>
            <p className="muted">Adoption describes usage, not proof of expansion potential. Pair counts are account-feature pairs, not distinct customers.</p>
            {adoption.error ? <QueryError message={adoption.error} retry={adoption.refresh} /> : adoption.loading ? <Loading label="Loading feature adoption" /> : adoption.total === 0 ? <Empty title="No feature adoption records">The workbook has no adoption records for this account.</Empty> : (
              <>
                <div className="detail-stats">
                  <Stat label="Account-feature pairs" value={adoption.totals.pairs} size="sm" />
                  <Stat label="Adopted pairs" value={adoption.totals.adopted_pairs} size="sm" />
                  <Stat label="Adoption rate" value={adoption.totals.adoption_rate} format="percent" size="sm" />
                </div>
                <div className="feature-list">
                  {adoption.rows.map(row => (
                    <div className="feature-row" key={row.__row_id}>
                      <div><strong>{row.feature || "Unnamed feature"}</strong><small>{row.category || "No category"}</small></div>
                      <span className="pill">{row.adopted === null ? "Not recorded" : row.adopted ? "Adopted" : "Not adopted"}</span>
                      <span>{numberLabel(row.mau)} <small>MAU</small></span>
                    </div>
                  ))}
                </div>
                <p className="field-note">Showing {numberLabel(adoption.rows.length)} of {numberLabel(adoption.total)} records. MAU is per feature and is not summed across features.</p>
              </>
            )}
          </section>
          <section className="detail-section">
            <h3>Next step and follow-up</h3>
            {followup.error ? <QueryError message={followup.error} retry={followup.refresh} /> : followup.rows[0] ? <FollowupForm row={followup.rows[0]} /> : followup.loading ? <Loading label="Loading saved follow-up" /> : <Empty title="No linked follow-up record">A follow-up row keyed to this Account ID must exist in the workbook before it can be edited here.</Empty>}
          </section>
        </div>
      </div>
    </div>
  );
}