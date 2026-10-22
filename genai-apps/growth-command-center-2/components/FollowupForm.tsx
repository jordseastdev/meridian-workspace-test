import { useEffect, useState } from "react";
import { updateRow, type Row } from "@meridian/app";
import { errorMessage, type FollowupStatus, type Priority } from "../lib";

export function FollowupForm({ row }: { row: Row<"followups"> }) {
  const [nextStep, setNextStep] = useState(row.next_step || "");
  const [date, setDate] = useState(row.follow_up_date?.slice(0, 10) || "");
  const [status, setStatus] = useState<FollowupStatus>(row.work_status || "Not started");
  const [priority, setPriority] = useState<Priority | "">(row.priority || "");
  const [statusChanged, setStatusChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setNextStep(row.next_step || "");
    setDate(row.follow_up_date?.slice(0, 10) || "");
    setStatus(row.work_status || "Not started");
    setPriority(row.priority || "");
    setStatusChanged(false);
  }, [row.__row_id, row.next_step, row.follow_up_date, row.work_status, row.priority]);

  useEffect(() => {
    if (feedback === "Saved") {
      const timer = setTimeout(() => setFeedback(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFeedback("");
    setFailed(false);
    try {
      await updateRow("followups", row, {
        next_step: nextStep.trim() || null,
        follow_up_date: date || null,
        work_status: statusChanged ? status : row.work_status,
        priority: priority || null,
      });
      setFeedback("Saved");
    } catch (error) {
      setFailed(true);
      setFeedback(`Could not save next step. ${errorMessage(error)} Try again.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="followup-form" onSubmit={save}>
      <p className="muted">Team-chosen priority and next step. The account owner is a read-only account fact.</p>
      <label>Next Step<textarea value={nextStep} onChange={e => setNextStep(e.target.value)} rows={4} placeholder="Write a specific next step for this account" disabled={saving} /></label>
      <div className="form-grid">
        <label>Follow-up Date<input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={saving} /></label>
        <label>Priority<select value={priority} onChange={e => setPriority(e.target.value as Priority | "")} disabled={saving}><option value="">Not set</option><option>High</option><option>Medium</option><option>Low</option></select></label>
        <label>Follow-up Status<select value={status} onChange={e => { setStatus(e.target.value as FollowupStatus); setStatusChanged(true); }} disabled={saving}><option>Not started</option><option>In progress</option><option>Done</option></select></label>
      </div>
      {row.work_status === null && <p className="field-note">Blank source status is displayed as Not started. It stays blank unless you change it or mark the step Done.</p>}
      <div className="save-row">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save next step"}</button>
        <span className={failed ? "error-text" : "success-text"} role={failed ? "alert" : "status"}>{feedback}</span>
      </div>
    </form>
  );
}