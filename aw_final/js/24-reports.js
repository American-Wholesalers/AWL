// ── 24-reports.js ──

function pageReports(){
  const rptSearch=(window._rptSearch)||"";
  const rptTypeF=(window._rptTypeF)||"All";
  const _rptTypeF = window._rptTypeF||"All";
  const allRpts=[
    {name:"Monthly Inventory Report",type:"Inventory",date:"Mar 14, 2026",format:"XLSX"},
    {name:"Q1 Purchase Summary",type:"Purchases",date:"Mar 14, 2026",format:"PDF"},
    {name:"Employee Headcount Report",type:"HR",date:"Mar 14, 2026",format:"XLSX"},
    {name:"P&L Summary — All Clients",type:"Finance",date:"Mar 14, 2026",format:"PDF"},
    {name:"Attendance Monthly Report",type:"HR",date:"Mar 14, 2026",format:"XLSX"},
    {name:"Warehouse Receivables Log",type:"Warehouse",date:"Mar 10, 2026",format:"CSV"},
    {name:"Emergency Shipments Log",type:"Logistics",date:"Mar 10, 2026",format:"CSV"},
    {name:"Amazon & Walmart Purchases",type:"Procurement",date:"Mar 14, 2026",format:"XLSX"},
  ];
  const rList=allRpts.filter(r=>{
    const mt=rptTypeF==="All"||r.type===rptTypeF;
    const mq=!rptSearch||(r.name||"").toLowerCase().includes(rptSearch.toLowerCase());
    return mt&&mq;
  });
  const tc={Inventory:"var(--accent)",Purchases:"var(--green)",HR:"var(--red)",Finance:"var(--yellow)",Logistics:"var(--purple)",Procurement:"var(--teal)",Warehouse:"var(--orange)"};
  render(`
  <div>
    <div class="page-header"><div><div class="page-title">Reports & Analytics</div><div class="page-sub">Generate and download reports</div></div></div>
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><input class="search-bar" placeholder="Search reports..." value="${rptSearch}" oninput="window._rptSearch=this.value;pageReports()" style="flex:1;min-width:180px;max-width:280px"><div style="display:flex;gap:5px;flex-wrap:wrap">${["All","Inventory","Purchases","HR","Finance","Attendance"].map(s=>`<button class="filter-pill${rptTypeF===s?" active":""}" onclick="window._rptTypeF='${s}';pageReports()">${s}</button>`).join("")}</div></div></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:1.25rem">
      ${["Inventory","Attendance","P&L","Purchases"].map(n=>`<div style="background:rgba(79,142,247,.06);border:1px solid rgba(79,142,247,.15);border-radius:var(--r);padding:12px 16px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:13px;font-weight:500">${n}</span><button class="btn btn-sm" style="background:rgba(79,142,247,.15);color:var(--accent);border:none;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer" onclick="showToast('Exporting ${n} report…','var(--accent)')">Export</button></div>`).join("")}
    </div>
    <div class="card">
      <div class="card-title">Recent Reports</div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Report</th><th>Module</th><th>Generated</th><th>Format</th><th></th></tr></thead>
        <tbody>${rList.map(r=>`<tr>
          <td class="fw6">${r.name}</td>
          <td style="color:${tc[r.type]||"var(--muted)"};font-size:12px;font-weight:500">${r.type}</td>
          <td class="text-muted">${r.date}</td>
          <td><span class="mono tag">${r.format}</span></td>
          <td><div style="display:flex;gap:6px"><button class="btn btn-info btn-sm" onclick="showToast('Opening report…','var(--accent)')">View</button><button class="btn btn-success btn-sm" onclick="showToast('Downloading…','var(--green)')">Download</button></div></td>
        </tr>`).join("")}</tbody>
      </table></div>
    </div>
  </div>`);
}

// ═══════════════════════════════════════════════
//  PAGE: CLIENT SHEETS
// ═══════════════════════════════════════════════

