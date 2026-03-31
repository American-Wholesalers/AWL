// ── 23-brands.js ──

function brandStatusBadge(s){
  const st=BRAND_STATUS_STYLES[s]||{bg:"rgba(107,118,148,.12)",color:"#6b7694"};
  return `<span class="badge" style="background:${st.bg};color:${st.color}">${s||"—"}</span>`;
}

function pageBrands(){
  const brandSection = window._brandSection||"submissions";

  // Route to sub-pages
  if(brandSection==="future")      return pageBrandsFuture();
  if(brandSection==="spoke")       return pageBrandsSpoke();
  if(brandSection==="monthly")     return pageBrandsMonthly();
  if(brandSection==="tradeshows")  return pageBrandsTradeShows();

  // ── BRAND SUBMISSIONS (default) ──
  const search=(window._brandSearch)||"";
  const statusFilter=(window._brandStatusFilter)||"All";
  const _brandStatusFilter = window._brandStatusFilter||"All";
  const view=(window._brandView)||"table";
  const _brandView = window._brandView||"table";
  if(view==="detail"&&window._brandSelected) return renderBrandDetail(window._brandSelected);

  const rows=DB.brands.filter(b=>
    (statusFilter==="All"||b.status===statusFilter)&&
    (!search||
    b.brandName.toLowerCase().includes(search.toLowerCase())||
    b.primarySubcategory.toLowerCase().includes(search.toLowerCase())||
    b.contactName.toLowerCase().includes(search.toLowerCase())||
    b.submittedBy.toLowerCase().includes(search.toLowerCase())||
    (b.submissionId||"").toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue=DB.brands.reduce((a,b)=>a+(b.subcategoryMonthlyRevenue||0),0);
  const avgMarket=(DB.brands.reduce((a,b)=>a+(b.marketShare||0),0)/Math.max(DB.brands.length,1)).toFixed(1);
  const totalUPCs=DB.brands.reduce((a,b)=>a+(b.totalUPCs||0),0);
  const totalAdSpend=DB.brands.reduce((a,b)=>a+(b.estAdSpend||0),0);

  render(`
  <div>
    <div class="page-header">
      <div>
        <div class="page-title" style="display:flex;align-items:center;gap:10px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(167,139,250,.15);border-radius:8px;font-size:16px">★</span>
          Brands
        </div>
        <div class="page-sub">${DB.brands.length} brand submissions · Track, evaluate, and follow up</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="exportBrandsCSV()">↓ Export CSV</button>
        <button class="btn btn-info btn-sm" onclick="openBrandImport()">↑ Import from Sheets</button>
        ${canSubmit("brands")?'<button class="btn btn-primary" onclick="openBrandModal()">+ Add Brand</button>':""}
      </div>
    </div>

    ${brandSectionTabs("submissions")}

    <!-- KPI strip -->
    <div class="metrics metrics-4" style="margin-bottom:1.25rem">
      ${metric("Total Brands",DB.brands.length,"","var(--purple)")}
      ${metric("Approved",DB.brands.filter(b=>b.status==="Approved").length,"","var(--green)")}
      ${metric("Pending",DB.brands.filter(b=>b.status==="Pending").length,"Awaiting decision","var(--yellow)")}
      ${metric("Declined",DB.brands.filter(b=>b.status==="Declined").length,"","var(--red)")}
    </div>

    <!-- Follow-up alerts -->
    ${(()=>{
      const today=new Date(TODAY);
      const soon=DB.brands.filter(b=>{
        const fp=b.followUpPat?new Date(b.followUpPat):null;
        const fc=b.followUpCesar?new Date(b.followUpCesar):null;
        const diff=d=>d?Math.ceil((d-today)/(1000*60*60*24)):99;
        return diff(fp)<=3||diff(fc)<=3;
      });
      if(!soon.length) return "";
      return `<div style="background:rgba(247,201,79,.07);border:1px solid rgba(247,201,79,.2);border-radius:var(--r);padding:10px 14px;margin-bottom:1rem;display:flex;gap:10px;align-items:flex-start">
        <span style="font-size:16px">📅</span>
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--yellow);margin-bottom:4px">Follow-ups due soon (within 3 days)</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${soon.map(b=>`<span style="font-size:12px;color:var(--text)">${b.brandName} <span style="color:var(--muted)">${b.followUpPat||b.followUpCesar}</span></span>`).join(" · ")}
          </div>
        </div>
      </div>`;
    })()}

    <!-- Toolbar -->
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
      <input class="search-bar" placeholder="Search brand, subcategory, contact…" value="${search}" oninput="window._brandSearch=this.value;pageBrands()" style="flex:1;min-width:200px;max-width:360px">
      <div style="display:flex;gap:6px">
        ${["All","Approved","Pending","Declined"].map(s=>`<button class="filter-pill${statusFilter===s?" active":""}" onclick="window._brandStatusFilter='${s}';pageBrands()">${s}</button>`).join("")}
      </div>
      <div style="margin-left:auto;display:flex;gap:4px;background:rgba(255,255,255,.05);border-radius:8px;padding:3px">
        <button class="btn btn-sm" style="${view==="table"?"background:var(--accent);color:#fff":"background:transparent;color:var(--muted)"}" onclick="window._brandView='table';pageBrands()">☰ Table</button>
        <button class="btn btn-sm" style="${view==="cards"?"background:var(--accent);color:#fff":"background:transparent;color:var(--muted)"}" onclick="window._brandView='cards';pageBrands()">⊞ Cards</button>
      </div>
    </div>

    ${view==="cards" ? renderBrandCards(rows) : renderBrandTable(rows)}
  </div>`);
}

// ── Shared section tab bar ──
function brandSectionTabs(active){
  const tabs=[
    {id:"submissions", label:"Brand Submissions",           icon:"★"},
    {id:"future",      label:"Future Attempts",             icon:"🎯"},
    {id:"spoke",       label:"Brands We've Spoken To",      icon:"💬"},
    {id:"monthly",     label:"Monthly Reports – Tradeshows",icon:"📊"},
    {id:"tradeshows",  label:"Upcoming Trade Shows",        icon:"🏪"},
  ].filter(t=>canAccessTab("brands",t.id));
  // If current active tab is no longer accessible, redirect to first allowed
  if(tabs.length && !tabs.find(t=>t.id===active)){
    const first=tabs[0].id;
    setTimeout(()=>{window._brandSection=first;pageBrands();},0);
    return "";
  }
  return `<div style="display:flex;gap:0;margin-bottom:1.25rem;border-bottom:2px solid var(--border);overflow-x:auto">
    ${tabs.map(t=>`
      <button onclick="window._brandSection='${t.id}';window._brandSelected=null;pageBrands()"
        style="padding:9px 20px;background:none;border:none;border-bottom:3px solid ${active===t.id?"var(--purple)":"transparent"};
               color:${active===t.id?"var(--purple)":"var(--muted)"};font-size:13px;font-weight:${active===t.id?"700":"500"};
               cursor:pointer;font-family:var(--font);transition:all .15s;margin-bottom:-2px;white-space:nowrap">
        ${t.icon} ${t.label}
      </button>`).join("")}
  </div>`;
}

// ── FUTURE ATTEMPTS ──────────────────────────────────────────
function pageBrandsFuture(){
  if(!DB.brandsFuture) DB.brandsFuture=[];
  const search=(window._bfSearch)||"";
  const rows=DB.brandsFuture.filter(r=>!search||
    (r.brandName||"").toLowerCase().includes(search.toLowerCase())||
    (r.notes||"").toLowerCase().includes(search.toLowerCase())||
    (r.contactName||"").toLowerCase().includes(search.toLowerCase())
  );
  render(`<div>
    <div class="page-header">
      <div>
        <div class="page-title" style="display:flex;align-items:center;gap:10px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(167,139,250,.15);border-radius:8px;font-size:16px">🎯</span>
          Brands — Future Attempts
        </div>
        <div class="page-sub">${DB.brandsFuture.length} brands to revisit</div>
      </div>
      ${canSubmit("brands")?'<button class="btn btn-primary" onclick="openBrandSectionModal(\'future\')"}>+ Add</button>':""}
    </div>
    ${brandSectionTabs("future")}
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <input class="search-bar" placeholder="Search brand, contact, notes…" value="${search}"
        oninput="window._bfSearch=this.value;pageBrandsFuture()" style="width:100%;max-width:360px">
    </div>
    ${(()=>{
      const _today=new Date(TODAY);
      const _soon=DB.brandsFuture.filter(r=>{
        if(!r.followUp) return false;
        return Math.ceil((new Date(r.followUp)-_today)/(1000*60*60*24))<=3;
      });
      if(!_soon.length) return "";
      return `<div style="background:rgba(247,201,79,.07);border:1px solid rgba(247,201,79,.2);border-radius:var(--r);padding:10px 14px;margin-bottom:1rem;display:flex;gap:10px;align-items:flex-start">
        <span style="font-size:16px">📅</span>
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--yellow);margin-bottom:4px">Follow-ups due soon (within 3 days)</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${_soon.map(r=>`<span style="font-size:12px;color:var(--text)">${r.brandName||"—"} <span style="color:var(--muted)">${r.followUp}</span></span>`).join(" · ")}
          </div>
        </div>
      </div>`;
    })()}
    <div class="card" style="padding:0;overflow:hidden">
      <div class="tbl-wrap"><table>
        <thead><tr>
          <th>Brand Name</th><th>Contact Name</th><th>Job Title</th><th>Phone</th><th>Email</th>
          <th>Website</th><th>Submitted By</th><th>Next Follow-Up</th><th>Date Added</th><th></th>
        </tr></thead>
        <tbody>
        ${rows.length===0?`<tr><td colspan="10" style="text-align:center;padding:2.5rem;color:var(--muted)">No records yet</td></tr>`:""}
        ${rows.map(r=>`<tr>
          <td style="font-weight:600;cursor:text" onclick="bsInlineEdit('future','${r.id}','brandName','${(r.brandName||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.brandName||"—"}</td>
          <td style="font-size:12px;cursor:text" onclick="bsInlineEdit('future','${r.id}','contactName','${(r.contactName||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.contactName||"—"}</td>
          <td style="font-size:12px;color:var(--muted);cursor:text" onclick="bsInlineEdit('future','${r.id}','jobTitle','${(r.jobTitle||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.jobTitle||"—"}</td>
          <td style="font-size:12px;color:var(--muted);cursor:text" onclick="bsInlineEdit('future','${r.id}','phone','${(r.phone||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.phone||"—"}</td>
          <td style="font-size:12px;color:var(--muted);cursor:text" onclick="bsInlineEdit('future','${r.id}','email','${(r.email||"").replace(/'/g,"&#39;")}','email')" title="Click to edit">${r.email||"—"}</td>
          <td style="font-size:12px;cursor:text" onclick="bsInlineEdit('future','${r.id}','website','${(r.website||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.website?`<a href="${r.website.startsWith('http')?r.website:'https://'+r.website}" target="_blank" style="color:var(--accent);text-decoration:none" onclick="event.stopPropagation()">${r.website.replace(/^https?:\/\//,'').substring(0,28)}${r.website.replace(/^https?:\/\//,'').length>28?'…':''}</a>`:'—'}</td>
          <td style="font-size:12px;color:var(--muted);cursor:text" onclick="bsInlineEdit('future','${r.id}','submittedBy','${(r.submittedBy||r.addedBy||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.submittedBy||r.addedBy||"—"}</td>
          <td style="font-size:12px;color:${r.followUp&&new Date(r.followUp)<new Date(TODAY)?"var(--red)":"var(--muted)"};cursor:text" onclick="bsInlineEdit('future','${r.id}','followUp','${r.followUp||""}','date')" title="Click to edit">${r.followUp||"—"}</td>
          <td style="font-size:11px;color:var(--dim);cursor:text" onclick="bsInlineEdit('future','${r.id}','date','${r.date||""}','date')" title="Click to edit">${r.date||"—"}</td>
          <td><div style="display:flex;gap:4px">
            ${canSubmit("brands")?`<button class="btn btn-info btn-sm" onclick="openBrandSectionModal('future','${r.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="confirm2('Delete this record?',()=>deleteBrandSection('future','${r.id}'))">✕</button>`:""}
          </div></td>
        </tr>`).join("")}
        </tbody>
      </table></div>
      <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${rows.length} records</div>
    </div>
  </div>`);
}

// ── BRANDS WE'VE SPOKEN TO ───────────────────────────────────
function pageBrandsSpoke(){
  if(!DB.brandsSpoke) DB.brandsSpoke=[];
  const search=(window._bsSearch)||"";
  const rows=DB.brandsSpoke.filter(r=>!search||
    (r.brandName||"").toLowerCase().includes(search.toLowerCase())||
    (r.contactPerson||"").toLowerCase().includes(search.toLowerCase())||
    (r.zoomWith||"").toLowerCase().includes(search.toLowerCase())||
    (r.status||"").toLowerCase().includes(search.toLowerCase())||
    (r.followUpNotes||"").toLowerCase().includes(search.toLowerCase())
  );
  render(`<div>
    <div class="page-header">
      <div>
        <div class="page-title" style="display:flex;align-items:center;gap:10px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(167,139,250,.15);border-radius:8px;font-size:16px">💬</span>
          Brands We've Spoken To
        </div>
        <div class="page-sub">${DB.brandsSpoke.length} conversations logged</div>
      </div>
      ${canSubmit("brands")?'<button class="btn btn-primary" onclick="openBrandSectionModal(\'spoke\')"}>+ Add</button>':""}
    </div>
    ${brandSectionTabs("spoke")}
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <input class="search-bar" placeholder="Search brand, contact, outcome…" value="${search}"
        oninput="window._bsSearch=this.value;pageBrandsSpoke()" style="width:100%;max-width:360px">
    </div>
    ${(()=>{
      const _today=new Date(TODAY);
      const _soon=DB.brandsSpoke.filter(r=>{
        if(!r.followUp) return false;
        return Math.ceil((new Date(r.followUp)-_today)/(1000*60*60*24))<=3;
      });
      if(!_soon.length) return "";
      return `<div style="background:rgba(247,201,79,.07);border:1px solid rgba(247,201,79,.2);border-radius:var(--r);padding:10px 14px;margin-bottom:1rem;display:flex;gap:10px;align-items:flex-start">
        <span style="font-size:16px">📅</span>
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--yellow);margin-bottom:4px">Follow-ups due soon (within 3 days)</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${_soon.map(r=>`<span style="font-size:12px;color:var(--text)">${r.brandName||"—"} <span style="color:var(--muted)">${r.followUp}</span></span>`).join(" · ")}
          </div>
        </div>
      </div>`;
    })()}
    <div class="card" style="padding:0;overflow:hidden">
      <div class="tbl-wrap"><table>
        <thead><tr>
          <th>Date</th><th>Brand Name</th><th>Zoom Meeting With</th><th>Contact Person</th>
          <th>Contact Number</th><th>Job Title</th><th>Follow-Up Notes</th><th>Status</th>
          <th>Next Follow-Up</th><th></th>
        </tr></thead>
        <tbody>
        ${rows.length===0?`<tr><td colspan="10" style="text-align:center;padding:2.5rem;color:var(--muted)">No records yet</td></tr>`:""}
        ${rows.map(r=>`<tr>
          <td style="font-size:12px;color:var(--muted);cursor:text" onclick="bsInlineEdit('spoke','${r.id}','dateSpoken','${r.dateSpoken||r.date||""}','date')" title="Click to edit">${r.dateSpoken||r.date||"—"}</td>
          <td style="font-weight:600;cursor:text" onclick="bsInlineEdit('spoke','${r.id}','brandName','${(r.brandName||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.brandName||"—"}</td>
          <td style="font-size:12px;cursor:text" onclick="bsInlineEdit('spoke','${r.id}','zoomWith','${(r.zoomWith||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.zoomWith||"—"}</td>
          <td style="font-size:12px;cursor:text" onclick="bsInlineEdit('spoke','${r.id}','contactPerson','${(r.contactPerson||r.contactName||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.contactPerson||r.contactName||"—"}</td>
          <td style="font-size:12px;color:var(--muted);cursor:text" onclick="bsInlineEdit('spoke','${r.id}','phone','${(r.phone||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.phone||"—"}</td>
          <td style="font-size:12px;color:var(--muted);cursor:text" onclick="bsInlineEdit('spoke','${r.id}','jobTitle','${(r.jobTitle||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.jobTitle||"—"}</td>
          <td style="font-size:12px;color:var(--muted);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:text" onclick="bsInlineEdit('spoke','${r.id}','followUpNotes','${(r.followUpNotes||"").replace(/'/g,"&#39;")}','text')" title="${r.followUpNotes||"Click to edit"}">${r.followUpNotes||"—"}</td>
          <td style="cursor:pointer" onclick="bsSelectEdit(this,'spoke','${r.id}','status','Pending,Closed,Denied,In Progress')" title="Click to edit"><span class="badge" style="background:${r.status==='Closed'?'rgba(79,207,142,.15)':r.status==='Denied'?'rgba(247,92,92,.15)':'rgba(247,201,79,.15)'};color:${r.status==='Closed'?'var(--green)':r.status==='Denied'?'var(--red)':'var(--yellow)'}">${r.status||'Pending'}</span></td>
          <td style="font-size:12px;color:${r.followUp&&new Date(r.followUp)<new Date(TODAY)?"var(--red)":"var(--muted)"};cursor:text" onclick="bsInlineEdit('spoke','${r.id}','followUp','${r.followUp||""}','date')" title="Click to edit">${r.followUp||"—"}</td>
          <td><div style="display:flex;gap:4px">
            ${canSubmit("brands")?`<button class="btn btn-info btn-sm" onclick="openBrandSectionModal('spoke','${r.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="confirm2('Delete this record?',()=>deleteBrandSection('spoke','${r.id}'))">✕</button>`:""}
          </div></td>
        </tr>`).join("")}
        </tbody>
      </table></div>
      <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${rows.length} records</div>
    </div>
  </div>`);
}

// ── MONTHLY REPORTS – TRADESHOWS ──────────────────────────────
function pageBrandsMonthly(){
  if(!DB.brandsMonthly) DB.brandsMonthly=[];
  const search=(window._bmSearch)||"";
  const rows=DB.brandsMonthly.filter(r=>!search||
    (r.brandName||"").toLowerCase().includes(search.toLowerCase())||
    (r.contactName||"").toLowerCase().includes(search.toLowerCase())||
    (r.email||"").toLowerCase().includes(search.toLowerCase())||
    (r.notes||"").toLowerCase().includes(search.toLowerCase())
  );
  render(`<div>
    <div class="page-header">
      <div>
        <div class="page-title" style="display:flex;align-items:center;gap:10px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(167,139,250,.15);border-radius:8px;font-size:16px">📊</span>
          Monthly Reports – Tradeshows
        </div>
        <div class="page-sub">${DB.brandsMonthly.length} reports</div>
      </div>
      ${canSubmit("brands")?'<button class="btn btn-primary" onclick="openBrandSectionModal(\'monthly\')"}>+ Add Report</button>':""}
    </div>
    ${brandSectionTabs("monthly")}
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <input class="search-bar" placeholder="Search title, tradeshow, notes…" value="${search}"
        oninput="window._bmSearch=this.value;pageBrandsMonthly()" style="width:100%;max-width:360px">
    </div>
    ${(()=>{
      const _today=new Date(TODAY);
      const _soon=DB.brandsMonthly.filter(r=>{
        const fp=r.followUpPat?new Date(r.followUpPat):null;
        const fc=r.followUpCesar?new Date(r.followUpCesar):null;
        const diff=d=>d?Math.ceil((d-_today)/(1000*60*60*24)):99;
        return diff(fp)<=3||diff(fc)<=3;
      });
      if(!_soon.length) return "";
      return `<div style="background:rgba(247,201,79,.07);border:1px solid rgba(247,201,79,.2);border-radius:var(--r);padding:10px 14px;margin-bottom:1rem;display:flex;gap:10px;align-items:flex-start">
        <span style="font-size:16px">📅</span>
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--yellow);margin-bottom:4px">Follow-ups due soon (within 3 days)</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${_soon.map(r=>`<span style="font-size:12px;color:var(--text)">${r.brandName||"—"} <span style="color:var(--muted)">${r.followUpPat||r.followUpCesar}</span></span>`).join(" · ")}
          </div>
        </div>
      </div>`;
    })()}
    <div class="card" style="padding:0;overflow:hidden">
      <div class="tbl-wrap"><table>
        <thead><tr>
          <th>Brand Name</th><th>Contact Name</th><th>Job Title</th><th>Phone</th>
          <th>Email</th><th>Website</th><th>Notes</th>
          <th>Follow-Up (Pat)</th><th>Follow-Up (Cesar)</th><th></th>
        </tr></thead>
        <tbody>
        ${rows.length===0?`<tr><td colspan="10" style="text-align:center;padding:2.5rem;color:var(--muted)">No records yet</td></tr>`:""}
        ${rows.map(r=>`<tr>
          <td style="font-weight:600;cursor:text" onclick="bsInlineEdit('monthly','${r.id}','brandName','${(r.brandName||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.brandName||"—"}</td>
          <td style="font-size:12px;cursor:text" onclick="bsInlineEdit('monthly','${r.id}','contactName','${(r.contactName||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.contactName||"—"}</td>
          <td style="font-size:12px;color:var(--muted);cursor:text" onclick="bsInlineEdit('monthly','${r.id}','jobTitle','${(r.jobTitle||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.jobTitle||"—"}</td>
          <td style="font-size:12px;color:var(--muted);cursor:text" onclick="bsInlineEdit('monthly','${r.id}','phone','${(r.phone||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.phone||"—"}</td>
          <td style="font-size:12px;color:var(--muted);cursor:text" onclick="bsInlineEdit('monthly','${r.id}','email','${(r.email||"").replace(/'/g,"&#39;")}','email')" title="Click to edit">${r.email||"—"}</td>
          <td style="font-size:12px;cursor:text" onclick="bsInlineEdit('monthly','${r.id}','website','${(r.website||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.website?`<a href="${r.website.startsWith('http')?r.website:'https://'+r.website}" target="_blank" style="color:var(--accent);text-decoration:none" onclick="event.stopPropagation()">${r.website.replace(/^https?:\/\//,'').substring(0,25)}${r.website.replace(/^https?:\/\//,'').length>25?'…':''}</a>`:'—'}</td>
          <td style="font-size:12px;color:var(--muted);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:text" onclick="bsInlineEdit('monthly','${r.id}','notes','${(r.notes||"").replace(/'/g,"&#39;")}','text')" title="${r.notes||"Click to edit"}">${r.notes||"—"}</td>
          <td style="font-size:12px;color:${r.followUpPat&&new Date(r.followUpPat)<new Date(TODAY)?"var(--red)":"var(--muted)"};cursor:text" onclick="bsInlineEdit('monthly','${r.id}','followUpPat','${r.followUpPat||""}','date')" title="Click to edit">${r.followUpPat||"—"}</td>
          <td style="font-size:12px;color:${r.followUpCesar&&new Date(r.followUpCesar)<new Date(TODAY)?"var(--red)":"var(--muted)"};cursor:text" onclick="bsInlineEdit('monthly','${r.id}','followUpCesar','${r.followUpCesar||""}','date')" title="Click to edit">${r.followUpCesar||"—"}</td>
          <td><div style="display:flex;gap:4px">
            ${canSubmit("brands")?`<button class="btn btn-info btn-sm" onclick="openBrandSectionModal('monthly','${r.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="confirm2('Delete this report?',()=>deleteBrandSection('monthly','${r.id}'))">✕</button>`:""}
          </div></td>
        </tr>`).join("")}
        </tbody>
      </table></div>
      <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${rows.length} reports</div>
    </div>
  </div>`);
}

// ── TRADE SHOWS ───────────────────────────────────────────────
function pageBrandsTradeShows(){
  if(!DB.brandsTradeShows) DB.brandsTradeShows=[];
  const search=(window._btSearch)||"";
  const rows=DB.brandsTradeShows.filter(r=>!search||
    (r.name||"").toLowerCase().includes(search.toLowerCase())||
    (r.location||"").toLowerCase().includes(search.toLowerCase())||
    (r.notes||"").toLowerCase().includes(search.toLowerCase())
  );
  render(`<div>
    <div class="page-header">
      <div>
        <div class="page-title" style="display:flex;align-items:center;gap:10px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(167,139,250,.15);border-radius:8px;font-size:16px">🏪</span>
          Upcoming Trade Shows
        </div>
        <div class="page-sub">${DB.brandsTradeShows.length} upcoming trade shows</div>
      </div>
      ${canSubmit("brands")?'<button class="btn btn-primary" onclick="openBrandSectionModal(\'tradeshows\')"}>+ Add Upcoming Trade Show</button>':""}
    </div>
    ${brandSectionTabs("tradeshows")}
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <input class="search-bar" placeholder="Search trade show name, location…" value="${search}"
        oninput="window._btSearch=this.value;pageBrandsTradeShows()" style="width:100%;max-width:360px">
    </div>
    ${(()=>{
      const _today=new Date(TODAY);
      const _soon=DB.brandsTradeShows.filter(r=>{
        if(!r.dateStart) return false;
        const d=new Date(r.dateStart);
        const diff=Math.ceil((d-_today)/(1000*60*60*24));
        return diff>=0&&diff<=7;
      });
      if(!_soon.length) return "";
      return `<div style="background:rgba(247,201,79,.07);border:1px solid rgba(247,201,79,.2);border-radius:var(--r);padding:10px 14px;margin-bottom:1rem;display:flex;gap:10px;align-items:flex-start">
        <span style="font-size:16px">📅</span>
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--yellow);margin-bottom:4px">Upcoming trade shows within 7 days</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${_soon.map(r=>`<span style="font-size:12px;color:var(--text)">${r.name||"—"} <span style="color:var(--muted)">${r.dateStart}</span></span>`).join(" · ")}
          </div>
        </div>
      </div>`;
    })()}
    <div class="card" style="padding:0;overflow:hidden">
      <div class="tbl-wrap"><table>
        <thead><tr>
          <th>Trade Show Name</th><th>Location</th><th>Date</th>
          <th>Link</th><th>Status</th><th>Attendees</th><th>Event Overview</th><th></th>
        </tr></thead>
        <tbody>
        ${rows.length===0?`<tr><td colspan="8" style="text-align:center;padding:2.5rem;color:var(--muted)">No upcoming trade shows yet</td></tr>`:""}
        ${rows.map(r=>`<tr>
          <td style="font-weight:600;cursor:text" onclick="bsInlineEdit('tradeshows','${r.id}','name','${(r.name||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.name||"—"}</td>
          <td style="font-size:12px;color:var(--muted);cursor:text" onclick="bsInlineEdit('tradeshows','${r.id}','location','${(r.location||"").replace(/'/g,"&#39;")}','text')" title="Click to edit">${r.location||"—"}</td>
          <td style="font-size:12px;color:var(--muted);white-space:nowrap;cursor:text" onclick="bsInlineEdit('tradeshows','${r.id}','dateStart','${r.dateStart||""}','date')" title="Click to edit start date">${r.dateStart?r.dateStart+(r.dateEnd?" → "+r.dateEnd:""):"—"}</td>
          <td style="font-size:12px;cursor:text" onclick="bsInlineEdit('tradeshows','${r.id}','link','${(r.link||"").replace(/'/g,"&#39;")}','text')" title="Click to edit link">${r.link?`<a href="${r.link.startsWith('http')?r.link:'https://'+r.link}" target="_blank" style="color:var(--accent);text-decoration:none" onclick="event.stopPropagation()">🔗 View</a>`:'—'}</td>
          <td style="cursor:pointer" onclick="bsSelectEdit(this,'tradeshows','${r.id}','tsStatus','Pending,Booked,Not going,Considering')" title="Click to edit"><span class="badge" style="background:${r.tsStatus==='Booked'?'rgba(79,207,142,.15)':r.tsStatus==='Not going'?'rgba(247,92,92,.15)':'rgba(247,201,79,.15)'};color:${r.tsStatus==='Booked'?'var(--green)':r.tsStatus==='Not going'?'var(--red)':'var(--yellow)'};white-space:nowrap">${r.tsStatus||'Pending'}</span></td>
          <td style="font-size:12px">${(r.attendees&&r.attendees.length)?r.attendees.map(a=>`<span style="display:inline-block;background:rgba(99,102,241,.12);color:var(--accent);border-radius:4px;padding:1px 7px;font-size:11px;font-weight:600;margin:1px">${a}</span>`).join(""):'—'}</td>
          <td style="font-size:12px;color:var(--muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:text" onclick="bsInlineEdit('tradeshows','${r.id}','overview','${(r.overview||"").replace(/'/g,"&#39;")}','text')" title="${r.overview||"Click to edit"}">${r.overview||"—"}</td>
          <td><div style="display:flex;gap:4px">
            ${canSubmit("brands")?`<button class="btn btn-info btn-sm" onclick="openBrandSectionModal('tradeshows','${r.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="confirm2('Delete this record?',()=>deleteBrandSection('tradeshows','${r.id}'))">✕</button>`:""}
          </div></td>
        </tr>`).join("")}
        </tbody>
      </table></div>
      <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${rows.length} upcoming trade shows</div>
    </div>
  </div>`);
}

// ── SHARED MODAL + CRUD ───────────────────────────────────────
function openBrandSectionModal(section, id=null){
  const db = {future:"brandsFuture",spoke:"brandsSpoke",monthly:"brandsMonthly",tradeshows:"brandsTradeShows"}[section];
  if(!DB[db]) DB[db]=[];
  const rec = id ? DB[db].find(x=>x.id===id) : null;
  const isNew=!rec;

  const fields = {
    future: `
      ${mField("Brand Name","bs-brandName",rec?.brandName||"","text","",true)}
      ${mField("Contact Name","bs-contactName",rec?.contactName||"","text")}
      ${mField("Job Title","bs-jobTitle",rec?.jobTitle||"","text")}
      ${mField("Phone","bs-phone",rec?.phone||"","text")}
      ${mField("Email","bs-email",rec?.email||"","email")}
      ${mField("Brand Website","bs-website",rec?.website||"","text","https://")}
      ${(()=>{const brandUsers=DB.users?DB.users.filter(u=>u.role&&(u.role==="Brands"||u.role==="Brand CSR"||u.role==="Product Research"||u.role==="Manager"||u.role==="Head"||u.role==="Admin")):[];const opts=brandUsers.map(u=>u.name||u.username).join(",")||"Brands Team";return mField("Submitted By","bs-submittedBy",rec?.submittedBy||"","select",opts);})()}
      ${mField("Next Follow-Up","bs-followUp",rec?.followUp||"","date")}`,
    spoke: `
      ${mField("Date","bs-dateSpoken",rec?.dateSpoken||TODAY,"date","",true)}
      ${mField("Brand Name","bs-brandName",rec?.brandName||"","text","",true)}
      ${(()=>{const brandUsers=DB.users?DB.users.filter(u=>u.role&&(u.role==="Brands"||u.role==="Brand CSR"||u.role==="Product Research"||u.role==="Manager"||u.role==="Head"||u.role==="Admin")):[];const opts=brandUsers.map(u=>u.name||u.username).join(",")||"Brands Team";return mField("Zoom Meeting With","bs-zoomWith",rec?.zoomWith||"","select",opts);})()}
      ${mField("Contact Person","bs-contactPerson",rec?.contactPerson||rec?.contactName||"","text")}
      ${mField("Contact Number","bs-phone",rec?.phone||"","text")}
      ${mField("Job Title","bs-jobTitle",rec?.jobTitle||"","text")}
      ${mField("Status","bs-status",rec?.status||"Pending","select","Pending,Closed,Denied")}
      ${mField("Next Follow-Up","bs-followUp",rec?.followUp||"","date")}
      <div class="form-full">${mField("Follow-Up Notes","bs-followUpNotes",rec?.followUpNotes||rec?.notes||"","textarea")}</div>`,
    monthly: `
      ${mField("Brand Name","bs-brandName",rec?.brandName||"","text","",true)}
      ${mField("Contact Name","bs-contactName",rec?.contactName||"","text")}
      ${mField("Job Title","bs-jobTitle",rec?.jobTitle||"","text")}
      ${mField("Phone Number","bs-phone",rec?.phone||"","text")}
      ${mField("Email","bs-email",rec?.email||"","email")}
      ${mField("Brand Website","bs-website",rec?.website||"","text","https://")}
      <div class="form-full">${mField("Notes","bs-notes",rec?.notes||"","textarea")}</div>
      ${mField("Next Follow-Up Date (Patricia)","bs-followUpPat",rec?.followUpPat||"","date")}
      ${mField("Next Follow-Up Date (Cesar)","bs-followUpCesar",rec?.followUpCesar||"","date")}`,
    tradeshows: `
      ${mField("Trade Show Name","bs-name",rec?.name||"","text","",true)}
      ${mField("Location","bs-location",rec?.location||"","text")}
      ${mField("Date From","bs-dateStart",rec?.dateStart||"","date")}
      ${mField("Date To","bs-dateEnd",rec?.dateEnd||"","date")}
      ${mField("Status","bs-tsStatus",rec?.tsStatus||"Pending","select","Pending,Booked,Not going")}
      <div class="form-full">
        <label style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:6px">Attendees</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px 0">
          ${["Mario","Jose","Cesar","Louie"].map(name=>`
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;padding:6px 12px;border:1.5px solid ${(rec?.attendees||[]).includes(name)?"var(--accent)":"var(--border)"};border-radius:6px;background:${(rec?.attendees||[]).includes(name)?"rgba(99,102,241,.08)":"transparent"};transition:.15s" onclick="this.classList.toggle('ts-att-active');this.querySelector('input').checked=!this.querySelector('input').checked;this.style.borderColor=this.querySelector('input').checked?'var(--accent)':'var(--border)';this.style.background=this.querySelector('input').checked?'rgba(99,102,241,.08)':'transparent'">
              <input type="checkbox" id="att-${name}" name="bs-attendee" value="${name}" ${(rec?.attendees||[]).includes(name)?"checked":""} style="display:none">
              ${name}
            </label>`).join("")}
        </div>
      </div>
      <div class="form-full">${mField("Link","bs-link",rec?.link||"","text","https://")}</div>
      <div class="form-full">${mField("Event Overview","bs-overview",rec?.overview||"","textarea")}</div>`,
  }[section]||"";

  const titles={future:"Future Attempt",spoke:"Brand We've Spoken To",monthly:"Monthly Report",tradeshows:"Upcoming Trade Show"};
  openModal(`${mHeader((isNew?"Add ":"Edit ")+titles[section])}
  <div class="modal-body"><div class="form-grid">${fields}</div></div>
  ${mFooter(`saveBrandSection('${section}','${id||""}')`,id?`confirm2('Delete?',()=>deleteBrandSection('${section}','${id}'))`:"")}`);
}

function saveBrandSection(section, id){
  const db={future:"brandsFuture",spoke:"brandsSpoke",monthly:"brandsMonthly",tradeshows:"brandsTradeShows"}[section];
  if(!DB[db]) DB[db]=[];
  const get=n=>(document.getElementById(n)||document.querySelector(`[name="${n}"]`))?.value?.trim()||"";

  let rec = id ? DB[db].find(x=>x.id===id) : null;
  if(!rec){
    rec={id:uid("BRS"),addedBy:currentUser?.name||currentUser?.username||"",date:TODAY};
    DB[db].push(rec);
  }

  // Common fields
  rec.notes=get("bs-notes");

  if(section==="future"){
    if(!get("bs-brandName")) return showToast("Brand Name is required","var(--red)");
    rec.brandName=get("bs-brandName"); rec.contactName=get("bs-contactName");
    rec.jobTitle=get("bs-jobTitle"); rec.phone=get("bs-phone");
    rec.email=get("bs-email"); rec.website=get("bs-website");
    rec.submittedBy=get("bs-submittedBy"); rec.followUp=get("bs-followUp");
  } else if(section==="spoke"){
    if(!get("bs-brandName")) return showToast("Brand Name is required","var(--red)");
    rec.brandName=get("bs-brandName"); rec.dateSpoken=get("bs-dateSpoken");
    rec.zoomWith=get("bs-zoomWith"); rec.contactPerson=get("bs-contactPerson");
    rec.phone=get("bs-phone"); rec.jobTitle=get("bs-jobTitle");
    rec.status=get("bs-status")||"Pending"; rec.followUp=get("bs-followUp");
    rec.followUpNotes=get("bs-followUpNotes");
  } else if(section==="monthly"){
    if(!get("bs-brandName")) return showToast("Brand Name is required","var(--red)");
    rec.brandName=get("bs-brandName"); rec.contactName=get("bs-contactName");
    rec.jobTitle=get("bs-jobTitle"); rec.phone=get("bs-phone");
    rec.email=get("bs-email"); rec.website=get("bs-website");
    rec.followUpPat=get("bs-followUpPat"); rec.followUpCesar=get("bs-followUpCesar");
  } else if(section==="tradeshows"){
    if(!get("bs-name")) return showToast("Trade Show Name is required","var(--red)");
    rec.name=get("bs-name"); rec.location=get("bs-location");
    rec.dateStart=get("bs-dateStart"); rec.dateEnd=get("bs-dateEnd");
    rec.tsStatus=get("bs-tsStatus")||"Pending";
    rec.attendees=[...document.querySelectorAll('input[name="bs-attendee"]:checked')].map(cb=>cb.value);
    rec.link=get("bs-link"); rec.overview=get("bs-overview");
  }

  saveToLocalStorage();
  closeModal();
  showToast(id?"Record updated":"Record added","var(--green)");
  const fn={future:pageBrandsFuture,spoke:pageBrandsSpoke,monthly:pageBrandsMonthly,tradeshows:pageBrandsTradeShows}[section];
  if(fn) fn();
}

function saveBSField(section, id, field, value){
  const db={future:"brandsFuture",spoke:"brandsSpoke",monthly:"brandsMonthly",tradeshows:"brandsTradeShows"}[section];
  if(!DB[db]) return;
  const rec=DB[db].find(x=>x.id===id);
  if(!rec) return;
  rec[field]=value;
  saveToLocalStorage();
}

// ── INLINE EDIT FOR BRAND SUB-TABS ───────────────────────────
function bsInlineEdit(section, id){
  const db={future:"brandsFuture",spoke:"brandsSpoke",monthly:"brandsMonthly",tradeshows:"brandsTradeShows"}[section];
  if(!DB[db]) return;
  const rec=DB[db].find(x=>x.id===id);
  if(!rec) return;

  const row=document.querySelector(`tr[data-bs-id="${id}"]`);
  if(!row) return;

  // Build editable cells per section
  let cells="";
  const inp=(val,field,type="text",w="100%")=>`<input data-field="${field}" type="${type}" value="${(val||"").toString().replace(/"/g,'&quot;')}" style="width:${w};background:var(--input-bg,#1a2235);border:1.5px solid var(--accent);border-radius:5px;color:var(--text);padding:4px 7px;font-size:12px;outline:none">`;
  const sel=(val,field,opts)=>`<select data-field="${field}" style="width:100%;background:var(--input-bg,#1a2235);border:1.5px solid var(--accent);border-radius:5px;color:var(--text);padding:4px 7px;font-size:12px;outline:none">${opts.map(o=>`<option value="${o}"${val===o?" selected":""}>${o}</option>`).join("")}</select>`;

  if(section==="future"){
    const brandUsers=DB.users?DB.users.filter(u=>u.role&&["Brands","Brand CSR","Product Research","Manager","Head","Admin"].includes(u.role)).map(u=>u.name||u.username):["Brands Team"];
    cells=`
      <td>${inp(rec.brandName,"brandName","text","130px")}</td>
      <td>${inp(rec.contactName,"contactName","text","110px")}</td>
      <td>${inp(rec.jobTitle,"jobTitle","text","100px")}</td>
      <td>${inp(rec.phone,"phone","text","100px")}</td>
      <td>${inp(rec.email,"email","email","140px")}</td>
      <td>${inp(rec.website,"website","text","120px")}</td>
      <td>${sel(rec.submittedBy||"","submittedBy",[""].concat(brandUsers))}</td>
      <td>${inp(rec.followUp,"followUp","date","120px")}</td>
      <td style="font-size:11px;color:var(--dim)">${rec.date||"—"}</td>`;
  } else if(section==="spoke"){
    const brandUsers=DB.users?DB.users.filter(u=>u.role&&["Brands","Brand CSR","Product Research","Manager","Head","Admin"].includes(u.role)).map(u=>u.name||u.username):["Brands Team"];
    cells=`
      <td>${inp(rec.dateSpoken||rec.date,"dateSpoken","date","110px")}</td>
      <td>${inp(rec.brandName,"brandName","text","120px")}</td>
      <td>${sel(rec.zoomWith||"","zoomWith",[""].concat(brandUsers))}</td>
      <td>${inp(rec.contactPerson||rec.contactName,"contactPerson","text","110px")}</td>
      <td>${inp(rec.phone,"phone","text","100px")}</td>
      <td>${inp(rec.jobTitle,"jobTitle","text","100px")}</td>
      <td>${inp(rec.followUpNotes||rec.notes,"followUpNotes","text","140px")}</td>
      <td>${sel(rec.status||"Pending","status",["Pending","Closed","Denied"])}</td>
      <td>${inp(rec.followUp,"followUp","date","110px")}</td>`;
  } else if(section==="monthly"){
    cells=`
      <td>${inp(rec.brandName,"brandName","text","120px")}</td>
      <td>${inp(rec.contactName,"contactName","text","110px")}</td>
      <td>${inp(rec.jobTitle,"jobTitle","text","100px")}</td>
      <td>${inp(rec.phone,"phone","text","100px")}</td>
      <td>${inp(rec.email,"email","email","140px")}</td>
      <td>${inp(rec.website,"website","text","110px")}</td>
      <td>${inp(rec.notes,"notes","text","140px")}</td>
      <td>${inp(rec.followUpPat,"followUpPat","date","110px")}</td>
      <td>${inp(rec.followUpCesar,"followUpCesar","date","110px")}</td>`;
  } else if(section==="tradeshows"){
    cells=`
      <td>${inp(rec.name,"name","text","130px")}</td>
      <td>${inp(rec.location,"location","text","110px")}</td>
      <td style="white-space:nowrap">${inp(rec.dateStart,"dateStart","date","110px")} → ${inp(rec.dateEnd,"dateEnd","date","110px")}</td>
      <td>${inp(rec.link,"link","text","120px")}</td>
      <td>${inp(rec.overview,"overview","text","150px")}</td>
      <td>${sel(rec.status||"Pending","status",["Pending","Booked","Not Going"])}</td>
      <td style="min-width:160px">
        ${["Mario","Jose","Cesar","Louie"].map(name=>`<label style="display:inline-flex;align-items:center;gap:4px;margin:2px 4px 2px 0;cursor:pointer;font-size:12px"><input type="checkbox" data-att="${name}" ${(rec.attendees||[]).includes(name)?"checked":""}> ${name}</label>`).join("")}
      </td>`;
  }

  const saveBtns=`<td><div style="display:flex;gap:4px;flex-wrap:nowrap">
    <button class="btn btn-primary btn-sm" onclick="bsInlineSave('${section}','${id}')">💾 Save</button>
    <button class="btn btn-sm" style="background:var(--border)" onclick="bsInlineCancel('${section}')">Cancel</button>
  </div></td>`;

  row.innerHTML=cells+saveBtns;
  row.style.background="rgba(99,102,241,.06)";
}

function bsInlineSave(section, id){
  const db={future:"brandsFuture",spoke:"brandsSpoke",monthly:"brandsMonthly",tradeshows:"brandsTradeShows"}[section];
  if(!DB[db]) return;
  const rec=DB[db].find(x=>x.id===id);
  if(!rec) return;
  const row=document.querySelector(`tr[data-bs-id="${id}"]`);
  if(!row) return;

  // Read all inputs/selects in the row
  row.querySelectorAll("[data-field]").forEach(el=>{
    rec[el.dataset.field]=el.value.trim();
  });

  // Attendees checkboxes (tradeshows only)
  if(section==="tradeshows"){
    rec.attendees=[...row.querySelectorAll("[data-att]:checked")].map(cb=>cb.dataset.att);
  }

  saveToLocalStorage();
  showToast("Saved","var(--green)");
  const fn={future:pageBrandsFuture,spoke:pageBrandsSpoke,monthly:pageBrandsMonthly,tradeshows:pageBrandsTradeShows}[section];
  if(fn) fn();
}

function bsInlineCancel(section){
  const fn={future:pageBrandsFuture,spoke:pageBrandsSpoke,monthly:pageBrandsMonthly,tradeshows:pageBrandsTradeShows}[section];
  if(fn) fn();
}


// ── BRAND SECTION SELECT EDIT (avoids quote-nesting in onclick) ──
function bsSelectEdit(td, section, id, field, optsStr){
  if(!canSubmit("brands")) return;
  const db={future:"brandsFuture",spoke:"brandsSpoke",monthly:"brandsMonthly",tradeshows:"brandsTradeShows"}[section];
  const rec=DB[db]?.find(x=>x.id===id);
  if(!rec) return;
  const prev=td.innerHTML;
  const currentVal=rec[field]||"";
  const select=document.createElement("select");
  select.className="form-input";
  select.style.cssText="font-size:12px;padding:2px 6px;min-width:110px;height:30px";
  optsStr.split(",").forEach(o=>{
    const op=document.createElement("option");
    op.value=o.trim(); op.textContent=o.trim();
    if(currentVal===o.trim()) op.selected=true;
    select.appendChild(op);
  });
  td.innerHTML="";
  td.appendChild(select);
  select.focus();
  select.addEventListener("change",()=>{
    rec[field]=select.value;
    saveToLocalStorage();
    const fn={future:pageBrandsFuture,spoke:pageBrandsSpoke,monthly:pageBrandsMonthly,tradeshows:pageBrandsTradeShows}[section];
    if(fn) fn();
  });
  select.addEventListener("keydown",e=>{ if(e.key==="Escape"){td.innerHTML=prev;} });
}

// ── BRAND SECTION INLINE CELL EDIT ───────────────────────────
function bsInlineEdit(section, id, field, currentVal, type, opts){
  if(!canSubmit("brands")) return;
  const db={future:"brandsFuture",spoke:"brandsSpoke",monthly:"brandsMonthly",tradeshows:"brandsTradeShows"}[section];
  const rec=DB[db]?.find(x=>x.id===id);
  if(!rec) return;
  // find the td being clicked
  const td=event.target.closest('td');
  if(!td) return;
  const prev=td.innerHTML;
  let input;
  if(type==="select"){
    input=document.createElement("select");
    input.className="form-input";
    input.style.cssText="font-size:12px;padding:2px 6px;min-width:90px;height:28px";
    opts.split(",").forEach(o=>{
      const op=document.createElement("option");
      op.value=o.trim(); op.textContent=o.trim();
      if(currentVal===o.trim()) op.selected=true;
      input.appendChild(op);
    });
  } else if(type==="date"){
    input=document.createElement("input");
    input.type="date"; input.value=currentVal||"";
    input.className="form-input";
    input.style.cssText="font-size:12px;padding:2px 6px;width:130px;height:28px";
  } else {
    input=document.createElement("input");
    input.type=type||"text"; input.value=currentVal||"";
    input.className="form-input";
    input.style.cssText="font-size:12px;padding:2px 6px;min-width:100px;height:28px";
  }
  td.innerHTML="";
  td.appendChild(input);
  input.focus();
  const save=()=>{
    const v=input.value.trim();
    rec[field]=v;
    saveToLocalStorage();
    const fn={future:pageBrandsFuture,spoke:pageBrandsSpoke,monthly:pageBrandsMonthly,tradeshows:pageBrandsTradeShows}[section];
    if(fn) fn();
  };
  if(type==="select"){
    input.addEventListener("change", save);
    input.addEventListener("keydown", e=>{ if(e.key==="Escape"){td.innerHTML=prev;} });
  } else {
    input.addEventListener("blur", save);
    input.addEventListener("keydown", e=>{ if(e.key==="Enter"){e.preventDefault();input.blur();} if(e.key==="Escape"){td.innerHTML=prev;} });
  }
}
function brandInlineEdit(id, field, currentVal, typeAndOpts){
  if(!canSubmit("brands")) return;
  const rec = DB.brands.find(x=>x.id===id);
  if(!rec) return;
  const td = event.target.closest('td');
  if(!td) return;
  const prev = td.innerHTML;
  const parts = (typeAndOpts||"text").split(",");
  const type = parts[0];
  const opts = parts.slice(1);
  let input;
  if(type==="select"){
    input=document.createElement("select");
    input.className="form-input";
    input.style.cssText="font-size:12px;padding:2px 6px;min-width:100px;height:28px";
    opts.forEach(o=>{
      const op=document.createElement("option");
      op.value=o.trim(); op.textContent=o.trim();
      if(currentVal===o.trim()) op.selected=true;
      input.appendChild(op);
    });
  } else if(type==="date"){
    input=document.createElement("input");
    input.type="date"; input.value=currentVal||"";
    input.className="form-input";
    input.style.cssText="font-size:12px;padding:2px 6px;width:130px;height:28px";
  } else if(type==="number"){
    input=document.createElement("input");
    input.type="number"; input.value=currentVal||"";
    input.className="form-input";
    input.style.cssText="font-size:12px;padding:2px 6px;min-width:100px;height:28px";
  } else {
    input=document.createElement("input");
    input.type="text"; input.value=currentVal||"";
    input.className="form-input";
    input.style.cssText="font-size:12px;padding:2px 6px;min-width:120px;height:28px";
  }
  td.innerHTML="";
  td.appendChild(input);
  input.focus();
  const numFields=["totalUPCs","amazonInStockRate","topSellerPct","totalSellers","primarySubcategoryRevenue","subcategoryMonthlyRevenue","topCompetitorRevenue","marketShare","competitorMarketShare","brandSearchTerms","competitorSearchTerms","productsWithAds","competitorProductsWithAds","estAdSpend","competitorAdSpend","topProductRevenue","topCompetingProductRevenue"];
  const save=()=>{
    const v=input.value.trim();
    rec[field]=numFields.includes(field)?Number(v)||0:v;
    saveToLocalStorage();
    pageBrands();
  };
  if(type==="select"){
    input.addEventListener("change", save);
    input.addEventListener("keydown", e=>{ if(e.key==="Escape"){td.innerHTML=prev;} });
  } else {
    input.addEventListener("blur", save);
    input.addEventListener("keydown", e=>{ if(e.key==="Enter"){e.preventDefault();input.blur();} if(e.key==="Escape"){td.innerHTML=prev;} });
  }
}

function deleteBrandSection(section, id){
  const db={future:"brandsFuture",spoke:"brandsSpoke",monthly:"brandsMonthly",tradeshows:"brandsTradeShows"}[section];
  if(!DB[db]) return;
  DB[db]=DB[db].filter(x=>x.id!==id);
  saveToLocalStorage();
  showToast("Deleted","var(--green)");
  const fn={future:pageBrandsFuture,spoke:pageBrandsSpoke,monthly:pageBrandsMonthly,tradeshows:pageBrandsTradeShows}[section];
  if(fn) fn();
}

function renderBrandTable(rows){
  if(!rows.length) return `<div class="card" style="text-align:center;padding:3rem;color:var(--muted)">No brands match your search.</div>`;
  return `
  <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r2);overflow:hidden">
    <div style="overflow-x:auto">
      <table style="width:max-content;min-width:100%">
        <thead>
          <tr style="position:sticky;top:0;z-index:2;background:#0d1b3e">
            ${BRAND_COLS.map(c=>`<th style="min-width:${c.w}px;white-space:nowrap">${c.label}</th>`).join("")}
            <th style="min-width:80px"></th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(b=>`<tr>
            ${BRAND_COLS.map(c=>{
              const v=b[c.key];
              const itype=c.num||c.currency||c.pct?"number":c.key==="email"?"email":c.key==="followUpPat"||c.key==="followUpCesar"||c.key==="submissionDate"?"date":"text";
              const editAttr=`onclick="event.stopPropagation();brandInlineEdit('${b.id}','${c.key}','${String(v||"").replace(/'/g,"&#39;").replace(/"/g,"&quot;")}','${itype}${c.key==="status"?",Approved,Pending,Declined":""}')" style="cursor:text" title="Click to edit"`;
              const statusEditAttr=`onclick="event.stopPropagation();brandInlineEdit('${b.id}','${c.key}','${v||""}','select,Approved,Pending,Declined')" style="cursor:pointer" title="Click to change status"`;
              if(v===undefined||v===null||v==="") return `<td ${editAttr} class="text-muted">—</td>`;
              if(c.key==="status") return `<td ${statusEditAttr}>${brandStatusBadge(v)}</td>`;
              if(c.currency) return `<td ${editAttr} class="fw6" style="color:var(--green)">$${Number(v).toLocaleString()}</td>`;
              if(c.pct) return `<td ${editAttr} style="color:var(--accent);font-weight:500">${Number(v).toFixed(1)}%</td>`;
              if(c.num) return `<td ${editAttr} class="text-muted">${Number(v).toLocaleString()}</td>`;
              if(c.bold) return `<td ${editAttr} class="fw7" style="color:var(--text)">${v}</td>`;
              if(c.key==="email") return `<td ${editAttr} style="font-size:12px;color:var(--muted)">${v}</td>`;
              if(c.key==="website") return `<td ${editAttr} style="font-size:12px"><a href="https://${v}" target="_blank" style="color:var(--accent);text-decoration:none" onclick="event.stopPropagation()">${v}</a></td>`;
              if(c.key==="followUpPat"||c.key==="followUpCesar"){
                const d=new Date(v),today=new Date(TODAY);
                const diff=Math.ceil((d-today)/(1000*60*60*24));
                const col=diff<0?"var(--red)":diff<=3?"var(--yellow)":"var(--text)";
                return `<td ${editAttr} style="color:${col};font-weight:${diff<=3?"600":"400"}">${v}${diff<=3&&diff>=0?` <span style="font-size:10px">(${diff}d)</span>`:""}</td>`;
              }
              if(c.key==="notes") return `<td ${editAttr} style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--muted)" title="${v}">${v}</td>`;
              return `<td ${editAttr} style="font-size:13px">${v}</td>`;
            }).join("")}
            <td onclick="event.stopPropagation()">
              <div style="display:flex;gap:4px">
                <button class="btn btn-ghost btn-sm" onclick="window._brandView='detail';window._brandSelected='${b.id}';pageBrands()">View</button>
                <button class="btn btn-primary btn-sm" onclick="generateBrandReport('${b.id}')">📄</button>
                <button class="btn btn-info btn-sm" onclick="openBrandModal(DB.brands.find(x=>x.id==='${b.id}'))">Edit</button>
              </div>
            </td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">
      ${rows.length} brand${rows.length!==1?"s":""} · Scroll horizontally to see all ${BRAND_COLS.length} columns
    </div>
  </div>`;
}

function renderBrandCards(rows){
  if(!rows.length) return `<div class="card" style="text-align:center;padding:3rem;color:var(--muted)">No brands match your search.</div>`;
  const colors=["var(--accent)","var(--purple)","var(--teal)","var(--orange)","var(--green)","var(--yellow)"];
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px">
    ${rows.map((b,i)=>{
      const col=colors[i%colors.length];
      const today=new Date(TODAY);
      const fpDiff=b.followUpPat?Math.ceil((new Date(b.followUpPat)-today)/(864e5)):null;
      const fcDiff=b.followUpCesar?Math.ceil((new Date(b.followUpCesar)-today)/(864e5)):null;
      const followAlert=(fpDiff!==null&&fpDiff<=3)||(fcDiff!==null&&fcDiff<=3);
      return `
      <div class="card" style="cursor:pointer;border-top:3px solid ${col};transition:border-color .2s" onclick="window._brandView='detail';window._brandSelected='${b.id}';pageBrands()" onmouseover="this.style.borderColor=getComputedStyle(document.documentElement).getPropertyValue('--accent')" onmouseout="this.style.borderTopColor='${col}'">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <div>
            <div style="font-size:16px;font-weight:700">${b.brandName}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px">${b.primarySubcategory}</div>
            <div style="font-size:11px;color:var(--dim);margin-top:1px">${b.submissionId} · ${b.submissionDate}</div>
          </div>
          <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:6px">
            ${brandStatusBadge(b.status||"Pending")}
            <div style="font-size:18px;font-weight:700;color:${col}">${b.marketShare}%</div>
            <div style="font-size:10px;color:var(--muted)">Market Share</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="background:rgba(255,255,255,.04);border-radius:6px;padding:8px">
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">Subcat Revenue</div>
            <div style="font-size:14px;font-weight:700;color:var(--green)">$${(b.subcategoryMonthlyRevenue/1000).toFixed(0)}K</div>
          </div>
          <div style="background:rgba(255,255,255,.04);border-radius:6px;padding:8px">
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">Est. Ad Spend</div>
            <div style="font-size:14px;font-weight:700;color:var(--yellow)">$${(b.estAdSpend/1000).toFixed(1)}K</div>
          </div>
          <div style="background:rgba(255,255,255,.04);border-radius:6px;padding:8px">
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">Top Product Rev</div>
            <div style="font-size:14px;font-weight:700;color:var(--accent)">$${(b.topProductRevenue/1000).toFixed(0)}K</div>
          </div>
          <div style="background:rgba(255,255,255,.04);border-radius:6px;padding:8px">
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">In-Stock Rate</div>
            <div style="font-size:14px;font-weight:700;color:${b.amazonInStockRate>=90?"var(--green)":b.amazonInStockRate>=75?"var(--yellow)":"var(--red)"}">${b.amazonInStockRate}%</div>
          </div>
        </div>

        <div style="font-size:12px;color:var(--muted);border-top:1px solid var(--border);padding-top:10px;display:flex;flex-direction:column;gap:4px">
          <div style="display:flex;justify-content:space-between"><span>Contact</span><span style="color:var(--text)">${b.contactName} · ${b.jobTitle}</span></div>
          <div style="display:flex;justify-content:space-between"><span>Submitted by</span><span style="color:var(--text)">${b.submittedBy}</span></div>
          <div style="display:flex;justify-content:space-between"><span>Top Seller</span><span style="color:var(--text);text-align:right;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.topSeller||"—"}</span></div>
          ${followAlert?`<div style="margin-top:4px;color:var(--yellow);font-size:11px;font-weight:600">📅 Follow-up due soon</div>`:""}
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function renderBrandDetail(id){
  const b=DB.brands.find(x=>x.id===id);
  if(!b){window._brandView="table";return pageBrands();}

  const sections=[
    {title:"Contact Information",icon:"👤",fields:[
      ["Contact Name",b.contactName],["Job Title",b.jobTitle],["Phone",b.phone],
      ["Email",b.email],["Brand Website",b.website?`<a href="https://${b.website}" target="_blank" style="color:var(--accent)">${b.website} ↗</a>`:"—"],
    ]},
    {title:"Market Data",icon:"📊",fields:[
      ["Primary Subcategory",b.primarySubcategory],
      ["Subcategory Monthly Revenue",b.subcategoryMonthlyRevenue?"$"+Number(b.subcategoryMonthlyRevenue).toLocaleString():"—"],
      ["Market Share",b.marketShare?b.marketShare+"%":"—"],
      ["Total # of Sellers",b.totalSellers||"—"],
      ["Top Competing Brands",b.topCompetingBrands||"—"],
      ["Top Competitor Revenue",b.topCompetitorRevenue?"$"+Number(b.topCompetitorRevenue).toLocaleString():"—"],
      ["Amazon In-Stock Rate",b.amazonInStockRate?b.amazonInStockRate+"%":"—"],
    ]},
    {title:"Keywords",icon:"🔍",fields:[
      ["Brand Keyword",b.brandKeyword||"—"],
      ["Competitor Keyword",b.competitorKeyword||"—"],
    ]},
    {title:"Product & Revenue",icon:"💰",fields:[
      ["Products with Ads",b.productsWithAds||"—"],
      ["Top Product Revenue",b.topProductRevenue?"$"+Number(b.topProductRevenue).toLocaleString():"—"],
      ["Top Competing Product Revenue",b.topCompetingProductRevenue?"$"+Number(b.topCompetingProductRevenue).toLocaleString():"—"],
      ["Top Seller",b.topSeller||"—"],
      ["Total UPCs",b.totalUPCs||"—"],
      ["Est. Ad Spend",b.estAdSpend?"$"+Number(b.estAdSpend).toLocaleString():"—"],
    ]},
    {title:"Submission & Follow-Up",icon:"📋",fields:[
      ["Status",brandStatusBadge(b.status||"Pending")],
      ["Submission ID",b.submissionId||"—"],
      ["Submission Date",b.submissionDate||"—"],
      ["Submitted By",b.submittedBy||"—"],
      ["Next Follow-Up (Pat)",b.followUpPat||"—"],
      ["Next Follow-Up (Cesar)",b.followUpCesar||"—"],
    ]},
  ];

  render(`
  <div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.5rem;flex-wrap:wrap">
      <button class="btn btn-ghost btn-sm" onclick="window._brandView='table';pageBrands()">← Back to Brands</button>
      <div class="page-title">${b.brandName}</div>
      <span style="font-size:12px;color:var(--muted);background:rgba(167,139,250,.1);border-radius:20px;padding:3px 10px">${b.primarySubcategory}</span>
      <span class="mono text-muted" style="font-size:11px">${b.submissionId}</span>
      ${brandStatusBadge(b.status||"Pending")}
      <div style="display:flex;align-items:center;gap:6px;margin-left:4px">
        <span style="font-size:11px;color:var(--muted)">Change:</span>
        <select onchange="changeBrandStatus('${b.id}',this.value)" style="background:#091329;border:1px solid var(--border2);border-radius:6px;padding:4px 8px;color:var(--text);font-size:12px;font-family:var(--font);cursor:pointer;outline:none">
          ${["Approved","Pending","Declined"].map(s=>`<option value="${s}"${b.status===s?" selected":""}>${s}</option>`).join("")}
        </select>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="generateBrandReport('${b.id}')">📄 Generate Report</button>
        <button class="btn btn-ghost btn-sm" onclick="openBrandModal(DB.brands.find(x=>x.id==='${b.id}'))">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="confirm2('Delete this brand submission?',()=>{DB.brands=DB.brands.filter(x=>x.id!=='${b.id}');window._brandView='table';pageBrands()})">Delete</button>
      </div>
    </div>

    <!-- KPI row -->
    <div class="metrics metrics-4" style="margin-bottom:1.25rem">
      ${metric("Market Share",(b.marketShare||0)+"%","","var(--purple)")}
      ${metric("Subcat Revenue","$"+(Number(b.subcategoryMonthlyRevenue||0)/1000).toFixed(0)+"K","Monthly","var(--green)")}
      ${metric("In-Stock Rate",(b.amazonInStockRate||0)+"%","",b.amazonInStockRate>=90?"var(--green)":b.amazonInStockRate>=75?"var(--yellow)":"var(--red)")}
      ${metric("Est. Ad Spend","$"+(Number(b.estAdSpend||0)/1000).toFixed(1)+"K","Monthly","var(--yellow)")}
    </div>

    ${b.notes?`<div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:var(--r);padding:12px 14px;margin-bottom:1.25rem;font-size:13px;color:var(--muted);line-height:1.6"><strong style="color:var(--text)">Notes:</strong> ${b.notes}</div>`:""}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${sections.map(sec=>`
      <div class="card">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:16px">${sec.icon}</span>
          <div class="card-title" style="margin:0">${sec.title}</div>
        </div>
        ${sec.fields.map(([k,v])=>`
        <div style="display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:12px;color:var(--muted);flex-shrink:0">${k}</span>
          <span style="font-size:12px;text-align:right;color:var(--text);word-break:break-word">${v}</span>
        </div>`).join("")}
      </div>`).join("")}
    </div>
  </div>`);
}

function generateBrandReport(id){
  const b = DB.brands.find(x=>x.id===id);
  if(!b){ showToast("Brand not found","var(--red)"); return; }

  const fmtFull = n => n ? Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : "0.00";
  const fmtM = n => { const v=Number(n)||0; if(v>=1000000) return (v/1000000).toFixed(1)+"M"; if(v>=1000) return (v/1000).toFixed(0)+"K"; return v.toFixed(0); };
  const fmtK = n => { const v=Number(n)||0; if(v>=1000) return (v/1000).toFixed(0)+"K"; return v.toFixed(0); };

  const brand        = b.brandName||"—";
  const category     = b.primarySubcategory||"—";
  const upcs         = b.totalUPCs||"—";
  const inStock      = Number(b.amazonInStockRate)||0;
  const outStock     = 100 - inStock;
  const inStockDesc  = (function(){
    if(inStock === 0)        return "Amazon itself (1P/direct vendor) is not selling any of "+brand+"'s catalog on Amazon. This means there is no Amazon-direct competition on your own listings — but also no Amazon-backed Buy Box or Prime fulfillment presence supporting demand capture.";
    if(inStock <= 20)        return "Amazon itself (1P/direct vendor) has a minimal presence in "+brand+"'s catalog. This means Amazon is not a consistent direct competitor on your own listings — but also indicates limited Amazon-backed Buy Box ownership and Prime fulfillment support, reducing its ability to capture demand.";
    if(inStock <= 40)        return "Amazon itself (1P/direct vendor) has a moderate presence in "+brand+"'s catalog. Some listings may be supported by Amazon-backed Buy Box ownership and Prime fulfillment, allowing for partial demand capture, but competition on your own listings remains limited.";
    if(inStock <= 60)        return "Amazon itself (1P/direct vendor) has a significant presence in "+brand+"'s catalog. Many listings benefit from Amazon-backed Buy Box ownership and Prime fulfillment, resulting in improved visibility and stronger demand capture, with noticeable competition on your own listings.";
    if(inStock <= 80)        return "Amazon itself (1P/direct vendor) has a strong presence in "+brand+"'s catalog. Most listings are supported by Amazon-backed Buy Box ownership and Prime fulfillment, giving high visibility and substantial demand capture, and competition with Amazon is high.";
    if(inStock < 100)        return "Amazon itself (1P/direct vendor) has a near-full presence in "+brand+"'s catalog. Almost all listings are supported by Amazon-backed Buy Box ownership and Prime fulfillment, resulting in maximum visibility and demand capture, with intense competition across your own listings.";
    return "Amazon itself (1P/direct vendor) has a full presence in "+brand+"'s catalog. All listings are backed by Amazon's Buy Box ownership and Prime fulfillment, providing complete visibility and maximum demand capture — but also full competition with Amazon on every listing.";
  })();
  const inStockLabel = (function(){
    if(inStock === 0)   return "0% – No Presence";
    if(inStock <= 20)   return inStock+"% – Minimal Presence";
    if(inStock <= 40)   return inStock+"% – Moderate Presence";
    if(inStock <= 60)   return inStock+"% – Significant Presence";
    if(inStock <= 80)   return inStock+"% – Strong Presence";
    if(inStock < 100)   return inStock+"% – Near-Full Presence";
    return "100% – Full Presence";
  })();
  const sellers      = b.totalSellers||"—";
  const keywords     = (b.brandSearchTerms!=null && b.brandSearchTerms!=="") ? b.brandSearchTerms : (b.brandKeyword||"—");
  const compKw       = (b.competitorSearchTerms!=null && b.competitorSearchTerms!=="") ? b.competitorSearchTerms : (b.competitorKeyword||"—");
  const revenue      = Number(b.subcategoryMonthlyRevenue)||0;
  const revenueK     = fmtK(revenue);
  const revenueFmt   = fmtFull(revenue);
  const mktShare     = b.marketShare||0;
  const topComp      = b.topCompetingBrands||"Competitor";
  const compRev      = Number(b.topCompetitorRevenue)||0;
  const compRevFmt   = fmtFull(compRev);
  const compMktShare = b.competitorMarketShare ? Number(b.competitorMarketShare).toFixed(1) : (revenue>0&&compRev>0) ? ((compRev/(revenue/mktShare*100))*100).toFixed(1) : "—";
  const ads          = b.productsWithAds||"—";
  const compAds      = b.competitorProductsWithAds||"—";
  const adSpend      = Number(b.estAdSpend)||0;
  const adSpendK     = fmtK(adSpend);
  const adSpendFmt   = fmtFull(adSpend);
  const compAdFmt    = b.competitorAdSpend ? fmtFull(Number(b.competitorAdSpend)) : "—";
  const primarySubRev = Number(b.primarySubcategoryRevenue)||0;
  const totalCat     = "$"+(primarySubRev||revenue).toLocaleString("en-US",{maximumFractionDigits:0});
  const topProdFmt   = fmtFull(Number(b.topProductRevenue)||0);
  const compProdFmt  = fmtFull(Number(b.topCompetingProductRevenue)||0);
  const topSeller    = b.topSeller||topComp;
  const topSellerPct = b.topSellerPct||0;
  const topCompProd  = b.topCompetingProduct||"—";
  const kwPct        = (keywords&&compKw&&!isNaN(keywords)&&!isNaN(compKw)) ? Math.round((Number(keywords)/Number(compKw))*100) : "—";
  // Returns [brandColor, compColor] — green for higher, red for lower, grey if equal/unparseable
  const rowColors = function(bVal, cVal){
    const b = parseFloat(String(bVal).replace(/[^0-9.-]/g,''));
    const c = parseFloat(String(cVal).replace(/[^0-9.-]/g,''));
    if(isNaN(b)||isNaN(c)||b===c) return ['#111','#111'];
    return b > c ? ['#10b981','#ef4444'] : ['#ef4444','#10b981'];
  };

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>FUFLD — Amazon Brand Diagnostic</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',Arial,sans-serif;background:#fff;color:#111;width:794px;margin:0 auto}
@media print{
  body{width:100%;margin:0}
  .no-print{display:none!important}
  @page{size:A4 portrait;margin:0}
}
/* HEADER */
.hdr{background:#0d1b2a;padding:10px 20px 10px 16px;display:flex;align-items:center;justify-content:space-between;min-height:80px}
.hdr-logo{display:flex;align-items:center}
.hdr-logo img{width:160px;height:auto;display:block}
.hdr-mid{text-align:center;flex:1;padding:0 10px}
.hdr-mid .title{color:#fff;font-size:20px;font-weight:900;letter-spacing:.06em}
.hdr-mid .tagline{color:#06b6d4;font-size:8.5px;font-weight:700;letter-spacing:.14em;margin-top:3px}
.hdr-brand{text-align:right;min-width:160px}
.hdr-brand .bname{color:#fff;font-size:22px;font-weight:900;line-height:1.1}
.hdr-brand .bcat{color:#cbd5e1;font-size:9px;margin-top:3px}
.hdr-brand .bupcs{color:#94a3b8;font-size:8px;margin-top:2px}
.hdr-line{height:4px;background:linear-gradient(90deg,#06b6d4 0%,#1a56db 50%,#7c3aed 100%)}
/* BODY */
.body{padding:14px 20px 10px}
/* SECTION HEADER */
.sec-hdr{font-size:11.5px;font-weight:800;color:#111;letter-spacing:.03em;border-bottom:2.5px solid #111;padding-bottom:5px;margin-bottom:11px;margin-top:14px;text-transform:uppercase}
/* GAP BOXES */
.gap-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:4px}
.gap-box{border:1.5px solid #d1d5db;border-radius:6px;padding:10px 12px;min-height:128px}
.gap-lbl{font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:3px}
.gap-big{font-size:30px;font-weight:900;line-height:1.05;margin-bottom:6px}
.gap-body{font-size:7.5px;color:#4b5563;line-height:1.5}
/* REVENUE SECTION */
.rev-section{display:grid;grid-template-columns:1fr 190px;gap:10px;margin-bottom:4px}
.rev-table{width:100%;border-collapse:collapse;font-size:8.5px}
.rev-table thead tr{background:#111}
.rev-table thead th{color:#fff;padding:6px 10px;text-align:center;font-weight:700;font-size:9px}
.rev-table thead th:first-child{text-align:left}
.rev-table tbody tr:nth-child(even){background:#f9fafb}
.rev-table tbody td{padding:5px 10px;border-bottom:1px solid #e5e7eb;color:#111;font-size:8.5px}
.rev-table tbody td:not(:first-child){text-align:center;font-weight:700}
.v-brand{color:#ef4444}
.v-comp{color:#10b981}
.sidebar{background:#111;border-radius:6px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.sb-lbl{color:#06b6d4;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}
.sb-big{color:#fff;font-size:20px;font-weight:900;line-height:1.1}
.sb-sub{color:#9ca3af;font-size:7.5px;margin-top:5px;margin-bottom:1px}
.sb-pct{color:#ef4444;font-size:24px;font-weight:900;line-height:1}
.sb-rev{color:#9ca3af;font-size:7px;margin-bottom:4px}
.sb-div{border-top:1.5px solid #06b6d4;width:90%;margin:6px auto}
.sb-comp-lbl{color:#06b6d4;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:3px}
.sb-comp-row{display:flex;flex-direction:row;align-items:center;justify-content:center;width:100%;padding:0 4px;gap:6px}
.sb-comp-name{color:#fff;font-size:7.5px;text-align:center}
.sb-comp-pct{color:#10b981;font-size:7.5px;font-weight:700;text-align:center}
/* TOP PRODUCT */
.prod-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:4px}
.prod-box{border:1.5px solid #d1d5db;border-radius:6px;padding:10px 14px}
.prod-lbl{font-size:8px;color:#6b7280;margin-bottom:5px}
.prod-big{font-size:26px;font-weight:900;line-height:1}
/* HOW WE FIX IT */
.fix-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px}
.fix-box{background:#1f2937;border-radius:6px;padding:12px}
.fix-pill{display:inline-block;border-radius:3px;padding:2px 9px;font-size:7px;font-weight:700;color:#fff;margin-bottom:7px}
.fix-title{color:#fff;font-size:10px;font-weight:800;margin-bottom:5px;line-height:1.3}
.fix-body{color:#9ca3af;font-size:7.5px;line-height:1.5}
/* CTA */
.cta{background:#1d4ed8;border-radius:8px;padding:16px 24px;text-align:center;margin-bottom:14px}
.cta-title{color:#fff;font-size:12px;font-weight:900;letter-spacing:.02em;margin-bottom:6px}
.cta-sub{color:#bfdbfe;font-size:8.5px;line-height:1.5;margin-bottom:3px}
.cta-bold{color:#fff;font-size:8.5px;font-weight:700}
/* FOOTER */
.footer-wrap{background:#0d1b2a;margin:0 -20px -10px;padding:10px 20px 14px;margin-top:12px}
.footer-top{display:flex;justify-content:space-between;align-items:center;padding:6px 0 8px;border-bottom:1px solid rgba(255,255,255,.15)}
.ft-meta-l{color:rgba(255,255,255,.5);font-size:7.5px}
.ft-meta-r{color:#06b6d4;font-size:7.5px}
.footer-bottom{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;align-items:start;padding-top:10px}
.ft-name{font-size:15px;font-weight:800;color:#fff;margin-bottom:3px}
.ft-email{color:#06b6d4;font-size:8px}
.ft-phone{color:rgba(255,255,255,.6);font-size:8px;margin-top:2px}
.ft-vert{border-left:1.5px solid rgba(255,255,255,.2);padding-left:14px}
.ft-center{text-align:center}
.ft-center .ft-bname{font-size:11px;font-weight:800;color:#fff;margin-bottom:3px}
.ft-center .ft-url{color:#06b6d4;font-size:8px}
.ft-center .ft-scan{color:rgba(255,255,255,.5);font-size:7.5px;margin-top:2px}
.print-btn{position:fixed;top:16px;right:16px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;
  padding:10px 22px;font-size:13px;font-weight:700;cursor:pointer;
  box-shadow:0 4px 16px rgba(29,78,216,.4);z-index:999;font-family:inherit}
.print-btn:hover{background:#1e40af}
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨 Print / Save PDF</button>

<div class="hdr">
  <div class="hdr-logo"><img src="data:image/png;base64,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" alt="FUFLD"></div>
  <div class="hdr-mid">
    <div class="title">AMAZON BRAND DIAGNOSTIC</div>
    <div class="tagline">HERE'S WHAT WE FOUND ON YOUR BRAND</div>
  </div>
  <div class="hdr-brand">
    <div class="bname">${brand}</div>
    <div class="bcat">${category}</div>
    <div class="bupcs">${upcs} UPCs tracked</div>
  </div>
</div>
<div class="hdr-line"></div>

<div class="body">

<div class="sec-hdr">GAPS WE IDENTIFIED IN YOUR AMAZON PRESENCE</div>
<div class="gap-row">
  <div class="gap-box">
    <div class="gap-lbl" style="color:#ef4444">AMAZON IN-STOCK RATE</div>
    <div class="gap-big" style="color:#ef4444">${inStock}%</div>
    <div class="gap-body">${inStockDesc}</div>
  </div>
  <div class="gap-box">
    <div class="gap-lbl" style="color:#06b6d4">SELLER CONTROL</div>
    <div class="gap-big" style="color:#06b6d4">${sellers} Sellers</div>
    <div class="gap-body">${topSeller} controls roughly ${topSellerPct}% of ${brand}'s brand share, while ${Number(sellers)-1} other sellers split the remaining volume. It's unclear if all sellers are authorized or following MAP pricing.</div>
  </div>
  <div class="gap-box">
    <div class="gap-lbl" style="color:#10b981">SEARCH VISIBILITY</div>
    <div class="gap-big" style="color:#10b981">${keywords} Keywords</div>
    <div class="gap-body">${brand} ranks for ${keywords} search terms vs. ${topComp}'s ${compKw}, with only ${ads} products advertising and \$${adSpendFmt}/mo in ad spend vs. \$${compAdFmt} for the competitor. Significant room exists to expand keyword coverage and ad investment.</div>
  </div>
</div>

<div class="sec-hdr">REVENUE YOU'RE LEAVING ON THE TABLE</div>
<div class="rev-section">
  <table class="rev-table">
    <thead>
      <tr>
        <th style="text-align:left;width:40%"></th>
        <th>${brand}</th>
        <th>${topComp}</th>
      </tr>
    </thead>
    <tbody>
      ${(function(){
        var fmt = function(v){ var n=Number(v); return isNaN(n)?v:n.toLocaleString('en-US'); };
        var rows = [
          {label:'Monthly Revenue', bv:revenue,   cv:compRev,   bDisplay:'$'+revenueFmt,  cDisplay:'$'+compRevFmt},
          {label:'Market Share',    bv:mktShare,  cv:compMktShare, bDisplay:mktShare+'%', cDisplay:compMktShare+'%'},
          {label:'Search Terms',    bv:keywords,  cv:compKw,    bDisplay:fmt(keywords),   cDisplay:fmt(compKw)},
          {label:'Products w/ Ads', bv:ads,       cv:compAds,   bDisplay:fmt(ads),        cDisplay:fmt(compAds)},
          {label:'Est. Monthly Ads',bv:adSpend,   cv:Number(b.competitorAdSpend)||0, bDisplay:'$'+adSpendFmt, cDisplay:'$'+compAdFmt},
        ];
        return rows.map(function(r){
          var cols = rowColors(r.bv, r.cv);
          return '<tr><td>'+r.label+'</td>'
            +'<td style="text-align:center;font-weight:700;color:'+cols[0]+'">'+r.bDisplay+'</td>'
            +'<td style="text-align:center;font-weight:700;color:'+cols[1]+'">'+r.cDisplay+'</td>'
            +'</tr>';
        }).join('');
      })()}
    </tbody>
  </table>
  <div class="sidebar">
    <div class="sb-lbl">TOTAL CATEGORY / MO</div>
    <div class="sb-big">${totalCat}</div>
    <div class="sb-sub">${brand} currently captures</div>
    <div class="sb-pct">${mktShare}%</div>
    <div class="sb-rev">of available revenue</div>
    <div class="sb-div"></div>
    <div class="sb-comp-lbl">TOP COMPETITOR</div>
    <div class="sb-comp-row">
      <span class="sb-comp-name">${topComp}</span>
      <span class="sb-comp-pct">${compMktShare}%</span>
    </div>
  </div>
</div>

<div class="sec-hdr">TOP PRODUCT PERFORMANCE</div>
<div class="prod-row">
  <div class="prod-box">
    <div class="prod-lbl">${brand} Top Product / Mo</div>
    <div class="prod-big" style="color:#ef4444">\$${topProdFmt}</div>
  </div>
  <div class="prod-box">
    <div class="prod-lbl">${topCompProd} Top Competing Product / Mo</div>
    <div class="prod-big" style="color:#10b981">\$${compProdFmt}</div>
  </div>
</div>

<div class="sec-hdr">HOW FUFLD FIXES IT</div>
<div class="fix-row">
  <div class="fix-box">
    <span class="fix-pill" style="background:#10b981">WE RANK IT</span>
    <div class="fix-title">SEO &amp; Search Domination</div>
    <div class="fix-body">Our SEO team builds keyword strategy, optimizes listings, and drives organic rank so your brand gets found before the competition.</div>
  </div>
  <div class="fix-box">
    <span class="fix-pill" style="background:#f97316">WE FULFILL IT</span>
    <div class="fix-title">End-to-End Fulfillment</div>
    <div class="fix-body">We handle warehousing, pick-and-pack, and fast delivery. We also manage all FBA prep and pack &mdash; your inventory arrives at Amazon ready to sell.</div>
  </div>
  <div class="fix-box">
    <span class="fix-pill" style="background:#1d4ed8">WE PROTECT IT</span>
    <div class="fix-title">Brand Control &amp; MAP Enforcement</div>
    <div class="fix-body">We remove unauthorized sellers, enforce MAP pricing, and shut down hijackers to restore your brand&rsquo;s value and margin.</div>
  </div>
</div>

<div class="cta">
  <div class="cta-title">YOUR BRAND. OUR INFRASTRUCTURE. ONE PARTNERSHIP.</div>
  <div class="cta-sub">We take over your Amazon channel &mdash; ads, listings, fulfillment, and seller control &mdash; so you can focus on your brand.</div>
  <div class="cta-bold">We buy your inventory upfront &mdash; zero cash flow risk on your end.</div>
</div>

<div class="footer-wrap">
<div class="footer-top">
  <span class="ft-meta-l">FUFLD | Fulfillment + Acceleration</span>
  <span class="ft-meta-r">fufld.com | Unleash Brand Dominance</span>
</div>
<div class="footer-bottom">
  <div class="ft-vert">
    <div class="ft-name">Mario Avina</div>
    <div class="ft-email">ma@fufld.com</div>
    <div class="ft-phone">714-884-4085</div>
  </div>
  <div class="ft-center">
    <div class="ft-bname">FUFLD | Unleash Brand Dominance</div>
    <div class="ft-url">fufld.com</div>
    <div class="ft-scan">Scan to connect</div>
  </div>
  <div style="text-align:right;display:flex;justify-content:flex-end">
    <img src="data:image/png;base64,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" alt="QR" style="width:65px;height:auto">
  </div>
</div><!-- /footer-bottom -->
</div><!-- /footer-wrap -->

</div><!-- /body -->
</body>
</html>`;

  // Inject as a full-screen overlay inside the app — no popup needed
  let overlay = document.getElementById("brand-report-overlay");
  if(overlay) overlay.remove();
  overlay = document.createElement("div");
  overlay.id = "brand-report-overlay";
  overlay.style.cssText = "position:fixed;inset:0;z-index:99999;background:#fff;overflow:auto;padding-top:56px";

  // Action bar — appended as a separate element so inner <style> doesn't affect it
  const bar = document.createElement("div");
  bar.className = "no-print";
  bar.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:100001;background:#1f2937;padding:10px 16px;display:flex;gap:8px;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,.4)";
  bar.innerHTML = `
    <span style="color:#fff;font-size:13px;font-weight:600;flex:1">📄 FUFLD Brand Diagnostic Report</span>
    <button id="brd-print-btn" style="background:#1d4ed8;color:#fff;border:none;border-radius:8px;padding:9px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(29,78,216,.5)">🖨 Print / Save PDF</button>
    <button id="brd-close-btn" style="background:#374151;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">✕ Close</button>`;

  // Report content
  const content = document.createElement("div");
  content.style.cssText = "width:794px;margin:0 auto;padding-bottom:40px";
  content.innerHTML = html;

  overlay.appendChild(bar);
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  // Wire buttons after DOM insertion
  document.getElementById("brd-print-btn").addEventListener("click", ()=>window.print());
  document.getElementById("brd-close-btn").addEventListener("click", ()=>{
    document.getElementById("brand-report-overlay")?.remove();
    document.getElementById("brand-print-style")?.remove();
  });

  // Inject print styles so only the report prints
  let ps = document.getElementById("brand-print-style");
  if(ps) ps.remove();
  ps = document.createElement("style");
  ps.id = "brand-print-style";
  ps.textContent = `@media print{body>*:not(#brand-report-overlay){display:none!important}#brand-report-overlay{position:static!important;overflow:visible!important;padding-top:0!important}.no-print{display:none!important}@page{size:A4 portrait;margin:0}}`;
  document.head.appendChild(ps);
}

function openBrandModal(b=null){
  const isNew=!b;
  b=b||{id:"",submissionDate:TODAY,brandName:"",submittedBy:currentUser.name,contactName:"",jobTitle:"",phone:"",email:"",website:"",primarySubcategory:"",primarySubcategoryRevenue:"",subcategoryMonthlyRevenue:"",marketShare:"",totalSellers:"",topCompetingBrands:"",topCompetitorRevenue:"",topCompetingProduct:"",brandKeyword:"",competitorKeyword:"",amazonInStockRate:"",notes:"",productsWithAds:"",topProductRevenue:"",topCompetingProductRevenue:"",topSeller:"",topSellerPct:"",totalUPCs:"",estAdSpend:"",competitorMarketShare:"",brandSearchTerms:"",competitorSearchTerms:"",competitorProductsWithAds:"",competitorAdSpend:"",submissionId:"SUB-"+Date.now().toString().slice(-5),followUpPat:"",followUpCesar:"",status:"Pending"};

  openModal(`${mHeader(isNew?"New Brand Submission":"Edit Brand Submission")}
  <div class="modal-body">

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin-bottom:8px">Submission Info</div>
    <div class="form-grid">
      ${mField("Submission Date","submissionDate",b.submissionDate,"date","",true)}
      ${mField("Brand Name","brandName",b.brandName,"text","",true)}
      ${mField("Submitted By","submittedBy",b.submittedBy,"text","",true)}
      ${mField("Status","status",b.status||"Pending","select","Approved,Pending,Declined")}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Contact</div>
    <div class="form-grid">
      ${mField("Contact Name","contactName",b.contactName,"text")}
      ${mField("Job Title","jobTitle",b.jobTitle,"text")}
      ${mField("Phone Number","phone",b.phone,"text")}
      ${mField("Email","email",b.email,"email")}
      <div class="form-full">${mField("Brand Website","website",b.website,"text","e.g. yourbrand.com")}</div>
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Brand Data</div>
    <div class="form-grid">
      ${mField("Primary Subcategory","primarySubcategory",b.primarySubcategory,"text")}
      ${mField("Primary Subcategory Revenue ($)","primarySubcategoryRevenue",b.primarySubcategoryRevenue||"","number")}
      ${mField("Total UPCs","totalUPCs",b.totalUPCs,"number")}
      ${mField("Amazon In-Stock Rate (%)","amazonInStockRate",b.amazonInStockRate,"number")}
      ${mField("Top Seller","topSeller",b.topSeller,"text")}
      ${mField("Top Seller %","topSellerPct",b.topSellerPct,"number","e.g. 76.8")}
      ${mField("Total Sellers","totalSellers",b.totalSellers,"number")}
      ${mField("Brand Monthly Revenue ($)","subcategoryMonthlyRevenue",b.subcategoryMonthlyRevenue,"number")}
      ${mField("Brand Market Share (%)","marketShare",b.marketShare,"number")}
      ${mField("Brand Search Terms","brandSearchTerms",b.brandSearchTerms,"number")}
      ${mField("Brand Products w/ Ads","productsWithAds",b.productsWithAds,"number")}
      ${mField("Brand Monthly Ads ($)","estAdSpend",b.estAdSpend,"number")}
      ${mField("Brand Top Product / Mo ($)","topProductRevenue",b.topProductRevenue,"number")}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--red);margin:14px 0 8px">Competitor Data</div>
    <div class="form-grid">
      ${mField("Competitor Brand Name","topCompetingBrands",b.topCompetingBrands,"text")}
      ${mField("Competitor Monthly Revenue ($)","topCompetitorRevenue",b.topCompetitorRevenue,"number")}
      ${mField("Competitor Market Share (%)","competitorMarketShare",b.competitorMarketShare,"number")}
      ${mField("Competitor Search Terms","competitorSearchTerms",b.competitorSearchTerms,"number")}
      ${mField("Competitor Products w/ Ads","competitorProductsWithAds",b.competitorProductsWithAds,"number")}
      ${mField("Competitor Monthly Ads ($)","competitorAdSpend",b.competitorAdSpend,"number")}
      ${mField("Competitor Top Product","topCompetingProduct",b.topCompetingProduct||"","text")}
      ${mField("Competitor Top Product / Mo ($)","topCompetingProductRevenue",b.topCompetingProductRevenue,"number")}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Keywords</div>
    <div class="form-grid">
      ${mField("Brand Keyword","brandKeyword",b.brandKeyword,"text")}
      ${mField("Competitor Keyword","competitorKeyword",b.competitorKeyword,"text")}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Notes & Follow-Up</div>
    <div class="form-grid">
      <div class="form-full"><div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-input" name="notes" rows="3" placeholder="Any additional notes…">${b.notes||""}</textarea>
      </div></div>
      ${mField("Next Follow-Up Date (Pat)","followUpPat",b.followUpPat,"date")}
      ${mField("Next Follow-Up Date (Cesar)","followUpCesar",b.followUpCesar,"date")}
    </div>

  </div>
  ${mFooter("saveBrand('"+b.id+"')",b.id?"confirm2('Delete this brand submission?',()=>delRecord('brands','"+b.id+"'))":"")}`,true);
}

function saveBrand(id){
  const name=mVal("brandName"),sub=mVal("submittedBy");
  if(!name||!sub){showToast("Brand Name and Submitted By are required.","var(--red)");return;}
  const rec={
    id:id||uid("BRD"),
    submissionDate:mVal("submissionDate"),brandName:name,submittedBy:sub,
    contactName:mVal("contactName"),jobTitle:mVal("jobTitle"),phone:mVal("phone"),
    email:mVal("email"),website:mVal("website"),primarySubcategory:mVal("primarySubcategory"),
    primarySubcategoryRevenue:Number(mVal("primarySubcategoryRevenue"))||0,
    totalUPCs:Number(mVal("totalUPCs"))||0,
    amazonInStockRate:Number(mVal("amazonInStockRate"))||0,
    topSeller:mVal("topSeller"),
    topSellerPct:Number(mVal("topSellerPct"))||0,
    totalSellers:Number(mVal("totalSellers"))||0,
    subcategoryMonthlyRevenue:Number(mVal("subcategoryMonthlyRevenue"))||0,
    marketShare:Number(mVal("marketShare"))||0,
    brandSearchTerms:Number(mVal("brandSearchTerms"))||0,
    productsWithAds:Number(mVal("productsWithAds"))||0,
    estAdSpend:Number(mVal("estAdSpend"))||0,
    topProductRevenue:Number(mVal("topProductRevenue"))||0,
    topCompetingBrands:mVal("topCompetingBrands"),
    topCompetitorRevenue:Number(mVal("topCompetitorRevenue"))||0,
    competitorMarketShare:Number(mVal("competitorMarketShare"))||0,
    competitorSearchTerms:Number(mVal("competitorSearchTerms"))||0,
    competitorProductsWithAds:Number(mVal("competitorProductsWithAds"))||0,
    competitorAdSpend:Number(mVal("competitorAdSpend"))||0,
    topCompetingProduct:mVal("topCompetingProduct")||"",
    topCompetingProductRevenue:Number(mVal("topCompetingProductRevenue"))||0,
    brandKeyword:mVal("brandKeyword"),competitorKeyword:mVal("competitorKeyword"),
    notes:mVal("notes"),
    followUpPat:mVal("followUpPat"),followUpCesar:mVal("followUpCesar"),
    submissionId:mVal("submissionId")||"SUB-"+Date.now().toString().slice(-5),
    status:mVal("status")||"Pending",
  };
  upsert("brands",rec);
  saveToLocalStorage();
  closeModal();
  showToast(id?"Brand updated":"Brand added","var(--purple)");
  window._brandView="detail"; window._brandSelected=rec.id; pageBrands();
}

function changeBrandStatus(id,newStatus){
  const b=DB.brands.find(x=>x.id===id);
  if(!b) return;
  b.status=newStatus;
  const col=newStatus==="Approved"?"var(--green)":newStatus==="Declined"?"var(--red)":"var(--yellow)";
  showToast(`${b.brandName} → ${newStatus}`,col);
  renderBrandDetail(id);
}

function exportBrandsCSV(){
  const headers=BRAND_COLS.map(c=>c.label);
  const rows=DB.brands.map(b=>BRAND_COLS.map(c=>{
    const v=b[c.key];
    if(v===undefined||v===null) return "";
    // Wrap in quotes if contains comma
    return String(v).includes(",")?`"${v}"`:String(v);
  }));
  const csv=[headers.join(","),...rows.map(r=>r.join(","))].join("\n");
  const blob=new Blob([csv],{type:"text/csv"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="AmericanWholesalers_Brands_"+TODAY+".csv";
  a.click();
  showToast("CSV exported","var(--green)");
}

// ═══════════════════════════════════════════════
//  BRANDS: GOOGLE SHEETS IMPORT ENGINE
// ═══════════════════════════════════════════════

// Column aliases — maps common sheet header variations → internal field keys
const BRAND_IMPORT_ALIASES = {
  // Submission
  "submission date":          "submissionDate",
  "date submitted":           "submissionDate",
  "submitted":                "submissionDate",
  "brand name":               "brandName",
  "brand":                    "brandName",
  "submitted by":             "submittedBy",
  "submitter":                "submittedBy",
  "submission id":            "submissionId",
  "sub id":                   "submissionId",
  "id":                       "submissionId",
  "status":                   "status",
  // Contact
  "contact name":             "contactName",
  "contact":                  "contactName",
  "name":                     "contactName",
  "job title":                "jobTitle",
  "title":                    "jobTitle",
  "position":                 "jobTitle",
  "phone":                    "phone",
  "phone number":             "phone",
  "email":                    "email",
  "email address":            "email",
  "brand website":            "website",
  "website":                  "website",
  "url":                      "website",
  // Market
  "primary subcategory":              "primarySubcategory",
  "primary subcategory revenue":       "primarySubcategoryRevenue",
  "subcategory revenue":               "primarySubcategoryRevenue",
  "subcategory":              "primarySubcategory",
  "category":                 "primarySubcategory",
  "primary subcategory (monthly revenue)": "subcategoryMonthlyRevenue",
  "subcategory monthly revenue":           "subcategoryMonthlyRevenue",
  "monthly revenue":          "subcategoryMonthlyRevenue",
  "market share":             "marketShare",
  "market share %":           "marketShare",
  "total number of sellers":  "totalSellers",
  "total # of sellers":       "totalSellers",
  "# of sellers":             "totalSellers",
  "sellers":                  "totalSellers",
  "top competing brands":     "topCompetingBrands",
  "competing brands":         "topCompetingBrands",
  "top competitors":          "topCompetingBrands",
  "top competitor revenue":   "topCompetitorRevenue",
  "competitor revenue":       "topCompetitorRevenue",
  "brand keyword":            "brandKeyword",
  "keyword":                  "brandKeyword",
  "competitor keyword":       "competitorKeyword",
  "amazon in stock rate %":   "amazonInStockRate",
  "amazon in stock rate":     "amazonInStockRate",
  "in stock rate":            "amazonInStockRate",
  "in-stock rate":            "amazonInStockRate",
  "notes":                    "notes",
  "note":                     "notes",
  // Products
  "products w/ ads":          "productsWithAds",
  "products with ads":        "productsWithAds",
  "ads":                      "productsWithAds",
  "top product revenue":      "topProductRevenue",
  "top competing product":         "topCompetingProduct",
  "competitor top product":        "topCompetingProduct",
  "top competing product revenue": "topCompetingProductRevenue",
  "top competitor product revenue":"topCompetingProductRevenue",
  "top seller":               "topSeller",
  "best seller":              "topSeller",
  "total upcs":               "totalUPCs",
  "upcs":                     "totalUPCs",
  "upc count":                "totalUPCs",
  "est. ad spend":            "estAdSpend",
  "estimated ad spend":       "estAdSpend",
  "ad spend":                 "estAdSpend",
  // Follow-up
  "next follow-up date (pat)":"followUpPat",
  "follow-up date (pat)":     "followUpPat",
  "follow up pat":            "followUpPat",
  "pat follow up":            "followUpPat",
  "next follow-up date (cesar)":"followUpCesar",
  "follow-up date (cesar)":   "followUpCesar",
  "follow up cesar":          "followUpCesar",
  "cesar follow up":          "followUpCesar",
};

const NUMERIC_FIELDS=["subcategoryMonthlyRevenue","marketShare","totalSellers","topCompetitorRevenue","amazonInStockRate","productsWithAds","topProductRevenue","topCompetingProductRevenue","totalUPCs","estAdSpend"];
const STATUS_VALUES=["Approved","Pending","Declined"];

let _importStep = "connect";   // connect | preview | done
let _importRows = [];          // raw parsed rows [{colKey: value}]
let _importMapping = {};       // sheetHeader → fieldKey
let _importSelected = new Set(); // row indices selected for import
let _gcImportToken = null;

// ── Entry point ──
function openBrandImport(){
  _importStep = "connect";
  _importRows = [];
  _importMapping = {};
  _importSelected = new Set();
  renderImportModal();
}

function renderImportModal(){
  const clientId = localStorage.getItem("gc_client_id")||"";
  openModal(`
    ${mHeader("Import Brands from Google Sheets")}
    <div class="modal-body" id="import-modal-body">
      ${_importStep === "connect"   ? renderImportConnect(clientId) :
        _importStep === "mapping"   ? renderImportMapping() :
        _importStep === "preview"   ? renderImportPreview() :
                                      renderImportDone()}
    </div>
  `, true);
}

// ── Step 1: Connect ──
function renderImportConnect(clientId){
  return `
  <div style="display:flex;flex-direction:column;gap:16px">

    <!-- Option A: Public URL -->
    <div style="background:rgba(255,255,255,.04);border:1px solid var(--border2);border-radius:var(--r);padding:1.1rem">
      <div style="font-size:13px;font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:8px">
        <span style="background:rgba(79,142,247,.15);color:var(--accent);border-radius:50%;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">A</span>
        Paste a Public Sheet URL
      </div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px;line-height:1.6">Sheet must be set to <strong style="color:var(--text)">Anyone with the link → Viewer</strong>. No sign-in required.</div>
      <div style="display:flex;gap:8px">
        <input id="import-url" class="form-input" style="flex:1" placeholder="https://docs.google.com/spreadsheets/d/…" value="">
        <button class="btn btn-primary btn-sm" onclick="fetchImportURL()">Fetch</button>
      </div>
      <div style="font-size:11px;color:var(--dim);margin-top:6px">Tip: You can also paste a link to a specific tab by including <span class="mono">#gid=XXXXXXXX</span> in the URL.</div>
    </div>

    <div style="text-align:center;color:var(--dim);font-size:12px">— or —</div>

    <!-- Option B: OAuth -->
    <div style="background:rgba(255,255,255,.04);border:1px solid var(--border2);border-radius:var(--r);padding:1.1rem">
      <div style="font-size:13px;font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:8px">
        <span style="background:rgba(79,142,247,.15);color:var(--accent);border-radius:50%;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">B</span>
        Sign in with Google (Private Sheets)
      </div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px;line-height:1.6">Works with private sheets. Uses the same Client ID as Calendar & Gmail.</div>
      <div class="form-group" style="margin-bottom:10px">
        <label class="form-label">OAuth Client ID</label>
        <input id="import-client-id" class="form-input" value="${clientId}" placeholder="XXXXXXXXXX.apps.googleusercontent.com">
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn btn-sm" onclick="connectImportOAuth()" style="background:#4285F4;color:#fff;border:none;border-radius:var(--r);padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px">
          <svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.729 0-.788-.085-1.39-.189-1.989H12.24z"/></svg>
          Sign in with Google
        </button>
        ${_gcImportToken?`<span style="font-size:12px;color:var(--green)">✓ Signed in</span>`:""}
      </div>
      ${_gcImportToken?`
      <div style="margin-top:10px">
        <label class="form-label">Sheet URL (private sheet)</label>
        <div style="display:flex;gap:8px;margin-top:4px">
          <input id="import-url-oauth" class="form-input" style="flex:1" placeholder="https://docs.google.com/spreadsheets/d/…">
          <button class="btn btn-primary btn-sm" onclick="fetchImportOAuth()">Fetch</button>
        </div>
      </div>`:""}
    </div>

    <div id="import-error" style="display:none;color:var(--red);font-size:12px;padding:8px 12px;background:rgba(247,92,92,.08);border-radius:var(--r);border:1px solid rgba(247,92,92,.2)"></div>
  </div>`;
}

// ── Fetch via public URL ──
async function fetchImportURL(){
  const url = document.getElementById("import-url")?.value.trim();
  if(!url){ showImportError("Please paste a Google Sheets URL."); return; }
  showImportError("");
  setImportLoading(true, "Fetching sheet…");
  try{
    const csvUrl = sheetsUrlToCSV(url);
    const res = await fetch(csvUrl);
    if(!res.ok) throw new Error(`HTTP ${res.status} — make sure the sheet is set to "Anyone with the link → Viewer"`);
    const text = await res.text();
    if(text.includes("<!DOCTYPE")||text.includes("<html")) throw new Error("Google returned a login page. The sheet is private — use Option B (Sign in with Google).");
    parseImportCSV(text);
  } catch(e){
    setImportLoading(false);
    showImportError(e.message);
  }
}

// ── OAuth connect + fetch ──
function connectImportOAuth(){
  const clientId = document.getElementById("import-client-id")?.value.trim();
  if(!clientId){ showImportError("Enter your OAuth Client ID first."); return; }
  localStorage.setItem("gc_client_id", clientId);
  const doAuth = ()=>{
    try{
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
        callback: (resp)=>{
          if(resp.error){ showImportError("Auth error: "+resp.error); return; }
          _gcImportToken = resp.access_token;
          renderImportModal();
        },
      });
      client.requestAccessToken();
    } catch(e){ showImportError("Error: "+e.message); }
  };
  if(!window.google?.accounts){
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = doAuth;
    s.onerror = ()=> showImportError("Could not load Google sign-in library.");
    document.head.appendChild(s);
  } else doAuth();
}

async function fetchImportOAuth(){
  const url = document.getElementById("import-url-oauth")?.value.trim();
  if(!url){ showImportError("Please paste the sheet URL."); return; }
  showImportError("");
  setImportLoading(true, "Fetching private sheet…");
  try{
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if(!match) throw new Error("Invalid Google Sheets URL.");
    const sheetId = match[1];
    const gidMatch = url.match(/[#&?]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : "0";
    // Use Sheets API v4 to get values
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`,
      {headers:{Authorization:"Bearer "+_gcImportToken}});
    if(metaRes.status===401){ _gcImportToken=null; throw new Error("Session expired. Please sign in again."); }
    const meta = await metaRes.json();
    // Find tab by gid
    const sheets = meta.sheets||[];
    const tab = sheets.find(s=>String(s.properties?.sheetId)===gid)||sheets[0];
    const tabName = tab?.properties?.title||"Sheet1";
    const valRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabName)}`,
      {headers:{Authorization:"Bearer "+_gcImportToken}});
    const valData = await valRes.json();
    const rows = valData.values||[];
    if(rows.length<2) throw new Error("Sheet appears empty or has only headers.");
    parseImportRows(rows);
  } catch(e){
    setImportLoading(false);
    showImportError(e.message);
  }
}

// ── Helpers ──
function sheetsUrlToCSV(url){
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if(!match) throw new Error("Invalid Google Sheets URL — must contain /spreadsheets/d/…");
  const sheetId = match[1];
  const gidMatch = url.match(/[#&?]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

function parseImportCSV(text){
  const lines = text.trim().split(/\r?\n/);
  const parseRow = line => {
    const result=[]; let cur="", inQ=false;
    for(let i=0;i<line.length;i++){
      if(line[i]==='"'){ inQ=!inQ; }
      else if(line[i]===','&&!inQ){ result.push(cur.trim()); cur=""; }
      else cur+=line[i];
    }
    result.push(cur.trim());
    return result;
  };
  const rows = lines.map(parseRow);
  parseImportRows(rows);
}

function parseImportRows(rows){
  if(!rows||rows.length<2){ setImportLoading(false); showImportError("Sheet has no data rows."); return; }
  const headers = rows[0].map(h=>String(h||"").trim());
  const dataRows = rows.slice(1).filter(r=>r.some(c=>c!==""));

  // Auto-map headers to field keys
  const mapping = {};
  headers.forEach(h=>{
    const key = BRAND_IMPORT_ALIASES[h.toLowerCase().trim()];
    if(key) mapping[h] = key;
  });

  _importMapping = {headers, mapping, dataRows};
  _importStep = "mapping";
  setImportLoading(false);
  renderImportModal();
}

function setImportLoading(on, msg=""){
  const body = document.getElementById("import-modal-body");
  if(!body) return;
  if(on) body.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--muted)">
    <div style="font-size:28px;margin-bottom:12px;animation:pulse 1.5s infinite">⟳</div>
    <div style="font-size:13px">${msg||"Loading…"}</div>
  </div>`;
}

function showImportError(msg){
  const el = document.getElementById("import-error");
  if(!el) return;
  if(msg){ el.textContent=msg; el.style.display="block"; }
  else el.style.display="none";
}

// ── Step 2: Column Mapping ──
function renderImportMapping(){
  const {headers, mapping, dataRows} = _importMapping;
  const allFields = BRAND_COLS.map(c=>({key:c.key,label:c.label}));
  const unmapped = headers.filter(h=>!mapping[h]);
  const mapped   = headers.filter(h=> mapping[h]);

  return `
  <div>
    <div style="font-size:13px;color:var(--muted);margin-bottom:14px;line-height:1.6">
      Found <strong style="color:var(--text)">${dataRows.length} rows</strong> and <strong style="color:var(--text)">${headers.length} columns</strong>.
      Auto-matched <strong style="color:var(--green)">${mapped.length}</strong> columns.
      ${unmapped.length>0?`<span style="color:var(--yellow)">${unmapped.length} unmatched</span> — map them below or skip.`:"All columns matched ✓"}
    </div>

    <div style="max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:6px">
    ${headers.map(h=>{
      const isAuto = !!mapping[h];
      const sel = mapping[h]||"__skip__";
      return `
      <div style="display:grid;grid-template-columns:1fr 24px 1fr;gap:8px;align-items:center;padding:7px 10px;background:rgba(255,255,255,.03);border-radius:8px;border:1px solid ${isAuto?"rgba(79,207,142,.2)":"var(--border)"}">
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--text)">${h}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:1px">e.g. ${dataRows[0]?String(dataRows[0][headers.indexOf(h)]||"").slice(0,30)||"—":"—"}</div>
        </div>
        <div style="text-align:center;color:${isAuto?"var(--green)":"var(--dim)"};font-size:14px">${isAuto?"→":"·"}</div>
        <select onchange="updateMapping('${h.replace(/'/g,"&#39;")}',this.value)"
          style="background:#080c14;border:1px solid ${isAuto?"rgba(79,207,142,.3)":"var(--border2)"};border-radius:6px;padding:6px 8px;color:${isAuto?"var(--green)":"var(--muted)"};font-size:12px;font-family:var(--font);outline:none;cursor:pointer">
          <option value="__skip__"${sel==="__skip__"?" selected":""}>— Skip this column —</option>
          ${allFields.map(f=>`<option value="${f.key}"${sel===f.key?" selected":""}>${f.label}</option>`).join("")}
        </select>
      </div>`;
    }).join("")}
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
      <button class="btn btn-ghost btn-sm" onclick="_importStep='connect';renderImportModal()">← Back</button>
      <button class="btn btn-primary" onclick="proceedToPreview()">Preview Import →</button>
    </div>
  </div>`;
}

function updateMapping(header, fieldKey){
  if(!_importMapping.mapping) _importMapping.mapping={};
  if(fieldKey==="__skip__") delete _importMapping.mapping[header];
  else _importMapping.mapping[header] = fieldKey;
}

// ── Step 3: Preview & Select ──
function proceedToPreview(){
  const {headers, mapping, dataRows} = _importMapping;
  const hasMappedFields = Object.values(mapping).length > 0;
  if(!hasMappedFields){ showToast("Map at least one column first.","var(--red)"); return; }

  // Build import rows
  _importRows = dataRows.map((row,i)=>{
    const rec = {_rowIndex:i, _selected:true};
    headers.forEach((h,j)=>{
      const key = mapping[h];
      if(!key) return;
      let val = String(row[j]||"").trim();
      if(NUMERIC_FIELDS.includes(key)) val = parseFloat(val.replace(/[$,₱%]/g,""))||0;
      if(key==="status"){
        // Normalize status
        const norm = STATUS_VALUES.find(s=>s.toLowerCase()===val.toLowerCase())||"Pending";
        val = norm;
      }
      rec[key] = val;
    });
    // Check duplicate by brandName
    rec._isDuplicate = !!(rec.brandName && DB.brands.find(b=>b.brandName?.toLowerCase()===rec.brandName?.toLowerCase()));
    return rec;
  }).filter(r=>Object.keys(r).length>3); // skip entirely empty rows

  _importSelected = new Set(_importRows.map((_,i)=>i));
  _importStep = "preview";
  renderImportModal();
}

function renderImportPreview(){
  if(!_importRows.length) return `<div style="text-align:center;padding:2rem;color:var(--muted)">No valid rows to import.</div>`;

  const mapped = Object.values(_importMapping.mapping);
  const previewFields = BRAND_COLS.filter(c=>mapped.includes(c.key)).slice(0,6);
  const dupes = _importRows.filter(r=>r._isDuplicate).length;
  const selected = _importSelected.size;

  return `
  <div>
    <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:14px;flex-wrap:wrap">
      <div style="flex:1;min-width:200px">
        <div style="font-size:14px;font-weight:700;margin-bottom:4px">${_importRows.length} rows ready to import</div>
        <div style="font-size:12px;color:var(--muted)">
          <span style="color:var(--green)">${selected} selected</span>
          ${dupes>0?` · <span style="color:var(--yellow)">${dupes} duplicate name${dupes!==1?"s":""}</span>`:""}
          · ${_importRows.length-selected} deselected
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-ghost btn-sm" onclick="selectAllImport(true)">Select All</button>
        <button class="btn btn-ghost btn-sm" onclick="selectAllImport(false)">Deselect All</button>
        <button class="btn btn-warning btn-sm" onclick="selectNonDupes()">Skip Duplicates</button>
      </div>
    </div>

    ${dupes>0?`<div style="background:rgba(247,201,79,.07);border:1px solid rgba(247,201,79,.2);border-radius:var(--r);padding:8px 12px;margin-bottom:12px;font-size:12px;color:var(--yellow)">
      ⚠ ${dupes} row${dupes!==1?" have names that":"has a name that"} already exist in Brands. They are highlighted below. You can deselect them or import anyway to add duplicates.
    </div>`:""}

    <div style="max-height:320px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r);overflow-x:auto">
      <table style="width:max-content;min-width:100%">
        <thead>
          <tr style="background:#0d1b3e;position:sticky;top:0;z-index:1">
            <th style="width:36px;padding:8px 10px">
              <input type="checkbox" id="import-check-all" checked onchange="selectAllImport(this.checked)"
                style="width:14px;height:14px;cursor:pointer;accent-color:var(--accent)">
            </th>
            ${previewFields.map(f=>`<th style="min-width:120px;white-space:nowrap">${f.label}</th>`).join("")}
            <th style="min-width:80px">Status</th>
            <th style="min-width:80px">Duplicate?</th>
          </tr>
        </thead>
        <tbody>
          ${_importRows.map((row,i)=>`
          <tr id="import-row-${i}" style="background:${row._isDuplicate?"rgba(247,201,79,.04)":"transparent"};opacity:${_importSelected.has(i)?1:0.4};transition:opacity .15s">
            <td style="padding:7px 10px">
              <input type="checkbox" ${_importSelected.has(i)?"checked":""} onchange="toggleImportRow(${i},this.checked)"
                style="width:14px;height:14px;cursor:pointer;accent-color:var(--accent)">
            </td>
            ${previewFields.map(f=>{
              const v = row[f.key];
              if(v===undefined||v===null||v==="") return `<td class="text-muted" style="font-size:12px">—</td>`;
              if(f.currency) return `<td style="color:var(--green);font-size:12px;font-weight:500">$${Number(v).toLocaleString()}</td>`;
              if(f.bold) return `<td style="font-weight:700;font-size:13px">${v}</td>`;
              return `<td style="font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${v}</td>`;
            }).join("")}
            <td>${brandStatusBadge(row.status||"Pending")}</td>
            <td style="font-size:11px;color:${row._isDuplicate?"var(--yellow)":"var(--dim)"}">${row._isDuplicate?"⚠ Exists":"—"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
      <button class="btn btn-ghost btn-sm" onclick="_importStep='mapping';renderImportModal()">← Back</button>
      <div style="display:flex;gap:8px;align-items:center">
        <span style="font-size:12px;color:var(--muted)">${selected} row${selected!==1?"s":""} will be imported</span>
        <button class="btn btn-primary" onclick="confirmImport()" ${selected===0?"disabled":""}>
          Import ${selected} Brand${selected!==1?"s":""} →
        </button>
      </div>
    </div>
  </div>`;
}

function toggleImportRow(i, checked){
  if(checked) _importSelected.add(i);
  else _importSelected.delete(i);
  // Update row opacity live
  const row = document.getElementById("import-row-"+i);
  if(row) row.style.opacity = checked ? "1" : "0.4";
  // Update header checkbox state
  const all = document.getElementById("import-check-all");
  if(all) all.checked = _importSelected.size === _importRows.length;
  // Update counter
  renderImportCounter();
}

function renderImportCounter(){
  // Just refresh the modal body for the counter — lightweight
  const btn = document.querySelector("#import-modal-body button[onclick^='confirmImport']");
  if(btn){
    const n = _importSelected.size;
    btn.textContent = `Import ${n} Brand${n!==1?"s":""} →`;
    btn.disabled = n===0;
  }
}

function selectAllImport(checked){
  _importRows.forEach((_,i)=>{ if(checked) _importSelected.add(i); else _importSelected.delete(i); });
  renderImportModal();
}

function selectNonDupes(){
  _importRows.forEach((r,i)=>{ if(r._isDuplicate) _importSelected.delete(i); else _importSelected.add(i); });
  renderImportModal();
}

// ── Step 4: Commit ──
function confirmImport(){
  const toImport = _importRows.filter((_,i)=>_importSelected.has(i));
  if(!toImport.length){ showToast("Nothing selected.","var(--red)"); return; }

  let added=0, updated=0;
  toImport.forEach(row=>{
    const rec = {...row};
    delete rec._rowIndex; delete rec._selected; delete rec._isDuplicate;
    // Assign ID: reuse existing if duplicate, else new
    const existing = rec.brandName ? DB.brands.find(b=>b.brandName?.toLowerCase()===rec.brandName?.toLowerCase()) : null;
    if(existing && !rec.id) rec.id = existing.id;
    if(!rec.id) rec.id = uid("BRD");
    if(!rec.status) rec.status = "Pending";
    const isNew = !DB.brands.find(b=>b.id===rec.id);
    upsert("brands", rec);
    if(isNew) added++; else updated++;
  });

  _importStep = "done";
  _importRows = [];
  renderImportModal();

  // Refresh brands page in background
  setTimeout(()=>{ if(currentPage==="brands") pageBrands(); }, 300);
  showToast(`Imported ${added} new + ${updated} updated brands`, "var(--green)");
}

function renderImportDone(){
  return `
  <div style="text-align:center;padding:2.5rem;display:flex;flex-direction:column;align-items:center;gap:14px">
    <div style="width:56px;height:56px;border-radius:50%;background:rgba(79,207,142,.15);display:flex;align-items:center;justify-content:center;font-size:28px">✓</div>
    <div style="font-size:18px;font-weight:700;color:var(--green)">Import Complete</div>
    <div style="font-size:13px;color:var(--muted)">Brands have been added to the database. The page will refresh automatically.</div>
    <div style="display:flex;gap:10px;margin-top:8px">
      <button class="btn btn-ghost btn-sm" onclick="openBrandImport()">Import Another Sheet</button>
      <button class="btn btn-primary" onclick="closeModal();pageBrands()">View Brands →</button>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════
//  ATTENDANCE CHECK-IN POPUP
// ═══════════════════════════════════════════════

