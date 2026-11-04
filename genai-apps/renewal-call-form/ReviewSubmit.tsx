import { useState } from "react";
import { addRow, useRows, useUser } from "@meridian/app";
import { Check } from "lucide-react";

type Outcome = "Renewing" | "At risk" | "Churning" | "";

type Props = {
  accountId: number | null;
  outcome: Outcome;
  mainConcern: string;
  nextStepDate: string;
  step: number;
  setStep: (value: number) => void;
  onSaved: () => void;
};

export function ReviewSubmit({ accountId, outcome, mainConcern, nextStepDate, step, setStep, onSaved }: Props) {
  const user = useUser();
  const accounts = useRows("accounts", {
    filters: accountId === null ? [] : [{ column: "account_id", values: [accountId] }],
    limit: 1,
    enabled: accountId !== null,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveCall() {
    if (accountId === null || !outcome || !nextStepDate || !mainConcern.trim()) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await addRow("calls", {
        call_id: `CALL-${Date.now()}`,
        account_id: String(accountId),
        account_manager: user.name || user.email,
        call_date: new Date().toISOString().slice(0, 10),
        outcome,
        main_concern: mainConcern.trim(),
        next_step_date: nextStepDate,
      });
      setMessage("Saved");
      onSaved();
      window.setTimeout(() => setMessage(""), 5000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Call could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`card workflow-card ${step !== 3 ? "is-locked" : ""}`}>
      <div className="step-heading">
        <span className="step-marker">3</span>
        <div>
          <h2>Review and submit</h2>
          <p>Check the call details before saving them to the renewal call log.</p>
        </div>
      </div>
      {step !== 3 ? (
        <p className="locked-note">Complete the call details to review this record.</p>
      ) : (
        <div className="review-content">
          {accounts.loading ? (
            <div className="detail-skeleton"><span /><span /></div>
          ) : accounts.error ? (
            <p className="inline-error">Account name could not be loaded. Return to Step 1 and try again.</p>
          ) : (
            <dl className="review-list">
              <div><dt>Account</dt><dd>{accounts.rows[0]?.account_name || "Account name unavailable"}</dd></div>
              <div><dt>Account manager</dt><dd>{user.name || user.email}</dd></div>
              <div><dt>Call date</dt><dd>{new Date().toISOString().slice(0, 10)}</dd></div>
              <div><dt>Outcome</dt><dd>{outcome || "Not selected"}</dd></div>
              <div><dt>Main concern</dt><dd className="long-text">{mainConcern || "Not entered"}</dd></div>
              <div><dt>Next step date</dt><dd>{nextStepDate || "Not selected"}</dd></div>
            </dl>
          )}
          <div className="form-footer review-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(2)} disabled={saving}>Edit call details</button>
            <div className="save-area">
              <button type="button" className="btn btn-primary" onClick={saveCall} disabled={saving || accounts.loading || Boolean(accounts.error)}>
                {saving ? "Saving…" : "Save call"}
              </button>
              {message && <span className="save-confirmation"><Check size={15} aria-hidden="true" />{message}</span>}
              {error && <span className="save-error" role="alert">{error}</span>}
            </div>
          </div>
          <p className="help-copy">This adds a record to the renewal call log. It does not change the account record.</p>
        </div>
      )}
    </section>
  );
}