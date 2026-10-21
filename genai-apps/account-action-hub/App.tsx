import { useState } from "react";
import { Activity, Search, SlidersHorizontal } from "lucide-react";
import { useRows } from "@meridian/app";
import { AccountQueue } from "./AccountQueue";
import { RenewalTrend } from "./RenewalTrend";
import "./styles.css";

export default function App() {
  const [search, setSearch] = useState("");
  const [lane, setLane] = useState("");
  const [region, setRegion] = useState("");
  const [plan, setPlan] = useState("");
  const [owner, setOwner] = useState("");
  const [priority, setPriority] = useState("all");

  const lanes = useRows("account_base", { groupBy: "lane", limit: 100 });
  const regions = useRows("account_base", { groupBy: "region", limit: 100 });
  const plans = useRows("account_base", { groupBy: "plan", limit: 100 });
  const owners = useRows("account_base", { groupBy: "owner", limit: 100 });

  const filters = [
    ...(lane ? [{ column: "lane" as const, values: [lane] }] : []),
    ...(region ? [{ column: "region" as const, values: [region] }] : []),
    ...(plan ? [{ column: "plan" as const, values: [plan] }] : []),
    ...(owner ? [{ column: "owner" as const, values: [owner] }] : []),
    ...(priority === "overdue" ? [{ column: "past_due" as const, min: 0.01 }] : []),
    ...(priority === "adoption" ? [{ column: "adopted" as const, min: 0, max: 2 }] : []),
  ];
  const accounts = useRows("account_base", {
    search,
    filters,
    sort: [{ column: "past_due", direction: "desc" }, { column: "adopted", direction: "asc" }],
    limit: 50,
  });

  const clearFilters = () => {
    setLane(""); setRegion(""); setPlan(""); setOwner(""); setPriority("all"); setSearch("");
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Activity size={19} /></span><span>Meridian <b>Accounts</b></span></div>
        <span className="topbar-note">Customer success workspace</span>
      </header>

      <section className="page-heading">
        <div>
          <h1>Account action center</h1>
          <p>Work the next best action across your account portfolio.</p>
        </div>
      </section>

      <section className="workspace">
        <div className="toolbar">
          <label className="searchbox">
            <Search size={18} aria-hidden="true" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts, owners, plans…" aria-label="Search accounts" />
            {search && <button className="icon-button" onClick={() => setSearch("")} aria-label="Clear search">×</button>}
          </label>
          <div className="filter-caption"><SlidersHorizontal size={16} /> Filters</div>
          <div className="filters">
            <select aria-label="Action lane" value={lane} onChange={e => setLane(e.target.value)}><option value="">All action lanes</option>{lanes.rows.map(r => r.lane && <option key={r.lane} value={r.lane}>{r.lane}</option>)}</select>
            <select aria-label="Region" value={region} onChange={e => setRegion(e.target.value)}><option value="">All regions</option>{regions.rows.map(r => r.region && <option key={r.region} value={r.region}>{r.region}</option>)}</select>
            <select aria-label="Owner" value={owner} onChange={e => setOwner(e.target.value)}><option value="">All owners</option>{owners.rows.map(r => r.owner && <option key={r.owner} value={r.owner}>{r.owner}</option>)}</select>
            <select aria-label="Plan" value={plan} onChange={e => setPlan(e.target.value)}><option value="">All plans</option>{plans.rows.map(r => r.plan && <option key={r.plan} value={r.plan}>{r.plan}</option>)}</select>
            <select aria-label="Prioritization" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="all">All priorities</option><option value="overdue">Past-due balance</option><option value="adoption">Low adoption (0–2)</option>
            </select>
            {(lane || region || plan || owner || priority !== "all" || search) && <button className="btn btn-quiet clear-button" onClick={clearFilters}>Clear filters</button>}
          </div>
        </div>
        <RenewalTrend filters={filters} />
        <AccountQueue result={accounts} search={search} />
      </section>
      <footer className="footer-note">Account signals and follow-ups from the governed account workbook.</footer>
    </main>
  );
}