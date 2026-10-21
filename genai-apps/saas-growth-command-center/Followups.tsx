import { FormEvent, useState } from "react";
import { addRow, updateRow, useRows } from "@meridian/app";

type Section = "accounts" | "invoices" | "adoption";
type Status = "Not started" | "Contacted" | "In progress" | "Complete";

const accountStatuses: Status[] = ["Not started", "Contacted", "In progress", "Complete"];
const collectionStatuses = ["Follow-up needed", "Contacted", "Promise to pay", "Resolved", "Written off"] as const;

export function Followups({ search }: { search: string }) {
  const [section, setSection] = useState<Section>("accounts");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const accountRows = useRows("account_followups", { search, limit: 50 });
  const invoiceRows = useRows("invoice_collection_notes", { search, sort: [{ column: "created_at", direction: "desc" }], limit: 50 });
  const adoptionRows = useRows("adoption_followups", { search, sort: [{ column: "created_at", direction: "desc" }], limit: 50 });
  const accounts = useRows("account_index", { search, limit: 50 });

  const save = async (event: FormEvent<HTMLFormElement>, action: () => Promise<void>, button: HTMLButtonElement) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await action();
      setMessage("Saved");
      button.dataset.saved = "true";
      window.setTimeout(() => {
        setMessage("");
        delete button.dataset.saved;
      }, 4000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save follow-up. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const panel = section === "accounts" ? accountRows : section === "invoices" ? invoiceRows : adoptionRows;

  return <section className="card content-panel followups-panel">
    <div className="section-title">
      <div><h2>Team follow-ups</h2><p>Team-entered records only. These are not model-derived renewal dates or churn-risk scores.</p></div>
    </div>
    <div className="followup-tabs" role="tablist" aria-label="Follow-up type">
      {([["accounts", "Account follow-ups"], ["invoices", "Invoice collection"], ["adoption", "Adoption follow-ups"]] as const).map(([id, label]) =>
        <button key={id} className={`followup-tab ${section === id ? "selected" : ""}`} role="tab" aria-selected={section === id} onClick={() => { setSection(id); setMessage(""); }}>{label}</button>
      )}
    </div>

    {section === "accounts" && <AccountFollowups rows={accountRows.rows} accounts={accounts.rows} accountsTotal={accounts.total} search={search} saving={saving} message={message} onSave={save} />}
    {section === "invoices" && <form className="followup-form" onSubmit={(e) => {
      const form = e.currentTarget;
      const data = new FormData(form);
      const button = form.querySelector("button[type=submit]") as HTMLButtonElement;
      void save(e, () => addRow("invoice_collection_notes", {
        note_id: String(data.get("note_id")), invoice_id: String(data.get("invoice_id")),
        collection_status: data.get("collection_status") as typeof collectionStatuses[number], note: String(data.get("note")),
      }), button);
    }}>
      <h3>Log invoice collection</h3>
      <div className="form-grid">
        <label>Note ID<input name="note_id" required /></label><label>Invoice ID<input name="invoice_id" required /></label>
        <label>Collection status<select name="collection_status" required>{collectionStatuses.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="wide-field">Note<textarea name="note" required rows={3} /></label>
      </div>
      <SaveButton saving={saving} message={message} />
    </form>}
    {section === "adoption" && <form className="followup-form" onSubmit={(e) => {
      const form = e.currentTarget;
      const data = new FormData(form);
      const button = form.querySelector("button[type=submit]") as HTMLButtonElement;
      void save(e, () => addRow("adoption_followups", {
        followup_id: String(data.get("followup_id")), account_id: String(data.get("account_id")), feature: String(data.get("feature")),
        followup_status: data.get("followup_status") as Status, next_step: String(data.get("next_step")) || null,
        follow_up_date: String(data.get("follow_up_date")) || null, note: String(data.get("note")) || null,
      }), button);
    }}>
      <h3>Log an adoption follow-up</h3>
      <div className="form-grid">
        <label>Follow-up ID<input name="followup_id" required /></label><label>Account ID<input name="account_id" required /></label>
        <label>Feature<input name="feature" required /></label><label>Follow-up status<select name="followup_status">{accountStatuses.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Next step<input name="next_step" /></label><label>Follow-up date<input type="date" name="follow_up_date" /></label>
        <label className="wide-field">Note<textarea name="note" rows={3} /></label>
      </div>
      <SaveButton saving={saving} message={message} />
    </form>}

    <div className="followup-list">
      <div className="subsection-title"><h3>{section === "accounts" ? "Account records" : section === "invoices" ? "Collection notes" : "Adoption records"}</h3><span className="muted">{panel.total.toLocaleString()} records</span></div>
      {panel.error ? <div className="error-state">Could not load follow-up records. Try again.</div> : panel.loading ? <div className="skeleton table-skeleton" aria-label="Loading follow-up records" /> : panel.rows.length === 0 ? <div className="empty-state">{search ? "No follow-up records match this search." : "No follow-up records yet. Add one above to keep the team’s next steps together."}</div> :
        <div className="table-scroll"><table><thead><tr>{section === "accounts" ? <><th>Account</th><th>Status</th><th>Next step</th><th>Follow-up date</th><th>Notes</th><th>Edit</th></> : section === "invoices" ? <><th>Invoice</th><th>Status</th><th>Note</th><th>Created</th></> : <><th>Account</th><th>Feature</th><th>Status</th><th>Next step</th><th>Follow-up date</th><th>Note</th></>}</tr></thead><tbody>
          {section === "accounts" ? accountRows.rows.map((row) => {
            const account = accounts.rows.find((item) => item.account_id === row.account_id);
            return <tr key={row.__row_id}><td className="strong-cell">{account?.account_name || `Account ${row.account_id}`}<small>#{row.account_id ?? "—"}</small></td><td>{row.outreach_status || "Not started"}</td><td className="long-cell">{row.next_step || "—"}</td><td>{row.follow_up_date || "—"}</td><td className="long-cell">{row.notes || "—"}</td><td><AccountEdit row={row} saving={saving} onSave={save} /></td></tr>;
          }) : section === "invoices" ? invoiceRows.rows.map((row) => <tr key={row.__row_id}><td>{row.invoice_id || "—"}</td><td>{row.collection_status || "—"}</td><td className="long-cell">{row.note || "—"}</td><td>{row.created_at || "—"}</td></tr>) :
            adoptionRows.rows.map((row) => <tr key={row.__row_id}><td>{row.account_id || "—"}</td><td>{row.feature || "—"}</td><td>{row.followup_status || "—"}</td><td className="long-cell">{row.next_step || "—"}</td><td>{row.follow_up_date || "—"}</td><td className="long-cell">{row.note || "—"}</td></tr>)}
        </tbody></table></div>}
      {panel.total > panel.rows.length && <div className="table-foot">Showing {panel.rows.length} of {panel.total.toLocaleString()} records</div>}
    </div>
  </section>;
}

function SaveButton({ saving, message }: { saving: boolean; message: string }) {
  return <div className="save-line"><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save follow-up"}</button><span aria-live="polite" className={message && message !== "Saved" ? "save-error" : "save-message"}>{message}</span></div>;
}

function AccountFollowups({ rows, accounts, accountsTotal, search, saving, message, onSave }: {
  rows: ReturnType<typeof useRows<"account_followups">>["rows"];
  accounts: ReturnType<typeof useRows<"account_index">>["rows"];
  accountsTotal: number;
  search: string;
  saving: boolean;
  message: string;
  onSave: (event: FormEvent<HTMLFormElement>, action: () => Promise<void>, button: HTMLButtonElement) => void;
}) {
  const [accountId, setAccountId] = useState("");
  const picked = rows.find((row) => String(row.account_id) === accountId);
  return <form className="followup-form" onSubmit={(e) => {
    const form = e.currentTarget;
    const data = new FormData(form);
    const button = form.querySelector("button[type=submit]") as HTMLButtonElement;
    if (!picked) return;
    onSave(e, () => updateRow("account_followups", picked, {
      outreach_status: data.get("outreach_status") as Status, next_step: String(data.get("next_step")) || null,
      follow_up_date: String(data.get("follow_up_date")) || null, notes: String(data.get("notes")) || null,
    }), button);
  }}>
    <h3>Edit account follow-up</h3>
    <div className="form-grid">
      <label className="wide-field">Account<select required value={accountId} onChange={(e) => setAccountId(e.target.value)}><option value="">Choose an account</option>{accounts.map((account) => <option key={account.__row_id} value={account.account_id ?? ""}>{account.account_name || "Account"} · #{account.account_id}</option>)}</select></label>
      {picked && <>
        <label>Outreach status<select name="outreach_status" defaultValue={picked.outreach_status || "Not started"}>{accountStatuses.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Follow-up date<input type="date" name="follow_up_date" defaultValue={picked.follow_up_date || ""} /></label>
        <label className="wide-field">Next step<input name="next_step" defaultValue={picked.next_step || ""} /></label>
        <label className="wide-field">Notes<textarea name="notes" rows={3} defaultValue={picked.notes || ""} /></label>
      </>}
    </div>
    {search && accountsTotal > accounts.length && <p className="muted">Choose from the first {accounts.length} matching accounts. Search by account name or ID to narrow the list.</p>}
    <SaveButton saving={saving} message={message} />
  </form>;
}

function AccountEdit({ row, saving, onSave }: { row: { __row_id: string; account_id: number | null; outreach_status: Status | null; next_step: string | null; follow_up_date: string | null; notes: string | null }; saving: boolean; onSave: (event: FormEvent<HTMLFormElement>, action: () => Promise<void>, button: HTMLButtonElement) => void }) {
  return <span className="muted">{saving ? "Saving…" : row.account_id == null ? "—" : "Edit above"}</span>;
}