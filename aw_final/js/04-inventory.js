// ── 04-inventory.js ──

function checkAndArchive(item){
  if(!ARCHIVE_STATUSES.includes(item.listingStatus)) return false;
  DB.inventory = DB.inventory.filter(i=>i.id!==item.id);
  if(!DB.archived) DB.archived=[];
  if(!DB.archived.find(a=>a.id===item.id)){
    item.archivedAt = nowTS();
    item.archivedBy = currentUser?.username||"system";
    DB.archived.unshift(item);
  }
  return true;
}

// Fire Sale — moves item to firesale page and fires notification with link
function checkFireSale(item){
  if(item.listingStatus !== "Fire Sale") return false;
  if(!DB.firesale) DB.firesale=[];
  // Remove from inventory
  DB.inventory = DB.inventory.filter(i=>i.id!==item.id);
  // Add to firesale if not already there
  if(!DB.firesale.find(f=>f.id===item.id)){
    item.fireSaleAt = nowTS();
    item.fireSaleBy = currentUser?.username||"system";
    DB.firesale.unshift(item);
  }
  // Push notification to everyone with clickable link to firesale page
  const notifId = uid("NTF");
  const n = {
    id: notifId,
    type: "firesale",
    title: `🔥 Fire Sale!! — ${item.name}`,
    body: `${item.client||"No client"} · ${num(item.qty)} ${item.unit||"pcs"} remaining · Click to view Fire Sale page`,
    link: "firesale",
    itemId: item.id,
    time: nowCA().ts.slice(0,16),
    read: [],
    for: "all"
  };
  if(!DB.notifications) DB.notifications=[];
  DB.notifications.unshift(n);
  refreshNotifBadge();
  buildNav();
  showToast(`🔥 ${item.name} moved to Fire Sale!!`, "var(--red)");
  return true;
}

let _inlineStatusOpen = null;

function openInlineStatus(e, itemId, type){
  e.stopPropagation();
  // Close any already open
  closeInlineStatus();

  const item = DB.inventory.find(x=>x.id===itemId);
  if(!item) return;

  const options = LISTING_STATUSES.length ? ["",...LISTING_STATUSES] : [];

  const current = item.listingStatus||"";

  // Build dropdown
  const dropdown = document.createElement("div");
  dropdown.id = "inline-status-dd";
  dropdown.style.cssText = `
    position:fixed;z-index:9999;
    background:#091329;border:1px solid var(--border2);
    border-radius:var(--r2);box-shadow:0 8px 32px rgba(0,0,0,.6);
    min-width:180px;overflow:hidden;
    animation:slideIn .15s ease-out`;

  // Header
  const header = document.createElement("div");
  header.style.cssText = "padding:8px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);border-bottom:1px solid var(--border);background:rgba(0,0,0,.2)";
  header.textContent = "Listing Status";
  dropdown.appendChild(header);

  // Options
  options.forEach(opt=>{
    const row = document.createElement("div");
    const isSelected = opt===current;
    row.style.cssText = `padding:8px 12px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background .1s;${isSelected?"background:rgba(79,142,247,.1)":""}`;
    row.onmouseover = ()=>{ if(!isSelected) row.style.background="rgba(255,255,255,.06)"; };
    row.onmouseout  = ()=>{ if(!isSelected) row.style.background=""; };

    if(opt===""){
      row.innerHTML = `<span style="font-size:12px;color:var(--muted)">— None —</span>`;
    } else {
      const st = LISTING_STATUS_MAP[opt]||{bg:"rgba(107,118,148,.12)",color:"#6b7694"};
      row.innerHTML = `<span class="badge" style="background:${st.bg};color:${st.color};font-size:11px">${opt}</span>${isSelected?`<span style="margin-left:auto;color:var(--accent);font-size:12px">✓</span>`:""}`;
    }

    row.onclick = (ev)=>{
      ev.stopPropagation();
      item.listingStatus = opt;
      closeInlineStatus();
      if(checkFireSale(item)){
        pageInventory();
      } else if(checkAndArchive(item)){
        showToast(`"${item.name}" archived (${opt})`, "var(--yellow)");
        pageInventory();
      } else {
        showToast(`Listing status: ${opt||"None"}`, "var(--green)");
        pageInventory();
      }
    };
    dropdown.appendChild(row);
  });

  document.body.appendChild(dropdown);
  _inlineStatusOpen = dropdown;

  // Position near the clicked element
  const rect = e.currentTarget.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  if(spaceBelow < 300 && rect.top > 300){
    dropdown.style.bottom = (window.innerHeight - rect.top + 4)+"px";
    dropdown.style.top = "auto";
  } else {
    dropdown.style.top = (rect.bottom + 4)+"px";
  }
  const left = Math.min(rect.left, window.innerWidth - 200);
  dropdown.style.left = left+"px";

  // Close on outside click
  setTimeout(()=>{
    document.addEventListener("click", closeInlineStatus, {once:true});
  }, 10);
}

function closeInlineStatus(){
  if(_inlineStatusOpen){
    _inlineStatusOpen.remove();
    _inlineStatusOpen = null;
  }
}


// ── Inventory constants ──
const INV_STATUS_MAP={
  "Active":    {bg:"rgba(79,207,142,.12)", color:"#4fcf8e"},
  "Low Stock": {bg:"rgba(247,201,79,.12)", color:"#f7c94f"},
  "Out of Stock":{bg:"rgba(247,92,92,.12)",color:"#f75c5c"},
  "Inactive":  {bg:"rgba(107,118,148,.12)",color:"#6b7694"},
  "Discontinued":{bg:"rgba(251,146,60,.12)",color:"#fb923c"},
};

const ARCHIVE_STATUSES = ["OOS","Trash","Shipped"];

function isLiveStatus(s){
  return s==="Ebay Live"||s==="Amazon Live"||s==="Walmart Live"||s==="ASIN Live";
}

function listingStatusBadge(s){
  if(!s) return '<span style="color:var(--dim);font-size:12px">—</span>';
  const st = (typeof LISTING_STATUS_MAP!=="undefined"?LISTING_STATUS_MAP:{})[s]||{bg:"rgba(107,118,148,.12)",color:"#6b7694"};
  return '<span class="badge" style="background:'+st.bg+';color:'+st.color+';white-space:nowrap">'+s+'</span>';
}

function pageInventory(){
  const search=(window._invSearch)||"";
  const stFilter=(window._invStFilter)||"All";
  const _invStFilter = window._invStFilter||"All";
  const viewMode=(window._invView)||"table";
  const _invView = window._invView||"table";
  const clientF=(window._invClient)||"All";

  const enriched=DB.inventory.map(i=>({...i,st:invStatus(i),loc:(i.rack||"??")+"-"+(i.station||"??")}));
  const clients=["All",...[...new Set(DB.inventory.map(i=>i.client).filter(Boolean))].sort()];

  const rows=enriched.filter(i=>{
    const matchSt = stFilter==="All"||i.invStatus===stFilter||(stFilter==="LOW"&&i.st==="LOW")||(stFilter==="OUT"&&i.st==="OUT");
    const matchCl = clientF==="All"||i.client===clientF;
    const matchSr = !search||
      (i.name||"").toLowerCase().includes(search.toLowerCase())||
      (i.asin||"").toLowerCase().includes(search.toLowerCase())||
      (i.upc||"").toLowerCase().includes(search.toLowerCase())||
      (i.id||"").toLowerCase().includes(search.toLowerCase())||
      (i.client||"").toLowerCase().includes(search.toLowerCase())||
      (i.storeName||"").toLowerCase().includes(search.toLowerCase())||
      (i.manager||"").toLowerCase().includes(search.toLowerCase());
    return matchSt&&matchCl&&matchSr;
  });

  // rack map for rack view
  const rackMap={};
  rows.forEach(i=>{const r=i.rack||"Unassigned";if(!rackMap[r])rackMap[r]=[];rackMap[r].push(i);});
  const racks=Object.keys(rackMap).sort();

  const totalInitial=DB.inventory.reduce((a,i)=>a+(i.initialStock||0),0);
  const totalRemaining=DB.inventory.reduce((a,i)=>a+(i.qty||0),0);
  const lowCnt=enriched.filter(i=>i.invStatus==="Low Stock").length;
  const outCnt=enriched.filter(i=>i.invStatus==="Out of Stock").length;

  render(`
  <div>
    <div class="page-header">
      <div><div class="page-title">Inventory</div><div class="page-sub">${DB.inventory.length} items · ${[...new Set(DB.inventory.map(i=>i.rack).filter(Boolean))].length} racks</div></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="openRackManager()">⚙ Racks</button>
        <button class="btn btn-ghost btn-sm" onclick="exportInvCSV()">↓ CSV</button>
        ${canSubmit("inventory")?'<button class="btn btn-primary" onclick="openInvModal()">+ Add Item</button>':""}
      </div>
    </div>

    <div class="metrics metrics-4" style="margin-bottom:1rem">
      ${metric("Total Items",DB.inventory.length,"","var(--accent)")}
      ${metric("Initial Stock",num(totalInitial),"Total units stocked","var(--teal)")}
      ${metric("Remaining Stock",num(totalRemaining),"Currently in warehouse","var(--green)")}
      ${metric("Low / Out",lowCnt+" / "+outCnt,"Need attention","var(--red)")}
    </div>

    <!-- Toolbar -->
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input class="search-bar" placeholder="Search product, ASIN, UPC, client, manager…" value="${search}" oninput="window._invSearch=this.value;pageInventory()" style="flex:1;min-width:180px;max-width:280px">
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${["All","Active","Low Stock","Out of Stock","Inactive"].map(s=>`<button class="filter-pill${stFilter===s?" active":""}" onclick="window._invStFilter='${s}';pageInventory()">${s}</button>`).join("")}
        </div>
        <select onchange="window._invClient=this.value;pageInventory()" style="background:#080c14;border:1px solid var(--border2);border-radius:var(--r);padding:7px 10px;color:var(--text);font-size:12px;font-family:var(--font);outline:none;cursor:pointer">
          ${clients.map(c=>`<option value="${c}"${clientF===c?" selected":""}>${c}</option>`).join("")}
        </select>
        <div style="margin-left:auto;display:flex;gap:3px;background:rgba(255,255,255,.05);border-radius:8px;padding:3px">
          <button class="btn btn-sm" style="${viewMode==="table"?"background:var(--accent);color:#fff":"background:transparent;color:var(--muted)"}" onclick="window._invView='table';pageInventory()">☰ Table</button>
          <button class="btn btn-sm" style="${viewMode==="rack"?"background:var(--accent);color:#fff":"background:transparent;color:var(--muted)"}" onclick="window._invView='rack';pageInventory()">⊞ Rack</button>
        </div>
      </div>
    </div>

    ${viewMode==="rack" ? renderInvRack(racks,rackMap) : renderInvTable(rows)}
  </div>`);
}

function renderInvTable(rows){
  if(!rows.length) return `<div class="card" style="text-align:center;padding:3rem;color:var(--muted)">No items match your filters.</div>`;

  // Build legend
  const legendItems = [
    ...LISTING_STATUSES.map(s=>{
      const st = LISTING_STATUS_MAP[s]||{bg:"rgba(107,118,148,.12)",color:"#6b7694"};
      const isLive = isLiveStatus(s);
      return `<div style="display:flex;align-items:center;gap:5px;white-space:nowrap">
        ${isLive?`<div style="width:8px;height:8px;border-radius:2px;background:rgba(79,207,142,.4);flex-shrink:0"></div>`:`<div style="width:8px;height:8px;border-radius:2px;background:${st.bg};flex-shrink:0"></div>`}
        <span class="badge" style="background:${st.bg};color:${st.color};font-size:10px;padding:2px 7px">${s}</span>
        ${isLive?`<span style="font-size:10px;color:var(--green)">● row highlight</span>`:""}
      </div>`;
    })
  ].join("");

  return `
  <!-- Listing Status Legend -->
  <div class="card" style="margin-bottom:10px;padding:.75rem 1rem">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--muted)">Listing Status Legend</span>
      <div style="flex:1;height:1px;background:var(--border)"></div>
      <span style="font-size:10px;color:var(--dim)">Rows highlighted green = live listing</span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
      ${legendItems}
    </div>
  </div>

  <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r2);overflow:hidden">
    <div style="overflow-x:auto">
      <table style="width:max-content;min-width:100%">
        <thead><tr style="background:#0d1b3e;position:sticky;top:0;z-index:2">
          ${INV_COLS.map(c=>`<th style="min-width:${c.w}px;white-space:nowrap">${c.label}</th>`).join("")}
          <th style="min-width:70px"></th>
        </tr></thead>
        <tbody>
          ${rows.map(item=>{
            const ls = item.listingStatus||"";
            const rowBg = ({
              "Ebay Live":            "background:rgba(79,207,142,.09);border-left:3px solid #4fcf8e",
              "Amazon Live":          "background:rgba(79,207,142,.09);border-left:3px solid #4fcf8e",
              "Walmart Live":         "background:rgba(79,207,142,.09);border-left:3px solid #4fcf8e",
              "ASIN Live":            "background:rgba(79,207,142,.09);border-left:3px solid #4fcf8e",
              "Deactivated":          "background:rgba(107,118,148,.07);border-left:3px solid #6b7694",
              "OOS":                  "background:rgba(247,92,92,.07);border-left:3px solid #f75c5c",
              "Waiting for response": "background:rgba(247,201,79,.07);border-left:3px solid #f7c94f",
              "Shipped":              "background:rgba(79,142,247,.07);border-left:3px solid #4f8ef7",
              "Trash":                "background:rgba(80,80,80,.07);border-left:3px solid #888",
              "Liquidated":           "background:rgba(251,146,60,.07);border-left:3px solid #fb923c",
              "Fire Sale":            "background:rgba(247,92,92,.12);border-left:3px solid #ff6b6b",
            })[ls] || "";

            // Inline save helper — only when canEdit
            const _ce = canEdit("inventory");
            const iSave = (field, val, isNum=false) =>
              _ce ? `onblur="saveInvField('${item.id}','${field}',this.value,${isNum})" onkeydown="if(event.key==='Enter')this.blur()"` : `disabled style="pointer-events:none;opacity:.6"`;

            return `<tr style="${rowBg}">
            ${INV_COLS.map(c=>{
              const v=item[c.key];
              if(c.type==="listing") return `<td style="position:relative">
                <div onclick="openInlineStatus(event,'${item.id}','listing')" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px" title="Click to change">
                  ${listingStatusBadge(v)}
                  <span style="font-size:9px;color:var(--dim);opacity:.7">▼</span>
                </div>
              </td>`;
              if(c.type==="status") return `<td>${invStatusBadge(v||"Active")}</td>`;
              if(c.type==="rack")    return `<td><input type="text" value="${v||""}" ${iSave("rack")}
                style="background:rgba(79,142,247,.1);border:1px solid rgba(79,142,247,.25);border-radius:6px;
                       padding:3px 7px;color:var(--accent);font-family:var(--mono);font-size:11px;
                       font-weight:700;width:52px;outline:none;text-align:center"></td>`;
              if(c.type==="station") return `<td><input type="text" value="${v||""}" ${iSave("station")}
                style="background:rgba(79,209,197,.1);border:1px solid rgba(79,209,197,.25);border-radius:6px;
                       padding:3px 7px;color:var(--teal);font-family:var(--mono);font-size:11px;
                       font-weight:700;width:52px;outline:none;text-align:center"></td>`;
              if(c.type==="mono")   return `<td class="mono" style="font-size:11px;color:var(--accent)">${v||"—"}</td>`;
              if(c.type==="bold")   return `<td style="font-weight:600;max-width:${c.w}px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${v||"—"}</td>`;
              if(c.type==="tag")    return `<td><span class="tag">${v||"—"}</span></td>`;
              if(c.type==="platform"){
                const platColors={Amazon:"#FF9900",Walmart:"#0071CE",Ebay:"#E53238",AWL:"var(--accent)"};
                const platIcons={Amazon:"🛒",Walmart:"🛍",Ebay:"🏷",AWL:"🏢"};
                if(!v) return `<td style="color:var(--dim);font-size:12px">—</td>`;
                return `<td><span style="font-size:11px;font-weight:700;color:${platColors[v]||"var(--muted)"};background:${platColors[v]||"var(--muted)"}18;border-radius:4px;padding:2px 8px">${platIcons[v]||""} ${v}</span></td>`;
              }
              if(c.type==="num")    return `<td style="color:var(--muted);font-weight:500">${v!=null?num(v):"—"}</td>`;
              if(c.type==="cur")    return `<td style="color:var(--green);font-weight:500">${v!=null?"$"+Number(v).toFixed(2):"—"}</td>`;
              if(c.type==="profit") return `<td style="color:${Number(v)>=0?"var(--green)":"var(--red)"};font-weight:600">${v!=null?"$"+Number(v).toFixed(2):"—"}</td>`;
              if(c.type==="stock"){
                const pct=item.initialStock>0?Math.round((v/item.initialStock)*100):100;
                const col=item.invStatus==="Out of Stock"?"var(--red)":item.invStatus==="Low Stock"?"var(--yellow)":"var(--green)";
                return `<td><div style="display:flex;align-items:center;gap:6px">
                  <input type="number" value="${v||0}" ${iSave("qty",true,true)}
                    style="background:transparent;border:1px solid var(--border);border-radius:var(--r);
                           padding:3px 6px;color:${col};font-weight:700;font-size:12px;
                           font-family:var(--font);width:60px;outline:none">
                  <div style="width:40px;height:4px;background:rgba(255,255,255,.08);border-radius:2px">
                    <div style="width:${pct}%;height:100%;background:${col};border-radius:2px"></div>
                  </div>
                </div></td>`;
              }
              if(c.type==="date")   return `<td style="font-size:12px;color:${v&&new Date(v)<new Date(TODAY)?"var(--red)":v?"var(--muted)":"var(--dim)"}">${v||"—"}</td>`;
              if(c.type==="damaged"){
                const dmg = Number(v)||0;
                return `<td><div style="display:flex;align-items:center;gap:6px">
                  <input type="number" min="0" value="${dmg}" ${iSave("damagedQty",true,true)}
                    style="background:${dmg>0?"rgba(247,92,92,.12)":"transparent"};
                           border:1px solid ${dmg>0?"rgba(247,92,92,.35)":"var(--border)"};
                           border-radius:var(--r);padding:3px 6px;
                           color:${dmg>0?"var(--red)":"var(--muted)"};font-weight:${dmg>0?"700":"400"};
                           font-size:12px;font-family:var(--font);width:60px;outline:none">
                  ${dmg>0?`<span style="font-size:10px;color:var(--red)">⚠</span>`:""}
                </div></td>`;
              }
              if(c.type==="scannedby") return `<td style="font-size:12px;color:var(--muted)">${v||"—"}</td>`;
              if(c.type==="scannedtime") return `<td style="font-size:11px;color:var(--dim);white-space:nowrap">${v||"—"}</td>`;
              if(c.type==="notes"){
                // WH Notes, Response, Action Taken — inline editable
                if(c.key==="whNotes"||c.key==="response"||c.key==="actionTaken"){
                  return `<td style="max-width:${c.w}px">
                    <input type="text" value="${(v||"").replace(/"/g,'&quot;')}" ${iSave(c.key)}
                      style="background:transparent;border:1px solid var(--border);border-radius:var(--r);
                             padding:3px 6px;color:var(--muted);font-size:11px;font-family:var(--font);
                             width:${c.w-8}px;outline:none" placeholder="${c.label}…">
                  </td>`;
                }
                return `<td style="font-size:12px;color:var(--muted);max-width:${c.w}px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${v||""}">${v||"—"}</td>`;
              }
              return `<td style="font-size:13px">${v!=null&&v!==""?v:"—"}</td>`;
            }).join("")}
            <td>${canEdit("inventory")?`<button class="btn btn-info btn-sm" onclick="openInvById('${item.id}')">Edit</button>`:""}</td>
          </tr>`;}).join("")}
        </tbody>
      </table>
    </div>
    <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${rows.length} item${rows.length!==1?"s":""} · ${INV_COLS.length} columns · scroll horizontally to see all</div>
  </div>`;
}

function renderInvRack(racks,rackMap){
  if(!racks.length) return `<div class="card" style="text-align:center;padding:3rem;color:var(--muted)">No items match your filters.</div>`;
  return `<div style="display:flex;flex-direction:column;gap:16px">
    ${racks.map(rack=>{
      const items=rackMap[rack];
      const stations=[...new Set(items.map(i=>i.station||"??"))].sort();
      const hasOut=items.some(i=>i.invStatus==="Out of Stock");
      const hasLow=items.some(i=>i.invStatus==="Low Stock");
      const rackBg=hasOut?"rgba(247,92,92,.08)":hasLow?"rgba(247,201,79,.06)":"rgba(255,255,255,.03)";
      const rackBorder=hasOut?"rgba(247,92,92,.3)":hasLow?"rgba(247,201,79,.2)":"var(--border)";
      return `
      <div style="background:${rackBg};border:1px solid ${rackBorder};border-radius:var(--r2);overflow:hidden">
        <div style="display:flex;align-items:center;gap:12px;padding:.85rem 1.25rem;border-bottom:1px solid ${rackBorder};background:rgba(0,0,0,.2)">
          <div style="width:36px;height:36px;background:rgba(79,142,247,.15);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <svg viewBox="0 0 16 16" fill="none" stroke="var(--accent)" stroke-width="1.5" width="18" height="18"><rect x="1" y="2" width="14" height="3" rx="1"/><rect x="1" y="7" width="14" height="3" rx="1"/><rect x="1" y="12" width="14" height="3" rx="1"/><path d="M3 2v13M13 2v13"/></svg>
          </div>
          <div><div style="font-size:15px;font-weight:700">${rack}</div><div style="font-size:11px;color:var(--muted)">${items.length} items · ${stations.length} stations</div></div>
          <div style="margin-left:auto;display:flex;gap:6px">
            ${hasOut?`<span class="badge" style="background:rgba(247,92,92,.15);color:var(--red)">⚠ OUT</span>`:""}
            ${hasLow&&!hasOut?`<span class="badge" style="background:rgba(247,201,79,.15);color:var(--yellow)">LOW</span>`:""}
            <button class="btn btn-ghost btn-sm" onclick="openInvModal(null,'${rack}')">+ Add</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;padding:12px">
          ${stations.map(stn=>{
            const sItems=items.filter(i=>(i.station||"??")=== stn);
            return `
            <div style="background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.07);border-radius:var(--r);overflow:hidden">
              <div style="padding:7px 12px;background:rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between">
                <span style="font-size:12px;font-weight:700;color:var(--teal)">${rack}-${stn}</span>
                <span style="font-size:10px;color:var(--muted)">${sItems.length} item${sItems.length!==1?"s":""}</span>
              </div>
              ${sItems.map(item=>{
                const col=item.invStatus==="Out of Stock"?"var(--red)":item.invStatus==="Low Stock"?"var(--yellow)":"var(--green)";
                const pct=item.initialStock>0?Math.min(100,Math.round((item.qty/item.initialStock)*100)):100;
                return `
                <div style="padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer" onclick="openInvById('${item.id}')">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;margin-bottom:4px">
                    <div style="flex:1;min-width:0">
                      <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.name}</div>
                      <div style="font-size:10px;color:var(--muted);margin-top:1px">${item.asin||item.id} · ${item.client||""}</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0">
                      <div style="font-size:13px;font-weight:700;color:${col}">${num(item.qty)}</div>
                      <div style="font-size:10px;color:var(--muted)">/ ${num(item.initialStock)} initial</div>
                    </div>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
                    <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${pct}%;background:${col}"></div></div>
                    ${invStatusBadge(item.invStatus||"Active")}
                  </div>
                </div>`;
              }).join("")}
            </div>`;
          }).join("")}
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function openInvModal(item=null, defaultRack=""){
  const isNew=!item;
  const existingRacks=[...new Set(DB.inventory.map(i=>i.rack).filter(Boolean))].sort();
  const existingStations=[...new Set(DB.inventory.map(i=>i.station).filter(Boolean))].sort();
  item=item||{id:"",listingStatus:"",invStatus:"Active",asin:"",upc:"",name:"",client:"",platform:"",storeName:"",expirationDate:"",shippingType:"FBA",initialStock:"",qty:"",weightDimension:"",whNotes:"",unitCost:"",discountedAmount:"",profit:"",manager:currentUser.name,originalInvoice:"",totalShipped:"",response:"",actionTaken:"",totalPurchased:"",confirmedQty:"",rack:defaultRack,station:"",min:"",unit:"pcs",category:"General"};

  openModal(`${mHeader(isNew?"Add Inventory Item":"Edit Inventory Item")}
  <div class="modal-body">

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin-bottom:8px">Product Info</div>
    <div class="form-grid">
      <div class="form-full">${mField("Product Name","name",item.name,"text","",true)}</div>
      ${mField("Listing Status","listingStatus",item.listingStatus||"","select",","+LISTING_STATUSES.join(","))}
      <div class="form-group">
        <label class="form-label">Stock Status <span style="font-size:10px;color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">— auto-calculated from Remaining Stock</span></label>
        <div style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--r)">
          ${invStatusBadge(calcInvStatus(item.qty||0))}
          <span style="font-size:11px;color:var(--dim)">0 = Out of Stock · 1–20 = Low Stock · 21+ = Active</span>
        </div>
        <input type="hidden" name="invStatus" value="${calcInvStatus(item.qty||0)}">
      </div>
      ${mField("Category","category",item.category||"General","select","Mechanical,Electrical,PPE,Hardware,Chemical,Electronics,General,Other")}
      ${mField("ASIN","asin",item.asin,"text","e.g. B08N5WRWNW")}
      ${mField("UPC","upc",item.upc,"text","e.g. 012345678901")}
      ${clientSelect("client", item.client, false)}
      ${mField("Platform","platform",item.platform||"","select","Amazon,Walmart,Ebay,AWL")}
      ${mField("Store Name","storeName",item.storeName,"text","e.g. AW Main Store")}
      ${mField("Shipping Type","shippingType",item.shippingType||"FBA","select","FBA,FBM,3PL,Other")}
      ${mField("Expiration Date","expirationDate",item.expirationDate,"date")}
      ${mField("Weight & Dimensions","weightDimension",item.weightDimension,"text",'e.g. 2.5 lbs · 12"×8"×6"')}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Stock</div>
    <div class="form-grid">
      ${mField("Initial Stock","initialStock",item.initialStock,"number","",true)}
      ${mField("Remaining Stock","qty",item.qty,"number","",true)}
      ${mField("Min. Stock Level","min",item.min,"number")}
      ${mField("Unit","unit",item.unit||"pcs","select","pcs,units,m,kg,L,boxes,rolls,sets")}
      ${mField("Total Purchased","totalPurchased",item.totalPurchased,"number")}
      ${mField("Confirmed Qty","confirmedQty",item.confirmedQty,"number")}
      ${mField("Damaged Items","damagedQty",item.damagedQty||0,"number","Number of damaged units")}
      ${mField("Total Shipped","totalShipped",item.totalShipped,"number")}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Financials</div>
    <div class="form-grid">
      ${mField("Unit Cost ($)","unitCost",item.unitCost,"number")}
      ${mField("Discounted Amount ($)","discountedAmount",item.discountedAmount,"number")}
      ${mField("Profit ($)","profit",item.profit,"number")}
      ${mField("Original Invoice","originalInvoice",item.originalInvoice,"text","e.g. INV-2026-001")}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Warehouse & Management</div>
    <div class="form-grid">
      ${mField("Manager","manager",item.manager,"text","e.g. Maria Santos")}
      <div class="form-group">
        <label class="form-label">Rack <span style="color:var(--red)">*</span></label>
        <select class="form-input" name="rack">
          <option value="">— Select Rack —</option>
          ${Array.from({length:40},(_,i)=>`<option value="R${i+1}"${(item.rack||"")==="R"+(i+1)?" selected":""}>R${i+1}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Station <span style="color:var(--red)">*</span></label>
        <select class="form-input" name="station">
          <option value="">— Select Station —</option>
          ${["S1","S2","S3"].map(s=>`<option value="${s}"${(item.station||"")===s?" selected":""}>${s}</option>`).join("")}
        </select>
      </div>
      <div class="form-full" style="background:rgba(79,209,197,.05);border:1px solid rgba(79,209,197,.2);border-radius:var(--r);padding:9px 12px;display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;color:var(--muted)">Location:</span>
        <span id="loc-preview" style="font-family:var(--mono);font-size:13px;font-weight:700;color:var(--teal)">${item.rack&&item.station?item.rack+"-"+item.station:"—"}</span>
      </div>
      <div class="form-full">${mField("WH Notes","whNotes",item.whNotes,"textarea")}</div>
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Response & Actions</div>
    <div class="form-grid">
      <div class="form-full">${mField("Response","response",item.response,"textarea")}</div>
      <div class="form-full">${mField("Action Taken","actionTaken",item.actionTaken,"textarea")}</div>
    </div>

    ${item.id?`<div style="font-size:11px;color:var(--dim);margin-top:4px">ID: <span class="mono">${item.id}</span></div>`:""}
  </div>
  ${mFooter("saveInv('"+item.id+"')",item.id?"confirm2('Delete this inventory item?',()=>delRecord('inventory','"+item.id+"'))":"")}`,true);

  setTimeout(()=>{
    const rIn=document.querySelector('[name="rack"]'),sIn=document.querySelector('[name="station"]');
    const upd=()=>{const p=document.getElementById("loc-preview");if(p)p.textContent=(rIn?.value&&sIn?.value)?rIn.value+"-"+sIn.value:rIn?.value||sIn?.value||"—";};
    rIn?.addEventListener("input",upd); sIn?.addEventListener("input",upd);
  },50);
}

// Safe edit — looks up item by ID so no JSON serialization corruption
function openInvById(id){
  const item = DB.inventory.find(x=>x.id===id);
  if(item) openInvModal(item);
}

function saveInvField(id, field, value, isNum=false){
  const item = DB.inventory.find(x=>x.id===id);
  if(!item) return;
  item[field] = isNum ? (Number(value)||0) : value;
  // Recalculate stock status when qty changes
  if(field==="qty"){
    item.qty = Number(value)||0;
    item.invStatus = calcInvStatus(item.qty);
  }
  // Notify warehouse + CS/Manager + Purchasers when damagedQty is updated
  if(field==="damagedQty" && Number(value) > 0){
    const targets = new Set();
    DB.employees.forEach(emp=>{
      if(!emp.username) return;
      if(emp.role==="Warehouse"||emp.role==="Admin"||emp.role==="Purchaser") targets.add(emp.username);
      if((emp.role==="Manager"||emp.role==="Customer Service")&&
         (emp.assignedClients||[]).some(c=>c===(item.client||"")||( item.client||"").startsWith(c.split(" ")[0])))
        targets.add(emp.username);
    });
    USERS.forEach(u=>{ if(u.role==="Admin"||u.role==="Warehouse"||u.role==="Purchaser"||u.role==="Manager") targets.add(u.username); });
    if(targets.size>0){
      if(!DB.notifications) DB.notifications=[];
      DB.notifications.unshift({
        id:uid("NTF"), type:"damage",
        title:`⚠️ Damage Updated — ${item.name}`,
        body:`Damaged qty set to ${value} · Client: ${item.client||"—"} · By: ${currentUser?.name||currentUser?.username}`,
        link:"inventory",
        time:nowCA().ts.slice(0,16),
        read:[], for:[...targets]
      });
      refreshNotifBadge(); buildNav();
    }
  }
  saveToLocalStorage();
  showToast("Saved","var(--green)");
}

function saveInv(id){
  try{
    const n=mVal("name");
    if(!n){ showToast("❌ Product Name is required.","var(--red)"); return; }

    const r=mVal("rack"), s=mVal("station");
    const rec={
      id:id||uid("PRD"),
      listingStatus:mVal("listingStatus")||"",
      invStatus:mVal("invStatus")||"Active",
      asin:mVal("asin"),upc:mVal("upc"),
      name:n,
      client:mVal("client"),platform:mVal("platform")||""   ,storeName:mVal("storeName"),
      expirationDate:mVal("expirationDate"),
      shippingType:mVal("shippingType"),
      initialStock:Number(mVal("initialStock"))||0,
      qty:Number(mVal("qty"))||0,
      min:Number(mVal("min"))||0,
      unit:mVal("unit")||"pcs",
      weightDimension:mVal("weightDimension"),
      whNotes:mVal("whNotes"),
      unitCost:Number(mVal("unitCost"))||0,
      discountedAmount:Number(mVal("discountedAmount"))||0,
      profit:Number(mVal("profit"))||0,
      manager:mVal("manager"),
      originalInvoice:mVal("originalInvoice"),
      totalShipped:Number(mVal("totalShipped"))||0,
      response:mVal("response"),
      actionTaken:mVal("actionTaken"),
      totalPurchased:Number(mVal("totalPurchased"))||0,
      confirmedQty:Number(mVal("confirmedQty"))||0,
      damagedQty:Number(mVal("damagedQty"))||0,
      rack:r?r.toUpperCase():"",
      station:s?s.toUpperCase():"",
      category:mVal("category")||"General",
    };

    // Auto-set invStatus based on qty thresholds (0 = Out of Stock, ≤20 = Low Stock)
    // Only override if not manually set to Inactive/Discontinued
    if(rec.invStatus==="Active"||rec.invStatus==="Low Stock"||rec.invStatus==="Out of Stock"){
      rec.invStatus = calcInvStatus(rec.qty);
    }

    upsert("inventory",rec);
    notifyOnSave("inventory",rec,!id);
    if(checkFireSale(rec)){
      closeModal();
      pageInventory();
      return;
    }

    // Auto-archive if listing status is OOS / Trash / Shipped
    if(checkAndArchive(rec)){
      closeModal();
      showToast(`"${rec.name}" archived (${rec.listingStatus})`, "var(--yellow)");
      pageInventory();
      return;
    }

    closeModal();
    showToast("✓ Inventory item saved","var(--green)");

    // Notify CS reps — wrapped safely
    try{
      if(rec.client){
        const st=rec.invStatus;
        if(st==="Out of Stock"||st==="Low Stock"){
          pushClientNotif("stock",`${st}: ${rec.name}`,`${rec.client} · ${num(rec.qty)} remaining`,"inventory",rec.client);
        }
      }
    } catch(e){ console.warn("Notification error:",e); }

    triggerWebhook("inventory.updated",rec);
    // Re-check expiry immediately if this item has an expiration date
    if(rec.expirationDate) setTimeout(()=>checkExpiryNotifications(true), 100);
    pageInventory();
  } catch(e){
    console.error("saveInv error:",e);
    showToast("❌ Save failed: "+e.message,"var(--red)");
  }
}

function exportInvCSV(){
  const cols=["Listing Status",...INV_COLS.filter(c=>c.key!=="listingStatus").map(c=>c.label)];
  cols.push("Rack","Station","Location");
  const rows=DB.inventory.map(b=>{
    const r=INV_COLS.map(c=>{const v=b[c.key];return v==null?"":String(v).includes(",")?`"${v}"`:String(v);});
    r.push(b.rack||"",b.station||"",(b.rack||"")+"–"+(b.station||""));
    return r.join(",");
  });
  const csv=[cols.join(","),...rows].join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download="AW_Inventory_"+TODAY+".csv";
  a.click();
  showToast("Inventory exported","var(--green)");
}

function openRackManager(){
  // Build rack/station summary
  const rackMap={};
  DB.inventory.forEach(i=>{
    const r=i.rack||"Unassigned";
    if(!rackMap[r]) rackMap[r]={stations:new Set(),items:0};
    rackMap[r].stations.add(i.station||"??");
    rackMap[r].items++;
  });
  const racks=Object.keys(rackMap).sort();

  openModal(`${mHeader("Rack & Station Manager")}
  <div class="modal-body">
    <div style="font-size:13px;color:var(--muted);margin-bottom:14px;line-height:1.6">
      Racks and stations are created automatically when you add items. To add a new rack or station, simply add an item and type a new rack/station label (e.g. <span class="mono" style="color:var(--teal)">R4</span>, <span class="mono" style="color:var(--teal)">S5</span>).
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${racks.map(r=>{
        const info=rackMap[r];
        const stns=[...info.stations].sort();
        return `
        <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--r);padding:12px 14px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:8px">
              <svg viewBox="0 0 16 16" fill="none" stroke="var(--accent)" stroke-width="1.5" width="15" height="15"><rect x="1" y="2" width="14" height="3" rx="1"/><rect x="1" y="7" width="14" height="3" rx="1"/><rect x="1" y="12" width="14" height="3" rx="1"/><path d="M3 2v13M13 2v13"/></svg>
              <span style="font-weight:700;font-size:14px">${r}</span>
            </div>
            <span style="font-size:11px;color:var(--muted)">${info.items} item${info.items!==1?"s":""}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${stns.map(s=>`
              <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(79,209,197,.08);border:1px solid rgba(79,209,197,.2);border-radius:20px;padding:3px 10px">
                <svg viewBox="0 0 16 16" fill="none" stroke="var(--teal)" stroke-width="1.5" width="10" height="10"><rect x="2" y="1" width="12" height="14" rx="1.5"/></svg>
                <span style="font-size:12px;font-weight:600;color:var(--teal)">${r}-${s}</span>
                <span style="font-size:10px;color:var(--muted)">${DB.inventory.filter(i=>i.rack===r&&i.station===s).length} items</span>
              </div>`).join("")}
            <button class="btn btn-ghost btn-sm" style="border-radius:20px;font-size:11px" onclick="closeModal();openInvModal(null,'${r}')">+ Add item to ${r}</button>
          </div>
        </div>`;
      }).join("")}
      <button class="btn btn-primary btn-sm" style="margin-top:4px" onclick="closeModal();openInvModal()">+ Add Item to New Rack</button>
    </div>
  </div>
  <div class="modal-footer" style="justify-content:flex-end"><button class="btn btn-ghost btn-sm" onclick="closeModal()">Close</button></div>`,true);
}

// ═══════════════════════════════════════════════
//  PAGE: FIRE SALE
// ═══════════════════════════════════════════════

