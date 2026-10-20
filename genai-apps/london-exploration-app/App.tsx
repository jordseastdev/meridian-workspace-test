import React, { useEffect, useState } from "react";
import { CalendarDays, MapPin, Clock3, ArrowRight, Search, ChevronDown, Plane, ClipboardList, Check, AlertCircle } from "lucide-react";
import { useRows, updateRow } from "@meridian/app";

const dates = ["Thu Oct 1", "Fri Oct 2", "Sat Oct 3", "Sun Oct 4", "Mon Oct 5", "Tue Oct 6", "Wed Oct 7", "Thu Oct 8", "Fri Oct 9", "Sat Oct 10", "Sun Oct 11"] as const;
const moveStatuses = ["As planned", "Considering move", "Needs review", "Ready to move", "Moved"] as const;

export default function TripPlanner() {
  const [day, setDay] = useState("");
  const [city, setCity] = useState("");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState("");
  const [draft, setDraft] = useState({ newDate: "", newTime: "", openingHours: "", travelBuffer: "", moveStatus: "", logisticsReview: "" });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveError, setSaveError] = useState("");

  const itinerary = useRows("itinerary-base", {
    filters: [
      ...(day ? [{ column: "date" as const, values: [day] }] : []),
      ...(city ? [{ column: "city" as const, values: [city] }] : []),
    ],
    search,
    sort: [{ column: "day-order", direction: "asc" }],
    limit: 1000,
  });
  const dayGroups = useRows("itinerary-base", { groupBy: "date", limit: 100 });
  const cityGroups = useRows("itinerary-base", { groupBy: "city", limit: 100 });
  const workspace = useRows("reschedule-workspace", {
    filters: picked ? [{ column: "item-key", values: [picked] }] : [],
    enabled: !!picked,
    limit: 1,
  });
  const selected = workspace.rows[0];

  useEffect(() => {
    if (!selected) return;
    setDraft({
      newDate: selected["new-date"] ?? "",
      newTime: selected["new-time"] ?? "",
      openingHours: selected["opening-hours"] ?? "",
      travelBuffer: selected["travel-buffer-minutes"] == null ? "" : String(selected["travel-buffer-minutes"]),
      moveStatus: selected["move-status"] ?? "",
      logisticsReview: selected["logistics-review"] ?? "",
    });
    setNotice("");
    setSaveError("");
  }, [selected]);

  const save = async () => {
    if (!selected) return;
    setSaving(true); setNotice(""); setSaveError("");
    try {
      await updateRow("reschedule-workspace", selected, {
        "new-date": (draft.newDate || null) as typeof selected["new-date"],
        "new-time": draft.newTime || null,
        "opening-hours": draft.openingHours || null,
        "travel-buffer-minutes": draft.travelBuffer === "" ? null : Number(draft.travelBuffer),
        "move-status": (draft.moveStatus || null) as typeof selected["move-status"],
        "logistics-review": draft.logisticsReview || null,
      });
      setNotice("Planning changes saved.");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save changes.");
    } finally { setSaving(false); }
  };

  const row = itinerary.rows.find((item) => item["item-key"] === picked);

  return (
    <main className="app">
      <style>{`
        :root{--ink:#202d2b;--muted:#71807c;--line:#e4e9e5;--paper:#f6f7f2;--card:#fff;--green:#285b4b;--mint:#e7f0e9;--gold:#b97742;--shadow:0 8px 24px rgba(30,48,40,.06)}
        *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,sans-serif}
        .app{max-width:1440px;margin:auto;padding:clamp(18px,4vw,48px)}.top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:32px}
        .eyebrow{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}h1{font-family:ui-serif,Georgia,serif;font-size:clamp(32px,5vw,54px);font-weight:500;letter-spacing:-.04em;margin:8px 0 8px}
        .sub{color:var(--muted);font-size:15px;margin:0;line-height:1.5}.mark{width:48px;height:48px;border-radius:16px;background:var(--green);color:white;display:grid;place-items:center;flex:none}
        .layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(320px,.8fr);gap:24px;align-items:start}.panel{background:var(--card);border:1px solid var(--line);border-radius:20px;box-shadow:var(--shadow);overflow:hidden}
        .panelHead{padding:22px 24px 18px;border-bottom:1px solid var(--line)}.heading{display:flex;justify-content:space-between;align-items:center;gap:14px}h2{font-size:18px;margin:0;font-weight:750;letter-spacing:-.02em}.count{color:var(--muted);font-size:12px}
        .filters{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:17px}.search{grid-column:1/-1;position:relative}.search svg{position:absolute;left:13px;top:13px;color:var(--muted)}
        input,select,textarea{font:inherit;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:10px;width:100%;min-height:44px;padding:10px 12px;outline:none}
        .search input{padding-left:39px}select:focus,input:focus,textarea:focus{border-color:#78a18c;box-shadow:0 0 0 3px rgba(72,124,96,.12)}
        .list{max-height:calc(100vh - 290px);min-height:250px;overflow:auto;padding:12px}
        .activity{width:100%;text-align:left;border:1px solid transparent;background:transparent;border-radius:14px;padding:15px;margin:0 0 8px;cursor:pointer;color:inherit;transition:.18s}
        .activity:hover{background:#f8faf7;border-color:var(--line)}.activity.active{background:var(--mint);border-color:#c7ddcd}
        .meta{display:flex;gap:9px;align-items:center;flex-wrap:wrap;color:var(--muted);font-size:12px;margin-bottom:8px}.meta b{color:var(--green);font-weight:750}
        .title{font-size:15px;font-weight:750;line-height:1.35}.location,.notes{font-size:13px;color:var(--muted);line-height:1.5;margin-top:6px;overflow-wrap:anywhere}
        .status{display:inline-flex;border-radius:999px;background:#f0f1ed;color:#58625d;padding:5px 9px;font-size:10px;font-weight:800;letter-spacing:.04em}
        .editor{position:sticky;top:18px}.editorBody{padding:22px 24px}.selectedTitle{font:500 24px/1.2 ui-serif,Georgia,serif;margin:8px 0 7px;overflow-wrap:anywhere}.orig{font-size:13px;color:var(--muted);line-height:1.55}
        .fields{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:22px}.field{min-width:0}.field.full{grid-column:1/-1}.field label{display:block;font-size:11px;font-weight:750;color:#52635c;margin-bottom:7px}
        textarea{min-height:88px;resize:vertical;line-height:1.5}.save{border:0;background:var(--green);color:#fff;border-radius:11px;min-height:46px;padding:0 18px;font-weight:750;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;width:100%;margin-top:18px}
        .save:hover{background:#214b3e}.save:disabled{opacity:.65;cursor:wait}.notice{font-size:13px;margin-top:12px;color:var(--green)}.error{color:#a74335}
        .empty,.skeleton{padding:26px;text-align:center;color:var(--muted);font-size:14px}.skeleton:before{content:"";display:block;height:14px;border-radius:8px;background:#edf0eb;margin-bottom:12px;animation:pulse 1.4s infinite}
        .hint{border:1px dashed #d7dfd8;border-radius:14px;padding:25px;text-align:center;color:var(--muted);line-height:1.55}.hint svg{color:var(--green);margin-bottom:10px}
        @keyframes pulse{50%{opacity:.45}}@media(max-width:850px){.layout{grid-template-columns:1fr}.editor{position:static}.list{max-height:60vh}}@media(max-width:480px){.app{padding:18px 14px}.top{margin-bottom:22px}.panelHead,.editorBody{padding:18px}.fields{grid-template-columns:1fr}.field.full{grid-column:auto}.list{padding:8px}.activity{padding:13px}.filters{gap:8px}}
        @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
      `}</style>

      <header className="top">
        <div><div className="eyebrow">A considered journey · London & Germany</div><h1>Your trip, in motion.</h1><p className="sub">Explore the itinerary and keep proposed changes in one place.</p></div>
        <div className="mark"><Plane size={22} /></div>
      </header>

      <div className="layout">
        <section className="panel">
          <div className="panelHead">
            <div className="heading"><h2>Itinerary</h2><span className="count">{itinerary.total} activities</span></div>
            <div className="filters">
              <div className="search"><Search size={17}/><input aria-label="Search itinerary" placeholder="Search plans, places, notes…" value={search} onChange={e=>setSearch(e.target.value)} /></div>
              <select aria-label="Filter by day" value={day} onChange={e=>setDay(e.target.value)}><option value="">Every day</option>{dayGroups.rows.map((g:any)=><option key={String(g.date)} value={g.date ?? ""}>{g.date} · {g.count}</option>)}</select>
              <select aria-label="Filter by city" value={city} onChange={e=>setCity(e.target.value)}><option value="">Every city</option>{cityGroups.rows.map((g:any)=><option key={String(g.city)} value={g.city ?? ""}>{g.city} · {g.count}</option>)}</select>
            </div>
          </div>
          {itinerary.loading ? <div className="list"><div className="skeleton">Loading itinerary</div><div className="skeleton"> </div><div className="skeleton"> </div></div> :
           itinerary.error ? <div className="empty error">{itinerary.error}</div> :
           itinerary.rows.length === 0 ? <div className="empty">No activities match these filters.</div> :
           <div className="list">
             {itinerary.rows.map(item=><button key={item.__row_id} className={`activity ${picked===item["item-key"]?"active":""}`} onClick={()=>setPicked(item["item-key"] ?? "")}>
               <div className="meta"><b><CalendarDays size={13}/> {item.date}</b>{item.time&&<span><Clock3 size={13}/> {item.time}</span>}<span><MapPin size={13}/> {item.city}</span><span className="status">{item.status || "UNSET"}</span></div>
               <div className="title">{item.plan}</div>
               {item["location-details"]&&<div className="location">{item["location-details"]}</div>}
               {item.notes&&<div className="notes">{item.notes}</div>}
             </button>)}
           </div>}
        </section>

        <section className="panel editor">
          <div className="panelHead"><div className="heading"><h2>Reschedule workspace</h2><ClipboardList size={19} color="#285b4b"/></div><div className="count" style={{marginTop:7}}>Proposed timing, opening hours & logistics</div></div>
          {!picked ? <div className="editorBody"><div className="hint"><ArrowRight size={20}/><div>Select an itinerary activity to review or plan a change.</div></div></div> :
           workspace.loading ? <div className="editorBody"><div className="skeleton">Loading saved planning details</div></div> :
           workspace.error ? <div className="empty error">{workspace.error}</div> :
           !selected ? <div className="empty">No workspace record found for this activity.</div> :
           <div className="editorBody">
             <div className="eyebrow">{selected.city} · {selected["original-date"]}</div>
             <div className="selectedTitle">{selected.plan}</div>
             <div className="orig">{selected["original-time"]}{selected["location-details"] ? ` · ${selected["location-details"]}` : ""}</div>
             <div className="fields">
               <div className="field"><label>New date</label><select value={draft.newDate} onChange={e=>setDraft({...draft,newDate:e.target.value})}><option value="">No change proposed</option>{dates.map(d=><option key={d}>{d}</option>)}</select></div>
               <div className="field"><label>New time</label><input value={draft.newTime} onChange={e=>setDraft({...draft,newTime:e.target.value})} placeholder="e.g. 2:30 PM"/></div>
               <div className="field full"><label>Confirmed opening hours</label><input value={draft.openingHours} onChange={e=>setDraft({...draft,openingHours:e.target.value})} placeholder="Add confirmed hours"/></div>
               <div className="field"><label>Travel buffer (minutes)</label><input type="number" min="0" value={draft.travelBuffer} onChange={e=>setDraft({...draft,travelBuffer:e.target.value})} placeholder="Minutes"/></div>
               <div className="field"><label>Move status</label><select value={draft.moveStatus} onChange={e=>setDraft({...draft,moveStatus:e.target.value})}><option value="">Not set</option>{moveStatuses.map(s=><option key={s}>{s}</option>)}</select></div>
               <div className="field full"><label>Logistics review</label><textarea value={draft.logisticsReview} onChange={e=>setDraft({...draft,logisticsReview:e.target.value})} placeholder="Travel connections, constraints, or review notes"/></div>
             </div>
             <button className="save" disabled={saving} onClick={save}>{saving?"Saving…":<><Check size={17}/> Save planning changes</>}</button>
             {notice&&<div className="notice">{notice}</div>}{saveError&&<div className="notice error"><AlertCircle size={14}/> {saveError}</div>}
           </div>}
        </section>
      </div>
    </main>
  );
}