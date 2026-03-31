// ── 11-emergency.js ──

function pageEmergency(){
  if(!DB.emergency) DB.emergency=[];
  let tab       = (window._emTab)||"Amazon";
  // Redirect if active tab is not accessible
  {const _allowed=["Amazon","Walmart","Ebay"].filter(t=>canAccessTab("emergency",t));if(_allowed.length&&!_allowed.includes(tab)){window._emTab=_allowed[0];tab=_allowed[0];}}
  const emSearch  = (window._emSearch)||"";
  const emStatusF = (window._emStatusF)||"All";
  const _emStatusF = emStatusF;

  const platformRows = DB.emergency.filter(e=>(e.platform||"Amazon")===tab);

  const rows = platformRows.filter(e=>{
    const ms = emStatusF==="All"||e.status===emStatusF;
    const mq = !emSearch||
      (e.orderId||"").toLowerCase().includes(emSearch.toLowerCase())||
      (e.client||"").toLowerCase().includes(emSearch.toLowerCase())||
      (e.shippingLabel||"").toLowerCase().includes(emSearch.toLowerCase())||
      (e.notes||"").toLowerCase().includes(emSearch.toLowerCase());
    return ms&&mq;
  });

  const rowBgMap = {
    "Shipped":    "background:rgba(79,207,142,.09);border-left:3px solid var(--green)",
    "Pending":    "background:rgba(247,201,79,.07);border-left:3px solid var(--yellow)",
    "Need Label": "background:rgba(251,146,60,.08);border-left:3px solid var(--orange)",
    "Cancelled":  "background:rgba(247,92,92,.07);border-left:3px solid var(--red)",
    "Prepped":    "background:rgba(79,142,247,.07);border-left:3px solid var(--accent)",
  };
  const badgeMap = {
    "Shipped":    {bg:"rgba(79,207,142,.15)",  color:"var(--green)"},
    "Pending":    {bg:"rgba(247,201,79,.15)",  color:"var(--yellow)"},
    "Need Label": {bg:"rgba(251,146,60,.15)",  color:"var(--orange)"},
    "Cancelled":  {bg:"rgba(247,92,92,.15)",   color:"var(--red)"},
    "Prepped":    {bg:"rgba(79,142,247,.15)",  color:"var(--accent)"},
  };

  // Tab colours
  const amzColor = "#FF9900";
  const wmtColor = "#0071CE";
  const ebayColor = "#E53238";

  const tabColor = tab==="Amazon" ? amzColor : tab==="Walmart" ? wmtColor : ebayColor;

  const pending = platformRows.filter(e=>e.status==="Pending").length;
  const prepped = platformRows.filter(e=>e.status==="Prepped").length;
  const shipped = platformRows.filter(e=>e.status==="Shipped").length;
  const needLbl = platformRows.filter(e=>e.status==="Need Label").length;

  render(`
  <div>
    <div class="page-header">
      <div><div class="page-title">Emergency Shipments</div>
      <div class="page-sub">${DB.emergency.length} total records</div></div>
      ${canSubmit("emergency")?'<button class="btn btn-danger" onclick="openESModal()">+ New Entry</button>':''}
    </div>

    <!-- Platform Tabs -->
    <div style="display:flex;gap:0;margin-bottom:1.25rem;border-bottom:2px solid var(--border)">
      ${[
        {id:"Amazon",  label:"🛒 Amazon",  color:amzColor},
        {id:"Walmart", label:"🛍 Walmart", color:wmtColor},
        {id:"Ebay",    label:"🏷 eBay",    color:ebayColor},
      ].filter(p=>canAccessTab("emergency",p.id)).map(p=>`
        <button onclick="window._emTab='${p.id}';window._emStatusF='All';window._emSearch='';pageEmergency()"
          style="padding:10px 28px;background:none;border:none;border-bottom:3px solid ${tab===p.id?p.color:"transparent"};
                 color:${tab===p.id?p.color:"var(--muted)"};font-size:14px;font-weight:${tab===p.id?"700":"500"};
                 cursor:pointer;font-family:var(--font);transition:all .15s;margin-bottom:-2px">
          ${p.label}
          <span style="margin-left:8px;background:${tab===p.id?"rgba(255,255,255,.12)":"rgba(255,255,255,.05)"};
                 border-radius:20px;padding:2px 8px;font-size:11px">
            ${DB.emergency.filter(e=>(e.platform||"Amazon")===p.id).length}
          </span>
        </button>`
      ).join("")}
    </div>

    <div class="metrics metrics-4" style="margin-bottom:1.25rem">
      ${metric("Pending",    pending,  "", "var(--yellow)")}
      ${metric("Prepped",    prepped,  "", "var(--accent)")}
      ${metric("Need Label", needLbl,  "", "var(--orange)")}
      ${metric("Shipped",    shipped,  "", "var(--green)")}
    </div>

    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input class="search-bar" placeholder="Search order, client, tracking…"
          value="${emSearch}" oninput="window._emSearch=this.value;pageEmergency()"
          style="flex:1;min-width:200px;max-width:300px">
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${["All","Pending","Prepped","Need Label","Shipped","Cancelled"].map(s=>
            `<button class="filter-pill${_emStatusF===s?" active":""}"
              onclick="window._emStatusF='${s}';pageEmergency()">${s}</button>`
          ).join("")}
        </div>
      </div>
    </div>

    <div class="card" style="padding:0;overflow:hidden;border-top:3px solid ${tabColor}">
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th>Status</th>
            <th>Date</th>
            <th>Order ID</th>
            <th>Client Name</th>
            <th>Image</th>
            <th>Qty Ordered</th>
            <th>Shipping Label</th>
            <th>Pack / Bundle</th>
            <th>File / Photo</th>
            <th>Notes</th>
            <th>WH Notes</th>
            <th></th>
          </tr></thead>
          <tbody>
          ${rows.length===0?`<tr><td colspan="12" style="text-align:center;padding:3rem;color:var(--muted)">No ${tab} records found</td></tr>`:""}
          ${rows.map(es=>{
            const rowBg = rowBgMap[es.status]||"";
            const b     = badgeMap[es.status]||{bg:"rgba(107,118,148,.12)",color:"var(--muted)"};
            return `<tr style="${rowBg}">
              <td>
                ${canEdit("emergency") ? `<select onchange="saveESField('${es.id}','status',this.value)"` : `<select disabled`}
                  style="background:${b.bg};border:1px solid ${b.color}40;border-radius:20px;
                         padding:3px 10px;color:${b.color};font-size:11px;font-weight:700;
                         font-family:var(--font);outline:none;cursor:pointer">
                  ${["Pending","Prepped","Need Label","Shipped","Cancelled"].map(s=>
                    `<option value="${s}"${es.status===s?" selected":""}>${s}</option>`
                  ).join("")}
                </select>
              </td>
              <td style="font-size:12px;color:var(--muted)">${es.date||"—"}</td>
              <td class="mono" style="font-size:11px;color:${tabColor}">${es.orderId||"—"}</td>
              <td style="font-weight:500;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${es.client||"—"}</td>
              <td style="text-align:center">
                ${es.imageUrl
                  ? `<img src="${es.imageUrl}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;cursor:pointer" onclick="openESImageModal('${es.imageUrl}')">`
                  : `<span style="color:var(--dim);font-size:11px">—</span>`}
              </td>
              <td style="font-weight:600">${es.qtyOrdered!=null?num(es.qtyOrdered):"—"}</td>
              <td class="mono" style="font-size:11px;color:var(--muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${es.shippingLabel||""}">${es.shippingLabel||"—"}</td>
              <td style="font-size:12px">${es.packBundle||"—"}</td>
              <td style="text-align:center">
                ${es.fileUrl
                  ? `<a href="${es.fileUrl}" target="_blank" style="color:${tabColor};font-size:11px;font-weight:600">📎 View</a>`
                  : `<span style="color:var(--dim);font-size:11px">—</span>`}
              </td>
              <td style="font-size:12px;color:var(--muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${es.notes||""}">${es.notes||"—"}</td>
              <td style="max-width:160px">
                <input type="text" value="${(es.whNotes||"").replace(/"/g,'&quot;')}"
                  ${canEdit("emergency") ? `onblur="saveESField('${es.id}','whNotes',this.value)"` : `disabled`}
                  onkeydown="if(event.key==='Enter')this.blur()"
                  placeholder="WH notes…"
                  style="background:transparent;border:1px solid var(--border);border-radius:var(--r);
                         padding:3px 7px;color:var(--muted);font-size:11px;font-family:var(--font);
                         width:100%;min-width:120px;outline:none">
              </td>
              <td>${canEdit("emergency")?`<button class="btn btn-info btn-sm" onclick='openESModal(${JSON.stringify(es).replace(/'/g,"&#39;")})'>Edit</button>`:""}</td>
            </tr>`;
          }).join("")}
          </tbody>
        </table>
      </div>
      <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${rows.length} of ${platformRows.length} ${tab} records</div>
    </div>
  </div>`);
}

function saveESField(id, field, value){
  if(!DB.emergency) DB.emergency=[];
  const es = DB.emergency.find(x=>x.id===id);
  if(!es) return;
  es[field] = value;
  saveToLocalStorage();
  showToast("Status updated","var(--green)");
  pageEmergency();
}

function openESImageModal(url){
  openModal(`<div class="modal-header"><span class="modal-title">Image Preview</span><button class="modal-close" onclick="closeModal()">×</button></div>
  <div style="padding:1.25rem;text-align:center">
    <img src="${url}" style="max-width:100%;max-height:60vh;border-radius:var(--r2)">
  </div>`);
}

function openESModal(es=null){
  const isNew=!es;
  const currentTab=(window._emTab)||"Amazon";
  es=es||{id:"",platform:currentTab,status:"Pending",date:TODAY,orderId:"",client:"",
           imageUrl:"",qtyOrdered:"",shippingLabel:"",packBundle:"",
           fileUrl:"",notes:"",whNotes:""};
  openModal(`${mHeader(isNew?"New Emergency Entry":"Edit Emergency Entry")}
  <div class="modal-body"><div class="form-grid">
    ${mField("Platform","platform",es.platform,"select","Amazon,Walmart,Ebay",true)}
    <div class="form-full">${mField("Status","status",es.status,"select","Pending,Prepped,Need Label,Shipped,Cancelled",true)}</div>
    ${mField("Date","date",es.date,"date","",true)}
    ${mField("Order ID","orderId",es.orderId,"text","e.g. ORD-2025-007",true)}
    <div class="form-full">${clientSelectFiltered("client",es.client||"",(window._emTab)||"Amazon",false)}</div>
    <div class="form-full">${mField("Image URL","imageUrl",es.imageUrl,"text","Paste image link")}</div>
    ${mField("Qty Ordered","qtyOrdered",es.qtyOrdered,"number","",true)}
    ${mField("Shipping Label / Tracking","shippingLabel",es.shippingLabel,"text","e.g. 1Z999AA...")}
    ${mField("Pack / Bundle","packBundle",es.packBundle,"text","e.g. 2-pack")}
    <div class="form-full">${mField("File / Photo URL","fileUrl",es.fileUrl,"text","Paste file or photo link")}</div>
    <div class="form-full">${mField("Notes","notes",es.notes,"textarea")}</div>
    <div class="form-full">${mField("WH Notes","whNotes",es.whNotes,"textarea")}</div>
  </div></div>
  ${mFooter("saveES('"+es.id+"')",es.id?"confirm2('Delete this entry?',()=>delRecord('emergency','"+es.id+"'))":"")}`);
}

function saveES(id){
  if(!mVal("orderId")) return showToast("Order ID is required.","var(--red)");
  if(!mVal("qtyOrdered")) return showToast("Qty Ordered is required.","var(--red)");
  const rec={
    id:           id||uid("ES"),
    platform:     mVal("platform")||"Amazon",
    status:       mVal("status")||"Pending",
    date:         mVal("date")||TODAY,
    orderId:      mVal("orderId"),
    client:       mVal("client"),
    imageUrl:     mVal("imageUrl"),
    qtyOrdered:   Number(mVal("qtyOrdered"))||0,
    shippingLabel:mVal("shippingLabel"),
    packBundle:   mVal("packBundle"),
    fileUrl:      mVal("fileUrl"),
    notes:        mVal("notes"),
    whNotes:      mVal("whNotes"),
  };
  upsert("emergency",rec);
  notifyOnSave("emergency",rec,!id);
  closeModal();
  pageEmergency();
}

// ═══════════════════════════════════════════════
//  PAGE: P&L PER CLIENT
// ═══════════════════════════════════════════════

