import { useRows } from "@meridian/app";
import { MapPin, CalendarDays, BriefcaseBusiness, Users } from "lucide-react";
import type { Rows } from "@meridian/app";
import { VisitForm } from "./VisitForm";

type Account = Rows["accounts"];

function money(value: number | null) {
  return value == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function dateLabel(value: string | null) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function AccountDetail({ account, loggingVisit, onCancelVisit, onVisitSaved }: {
  account: Account;
  loggingVisit: boolean;
  onCancelVisit: () => void;
  onVisitSaved: () => void;
}) {
  const visits = useRows("visits", {
    filters: [{ column: "account_id", values: [String(account.account_id)] }],
    sort: [{ column: "visit_date", direction: "desc" }],
    limit: 20,
  });

  return (
    <section className="detail-view">
      <div className="detail-heading">
        <div>
          <h1>{account.account || "Unnamed account"}</h1>
          <p>{account.owner || "No account owner"}{account.region ? <><span className="dot-separator">·</span><MapPin size={15} />{account.region}</> : null}</p>
        </div>
        {!loggingVisit && <button className="btn btn-primary desktop-action" onClick={() => onVisitSaved()}>
          <span className="visually-hidden">Log a visit from the top of the screen</span>
        </button>}
      </div>

      <div className="facts-strip">
        <div className="fact"><span>Action lane</span><strong>{account.lane || "—"}</strong></div>
        <div className="fact"><span>Plan</span><strong>{account.plan || "—"}</strong></div>
        <div className="fact"><span>Active MRR</span><strong className="numeric">{money(account.mrr)}</strong></div>
        <div className="fact"><span>Active seats</span><strong className="numeric">{account.seats ?? "—"}</strong></div>
        <div className="fact"><span>First renewal</span><strong>{dateLabel(account.renewal)}</strong></div>
        <div className="fact"><span>Past due balance</span><strong className="numeric">{money(account.past_due)}</strong></div>
        <div className="fact"><span>CSM</span><strong>{account.csm || "—"}</strong></div>
      </div>

      {loggingVisit && (
        <VisitForm account={account} onCancel={onCancelVisit} onSaved={onVisitSaved} />
      )}

      <section className="history-section">
        <div className="section-heading">
          <div><h2>Visit history</h2><p>Recent visits for this account</p></div>
          <span className="history-count">{visits.total.toLocaleString()}</span>
        </div>
        {visits.error ? (
          <div className="message error" role="alert">Visit history couldn’t be loaded. Try again.</div>
        ) : visits.loading ? (
          <div className="visit-skeletons"><div /><div /><div /></div>
        ) : visits.rows.length === 0 ? (
          <div className="empty-state history-empty"><strong>No visits logged yet</strong><span>Log a visit to keep the account’s next steps in one place.</span></div>
        ) : (
          <div className="visit-list">
            {visits.rows.map((visit) => (
              <article className="visit-item" key={visit.__row_id}>
                <div className="visit-date"><CalendarDays size={16} /><span>{dateLabel(visit.visit_date)}</span></div>
                <div className="visit-content">
                  <div className="visit-title"><strong>{visit.visit_type || "Visit"}</strong>{visit.created_by && <span>by {visit.created_by}</span>}</div>
                  <p className="visit-outcome">{visit.outcome || "No outcome recorded"}</p>
                  {visit.next_step && <p className="next-step"><BriefcaseBusiness size={15} /><span><b>Next step</b> {visit.next_step}</span></p>}
                </div>
              </article>
            ))}
            {visits.total > visits.rows.length && <p className="showing-note">Showing {visits.rows.length} of {visits.total.toLocaleString()} visits</p>}
          </div>
        )}
      </section>
    </section>
  );
}