import { useUser } from "@meridian/app";

type Outcome = "Renewing" | "At risk" | "Churning" | "";

type Props = {
  enabled: boolean;
  outcome: Outcome;
  setOutcome: (value: Outcome) => void;
  mainConcern: string;
  setMainConcern: (value: string) => void;
  nextStepDate: string;
  setNextStepDate: (value: string) => void;
  step: number;
  setStep: (value: number) => void;
};

export function CallOutcome({
  enabled, outcome, setOutcome, mainConcern, setMainConcern,
  nextStepDate, setNextStepDate, step, setStep,
}: Props) {
  const user = useUser();
  const canContinue = Boolean(outcome && mainConcern.trim() && nextStepDate);

  return (
    <section className={`card workflow-card ${!enabled ? "is-locked" : ""}`}>
      <div className="step-heading">
        <span className="step-marker">2</span>
        <div>
          <h2>Call outcome</h2>
          <p>Capture the result and the agreed next step.</p>
        </div>
      </div>

      {!enabled ? (
        <p className="locked-note">Pick an account to enter call details.</p>
      ) : (
        <div className="form-content">
          <fieldset className="outcome-field">
            <legend>Outcome</legend>
            <div className="choice-group">
              {(["Renewing", "At risk", "Churning"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={outcome === option}
                  className={`choice-button ${outcome === option ? "selected" : ""}`}
                  onClick={() => {
                    setOutcome(option);
                    setStep(2);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="field-label" htmlFor="main-concern">Main concern</label>
          <textarea
            id="main-concern"
            value={mainConcern}
            maxLength={2000}
            rows={4}
            placeholder="What matters most to the account right now?"
            onChange={(event) => {
              setMainConcern(event.target.value);
              setStep(2);
            }}
          />

          <label className="field-label" htmlFor="next-step-date">Next step date</label>
          <input
            id="next-step-date"
            type="date"
            value={nextStepDate}
            onChange={(event) => {
              setNextStepDate(event.target.value);
              setStep(2);
            }}
          />

          <div className="form-footer">
            <span className="owner-note">Call manager: {user.name || user.email}</span>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canContinue}
              onClick={() => setStep(3)}
            >
              Review call
            </button>
          </div>
          {!canContinue && <p className="help-copy">Choose an outcome and add a concern and next step date to review.</p>}
        </div>
      )}
    </section>
  );
}