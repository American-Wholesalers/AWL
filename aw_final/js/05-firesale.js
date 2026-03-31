// ── 05-firesale.js ──

function pageFireSale(){
  if(!DB.firesale) DB.firesale=[];
  const search = (window._fsSearch)||"";
  const clientF = (window._fsClient)||"All";
  const _fsClient = clientF;
  const canEdit = ["Admin","Manager","Purchaser","Warehouse"].includes(currentUser?.role);

  const clients = ["All",...[...new Set(DB.firesale.map(i=>i.client).filter(Boolean))].sort()];

  const fsListingF = (window._fsListingF)||"All";
  let rows = DB.firesale.filter(i=>{
    const matchL = fsListingF==="All"||i.listingStatus===fsListingF;
    const matchC = clientF==="All"||i.client===clientF;
    const matchS = !search||
      (i.name||"").toLowerCase().includes(search.toLowerCase())||
      (i.client||"").toLowerCase().includes(search.toLowerCase())||
      (i.asin||"").toLowerCase().includes(search.toLowerCase())||
      (i.upc||"").toLowerCase().includes(search.toLowerCase());
    return matchC&&matchS;
  });

  const totalQty   = rows.reduce((s,i)=>s+(Number(i.qty)||0),0);
  const totalValue = rows.reduce((s,i)=>s+(Number(i.qty)||0)*(Number(i.unitCost)||0),0);

  render(`
  <div>
    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="page-title" style="display:flex;align-items:center;gap:10px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;background:rgba(247,92,92,.2);border-radius:10px;font-size:20px">🔥</span>
          Fire Sale!!
        </div>
        <div class="page-sub">Items moved here when listing status is set to Fire Sale</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="exportFireSaleCSV()">↓ Export</button>
    </div>

    <!-- Metrics -->
    <div class="metrics metrics-4" style="margin-bottom:1.25rem">
      ${metric("Items on Fire Sale",DB.firesale.length,"","var(--red)")}
      ${metric("Filtered Items",rows.length,"","var(--orange)")}
      ${metric("Total Qty",num(totalQty),"units","var(--yellow)")}
      ${metric("Est. Value","$"+totalValue.toFixed(0),"at cost","var(--muted)")}
    </div>

    <!-- Filters -->
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input class="search-bar" placeholder="Search product, ASIN, UPC, client…" value="${search}"
          oninput="window._fsSearch=this.value;pageFireSale()" style="flex:1;min-width:180px;max-width:280px">
        <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--dim)">Client:</span><div style="display:flex;gap:5px;flex-wrap:wrap">${clients.map(c=>`<button class="filter-pill${_fsClient===c?" active":""}" onclick="window._fsClient='${c}';pageFireSale()">${c}</button>`).join("")}</div>
      </div>
    </div>

    <!-- Table -->
    <div style="background:var(--card);border:1px solid rgba(247,92,92,.3);border-radius:var(--r2);overflow:hidden">
      <div style="overflow-x:auto">
        <table style="width:max-content;min-width:100%">
          <thead><tr style="background:rgba(247,92,92,.1);position:sticky;top:0;z-index:2">
            <th style="min-width:180px">Product</th>
            <th style="min-width:130px">Client</th>
            <th style="min-width:120px">ASIN</th>
            <th style="min-width:120px">UPC</th>
            <th style="min-width:80px">Rack</th>
            <th style="min-width:110px">Remaining</th>
            <th style="min-width:100px">Initial Stock</th>
            <th style="min-width:90px">Unit Cost</th>
            <th style="min-width:80px">Profit</th>
            <th style="min-width:100px">Exp. Date</th>
            <th style="min-width:140px">Weight & Dim.</th>
            <th style="min-width:90px">Shipping</th>
            <th style="min-width:160px">Response ${canEdit?`<span style="font-size:9px;color:rgba(255,255,255,.4)">(editable)</span>`:""}  </th>
            <th style="min-width:160px">Action Taken ${canEdit?`<span style="font-size:9px;color:rgba(255,255,255,.4)">(editable)</span>`:""}  </th>
            <th style="min-width:120px">Manager</th>
            <th style="min-width:130px">🔥 Fire Sale Date</th>
            <th style="min-width:100px">By</th>
            <th style="min-width:120px"></th>
          </tr></thead>
          <tbody>
          ${rows.length===0?`<tr><td colspan="18" style="text-align:center;color:var(--muted);padding:3rem">
            <div style="font-size:40px;margin-bottom:10px;opacity:.4">🔥</div>
            No items on fire sale${clientF!=="All"?" for "+clientF:""}
          </td></tr>`:""}
          ${rows.map(item=>{
            const expColor = item.expirationDate && new Date(item.expirationDate)<new Date(TODAY) ? "var(--red)" : item.expirationDate ? "var(--muted)" : "var(--dim)";
            return `
            <tr style="background:rgba(247,92,92,.05);border-left:3px solid #f75c5c">
              <td style="font-weight:600;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${item.name||""}">${item.name||"—"}</td>
              <td style="font-size:12px;color:var(--accent)">${item.client||"—"}</td>
              <td class="mono" style="font-size:11px;color:var(--muted)">${item.asin||"—"}</td>
              <td class="mono" style="font-size:11px;color:var(--muted)">${item.upc||"—"}</td>
              <td><span style="background:rgba(79,142,247,.15);color:var(--accent);font-family:var(--mono);font-size:11px;font-weight:700;border-radius:6px;padding:2px 8px">${item.rack||"—"}-${item.station||"—"}</span></td>
              <td style="color:var(--red);font-weight:700">${num(item.qty)||0}</td>
              <td style="color:var(--muted)">${num(item.initialStock)||0}</td>
              <td style="color:var(--green)">$${Number(item.unitCost||0).toFixed(2)}</td>
              <td style="color:${Number(item.profit||0)>=0?"var(--green)":"var(--red)"};font-weight:600">$${Number(item.profit||0).toFixed(2)}</td>
              <td style="font-size:12px;color:${expColor}">${item.expirationDate||"—"}</td>
              <td style="font-size:12px;color:var(--muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${item.weightDimension||""}">${item.weightDimension||"—"}</td>
              <td><span class="tag" style="white-space:nowrap">${item.shippingType||"—"}</span></td>
              <td style="max-width:160px">
                ${canEdit
                  ? `<div style="display:flex;align-items:center;gap:5px">
                      <span style="font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:110px" title="${item.response||""}">${item.response||"—"}</span>
                      <button onclick="openFsEditModal('${item.id}','response')" style="flex-shrink:0;background:rgba(79,142,247,.12);border:1px solid rgba(79,142,247,.25);border-radius:5px;padding:2px 7px;color:var(--accent);font-size:10px;cursor:pointer;font-family:var(--font);font-weight:600">✏</button>
                    </div>`
                  : `<span style="font-size:12px;color:var(--muted)">${item.response||"—"}</span>`}
              </td>
              <td style="max-width:160px">
                ${canEdit
                  ? `<div style="display:flex;align-items:center;gap:5px">
                      <span style="font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:110px" title="${item.actionTaken||""}">${item.actionTaken||"—"}</span>
                      <button onclick="openFsEditModal('${item.id}','actionTaken')" style="flex-shrink:0;background:rgba(79,142,247,.12);border:1px solid rgba(79,142,247,.25);border-radius:5px;padding:2px 7px;color:var(--accent);font-size:10px;cursor:pointer;font-family:var(--font);font-weight:600">✏</button>
                    </div>`
                  : `<span style="font-size:12px;color:var(--muted)">${item.actionTaken||"—"}</span>`}
              </td>
              <td style="font-size:12px">${item.manager||"—"}</td>
              <td style="font-size:11px;color:var(--red);font-weight:600">${item.fireSaleAt||"—"}</td>
              <td style="font-size:12px;color:var(--dim)">${item.fireSaleBy||"—"}</td>
              <td>
                <div style="display:flex;gap:5px">
                  <button class="btn btn-success btn-sm" onclick="restoreFromFireSale('${item.id}')" title="Restore to Inventory">↩ Restore</button>
                  <button class="btn btn-danger btn-sm" onclick="confirm2('Permanently delete this item?',()=>deleteFireSale('${item.id}'))" title="Delete permanently">✕</button>
                </div>
              </td>
            </tr>`;
          }).join("")}
          </tbody>
        </table>
      </div>
      <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${rows.length} of ${DB.firesale.length} fire sale items · Warehouse team & Purchasers can edit Response and Action Taken</div>
    </div>
  </div>`);
}

// Inline edit modal for Response / Action Taken on fire sale items
function openFsEditModal(itemId, field){
  const item = DB.firesale.find(i=>i.id===itemId);
  if(!item) return;
  const label = field==="response" ? "Response" : "Action Taken";
  openModal(`${mHeader("Edit "+label+" — "+item.name)}
  <div class="modal-body">
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px">
      🔥 Fire Sale item · <strong style="color:var(--accent)">${item.client||"No client"}</strong>
    </div>
    <div class="form-group">
      <label class="form-label">${label}</label>
      <textarea name="fs-field-val" class="form-input" rows="4" placeholder="Enter ${label.toLowerCase()}…" style="resize:vertical">${item[field]||""}</textarea>
    </div>
  </div>
  ${mFooter(`saveFsField('${itemId}','${field}')`)}`);
}

function saveFsField(itemId, field){
  const item = DB.firesale.find(i=>i.id===itemId);
  if(!item) return;
  item[field] = mVal("fs-field-val");
  closeModal();
  showToast(`${field==="response"?"Response":"Action Taken"} updated`, "var(--green)");
  pageFireSale();
}

function restoreFromFireSale(id){
  const item = DB.firesale.find(f=>f.id===id);
  if(!item) return;
  item.listingStatus = "";
  item.invStatus = calcInvStatus(item.qty||0);
  delete item.fireSaleAt;
  delete item.fireSaleBy;
  DB.firesale = DB.firesale.filter(f=>f.id!==id);
  DB.inventory.unshift(item);
  showToast(`"${item.name}" restored to inventory`, "var(--green)");
  pageFireSale();
}

function deleteFireSale(id){
  DB.firesale = DB.firesale.filter(f=>f.id!==id);
  showToast("Item permanently deleted", "var(--red)");
  pageFireSale();
}

function exportFireSaleCSV(){
  if(!DB.firesale.length){ showToast("No fire sale items to export","var(--yellow)"); return; }
  const csv=["Product,Client,ASIN,UPC,Rack,Station,Remaining Stock,Initial Stock,Unit Cost,Profit,Exp. Date,Weight & Dim.,Shipping Type,Response,Action Taken,Manager,Fire Sale Date,By",
    ...DB.firesale.map(i=>[
      i.name||"", i.client||"", i.asin||"", i.upc||"", i.rack||"", i.station||"",
      i.qty||0, i.initialStock||0, i.unitCost||0, i.profit||0,
      i.expirationDate||"", `"${(i.weightDimension||"").replace(/"/g,'""')}"`,
      i.shippingType||"",
      `"${(i.response||"").replace(/"/g,'""')}"`,
      `"${(i.actionTaken||"").replace(/"/g,'""')}"`,
      i.manager||"", i.fireSaleAt||"", i.fireSaleBy||""
    ].join(","))
  ].join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download="AW_FireSale_"+TODAY+".csv"; a.click();
  showToast("Fire sale items exported","var(--green)");
}

// ═══════════════════════════════════════════════
//  PAGE: ARCHIVED ITEMS
// ═══════════════════════════════════════════════

