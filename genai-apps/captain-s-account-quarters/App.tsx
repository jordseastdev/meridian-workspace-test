import React, { useState } from "react";
import { useRows } from "@meridian/app";
import {
  Anchor,
  Search,
  ShipWheel,
  Compass,
  MapPin,
  UserRound,
  ChevronRight,
  Coins,
  Boxes,
  X,
} from "lucide-react";

export default function AccountExplorer() {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [owner, setOwner] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filters = [
    ...(industry ? [{ column: "industry" as const, values: [industry] }] : []),
    ...(region ? [{ column: "region" as const, values: [region] }] : []),
    ...(status ? [{ column: "status" as const, values: [status] }] : []),
    ...(plan ? [{ column: "current_plan" as const, values: [plan] }] : []),
    ...(owner ? [{ column: "account_owner" as const, values: [owner] }] : []),
  ];

  const manifest = useRows("accounts", {
    search: search.trim() || undefined,
    filters,
    sort: [{ column: "account_name", direction: "asc" }],
    limit: 1000,
  });

  const industries = useRows("accounts", { groupBy: "industry", sort: [{ column: "industry" }], limit: 1000 });
  const regions = useRows("accounts", { groupBy: "region", sort: [{ column: "region" }], limit: 1000 });
  const statuses = useRows("accounts", { groupBy: "status", sort: [{ column: "status" }], limit: 1000 });
  const plans = useRows("accounts", { groupBy: "current_plan", sort: [{ column: "current_plan" }], limit: 1000 });
  const owners = useRows("accounts", { groupBy: "account_owner", sort: [{ column: "account_owner" }], limit: 1000 });
  const profile = useRows("accounts", {
    filters: selectedId === null ? [] : [{ column: "account_id", values: [selectedId] }],
    enabled: selectedId !== null,
    limit: 1,
  });

  const active = manifest.rows.find((row) => row.account_id === selectedId) ?? profile.rows[0];
  const selectedLoading = selectedId !== null && profile.loading;
  const selectedError = profile.error;
  const clearFilters = () => {
    setIndustry("");
    setRegion("");
    setStatus("");
    setPlan("");
    setOwner("");
    setSearch("");
  };

  const fmt = (value: number | null | undefined, currency = false) => {
    if (value == null) return "—";
    return currency
      ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value)
      : new Intl.NumberFormat().format(value);
  };

  const date = (value: string | null) => {
    if (!value) return "—";
    const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const selectOptions = (rows: Array<{ count: number; [key: string]: unknown }>, key: string) =>
    rows.map((row) => row[key]).filter((value): value is string => typeof value === "string" && value.length > 0);

  const isFiltered = Boolean(search || industry || region || status || plan || owner);

  return (
    <main className="app-shell">
      <style>{`
        :root {
          color-scheme: light;
          --ink: #18343b;
          --muted: #668087;
          --sea: #176c70;
          --sea-dark: #105357;
          --foam: #e6f3ee;
          --paper: #fbfaf5;
          --line: #e4e9e3;
          --gold: #d7953f;
          --gold-pale: #fff4df;
          --red: #a54337;
          --shadow: 0 18px 45px rgba(26, 62, 62, .08);
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--paper); color: var(--ink); font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        button, input, select { font: inherit; }
        button, select { min-height: 42px; }
        .app-shell { min-height: 100vh; background: radial-gradient(ellipse at 85% 0%, #e5f1e9 0, transparent 34%), var(--paper); }
        .topbar { padding: 18px clamp(18px, 5vw, 72px); border-bottom: 1px solid rgba(24,52,59,.08); display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .brand { display:flex; gap:10px; align-items:center; font-size:13px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; }
        .brand-mark { width:36px; height:36px; display:grid; place-items:center; border-radius:12px; background:var(--sea); color:white; }
        .eyebrow { color:var(--sea); text-transform:uppercase; letter-spacing:.14em; font-size:11px; font-weight:800; }
        .top-note { color:var(--muted); font-size:13px; }
        .content { max-width:1440px; margin:0 auto; padding:34px clamp(18px, 5vw, 72px) 72px; }
        .hero { display:flex; justify-content:space-between; align-items:flex-end; gap:24px; margin-bottom:28px; }
        h1 { font-family:ui-serif, Georgia, serif; font-size:clamp(34px, 5vw, 56px); letter-spacing:-.045em; line-height:1.02; margin:9px 0 10px; font-weight:600; }
        .intro { max-width:580px; margin:0; color:var(--muted); line-height:1.65; font-size:15px; }
        .hero-stamp { flex:none; width:92px; height:92px; border:1px solid #d8e4db; border-radius:50%; color:var(--sea); display:grid; place-items:center; transform:rotate(-10deg); position:relative; }
        .hero-stamp:after { content:"ACCOUNT • MANIFEST"; position:absolute; font-size:7px; letter-spacing:.13em; font-weight:800; bottom:12px; }
        .workspace { display:grid; grid-template-columns:minmax(0, 1.14fr) minmax(340px, .86fr); gap:22px; align-items:start; }
        .panel { background:rgba(255,255,255,.88); border:1px solid var(--line); border-radius:20px; box-shadow:var(--shadow); overflow:hidden; }
        .manifest-head { padding:22px 22px 18px; border-bottom:1px solid var(--line); }
        .panel-title { display:flex; justify-content:space-between; align-items:center; gap:12px; }
        h2 { font-family:ui-serif, Georgia, serif; font-size:24px; letter-spacing:-.025em; margin:0; font-weight:600; }
        .count { color:var(--muted); font-size:12px; font-weight:700; background:#f1f5f1; padding:7px 10px; border-radius:99px; white-space:nowrap; }
        .searchbox { margin-top:17px; position:relative; }
        .searchbox svg { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#82979a; }
        .searchbox input { width:100%; min-height:46px; border:1px solid var(--line); border-radius:12px; padding:0 14px 0 41px; color:var(--ink); background:#fff; outline:none; }
        .searchbox input:focus, select:focus { border-color:var(--sea); box-shadow:0 0 0 3px rgba(23,108,112,.12); }
        .filters { display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:8px; margin-top:10px; }
        select { min-width:0; width:100%; border:1px solid var(--line); border-radius:10px; background:#fff; color:#36565b; padding:0 8px; font-size:12px; outline:none; }
        .clear { border:0; background:transparent; color:var(--sea); cursor:pointer; font-size:12px; font-weight:700; padding:10px 2px 0; }
        .list { max-height:710px; overflow:auto; }
        .account-row { appearance:none; border:0; border-bottom:1px solid #edf0eb; display:block; width:100%; padding:15px 20px; text-align:left; color:inherit; background:transparent; cursor:pointer; transition:background .15s ease; }
        .account-row:hover { background:#f5faf6; }
        .account-row:focus-visible, button:focus-visible { outline:3px solid rgba(23,108,112,.3); outline-offset:2px; }
        .account-row.selected { background:#eff7f2; box-shadow:inset 3px 0 var(--sea); }
        .row-top { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
        .name { font-weight:750; font-size:15px; overflow-wrap:anywhere; }
        .subline { margin-top:5px; font-size:12px; color:var(--muted); display:flex; flex-wrap:wrap; gap:6px 12px; }
        .row-bottom { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:12px; }
        .meta { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
        .pill { display:inline-flex; align-items:center; min-height:24px; padding:3px 9px; border-radius:99px; background:#f0f4f0; color:#49636a; font-size:11px; font-weight:700; }
        .pill.active { background:#e3f3e9; color:#287447; }
        .pill.churned { background:#fae9e5; color:#9a473c; }
        .arrow { color:#8ba0a0; flex:none; }
        .detail { position:sticky; top:18px; }
        .detail-banner { padding:25px; color:#fff; background:linear-gradient(135deg, #176c70, #124d54); position:relative; overflow:hidden; }
        .detail-banner:after { content:""; position:absolute; width:190px; height:190px; border:1px solid rgba(255,255,255,.14); border-radius:50%; right:-55px; top:-70px; box-shadow:0 0 0 18px rgba(255,255,255,.04), 0 0 0 40px rgba(255,255,255,.035); }
        .detail-banner .eyebrow { color:#bce1d1; }
        .detail-banner h2 { font-size:29px; margin:10px 0 8px; position:relative; z-index:1; overflow-wrap:anywhere; }
        .domain { color:#d2e6dc; font-size:13px; overflow-wrap:anywhere; }
        .banner-tags { display:flex; gap:7px; flex-wrap:wrap; margin-top:17px; position:relative; z-index:1; }
        .banner-tags .pill { background:rgba(255,255,255,.14); color:#fff; }
        .profile-body { padding:21px 23px 24px; }
        .section-label { text-transform:uppercase; letter-spacing:.12em; color:#809295; font-size:10px; font-weight:800; margin:0 0 13px; }
        .people { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .person { border:1px solid var(--line); border-radius:12px; padding:12px; min-width:0; }
        .person-label { display:flex; align-items:center; gap:6px; color:var(--muted); font-size:11px; margin-bottom:7px; }
        .person-value { font-size:13px; font-weight:700; overflow-wrap:anywhere; }
        .metric-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .metric { border-radius:13px; background:#f6f8f4; padding:14px; min-width:0; }
        .metric.wide { grid-column:1/-1; background:var(--gold-pale); }
        .metric-label { color:#728488; font-size:11px; font-weight:700; }
        .metric-value { margin-top:7px; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:21px; font-weight:750; letter-spacing:-.04em; overflow-wrap:anywhere; }
        .metric.wide .metric-value { color:#8b5b20; font-size:26px; }
        .divider { height:1px; background:var(--line); margin:20px 0; }
        .facts { display:grid; grid-template-columns:1fr 1fr; gap:14px 12px; }
        .fact-label { font-size:10px; color:#859699; text-transform:uppercase; letter-spacing:.08em; font-weight:800; }
        .fact-value { margin-top:5px; font-size:13px; font-weight:650; line-height:1.4; overflow-wrap:anywhere; }
        .empty-state, .error-state { padding:36px 22px; text-align:center; color:var(--muted); }
        .empty-state svg { color:#94b6a7; margin-bottom:8px; }
        .empty-title { color:var(--ink); font-weight:750; margin-bottom:6px; }
        .empty-detail { font-size:13px; line-height:1.5; }
        .skeleton { height:74px; border-bottom:1px solid var(--line); background:linear-gradient(90deg,#fff 25%,#f2f6f2 45%,#fff 65%); background-size:200% 100%; animation:shimmer 1.4s ease-in-out infinite; }
        .detail-skeleton { height:390px; padding:25px; }
        .sk-line { height:14px; border-radius:8px; background:#edf2ed; margin-bottom:15px; }
        @keyframes shimmer { to { background-position:-200% 0; } }
        @media (max-width:900px) { .workspace { grid-template-columns:1fr; } .detail { position:static; } .list { max-height:540px; } }
        @media (max-width:560px) { .content { padding-top:24px; } .hero { align-items:flex-start; } .hero-stamp { width:64px; height:64px; } .hero-stamp:after { display:none; } .filters { grid-template-columns:repeat(2,minmax(0,1fr)); } .filters select:last-child { grid-column:1/-1; } .manifest-head { padding:18px 15px 14px; } .account-row { padding:15px; } .profile-body { padding:18px 16px; } .detail-banner { padding:22px 18px; } .top-note { display:none; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior:auto !important; animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; } }
      `}</style>

      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Anchor size={19} /></span> Captain’s Account Quarters</div>
        <div className="top-note">A clear chart of the customer waters</div>
      </header>

      <div className="content">
        <section className="hero">
          <div>
            <div className="eyebrow">The account fleet</div>
            <h1>Know every ship<br />in your harbor.</h1>
            <p className="intro">Search the manifest, chart an account’s journey, and keep its adoption and billing treasure in view.</p>
          </div>
          <div className="hero-stamp" aria-hidden="true"><ShipWheel size={32} /></div>
        </section>

        <div className="workspace">
          <section className="panel" aria-label="Account manifest">
            <div className="manifest-head">
              <div className="panel-title">
                <h2>Account manifest</h2>
                <span className="count">{manifest.loading ? "Charting…" : `${manifest.total.toLocaleString()} ${manifest.total === 1 ? "account" : "accounts"}`}</span>
              </div>
              <label className="searchbox">
                <Search size={18} aria-hidden="true" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search accounts, domains, industries…" aria-label="Search accounts" />
              </label>
              <div className="filters">
                <select aria-label="Filter by industry" value={industry} onChange={(event) => setIndustry(event.target.value)}>
                  <option value="">All industries</option>{selectOptions(industries.rows, "industry").map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <select aria-label="Filter by region" value={region} onChange={(event) => setRegion(event.target.value)}>
                  <option value="">All regions</option>{selectOptions(regions.rows, "region").map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="">All statuses</option>{selectOptions(statuses.rows, "status").map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <select aria-label="Filter by plan" value={plan} onChange={(event) => setPlan(event.target.value)}>
                  <option value="">All plans</option>{selectOptions(plans.rows, "current_plan").map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <select aria-label="Filter by owner" value={owner} onChange={(event) => setOwner(event.target.value)}>
                  <option value="">All owners</option>{selectOptions(owners.rows, "account_owner").map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>
              {isFiltered && <button className="clear" onClick={clearFilters}><X size={13} /> Clear all filters</button>}
            </div>

            {manifest.error ? (
              <div className="error-state" role="alert">{manifest.error}</div>
            ) : manifest.loading && manifest.rows.length === 0 ? (
              <div aria-label="Loading accounts"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
            ) : manifest.rows.length === 0 ? (
              <div className="empty-state"><Compass size={30} /><div className="empty-title">No accounts on this course</div><div className="empty-detail">Try a different search or clear the filters to widen the waters.</div></div>
            ) : (
              <div className="list">
                {manifest.rows.map((account) => (
                  <button key={account.__row_id} className={`account-row ${selectedId === account.account_id ? "selected" : ""}`} onClick={() => setSelectedId(account.account_id)} aria-pressed={selectedId === account.account_id}>
                    <div className="row-top">
                      <div>
                        <div className="name">{account.account_name || "Unnamed account"}</div>
                        <div className="subline">
                          {account.industry && <span>{account.industry}</span>}
                          {account.region && <span><MapPin size={12} style={{ verticalAlign: "-2px" }} /> {account.region}</span>}
                        </div>
                      </div>
                      <ChevronRight className="arrow" size={18} />
                    </div>
                    <div className="row-bottom">
                      <div className="meta">
                        <span className={`pill ${account.status?.toLowerCase() === "active" ? "active" : account.status?.toLowerCase() === "churned" ? "churned" : ""}`}>{account.status || "Status unknown"}</span>
                        {account.current_plan && <span className="pill">{account.current_plan}</span>}
                        {account.account_owner && <span className="pill">{account.account_owner}</span>}
                        {account.csm && <span className="pill">CSM · {account.csm}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="panel detail" aria-label="Selected account profile">
            {selectedId === null ? (
              <div className="empty-state" style={{ padding: "75px 28px" }}>
                <Compass size={34} />
                <div className="empty-title">Pick an account to inspect</div>
                <div className="empty-detail">Select a vessel from the manifest for its full profile, adoption chart, and billing treasure.</div>
              </div>
            ) : selectedLoading ? (
              <div className="detail-skeleton" aria-label="Loading account profile"><div className="sk-line" style={{ width: "40%" }} /><div className="sk-line" style={{ width: "75%", height: 30 }} /><div className="sk-line" style={{ width: "52%" }} /><div style={{ height: 100 }} /><div className="sk-line" /><div className="sk-line" /><div className="sk-line" /></div>
            ) : selectedError ? (
              <div className="error-state" role="alert">{selectedError}</div>
            ) : !active ? (
              <div className="empty-state"><div className="empty-title">Account not found</div><div className="empty-detail">This account may no longer be in the manifest.</div></div>
            ) : (
              <>
                <div className="detail-banner">
                  <div className="eyebrow">Account profile · #{active.account_id ?? "—"}</div>
                  <h2>{active.account_name || "Unnamed account"}</h2>
                  <div className="domain">{active.domain || "No domain recorded"}</div>
                  <div className="banner-tags">
                    {active.status && <span className="pill">{active.status}</span>}
                    {active.current_plan && <span className="pill">{active.current_plan} plan</span>}
                    {active.billing_period && <span className="pill">{active.billing_period} billing</span>}
                  </div>
                </div>
                <div className="profile-body">
                  <p className="section-label">The crew</p>
                  <div className="people">
                    <div className="person"><div className="person-label"><UserRound size={14} /> Account owner</div><div className="person-value">{active.account_owner || "Unassigned"}</div></div>
                    <div className="person"><div className="person-label"><UserRound size={14} /> Customer success</div><div className="person-value">{active.csm || "Unassigned"}</div></div>
                  </div>

                  <div className="divider" />
                  <p className="section-label">Adoption at a glance</p>
                  <div className="metric-grid">
                    <div className="metric"><div className="metric-label">Adopted features</div><div className="metric-value">{fmt(active.adopted_feature_count)}<span style={{ color: "#819296", fontSize: 14 }}> / {fmt(active.feature_record_count)}</span></div></div>
                    <div className="metric"><div className="metric-label">Monthly active users</div><div className="metric-value">{fmt(active.total_monthly_active_users)}</div></div>
                    <div className="metric"><div className="metric-label">Feature categories</div><div className="metric-value">{fmt(active.feature_category_count)}</div></div>
                    <div className="metric"><div className="metric-label">Last feature use</div><div className="metric-value" style={{ fontSize: 15 }}>{date(active.last_feature_use_date)}</div></div>
                  </div>

                  <div className="divider" />
                  <p className="section-label"><Coins size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Billing treasure</p>
                  <div className="metric-grid">
                    <div className="metric wide"><div className="metric-label">Total billed</div><div className="metric-value">{fmt(active.total_billed, true)}</div></div>
                    <div className="metric"><div className="metric-label">Invoice amount</div><div className="metric-value" style={{ fontSize: 17 }}>{fmt(active.total_invoice_amount, true)}</div></div>
                    <div className="metric"><div className="metric-label">Invoice tax</div><div className="metric-value" style={{ fontSize: 17 }}>{fmt(active.total_invoice_tax, true)}</div></div>
                    <div className="metric"><div className="metric-label">Invoices paid</div><div className="metric-value">{fmt(active.paid_invoice_count)}</div></div>
                    <div className="metric"><div className="metric-label">Invoices unpaid</div><div className="metric-value">{fmt(active.unpaid_invoice_count)}</div></div>
                  </div>

                  <div className="divider" />
                  <p className="section-label"><Boxes size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Account particulars</p>
                  <div className="facts">
                    <div><div className="fact-label">Industry</div><div className="fact-value">{active.industry || "—"}</div></div>
                    <div><div className="fact-label">Region</div><div className="fact-value">{active.region || "—"}</div></div>
                    <div><div className="fact-label">Company size</div><div className="fact-value">{active.company_size || "—"}{active.employee_count != null ? ` · ${fmt(active.employee_count)} employees` : ""}</div></div>
                    <div><div className="fact-label">Acquisition source</div><div className="fact-value">{active.acquisition_source || "—"}</div></div>
                    <div><div className="fact-label">Signup date</div><div className="fact-value">{date(active.signup_date)}</div></div>
                    <div><div className="fact-label">Converted date</div><div className="fact-value">{date(active.converted_date)}</div></div>
                    <div><div className="fact-label">Starting plan</div><div className="fact-value">{active.starting_plan || "—"}</div></div>
                    <div><div className="fact-label">Starting seats</div><div className="fact-value">{fmt(active.starting_seats)}</div></div>
                    <div><div className="fact-label">Last invoice</div><div className="fact-value">{date(active.last_invoice_date)}</div></div>
                    <div><div className="fact-label">Last paid</div><div className="fact-value">{date(active.last_paid_date)}</div></div>
                    {active.churned_date && <div><div className="fact-label">Churned</div><div className="fact-value">{date(active.churned_date)}{active.churn_reason ? ` · ${active.churn_reason}` : ""}</div></div>}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}