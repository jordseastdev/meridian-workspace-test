import { useState } from "react";
import { Search, Users, ArrowLeft, Plus } from "lucide-react";
import { useRows } from "@meridian/app";
import { AccountDetail } from "./AccountDetail";
import { VisitForm } from "./VisitForm";
import "./styles.css";

export default function App() {
  const [search, setSearch] = useState("");
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [loggingVisit, setLoggingVisit] = useState(false);
  const accounts = useRows("accounts", {
    search,
    sort: [{ column: "account", direction: "asc" }],
    limit: 50,
  });
  const detail = useRows("accounts", {
    filters: pickedId === null ? [] : [{ column: "account_id", values: [pickedId] }],
    limit: 1,
    enabled: pickedId !== null,
  });
  const selected = detail.rows[0];

  return (
    <main className="app-shell">
      <header className="topbar">
        {pickedId !== null ? (
          <button className="icon-btn" aria-label="Back to accounts" onClick={() => { setPickedId(null); setLoggingVisit(false); }}>
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div className="brand-mark"><Users size={19} /></div>
        )}
        <span className="brand-name">Fieldbook</span>
        {pickedId !== null && selected && (
          <button className="btn btn-primary top-action" onClick={() => setLoggingVisit(true)}>
            <Plus size={17} /> Log visit
          </button>
        )}
      </header>

      {pickedId === null ? (
        <section className="account-view">
          <div className="page-heading">
            <h1>Accounts</h1>
            <p>Find an account to review or log a visit.</p>
          </div>
          <label className="search-box">
            <Search size={19} aria-hidden="true" />
            <input
              aria-label="Search accounts"
              placeholder="Search accounts"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && <button className="clear-search" onClick={() => setSearch("")} aria-label="Clear search">Clear</button>}
          </label>
          <div className="list-meta">{accounts.loading ? "Loading accounts…" : `${accounts.total.toLocaleString()} ${accounts.total === 1 ? "account" : "accounts"}`}</div>
          {accounts.error ? (
            <div className="message error" role="alert">Accounts couldn’t be loaded. Try again.</div>
          ) : accounts.loading ? (
            <div className="account-list" aria-label="Loading accounts">{[0, 1, 2, 3, 4].map((item) => <div className="account-skeleton" key={item} />)}</div>
          ) : accounts.rows.length === 0 ? (
            <div className="empty-state"><strong>{search ? "No accounts match your search" : "No accounts available"}</strong><span>{search ? "Try a different account name, owner, or region." : "Accounts will appear here when they’re available."}</span></div>
          ) : (
            <>
              <div className="account-list">
                {accounts.rows.map((account) => (
                  <button className="account-row" key={account.__row_id} onClick={() => setPickedId(account.account_id)}>
                    <span className="account-row-main">
                      <strong>{account.account || "Unnamed account"}</strong>
                      <span>{account.owner || "No owner"}{account.region ? ` · ${account.region}` : ""}</span>
                    </span>
                    <span className="lane-pill">{account.lane || "Unassigned"}</span>
                  </button>
                ))}
              </div>
              {accounts.total > accounts.rows.length && <p className="showing-note">Showing {accounts.rows.length} of {accounts.total.toLocaleString()} accounts</p>}
            </>
          )}
        </section>
      ) : detail.error ? (
        <section className="detail-view"><div className="message error" role="alert">Account details couldn’t be loaded. Go back and try again.</div></section>
      ) : detail.loading ? (
        <section className="detail-view"><div className="detail-skeleton" /><div className="detail-skeleton short" /></section>
      ) : selected ? (
        <AccountDetail
          account={selected}
          loggingVisit={loggingVisit}
          onCancelVisit={() => setLoggingVisit(false)}
          onVisitSaved={() => setLoggingVisit(false)}
        />
      ) : (
        <section className="detail-view"><div className="empty-state"><strong>Account not found</strong><span>Go back to the account list and choose another account.</span></div></section>
      )}
    </main>
  );
}