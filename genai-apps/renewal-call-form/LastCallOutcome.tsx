import { useRows } from "@meridian/app";
import { History } from "lucide-react";

type Props = { accountId: number | null; savedVersion: number };

export function LastCallOutcome({ accountId }: Props) {
  const calls = useRows("calls", {
    filters: accountId === null ? [] : [{ column: "account_id", values: [String(accountId)] }],
    sort: [{ column: "call_date", direction: "desc" }],
    limit: 20,
    enabled: accountId !== null,
  });

  return (
    <section className="card history-card">
      <div className="history-heading">
        <span className="history-icon"><History size={18} aria-hidden="true" /></span>
        <div><h2>Last call outcome</h2><p>From the saved renewal call log</p></div>
      </div>
      {accountId === null ? (
        <p className="empty-copy">Choose an account to see its call history.</p>
      ) : calls.loading ? (
        <div className="list-skeleton compact" aria-label="Loading call history"><span /><span /></div>
      ) : calls.error ? (
        <p className="inline-error">Call history could not be loaded. Try again.</p>
      ) : calls.rows.length === 0 ? (
        <div className="empty-panel">
          <p>No call has been logged for this account yet.</p>
          <span>After saving a call, its outcome and next step will appear here.</span>
        </div>
      ) : (
        <div className="call-history-list">
          {calls.rows.map((call, index) => (
            <article className={`call-entry ${index === 0 ? "latest-entry" : ""}`} key={call.__row_id}>
              <div className="call-entry-top">
                <span className={`outcome-tag outcome-${call.outcome?.toLowerCase().replace(/\s+/g, "-")}`}>{call.outcome || "Outcome not listed"}</span>
                <time>{call.call_date || "Date unavailable"}</time>
              </div>
              {index === 0 && <p className="latest-label">Latest outcome</p>}
              <p className="concern-text">{call.main_concern || "No concern recorded"}</p>
              <p className="next-date">Next step · {call.next_step_date || "No date set"}</p>
              {call.account_manager && <p className="manager-line">Call manager · {call.account_manager}</p>}
            </article>
          ))}
          {calls.total > calls.rows.length && <p className="list-count">Showing {calls.rows.length} of {calls.total} calls.</p>}
        </div>
      )}
    </section>
  );
}