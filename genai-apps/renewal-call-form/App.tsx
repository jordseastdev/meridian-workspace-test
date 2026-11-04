import { useState } from "react";
import { PickAccount } from "./PickAccount";
import { CallOutcome } from "./CallOutcome";
import { ReviewSubmit } from "./ReviewSubmit";
import { LastCallOutcome } from "./LastCallOutcome";
import "./styles.css";

export default function App() {
  const [accountId, setAccountId] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<"Renewing" | "At risk" | "Churning" | "">("");
  const [mainConcern, setMainConcern] = useState("");
  const [nextStepDate, setNextStepDate] = useState("");
  const [step, setStep] = useState(1);
  const [savedVersion, setSavedVersion] = useState(0);

  function resetCall() {
    setOutcome("");
    setMainConcern("");
    setNextStepDate("");
    setStep(1);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">M</div>
        <span className="brand-name">Meridian</span>
        <span className="topbar-divider" />
        <span className="topbar-context">Renewal calls</span>
      </header>

      <div className="page-layout">
        <div className="page-heading">
          <div>
            <h1>Renewal call</h1>
            <p>Prepare the account, log the conversation, and agree on a next step.</p>
          </div>
        </div>

        <div className="workflow-grid">
          <div className="workflow-main">
            <PickAccount
              selectedId={accountId}
              onSelect={(id) => {
                setAccountId(id);
                setStep(1);
              }}
              savedVersion={savedVersion}
            />
            <CallOutcome
              enabled={accountId !== null}
              outcome={outcome}
              setOutcome={setOutcome}
              mainConcern={mainConcern}
              setMainConcern={setMainConcern}
              nextStepDate={nextStepDate}
              setNextStepDate={setNextStepDate}
              step={step}
              setStep={setStep}
            />
            <ReviewSubmit
              accountId={accountId}
              outcome={outcome}
              mainConcern={mainConcern}
              nextStepDate={nextStepDate}
              step={step}
              setStep={setStep}
              onSaved={() => {
                setSavedVersion((n) => n + 1);
                resetCall();
              }}
            />
          </div>
          <aside className="workflow-aside">
            <LastCallOutcome accountId={accountId} savedVersion={savedVersion} />
          </aside>
        </div>
      </div>
    </main>
  );
}