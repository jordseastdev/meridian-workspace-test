import { useMemo, useState } from "react";
import { useRows, useUser, updateRow } from "@meridian/app";

const statuses = ["Not started", "Contacted", "In progress", "Complete"] as const;

export function MyWork({ search }: { search: string }) {
  const user = useUser();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const filters = [{ column: "assigned_to" as const, values: [user.name, user.email] }];
  const tasks = useRows("account_followups", {
    search,
    filters,
    sort: [{ column: "follow_up_date", direction: "asc" }],
    limit: 200,
  });
  const today = useMemo(() => new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date()), []);
  const buckets = useMemo(() => {
    const open = tasks.rows.filter((row) => row.outreach_status !== "Complete");
    const done = tasks.rows.filter((row) => row.outreach_status === "Complete");
    return {
      overdue: open.filter((row) => !!row.follow_up_date && row.follow_up_date < today),
      today: open.filter((row) => row.follow_up_date === today),
      upcoming: open.filter((row) => !!row.follow_up_date && row.follow_up_date > today),
      undated: open.filter((row) => !row.follow_up_date),
      done,
    };
  }, [tasks.rows, today]);

  async function complete(row: typeof tasks.rows[number]) {
    setSavingId(row.__row_id);
    setFeedback("");
    try {
      await updateRow("account_followups", row, { outreach_status: "Complete" });
      setFeedback("Saved");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not complete this follow-up. Try again.");
    } finally {
      setSavingId(null);
    }
  }

  const groups = [
    ["Overdue", buckets.overdue],
    ["Due today", buckets.today],
    ["Upcoming", buckets.upcoming],
    ["No due date", buckets.undated],
    ["Completed", buckets.done],
  ] as const;

  return <section className="card content-panel">
    <div className="section-title">
      <div><h2>My work</h2><p>Account follow-ups assigned to you. Due dates are team-entered dates, not renewal predictions.</p></div>
    </div>
    {tasks.error ? <div className="error-state">Could not load your account follow-ups. Try again.</div> :
      tasks.loading ? <div className="skeleton table-skeleton" aria-label="Loading your work" /> :
      tasks.rows.length === 0 ? <div className="empty-state">{search ? "No assigned follow-ups match this search." : "No account follow-ups are assigned to you."}</div> :
      <div className="task-groups">
        {groups.map(([label, rows]) => <section className="task-group" key={label}>
          <h3>{label} <span className="muted">{rows.length}</span></h3>
          {rows.length === 0 ? <p className="muted">No tasks in this group.</p> : rows.map((row) =>
            <div className="task-row" key={row.__row_id}>
              <div className="task-main">
                <strong>Account #{row.account_id ?? "—"}</strong>
                <p>{row.next_step || row.notes || "No next step recorded"}</p>
                <span className="muted">{row.follow_up_date || "No due date"} · {row.outreach_status || "Not started"}</span>
              </div>
              {row.outreach_status !== "Complete" && <div className="task-actions">
                <button className="row-action" disabled={savingId === row.__row_id} onClick={() => void complete(row)}>
                  {savingId === row.__row_id ? "Saving…" : "Complete"}
                </button>
              </div>}
            </div>)}
        </section>)}
      </div>}
    <div className="save-line" aria-live="polite"><span className={feedback && feedback !== "Saved" ? "save-error" : "save-message"}>{feedback}</span></div>
    {tasks.total > tasks.rows.length && <div className="table-foot">Showing {tasks.rows.length} of {tasks.total.toLocaleString()} assigned follow-ups</div>}
    <p className="muted">My work can use account follow-ups only. Invoice collection notes are missing assignee and task due-date columns; adoption follow-ups are missing assignee and have no task due-date column distinction from their team-entered follow-up date. Assign-to-me is unavailable because these records do not have an assignment field.</p>
  </section>;
}