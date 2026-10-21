import { useState } from "react";
import { addRow, type Rows } from "@meridian/app";
import { X } from "lucide-react";

type Account = Rows["accounts"];

export function VisitForm({ account, onCancel, onSaved }: { account: Account; onCancel: () => void; onSaved: () => void }) {
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [visitType, setVisitType] = useState<"In person" | "Phone" | "Video">("In person");
  const [outcome, setOutcome] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  async function saveVisit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setConfirmation("");
    try {
      await addRow("visits", {
        visit_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        account_id: String(account.account_id),
        visit_date: visitDate,
        visit_type: visitType,
        outcome: outcome.trim(),
        next_step: nextStep.trim(),
      });
      setConfirmation("Saved");
      window.setTimeout(() => setConfirmation(""), 4000);
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Visit couldn’t be saved. Check the details and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="visit-form card" onSubmit={saveVisit}>
      <div className="form-heading"><div><h2>Log a visit</h2><p>{account.account || "Selected account"}</p></div><button className="icon-btn" type="button" onClick={onCancel} aria-label="Close visit form"><X size={19} /></button></div>
      <div className="form-grid">
        <label className="field"><span>Visit date</span><input type="date" value={visitDate} onChange={(event) => setVisitDate(event.target.value)} required /></label>
        <label className="field"><span>Visit type</span><select value={visitType} onChange={(event) => setVisitType(event.target.value as typeof visitType)}><option>In person</option><option>Phone</option><option>Video</option></select></label>
        <label className="field full-field"><span>Outcome</span><textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} rows={3} required placeholder="What happened during the visit?" /></label>
        <label className="field full-field"><span>Next step <span className="optional">Optional</span></span><textarea value={nextStep} onChange={(event) => setNextStep(event.target.value)} rows={2} placeholder="What needs to happen next?" /></label>
      </div>
      <div className="form-footer">
        <div className="save-feedback" role="status">{confirmation && <span className="saved">{confirmation}</span>}{error && <span className="error-text">{error}</span>}</div>
        <button className="btn btn-secondary" type="button" onClick={onCancel} disabled={pending}>Cancel</button>
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Saving…" : "Save visit"}</button>
      </div>
    </form>
  );
}