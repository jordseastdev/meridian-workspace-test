import { useState } from "react";
import { useRows } from "@meridian/app";
import { PanelsTopLeft, ArrowUpRight } from "lucide-react";
import { RevenueAndPayingAccounts } from "./RevenueAndPayingAccounts";
import { MonthlyRecurringRevenue } from "./MonthlyRecurringRevenue";
import { WhatDrivesGrowth } from "./WhatDrivesGrowth";
import { AccountsToGrowAndRetain } from "./AccountsToGrowAndRetain";
import { NextStepsAndFollowUps } from "./NextStepsAndFollowUps";
import { AccountDetail } from "./AccountDetail";
import { monthLabel } from "./lib";
import "./styles.css";

export default function App() {
  const [month, setMonth] = useState("2025-09-01");
  const [accountId, setAccountId] = useState<number | null>(null);
  const months = useRows("revenue", {
    groupBy: "month",
    sort: [{ column: "month", direction: "desc" }],
    limit: 1000,
  });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="#top" className="brand" aria-label="Growth Command Center home">
          <span className="brand-mark"><PanelsTopLeft size={21} /></span>
          <span>Growth<br /><strong>Command Center</strong></span>
        </a>
        <nav aria-label="Sections">
          <a href="#revenue">Revenue & accounts</a>
          <a href="#trend">Monthly revenue</a>
          <a href="#drivers">Growth drivers</a>
          <a href="#accounts">Account workspace</a>
          <a href="#followups">Next steps</a>
        </nav>
        <div className="sidebar-note">
          <span className="pill">Historical snapshot</span>
          <p>Revenue history through September 2025.</p>
          <p>Account facts and saved follow-ups are shown separately from monthly revenue.</p>
        </div>
      </aside>

      <main id="top">
        <header className="page-header">
          <div>
            <div className="context-line">Growth Command Center Data</div>
            <h1>Growth Command Center</h1>
            <p className="muted">Expansion, retention, and new customer growth.</p>
          </div>
          <div className="snapshot-control">
            <span className="pill">Historical snapshot</span>
            <label htmlFor="snapshot">Revenue month</label>
            <select id="snapshot" value={month} onChange={e => setMonth(e.target.value)} disabled={months.loading}>
              {!months.rows.some(row => row.month === month) && <option value={month}>{monthLabel(month)}</option>}
              {months.rows.map(row => row.month && <option key={row.month} value={row.month}>{monthLabel(row.month)}</option>)}
            </select>
            {months.error && <span className="error-text">Could not load other months.</span>}
          </div>
        </header>

        <RevenueAndPayingAccounts month={month} />
        <MonthlyRecurringRevenue />
        <WhatDrivesGrowth month={month} />

        <section className="playbook" aria-labelledby="playbook-title">
          <div>
            <h2 id="playbook-title">Founder playbook</h2>
            <span className="muted">A review routine, not an account diagnosis.</span>
          </div>
          <ol>
            <li>Review contraction and churn in the selected month.</li>
            <li>Investigate adoption gaps with the account owner.</li>
            <li>Choose a priority and save a dated next step.</li>
          </ol>
          <a className="text-link" href="#accounts">Open the workspace <ArrowUpRight size={16} /></a>
        </section>

        <AccountsToGrowAndRetain onSelect={setAccountId} />
        <NextStepsAndFollowUps onSelect={setAccountId} />
        <footer>Source: Growth Command Center Data · Revenue snapshots are not cumulative.</footer>
      </main>

      {accountId !== null && (
        <AccountDetail key={accountId} accountId={accountId} month={month} onClose={() => setAccountId(null)} />
      )}
    </div>
  );
}