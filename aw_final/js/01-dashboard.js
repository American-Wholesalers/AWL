// ── 01-dashboard.js ──

function pageDashboard(){
  // Check expiry on every dashboard visit (silent — only notifies if new items found)
  setTimeout(checkExpiryNotifications, 300);

  const isPurchaser = currentUser?.role === "Purchaser";

  // ── PURCHASER DASHBOARD ──────────────────────────────
  if(isPurchaser){
    const myRep    = DB.replenishment.filter(r=>r.prName===currentUser.name||r.vaName===currentUser.name||r.manager===currentUser.name);
    const myAmz    = DB.amazon;
    const pending  = DB.replenishment.filter(r=>r.status==="Pending").length;
    const approved = DB.replenishment.filter(r=>r.status==="Approved").length;
    const poSent   = DB.replenishment.filter(r=>r.orderStatus==="PO Sent to AWL Team").length;
    const amzUnpaid= DB.amazon.filter(r=>r.paymentStatus==="Unpaid"||!r.paymentStatus).length;
    const resNew   = DB.research.filter(r=>r.status==="New Asin"||r.status==="Pending").length;
    const liqPending=DB.liquidations.filter(l=>l.status==="Under Review").length;

    render(`
    <div>
      <div class="page-header">
        <div>
          <div class="page-title">Good ${Number(nowCA().hour)<12?"morning":Number(nowCA().hour)<17?"afternoon":"evening"}, ${currentUser.name.split(" ")[0]} 👋</div>
          <div class="page-sub">${new Date(nowCA().date+"T12:00:00").toLocaleDateString("en-US",{timeZone:"America/Los_Angeles",weekday:"long",month:"long",day:"numeric",year:"numeric"})} · Purchaser</div>
        </div>
      </div>

      <div class="metrics metrics-4" style="margin-bottom:1.25rem">
        ${metric("Pending Replenishments", pending, "Awaiting approval", "var(--yellow)")}
        ${metric("Approved Replenishments", approved, "Ready to purchase", "var(--green)")}
        ${metric("Amazon Unpaid", amzUnpaid, "Invoices pending", "var(--red)")}
        ${metric("Research Pending", resNew, "Needs review", "var(--accent)")}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">

        <div class="card">
          <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
            Replenishment Overview
            <button class="btn btn-ghost btn-sm" onclick="navigate('replenishment')">View All →</button>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
            ${["Pending","Approved","Purchased","OOS","Cancelled"].map(s=>{
              const cnt = DB.replenishment.filter(r=>r.status===s).length;
              const col = {Pending:"var(--yellow)",Approved:"var(--green)",Purchased:"var(--accent)",OOS:"var(--red)",Cancelled:"var(--dim)"}[s]||"var(--muted)";
              return `<div style="background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:8px;padding:8px 12px;text-align:center;min-width:70px">
                <div style="font-size:18px;font-weight:700;color:${col}">${cnt}</div>
                <div style="font-size:10px;color:var(--muted);margin-top:2px">${s}</div>
              </div>`;
            }).join("")}
          </div>
          ${DB.replenishment.filter(r=>r.status==="Pending"||r.status==="Approved").slice(0,5).map(r=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
              <span style="font-size:12px;font-weight:500;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.productDesc||r.asin||"—"}</span>
              <span class="badge" style="background:${r.status==="Approved"?"rgba(79,207,142,.12)":"rgba(247,201,79,.12)"};color:${r.status==="Approved"?"var(--green)":"var(--yellow)"}">${r.status}</span>
            </div>`).join("")}
          ${DB.replenishment.filter(r=>r.status==="Pending"||r.status==="Approved").length===0?`<div style="text-align:center;color:var(--muted);padding:1rem;font-size:13px">No pending items</div>`:""}
        </div>

        <div class="card">
          <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
            Amazon Purchases
            <button class="btn btn-ghost btn-sm" onclick="navigate('amazon')">View All →</button>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
            ${["Purchased","Pending","Cancelled"].map(s=>{
              const cnt = DB.amazon.filter(r=>r.status===s).length;
              const col = {Purchased:"var(--green)",Pending:"var(--yellow)",Cancelled:"var(--red)"}[s]||"var(--muted)";
              return `<div style="background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:8px;padding:8px 12px;text-align:center;min-width:70px">
                <div style="font-size:18px;font-weight:700;color:${col}">${cnt}</div>
                <div style="font-size:10px;color:var(--muted);margin-top:2px">${s}</div>
              </div>`;
            }).join("")}
          </div>
          ${DB.amazon.slice(0,5).map(r=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-size:12px;font-weight:500">${r.client||"—"}</div>
                <div style="font-size:11px;color:var(--muted)">${r.asin||"—"} · ${r.asinType||""}</div>
              </div>
              <span class="badge" style="background:${r.status==="Purchased"?"rgba(79,207,142,.12)":r.status==="Cancelled"?"rgba(247,92,92,.12)":"rgba(247,201,79,.12)"};color:${r.status==="Purchased"?"var(--green)":r.status==="Cancelled"?"var(--red)":"var(--yellow)"}">${r.status}</span>
            </div>`).join("")}
          ${DB.amazon.length===0?`<div style="text-align:center;color:var(--muted);padding:1rem;font-size:13px">No records</div>`:""}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">

        <div class="card">
          <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
            Product Research
            <button class="btn btn-ghost btn-sm" onclick="navigate('research')">View All →</button>
          </div>
          ${DB.research.slice(0,5).map(r=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
              <div style="font-size:12px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.productName||r.asin||"—"}</div>
              <span class="badge" style="background:${r.status==="Approved"?"rgba(79,207,142,.12)":r.status==="Denied"?"rgba(247,92,92,.12)":"rgba(247,201,79,.12)"};color:${r.status==="Approved"?"var(--green)":r.status==="Denied"?"var(--red)":"var(--yellow)"}">${r.status||"Pending"}</span>
            </div>`).join("")}
          ${DB.research.length===0?`<div style="text-align:center;color:var(--muted);padding:1rem;font-size:13px">No records</div>`:""}
        </div>

        <div class="card">
          <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
            Liquidations
            <button class="btn btn-ghost btn-sm" onclick="navigate('liquidations')">View All →</button>
          </div>
          ${DB.liquidations.slice(0,5).map(l=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
              <div style="font-size:12px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.itemOwner||"—"}</div>
              <span class="badge" style="background:${l.status==="Completed"?"rgba(79,207,142,.12)":l.status==="Approved"?"rgba(79,142,247,.12)":"rgba(247,201,79,.12)"};color:${l.status==="Completed"?"var(--green)":l.status==="Approved"?"var(--accent)":"var(--yellow)"}">${l.status||"—"}</span>
            </div>`).join("")}
          ${DB.liquidations.length===0?`<div style="text-align:center;color:var(--muted);padding:1rem;font-size:13px">No records</div>`:""}
        </div>

        <div class="card">
          <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
            Quick Actions
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
            <button class="btn btn-info" style="justify-content:flex-start" onclick="navigate('replenishment')">📦 Replenishment</button>
            <button class="btn btn-info" style="justify-content:flex-start" onclick="navigate('amazon')">🛒 Amazon Purchases</button>
            <button class="btn btn-info" style="justify-content:flex-start" onclick="navigate('walmart')">🛒 Walmart Purchases</button>
            <button class="btn btn-info" style="justify-content:flex-start" onclick="navigate('research')">🔍 Product Research</button>
            <button class="btn btn-info" style="justify-content:flex-start" onclick="navigate('inventory')">📋 Inventory</button>
            <button class="btn btn-info" style="justify-content:flex-start" onclick="navigate('liquidations')">📉 Liquidations</button>
          </div>
        </div>

      </div>
    </div>`);
    return;
  }

  // ── DEFAULT DASHBOARD (Admin / Manager / others) ──────────────────────────
  const inv=DB.inventory.map(i=>({...i,st:invStatus(i)}));
  const low=inv.filter(i=>i.st==="LOW").length, out=inv.filter(i=>i.st==="OUT").length;
  const active=DB.employees.filter(e=>e.status==="Active").length;
  const pending=DB.purchases.filter(p=>p.status==="Pending").length;
  const emergency=DB.emergency.filter(e=>e.status!=="Delivered"&&e.status!=="Cancelled").length;
  const todayAtt=DB.attendance.filter(a=>a.date===TODAY);

  render(`
  <div>
    <div class="page-header">
      <div><div class="page-title">Good ${Number(nowCA().hour)<12?"morning":Number(nowCA().hour)<17?"afternoon":"evening"}, ${currentUser.name.split(" ")[0]} 👋</div><div class="page-sub">${new Date(nowCA().date+"T12:00:00").toLocaleDateString("en-US",{timeZone:"America/Los_Angeles",weekday:"long",month:"long",day:"numeric",year:"numeric"})} · ${currentUser.role}</div></div>
    </div>
    <div class="metrics metrics-4">
      ${metric("Inventory Items",DB.inventory.length,`${low} low · ${out} out of stock`,"var(--accent)")}
      ${metric("Active Employees",active,`of ${DB.employees.length} total`,"var(--green)")}
      ${metric("Pending POs",pending,"Awaiting approval","var(--yellow)")}
      ${metric("Active Emergencies",emergency,"Need attention","var(--red)")}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div class="card">
        <div class="card-title">Recent Activity</div>
        ${[
          {t:"red",m:"Safety Helmet Class E — OUT OF STOCK"},
          {t:"green",m:"PO-2025-0041 approved by M. Santos"},
          {t:"yellow",m:"New emergency shipment raised (ES-007)"},
          {t:"yellow",m:"WR-002 partial receipt recorded"},
          {t:"accent",m:"3 replenishment requests pending"},
        ].map(a=>`<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px"><div style="width:6px;height:6px;border-radius:50%;background:var(--${a.t});margin-top:5px;flex-shrink:0"></div><p style="margin:0;font-size:13px;line-height:1.5">${a.m}</p></div>`).join("")}
      </div>
      <div class="card">
        <div class="card-title">Today's Attendance</div>
        ${todayAtt.map(a=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)"><span style="font-size:13px">${a.name}</span>${badge(a.status)}</div>`).join("")}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
      <div class="card">
        <div class="card-title">Replenishment Alerts</div>
        ${DB.replenishment.map(r=>`<div style="margin-bottom:8px;padding:8px 10px;background:rgba(255,255,255,.03);border-radius:8px;border-left:3px solid ${r.priority==="Critical"?"var(--red)":r.priority==="High"?"var(--orange)":"var(--yellow)"}"><p style="margin:0;font-size:12px;font-weight:500">${r.product}</p><p style="margin:2px 0 0;font-size:11px;color:var(--muted)">Qty: ${r.currentQty} / Target: ${r.targetQty}</p></div>`).join("")}
      </div>
      <div class="card">
        <div class="card-title">P&L Snapshot (Mar 2026)</div>
        ${DB.pnl.filter(p=>p.month==="2026-03").map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)"><span style="font-size:13px">${p.client}</span><span style="font-size:13px;font-weight:700;color:${p.netProfit>=0?"var(--green)":"var(--red)"}">₱${(p.netProfit/1000).toFixed(0)}K</span></div>`).join("")}
      </div>
      <div class="card">
        <div class="card-title">Connected Clients</div>
        ${DB.clients.slice(0,4).map(c=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)"><span style="font-size:13px">${c.name}</span><span style="font-size:11px;color:var(--muted)">${c.industry}</span></div>`).join("")}
        <button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%" onclick="navigate('clients')">Manage Client Sheets →</button>
      </div>
    </div>
  </div>`);
}

// ═══════════════════════════════════════════════
//  PAGE: EMPLOYEES
// ═══════════════════════════════════════════════
const DEPT_COLORS={
  "Admin":            "var(--muted)",
  "Manager":          "var(--accent)",
  "Purchaser":        "var(--purple)",
  "Warehouse":        "var(--yellow)",
  "Website Developer":"var(--teal)",
  "Account Health":   "var(--green)",
  "Brands":           "var(--orange)",
  "Customer Service": "var(--red)",
  "Product Research": "#60a5fa",
  "Bookkeeper":       "var(--teal)",
};

const ACCESS_TOOLS = [
  {key:"awlEmail",    label:"AWL Email"},
  {key:"slack",       label:"Slack"},
  {key:"onePassword", label:"1Password"},
  {key:"azInsight",   label:"AZ Insight"},
  {key:"zoomInfo",    label:"Zoom Info"},
];


