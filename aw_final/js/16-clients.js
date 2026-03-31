// ── 16-clients.js ──

// ═══════════════════════════════════════════════
//  ASIN CHECKER
// ═══════════════════════════════════════════════
function pageAsinChecker(){
  const resTab = "asinchecker";
  const rawInput = window._asinQuery||"";
  const rawLines = rawInput.split(/[\n,]+/).map(function(s){return s.trim().toUpperCase();}).filter(Boolean);
  const isBulk = rawLines.length > 1;

  function getAsinSources(asin){
    var results = [];
    (DB.inventory||[]).filter(function(r){return (r.asin||"").toUpperCase()===asin;}).forEach(function(r){
      results.push({source:"Inventory",label:r.name||r.asin,client:r.client||"—",status:r.invStatus||"Active",detail:"Stock: "+(r.qty||0)+" · "+(r.shippingType||""),color:"var(--green)",icon:"📦"});
    });
    (DB.research||[]).filter(function(r){return (r.asin||"").toUpperCase()===asin;}).forEach(function(r){
      results.push({source:"Research",label:r.productName||r.productDesc||r.asin,client:r.client||"—",status:r.status||"—",detail:"Submitted by "+(r.submittedBy||"—")+" · "+(r.platform||""),color:"var(--accent)",icon:"🔬"});
    });
    (DB.replenishment||[]).filter(function(r){return (r.asin||"").toUpperCase()===asin;}).forEach(function(r){
      results.push({source:"Replenishment",label:r.productDesc||r.asin,client:r.client||"—",status:r.status||"—",detail:"Platform: "+(r.platform||"—")+" · QTY: "+(r.approvedQty||0),color:"var(--yellow)",icon:"🔄"});
    });
    (DB.amazon||[]).filter(function(r){return (r.asin||"").toUpperCase()===asin;}).forEach(function(r){
      results.push({source:"Amazon Orders",label:r.asin,client:r.client||"—",status:r.status||"—",detail:"Order: "+(r.orderNumber||"—")+" · Units: "+(r.units||0),color:"#FF9900",icon:"🛒"});
    });
    (DB.warehouse||[]).filter(function(r){return (r.asin||"").toUpperCase()===asin;}).forEach(function(r){
      results.push({source:"Warehouse",label:r.amazonDesc||r.asin,client:r.clientName||"—",status:r.orderStatus||"—",detail:"Supplier: "+(r.supplierName||"—")+" · Received: "+(r.receivedStatus||"—"),color:"var(--teal)",icon:"🏭"});
    });
    (DB.liquidations||[]).filter(function(r){return (r.asin||"").toUpperCase()===asin;}).forEach(function(r){
      results.push({source:"Liquidations",label:r.asin,client:r.itemOwner||"—",status:r.status||"—",detail:"Qty: "+(r.qty||0)+" · Transfer to: "+(r.transferTo||"—"),color:"var(--orange)",icon:"💧"});
    });
    return results;
  }

  function buildBulkRow(asin){
    var hits = getAsinSources(asin);
    if(!hits.length){
      return '<tr>'
        +'<td style="font-family:var(--mono);font-weight:700;color:var(--accent)">'+asin+'</td>'
        +'<td><span class="badge" style="background:rgba(79,207,142,.15);color:var(--green)">✓ Free</span></td>'
        +'<td colspan="3" style="color:var(--muted);font-size:12px">Not found anywhere — free to use</td>'
        +'</tr>';
    }
    return hits.map(function(h,i){
      var cells = '';
      if(i===0){
        cells += '<td style="font-family:var(--mono);font-weight:700;color:var(--accent)" rowspan="'+hits.length+'">'+asin+'</td>'
               + '<td rowspan="'+hits.length+'"><span class="badge" style="background:rgba(247,92,92,.15);color:var(--red)">⚠ Listed</span></td>';
      }
      cells += '<td><span style="font-size:11px;font-weight:600;color:'+h.color+'">'+h.icon+' '+h.source+'</span></td>'
             + '<td style="font-size:12px;color:var(--muted)">'+h.client+'</td>'
             + '<td style="font-size:12px;color:var(--muted)">'+h.detail+'</td>';
      return '<tr>'+cells+'</tr>';
    }).join('');
  }

  function buildSingleResult(asin){
    var hits = getAsinSources(asin);
    if(!hits.length){
      return '<div style="margin-top:16px;background:rgba(79,207,142,.07);border:2px solid rgba(79,207,142,.3);border-radius:var(--r2);padding:2rem;text-align:center">'
        +'<div style="font-size:32px;margin-bottom:10px">✅</div>'
        +'<div style="font-size:18px;font-weight:700;color:var(--green);margin-bottom:6px">ASIN is Free!</div>'
        +'<div style="font-family:var(--mono);font-size:15px;color:var(--accent);font-weight:700;margin-bottom:8px">'+asin+'</div>'
        +'<div style="font-size:13px;color:var(--muted)">Not found in Inventory, Research, Replenishment, Amazon Orders, Warehouse, or Liquidations.</div>'
        +'</div>';
    }
    var cards = hits.map(function(h){
      return '<div style="background:var(--card2);border:1px solid var(--border);border-left:3px solid '+h.color+';border-radius:var(--r);padding:12px 16px;display:grid;grid-template-columns:auto 1fr 1fr;gap:12px;align-items:center">'
        +'<div style="font-size:22px">'+h.icon+'</div>'
        +'<div>'
          +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:'+h.color+';margin-bottom:3px">'+h.source+'</div>'
          +'<div style="font-size:13px;font-weight:600;color:var(--text)">'+h.label+'</div>'
          +'<div style="font-size:12px;color:var(--muted);margin-top:2px">'+h.detail+'</div>'
        +'</div>'
        +'<div>'
          +'<div style="font-size:10px;color:var(--muted);margin-bottom:3px">Client</div>'
          +'<div style="font-size:13px;font-weight:500">'+h.client+'</div>'
          +'<span class="badge" style="margin-top:4px;background:rgba(255,255,255,.06);color:var(--muted)">'+h.status+'</span>'
        +'</div>'
        +'</div>';
    }).join('');
    return '<div style="margin-top:16px;background:rgba(247,92,92,.07);border:2px solid rgba(247,92,92,.25);border-radius:var(--r2);padding:1.25rem;margin-bottom:12px;display:flex;align-items:center;gap:12px">'
        +'<span style="font-size:28px">⚠️</span>'
        +'<div>'
          +'<div style="font-size:15px;font-weight:700;color:var(--red)">ASIN Already Listed</div>'
          +'<div style="font-family:var(--mono);font-size:14px;color:var(--accent);font-weight:700">'+asin+'</div>'
          +'<div style="font-size:12px;color:var(--muted);margin-top:2px">Found in '+hits.length+' record'+(hits.length!==1?'s':'')+' across the system</div>'
        +'</div>'
        +'</div>'
        +'<div style="display:grid;gap:10px">'+cards+'</div>';
  }

  var resultsHtml = '';
  if(rawLines.length > 0){
    if(isBulk){
      resultsHtml = '<div class="card" style="margin-top:16px;padding:0;overflow:hidden">'
        +'<div style="padding:10px 16px;background:rgba(0,0,0,.2);border-bottom:1px solid var(--border);font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">Bulk Check — '+rawLines.length+' ASINs</div>'
        +'<div class="tbl-wrap"><table>'
        +'<thead><tr><th>ASIN</th><th>Status</th><th>Found In</th><th>Client</th><th>Details</th></tr></thead>'
        +'<tbody>'+rawLines.map(buildBulkRow).join('')+'</tbody>'
        +'</table></div></div>';
    } else {
      resultsHtml = buildSingleResult(rawLines[0]);
    }
  }

  var tabBar = '<div style="display:flex;gap:0;margin-bottom:1.25rem;border-bottom:2px solid var(--border)">'
    +'<button onclick="window._resTab=\'research\';pageResearch()" style="padding:9px 20px;background:none;border:none;border-bottom:3px solid transparent;color:var(--muted);font-size:13px;font-weight:500;cursor:pointer;font-family:var(--font);transition:all .15s;margin-bottom:-2px;white-space:nowrap">🔬 Research List</button>'
    +'<button onclick="window._resTab=\'asinchecker\';pageResearch()" style="padding:9px 20px;background:none;border:none;border-bottom:3px solid var(--accent);color:var(--accent);font-size:13px;font-weight:700;cursor:pointer;font-family:var(--font);transition:all .15s;margin-bottom:-2px;white-space:nowrap">🔍 ASIN Checker</button>'
    +'</div>';

  var searchBox = '<div class="card" style="padding:1.25rem">'
    +'<div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px">🔍 Check ASIN Availability</div>'
    +'<div style="font-size:12px;color:var(--muted);margin-bottom:12px">Enter one ASIN to see full details, or paste multiple (one per line or comma-separated) for a bulk check.</div>'
    +'<div style="display:flex;gap:10px;align-items:flex-start">'
      +'<textarea class="form-input" id="asin-input" rows="3" placeholder="e.g. B08N5WRWNW\nor multiple:\nB08N5WRWNW, B07PDHSLM7" style="flex:1;max-width:500px;resize:vertical;font-family:var(--mono);font-size:13px;letter-spacing:.03em" oninput="window._asinQuery=this.value" onkeydown="if(event.ctrlKey&&event.key===\'Enter\'){event.preventDefault();window._asinQuery=this.value;pageResearch();}">'+(rawInput)+'</textarea>'
      +'<div style="display:flex;flex-direction:column;gap:8px">'
        +'<button class="btn btn-primary" onclick="window._asinQuery=document.getElementById(\'asin-input\').value;pageResearch()">🔍 Check</button>'
        +'<button class="btn btn-ghost btn-sm" onclick="window._asinQuery=\'\';pageResearch()">Clear</button>'
      +'</div>'
    +'</div>'
    +'<div style="font-size:11px;color:var(--dim);margin-top:8px">Tip: Press <kbd style="background:rgba(255,255,255,.08);border:1px solid var(--border);border-radius:3px;padding:1px 5px;font-size:10px">Ctrl+Enter</kbd> to check quickly</div>'
    +'</div>';

  render('<div>'
    +'<div class="page-header"><div>'
      +'<div class="page-title" style="display:flex;align-items:center;gap:10px">'
        +'<span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;background:rgba(79,142,247,.15);border-radius:8px;font-size:18px">🔬</span>'
        +'Product Research'
      +'</div>'
      +'<div class="page-sub">ASIN Checker — search across all system tables</div>'
    +'</div></div>'
    +tabBar
    +searchBox
    +resultsHtml
    +'</div>');
}


function pageClients(){
  const view=(window._clientView)||"list";
  const selected=window._selectedClient||null;
  if(view==="detail"&&selected) return renderClientDetail(selected);
  const cliSearch=(window._cliSearch)||"";
  const cliStatusF=(window._cliStatusF)||"All";
  const cliPlatF=(window._cliPlatF)||"All";
  const _cliStatusF = cliStatusF;

  const platColors={Amazon:"#FF9900",Walmart:"#0071CE",Ebay:"#E53238",AWL:"var(--accent)"};
  const platIcons={Amazon:"🛒",Walmart:"🛍",Ebay:"🏷",AWL:"🏢"};

  const filteredClients=DB.clients.filter(c=>{
    const mp=cliPlatF==="All"||(c.platform||"AWL")===cliPlatF;
    const ms=cliStatusF==="All"||c.status===cliStatusF;
    const mq=!cliSearch||(c.name||"").toLowerCase().includes(cliSearch.toLowerCase())||(c.contact||"").toLowerCase().includes(cliSearch.toLowerCase());
    return mp&&ms&&mq;
  });

  render(`
  <div>
    <div class="page-header">
      <div><div class="page-title">Client Sheets</div><div class="page-sub">${DB.clients.length} connected clients · Paste a Google Sheets link to connect</div></div>
      ${currentUser.role==="Admin"?`<button class="btn btn-primary" onclick="openClientModal()">+ Add Client</button>`:""}
    </div>

    <!-- Platform Tabs -->
    <div style="display:flex;gap:0;margin-bottom:1.25rem;border-bottom:2px solid var(--border)">
      ${["All","Amazon","Walmart","Ebay","AWL"].map(p=>{
        const cnt = p==="All" ? DB.clients.length : DB.clients.filter(c=>(c.platform||"AWL")===p).length;
        const col = platColors[p]||"var(--accent)";
        const active = cliPlatF===p;
        return `<button onclick="window._cliPlatF='${p}';pageClients()"
          style="padding:9px 20px;background:none;border:none;border-bottom:3px solid ${active?col:"transparent"};
                 color:${active?col:"var(--muted)"};font-size:13px;font-weight:${active?"700":"500"};
                 cursor:pointer;font-family:var(--font);transition:all .15s;margin-bottom:-2px;white-space:nowrap">
          ${p==="All"?"All Clients":(platIcons[p]+" "+p)}
          <span style="margin-left:6px;background:${active?"rgba(255,255,255,.12)":"rgba(255,255,255,.05)"};border-radius:20px;padding:1px 7px;font-size:11px">${cnt}</span>
        </button>`;
      }).join("")}
    </div>

    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><input class="search-bar" placeholder="Search client name or contact..." value="${cliSearch}" oninput="window._cliSearch=this.value;pageClients()" style="flex:1;min-width:200px;max-width:300px"><span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--dim)">Status:</span><div style="display:flex;gap:5px;flex-wrap:wrap">${['All', 'Active', 'Inactive', 'Suspended'].map(s=>`<button class="filter-pill${_cliStatusF===s?" active":""}" onclick="window._cliStatusF='${s}';pageClients()">${s}</button>`).join("")}</div></div></div>

    <div class="metrics metrics-4" style="margin-bottom:1.25rem">
      ${metric("Total Clients",DB.clients.length,"","var(--accent)")}
      ${metric("Amazon",DB.clients.filter(c=>c.platform==="Amazon").length,"","#FF9900")}
      ${metric("Walmart",DB.clients.filter(c=>c.platform==="Walmart").length,"","#0071CE")}
      ${metric("Ebay",DB.clients.filter(c=>c.platform==="Ebay").length,"","#E53238")}
    </div>

    <!-- Sync info banner -->
    <div style="background:rgba(79,142,247,.06);border:1px solid rgba(79,142,247,.15);border-radius:var(--r2);padding:1rem 1.25rem;margin-bottom:1.25rem;display:flex;gap:12px;align-items:flex-start">
      <span style="font-size:18px">ℹ</span>
      <div>
        <div style="font-size:13px;font-weight:600;margin-bottom:4px">How auto-sync works</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.6">Every time you save a change in American Wholesalers (Inventory, P&L, Purchases, Replenishment), a webhook fires automatically. Connect this to <strong style="color:var(--text)">Make.com</strong> or <strong style="color:var(--text)">Zapier</strong> and it will write the update directly to your linked Google Sheet — no manual export needed.</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px">
    ${filteredClients.length===0?`<div class="card" style="text-align:center;padding:3rem;color:var(--muted);grid-column:1/-1">No clients found${cliPlatF!=="All"?" for "+cliPlatF:""}.</div>`:""}
    ${filteredClients.map(c=>{
      const plat=c.platform||"AWL";
      const platCol=platColors[plat]||"var(--accent)";
      const platIcon=platIcons[plat]||"🏢";
      return `
      <div class="client-card" onclick="openClientDetail('${c.id}')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div style="min-width:0;flex:1">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
              <span style="font-size:10px;font-weight:700;color:${platCol};background:${platCol}18;border-radius:4px;padding:2px 7px;flex-shrink:0">${platIcon} ${plat}</span>
            </div>
            <div style="font-size:15px;font-weight:700">${c.name}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px">${c.industry||""}</div>
          </div>
          <div style="display:flex;gap:6px;flex-direction:column;align-items:flex-end;flex-shrink:0">
            ${badge(c.status)}
            ${c.webhookEnabled?`<span style="font-size:10px;color:var(--green);background:rgba(79,207,142,.1);border-radius:10px;padding:2px 8px">⚡ Webhook ON</span>`:`<span style="font-size:10px;color:var(--muted);background:rgba(255,255,255,.05);border-radius:10px;padding:2px 8px">Webhook OFF</span>`}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--muted)">
          <div><span style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:.07em;margin-bottom:2px">Contact</span>${c.contactPerson||c.contact||"—"}</div>
          <div><span style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:.07em;margin-bottom:2px">Sheet</span>
            ${c.sheetUrl?`<span style="color:var(--green)">✓ Linked</span>`:`<span style="color:var(--dim)">Not linked</span>`}
          </div>
          <div><span style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:.07em;margin-bottom:2px">Last Sync</span>${c.lastSync||"—"}</div>
          <div><span style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:.07em;margin-bottom:2px">Added</span>${c.addedDate||"—"}</div>
        </div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);display:flex;gap:8px">
          ${canEdit("clients")?`<button class="btn btn-info btn-sm" onclick="event.stopPropagation();openClientModal(DB.clients.find(x=>x.id==='${c.id}'))">Edit</button>`:""}
          ${c.sheetUrl?`<button class="btn btn-success btn-sm" onclick="event.stopPropagation();fetchClientSheet('${c.id}')">↺ Sync Now</button>`:""}
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openClientDetail('${c.id}')">View Data →</button>
        </div>
      </div>`;
    }).join("")}
    </div>
  </div>`);
}

function openClientDetail(id){
  window._clientView="detail";
  window._selectedClient=id;
  renderClientDetail(id);
}

function renderClientDetail(id){
  const c=DB.clients.find(x=>x.id===id);
  if(!c) return pageClients();
  const pnls=DB.pnl.filter(p=>p.client===c.name);
  const tRev=pnls.reduce((a,r)=>a+r.revenue,0);
  const tNP=pnls.reduce((a,r)=>a+r.netProfit,0);

  render(`
  <div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.5rem">
      <button class="btn btn-ghost btn-sm" onclick="window._clientView='list';pageClients()">← Back</button>
      <div class="page-title">${c.name}</div>
      ${badge(c.status)}
      ${c.webhookEnabled?`<span style="font-size:11px;color:var(--green);background:rgba(79,207,142,.1);border-radius:10px;padding:3px 10px">⚡ Webhook Active</span>`:""}
    </div>

    <div style="display:grid;grid-template-columns:1fr 2fr;gap:16px;margin-bottom:16px">
      <!-- Client info -->
      <div class="card">
        <div class="card-title">Client Info</div>
        ${[["Industry",c.industry],["Contact",c.contactPerson],["Email",c.contactEmail],["Added by",c.addedBy],["Since",c.addedDate]].map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--muted)">${k}</span><span style="font-size:12px;text-align:right">${v||"—"}</span></div>`).join("")}
        ${c.notes?`<div style="margin-top:10px;font-size:12px;color:var(--muted);line-height:1.5">${c.notes}</div>`:""}
        ${canEdit("clients")?`<button class="btn btn-info btn-sm" style="margin-top:12px;width:100%" onclick="openClientModal(DB.clients.find(x=>x.id==='${c.id}'))">Edit Client</button>`:""}
      </div>
      <!-- Sheet connector -->
      <div class="card">
        <div class="card-title">Google Sheet Connection</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="form-group">
            <label class="form-label">Google Sheets URL</label>
            <div style="display:flex;gap:8px">
              <input id="sheet-url-${c.id}" class="form-input" value="${c.sheetUrl||""}" placeholder="https://docs.google.com/spreadsheets/d/..." style="flex:1">
              ${currentUser.role==="Admin"?`<button class="btn btn-primary btn-sm" onclick="saveSheetUrl('${c.id}')">Save</button>`:""}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Sheet Tab Name (optional)</label>
            <input id="sheet-tab-${c.id}" class="form-input" value="${c.sheetTab||""}" placeholder="e.g. Inventory, P&L (leave blank for first tab)">
          </div>
          ${c.sheetUrl?`
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-success btn-sm" onclick="fetchClientSheet('${c.id}')">↺ Fetch & Preview Data</button>
            <span style="font-size:11px;color:var(--muted)">Last sync: ${c.lastSync||"Never"}</span>
          </div>
          <div style="background:rgba(255,255,255,.03);border-radius:var(--r);padding:10px;font-size:12px;color:var(--muted);line-height:1.6">
            <strong style="color:var(--text)">Requirements:</strong> The sheet must be shared as "Anyone with the link can view". Data will be fetched and displayed here. To write back, connect a webhook via Make.com or Zapier.
          </div>`:`
          <div style="text-align:center;padding:1.5rem;color:var(--muted);font-size:13px">
            No sheet linked yet. Paste a Google Sheets URL above and click Save.
          </div>`}
          ${currentUser.role==="Admin"?`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:rgba(255,255,255,.03);border-radius:var(--r)">
            <div><div style="font-size:12px;font-weight:600">Webhook Auto-Sync</div><div style="font-size:11px;color:var(--muted);margin-top:2px">Fire webhook on every CMS save</div></div>
            <button onclick="toggleWebhook('${c.id}')" class="btn btn-sm ${c.webhookEnabled?"btn-success":"btn-ghost"}">${c.webhookEnabled?"⚡ Enabled":"Enable"}</button>
          </div>`:""}
        </div>
      </div>
    </div>

    <!-- Sheet data preview -->
    <div id="sheet-preview-${c.id}">
      ${c.sheetUrl?`<div class="card"><div style="text-align:center;padding:2rem;color:var(--muted)"><div style="font-size:24px;margin-bottom:8px">↺</div><div style="font-size:13px">Click "Fetch & Preview Data" to load sheet data</div></div></div>`:""}
    </div>

    <!-- P&L from CMS -->
    ${pnls.length?`
    <div class="card" style="margin-top:16px">
      <div class="card-title">P&L Records for ${c.name} (from CMS)</div>
      <div class="metrics metrics-3" style="margin-bottom:1rem">
        ${metric("Total Revenue","₱"+(tRev/1000).toFixed(0)+"K","","var(--accent)")}
        ${metric("Net Profit","₱"+(tNP/1000).toFixed(0)+"K","",tNP>=0?"var(--green)":"var(--red)")}
        ${metric("Entries",pnls.length,"","var(--muted)")}
      </div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Month</th><th>Revenue</th><th>COGS</th><th>OpEx</th><th>Net Profit</th><th>Status</th></tr></thead>
        <tbody>${pnls.map(p=>`<tr>
          <td class="text-muted">${p.month}</td>
          <td class="fw6">₱${num(p.revenue)}</td>
          <td class="text-muted">₱${num(p.cogs)}</td>
          <td class="text-muted">₱${num(p.opex)}</td>
          <td style="color:${p.netProfit>=0?"var(--green)":"var(--red)"};font-weight:700">₱${num(p.netProfit)}</td>
          <td>${badge(p.status)}</td>
        </tr>`).join("")}</tbody>
      </table></div>
    </div>`:""}
  </div>`);
}

function saveSheetUrl(id){
  const url=document.getElementById("sheet-url-"+id)?.value||"";
  const tab=document.getElementById("sheet-tab-"+id)?.value||"";
  const c=DB.clients.find(x=>x.id===id);
  if(c){c.sheetUrl=url;c.sheetTab=tab;}
  showToast("Sheet URL saved","var(--green)");
  renderClientDetail(id);
}

function toggleWebhook(id){
  const c=DB.clients.find(x=>x.id===id);
  if(c){c.webhookEnabled=!c.webhookEnabled;}
  showToast(c.webhookEnabled?"Webhook enabled — sync is active":"Webhook disabled",c.webhookEnabled?"var(--green)":"var(--muted)");
  renderClientDetail(id);
}

async function fetchClientSheet(id){
  const c=DB.clients.find(x=>x.id===id);
  if(!c||!c.sheetUrl){showToast("No sheet URL saved for this client.","var(--red)");return;}
  const preview=document.getElementById("sheet-preview-"+id);
  if(preview) preview.innerHTML=`<div class="card"><div style="text-align:center;padding:2rem;color:var(--muted)"><div style="font-size:13px">Fetching sheet data…</div></div></div>`;

  try{
    // Build CSV export URL from Google Sheets link
    const match=c.sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if(!match) throw new Error("Invalid Google Sheets URL — must contain /spreadsheets/d/");
    const sheetId=match[1];
    const gidMatch=c.sheetUrl.match(/[#&?]gid=(\d+)/);
    const gid=gidMatch?gidMatch[1]:"0";
    const csvUrl=`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    const res=await fetch(csvUrl);
    if(!res.ok) throw new Error(`HTTP ${res.status} — make sure the sheet is set to "Anyone with the link can view"`);
    const text=await res.text();
    if(text.includes("<!DOCTYPE")||text.includes("<html")) throw new Error("Google returned a login page. The sheet may be private.");
    // Parse CSV
    const lines=text.trim().split("\n").map(l=>{
      const result=[];let cur="",inQ=false;
      for(let i=0;i<l.length;i++){if(l[i]==='"'){inQ=!inQ;}else if(l[i]===","&&!inQ){result.push(cur.trim());cur="";}else cur+=l[i];}
      result.push(cur.trim());return result;
    });
    if(lines.length<2) throw new Error("Sheet appears empty — no data rows found.");
    const headers=lines[0];
    const rows=lines.slice(1).filter(r=>r.some(c=>c!==""));
    c.lastSync=nowCA().ts.slice(11,16)+" PT";
    c.syncStatus="live";
    if(preview) preview.innerHTML=renderSheetPreview(c.name,headers,rows);
    showToast(`Loaded ${rows.length} rows from "${c.name}"'s sheet`,"var(--green)");
  } catch(e){
    if(preview) preview.innerHTML=`<div class="card"><div class="alert-banner alert-danger">⚠ Could not fetch sheet: ${e.message}</div><div style="font-size:12px;color:var(--muted);padding:0 0 1rem;line-height:1.7"><strong style="color:var(--text)">To fix this:</strong><br>1. Open the Google Sheet<br>2. Click Share → Change to "Anyone with the link can view"<br>3. Copy the URL and paste it here<br>4. Try fetching again</div></div>`;
    showToast("Could not fetch sheet","var(--red)");
  }
}

function renderSheetPreview(clientName,headers,rows){
  const totals={};headers.forEach((h,i)=>{
    const n=rows.map(r=>Number(String(r[i]||"").replace(/[$,₱%]/g,""))).filter(v=>!isNaN(v)&&String(rows[0]?.[i]||"").trim()!=="");
    if(n.length>1) totals[i]=n.reduce((a,v)=>a+v,0);
  });
  return `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div class="card-title" style="margin:0">${clientName} — Sheet Preview</div>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="sync-dot live"></span><span style="font-size:11px;color:var(--green)">Live data</span>
        <span style="font-size:11px;color:var(--muted)">${rows.length} rows · ${headers.length} columns</span>
      </div>
    </div>
    <div class="tbl-wrap"><table>
      <thead><tr>${headers.slice(0,12).map(h=>`<th>${h}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.slice(0,50).map(r=>`<tr>${r.slice(0,12).map((cell,i)=>{
          const n=Number(String(cell).replace(/[$,₱%]/g,""));
          const isCur=!isNaN(n)&&n!==0&&(headers[i]?.toLowerCase().includes("revenue")||headers[i]?.toLowerCase().includes("profit")||headers[i]?.toLowerCase().includes("amount")||headers[i]?.toLowerCase().includes("value")||headers[i]?.toLowerCase().includes("cost")||headers[i]?.toLowerCase().includes("sales")||headers[i]?.toLowerCase().includes("price")||headers[i]?.toLowerCase().includes("total"));
          return `<td style="${isCur?"color:var(--green);font-weight:500":""}">${cell||"—"}</td>`;
        }).join("")}</tr>`).join("")}
        ${Object.keys(totals).length?`<tr style="background:rgba(255,255,255,.04);font-weight:700">${headers.slice(0,12).map((h,i)=>totals[i]!==undefined?`<td style="color:var(--accent)">Σ ${totals[i].toLocaleString(undefined,{maximumFractionDigits:2})}</td>`:`<td class="text-muted" style="font-size:11px">${i===0?"TOTALS":""}</td>`).join("")}</tr>`:""}
      </tbody>
    </table></div>
    ${rows.length>50?`<div style="text-align:center;padding:8px;font-size:12px;color:var(--muted)">Showing first 50 of ${rows.length} rows</div>`:""}
  </div>`;
}

function openClientModal(c=null){
  const isNew=!c;
  c=c||{id:"",name:"",industry:"",contactPerson:"",contactEmail:"",sheetUrl:"",status:"Active",platform:"AWL",webhookEnabled:false,notes:""};
  openModal(`${mHeader(isNew?"Add Client":"Edit Client")}
  <div class="modal-body"><div class="form-grid">
    ${mField("Company Name","name",c.name,"text","",true)}${mField("Industry","industry",c.industry,"text","e.g. Manufacturing")}
    ${mField("Platform","platform",c.platform||"AWL","select","AWL,Amazon,Walmart,Ebay",true)}
    ${mField("Contact Person","contactPerson",c.contactPerson,"text")}${mField("Contact Email","contactEmail",c.contactEmail,"email")}
    ${mField("Status","status",c.status,"select","Active,Inactive,Suspended")}
    <div class="form-full">${mField("Google Sheets URL","sheetUrl",c.sheetUrl,"text","https://docs.google.com/spreadsheets/d/...")}</div>
    <div class="form-full">${mField("Notes","notes",c.notes,"textarea")}</div>
  </div></div>
  ${mFooter("saveClient('"+c.id+"')",c.id?"confirm2('Remove this client?',()=>delRecord('clients','"+c.id+"'))":"")}`);
}

function saveClient(id){
  if(!mVal("name")){showToast("Company name required.","var(--red)");return;}
  const rec={id:id||uid("CLT"),name:mVal("name"),industry:mVal("industry"),contactPerson:mVal("contactPerson"),contactEmail:mVal("contactEmail"),sheetUrl:mVal("sheetUrl"),sheetTab:"",status:mVal("status"),platform:mVal("platform")||"AWL",webhookEnabled:false,lastSync:"",syncStatus:"off",notes:mVal("notes"),addedBy:currentUser.username,addedDate:TODAY};
  upsert("clients",rec); saveToLocalStorage(); closeModal(); pageClients();
}

// ═══════════════════════════════════════════════
//  SHARED CRUD
// ═══════════════════════════════════════════════

