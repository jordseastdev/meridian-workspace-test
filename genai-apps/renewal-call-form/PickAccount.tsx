import { useState } from "react";
import { useRows } from "@meridian/app";
import { ChevronDown, Search } from "lucide-react";

type Props = {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  savedVersion: number;
};

export function PickAccount({ selectedId, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const subscriptions = useRows("subs", {
    filters: [
      { column: "status", values: ["Active"] },
      { column: "first_renewal_date", min: "2025-09-01", max: "2026-09-01" },
    ],
    sort: [{ column: "first_renewal_date", direction: "asc" }],
    limit: 1000,
  });

  const searchedAccounts = useRows("accounts", {
    search,
    filters: [{ column: "status", values: ["Active"] }],
    limit: 50,
  });

  const visibleIds = new Set(
    subscriptions.rows.map((row) => row.account_id).filter((id): id is number => id !== null),
  );
  const accounts = searchedAccounts.rows.filter((row) => row.account_id !== null && visibleIds.has(row.account_id));

  const selectedSubscription = subscriptions.rows.find((row) => row.account_id === selectedId);
  const accountRead = useRows("accounts", {
    filters: selectedId === null ? [] : [{ column: "account_id", values: [selectedId] }],
    limit: 1,
    enabled: selectedId !== null,
  });
  const selectedAccount = accountRead.rows[0];

  const tickets = useRows("tickets", {
    filters: selectedId === null ? [] : [{ column: "account_id", values: [selectedId] }],
    sort: [{ column: "created_date", direction: "desc" }],
    limit: 5,
    enabled: selectedId !== null,
  });

  return (
    <section className="card workflow-card">
      <div className="step-heading">
        <span className="step-marker">1</span>
        <div>
          <h2>Pick an account</h2>
          <p>Choose an active account with an upcoming first renewal.</p>
        </div>
      </div>

      <p className="data-note">These are the latest available renewal dates: September 1, 2025 to September 1, 2026.</p>

      <div className="picker-wrap">
        <button
          type="button"
          className={`account-picker ${pickerOpen ? "is-open" : ""}`}
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen((open) => !open)}
        >
          <span className="picker-copy">
            <span className="picker-label">{selectedAccount ? "Selected account" : "Select an account"}</span>
            <strong>{selectedAccount?.account_name || "Choose from eligible accounts"}</strong>
            {selectedSubscription && (
              <span className="picker-subline">
                {selectedSubscription.plan_name || "Plan not listed"} · Renewal {selectedSubscription.first_renewal_date}
              </span>
            )}
          </span>
          <ChevronDown size={18} aria-hidden="true" />
        </button>

        {pickerOpen && (
          <div className="picker-popover">
            <label className="search-control">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search active accounts"
                aria-label="Search active accounts"
              />
            </label>
            {subscriptions.loading || searchedAccounts.loading ? (
              <div className="list-skeleton" aria-label="Loading eligible accounts">
                <span /><span /><span />
              </div>
            ) : subscriptions.error || searchedAccounts.error ? (
              <p className="inline-error">Accounts could not be loaded. Close and try again.</p>
            ) : accounts.length === 0 ? (
              <p className="empty-copy">{search ? "No eligible accounts match this search." : "No active accounts with renewal dates in this range."}</p>
            ) : (
              <div className="account-options">
                {accounts.map((account) => {
                  const subscription = subscriptions.rows.find((row) => row.account_id === account.account_id);
                  return (
                    <button
                      type="button"
                      className="account-option"
                      key={account.__row_id}
                      onClick={() => {
                        onSelect(account.account_id);
                        setPickerOpen(false);
                        setSearch("");
                      }}
                    >
                      <span><strong>{account.account_name || "Unnamed account"}</strong><small>{subscription?.plan_name || "Plan not listed"}</small></span>
                      <span className="option-date">{subscription?.first_renewal_date || "Date unavailable"}</span>
                    </button>
                  );
                })}
                {searchedAccounts.total > searchedAccounts.rows.length && (
                  <p className="list-count">Showing {searchedAccounts.rows.length} of {searchedAccounts.total} accounts. Search to narrow the list.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {subscriptions.error && <p className="inline-error">Renewal subscriptions could not be loaded. Try again.</p>}

      {selectedId !== null && (
        <div className="account-details">
          {accountRead.loading ? (
            <div className="detail-skeleton"><span /><span /></div>
          ) : accountRead.error ? (
            <p className="inline-error">Account details could not be loaded.</p>
          ) : selectedAccount ? (
            <>
              <div className="detail-grid">
                <div><span className="detail-label">Plan</span><strong>{selectedSubscription?.plan_name || "Not listed"}</strong></div>
                <div><span className="detail-label">Current MRR</span><strong className="money">{
                  subscriptions.rows.find((row) => row.account_id === selectedId)?.current_mrr == null
                    ? "Not available"
                    : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
                        subscriptions.rows.find((row) => row.account_id === selectedId)!.current_mrr!,
                      )
                }</strong></div>
                <div><span className="detail-label">Account owner</span><strong>{selectedAccount.account_owner || "Not listed"}</strong></div>
                <div><span className="detail-label">Renewal date</span><strong>{selectedSubscription?.first_renewal_date || "Not listed"}</strong></div>
              </div>

              <div className="tickets-section">
                <div className="subsection-heading">
                  <h3>Recent support tickets</h3>
                  {tickets.total > 0 && <span>{tickets.total} total</span>}
                </div>
                {tickets.loading ? (
                  <div className="list-skeleton compact" aria-label="Loading support tickets"><span /><span /></div>
                ) : tickets.error ? (
                  <p className="inline-error">Support tickets could not be loaded.</p>
                ) : tickets.rows.length === 0 ? (
                  <p className="empty-copy">No support tickets are recorded for this account.</p>
                ) : (
                  <div className="ticket-list">
                    {tickets.rows.map((ticket) => (
                      <div className="ticket-row" key={ticket.__row_id}>
                        <div className="ticket-main">
                          <strong>{ticket.category || "Uncategorized"}</strong>
                          <span>{ticket.created_date || "Date unavailable"} · {ticket.priority || "Priority not listed"}</span>
                        </div>
                        <span className="pill">{ticket.status || "Status not listed"}</span>
                      </div>
                    ))}
                    {tickets.total > tickets.rows.length && (
                      <p className="list-count">Showing {tickets.rows.length} of {tickets.total} tickets.</p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="empty-copy">Account details are not available.</p>
          )}
        </div>
      )}
    </section>
  );
}