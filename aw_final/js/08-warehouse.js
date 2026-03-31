// ── 08-warehouse.js ──

function pageWarehouse(){
  const search=(window._wrSearch)||"";
  const statusF=(window._wrStatusF)||"All";
  const _wrStatusF = window._wrStatusF||"All";
  const rows=DB.warehouse.filter(w=>{
    const ms=statusF==="All"||w.receivedStatus===statusF||w.orderStatus===statusF;
    const mq=!search||(w.clientName||"").toLowerCase().includes(search.toLowerCase())||
      (w.orderNumber||"").toLowerCase().includes(search.toLowerCase())||
      (w.supplierName||"").toLowerCase().includes(search.toLowerCase())||
      (w.asin||"").toLowerCase().includes(search.toLowerCase())||
      (w.trackingNumber||"").toLowerCase().includes(search.toLowerCase());
    return ms&&mq;
  });

  render(`
  <div>
    <div class="page-header">
      <div><div class="page-title">Warehouse Receivables</div><div class="page-sub">Incoming delivery tracking · ${DB.warehouse.length} records</div></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="exportWRCSV()">↓ Export</button>
        ${canSubmit("warehouse")?'<button class="btn btn-primary" onclick="openWRModal()">+ Record Delivery</button>':""}
      </div>
    </div>

    <div class="metrics metrics-4" style="margin-bottom:1.25rem">
      ${metric("Total",DB.warehouse.length,"","var(--accent)")}
      ${metric("Complete",DB.warehouse.filter(w=>w.receivedStatus==="Complete").length,"","var(--green)")}
      ${metric("Missing/Damage",DB.warehouse.filter(w=>w.receivedStatus==="Missing/Damage").length,"","var(--yellow)")}
      ${metric("Claims Submitted",DB.warehouse.filter(w=>w.receivedStatus==="Claims Submitted").length,"","var(--red)")}
    </div>

    <!-- Filters -->
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input class="search-bar" placeholder="Search client, order#, supplier, ASIN, tracking…"
          value="${search}" oninput="window._wrSearch=this.value;pageWarehouse()" style="flex:1;min-width:200px;max-width:320px">
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${["All","Complete","Missing/Damage","Claims Submitted","Prepped","Shipped","FBM Live","Ungating Submitted","Ungating Denied","Walmart Live"].map(s=>
            `<button class="filter-pill${statusF===s?" active":""}" onclick="window._wrStatusF='${s}';pageWarehouse()">${s}</button>`
          ).join("")}
        </div>
      </div>
    </div>

    <!-- Table -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r2);overflow:hidden">
      <div style="overflow-x:auto">
        <table style="width:max-content;min-width:100%">
          <thead><tr style="background:#0d1b3e;position:sticky;top:0;z-index:2">
            <th style="min-width:150px">Client Name</th>
            <th style="min-width:100px">Purchase Date</th>
            <th style="min-width:130px">Order Number</th>
            <th style="min-width:70px">Qty</th>
            <th style="min-width:110px">Units/Bundles</th>
            <th style="min-width:150px">Supplier Name</th>
            <th style="min-width:120px">ASIN</th>
            <th style="min-width:110px">Item Code</th>
            <th style="min-width:120px">Amazon Bundle</th>
            <th style="min-width:120px">Gated/Ungated</th>
            <th style="min-width:110px">2DS/FBA/FBM</th>
            <th style="min-width:180px">Amazon Description</th>
            <th style="min-width:90px">Unit Cost</th>
            <th style="min-width:110px">Delivery Date</th>
            <th style="min-width:140px">Tracking Number</th>
            <th style="min-width:150px">Princess Note</th>
            <th style="min-width:130px">Link to Invoice</th>
            <th style="min-width:140px">Received Status</th>
            <th style="min-width:110px">QTY Received</th>
            <th style="min-width:170px">Warehouse Notes</th>
            <th style="min-width:120px">Ready for Invoice</th>
            <th style="min-width:150px">Location in WH</th>
            <th style="min-width:140px">Weight & Dim.</th>
            <th style="min-width:100px">EXP Date</th>
            <th style="min-width:150px">Order Status</th>
            <th style="min-width:120px">SKU</th>
            <th style="min-width:130px">SKU Status</th>
            <th style="min-width:130px">Shipping Labels</th>
            <th style="min-width:70px"></th>
          </tr></thead>
          <tbody>
          ${rows.length===0?`<tr><td colspan="26" style="text-align:center;color:var(--muted);padding:2.5rem">No records match your filters</td></tr>`:""}
          ${rows.map(w=>{
            const rsBg = w.receivedStatus==="Complete"?"rgba(79,207,142,.08)":w.receivedStatus==="Missing/Damage"?"rgba(247,201,79,.07)":w.receivedStatus==="Claims Submitted"?"rgba(247,92,92,.07)":"";
            const osBadge = {
              "Prepped":           {bg:"rgba(79,142,247,.15)",  c:"#4f8ef7"},
              "Shipped":           {bg:"rgba(79,207,142,.15)",  c:"#4fcf8e"},
              "FBM Live":          {bg:"rgba(79,207,142,.2)",   c:"#4fcf8e"},
              "Ungating Submitted":{bg:"rgba(247,201,79,.15)",  c:"#f7c94f"},
              "Ungating Denied":   {bg:"rgba(247,92,92,.15)",   c:"#f75c5c"},
              "Walmart Live":      {bg:"rgba(0,113,206,.18)",   c:"#3b9eff"},
            }[w.orderStatus]||{bg:"rgba(107,118,148,.12)",c:"#6b7694"};
            const skuBadge = {
              "New SKU": {bg:"rgba(167,139,250,.15)",c:"#a78bfa"},
              "Prepped": {bg:"rgba(79,207,142,.15)", c:"#4fcf8e"},
            }[w.skuStatus]||{bg:"rgba(107,118,148,.12)",c:"#6b7694"};
            const expColor = w.expDate&&new Date(w.expDate)<new Date(TODAY)?"var(--red)":w.expDate?"var(--muted)":"var(--dim)";
            return `<tr style="${rsBg?`background:${rsBg}`:``}">
              <td style="font-weight:600;font-size:12px;color:var(--accent)">${w.clientName||"—"}</td>
              <td style="font-size:12px;color:var(--muted)">${w.purchaseDate||"—"}</td>
              <td class="mono" style="font-size:11px;color:var(--accent)">${w.orderNumber||"—"}</td>
              <td style="font-weight:700;color:var(--text)">${w.qty||"—"}</td>
              <td><span class="tag" style="white-space:nowrap">${w.unitsOrBundles||"—"}</span></td>
              <td style="font-weight:500">${w.supplierName||"—"}</td>
              <td class="mono" style="font-size:11px;color:var(--muted)">${w.asin||"—"}</td>
              <td class="mono" style="font-size:11px">${w.itemCode||"—"}</td>
              <td style="font-size:12px;color:var(--muted)">${w.amazonBundle||"—"}</td>
              <td><span style="font-size:11px;padding:2px 8px;border-radius:20px;font-weight:600;background:${w.gatedUngated==="Gated"?"rgba(247,201,79,.15)":"rgba(79,207,142,.12)"};color:${w.gatedUngated==="Gated"?"var(--yellow)":"var(--green)"}">${w.gatedUngated||"—"}</span></td>
              <td><span class="tag">${w.fulfillmentType||"—"}</span></td>
              <td style="font-size:12px;color:var(--muted);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${w.amazonDesc||""}">${w.amazonDesc||"—"}</td>
              <td style="color:var(--green);font-weight:600">$${Number(w.unitCost||0).toFixed(2)}</td>
              <td style="font-size:12px;color:var(--muted)">${w.deliveryDate||"—"}</td>
              <td class="mono" style="font-size:11px;color:var(--muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${w.trackingNumber||""}">${w.trackingNumber||"—"}</td>
              <td style="font-size:12px;color:var(--muted);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${w.princessNote||""}">${w.princessNote||"—"}</td>
              <td style="font-size:12px">${w.linkToInvoice?`<a href="${w.linkToInvoice}" target="_blank" style="color:var(--accent);text-decoration:underline">View Invoice</a>`:"—"}</td>
              <td><span class="badge" style="background:${w.receivedStatus==="Complete"?"rgba(79,207,142,.15)":w.receivedStatus==="Missing/Damage"?"rgba(247,201,79,.15)":"rgba(247,92,92,.15)"};color:${w.receivedStatus==="Complete"?"var(--green)":w.receivedStatus==="Missing/Damage"?"var(--yellow)":"var(--red)"};white-space:nowrap">${w.receivedStatus||"—"}</span></td>
              <td style="font-weight:700;color:${w.qtyReceivedWarehouse>=w.qty?"var(--green)":"var(--yellow)"}">${w.qtyReceivedWarehouse??0}</td>
              <td style="font-size:12px;color:var(--muted);max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${w.warehouseNotes||""}">${w.warehouseNotes||"—"}</td>
              <td><span style="font-size:11px;padding:2px 8px;border-radius:20px;font-weight:600;background:${w.readyForInvoice==="Yes"?"rgba(79,207,142,.15)":"rgba(107,118,148,.12)"};color:${w.readyForInvoice==="Yes"?"var(--green)":"var(--muted)"}">${w.readyForInvoice||"—"}</span></td>
              <td><span style="background:rgba(79,209,197,.1);color:var(--teal);font-family:var(--mono);font-size:11px;font-weight:700;border-radius:6px;padding:2px 8px">${w.locationInWarehouse||"—"}</span></td>
              <td style="font-size:12px;color:var(--muted)">${w.weightDimension||"—"}</td>
              <td style="font-size:12px;color:${expColor}">${w.expDate||"—"}</td>
              <td><span class="badge" style="background:${osBadge.bg};color:${osBadge.c};white-space:nowrap">${w.orderStatus||"—"}</span></td>
              <td class="mono" style="font-size:11px;color:var(--accent)">${w.sku||"—"}</td>
              <td>${w.skuStatus?`<span class="badge" style="background:${skuBadge.bg};color:${skuBadge.c};white-space:nowrap">${w.skuStatus}</span>`:"—"}</td>
              <td style="font-size:12px;color:var(--muted);max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${w.shippingLabels||""}">${w.shippingLabels||"—"}</td>
              <td>${canEdit("warehouse")?`<button class="btn btn-info btn-sm" onclick="openWRById('${w.id}')">Edit</button>`:""}</td>
            </tr>`;
          }).join("")}
          </tbody>
        </table>
      </div>
      <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${rows.length} of ${DB.warehouse.length} records · scroll horizontally to see all columns</div>
    </div>
  </div>`);
}

function openWRById(id){
  const w=DB.warehouse.find(x=>x.id===id);
  if(w) openWRModal(w);
}

function openWRModal(w=null){
  const isNew=!w;
  w=w||{id:"",clientName:"",purchaseDate:TODAY,orderNumber:"",qty:"",unitsOrBundles:"Units",supplierName:"",asin:"",itemCode:"",amazonBundle:"",gatedUngated:"Ungated",fulfillmentType:"FBA",amazonDesc:"",unitCost:"",deliveryDate:"",trackingNumber:"",princessNote:"",linkToInvoice:"",receivedStatus:"Complete",qtyReceivedWarehouse:"",warehouseNotes:"",readyForInvoice:"No",locationInWarehouse:"",weightDimension:"",expDate:"",orderStatus:"Prepped",sku:"",skuStatus:"",shippingLabels:""};
  openModal(`${mHeader(isNew?"Record Delivery":"Edit Receipt")}
  <div class="modal-body">

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin-bottom:8px">Order Info</div>
    <div class="form-grid">
      <div class="form-full">${clientSelect("clientName",w.clientName,true)}</div>
      ${mField("Purchase Date","purchaseDate",w.purchaseDate,"date","",true)}
      ${mField("Order Number","orderNumber",w.orderNumber,"text","e.g. ORD-2026-001",true)}
      ${mField("Quantity","qty",w.qty,"number")}
      ${mField("Units / Bundles","unitsOrBundles",w.unitsOrBundles,"select","Units,Bundles,Cases,Pallets,Sets")}
      <div class="form-full">${mField("Supplier Name","supplierName",w.supplierName,"text","",true)}</div>
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Product Details</div>
    <div class="form-grid">
      ${mField("ASIN","asin",w.asin,"text","e.g. B08N5WRWNW")}
      ${mField("Item Code","itemCode",w.itemCode,"text","e.g. ITM-001")}
      ${mField("Amazon Bundle","amazonBundle",w.amazonBundle,"text","e.g. 2-pack")}
      ${mField("Gated / Ungated","gatedUngated",w.gatedUngated,"select","Ungated,Gated")}
      ${mField("2DS / FBA / FBM","fulfillmentType",w.fulfillmentType,"select","FBA,FBM,2DS")}
      ${mField("Unit Cost ($)","unitCost",w.unitCost,"number")}
      <div class="form-full">${mField("Amazon Description","amazonDesc",w.amazonDesc,"textarea")}</div>
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Delivery & Tracking</div>
    <div class="form-grid">
      ${mField("Delivery Date","deliveryDate",w.deliveryDate,"date")}
      ${mField("Tracking Number","trackingNumber",w.trackingNumber,"text")}
      ${mField("Link to Invoice","linkToInvoice",w.linkToInvoice,"text","https://...")}
      <div class="form-full">${mField("Princess Note","princessNote",w.princessNote,"textarea")}</div>
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Warehouse & Status</div>
    <div class="form-grid">
      ${mField("Received Status","receivedStatus",w.receivedStatus,"select","Complete,Missing/Damage,Claims Submitted")}
      ${mField("QTY Received (WH Confirmation)","qtyReceivedWarehouse",w.qtyReceivedWarehouse,"number")}
      ${mField("Ready for Invoice","readyForInvoice",w.readyForInvoice,"select","No,Yes")}
      ${mField("Location in Warehouse","locationInWarehouse",w.locationInWarehouse,"text","e.g. R1-S2")}
      ${mField("Weight & Dimensions","weightDimension",w.weightDimension,"text",'e.g. 2.5 lbs · 12"×8"×6"')}
      ${mField("EXP Date","expDate",w.expDate,"date")}
      ${mField("Order Status","orderStatus",w.orderStatus,"select","Prepped,Shipped,FBM Live,Ungating Submitted,Ungating Denied,Walmart Live")}
      ${mField("SKU","sku",w.sku,"text","e.g. AW-SKU-001")}
      ${mField("SKU Status","skuStatus",w.skuStatus,"select",",New SKU,Prepped")}
      <div class="form-full">${mField("Shipping Labels","shippingLabels",w.shippingLabels,"textarea","Tracking numbers or label notes")}</div>
      <div class="form-full">${mField("Warehouse Team Notes","warehouseNotes",w.warehouseNotes,"textarea")}</div>
    </div>

  </div>
  ${mFooter("saveWR('"+w.id+"')",w.id?"confirm2('Delete this record?',()=>delRecord('warehouse','"+w.id+"'))":"")}`,true);
}

function saveWR(id){
  if(!mVal("clientName")||!mVal("orderNumber")||!mVal("supplierName")){
    showToast("Client, Order Number and Supplier are required.","var(--red)"); return;
  }
  const rec={
    id:id||uid("WR"),
    clientName:mVal("clientName"), purchaseDate:mVal("purchaseDate"),
    orderNumber:mVal("orderNumber"), qty:Number(mVal("qty"))||0,
    unitsOrBundles:mVal("unitsOrBundles"), supplierName:mVal("supplierName"),
    asin:mVal("asin"), itemCode:mVal("itemCode"), amazonBundle:mVal("amazonBundle"),
    gatedUngated:mVal("gatedUngated"), fulfillmentType:mVal("fulfillmentType"),
    amazonDesc:mVal("amazonDesc"), unitCost:Number(mVal("unitCost"))||0,
    deliveryDate:mVal("deliveryDate"), trackingNumber:mVal("trackingNumber"),
    princessNote:mVal("princessNote"), linkToInvoice:mVal("linkToInvoice"),
    receivedStatus:mVal("receivedStatus"),
    qtyReceivedWarehouse:Number(mVal("qtyReceivedWarehouse"))||0,
    warehouseNotes:mVal("warehouseNotes"), readyForInvoice:mVal("readyForInvoice"),
    locationInWarehouse:mVal("locationInWarehouse"), weightDimension:mVal("weightDimension"),
    expDate:mVal("expDate"), orderStatus:mVal("orderStatus"),
    sku:mVal("sku"), skuStatus:mVal("skuStatus"), shippingLabels:mVal("shippingLabels"),
  };
  upsert("warehouse",rec); notifyOnSave("warehouse",rec,!id); closeModal();
  showToast("Warehouse record saved","var(--green)");
  pageWarehouse();
}

function exportWRCSV(){
  const cols=["Client Name","Purchase Date","Order Number","Qty","Units/Bundles","Supplier Name","ASIN","Item Code","Amazon Bundle","Gated/Ungated","FBA/FBM/2DS","Amazon Description","Unit Cost","Delivery Date","Tracking Number","Princess Note","Link to Invoice","Received Status","QTY Received","Warehouse Notes","Ready for Invoice","Location in WH","Weight & Dim.","EXP Date","Order Status","SKU","SKU Status","Shipping Labels"];
  const csv=[cols.join(","),...DB.warehouse.map(w=>[
    w.clientName||"",w.purchaseDate||"",w.orderNumber||"",w.qty||0,
    w.unitsOrBundles||"",w.supplierName||"",w.asin||"",w.itemCode||"",
    w.amazonBundle||"",w.gatedUngated||"",w.fulfillmentType||"",
    `"${(w.amazonDesc||"").replace(/"/g,'""')}"`,w.unitCost||0,
    w.deliveryDate||"",w.trackingNumber||"",
    `"${(w.princessNote||"").replace(/"/g,'""')}"`,
    w.linkToInvoice||"",w.receivedStatus||"",w.qtyReceivedWarehouse||0,
    `"${(w.warehouseNotes||"").replace(/"/g,'""')}"`,
    w.readyForInvoice||"",w.locationInWarehouse||"",w.weightDimension||"",
    w.expDate||"",w.orderStatus||"",
    w.sku||"",w.skuStatus||"",
    `"${(w.shippingLabels||"").replace(/"/g,'""')}"`
  ].join(","))].join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download="AW_WarehouseReceivables_"+TODAY+".csv"; a.click();
  showToast("Export complete","var(--green)");
}

// ═══════════════════════════════════════════════
//  PAGE: PURCHASES
// ═══════════════════════════════════════════════

