// ── 17-scan.js ──

function pageScan(){
  _scanActive  = true;
  _pendingItem = null;
  _pendingNewUPC = null;
  if(!_scanMode) _scanMode = "shipout";

  const todayScans  = DB.scanLog.filter(s => s.scannedAt.startsWith(TODAY));
  const shipOutToday= todayScans.filter(s=>s.mode==="shipout").length;
  const rcvToday    = todayScans.filter(s=>s.mode==="receiving").length;
  const dmgToday    = todayScans.filter(s=>s.mode==="damage").length;
  const lowCnt      = DB.inventory.filter(i=>i.invStatus==="Low Stock").length;
  const outCnt      = DB.inventory.filter(i=>i.invStatus==="Out of Stock").length;

  const isShipout = _scanMode === "shipout";
  const isDamage  = _scanMode === "damage";
  const modeColor = isShipout?"var(--red)":isDamage?"var(--orange)":"var(--green)";
  const modeLabel = isShipout?"Ship Out":isDamage?"Damage":"Receiving";
  const modeIcon  = isShipout?"📤":isDamage?"⚠️":"📥";

  render(`
  <div>
    <style>
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      @keyframes scanFlash{0%{background:rgba(79,142,247,.2)}100%{background:transparent}}
      @keyframes slideIn{from{transform:translateY(-8px);opacity:0}to{transform:translateY(0);opacity:1}}
      .scan-flash{animation:scanFlash .5s ease-out forwards}
      .slide-in{animation:slideIn .2s ease-out forwards}
    </style>

    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="page-title" style="display:flex;align-items:center;gap:10px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;background:rgba(79,142,247,.15);border-radius:8px;font-size:18px">▦</span>
          UPC Scan Station
        </div>
        <div class="page-sub">USB barcode scanner ready · Admin &amp; Warehouse only</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--green);background:rgba(79,207,142,.1);border:1px solid rgba(79,207,142,.2);border-radius:20px;padding:5px 12px">
          <span style="width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);animation:pulse 2s infinite"></span>
          Scanner Active
        </span>
        <button class="btn btn-ghost btn-sm" onclick="navigate('inventory')">View Inventory →</button>
      </div>
    </div>

    <!-- Mode toggle -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:1.25rem">
      <div onclick="setScanMode('shipout')" style="cursor:pointer;padding:1.1rem 1.25rem;border-radius:var(--r2);border:2px solid ${isShipout?"var(--red)":"var(--border)"};background:${isShipout?"rgba(247,92,92,.07)":"rgba(255,255,255,.03)"};transition:all .2s">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <span style="font-size:22px">📤</span>
          <div>
            <div style="font-size:14px;font-weight:700;color:${isShipout?"var(--red)":"var(--text)"}">Ship Out</div>
            <div style="font-size:11px;color:var(--muted)">Deducts from remaining stock</div>
          </div>
          ${isShipout?`<span style="margin-left:auto;font-size:10px;font-weight:700;background:var(--red);color:#fff;border-radius:20px;padding:2px 10px">ACTIVE</span>`:""}
        </div>
        <div style="font-size:12px;color:var(--muted)">Scan UPC of items being shipped out.</div>
      </div>
      <div onclick="setScanMode('receiving')" style="cursor:pointer;padding:1.1rem 1.25rem;border-radius:var(--r2);border:2px solid ${!isShipout&&!isDamage?"var(--green)":"var(--border)"};background:${!isShipout&&!isDamage?"rgba(79,207,142,.07)":"rgba(255,255,255,.03)"};transition:all .2s">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <span style="font-size:22px">📥</span>
          <div>
            <div style="font-size:14px;font-weight:700;color:${!isShipout&&!isDamage?"var(--green)":"var(--text)"}">Receiving</div>
            <div style="font-size:11px;color:var(--muted)">Adds to existing stock</div>
          </div>
          ${!isShipout&&!isDamage?`<span style="margin-left:auto;font-size:10px;font-weight:700;background:var(--green);color:#000;border-radius:20px;padding:2px 10px">ACTIVE</span>`:""}
        </div>
        <div style="font-size:12px;color:var(--muted)">Scan UPC of items being received.</div>
      </div>
      <div onclick="setScanMode('damage')" style="cursor:pointer;padding:1.1rem 1.25rem;border-radius:var(--r2);border:2px solid ${isDamage?"var(--orange)":"var(--border)"};background:${isDamage?"rgba(251,146,60,.07)":"rgba(255,255,255,.03)"};transition:all .2s">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <span style="font-size:22px">⚠️</span>
          <div>
            <div style="font-size:14px;font-weight:700;color:${isDamage?"var(--orange)":"var(--text)"}">Damage</div>
            <div style="font-size:11px;color:var(--muted)">Deducts stock, logs as damaged</div>
          </div>
          ${isDamage?`<span style="margin-left:auto;font-size:10px;font-weight:700;background:var(--orange);color:#fff;border-radius:20px;padding:2px 10px">ACTIVE</span>`:""}
        </div>
        <div style="font-size:12px;color:var(--muted)">Scan damaged items — deducted from stock and added to damaged count.</div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="metrics metrics-4" style="margin-bottom:1.25rem">
      ${metric("Shipped Out Today",shipOutToday,"","var(--red)")}
      ${metric("Received Today",rcvToday,"","var(--green)")}
      ${metric("Damaged Today",dmgToday,"","var(--orange)")}
      ${metric("Out of Stock",outCnt,"","var(--red)")}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">

      <!-- LEFT: scan input + result -->
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="card" style="border:2px solid ${isShipout?"rgba(247,92,92,.35)":isDamage?"rgba(251,146,60,.35)":"rgba(79,207,142,.35)"}">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span style="font-size:16px">${modeIcon}</span>
            <div style="font-size:12px;font-weight:700;color:${modeColor}">${modeLabel.toUpperCase()} MODE</div>
          </div>
          <!-- UPC input only — client is chosen AFTER scan -->
          <div style="display:flex;gap:8px">
            <input id="upc-input" class="form-input"
              placeholder="Scan UPC barcode or type UPC…"
              style="flex:1;font-size:15px;font-family:var(--mono);letter-spacing:.05em"
              autocomplete="off"
              onkeydown="if(event.key==='Enter'){handleUPCScan(this.value.trim());this.value='';}">
            <button class="btn ${isShipout?"btn-danger":isDamage?"btn-warning":"btn-success"}" onclick="handleUPCScan(document.getElementById('upc-input').value.trim());document.getElementById('upc-input').value=''">
              ${modeLabel}
            </button>
          </div>
          <div style="font-size:11px;color:var(--dim);margin-top:8px">USB scanner auto-submits · Manual: type UPC → Enter · Client is selected after scan</div>
        </div>

        <div id="scan-result-panel" style="min-height:200px">
          <div class="card" style="text-align:center;padding:2rem;min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">
            <div style="font-size:38px;opacity:.2">${modeIcon}</div>
            <div style="color:var(--muted);font-size:13px">Scan a UPC to ${modeLabel.toLowerCase()} an item</div>
            <div style="font-size:11px;color:var(--dim)">Active mode: <strong style="color:${modeColor}">${modeLabel}</strong></div>
          </div>
        </div>
      </div>

      <!-- RIGHT: stock levels -->
      <div class="card">
        <div class="card-title">Current Stock Levels</div>
        <div style="display:flex;flex-direction:column;gap:5px;max-height:420px;overflow-y:auto" id="inv-quickview">
          ${DB.inventory.map(item=>{
            const pct = item.initialStock>0?Math.min(100,Math.round((item.qty/item.initialStock)*100)):100;
            const col = item.invStatus==="Out of Stock"?"var(--red)":item.invStatus==="Low Stock"?"var(--yellow)":"var(--green)";
            const loc=(item.rack||"?")+"-"+(item.station||"?");
            return `<div id="inv-row-${item.id}" style="padding:6px 0;border-bottom:1px solid var(--border)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                <div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1">
                  <span style="font-size:9px;font-weight:700;color:var(--teal);background:rgba(79,209,197,.1);border-radius:3px;padding:1px 4px;flex-shrink:0">${loc}</span>
                  <span style="font-size:12px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.name}</span>
                </div>
                <div style="display:flex;align-items:center;gap:5px;flex-shrink:0">
                  <span id="qty-${item.id}" style="font-size:12px;font-weight:700;color:${col}">${item.qty}</span>
                  <span style="font-size:10px;color:var(--dim)">/ ${item.initialStock}</span>
                  ${invStatusBadge(item.invStatus||"Active")}
                </div>
              </div>
              <div class="progress-bar"><div id="bar-${item.id}" class="progress-fill" style="width:${pct}%;background:${col}"></div></div>
            </div>`;
          }).join("")}
        </div>
      </div>
    </div>

    <!-- Scan Log -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="card-title" style="margin:0">Scan Log</div>
        <div style="display:flex;gap:8px;align-items:center">
          <span style="font-size:11px;color:var(--muted)">${DB.scanLog.length} total entries</span>
          <button class="btn btn-ghost btn-sm" onclick="exportScanLog()">↓ Export</button>
        </div>
      </div>
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th>Scan ID</th><th>Mode</th><th>UPC</th><th>Product</th><th>Client</th>
            <th>Qty Before</th><th>Qty After</th><th>Change</th>
            <th>By</th><th>Date & Time</th><th>Status</th>
          </tr></thead>
          <tbody id="scan-log-body">${renderScanLogRows()}</tbody>
        </table>
      </div>
    </div>
  </div>`);

  setTimeout(()=>{ document.getElementById("upc-input")?.focus(); }, 100);
}

function setScanMode(mode){
  _scanMode = mode;
  _pendingItem = null;
  _pendingNewUPC = null;
  pageScan();
}

function renderScanLogRows(){
  return DB.scanLog.slice().reverse().slice(0,100).map(s=>{
    const change = s.qtyAfter - s.qtyBefore;
    const changeColor = change > 0 ? "var(--green)" : change < 0 ? "var(--red)" : "var(--muted)";
    const modeColor = s.mode==="shipout"?"var(--red)":s.mode==="damage"?"var(--orange)":"var(--green)";
    const modeLabel = s.mode==="shipout"?"📤 Ship Out":s.mode==="damage"?"⚠️ Damage":"📥 Receiving";
    return `<tr id="log-${s.id}">
      <td class="mono text-muted" style="font-size:11px">${s.id}</td>
      <td style="font-size:11px;font-weight:600;color:${modeColor}">${modeLabel}</td>
      <td class="mono" style="color:var(--accent);font-size:12px">${s.upc||s.sku||"—"}</td>
      <td class="fw6">${s.product}</td>
      <td style="font-size:12px;color:var(--accent)">${s.client||"—"}</td>
      <td class="text-muted">${s.qtyBefore}</td>
      <td style="font-weight:600;color:${s.qtyAfter===0?"var(--red)":"var(--text)"}">${s.qtyAfter}</td>
      <td style="color:${changeColor};font-weight:700">${change>0?"+":""}${change}</td>
      <td class="text-muted">${s.scannedBy}</td>
      <td class="text-muted" style="font-size:11px">${s.scannedAt}</td>
      <td>${invStatusBadge(s.status||"Active")}</td>
    </tr>`;
  }).join("");
}

// ── Main scan handler — scan UPC first, then always pick client ──
function handleUPCScan(upc){
  if(!upc) return;
  const panel = document.getElementById("scan-result-panel");
  if(!panel) return;

  // Find ALL inventory items that match this UPC
  const matchingItems = DB.inventory.filter(i=>
    i.upc === upc ||
    i.upc === upc.replace(/^0+/,"") ||
    i.id  === upc.toUpperCase()
  );

  if(_scanMode === "shipout"){
    if(matchingItems.length === 0){
      // UPC not in inventory at all
      panel.innerHTML = `
        <div class="card slide-in" style="border:1px solid rgba(247,92,92,.35);text-align:center;padding:2rem;display:flex;flex-direction:column;align-items:center;gap:12px">
          <div style="font-size:34px">✕</div>
          <div style="font-size:15px;font-weight:700;color:var(--red)">UPC Not Found</div>
          <div class="mono" style="font-size:13px;color:var(--muted)">${upc}</div>
          <div style="font-size:12px;color:var(--muted)">This UPC is not in inventory. Nothing to ship out.</div>
        </div>`;
      playBeep("error"); refocusScan(); return;
    }
    // Always show picker — even 1 match, so user confirms which client
    showScanClientPicker(upc, matchingItems, panel, "shipout");

  } else if(_scanMode === "damage"){
    if(matchingItems.length === 0){
      panel.innerHTML = `
        <div class="card slide-in" style="border:1px solid rgba(251,146,60,.35);text-align:center;padding:2rem;display:flex;flex-direction:column;align-items:center;gap:12px">
          <div style="font-size:34px">🔍</div>
          <div style="font-size:15px;font-weight:700;color:var(--orange)">UPC Not Found</div>
          <div class="mono" style="font-size:13px;color:var(--muted)">${upc}</div>
          <div style="font-size:12px;color:var(--muted)">This UPC is not in inventory.</div>
        </div>`;
      playBeep("error"); refocusScan(); return;
    }
    showScanClientPicker(upc, matchingItems, panel, "damage");

  } else {
    // RECEIVING — always show picker too
    // For receiving, show matching clients + always an "Add as new item" option
    showScanClientPicker(upc, matchingItems, panel, "receiving");
  }
}

// ── Dynamic client picker shown AFTER scanning ──
function showScanClientPicker(upc, matchingItems, panel, mode){
  const isShipout = mode === "shipout";
  const isDamage  = mode === "damage";
  const accentColor = isShipout ? "var(--red)" : isDamage ? "var(--orange)" : "var(--green)";
  const borderColor = isShipout ? "rgba(247,92,92,.3)" : isDamage ? "rgba(251,146,60,.3)" : "rgba(79,207,142,.3)";
  const modeLabel   = isShipout ? "SHIP OUT" : isDamage ? "DAMAGE" : "RECEIVING";
  const modeIcon    = isShipout ? "📤" : isDamage ? "⚠️" : "📥";
  const hasMatches  = matchingItems.length > 0;

  const clientsWithUPC = matchingItems.map(i=>({
    client: i.client||"(No client)",
    item: i,
    qty: i.qty,
    status: i.invStatus||"Active"
  }));

  const renderClientRows = (filter="") => {
    const filtered = filter
      ? clientsWithUPC.filter(c=>c.client.toLowerCase().includes(filter.toLowerCase()))
      : clientsWithUPC;
    if(!filtered.length) return `<div style="padding:14px;text-align:center;font-size:12px;color:var(--muted)">No clients match your search</div>`;
    return filtered.map((c,idx)=>{
      const stColor = c.status==="Out of Stock"?"var(--red)":c.status==="Low Stock"?"var(--yellow)":"var(--green)";
      const disabled = (isShipout||isDamage) && c.qty <= 0;
      const dataId = `scan-client-row-${idx}`;
      return `
      <div id="${dataId}"
        data-upc="${upc.replace(/"/g,'&quot;')}"
        data-client="${c.client.replace(/"/g,'&quot;')}"
        data-mode="${mode}"
        data-disabled="${disabled}"
        onclick="handleScanClientRowClick(this)"
        style="display:flex;justify-content:space-between;align-items:center;
               padding:12px 16px;border-bottom:1px solid var(--border);
               cursor:${disabled?"not-allowed":"pointer"};opacity:${disabled?0.45:1};
               transition:background .12s"
        ${disabled?"":"onmouseover=\"this.style.background='rgba(255,255,255,.07)'\" onmouseout=\"this.style.background=''\" "}>
        <div style="min-width:0;flex:1">
          <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.client}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.item.name}</div>
          <div style="font-size:10px;color:var(--dim);margin-top:1px">${(c.item.rack||"?")+"-"+(c.item.station||"?")}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:12px">
          <div style="font-size:16px;font-weight:700;color:${stColor}">${c.qty}</div>
          <div style="font-size:10px;color:var(--muted)">${c.item.unit}</div>
          <div style="margin-top:3px">${invStatusBadge(c.status)}</div>
          ${disabled?`<div style="font-size:10px;color:var(--red);margin-top:2px">Out of stock</div>`:""}
        </div>
      </div>`;
    }).join("");
  };

  panel.innerHTML = `
    <div class="card slide-in" style="border:2px solid ${borderColor}">

      <!-- Header -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span style="font-size:24px">${isShipout?"📤":"📥"}</span>
        <div>
          <div style="font-size:14px;font-weight:700;color:${accentColor}">
            ${modeIcon} ${modeLabel} — Choose Client
          </div>
          <div class="mono" style="font-size:11px;color:var(--muted)">
            UPC: ${upc}${hasMatches?" · "+clientsWithUPC.length+" client"+(clientsWithUPC.length!==1?"s":"")+" found":""}
          </div>
        </div>
      </div>

      ${hasMatches ? `
      <!-- Search -->
      <div style="margin-bottom:8px">
        <input class="form-input" id="scan-picker-search" placeholder="🔍 Search client name…"
          style="font-size:13px;width:100%" autocomplete="off"
          oninput="updateScanPickerSearch(this.value,'${upc.replace(/'/g,"&#39;")}','${mode}')">
      </div>

      <!-- Client list -->
      <div id="scan-picker-list"
        style="max-height:260px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r);background:rgba(0,0,0,.2);margin-bottom:10px">
        ${renderClientRows()}
      </div>` : `
      <div style="padding:14px;text-align:center;font-size:13px;color:var(--muted);background:rgba(255,255,255,.03);border-radius:var(--r);margin-bottom:10px">
        This UPC is not in inventory yet.
      </div>`}

      ${!isShipout&&!isDamage ? `
      <!-- Add as new item -->
      <div data-upc="${upc.replace(/"/g,'&quot;')}" data-client="__new__" data-mode="receiving" data-disabled="false"
        onclick="handleScanClientRowClick(this)"
        style="display:flex;align-items:center;gap:12px;padding:12px 14px;
               background:rgba(79,207,142,.07);border:1px solid rgba(79,207,142,.25);
               border-radius:var(--r);cursor:pointer;margin-bottom:10px;transition:background .15s"
        onmouseover="this.style.background='rgba(79,207,142,.14)'" onmouseout="this.style.background='rgba(79,207,142,.07)'">
        <span style="font-size:22px;flex-shrink:0">🆕</span>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--green)">Add as New Item</div>
          <div style="font-size:11px;color:var(--muted);margin-top:1px">
            ${hasMatches?"This UPC exists for other clients — add it for a new client":"Add this UPC to inventory for a client"}
          </div>
        </div>
      </div>` : ""}

      <button class="btn btn-ghost btn-sm" style="width:100%" onclick="cancelScan()">✕ Cancel</button>
    </div>`;

  playBeep("found");
  setTimeout(()=>{ document.getElementById("scan-picker-search")?.focus(); }, 80);
}

function handleScanClientRowClick(el){
  if(el.dataset.disabled==="true") return;
  pickScanClient(el.dataset.upc, el.dataset.client, el.dataset.mode);
}

function updateScanPickerSearch(q, upc, mode){
  const isShipout = mode === "shipout";
  const matchingItems = DB.inventory.filter(i=>
    i.upc===upc || i.upc===upc.replace(/^0+/,"") || i.id===upc.toUpperCase()
  );
  const clientsWithUPC = matchingItems.map(i=>({
    client: i.client||"(No client)", item:i, qty:i.qty, status:i.invStatus||"Active"
  }));
  const list = document.getElementById("scan-picker-list");
  if(!list) return;
  const filtered = clientsWithUPC.filter(c=>!q||c.client.toLowerCase().includes(q.toLowerCase()));
  list.innerHTML = filtered.map((c,idx)=>{
    const stColor = c.status==="Out of Stock"?"var(--red)":c.status==="Low Stock"?"var(--yellow)":"var(--green)";
    const disabled = (isShipout||mode==="damage") && c.qty <= 0;
    return `<div
      data-upc="${upc.replace(/"/g,'&quot;')}"
      data-client="${c.client.replace(/"/g,'&quot;')}"
      data-mode="${mode}"
      data-disabled="${disabled}"
      onclick="handleScanClientRowClick(this)"
      style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;
             border-bottom:1px solid var(--border);cursor:${disabled?"not-allowed":"pointer"};opacity:${disabled?0.4:1}"
      ${disabled?"":"onmouseover=\"this.style.background='rgba(255,255,255,.06)'\" onmouseout=\"this.style.background=''\"  "}>
      <div>
        <div style="font-size:13px;font-weight:600">${c.client}</div>
        <div style="font-size:11px;color:var(--muted)">${c.item.name}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:14px;font-weight:700;color:${stColor}">${c.qty} <span style="font-size:10px;color:var(--muted)">${c.item.unit}</span></div>
        ${invStatusBadge(c.status)}
      </div>
    </div>`;
  }).join("") || `<div style="padding:12px;text-align:center;font-size:12px;color:var(--muted)">No clients match</div>`;
}

function pickScanClient(upc, clientName, mode){
  const panel = document.getElementById("scan-result-panel");
  if(!panel) return;

  if(clientName === "__new__"){
    showAddNewItemForm(upc, "");
    return;
  }

  const item = DB.inventory.find(i=>
    (i.upc===upc || i.upc===upc.replace(/^0+/,"") || i.id===upc.toUpperCase()) &&
    (i.client===clientName || (!i.client && clientName==="(No client)"))
  );

  if(mode === "shipout"){
    handleShipOut(upc, item||null, panel, clientName, null);
  } else if(mode === "damage"){
    handleDamage(upc, item||null, panel, clientName, null);
  } else {
    handleReceiving(upc, item||null, panel, clientName, null);
  }
}

// ── SHIP OUT: deduct 1 from remaining stock ──
function handleShipOut(upc, item, panel, clientSel, byUPC){
  if(!item){
    // Check if UPC exists but belongs to a different client
    if(byUPC){
      panel.innerHTML = `
        <div class="card slide-in" style="border:1px solid rgba(247,201,79,.35);text-align:center;padding:2rem;display:flex;flex-direction:column;align-items:center;gap:12px">
          <div style="font-size:34px">⚠</div>
          <div style="font-size:15px;font-weight:700;color:var(--yellow)">Client Mismatch</div>
          <div style="font-size:14px;font-weight:600">${byUPC.name}</div>
          <div style="font-size:12px;color:var(--muted)">This UPC belongs to <strong style="color:var(--text)">${byUPC.client||"No client"}</strong>, not <strong style="color:var(--accent)">${clientSel}</strong>.</div>
          <div style="font-size:11px;color:var(--dim)">Change the client selector or check your inventory.</div>
        </div>`;
      playBeep("error");
      refocusScan();
      return;
    }
    panel.innerHTML = `
      <div class="card slide-in" style="border:1px solid rgba(247,92,92,.35);text-align:center;padding:2rem;display:flex;flex-direction:column;align-items:center;gap:12px">
        <div style="font-size:34px">✕</div>
        <div style="font-size:15px;font-weight:700;color:var(--red)">UPC Not Found</div>
        <div class="mono" style="font-size:13px;color:var(--muted)">${upc}</div>
        <div style="font-size:12px;color:var(--muted)">No item with this UPC for client <strong style="color:var(--accent)">${clientSel}</strong>.</div>
      </div>`;
    playBeep("error");
    refocusScan();
    return;
  }

  if(item.qty <= 0){
    panel.innerHTML = `
      <div class="card slide-in" style="border:1px solid rgba(247,92,92,.4);text-align:center;padding:2rem;display:flex;flex-direction:column;align-items:center;gap:12px">
        <div style="font-size:34px">⚠</div>
        <div style="font-size:15px;font-weight:700;color:var(--red)">Out of Stock</div>
        <div style="font-size:14px;font-weight:600">${item.name}</div>
        <div style="font-size:12px;color:var(--muted)">Client: <strong style="color:var(--accent)">${clientSel}</strong></div>
        <div style="font-size:12px;color:var(--red)">Remaining stock is 0 — cannot ship out.</div>
      </div>`;
    playBeep("error");
    refocusScan();
    return;
  }

  // Show qty input card
  _pendingItem = item;
  panel.innerHTML = `
    <div class="card slide-in" style="border:2px solid rgba(247,92,92,.3)">
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px">
        <span style="font-size:28px;flex-shrink:0">📤</span>
        <div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:2px">SHIP OUT — Item Found</div>
          <div style="font-size:16px;font-weight:700">${item.name}</div>
          <div class="mono" style="font-size:11px;color:var(--muted);margin-top:2px">UPC: ${item.upc||"—"} · ${(item.rack||"?")+"-"+(item.station||"?")}</div>
          <div style="margin-top:4px;display:flex;align-items:center;gap:6px">
            <span style="font-size:10px;font-weight:700;background:rgba(79,142,247,.15);color:var(--accent);border-radius:20px;padding:2px 8px">👤 ${clientSel}</span>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Current Stock</div>
          <div style="font-size:24px;font-weight:700;color:var(--green)" id="so-current">${item.qty}</div>
          <div style="font-size:10px;color:var(--muted)">${item.unit}</div>
        </div>
        <div style="background:rgba(247,92,92,.08);border-radius:8px;padding:10px">
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px">Qty to Ship Out</div>
          <input id="so-qty" type="number" min="1" max="${item.qty}" value="1"
            class="form-input" style="font-size:22px;font-weight:700;text-align:center;color:var(--red)"
            oninput="updateShipOutPreview()"
            onkeydown="if(event.key==='Enter'){event.preventDefault();confirmShipOut();}">
          <div style="font-size:10px;color:var(--muted);margin-top:3px">Max: ${item.qty} ${item.unit}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:9px;text-align:center">
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px">After Deduction</div>
          <div id="so-after" style="font-size:22px;font-weight:700;color:var(--green)">${item.qty - 1}</div>
          <div style="font-size:10px;color:var(--muted)">${item.unit}</div>
        </div>
        <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:9px;text-align:center">
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px">New Status</div>
          <div id="so-status">${invStatusBadge(calcInvStatus(item.qty-1))}</div>
        </div>
      </div>

      <div id="so-warn"></div>

      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-ghost" style="flex:1" onclick="cancelScan()">✕ Cancel</button>
        <button class="btn btn-danger" style="flex:2;font-size:14px" onclick="confirmShipOut()">📤 Confirm Ship Out</button>
      </div>
      <div style="text-align:center;font-size:11px;color:var(--dim);margin-top:8px">Enter qty → Enter to confirm · Esc to cancel</div>
    </div>`;

  playBeep("found");
  setTimeout(()=>{ const q=document.getElementById("so-qty"); if(q){q.focus();q.select();} },80);
  setScanKeyHandlers(confirmShipOut, cancelScan);
}

function updateShipOutPreview(){
  const item = _pendingItem; if(!item) return;
  const qty  = Math.min(item.qty, Math.max(1, parseInt(document.getElementById("so-qty")?.value)||1));
  const after = item.qty - qty;
  const newSt = calcInvStatus(after);
  const stColor = newSt==="Out of Stock"?"var(--red)":newSt==="Low Stock"?"var(--yellow)":"var(--green)";
  const afterEl  = document.getElementById("so-after");
  const statusEl = document.getElementById("so-status");
  const warnEl   = document.getElementById("so-warn");
  if(afterEl){ afterEl.textContent=after; afterEl.style.color=stColor; }
  if(statusEl) statusEl.innerHTML = invStatusBadge(newSt);
  if(warnEl){
    warnEl.innerHTML = newSt==="Out of Stock"
      ? `<div style="background:rgba(247,92,92,.1);border:1px solid rgba(247,92,92,.25);border-radius:8px;padding:8px 12px;color:var(--red);font-size:12px;font-weight:500;margin-bottom:4px">⚠ This will make the item OUT OF STOCK</div>`
      : newSt==="Low Stock"
      ? `<div style="background:rgba(247,201,79,.08);border:1px solid rgba(247,201,79,.2);border-radius:8px;padding:8px 12px;color:var(--yellow);font-size:12px;font-weight:500;margin-bottom:4px">⚠ Stock will drop below minimum (${item.min||0} ${item.unit})</div>`
      : "";
  }
}

function confirmShipOut(){
  if(!_pendingItem) return;
  clearScanKeyHandlers();
  const item      = _pendingItem;
  const deduct    = Math.min(item.qty, Math.max(1, parseInt(document.getElementById("so-qty")?.value)||1));
  const qtyBefore = item.qty;
  const qtyAfter  = item.qty - deduct;
  item.qty        = qtyAfter;
  item.invStatus  = calcInvStatus(qtyAfter);
  item.lastScannedBy = currentUser?.name||currentUser?.username||"";
  item.lastScannedAt = nowCA().ts.slice(0,16);
  _pendingItem    = null;

  const ts = nowTS();
  const clientSel = item.client || "";
  const logEntry = {id:uid("SCN"),upc:item.upc||item.id,product:item.name,client:clientSel,mode:"shipout",qtyBefore,qtyAfter,scannedBy:currentUser.username,scannedAt:ts,status:item.invStatus};
  DB.scanLog.push(logEntry);

  updateInvQuickView(item);
  prependLogRow(logEntry);
  triggerWebhook("inventory.shipout",{upc:item.upc,product:item.name,deducted:deduct,qtyAfter,by:currentUser.username});
  if(item.client&&(item.invStatus==="Low Stock"||item.invStatus==="Out of Stock"))
    pushClientNotif("stock",`${item.invStatus}: ${item.name}`,`${item.client} · ${qtyAfter} remaining`,"inventory",item.client);

  const panel = document.getElementById("scan-result-panel");
  if(panel){
    const stColor = item.invStatus==="Out of Stock"?"var(--red)":item.invStatus==="Low Stock"?"var(--yellow)":"var(--green)";
    if(item.invStatus==="Out of Stock"){
      panel.innerHTML = `<div class="card slide-in" style="border:1px solid rgba(247,92,92,.4);text-align:center;padding:1.75rem;display:flex;flex-direction:column;align-items:center;gap:10px">
        <div style="font-size:32px">🚨</div><div style="font-size:15px;font-weight:700;color:var(--red)">OUT OF STOCK</div>
        <div style="font-weight:600">${item.name}</div><div style="font-size:12px;color:var(--red)">Now at 0 ${item.unit}</div>
        <button class="btn btn-warning btn-sm" onclick="navigate('replenishment')">Create Replenishment →</button></div>`;
      playBeep("alert");
    } else if(item.invStatus==="Low Stock"){
      panel.innerHTML = `<div class="card slide-in" style="border:1px solid rgba(247,201,79,.3);text-align:center;padding:1.75rem;display:flex;flex-direction:column;align-items:center;gap:10px">
        <div style="font-size:32px">⚠</div><div style="font-size:15px;font-weight:700;color:var(--yellow)">LOW STOCK</div>
        <div style="font-weight:600">${item.name}</div><div style="font-size:12px;color:var(--yellow)">Now at ${qtyAfter} ${item.unit}</div>
        <button class="btn btn-warning btn-sm" onclick="navigate('replenishment')">Create Replenishment →</button></div>`;
      playBeep("warning");
    } else {
      panel.innerHTML = `<div class="card slide-in" style="border:1px solid rgba(247,92,92,.3);text-align:center;padding:1.75rem;display:flex;flex-direction:column;align-items:center;gap:10px">
        <div style="font-size:32px">📤</div><div style="font-size:15px;font-weight:700;color:var(--red)">Shipped Out</div>
        <div style="font-weight:600">${item.name}</div>
        <div style="font-size:13px;color:var(--muted)">${qtyBefore} − <strong style="color:var(--red)">${deduct}</strong> = <strong style="color:var(--green)">${qtyAfter}</strong> remaining · ${ts}</div></div>`;
      playBeep("success");
    }
  }
  refocusScan();
}

// ── DAMAGE: deduct from stock and increment damagedQty ──
function handleDamage(upc, item, panel, clientSel, byUPC){
  if(!item){
    panel.innerHTML = `
      <div class="card slide-in" style="border:1px solid rgba(251,146,60,.4);text-align:center;padding:2rem;display:flex;flex-direction:column;align-items:center;gap:12px">
        <div style="font-size:34px">🔍</div>
        <div style="font-size:15px;font-weight:700;color:var(--orange)">Item Not Found</div>
        <div class="mono" style="font-size:12px;color:var(--muted)">UPC: ${upc}</div>
        <div style="font-size:12px;color:var(--muted)">No item with this UPC found in inventory.</div>
        <button class="btn btn-ghost btn-sm" onclick="cancelScan()">✕ Cancel</button>
      </div>`;
    playBeep("error"); refocusScan(); return;
  }

  _pendingItem = item;
  const dmgSoFar = Number(item.damagedQty)||0;
  panel.innerHTML = `
    <div class="card slide-in" style="border:2px solid rgba(251,146,60,.35)">
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px">
        <span style="font-size:28px;flex-shrink:0">⚠️</span>
        <div>
          <div style="font-size:11px;color:var(--orange);font-weight:700;margin-bottom:2px">DAMAGE — Item Found</div>
          <div style="font-size:16px;font-weight:700">${item.name}</div>
          <div class="mono" style="font-size:11px;color:var(--muted);margin-top:2px">UPC: ${item.upc||"—"} · ${(item.rack||"?")+"-"+(item.station||"?")}</div>
          <div style="margin-top:4px">
            <span style="font-size:10px;font-weight:700;background:rgba(251,146,60,.15);color:var(--orange);border-radius:20px;padding:2px 8px">👤 ${clientSel}</span>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Current Stock</div>
          <div style="font-size:24px;font-weight:700;color:var(--green)" id="dmg-current">${item.qty}</div>
          <div style="font-size:10px;color:var(--muted)">${item.unit}</div>
        </div>
        <div style="background:rgba(251,146,60,.08);border-radius:8px;padding:10px">
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px">Qty Damaged</div>
          <input id="dmg-qty" type="number" min="1" max="${item.qty}" value="1"
            class="form-input" style="font-size:22px;font-weight:700;text-align:center;color:var(--orange)"
            oninput="updateDamagePreview()"
            onkeydown="if(event.key==='Enter'){event.preventDefault();confirmDamage();}">
          <div style="font-size:10px;color:var(--muted);margin-top:3px">Max: ${item.qty} ${item.unit}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:9px;text-align:center">
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px">After Deduction</div>
          <div id="dmg-after" style="font-size:22px;font-weight:700;color:var(--green)">${item.qty - 1}</div>
          <div style="font-size:10px;color:var(--muted)">${item.unit}</div>
        </div>
        <div style="background:rgba(247,92,92,.06);border-radius:8px;padding:9px;text-align:center">
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px">Total Damaged</div>
          <div id="dmg-total" style="font-size:22px;font-weight:700;color:var(--orange)">${dmgSoFar + 1}</div>
          <div style="font-size:10px;color:var(--muted)">cumulative</div>
        </div>
      </div>

      <div id="dmg-warn"></div>

      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-ghost" style="flex:1" onclick="cancelScan()">✕ Cancel</button>
        <button class="btn btn-warning" style="flex:2;font-size:14px" onclick="confirmDamage()">⚠️ Confirm Damage</button>
      </div>
      <div style="text-align:center;font-size:11px;color:var(--dim);margin-top:8px">Enter qty → Enter to confirm · Esc to cancel</div>
    </div>`;

  playBeep("found");
  setTimeout(()=>{ const q=document.getElementById("dmg-qty"); if(q){q.focus();q.select();} },80);
  setScanKeyHandlers(confirmDamage, cancelScan);
}

function updateDamagePreview(){
  const item = _pendingItem; if(!item) return;
  const qty  = Math.min(item.qty, Math.max(1, parseInt(document.getElementById("dmg-qty")?.value)||1));
  const after = item.qty - qty;
  const newSt = calcInvStatus(after);
  const stColor = newSt==="Out of Stock"?"var(--red)":newSt==="Low Stock"?"var(--yellow)":"var(--green)";
  const afterEl = document.getElementById("dmg-after");
  const totalEl = document.getElementById("dmg-total");
  const warnEl  = document.getElementById("dmg-warn");
  if(afterEl){ afterEl.textContent=after; afterEl.style.color=stColor; }
  if(totalEl) totalEl.textContent=(Number(item.damagedQty)||0)+qty;
  if(warnEl){
    warnEl.innerHTML = newSt==="Out of Stock"
      ? `<div style="background:rgba(247,92,92,.1);border:1px solid rgba(247,92,92,.25);border-radius:8px;padding:8px 12px;color:var(--red);font-size:12px;font-weight:500;margin-bottom:4px">⚠ This will make the item OUT OF STOCK</div>`
      : newSt==="Low Stock"
      ? `<div style="background:rgba(247,201,79,.08);border:1px solid rgba(247,201,79,.2);border-radius:8px;padding:8px 12px;color:var(--yellow);font-size:12px;font-weight:500;margin-bottom:4px">⚠ Stock will drop below minimum</div>`
      : "";
  }
}

function confirmDamage(){
  if(!_pendingItem) return;
  clearScanKeyHandlers();
  const item       = _pendingItem;
  const deduct     = Math.min(item.qty, Math.max(1, parseInt(document.getElementById("dmg-qty")?.value)||1));
  const qtyBefore  = item.qty;
  const qtyAfter   = item.qty - deduct;
  item.qty         = qtyAfter;
  item.damagedQty  = (Number(item.damagedQty)||0) + deduct;
  item.invStatus   = calcInvStatus(qtyAfter);
  item.lastScannedBy = currentUser?.name||currentUser?.username||"";
  item.lastScannedAt = nowCA().ts.slice(0,16);
  _pendingItem     = null;

  const ts = nowTS();
  const clientSel = item.client||"";
  const logEntry = {
    id:uid("SCN"), upc:item.upc||item.id, product:item.name,
    client:clientSel, mode:"damage", qtyBefore, qtyAfter,
    scannedBy:currentUser.username, scannedAt:ts, status:item.invStatus,
    damaged:deduct
  };
  DB.scanLog.push(logEntry);
  saveToLocalStorage();

  updateInvQuickView(item);
  prependLogRow(logEntry);

  // ── Notify warehouse team, CS, and Manager handling this client ──
  const notifTitle = `⚠️ Damage Report — ${item.name}`;
  const notifBody  = `${deduct} unit${deduct!==1?"s":""} damaged · Client: ${clientSel||"—"} · By: ${currentUser?.name||currentUser?.username} · Remaining: ${qtyAfter}`;

  // Collect targets: all warehouse + CS/Manager assigned to this client + admins + purchasers
  const targets = new Set();
  DB.employees.forEach(emp=>{
    if(!emp.username) return;
    if(emp.role==="Warehouse"||emp.role==="Admin"||emp.role==="Purchaser") targets.add(emp.username);
    if((emp.role==="Manager"||emp.role==="Customer Service")&&
       (emp.assignedClients||[]).some(c=>c===clientSel||clientSel.startsWith(c.split(" ")[0])))
      targets.add(emp.username);
  });
  USERS.forEach(u=>{
    if(u.role==="Admin"||u.role==="Warehouse"||u.role==="Purchaser"||u.role==="Manager") targets.add(u.username);
  });

  if(!DB.notifications) DB.notifications=[];
  DB.notifications.unshift({
    id:uid("NTF"), type:"damage",
    title: notifTitle,
    body:  notifBody,
    link:"inventory",
    time:nowCA().ts.slice(0,16),
    read:[], for:[...targets]
  });
  refreshNotifBadge(); buildNav();
  maybePlayNotifSound("damage");

  // Also push client notification for low/OOS
  if(clientSel&&(item.invStatus==="Low Stock"||item.invStatus==="Out of Stock"))
    pushClientNotif("stock",`${item.invStatus}: ${item.name}`,`${clientSel} · ${qtyAfter} remaining · ${deduct} damaged`,"inventory",clientSel);

  const panel = document.getElementById("scan-result-panel");
  if(panel){
    panel.innerHTML = `
      <div class="card slide-in" style="border:1px solid rgba(251,146,60,.4);text-align:center;padding:1.75rem;display:flex;flex-direction:column;align-items:center;gap:10px">
        <div style="font-size:32px">⚠️</div>
        <div style="font-size:15px;font-weight:700;color:var(--orange)">DAMAGE RECORDED</div>
        <div style="font-weight:600">${item.name}</div>
        <div style="font-size:12px;color:var(--muted)">${deduct} unit${deduct!==1?"s":""} damaged · Remaining: <strong style="color:var(--text)">${qtyAfter} ${item.unit}</strong></div>
        <div style="font-size:12px;color:var(--orange)">Total damaged: ${item.damagedQty} ${item.unit}</div>
        ${item.invStatus==="Out of Stock"?`<div style="font-size:12px;color:var(--red);font-weight:700">⚠ Now OUT OF STOCK</div>`:""}
        <div style="font-size:11px;color:var(--dim);margin-top:4px">Scan next item or switch mode</div>
      </div>`;
  }

  playBeep(item.invStatus==="Out of Stock"?"alert":"success");
  refocusScan();
}

// ── RECEIVING: add to existing or create new ──
function handleReceiving(upc, item, panel, clientSel, byUPC){
  if(item){
    // Existing product — show qty input + option to add as new item for different client
    _pendingItem   = item;
    _pendingNewUPC = null;
    panel.innerHTML = `
      <div class="card slide-in" style="border:2px solid rgba(79,207,142,.3)">
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
          <span style="font-size:28px;flex-shrink:0">📥</span>
          <div>
            <div style="font-size:11px;color:var(--muted);margin-bottom:2px">RECEIVING — Product Found</div>
            <div style="font-size:16px;font-weight:700">${item.name}</div>
            <div class="mono" style="font-size:11px;color:var(--muted);margin-top:2px">UPC: ${item.upc||"—"} · ${(item.rack||"?")+"-"+(item.station||"?")}</div>
            <div style="margin-top:4px"><span style="font-size:10px;font-weight:700;background:rgba(79,142,247,.15);color:var(--accent);border-radius:20px;padding:2px 8px">👤 ${clientSel}</span></div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
          <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:9px;text-align:center">
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px">Current Stock</div>
            <div style="font-size:22px;font-weight:700;color:var(--green)">${item.qty}</div>
            <div style="font-size:10px;color:var(--muted)">${item.unit}</div>
          </div>
          <div style="background:rgba(79,207,142,.08);border-radius:8px;padding:9px">
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px">Qty Received</div>
            <input id="rcv-qty" type="number" min="1" value="1" class="form-input"
              style="font-size:18px;font-weight:700;text-align:center;color:var(--green)"
              onkeydown="if(event.key==='Enter'){event.preventDefault();confirmReceiving();}">
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:10px">
          <button class="btn btn-ghost" style="flex:1" onclick="cancelScan()">✕ Cancel</button>
          <button class="btn btn-success" style="flex:2" onclick="confirmReceiving()">📥 Confirm Receiving</button>
        </div>

        <!-- Add as new item for a different client -->
        <div style="border-top:1px solid var(--border);padding-top:10px">
          <div style="font-size:11px;color:var(--muted);margin-bottom:6px">Not the right client? Receiving this UPC for a different client?</div>
          <button class="btn btn-ghost btn-sm" style="width:100%;border-color:rgba(79,207,142,.3);color:var(--green)"
            onclick="showAddNewItemForm('${upc}','')">
            🆕 Add as new item for a different client
          </button>
        </div>

        <div style="text-align:center;font-size:11px;color:var(--dim);margin-top:8px">Enter qty · Enter to confirm · Esc to cancel</div>
      </div>`;
    playBeep("found");
    setTimeout(()=>{ const q=document.getElementById("rcv-qty"); if(q){q.focus();q.select();} },80);
    setScanKeyHandlers(confirmReceiving, cancelScan);

  } else {
    // UPC not found for this client (could be byUPC exists or brand new) — show add new item form
    showAddNewItemForm(upc, clientSel);
  }
}

// ── Show the "Add New Item" form for receiving ──
function showAddNewItemForm(upc, defaultClient){
  _pendingNewUPC = upc;
  _pendingItem   = null;
  const panel = document.getElementById("scan-result-panel");
  if(!panel) return;

  panel.innerHTML = `
    <div class="card slide-in" style="border:2px solid rgba(79,207,142,.3)">
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
        <span style="font-size:24px;flex-shrink:0">🆕</span>
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--green)">Add New Inventory Item</div>
          <div class="mono" style="font-size:12px;color:var(--muted);margin-top:2px">UPC: ${upc}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Fill in the details below to add this to inventory.</div>
        </div>
      </div>
      ${renderNewProductFields(upc, defaultClient)}
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="btn btn-ghost" style="flex:1" onclick="cancelScan()">✕ Cancel</button>
        <button class="btn btn-success" style="flex:2" onclick="confirmNewProduct()">➕ Add to Inventory</button>
      </div>
    </div>`;

  playBeep("found");
  setTimeout(()=>{ document.getElementById("new-name")?.focus(); },80);
  window._scanKeyHandler=e=>{ if(e.key==="Escape") cancelScan(); };
  document.addEventListener("keydown",window._scanKeyHandler);
}

function renderNewProductFields(upc, defaultClient){
  // Auto-fill from existing inventory if UPC already exists for another client
  const existing = DB.inventory.find(i=>i.upc===upc||i.upc===upc.replace(/^0+/,""));

  const clientOpts = DB.clients.map(c=>
    `<option value="${c.name}"${c.name===defaultClient?" selected":""}>${c.name}</option>`
  ).join("");

  const prefill = existing ? `
    <div style="background:rgba(79,207,142,.07);border:1px solid rgba(79,207,142,.25);
                border-radius:var(--r);padding:8px 12px;margin-bottom:10px;font-size:11px;color:var(--green);
                display:flex;align-items:center;gap:6px">
      ✅ Auto-filled from existing inventory record
      <span style="color:var(--muted)">(${existing.client||"unknown client"})</span>
    </div>` : `
    <div style="background:rgba(79,142,247,.07);border:1px solid rgba(79,142,247,.2);
                border-radius:var(--r);padding:8px 12px;margin-bottom:10px;font-size:11px;color:var(--accent);
                display:flex;align-items:center;gap:6px">
      🔍 New UPC — fill in product details below
      <span id="lookup-status" style="color:var(--muted);margin-left:4px"></span>
    </div>`;

  const nameVal     = existing?.name||"";

  return `${prefill}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
    <div class="form-group" style="grid-column:1/-1">
      <label class="form-label">Product Name <span style="color:var(--red)">*</span></label>
      <input id="new-name" class="form-input" placeholder="e.g. Industrial Valve A4"
        autocomplete="off" value="${nameVal.replace(/"/g,'&quot;')}">
    </div>
    <div class="form-group" style="grid-column:1/-1">
      <label class="form-label">Client</label>
      <select id="new-client" class="form-input" style="font-size:13px">
        <option value="">— Select Client —</option>
        ${clientOpts}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Qty Received <span style="color:var(--red)">*</span></label>
      <input id="new-qty" type="number" min="1" value="1" class="form-input">
    </div>
    <div class="form-group">
      <label class="form-label">Unit</label>
      <input id="new-unit" class="form-input" value="pcs" placeholder="pcs">
    </div>
    <div class="form-group">
      <label class="form-label">Rack</label>
      <select id="new-rack" class="form-input">
        <option value="">—</option>
        <option value="RA">RA</option>
        ${Array.from({length:40},(_,i)=>`<option value="R${i+1}">R${i+1}</option>`).join("")}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Section</label>
      <select id="new-station" class="form-input">
        <option value="">—</option>
        <option value="S1">S1</option><option value="S2">S2</option><option value="S3">S3</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Expiration Date</label>
      <input id="new-expdate" type="date" class="form-input">
    </div>
    <div class="form-group" style="grid-column:1/-1">
      <label class="form-label">Weight &amp; Dimension</label>
      <input id="new-weightdim" class="form-input" placeholder='e.g. 2.5 lbs · 12"×8"×6"'>
    </div>
  </div>`;
}

function confirmReceiving(){
  if(!_pendingItem) return;
  clearScanKeyHandlers();
  const item      = _pendingItem;
  const addQty    = Math.max(1, parseInt(document.getElementById("rcv-qty")?.value)||1);
  const clientSel = item.client || "";
  const qtyBefore = item.qty;
  const qtyAfter  = item.qty + addQty;
  item.qty        = qtyAfter;
  item.initialStock = Math.max(item.initialStock||0, qtyAfter);
  item.invStatus  = calcInvStatus(qtyAfter);
  item.lastScannedBy = currentUser?.name||currentUser?.username||"";
  item.lastScannedAt = nowCA().ts.slice(0,16);
  _pendingItem    = null;

  const ts = nowTS();
  const logEntry = {id:uid("SCN"),upc:item.upc||item.id,product:item.name,client:clientSel,mode:"receiving",qtyBefore,qtyAfter,scannedBy:currentUser.username,scannedAt:ts,status:item.invStatus};
  DB.scanLog.push(logEntry);

  updateInvQuickView(item);
  prependLogRow(logEntry);
  triggerWebhook("inventory.receiving",{upc:item.upc,product:item.name,client:clientSel,qtyAdded:addQty,qtyAfter,by:currentUser.username});

  const panel = document.getElementById("scan-result-panel");
  if(panel) panel.innerHTML = `
    <div class="card slide-in" style="border:1px solid rgba(79,207,142,.3);text-align:center;padding:1.75rem;display:flex;flex-direction:column;align-items:center;gap:10px">
      <div style="font-size:32px">📥</div>
      <div style="font-size:15px;font-weight:700;color:var(--green)">Stock Updated</div>
      <div style="font-weight:600">${item.name}</div>
      <div style="font-size:11px;background:rgba(79,142,247,.12);color:var(--accent);border-radius:20px;padding:2px 10px">👤 ${clientSel}</div>
      <div style="font-size:13px;color:var(--muted)">${qtyBefore} + <strong style="color:var(--green)">+${addQty}</strong> = <strong style="color:var(--green)">${qtyAfter}</strong> ${item.unit}</div>
      <div style="font-size:11px;color:var(--dim)">${ts}</div>
    </div>`;
  playBeep("success");
  refocusScan();
}

function confirmNewProduct(){
  const name      = document.getElementById("new-name")?.value.trim();
  const qty       = Math.max(1, parseInt(document.getElementById("new-qty")?.value)||1);
  const client    = document.getElementById("new-client")?.value || "";
  const rack      = document.getElementById("new-rack")?.value||"";
  const station   = document.getElementById("new-station")?.value||"";
  const unit      = document.getElementById("new-unit")?.value.trim()||"pcs";
  const expDate   = document.getElementById("new-expdate")?.value||"";
  const weightDim = document.getElementById("new-weightdim")?.value.trim()||"";
  if(!name){ showToast("Product name is required.","var(--red)"); return; }
  clearScanKeyHandlers();

  const newItem = {
    id:uid("PRD"), upc:_pendingNewUPC, asin:"", name, client,
    storeName:"", invStatus:"Active", shippingType:"FBA",
    initialStock:qty, qty, min:0, unit, category:"General",
    rack, station, weightDimension:weightDim, whNotes:"",
    unitCost:0, discountedAmount:0, profit:0, manager:currentUser.name,
    originalInvoice:"", totalShipped:0, response:"", actionTaken:"",
    totalPurchased:qty, confirmedQty:qty, damagedQty:0,
    expirationDate:expDate,
    lastScannedBy:currentUser?.name||currentUser?.username||"",
    lastScannedAt:nowCA().ts.slice(0,16),
  };
  DB.inventory.unshift(newItem);

  const ts = nowTS();
  const logEntry = {id:uid("SCN"),upc:_pendingNewUPC||newItem.upc,product:name,client,mode:"receiving",qtyBefore:0,qtyAfter:qty,scannedBy:currentUser.username,scannedAt:ts,status:"Active"};
  DB.scanLog.push(logEntry);
  saveToLocalStorage();
  _pendingNewUPC = null;

  pageScan();
  showToast(`"${name}" added for ${client||"no client"}`, "var(--green)");
}

function cancelScan(){
  clearScanKeyHandlers();
  _pendingItem   = null;
  _pendingNewUPC = null;
  const panel = document.getElementById("scan-result-panel");
  const isShipout = _scanMode==="shipout";
  if(panel) panel.innerHTML = `
    <div class="card" style="text-align:center;padding:2rem;min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">
      <div style="font-size:38px;opacity:.2">▦</div>
      <div style="color:var(--muted);font-size:13px">Cancelled. Ready for next scan.</div>
      <div style="font-size:11px;color:var(--dim)">Mode: <strong style="color:${isShipout?"var(--red)":"var(--green)"}">${isShipout?"Ship Out":"Receiving"}</strong></div>
    </div>`;
  refocusScan();
}

// ── Shared utilities ──
function setScanKeyHandlers(onEnter, onEsc){
  clearScanKeyHandlers();
  window._scanKeyHandler = e=>{
    if(e.key==="Enter"){ e.preventDefault(); onEnter(); }
    if(e.key==="Escape"){ onEsc(); }
  };
  document.addEventListener("keydown", window._scanKeyHandler);
}
function clearScanKeyHandlers(){
  if(window._scanKeyHandler){ document.removeEventListener("keydown", window._scanKeyHandler); window._scanKeyHandler=null; }
}
function refocusScan(){ setTimeout(()=>{ document.getElementById("upc-input")?.focus(); },300); }

function updateInvQuickView(item){
  const pct = item.initialStock>0?Math.min(100,Math.round((item.qty/item.initialStock)*100)):100;
  const col = item.invStatus==="Out of Stock"?"var(--red)":item.invStatus==="Low Stock"?"var(--yellow)":"var(--green)";
  const qtyEl=document.getElementById("qty-"+item.id);
  const barEl=document.getElementById("bar-"+item.id);
  const rowEl=document.getElementById("inv-row-"+item.id);
  if(qtyEl){ qtyEl.textContent=item.qty; qtyEl.style.color=col; }
  if(barEl){ barEl.style.width=pct+"%"; barEl.style.background=col; }
  if(rowEl){ rowEl.classList.add("scan-flash"); setTimeout(()=>rowEl.classList.remove("scan-flash"),600); }
  // Update session stats
  const todayScans=DB.scanLog.filter(s=>s.scannedAt.startsWith(TODAY));
  const el=document.getElementById("stat-total");// reuse existing stat els if present
  // Stats are in metrics strip — just update counts via re-render if needed
}

function prependLogRow(entry){
  const logBody=document.getElementById("scan-log-body");
  if(!logBody) return;
  const change=entry.qtyAfter-entry.qtyBefore;
  const changeColor=change>0?"var(--green)":change<0?"var(--red)":"var(--muted)";
  const modeColor=entry.mode==="shipout"?"var(--red)":entry.mode==="damage"?"var(--orange)":"var(--green)";
  const modeLabel=entry.mode==="shipout"?"📤 Ship Out":entry.mode==="damage"?"⚠️ Damage":"📥 Receiving";
  const tr=document.createElement("tr");
  tr.id="log-"+entry.id; tr.className="slide-in"; tr.style.background="rgba(79,142,247,.06)";
  tr.innerHTML=`
    <td class="mono text-muted" style="font-size:11px">${entry.id}</td>
    <td style="font-size:11px;font-weight:600;color:${modeColor}">${modeLabel}</td>
    <td class="mono" style="color:var(--accent);font-size:12px">${entry.upc||"—"}</td>
    <td class="fw6">${entry.product}</td>
    <td style="font-size:12px;color:var(--accent)">${entry.client||"—"}</td>
    <td class="text-muted">${entry.qtyBefore}</td>
    <td style="font-weight:600;color:${entry.qtyAfter===0?"var(--red)":"var(--text)"}">${entry.qtyAfter}</td>
    <td style="color:${changeColor};font-weight:700">${change>0?"+":""}${change}</td>
    <td class="text-muted">${entry.scannedBy}</td>
    <td class="text-muted" style="font-size:11px">${entry.scannedAt}</td>
    <td>${invStatusBadge(entry.status||"Active")}</td>`;
  logBody.insertBefore(tr,logBody.firstChild);
  setTimeout(()=>{ tr.style.background=""; },2000);
}

function exportScanLog(){
  const rows=DB.scanLog.slice().reverse();
  const csv=["Scan ID,Mode,UPC,Product,Client,Qty Before,Qty After,Change,By,Date & Time,Status",
    ...rows.map(s=>`${s.id},${s.mode},${s.upc||s.sku||""},${s.product},${s.client||""},${s.qtyBefore},${s.qtyAfter},${s.qtyAfter-s.qtyBefore},${s.scannedBy},${s.scannedAt},${s.status}`)
  ].join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download="AW_ScanLog_"+TODAY+".csv";
  a.click();
  showToast("Scan log exported","var(--green)");
}

// Subtle audio feedback using Web Audio API

