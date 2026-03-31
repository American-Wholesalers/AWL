// ── 06-archived.js ──

function pageArchived(){
  if(!DB.archived) DB.archived=[];
  const search = (window._archSearch)||"";
  const filterStatus = (window._archFilter)||"All";
  const _archFilter = window._archFilter||"All";

  const statusCounts = {};
  ARCHIVE_STATUSES.forEach(s=>{ statusCounts[s]=DB.archived.filter(a=>a.listingStatus===s).length; });

  let rows = DB.archived.filter(a=>{
    const matchF = filterStatus==="All"||a.listingStatus===filterStatus;
    const matchS = !search||
      (a.name||"").toLowerCase().includes(search.toLowerCase())||
      (a.client||"").toLowerCase().includes(search.toLowerCase())||
      (a.asin||"").toLowerCase().includes(search.toLowerCase())||
      (a.upc||"").toLowerCase().includes(search.toLowerCase());
    return matchF&&matchS;
  });

  render(`
  <div>
    <div class="page-header">
      <div>
        <div class="page-title" style="display:flex;align-items:center;gap:10px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;background:rgba(247,201,79,.15);border-radius:8px;font-size:18px">📦</span>
          Archived Items
        </div>
        <div class="page-sub">Items moved here when listing status is set to OOS, Trash, or Shipped</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="exportArchivedCSV()">↓ Export</button>
    </div>

    <!-- Stats -->
    <div class="metrics metrics-4" style="margin-bottom:1.25rem">
      ${metric("Total Archived",DB.archived.length,"","var(--muted)")}
      ${metric("OOS",statusCounts["OOS"]||0,"","var(--red)")}
      ${metric("Shipped",statusCounts["Shipped"]||0,"","var(--accent)")}
      ${metric("Trash",statusCounts["Trash"]||0,"","#888")}
    </div>

    <!-- Filters -->
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input class="search-bar" placeholder="Search product, ASIN, UPC, client…" value="${search}"
          oninput="window._archSearch=this.value;pageArchived()" style="flex:1;min-width:180px;max-width:280px">
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${["All",...ARCHIVE_STATUSES].map(s=>`
            <button class="filter-pill${filterStatus===s?" active":""}"
              onclick="window._archFilter='${s}';pageArchived()">${s}</button>`).join("")}
        </div>
      </div>
    </div>

    <!-- Table -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r2);overflow:hidden">
      <div style="overflow-x:auto">
        <table style="width:max-content;min-width:100%">
          <thead><tr style="background:#0d1b3e;position:sticky;top:0;z-index:2">
            <th>Listing Status</th>
            <th>Product</th>
            <th>Client</th>
            <th>ASIN</th>
            <th>UPC</th>
            <th>Rack</th>
            <th>Remaining Stock</th>
            <th>Initial Stock</th>
            <th>Unit Cost</th>
            <th>Manager</th>
            <th>Archived At</th>
            <th>Archived By</th>
            <th></th>
          </tr></thead>
          <tbody>
          ${rows.length===0?`<tr><td colspan="13" style="text-align:center;color:var(--muted);padding:3rem">
            <div style="font-size:32px;margin-bottom:10px;opacity:.3">📦</div>
            No archived items${filterStatus!=="All"?" with status "+filterStatus:""}
          </td></tr>`:""}
          ${rows.map(item=>{
            const ls = item.listingStatus||"";
            const st = LISTING_STATUS_MAP[ls]||{bg:"rgba(107,118,148,.12)",color:"#6b7694"};
            const rowBg = {
              "OOS":     "background:rgba(247,92,92,.06);border-left:3px solid #f75c5c",
              "Shipped": "background:rgba(79,142,247,.06);border-left:3px solid #4f8ef7",
              "Trash":   "background:rgba(80,80,80,.05);border-left:3px solid #888",
            }[ls]||"";
            return `<tr style="${rowBg}">
              <td><span class="badge" style="background:${st.bg};color:${st.color}">${ls||"—"}</span></td>
              <td style="font-weight:600;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.name||"—"}</td>
              <td style="font-size:12px;color:var(--accent)">${item.client||"—"}</td>
              <td class="mono" style="font-size:11px;color:var(--muted)">${item.asin||"—"}</td>
              <td class="mono" style="font-size:11px;color:var(--muted)">${item.upc||"—"}</td>
              <td><span style="background:rgba(79,142,247,.15);color:var(--accent);font-family:var(--mono);font-size:11px;font-weight:700;border-radius:6px;padding:2px 8px">${item.rack||"—"}-${item.station||"—"}</span></td>
              <td style="color:var(--muted);font-weight:500">${num(item.qty)||0}</td>
              <td style="color:var(--muted)">${num(item.initialStock)||0}</td>
              <td style="color:var(--green)">$${Number(item.unitCost||0).toFixed(2)}</td>
              <td style="font-size:12px">${item.manager||"—"}</td>
              <td style="font-size:11px;color:var(--muted)">${item.archivedAt||"—"}</td>
              <td style="font-size:12px;color:var(--dim)">${item.archivedBy||"—"}</td>
              <td>
                <div style="display:flex;gap:5px">
                  <button class="btn btn-success btn-sm" onclick="restoreArchived('${item.id}')" title="Restore to Inventory">↩ Restore</button>
                  <button class="btn btn-danger btn-sm" onclick="confirm2('Permanently delete this item?',()=>deleteArchived('${item.id}'))" title="Delete permanently">✕</button>
                </div>
              </td>
            </tr>`;
          }).join("")}
          </tbody>
        </table>
      </div>
      <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${rows.length} of ${DB.archived.length} archived items</div>
    </div>
  </div>`);
}

function restoreArchived(id){
  const item = DB.archived.find(a=>a.id===id);
  if(!item) return;
  // Clear archive-trigger status and restore
  item.listingStatus = "";
  item.invStatus = calcInvStatus(item.qty||0);
  delete item.archivedAt;
  delete item.archivedBy;
  DB.archived = DB.archived.filter(a=>a.id!==id);
  DB.inventory.unshift(item);
  showToast(`"${item.name}" restored to inventory`, "var(--green)");
  pageArchived();
}

function deleteArchived(id){
  DB.archived = DB.archived.filter(a=>a.id!==id);
  showToast("Item permanently deleted", "var(--red)");
  pageArchived();
}

function exportArchivedCSV(){
  if(!DB.archived.length){ showToast("No archived items to export","var(--yellow)"); return; }
  const csv=["Listing Status,Product,Client,ASIN,UPC,Rack,Station,Remaining Stock,Initial Stock,Unit Cost,Manager,Archived At,Archived By",
    ...DB.archived.map(a=>`${a.listingStatus||""},${a.name||""},${a.client||""},${a.asin||""},${a.upc||""},${a.rack||""},${a.station||""},${a.qty||0},${a.initialStock||0},${a.unitCost||0},${a.manager||""},${a.archivedAt||""},${a.archivedBy||""}`)
  ].join("\n");
  const el=document.createElement("a");
  el.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  el.download="AW_Archived_"+TODAY+".csv"; el.click();
  showToast("Archived items exported","var(--green)");
}

// ═══════════════════════════════════════════════
//  PAGE: REPLENISHMENT
// ═══════════════════════════════════════════════

