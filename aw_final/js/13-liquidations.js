// ── 13-liquidations.js ──

function pageLiquidations(){
  const liqSearch=(window._liqSearch)||"";
  const liqStatusF=(window._liqStatusF)||"All";
  const _liqStatusF = liqStatusF;

  // Purchasers edit: Status, AWL Charge, AWL Invoice, Accounting Note
  // Customer Service fills: Date, Item Owner, Original Invoice, ASIN, Qty, Total Amount, Transfer To, Notes, Manager
  const isPurchaser = currentUser&&["Admin","Manager","Purchaser"].includes(currentUser.role);
  const isCS        = currentUser&&["Admin","Manager","Customer Service"].includes(currentUser.role);

  const liqRows=DB.liquidations.filter(l=>{
    const ms=liqStatusF==="All"||l.status===liqStatusF;
    const mq=!liqSearch||
      (l.itemOwner||"").toLowerCase().includes(liqSearch.toLowerCase())||
      (l.asin||"").toLowerCase().includes(liqSearch.toLowerCase())||
      (l.originalInvoice||"").toLowerCase().includes(liqSearch.toLowerCase())||
      (l.transferTo||"").toLowerCase().includes(liqSearch.toLowerCase());
    return ms&&mq;
  });

  const totalAmt = liqRows.reduce((s,l)=>s+(Number(l.totalAmount)||0),0);
  const totalCharge = liqRows.reduce((s,l)=>s+(Number(l.awlCharge)||0),0);

  render(`
  <div>
    <div class="page-header">
      <div><div class="page-title">Liquidations</div>
      <div class="page-sub">${DB.liquidations.length} records · AWL Charges: $${num(totalCharge.toFixed(2))}</div></div>
      ${canSubmit("liquidations")?'<button class="btn btn-primary" onclick="openLiqModal()">+ New Entry</button>':""}
    </div>

    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input class="search-bar" placeholder="Search owner, ASIN, invoice, transfer to…"
          value="${liqSearch}" oninput="window._liqSearch=this.value;pageLiquidations()"
          style="flex:1;min-width:200px;max-width:320px">
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${["All","Under Review","Approved","In Progress","Completed","Rejected"].map(s=>
            `<button class="filter-pill${_liqStatusF===s?" active":""}" onclick="window._liqStatusF='${s}';pageLiquidations()">${s}</button>`
          ).join("")}
        </div>
      </div>
    </div>

    <div class="metrics metrics-4" style="margin-bottom:1.25rem">
      ${metric("Total",DB.liquidations.length,"","var(--accent)")}
      ${metric("Under Review",DB.liquidations.filter(l=>l.status==="Under Review").length,"","var(--yellow)")}
      ${metric("Completed",DB.liquidations.filter(l=>l.status==="Completed").length,"","var(--green)")}
      ${metric("Total Amount","$"+num(Math.round(totalAmt)),"","var(--teal)")}
    </div>

    ${isPurchaser?`<div class="alert-banner" style="background:rgba(79,142,247,.08);border:1px solid rgba(79,142,247,.2);color:var(--accent);border-radius:var(--r);padding:10px 14px;margin-bottom:12px;font-size:12px">
      ✏️ <strong>Purchaser view:</strong> You can edit Status, AWL Charge, AWL Invoice and Accounting Note directly in the table.
    </div>`:""}
    ${isCS&&!isPurchaser?`<div class="alert-banner" style="background:rgba(79,207,142,.08);border:1px solid rgba(79,207,142,.2);color:var(--green);border-radius:var(--r);padding:10px 14px;margin-bottom:12px;font-size:12px">
      ✏️ <strong>Customer Service view:</strong> You can fill all entry details via the Edit button.
    </div>`:""}

    <div class="card" style="padding:0;overflow:hidden">
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th>Status</th>
            <th>AWL Charge</th>
            <th>AWL Invoice</th>
            <th>Accounting Note</th>
            <th>Date</th>
            <th>Owner of Item</th>
            <th>Original Invoice</th>
            <th>ASIN</th>
            <th>Qty</th>
            <th>Total Amount</th>
            <th>Transferring To</th>
            <th>Notes</th>
            <th>Manager</th>
            <th></th>
          </tr></thead>
          <tbody>
          ${liqRows.length===0?`<tr><td colspan="14" style="text-align:center;color:var(--muted);padding:2.5rem">No records found</td></tr>`:""}
          ${liqRows.map(l=>{
            const statusColor={
              "Under Review":"var(--yellow)","Approved":"var(--green)",
              "In Progress":"var(--accent)","Completed":"var(--teal)",
              "Rejected":"var(--red)"
            }[l.status]||"var(--muted)";

            // Status cell — inline dropdown for Purchasers
            const statusCell = isPurchaser
              ? `<select onchange="saveLiqField('${l.id}','status',this.value)"
                  style="background:rgba(0,0,0,.3);border:1px solid ${statusColor}40;border-radius:20px;
                         padding:3px 8px;color:${statusColor};font-size:11px;font-weight:700;
                         font-family:var(--font);outline:none;cursor:pointer">
                  ${["Under Review","Approved","In Progress","Completed","Rejected"].map(s=>
                    `<option value="${s}"${l.status===s?" selected":""}>${s}</option>`
                  ).join("")}
                </select>`
              : `<span class="badge" style="background:${statusColor}18;color:${statusColor}">${l.status||"—"}</span>`;

            // AWL Charge — inline for Purchasers
            const awlChargeCell = isPurchaser
              ? `<input type="number" value="${l.awlCharge||""}"
                  onblur="saveLiqField('${l.id}','awlCharge',this.value)"
                  style="background:transparent;border:1px solid var(--border);border-radius:var(--r);
                         padding:4px 8px;color:var(--orange);font-weight:600;font-family:var(--mono);
                         font-size:12px;width:90px;outline:none">`
              : `<span style="color:var(--orange);font-weight:600">${l.awlCharge!=null?"$"+Number(l.awlCharge).toFixed(2):"—"}</span>`;

            // AWL Invoice — inline for Purchasers
            const awlInvCell = isPurchaser
              ? `<input type="text" value="${(l.awlInvoice||"").replace(/"/g,'&quot;')}"
                  onblur="saveLiqField('${l.id}','awlInvoice',this.value)"
                  style="background:transparent;border:1px solid var(--border);border-radius:var(--r);
                         padding:4px 8px;color:var(--muted);font-family:var(--mono);
                         font-size:11px;width:120px;outline:none" placeholder="INV-...">`
              : `<span class="mono" style="font-size:11px;color:var(--muted)">${l.awlInvoice||"—"}</span>`;

            // Accounting Note — inline textarea trigger for Purchasers
            const accNoteCell = isPurchaser
              ? `<div style="display:flex;align-items:center;gap:4px">
                  <span style="font-size:12px;color:var(--muted);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.accountingNote||"—"}</span>
                  <button onclick="openLiqNoteModal('${l.id}','accountingNote')"
                    style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:13px;padding:2px" title="Edit note">✏️</button>
                </div>`
              : `<span style="font-size:12px;color:var(--muted);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block" title="${l.accountingNote||""}">${l.accountingNote||"—"}</span>`;

            return `<tr>
              <td>${statusCell}</td>
              <td>${awlChargeCell}</td>
              <td>${awlInvCell}</td>
              <td>${accNoteCell}</td>
              <td style="font-size:12px;color:var(--muted)">${l.date||"—"}</td>
              <td style="font-weight:500;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${l.itemOwner||""}">${l.itemOwner||"—"}</td>
              <td class="mono" style="font-size:11px;color:var(--muted)">${l.originalInvoice||"—"}</td>
              <td class="mono" style="font-size:11px;color:var(--accent)">${l.asin||"—"}</td>
              <td style="color:var(--muted);font-weight:500">${l.qty!=null?num(l.qty):"—"}</td>
              <td style="color:var(--teal);font-weight:700">${l.totalAmount!=null?"$"+num(Number(l.totalAmount).toFixed(2)):"—"}</td>
              <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px" title="${l.transferTo||""}">${l.transferTo||"—"}</td>
              <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--muted)" title="${l.notes||""}">${l.notes||"—"}</td>
              <td style="font-size:12px">${l.manager||"—"}</td>
              <td>${canEdit("liquidations")?`<button class="btn btn-info btn-sm" onclick='openLiqModal(${JSON.stringify(l).replace(/'/g,"&#39;")})'>Edit</button>`:""}</td>
            </tr>`;
          }).join("")}
          </tbody>
        </table>
      </div>
      <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${liqRows.length} of ${DB.liquidations.length} records</div>
    </div>
  </div>`);
}

function saveLiqField(id, field, value){
  const l = DB.liquidations.find(x=>x.id===id);
  if(!l) return;
  l[field] = field==="awlCharge"||field==="qty"||field==="totalAmount" ? Number(value)||0 : value;
  saveToLocalStorage();
  showToast("Saved","var(--green)");
}

function openLiqNoteModal(id, field){
  const l = DB.liquidations.find(x=>x.id===id);
  if(!l) return;
  const label = field==="accountingNote"?"Accounting Note":"Note";
  openModal(`${mHeader("Edit "+label)}
  <div class="modal-body">
    <textarea name="liq_note" class="form-input" rows="4" style="resize:vertical">${(l[field]||"").replace(/</g,"&lt;")}</textarea>
  </div>
  <div class="modal-footer" style="justify-content:flex-end;gap:8px">
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveLiqNote('${id}','${field}')">Save</button>
  </div>`);
}

function saveLiqNote(id, field){
  const val = document.querySelector("[name='liq_note']")?.value||"";
  saveLiqField(id, field, val);
  closeModal();
  pageLiquidations();
}

function openLiqModal(l=null){
  const isNew=!l;
  l=l||{id:"",status:"Under Review",awlCharge:"",awlInvoice:"",accountingNote:"",
         date:TODAY,itemOwner:"",originalInvoice:"",asin:"",qty:"",
         totalAmount:"",transferTo:"",notes:"",manager:""};

  openModal(`${mHeader(isNew?"New Liquidation Entry":"Edit Liquidation Entry")}
  <div class="modal-body"><div class="form-grid">
    ${mField("Date","date",l.date,"date","",true)}
    ${mField("Manager","manager",l.manager,"select","Daniel,Merylle,Wilson,Kin",true)}
    <div class="form-full">${mField("Owner of Item (Client)","itemOwner",l.itemOwner,"text","e.g. arc129 William Oaks",true)}</div>
    ${mField("Original Invoice","originalInvoice",l.originalInvoice,"text","e.g. ORI-2024-001",true)}
    ${mField("ASIN","asin",l.asin,"text","e.g. B08N5WRWNW",true)}
    ${mField("Quantity","qty",l.qty,"number","",true)}
    ${mField("Total Amount ($)","totalAmount",l.totalAmount,"number","",true)}
    <div class="form-full">${mField("Transferring Item To (Client Name)","transferTo",l.transferTo,"text","e.g. arc196 Daniel Martinez",true)}</div>
    <div class="form-full">${mField("Notes","notes",l.notes,"textarea","",true)}</div>
  </div></div>
  ${mFooter("saveLiq('"+l.id+"')",l.id?"confirm2('Delete this entry?',()=>delRecord('liquidations','"+l.id+"'))":"")}`);
}

function saveLiq(id){
  const existing = DB.liquidations.find(x=>x.id===id)||{};
  const required = ["date","manager","itemOwner","originalInvoice","asin","qty","totalAmount","transferTo","notes"];
  const labels   = {date:"Date",manager:"Manager",itemOwner:"Owner of Item",originalInvoice:"Original Invoice",asin:"ASIN",qty:"Quantity",totalAmount:"Total Amount",transferTo:"Transferring Item To",notes:"Notes"};
  for(const f of required){
    if(!mVal(f)){
      showToast(labels[f]+" is required.","var(--red)");
      // highlight the field
      const el = document.querySelector(`[name="${f}"]`);
      if(el){ el.style.borderColor="var(--red)"; el.focus(); setTimeout(()=>el.style.borderColor="",2000); }
      return;
    }
  }
  const rec = {
    ...existing,
    id:              id||uid("LIQ"),
    date:            mVal("date"),
    manager:         mVal("manager"),
    itemOwner:       mVal("itemOwner"),
    originalInvoice: mVal("originalInvoice"),
    asin:            mVal("asin"),
    qty:             Number(mVal("qty")),
    totalAmount:     Number(mVal("totalAmount")),
    transferTo:      mVal("transferTo"),
    notes:           mVal("notes"),
  };
  upsert("liquidations",rec);
  notifyOnSave("liquidations",rec,!id);
  closeModal();
  pageLiquidations();
}

// ═══════════════════════════════════════════════
//  PAGE: SHIPPING LABELS
// ═══════════════════════════════════════════════
const CARRIER_COLORS={UPS:"#FFB500",FedEx:"#FF6600",DHL:"#FFCC00",LBC:"#D32F2F","J&T Express":"#E53935","Ninja Van":"#00BCD4","2GO":"#1565C0"};


