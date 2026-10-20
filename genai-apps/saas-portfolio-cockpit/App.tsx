import React, { useMemo, useState } from "react";
import { addRow, updateRow, useRows } from "@meridian/app";
import type { Filter } from "@meridian/app";
import { Activity, CalendarDays, Check, ChevronDown, Search, StickyNote, X } from "lucide-react";

type Account = ReturnType<typeof useRows<"accounts">>["rows"][number];

function date(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(parsed);
}
function number(value: number) {
  return new Intl.NumberFormat().format(value);
}
function money(value: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function App() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sort, setSort] = useState<"account_name" | "total_billed">("account_name");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  const accountGroups = useRows("accounts", { groupBy: "status", limit: 1000 });
  const filters = useMemo(() => {
    const result: Filter<"accounts">[] = [];
    if (status) result.push({ column: "status", values: [status] });
    return result;
  }, [status]);
  const accounts = useRows("accounts", {
    filters,
    search: search || undefined,
    sort: [{ column: sort, direction }],
    limit: 50,
  });
  const picked = useRows("accounts", {
    filters: selectedId === null ? [] : [{ column: "account_id", values: [selectedId] }],
    enabled: selectedId !== null,
    limit: 1,
  });
  const work = useRows("account_work", {
    filters: selectedId === null ? [] : [{ column: "account_id", values: [selectedId] }],
    enabled: selectedId !== null,
    limit: 1,
  });
  const notes = useRows("notes", {
    filters: selectedId === null ? [] : [{ column: "account_id", values: [String(selectedId)] }],
    sort: [{ column: "created_at", direction: "desc" }],
    enabled: selectedId !== null,
    limit: 50,
  });

  return (
    <main className="app-shell">
      <style>{`
        :root{color-scheme:dark;--bg:#08121d;--surface:#101e2b;--surface2:#132331;--line:#243746;--muted:#91a2b1;--text:#edf4f7;--teal:#59d5c3;--green:#7bdbad;--red:#f07c77;--sans:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        *{box-sizing:border-box}body{margin:0;background:var(--bg)}button,input,select,textarea{font:inherit}
        .app-shell{min-height:100vh;color:var(--text);background:radial-gradient(ellipse at 82% -15%,rgba(45,113,119,.17),transparent 35%),var(--bg);font-family:var(--sans)}
        .wrap{width:min(1280px,100%);margin:auto;padding:34px 38px 56px}.topbar{display:flex;align-items:center;gap:12px;margin-bottom:38px}
        .mark{width:38px;height:38px;display:grid;place-items:center;border:1px solid #2b5455;border-radius:12px;color:var(--teal);background:#102b31}
        .brand{font-size:13px;font-weight:750;letter-spacing:.12em;text-transform:uppercase}.sub{color:var(--muted);font-size:12px;margin-top:3px}
        .eyebrow{color:var(--teal);font-size:11px;font-weight:750;letter-spacing:.15em;text-transform:uppercase}h1{font-size:clamp(27px,4vw,38px);line-height:1.15;letter-spacing:-.04em;margin:8px 0}
        .intro{max-width:700px;color:var(--muted);font-size:14px;line-height:1.6;margin-bottom:26px}
        .panel,.card{border:1px solid var(--line);background:linear-gradient(145deg,rgba(19,35,49,.96),rgba(14,27,39,.96));border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.12)}
        .panel{padding:20px;min-width:0}.layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(300px,.8fr);gap:16px;align-items:start}
        .heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}.title{font-size:16px;font-weight:700;margin:0}.muted{color:var(--muted);font-size:12px;line-height:1.5;margin-top:5px}
        .tools{display:grid;grid-template-columns:minmax(170px,1fr) minmax(140px,.4fr);gap:9px;margin-bottom:12px}
        .control{display:flex;align-items:center;gap:8px;min-width:0;min-height:44px;padding:0 11px;background:#0e1b27;border:1px solid var(--line);border-radius:9px;color:var(--muted)}
        .control input,.control select,.control textarea{width:100%;min-width:0;border:0;outline:0;color:var(--text);background:transparent;font-size:13px}
        .control textarea{resize:vertical;padding:12px 0;line-height:1.5}.control select option{background:#10202d}
        button{cursor:pointer}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--teal);outline-offset:2px}
        .count{font-size:12px;color:var(--muted);margin:12px 0}.list{display:grid;gap:9px}
        .account{width:100%;text-align:left;color:var(--text);padding:14px;border:1px solid var(--line);border-radius:11px;background:#101e2b;transition:border-color .16s,background .16s}
        .account:hover,.account.selected{border-color:#3c6670;background:#132633}.account-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
        .name{font-size:14px;font-weight:700;overflow-wrap:anywhere}.meta{font-size:11px;color:var(--muted);margin-top:4px;line-height:1.5}
        .badge{display:inline-flex;align-items:center;min-height:25px;padding:4px 9px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}
        .active{color:var(--green);background:rgba(62,158,113,.14);border:1px solid rgba(62,158,113,.25)}.churned{color:var(--red);background:rgba(198,91,87,.14);border:1px solid rgba(198,91,87,.25)}
        .facts{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}.tag{border:1px solid var(--line);background:#142532;padding:5px 8px;border-radius:7px;color:#c2d0d8;font-size:11px}
        .form{display:grid;gap:11px}.field label{display:block;color:#c5d2d9;font-size:12px;font-weight:650;margin:0 0 6px}
        .actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.primary,.secondary{min-height:42px;padding:0 14px;border-radius:9px;font-weight:700;font-size:12px}
        .primary{border:1px solid #378e84;background:#1b625f;color:#edfffc}.primary:hover{background:#23756f}.secondary{border:1px solid var(--line);background:transparent;color:#c2d0d9}
        .feedback{font-size:12px;color:var(--green);min-height:18px}.error{color:#ffaaa5}.empty{padding:28px 16px;text-align:center;color:var(--muted);font-size:13px}
        .notes{display:grid;gap:9px;margin-top:18px}.note{padding:12px;border:1px solid var(--line);border-radius:10px;background:#0e1b27;min-width:0}
        .note-text{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.55}.note-date{font-size:11px;color:var(--muted);margin-top:8px}
        .skeleton{height:78px;border-radius:11px;background:linear-gradient(100deg,#11202c 30%,#172a37 45%,#11202c 60%);background-size:200% 100%;animation:shimmer 1.5s ease-in-out infinite}
        @keyframes shimmer{to{background-position-x:-200%}}.list-note{font-size:11px;color:var(--muted);line-height:1.55;margin-top:13px}
        @media(max-width:800px){.wrap{padding:24px 18px 40px}.layout{grid-template-columns:1fr}.tools{grid-template-columns:1fr 1fr}}
        @media(max-width:430px){.wrap{padding:20px 12px 32px}.panel{padding:15px}.tools{grid-template-columns:1fr}}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
      `}</style>

      <div className="wrap">
        <header className="topbar">
          <div className="mark"><Activity size={19} /></div>
          <div><div className="brand">Meridian / Portfolio</div><div className="sub">Customer success operating console</div></div>
        </header>
        <div className="eyebrow">SaaS account intelligence</div>
        <h1>Portfolio cockpit</h1>
        <p className="intro">Find an account, plan the next touchpoint, and keep durable context in append-only notes.</p>

        <div className="layout">
          <section className="panel">
            <div className="heading">
              <div><h2 className="title">Account directory</h2><div className="muted">Select an account to manage follow-ups and notes.</div></div>
              <span className="badge">{number(accounts.total)} matches</span>
            </div>
            <div className="tools">
              <label className="control"><Search size={15}/><input aria-label="Search accounts" placeholder="Search accounts…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
              <label className="control"><select aria-label="Filter by status" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{accountGroups.rows.map(row=>row.status).filter((v):v is string=>Boolean(v)).map(v=><option key={v} value={v}>{v}</option>)}</select><ChevronDown size={14}/></label>
            </div>
            <div className="count">{accounts.loading ? "Loading accounts…" : `Showing ${number(accounts.rows.length)} of ${number(accounts.total)}`}</div>
            {accounts.error ? <div className="empty">Could not load accounts: {accounts.error}</div> : accounts.loading ? <div className="list"><div className="skeleton"/><div className="skeleton"/><div className="skeleton"/></div> : accounts.rows.length ? (
              <div className="list">{(accounts.rows as Account[]).map(row=><button className={`account ${selectedId===row.account_id?"selected":""}`} key={row.__row_id} onClick={()=>setSelectedId(row.account_id)}>
                <div className="account-row"><div><div className="name">{row.account_name||"Unnamed account"}</div><div className="meta">{[row.industry,row.region,row.account_owner].filter(Boolean).join(" · ")||"Account details unavailable"}</div></div><span className={`badge ${row.status==="Active"?"active":row.status==="Churned"?"churned":""}`}>{row.status||"Unspecified"}</span></div>
                <div className="facts"><span className="tag">{row.current_plan||"Plan unspecified"}</span><span className="tag">Billed {money(row.total_billed??0)}</span><span className="tag">Features {number(row.adopted_features??0)}</span></div>
              </button>)}</div>
            ) : <div className="empty">No accounts match this search.</div>}
            {accounts.total>accounts.rows.length&&<div className="list-note">Search and filters are applied across the governed account table; only the first 50 matching accounts are shown.</div>}
            <div className="list-note">Sort by: <button className="secondary" onClick={()=>{const next=sort==="account_name"?"total_billed":"account_name";setSort(next);setDirection(next==="account_name"?"asc":"desc")}}>{sort==="account_name"?"Account name":"Total billed"} · {direction}</button></div>
          </section>

          <AccountWorkspace key={selectedId ?? "none"} selectedId={selectedId} account={picked.rows[0] as Account | undefined} accountLoading={picked.loading} work={work.rows[0]} workLoading={work.loading} workError={work.error} notes={notes.rows} notesLoading={notes.loading} notesError={notes.error}/>
        </div>
      </div>
    </main>
  );
}

function AccountWorkspace({selectedId,account,accountLoading,work,workLoading,workError,notes,notesLoading,notesError}:{
  selectedId:number|null; account:Account|undefined; accountLoading:boolean; work:ReturnType<typeof useRows<"account_work">>["rows"][number]|undefined; workLoading:boolean; workError?:string;
  notes:ReturnType<typeof useRows<"notes">>["rows"]; notesLoading:boolean; notesError?:string;
}) {
  const [step,setStep]=useState(""); const [followUp,setFollowUp]=useState(""); const [owner,setOwner]=useState("");
  const [note,setNote]=useState(""); const [savingWork,setSavingWork]=useState(false); const [savingNote,setSavingNote]=useState(false);
  const [workMessage,setWorkMessage]=useState(""); const [noteMessage,setNoteMessage]=useState("");
  React.useEffect(()=>{setStep(work?.next_step??"");setFollowUp(work?.follow_up_date??"");setOwner(work?.owner??"");},[work]);
  if(selectedId===null) return <section className="panel"><h2 className="title">Account workspace</h2><div className="empty">Choose an account to edit its follow-up and add notes.</div></section>;

  async function saveWork() {
    if(!work) return;
    setSavingWork(true);setWorkMessage("");
    try { await updateRow("account_work",work,{next_step:step||null,follow_up_date:followUp||null,owner:owner||null});setWorkMessage("Saved"); }
    catch(error){setWorkMessage(error instanceof Error?error.message:"Could not save follow-up.");}
    finally{setSavingWork(false);}
  }
  async function saveNote() {
    const text=note.trim();if(!text)return;
    setSavingNote(true);setNoteMessage("");
    try { await addRow("notes",{note_id:`${selectedId}-${Date.now()}`,account_id:String(selectedId),note:text});setNote("");setNoteMessage("Saved"); }
    catch(error){setNoteMessage(error instanceof Error?error.message:"Could not save note.");}
    finally{setSavingNote(false);}
  }

  return <aside className="panel">
    <div className="heading"><div><h2 className="title">Account workspace</h2><div className="muted">{accountLoading?"Loading account…":account?.account_name||`Account ${selectedId}`}</div></div></div>
    {workError&&<div className="empty error">Could not load follow-up: {workError}</div>}
    {accountLoading||workLoading?<div className="list"><div className="skeleton"/><div className="skeleton"/></div>:<form className="form" onSubmit={e=>{e.preventDefault();void saveWork();}}>
      <div className="field"><label htmlFor="next-step">Next step</label><div className="control"><textarea id="next-step" rows={3} value={step} onChange={e=>setStep(e.target.value)} placeholder="What needs to happen next?"/></div></div>
      <div className="field"><label htmlFor="follow-up">Follow-up date</label><div className="control"><CalendarDays size={15}/><input id="follow-up" type="date" value={followUp} onChange={e=>setFollowUp(e.target.value)}/></div></div>
      <div className="field"><label htmlFor="owner">Owner</label><div className="control"><input id="owner" value={owner} onChange={e=>setOwner(e.target.value)} placeholder="Follow-up owner"/></div></div>
      <div className="actions"><button className="primary" type="submit" disabled={savingWork||!work}>{savingWork?"Saving…":<><Check size={14}/> Save follow-up</>}</button><span className={`feedback ${workMessage&&!workMessage.startsWith("Saved")?"error":""}`} role="status">{workMessage}</span></div>
    </form>}

    <div className="notes">
      <div className="heading"><div><h3 className="title"><StickyNote size={15} style={{verticalAlign:"-2px",marginRight:6}}/>Account notes</h3><div className="muted">Notes are append-only.</div></div></div>
      <div className="field"><label htmlFor="account-note">New note · account {selectedId}</label><div className="control"><textarea id="account-note" rows={4} value={note} onChange={e=>setNote(e.target.value)} placeholder="Add durable account context…"/></div></div>
      <div className="actions"><button className="primary" type="button" disabled={savingNote||!note.trim()} onClick={()=>void saveNote()}>{savingNote?"Saving…":"Add note"}</button><span className={`feedback ${noteMessage&&!noteMessage.startsWith("Saved")?"error":""}`} role="status">{noteMessage}</span></div>
      {notesError?<div className="empty error">Could not load notes: {notesError}</div>:notesLoading?<div className="skeleton"/>:notes.length?<div className="list">{notes.map(item=><article className="note" key={item.__row_id}><div className="note-text">{item.note||""}</div><div className="note-date">{[item.created_by,date(item.created_at)].filter(Boolean).join(" · ")}</div></article>)}</div>:<div className="empty">No notes recorded for this account yet.</div>}
    </div>
  </aside>;
}

export default App;