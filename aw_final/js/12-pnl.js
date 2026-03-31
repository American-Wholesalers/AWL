// ── 12-pnl.js ──

function pagePnL(){
  const cf=(window._pnlClient)||"All";
  const _pnlClient = window._pnlClient||"All";
  const pnlSearch=(window._pnlSearch)||"";
  const pnlMonthF=(window._pnlMonthF)||"All";
  const _pnlMonthF = window._pnlMonthF||"All";
  const clients=["All",...[...new Set(DB.pnl.map(r=>r.client))]];
  const months=["All",...[...new Set(DB.pnl.map(r=>r.month))].sort().reverse()];
  const rows=DB.pnl.filter(r=>{
    const mc=cf==="All"||r.client===cf;
    const mm=pnlMonthF==="All"||r.month===pnlMonthF;
    const mq=!pnlSearch||(r.client||"").toLowerCase().includes(pnlSearch.toLowerCase());
    return mc&&mm&&mq;
  });
  const tRev=rows.reduce((a,r)=>a+r.revenue,0);
  const tNP=rows.reduce((a,r)=>a+r.netProfit,0);
  const tGP=rows.reduce((a,r)=>a+r.grossProfit,0);
  render(`
  <div>
    <div class="page-header"><div><div class="page-title">P&L per Client</div><div class="page-sub">Profit & Loss by client and period</div></div>${canSubmit("pnl")?'<button class="btn btn-primary" onclick="openPNLModal()">+ New Entry</button>':""}</div>
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><input class="search-bar" placeholder="Search client..." value="${pnlSearch}" oninput="window._pnlSearch=this.value;pagePnL()" style="flex:1;min-width:180px;max-width:260px"><span style="font-size:10px;font-weight:600;color:var(--dim)">Month:</span><div style="display:flex;gap:5px;flex-wrap:wrap">${months.map(m=>`<button class="filter-pill${pnlMonthF===m?" active":""}" onclick="window._pnlMonthF='${m}';pagePnL()">${m}</button>`).join("")}</div><span style="font-size:10px;font-weight:600;color:var(--dim)">Client:</span><div style="display:flex;gap:5px;flex-wrap:wrap">${clients.map(c=>`<button class="filter-pill${cf===c?" active":""}" onclick="window._pnlClient='${c}';pagePnL()">${c}</button>`).join("")}</div></div></div>
    <div class="metrics metrics-4">
      ${metric("Total Revenue","₱"+(tRev/1000).toFixed(0)+"K","","var(--accent)")}
      ${metric("Net Profit","₱"+(tNP/1000).toFixed(0)+"K","",tNP>=0?"var(--green)":"var(--red)")}
      ${metric("Clients",clients.length-1,"","var(--purple)")}
      ${metric("Entries",DB.pnl.length,"","var(--muted)")}
    </div>
    <div class="card">
      <div class="gap-8" style="margin-bottom:14px">
        ${clients.map(c=>`<button class="filter-pill${cf===c?" active":""}" id="pnl-client" value="${c}" onclick="this.value='${c}';pagePnL()">${c}</button>`).join("")}
      </div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Client</th><th>Month</th><th>Revenue</th><th>COGS</th><th>OpEx</th><th>Gross Profit</th><th>Net Profit</th><th>Margin</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${rows.map(r=>{const margin=r.revenue>0?((r.grossProfit/r.revenue)*100).toFixed(1)+"%":"—";return`<tr>
            <td class="fw6">${r.client}</td><td class="text-muted">${r.month}</td>
            <td class="fw6">₱${num(r.revenue)}</td><td class="text-muted">₱${num(r.cogs)}</td>
            <td class="text-muted">₱${num(r.opex)}</td>
            <td style="color:${r.grossProfit>=0?"var(--green)":"var(--red)"};font-weight:600">₱${num(r.grossProfit)}</td>
            <td style="color:${r.netProfit>=0?"var(--green)":"var(--red)"};font-weight:700">₱${num(r.netProfit)}</td>
            <td style="color:var(--accent)">${margin}</td><td>${badge(r.status)}</td>
              <td>${canEdit("pnl")?`<button class="btn btn-info btn-sm" onclick='openPNLModal(${JSON.stringify(r).replace(/'/g,"&#39;")})'>Edit</button>`:""}</td>
          </tr>`}).join("")}
          <tr style="background:rgba(255,255,255,.03)">
            <td class="fw7 text-accent" colspan="2">TOTAL</td>
            <td class="fw7">₱${num(tRev)}</td>
            <td class="text-muted">₱${num(rows.reduce((a,r)=>a+r.cogs,0))}</td>
            <td class="text-muted">₱${num(rows.reduce((a,r)=>a+r.opex,0))}</td>
            <td style="color:var(--green);font-weight:700">₱${num(tGP)}</td>
            <td style="color:${tNP>=0?"var(--green)":"var(--red)"};font-weight:700">₱${num(tNP)}</td>
            <td colspan="3"></td>
          </tr>
        </tbody>
      </table></div>
    </div>
  </div>`);
}

function openPNLModal(pnl=null){
  const isNew=!pnl;
  pnl=pnl||{id:"",client:"",month:TODAY.slice(0,7),revenue:"",cogs:"",opex:"",status:"Draft",notes:""};
  openModal(`${mHeader(isNew?"New P&L Entry":"Edit P&L Entry")}
  <div class="modal-body"><div class="form-grid">
    <div class="form-full">${clientSelect("client",pnl.client||"",true)}</div>
    ${mField("Month","month",pnl.month,"month")}
    ${mField("Revenue (₱)","revenue",pnl.revenue,"number","",true)}${mField("COGS (₱)","cogs",pnl.cogs,"number")}
    ${mField("Operating Expenses (₱)","opex",pnl.opex,"number")}${mField("Status","status",pnl.status,"select","Draft,Final")}
    <div class="form-full">${mField("Notes","notes",pnl.notes,"textarea")}</div>
  </div>
  <div id="pnl-preview" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;background:rgba(255,255,255,.03);border-radius:var(--r);padding:1rem;margin-top:4px">
    <div style="text-align:center"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Gross Profit</div><div id="pnl-gp" style="font-size:18px;font-weight:700">—</div></div>
    <div style="text-align:center"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Net Profit</div><div id="pnl-np" style="font-size:18px;font-weight:700">—</div></div>
    <div style="text-align:center"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Gross Margin</div><div id="pnl-margin" style="font-size:18px;font-weight:700;color:var(--accent)">—</div></div>
  </div>
  </div>
  ${mFooter("savePNL('"+pnl.id+"')",pnl.id?"confirm2('Delete this entry?',()=>delRecord('pnl','"+pnl.id+"'))":"")}`,true);
  // Live preview
  setTimeout(()=>{
    ["revenue","cogs","opex"].forEach(f=>{document.querySelector(`[name="${f}"]`)?.addEventListener("input",updatePNLPreview);});
    updatePNLPreview();
  },50);
}

function updatePNLPreview(){
  const r=Number(document.querySelector('[name="revenue"]')?.value)||0;
  const c=Number(document.querySelector('[name="cogs"]')?.value)||0;
  const o=Number(document.querySelector('[name="opex"]')?.value)||0;
  const gp=r-c,np=gp-o,margin=r>0?((gp/r)*100).toFixed(1)+"%":"—";
  const gpEl=document.getElementById("pnl-gp"),npEl=document.getElementById("pnl-np"),mEl=document.getElementById("pnl-margin");
  if(gpEl){gpEl.textContent="₱"+num(gp);gpEl.style.color=gp>=0?"var(--green)":"var(--red)";}
  if(npEl){npEl.textContent="₱"+num(np);npEl.style.color=np>=0?"var(--green)":"var(--red)";}
  if(mEl){mEl.textContent=margin;}
}

function savePNL(id){
  if(!mVal("client")||!mVal("revenue")){showToast("Client and Revenue required.","var(--red)");return;}
  const rev=Number(mVal("revenue")),cogs=Number(mVal("cogs"))||0,opex=Number(mVal("opex"))||0;
  const rec={id:id||uid("PNL"),client:mVal("client"),month:mVal("month"),revenue:rev,cogs,opex,grossProfit:rev-cogs,netProfit:rev-cogs-opex,status:mVal("status"),notes:mVal("notes")};
  upsert("pnl",rec); notifyOnSave("pnl",rec,!id); closeModal(); triggerWebhook("pnl.updated",rec); pagePnL();
}

// ═══════════════════════════════════════════════
//  PAGE: LIQUIDATIONS
// ═══════════════════════════════════════════════

