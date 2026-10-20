import React, { useState } from "react";
import { addRow, updateRow, useRows, useUser } from "@meridian/app";
import { Search, X, ChevronRight, Inbox, Clock3, AlertTriangle, Check, UserRound } from "lucide-react";

type QueueRow = {
  __row_id: string;
  ticket_id: string | null;
  category: string | null;
  priority: string | null;
  ticket_status: string | null;
  opened_at: string | null;
  assigned_to: string | null;
};
type WorkRow = {
  __row_id: string;
  ticket_id: string | null;
  customer_id: number | null;
  order_id: number | null;
  opened_at: string | null;
  contact_channel: string | null;
  category: string | null;
  priority: string | null;
  original_agent: string | null;
  ticket_status: string | null;
  first_response: number | null;
  resolution: number | null;
  csat: number | null;
  assigned_to: string | null;
  working_note: string | null;
  follow_up_date: string | null;
  closed: boolean | null;
};

const dateLabel = (date: string | null | undefined) => {
  if (!date) return "Date unavailable";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function SupportDesk() {
  const user = useUser();
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [assignee, setAssignee] = useState("");
  const [note, setNote] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);

  const queue = useRows("ticket_queue", {
    filters: [{ column: "ticket_status", values: ["Open"] }],
    search: search.trim() || undefined,
    sort: [{ column: "opened_at", direction: "desc" }],
    limit: 100,
  });
  const urgent = useRows("ticket_queue", {
    filters: [
      { column: "ticket_status", values: ["Open"] },
      { column: "priority", values: ["Urgent"] },
    ],
    limit: 1,
  });
  const detail = useRows("ticket_work", {
    filters: [{ column: "ticket_id", values: [picked ?? ""] }],
    enabled: Boolean(picked),
    limit: 1,
  });

  const selected = (detail.rows[0] as WorkRow | undefined);
  const pickedQueue = (queue.rows as QueueRow[]).find((row) => row.ticket_id === picked);

  React.useEffect(() => {
    if (!picked) return;
    if (selected) {
      setAssignee(selected.assigned_to ?? "");
      setNote(selected.working_note ?? "");
      setIsClosed(selected.closed === true);
    } else if (!detail.loading && !detail.error) {
      setAssignee(pickedQueue?.assigned_to ?? "");
      setNote("");
      setIsClosed(false);
    }
  }, [picked, selected, detail.loading, detail.error, pickedQueue]);

  const openTicket = (ticket: QueueRow) => {
    setNotice(null);
    setPicked(ticket.ticket_id);
    setAssignee("");
    setNote("");
    setIsClosed(false);
  };

  const save = async () => {
    if (!picked) return;
    setSaving(true);
    setNotice(null);
    try {
      const values = {
        assigned_to: assignee.trim() || null,
        working_note: note.trim() || null,
        closed: isClosed,
      };
      if (selected) await updateRow("ticket_work", selected, values);
      else await addRow("ticket_work", values);
      setNotice({ text: "Ticket updated." });
    } catch (error) {
      setNotice({
        text: error instanceof Error ? error.message : "Could not save this ticket.",
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const priorityClass = (priority: string | null) => {
    const value = (priority ?? "Normal").toLowerCase();
    return value === "urgent" ? "urgent" : value === "high" ? "high" : value === "low" ? "low" : "normal";
  };

  return (
    <main className="app">
      <style>{`
        :root {
          color-scheme: light;
          --ink: #202e2a; --muted: #718079; --line: #e5ebe6;
          --paper: #f5f7f3; --white: #fff; --green: #246b55;
          --green-dark: #194d3e; --mint: #e5f2eb; --amber: #ad5c18;
          --red: #a6423c; --shadow: 0 14px 45px rgba(33,54,43,.10);
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--paper); color: var(--ink); }
        button, input, textarea, select { font: inherit; }
        button { cursor: pointer; }
        .app { min-height: 100vh; }
        .topbar { background: #fff; border-bottom: 1px solid var(--line); }
        .top-inner { max-width: 1160px; margin: auto; height: 70px; padding: 0 28px; display:flex; align-items:center; justify-content:space-between; }
        .brand { display:flex; align-items:center; gap:11px; font-size:15px; font-weight:750; letter-spacing:-.02em; }
        .brand-mark { width:34px; height:34px; border-radius:11px; background:var(--green); color:#fff; display:grid; place-items:center; }
        .user-chip { display:flex; align-items:center; gap:9px; color:var(--muted); font-size:13px; }
        .avatar { width:32px; height:32px; border-radius:50%; background:var(--mint); color:var(--green-dark); display:grid; place-items:center; font-size:12px; font-weight:700; }
        .content { max-width:1160px; margin:0 auto; padding:40px 28px 70px; }
        .intro { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:26px; }
        .eyebrow { color:var(--green); font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; margin:0 0 9px; }
        h1 { font-size:clamp(29px,4vw,38px); letter-spacing:-.045em; line-height:1.1; margin:0; }
        .subhead { color:var(--muted); margin:10px 0 0; font-size:14px; }
        .kpis { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin-bottom:30px; max-width:660px; }
        .kpi { background:#fff; border:1px solid var(--line); border-radius:16px; padding:19px 20px; display:flex; align-items:center; gap:15px; box-shadow:0 2px 8px rgba(20,40,31,.025); }
        .kpi-icon { flex:0 0 42px; width:42px; height:42px; display:grid; place-items:center; border-radius:13px; background:var(--mint); color:var(--green); }
        .kpi-icon.alert { background:#fff0e8; color:var(--amber); }
        .kpi-label { color:var(--muted); font-size:12px; font-weight:650; }
        .kpi-value { font-size:26px; line-height:1.2; font-weight:750; letter-spacing:-.04em; margin-top:3px; }
        .section-head { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:15px; }
        .section-title { display:flex; align-items:center; gap:10px; }
        h2 { margin:0; font-size:19px; letter-spacing:-.025em; }
        .count { font-size:12px; color:var(--muted); background:#e9eeea; border-radius:20px; padding:4px 9px; font-weight:700; }
        .searchbox { height:44px; display:flex; align-items:center; gap:10px; max-width:360px; flex:1; padding:0 13px; background:#fff; border:1px solid var(--line); border-radius:11px; color:#84918a; transition:border .15s, box-shadow .15s; }
        .searchbox:focus-within { border-color:#8eb6a2; box-shadow:0 0 0 3px rgba(36,107,85,.10); }
        .searchbox input { border:0; outline:0; background:transparent; width:100%; min-width:0; color:var(--ink); font-size:13px; }
        .cards { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
        .ticket { position:relative; text-align:left; min-height:145px; border:1px solid var(--line); border-radius:15px; background:#fff; padding:17px 18px; color:var(--ink); transition:transform .16s, border-color .16s, box-shadow .16s; }
        .ticket:hover { transform:translateY(-2px); border-color:#c9d8cf; box-shadow:0 9px 22px rgba(33,54,43,.07); }
        .ticket:focus-visible, .icon-button:focus-visible, .save:focus-visible { outline:3px solid #95c3aa; outline-offset:2px; }
        .ticket-top { display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .ticket-id { font:700 12px ui-monospace, SFMono-Regular, Menlo, monospace; color:var(--muted); }
        .badge { display:inline-flex; align-items:center; border-radius:99px; padding:5px 9px; font-size:11px; font-weight:750; white-space:nowrap; }
        .status { color:var(--green-dark); background:var(--mint); }
        .priority { margin-left:7px; }
        .urgent { color:#a14237; background:#fff0eb; }
        .high { color:#985315; background:#fff4e3; }
        .normal { color:#66736c; background:#f0f3f0; }
        .low { color:#54715e; background:#edf5ee; }
        .category { margin:14px 0 15px; font-weight:700; font-size:15px; letter-spacing:-.01em; overflow-wrap:anywhere; }
        .ticket-foot { display:flex; align-items:center; justify-content:space-between; gap:10px; color:var(--muted); font-size:12px; }
        .meta { display:inline-flex; align-items:center; gap:6px; min-width:0; }
        .meta span { overflow-wrap:anywhere; }
        .skeleton { height:145px; border:1px solid var(--line); border-radius:15px; background:linear-gradient(100deg,#fff 30%,#f1f4f0 50%,#fff 70%); background-size:200% 100%; animation:shimmer 1.2s infinite; }
        @keyframes shimmer { to { background-position:-200% 0; } }
        .empty, .error-box { background:#fff; border:1px dashed #d7e0d9; border-radius:15px; padding:34px 20px; text-align:center; color:var(--muted); }
        .empty-icon { color:#8ca99a; margin-bottom:10px; }
        .error-box { color:var(--red); border-color:#e9c5c1; }
        .empty strong { display:block; color:var(--ink); font-size:14px; margin-bottom:5px; }
        .panel-backdrop { position:fixed; inset:0; z-index:5; background:rgba(20,32,27,.38); display:flex; justify-content:flex-end; }
        .panel { height:100%; width:min(520px,100%); overflow:auto; background:#fbfcfa; box-shadow:var(--shadow); padding:27px clamp(20px,4vw,34px) 32px; animation:slide-in .2s ease-out; }
        @keyframes slide-in { from { transform:translateX(16px); opacity:.6; } to { transform:translateX(0); opacity:1; } }
        .panel-head { display:flex; justify-content:space-between; align-items:center; gap:12px; padding-bottom:21px; border-bottom:1px solid var(--line); }
        .panel-kicker { color:var(--muted); font:700 12px ui-monospace, SFMono-Regular, Menlo, monospace; }
        .icon-button { width:42px; height:42px; border:1px solid var(--line); color:var(--ink); background:#fff; border-radius:12px; display:grid; place-items:center; }
        .detail-title { margin:22px 0 14px; font-size:25px; line-height:1.2; letter-spacing:-.04em; overflow-wrap:anywhere; }
        .badge-row { display:flex; align-items:center; flex-wrap:wrap; gap:3px; }
        .facts { margin:23px 0 25px; padding:16px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); display:grid; grid-template-columns:1fr 1fr; gap:17px 12px; }
        .fact-label { display:block; color:var(--muted); font-size:11px; margin-bottom:5px; }
        .fact-value { display:block; font-size:13px; font-weight:650; overflow-wrap:anywhere; }
        .form-title { font-size:15px; margin:0 0 17px; letter-spacing:-.015em; }
        .field { display:block; margin:0 0 16px; }
        .field label { display:block; font-size:12px; font-weight:700; margin-bottom:7px; }
        .field input, .field textarea, .field select { width:100%; min-height:44px; padding:11px 12px; border:1px solid #dce4dd; border-radius:10px; outline:0; background:#fff; color:var(--ink); }
        .field textarea { min-height:112px; resize:vertical; line-height:1.5; }
        .field input:focus, .field textarea:focus, .field select:focus { border-color:#82ae96; box-shadow:0 0 0 3px rgba(36,107,85,.09); }
        .hint { font-size:11px; color:var(--muted); margin-top:6px; }
        .save-row { display:flex; align-items:center; gap:12px; margin-top:22px; }
        .save { min-height:46px; padding:0 20px; background:var(--green); color:#fff; border:0; border-radius:11px; font-size:13px; font-weight:750; transition:background .15s, transform .15s; }
        .save:hover:not(:disabled) { background:var(--green-dark); transform:translateY(-1px); }
        .save:disabled { opacity:.65; cursor:wait; }
        .notice { font-size:12px; color:var(--green); font-weight:650; overflow-wrap:anywhere; }
        .notice.error { color:var(--red); }
        .detail-loading { display:grid; gap:12px; margin-top:24px; }
        .line-skeleton { height:15px; border-radius:8px; background:#e9efea; animation:pulse 1.2s infinite alternate; }
        @keyframes pulse { to { opacity:.5; } }
        @media (max-width:700px) {
          .top-inner { height:62px; padding:0 18px; }
          .content { padding:29px 18px 48px; }
          .intro { align-items:flex-start; }
          .cards { grid-template-columns:1fr; }
          .ticket { min-height:132px; }
          .skeleton { height:132px; }
        }
        @media (max-width:470px) {
          .content { padding:25px 15px 40px; }
          .intro { margin-bottom:21px; }
          .subhead { max-width:260px; line-height:1.5; }
          .kpis { gap:9px; }
          .kpi { padding:14px 12px; gap:10px; border-radius:13px; }
          .kpi-icon { flex-basis:36px; width:36px; height:36px; }
          .kpi-value { font-size:23px; }
          .section-head { align-items:stretch; flex-direction:column; }
          .searchbox { max-width:none; }
          .user-name { display:none; }
          .panel { padding-top:17px; }
          .facts { gap:15px 8px; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; scroll-behavior:auto !important; transition-duration:.01ms !important; }
        }
      `}</style>

      <header className="topbar">
        <div className="top-inner">
          <div className="brand"><span className="brand-mark"><Inbox size={18} /></span>Support desk</div>
          <div className="user-chip"><span className="avatar">{(user.name || user.email || "S").slice(0, 1).toUpperCase()}</span><span className="user-name">{user.name || user.email}</span></div>
        </div>
      </header>

      <div className="content">
        <div className="intro">
          <div>
            <p className="eyebrow">Customer care · workspace</p>
            <h1>Good support starts here.</h1>
            <p className="subhead">Your open queue, ready for the next thoughtful reply.</p>
          </div>
        </div>

        <section className="kpis" aria-label="Queue summary">
          <div className="kpi">
            <span className="kpi-icon"><Inbox size={19} /></span>
            <div>
              <div className="kpi-label">Open tickets</div>
              {queue.loading ? <div className="line-skeleton" style={{ width: 48, marginTop: 8 }} /> : <div className="kpi-value">{queue.total}</div>}
            </div>
          </div>
          <div className="kpi">
            <span className="kpi-icon alert"><AlertTriangle size={19} /></span>
            <div>
              <div className="kpi-label">Urgent tickets</div>
              {urgent.loading ? <div className="line-skeleton" style={{ width: 48, marginTop: 8 }} /> : <div className="kpi-value">{urgent.total}</div>}
            </div>
          </div>
        </section>

        <section aria-label="Open ticket queue">
          <div className="section-head">
            <div className="section-title"><h2>Open queue</h2><span className="count">{queue.total}</span></div>
            <label className="searchbox"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tickets…" aria-label="Search tickets" /></label>
          </div>

          {queue.error ? <div className="error-box">Couldn’t load the ticket queue: {queue.error}</div> :
            queue.loading && queue.rows.length === 0 ? <div className="cards">{Array.from({ length: 4 }, (_, index) => <div className="skeleton" key={index} />)}</div> :
            queue.rows.length === 0 ? <div className="empty"><div className="empty-icon"><Inbox size={25} /></div><strong>{search ? "No matching tickets" : "The queue is clear"}</strong>{search ? "Try a different search." : "There are no open tickets to work right now."}</div> :
            <div className="cards">{(queue.rows as QueueRow[]).map((ticket) => (
              <button className="ticket" key={ticket.__row_id} onClick={() => openTicket(ticket)}>
                <div className="ticket-top">
                  <span className="ticket-id">{ticket.ticket_id || "Ticket"}</span>
                  <span><span className="badge status">{ticket.ticket_status || "Open"}</span><span className={`badge priority ${priorityClass(ticket.priority)}`}>{ticket.priority || "Normal"}</span></span>
                </div>
                <div className="category">{ticket.category || "Uncategorized ticket"}</div>
                <div className="ticket-foot">
                  <span className="meta"><UserRound size={14} /><span>{ticket.assigned_to || "Unassigned"}</span></span>
                  <span className="meta"><Clock3 size={14} /><span>{dateLabel(ticket.opened_at)}</span><ChevronRight size={15} /></span>
                </div>
              </button>
            ))}</div>
          }
        </section>
      </div>

      {picked && (
        <div className="panel-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPicked(null); }}>
          <aside className="panel" role="dialog" aria-modal="true" aria-label="Ticket details">
            <div className="panel-head">
              <span className="panel-kicker">{picked}</span>
              <button className="icon-button" onClick={() => setPicked(null)} aria-label="Close ticket details"><X size={19} /></button>
            </div>

            {detail.loading && !selected ? (
              <div className="detail-loading"><div className="line-skeleton" style={{ width: "64%", height: 25 }} /><div className="line-skeleton" /><div className="line-skeleton" style={{ height: 90 }} /></div>
            ) : detail.error ? <div className="error-box" style={{ marginTop: 22 }}>Couldn’t load this ticket: {detail.error}</div> : (
              <>
                <h2 className="detail-title">{selected?.category || pickedQueue?.category || "Ticket details"}</h2>
                <div className="badge-row">
                  <span className="badge status">{isClosed ? "Closed" : selected?.ticket_status || pickedQueue?.ticket_status || "Open"}</span>
                  <span className={`badge priority ${priorityClass(selected?.priority ?? pickedQueue?.priority ?? null)}`}>{selected?.priority || pickedQueue?.priority || "Normal"} priority</span>
                </div>
                <div className="facts">
                  <div><span className="fact-label">Opened</span><span className="fact-value">{dateLabel(selected?.opened_at ?? pickedQueue?.opened_at)}</span></div>
                  <div><span className="fact-label">Assigned to</span><span className="fact-value">{selected?.assigned_to || pickedQueue?.assigned_to || "Unassigned"}</span></div>
                  <div><span className="fact-label">Contact channel</span><span className="fact-value">{selected?.contact_channel || "—"}</span></div>
                  <div><span className="fact-label">Original agent</span><span className="fact-value">{selected?.original_agent || "—"}</span></div>
                  <div><span className="fact-label">Customer ID</span><span className="fact-value">{selected?.customer_id ?? "—"}</span></div>
                  <div><span className="fact-label">Order ID</span><span className="fact-value">{selected?.order_id ?? "—"}</span></div>
                </div>

                <h3 className="form-title">Update ticket</h3>
                <label className="field">
                  <label htmlFor="assignee">Assignee</label>
                  <input id="assignee" value={assignee} onChange={(event) => setAssignee(event.target.value)} placeholder="Name or team" />
                  <div className="hint">Leave blank to mark the ticket unassigned.</div>
                </label>
                <label className="field">
                  <label htmlFor="ticket-status">Status</label>
                  <select id="ticket-status" value={isClosed ? "closed" : "open"} onChange={(event) => setIsClosed(event.target.value === "closed")}>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>
                <label className="field">
                  <label htmlFor="internal-note">Internal note</label>
                  <textarea id="internal-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add context for your team…" />
                </label>

                <div className="save-row">
                  <button className="save" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
                  {notice && <span className={`notice ${notice.error ? "error" : ""}`} role="status">{notice.error ? notice.text : <><Check size={14} style={{ verticalAlign: "-3px", marginRight: 4 }} />{notice.text}</>}</span>}
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}