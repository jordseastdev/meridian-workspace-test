import React, { useEffect, useMemo, useState } from "react";
import { addRow, updateRow, useRows, useUser } from "@meridian/app";
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, ClipboardList, Package, Search, Store, TrendingUp } from "lucide-react";

export default function App() {
  const user = useUser();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const orders = useRows("orders", {
    search: search.trim() || undefined,
    sort: [{ column: "order_date", direction: "desc" }, { column: "order_id", direction: "desc" }],
    limit: 12,
  });
  const trend = useRows("revenue_trend", {
    sort: [{ column: "order_date", direction: "desc" }],
    limit: 1000,
  });
  const products = useRows("top_products", {
    sort: [{ column: "revenue", direction: "desc" }],
    limit: 8,
  });
  const followups = useRows("order_followups", {
    filters: selectedId === null ? [] : [{ column: "order_id", values: [selectedId] }],
    limit: 1,
    enabled: selectedId !== null,
  });

  const selectedOrder = orders.rows.find((order) => order.order_id === selectedId);
  const savedFollowup = followups.rows[0];

  useEffect(() => {
    setFlagged(Boolean(savedFollowup?.follow_up));
    setNote(savedFollowup?.note ?? "");
    setMessage("");
  }, [selectedId, savedFollowup?.follow_up, savedFollowup?.note]);

  const currency = (value: number | null | undefined) =>
    value == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

  const chronologicalTrend = useMemo(() => [...trend.rows].reverse(), [trend.rows]);

  const trendPoints = useMemo(() => {
    const valid = chronologicalTrend.filter((row) => row.revenue != null);
    if (valid.length < 2) return { path: "", area: "", first: null as number | null, last: null as number | null };
    const values = valid.map((row) => row.revenue as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 90 - ((value - min) / range) * 78;
      return `${x},${y}`;
    });
    return {
      path: `M ${points.join(" L ")}`,
      area: `M ${points[0]} L ${points.slice(1).join(" L ")} L 100,100 L 0,100 Z`,
      first: values[0],
      last: values[values.length - 1],
    };
  }, [chronologicalTrend]);

  const trendUp = trendPoints.first != null && trendPoints.last != null && trendPoints.last >= trendPoints.first;
  const dates = chronologicalTrend.filter((row) => row.order_date);

  async function saveFollowup() {
    if (!selectedOrder || selectedOrder.order_id == null) return;
    setSaving(true);
    setMessage("");
    try {
      const values = { follow_up: flagged, note: note.trim() || null };
      if (savedFollowup) {
        await updateRow("order_followups", savedFollowup, values);
      } else {
        await addRow("order_followups", values);
      }
      setMessage("Follow-up saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this follow-up.");
    } finally {
      setSaving(false);
    }
  }

  const shortDate = (value: string | null) => {
    if (!value) return "Date unavailable";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
  };

  return (
    <main className="app">
      <style>{`
        :root{--ink:#1e3029;--muted:#748078;--paper:#f5f6f1;--card:#fff;--line:#e6eae2;--green:#315c45;--soft:#eaf1e9;--gold:#d59b4b;--danger:#a84e3f}
        *{box-sizing:border-box}
        body{margin:0;background:var(--paper);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        button,input,textarea{font:inherit}
        button{cursor:pointer}
        .app{max-width:1440px;margin:0 auto;padding:34px 40px 56px}
        .topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:36px}
        .brand{display:flex;align-items:center;gap:11px;font-size:14px;font-weight:750;letter-spacing:.02em}
        .brandmark{width:34px;height:34px;border-radius:11px;background:var(--green);color:white;display:grid;place-items:center}
        .user{color:var(--muted);font-size:13px}
        .eyebrow{text-transform:uppercase;letter-spacing:.13em;color:var(--green);font-size:11px;font-weight:750}
        h1{font-family:ui-serif,Georgia,serif;font-size:clamp(34px,5vw,54px);font-weight:500;letter-spacing:-.045em;line-height:1.07;margin:9px 0 10px}
        .intro{color:var(--muted);margin:0;font-size:15px}
        .hero{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:30px}
        .today{font-size:13px;color:var(--muted);padding-bottom:4px;white-space:nowrap}
        .layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.85fr);gap:20px;align-items:start}
        .left,.right{display:grid;gap:20px;min-width:0}
        .card{background:var(--card);border:1px solid var(--line);border-radius:18px;box-shadow:0 4px 18px rgba(31,49,39,.035);min-width:0}
        .cardhead{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:21px 22px 16px}
        .cardtitle{font-size:16px;font-weight:730;letter-spacing:-.02em;margin:0}
        .subtle{font-size:12px;color:var(--muted);margin-top:4px}
        .count{font-variant-numeric:tabular-nums;color:var(--muted);font-size:12px}
        .searchbox{height:40px;display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:10px;padding:0 11px;color:var(--muted);width:min(220px,48%)}
        .searchbox input{border:0;outline:0;width:100%;min-width:0;color:var(--ink);background:transparent;font-size:13px}
        .searchbox:focus-within{border-color:var(--green);box-shadow:0 0 0 3px rgba(49,92,69,.1)}
        .orderlist{padding:0 12px 12px}
        .order{width:100%;text-align:left;border:0;background:transparent;border-radius:12px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:14px 12px;min-height:68px;color:inherit;transition:background .18s,transform .18s}
        .order:hover{background:#f6f8f4}
        .order:focus-visible,.save:focus-visible,.flag:focus-visible{outline:3px solid rgba(49,92,69,.3);outline-offset:2px}
        .order.active{background:var(--soft)}
        .order-main{min-width:0}
        .orderline{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
        .orderid{font-weight:730;font-size:14px}
        .date{font-size:12px;color:var(--muted)}
        .meta{display:flex;flex-wrap:wrap;gap:11px;margin-top:6px;color:var(--muted);font-size:12px}
        .meta span{display:flex;align-items:center;gap:4px}
        .order-right{text-align:right;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:7px}
        .money{font-size:14px;font-weight:720;font-variant-numeric:tabular-nums}
        .badge{font-size:10px;font-weight:700;padding:4px 8px;border-radius:99px;background:#eff1ed;color:#5e6a61}
        .badge.completed{background:#e9f3eb;color:#386745}.badge.returned{background:#fff1e8;color:#9a5b2c}.badge.cancelled{background:#f8eae8;color:#a2493d}.badge.flagged{background:#fff2dc;color:#946520}
        .trendbody{padding:0 22px 20px}
        .trendvalue{display:flex;align-items:center;gap:8px;font-size:27px;letter-spacing:-.04em;font-weight:730;margin:1px 0 12px}
        .trendvalue small{font-size:11px;letter-spacing:0;font-weight:600;color:var(--muted)}
        .trendvalue .up{color:var(--green)}.trendvalue .down{color:var(--danger)}
        .chart{width:100%;height:146px;overflow:visible}
        .chartgrid{stroke:#edf0eb;stroke-width:.7}
        .chartarea{fill:url(#areaFill)}
        .chartline{fill:none;stroke:var(--green);stroke-width:1.9;vector-effect:non-scaling-stroke}
        .axis{display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:2px}
        .productlist{padding:0 22px 16px}
        .product{display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:11px;padding:13px 0;border-bottom:1px solid #f0f2ed}
        .product:last-child{border:0}
        .rank{font-size:12px;color:#a0a9a1;font-weight:650}
        .productname{font-size:13px;font-weight:700}
        .units{font-size:11px;color:var(--muted);margin-top:3px}
        .productrevenue{font-size:13px;font-weight:700;font-variant-numeric:tabular-nums}
        .detail{padding:21px 22px 22px;position:sticky;top:16px}
        .detailtop{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:18px}
        .detail h2{font-family:ui-serif,Georgia,serif;font-size:24px;font-weight:500;letter-spacing:-.03em;margin:4px 0 0}
        .detail-id{font-size:12px;color:var(--muted)}
        .stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 20px}
        .stat{background:#f7f8f5;border-radius:11px;padding:12px;min-width:0}
        .stat label{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
        .stat strong{font-size:14px;overflow-wrap:anywhere}
        .flagrow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
        .flaglabel{font-size:13px;font-weight:700}.flaghelp{font-size:11px;color:var(--muted);margin-top:3px}
        .switch{border:0;background:#dce2db;border-radius:99px;width:48px;height:28px;padding:3px;flex:0 0 auto;transition:background .18s}
        .switch.on{background:var(--green)}
        .knob{display:block;width:22px;height:22px;border-radius:50%;background:white;box-shadow:0 1px 3px #0002;transition:transform .18s}
        .switch.on .knob{transform:translateX(20px)}
        .notelabel{display:block;font-size:12px;font-weight:700;margin:17px 0 7px}
        textarea{width:100%;min-height:92px;resize:vertical;border:1px solid var(--line);border-radius:10px;padding:11px 12px;color:var(--ink);outline:0;font-size:13px;line-height:1.5}
        textarea:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(49,92,69,.1)}
        .save{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:44px;margin-top:13px;background:var(--green);color:#fff;border:0;border-radius:10px;font-weight:700;font-size:13px;transition:background .18s}
        .save:hover:not(:disabled){background:#244832}.save:disabled{opacity:.65;cursor:wait}
        .message{font-size:12px;margin:10px 0 0;color:var(--green);overflow-wrap:anywhere}.message.error{color:var(--danger)}
        .empty{padding:30px 18px;text-align:center;color:var(--muted);font-size:13px}
        .emptyicon{width:34px;height:34px;border-radius:11px;background:var(--soft);color:var(--green);display:grid;place-items:center;margin:0 auto 10px}
        .skeleton{height:63px;border-radius:10px;margin:7px 0;background:linear-gradient(90deg,#f0f2ee 25%,#f7f8f5 45%,#f0f2ee 65%);background-size:200% 100%;animation:shine 1.3s ease infinite}
        .skchart{height:195px;margin:0 22px 20px;border-radius:10px;background:linear-gradient(90deg,#f0f2ee 25%,#f7f8f5 45%,#f0f2ee 65%);background-size:200% 100%;animation:shine 1.3s ease infinite}
        @keyframes shine{to{background-position:-200% 0}}
        @media(max-width:900px){.app{padding:28px 24px 44px}.layout{grid-template-columns:minmax(0,1fr) minmax(280px,.85fr)}}
        @media(max-width:720px){.app{padding:22px 16px 36px}.topbar{margin-bottom:28px}.hero{align-items:flex-start;flex-direction:column;gap:10px;margin-bottom:23px}.layout{grid-template-columns:1fr}.right{grid-row:auto}.detail{position:static}.searchbox{width:48%}}
        @media(max-width:390px){.app{padding:18px 12px 30px}.cardhead{padding:18px 16px 13px}.orderlist{padding:0 8px 8px}.order{padding:12px 9px}.detail{padding:19px 17px}.productlist,.trendbody{padding-left:17px;padding-right:17px}.searchbox{width:44%}.orderline{gap:6px}}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
      `}</style>

      <header className="topbar">
        <div className="brand"><span className="brandmark"><Store size={17} /></span> MERIDIAN <span style={{ color: "#a5ada5", fontWeight: 450 }}>/ RETAIL</span></div>
        <div className="user">{user.name}</div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">Store manager briefing</div>
          <h1>Good morning.</h1>
          <p className="intro">Your daily view of orders, revenue and products to watch.</p>
        </div>
        <div className="today">{new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</div>
      </section>

      <div className="layout">
        <div className="left">
          <section className="card">
            <div className="cardhead">
              <div><h2 className="cardtitle">Recent orders</h2><div className="subtle">Latest activity across your retail channels</div></div>
              <label className="searchbox"><Search size={15} /><input aria-label="Search orders" placeholder="Search orders" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            </div>
            {orders.error ? <div className="empty">{orders.error}</div> : orders.loading ? <div className="orderlist">{Array.from({ length: 5 }, (_, i) => <div className="skeleton" key={i} />)}</div> : orders.rows.length === 0 ? <div className="empty"><div className="emptyicon"><ClipboardList size={17} /></div>No orders match this search.</div> : (
              <>
                <div className="orderlist">
                  {orders.rows.map((order) => (
                    <button className={`order ${selectedId === order.order_id ? "active" : ""}`} key={order.__row_id} onClick={() => setSelectedId(order.order_id)}>
                      <div className="order-main">
                        <div className="orderline"><span className="orderid">Order {order.order_id == null ? "—" : `#${order.order_id}`}</span><span className="date">{shortDate(order.order_date)}</span></div>
                        <div className="meta"><span><Package size={13} /> Product {order.product_id ?? "—"}</span><span><Store size={13} /> Store {order.store_id ?? "—"}</span><span>{order.quantity ?? "—"} units</span></div>
                      </div>
                      <div className="order-right"><span className="money">{currency(order.revenue)}</span><span className={`badge ${(order.status ?? "").toLowerCase()}`}>{order.status ?? "Status unavailable"}</span></div>
                    </button>
                  ))}
                </div>
                <div style={{ padding: "0 22px 15px", color: "var(--muted)", fontSize: 11 }}>{orders.total} matching orders</div>
              </>
            )}
          </section>

          <section className="card">
            <div className="cardhead">
              <div><h2 className="cardtitle">Revenue over time</h2><div className="subtle">Daily revenue from the available reporting period</div></div>
              <TrendingUp size={18} color="var(--green)" />
            </div>
            {trend.error ? <div className="empty">{trend.error}</div> : trend.loading ? <div className="skchart" /> : trend.rows.length === 0 ? <div className="empty">No revenue trend data available.</div> : (
              <div className="trendbody">
                <div className="trendvalue">{currency(trendPoints.last)}{trendPoints.first != null && <small className={trendUp ? "up" : "down"}>{trendUp ? <ArrowUpRight size={13} style={{ verticalAlign: "middle" }} /> : <ArrowDownRight size={13} style={{ verticalAlign: "middle" }} />} latest day</small>}</div>
                {trendPoints.path ? <svg className="chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Daily revenue trend chart">
                  <defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#315c45" stopOpacity=".18" /><stop offset="100%" stopColor="#315c45" stopOpacity="0" /></linearGradient></defs>
                  {[25, 50, 75].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} className="chartgrid" />)}
                  <path d={trendPoints.area} className="chartarea" /><path d={trendPoints.path} className="chartline" />
                </svg> : <div className="empty">More dates are needed to show a trend.</div>}
                <div className="axis"><span>{shortDate(dates[0]?.order_date ?? null)}</span><span>{shortDate(dates[dates.length - 1]?.order_date ?? null)}</span></div>
              </div>
            )}
          </section>
        </div>

        <div className="right">
          <section className="card">
            <div className="cardhead"><div><h2 className="cardtitle">Top products</h2><div className="subtle">Ranked by total revenue</div></div><Package size={18} color="var(--green)" /></div>
            {products.error ? <div className="empty">{products.error}</div> : products.loading ? <div style={{ padding: "0 22px 16px" }}>{Array.from({ length: 5 }, (_, i) => <div className="skeleton" key={i} />)}</div> : products.rows.length === 0 ? <div className="empty">No product performance data available.</div> : (
              <>
                <div className="productlist">{products.rows.map((product, index) => <div className="product" key={product.__row_id}>
                  <span className="rank">{String(index + 1).padStart(2, "0")}</span>
                  <div><div className="productname">Product {product.product_id ?? "—"}</div><div className="units">{product.quantity ?? "—"} units sold</div></div>
                  <span className="productrevenue">{currency(product.revenue)}</span>
                </div>)}</div>
                <div style={{ padding: "0 22px 16px", fontSize: 11, color: "var(--muted)" }}>Ranked from available product revenue data</div>
              </>
            )}
          </section>

          <section className="card detail" aria-live="polite">
            {!selectedOrder ? (
              <div className="empty"><div className="emptyicon"><ClipboardList size={17} /></div><div style={{ color: "var(--ink)", fontWeight: 700, marginBottom: 5 }}>Order follow-up</div>Select a recent order to flag it and leave a note for your team.</div>
            ) : (
              <>
                <div className="detailtop"><div><div className="eyebrow">Order follow-up</div><h2>Order #{selectedOrder.order_id}</h2></div><ChevronRight size={17} color="#a5ada5" /></div>
                <div className="stats">
                  <div className="stat"><label>Order date</label><strong>{shortDate(selectedOrder.order_date)}</strong></div>
                  <div className="stat"><label>Revenue</label><strong>{currency(selectedOrder.revenue)}</strong></div>
                  <div className="stat"><label>Product</label><strong>{selectedOrder.product_id ?? "—"}</strong></div>
                  <div className="stat"><label>Store</label><strong>{selectedOrder.store_id ?? "—"}</strong></div>
                </div>
                {followups.error ? <div className="message error">{followups.error}</div> : followups.loading ? <div className="skeleton" /> : <>
                  <div className="flagrow"><div><div className="flaglabel">Flag for follow-up</div><div className="flaghelp">Keep this order on your team's radar</div></div><button className={`switch ${flagged ? "on" : ""}`} role="switch" aria-checked={flagged} aria-label="Flag order for follow-up" onClick={() => setFlagged(!flagged)}><span className="knob" /></button></div>
                  <label className="notelabel" htmlFor="followup-note">Note for your team</label>
                  <textarea id="followup-note" placeholder="Add context or a next step…" value={note} onChange={(event) => setNote(event.target.value)} />
                  <button className="save" disabled={saving} onClick={saveFollowup}>{saving ? "Saving…" : <><Check size={16} /> Save follow-up</>}</button>
                  {message && <p className={`message ${message === "Follow-up saved." ? "" : "error"}`}>{message}</p>}
                </>}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}