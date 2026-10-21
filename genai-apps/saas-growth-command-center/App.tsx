import { useState } from "react";
import { Activity, ArrowDownUp, Building2, CreditCard, LayoutDashboard, Layers3, Users } from "lucide-react";
import { Accounts } from "./Accounts";
import { Revenue } from "./Revenue";
import { Adoption } from "./Adoption";
import { Billing } from "./Billing";
import { Followups } from "./Followups";
import "./styles.css";

type View = "overview" | "accounts" | "revenue" | "adoption" | "billing" | "followups";

const nav: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "accounts", label: "Accounts", icon: Building2 },
  { id: "revenue", label: "Revenue", icon: ArrowDownUp },
  { id: "adoption", label: "Feature adoption", icon: Layers3 },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "followups", label: "Follow-ups", icon: Activity },
];

export default function App() {
  const [view, setView] = useState<View>("overview");
  const [search, setSearch] = useState("");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Activity size={19} /></div>
          <span>Meridian <b>Growth</b></span>
        </div>
        <nav aria-label="Main navigation">
          {nav.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${view === id ? "selected" : ""}`} onClick={() => { setView(id); setSearch(""); }}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-dot" />
          <span>Historical analytics<br /><small>Observed workbook data</small></span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-mark"><Activity size={17} /></div> Growth</div>
          <div className="topbar-context"><span>SAAS GROWTH COMMAND CENTER</span><span className="context-divider">/</span><b>{nav.find((item) => item.id === view)?.label}</b></div>
          <div className="user-chip"><Users size={15} /><span>Analytics</span></div>
        </header>

        <div className="page">
          <section className="page-heading">
            <div>
              <h1>{view === "overview" ? "Growth overview" : nav.find((item) => item.id === view)?.label}</h1>
              <p>Historical, observational analytics. These records do not include renewal dates or a churn risk score.</p>
            </div>
            {view !== "overview" && (
              <label className="search-box">
                <span className="sr-only">Search {view}</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${view}…`} />
              </label>
            )}
          </section>

          {view === "overview" && (
            <div className="overview-grid">
              <section className="card overview-feature">
                <div className="feature-copy">
                  <div className="section-title"><h2>Account base</h2><span className="pill neutral">Observed records</span></div>
                  <p>Explore acquisition, conversion, and current account context across the workbook.</p>
                  <button className="btn btn-primary" onClick={() => setView("accounts")}>Explore accounts</button>
                </div>
                <div className="feature-icon"><Building2 size={26} /></div>
              </section>
              <Accounts search={search} overview />
              <Revenue search={search} overview />
              <Adoption search={search} overview />
              <Billing search={search} overview />
            </div>
          )}
          {view === "accounts" && <Accounts search={search} />}
          {view === "revenue" && <Revenue search={search} />}
          {view === "adoption" && <Adoption search={search} />}
          {view === "billing" && <Billing search={search} />}
          {view === "followups" && <Followups search={search} />}
        </div>
      </main>
    </div>
  );
}