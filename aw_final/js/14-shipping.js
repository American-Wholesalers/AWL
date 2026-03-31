// ── 14-shipping.js ──

function pageShipping(){
  const search=(window._slSearch)||"";
  const payF=(window._slPayF)||"All";
  const _slPayF = window._slPayF||"All";
  const courierF=(window._slCourierF)||"All";
  const _slCourierF = window._slCourierF||"All";
  const canEditPayment=currentUser&&["Admin","Manager","Purchaser"].includes(currentUser.role);

  const rows=DB.shipping.filter(r=>{
    const mp=payF==="All"||r.paymentStatus===payF;
    const mc=courierF==="All"||r.courier===courierF;
    const ms=!search||
      (r.trackingNo||"").toLowerCase().includes(search.toLowerCase())||
      (r.senderCompany||"").toLowerCase().includes(search.toLowerCase())||
      (r.awlInvoice||"").toLowerCase().includes(search.toLowerCase())||
      (r.recipient||"").toLowerCase().includes(search.toLowerCase());
    return mp&&mc&&ms;
  });

  const totalAmount=rows.reduce((s,r)=>s+(Number(r.amount)||0),0);
  const totalUnpaid=rows.filter(r=>r.paymentStatus==="Unpaid").reduce((s,r)=>s+(Number(r.amount)||0),0);

  render(`
  <div>
    <div class="page-header">
      <div><div class="page-title">Shipping Labels</div><div class="page-sub">Outbound shipment tracking · ${DB.shipping.length} records</div></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="exportSLCSV()">↓ Export</button>
        ${canSubmit("shipping")?'<button class="btn btn-primary" onclick="openSLModal()">+ Create Label</button>':""}
      </div>
    </div>

    <div class="metrics metrics-4" style="margin-bottom:1.25rem">
      ${metric("Total Labels",DB.shipping.length,"","var(--accent)")}
      ${metric("Paid",DB.shipping.filter(r=>r.paymentStatus==="Paid").length,"","var(--green)")}
      ${metric("Unpaid",DB.shipping.filter(r=>r.paymentStatus==="Unpaid").length,"","var(--red)")}
      ${metric("Total Unpaid Amount","$"+num(Math.round(totalUnpaid)),"","var(--orange)")}
    </div>

    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input class="search-bar" placeholder="Search tracking, sender, invoice, recipient…"
          value="${search}" oninput="window._slSearch=this.value;pageShipping()" style="flex:1;min-width:200px;max-width:320px">
        <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap">
          <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--dim)">Payment:</span>
          ${["All","Paid","Unpaid"].map(s=>
            `<button class="filter-pill${payF===s?" active":""}" onclick="window._slPayF='${s}';pageShipping()">${s}</button>`
          ).join("")}
          <span style="width:1px;height:18px;background:var(--border);margin:0 4px"></span>
          <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--dim)">Courier:</span>
          ${["All","UPS","USPS","FedEx"].map(s=>
            `<button class="filter-pill${courierF===s?" active":""}" onclick="window._slCourierF='${s}';pageShipping()">${s}</button>`
          ).join("")}
        </div>
      </div>
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th>Date</th>
            <th>Tracking Number</th>
            <th>Sender Company</th>
            <th>AWL Charge</th>
            <th>AWL Invoice</th>
            <th>Status of Payment</th>
            <th>Amount</th>
            <th>Courier</th>
            <th></th>
          </tr></thead>
          <tbody>
          ${rows.length===0?`<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:2.5rem">No records found</td></tr>`:""}
          ${rows.map(r=>{
            const paid=r.paymentStatus==="Paid";
            const rowBg=paid?"":"background:rgba(247,92,92,.04)";
            const courierColor={"UPS":"#FF6B00","USPS":"#004B87","FedEx":"#4D148C"}[r.courier]||"var(--muted)";
            return `<tr style="${rowBg}">
              <td style="font-size:12px;color:var(--muted)">${r.date||"—"}</td>
              <td class="mono" style="font-size:11px;color:var(--accent);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.trackingNo||""}">${r.trackingNo||"—"}</td>
              <td style="font-weight:500">${r.senderCompany||"—"}</td>
              <td style="color:var(--orange);font-weight:600">${r.awlCharge!=null?"$"+Number(r.awlCharge).toFixed(2):"—"}</td>
              <td class="mono" style="font-size:11px;color:var(--muted)">${r.awlInvoice||"—"}</td>
              <td>
                ${canEditPayment
                  ? `<select onchange="saveSLField('${r.id}','paymentStatus',this.value);pageShipping()"
                      style="background:${paid?"rgba(79,207,142,.12)":"rgba(247,92,92,.12)"};border:1px solid ${paid?"rgba(79,207,142,.3)":"rgba(247,92,92,.3)"};border-radius:20px;padding:3px 10px;color:${paid?"var(--green)":"var(--red)"};font-size:11px;font-weight:700;font-family:var(--font);outline:none;cursor:pointer">
                      <option value="Paid"${paid?" selected":""}>Paid</option>
                      <option value="Unpaid"${!paid?" selected":""}>Unpaid</option>
                    </select>`
                  : `<span class="badge" style="background:${paid?"rgba(79,207,142,.12)":"rgba(247,92,92,.12)"};color:${paid?"var(--green)":"var(--red)"}">${r.paymentStatus||"—"}</span>`}
              </td>
              <td style="color:var(--teal);font-weight:700">${r.amount!=null?"$"+num(Number(r.amount).toFixed(2)):"—"}</td>
              <td style="font-weight:700;color:${courierColor}">${r.courier||"—"}</td>
              <td>${canEdit("shipping")?`<button class="btn btn-info btn-sm" onclick='openSLModal(${JSON.stringify(r).replace(/'/g,"&#39;")})'>Edit</button>`:""}</td>
            </tr>`;
          }).join("")}
          </tbody>
        </table>
      </div>
      <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${rows.length} of ${DB.shipping.length} records</div>
    </div>
  </div>`);
}

function saveSLField(id, field, value){
  const r=DB.shipping.find(x=>x.id===id);
  if(!r) return;
  r[field]=value;
  showToast("Saved","var(--green)");
}

function openSLModal(sl=null){
  const isNew=!sl;
  sl=sl||{id:"",date:TODAY,trackingNo:"",senderCompany:"American Wholesalers",awlCharge:"",awlInvoice:"",paymentStatus:"Unpaid",amount:"",courier:"UPS",recipient:"",client:""};
  openModal(`${mHeader(isNew?"Create Shipping Label":"Edit Label")}
  <div class="modal-body"><div class="form-grid">
    <div class="form-full">${clientSelect("client",sl.client||"")}</div>
    ${mField("Date","date",sl.date,"date")}
    ${mField("Tracking Number","trackingNo",sl.trackingNo,"text","Leave blank to auto-generate")}
    ${mField("Sender Company","senderCompany",sl.senderCompany,"text","e.g. American Wholesalers")}
    ${mField("AWL Charge ($)","awlCharge",sl.awlCharge,"number")}
    ${mField("AWL Invoice","awlInvoice",sl.awlInvoice,"text","e.g. INV-2026-001")}
    ${mField("Status of Payment","paymentStatus",sl.paymentStatus,"select","Unpaid,Paid")}
    ${mField("Amount ($)","amount",sl.amount,"number")}
    ${mField("Courier","courier",sl.courier,"select","UPS,USPS,FedEx")}
    <div class="form-full">${mField("Recipient","recipient",sl.recipient,"text")}</div>
  </div></div>
  ${mFooter("saveSL('"+sl.id+"')",sl.id?"confirm2('Delete this label?',()=>delRecord('shipping','"+sl.id+"'))":"")}`);
}

function saveSL(id){
  const rec={
    id:id||uid("SL"),
    date:mVal("date")||TODAY,
    trackingNo:mVal("trackingNo")||"TRK-"+String(Date.now()).slice(-8),
    senderCompany:mVal("senderCompany"),
    awlCharge:Number(mVal("awlCharge"))||0,
    awlInvoice:mVal("awlInvoice"),
    paymentStatus:mVal("paymentStatus")||"Unpaid",
    amount:Number(mVal("amount"))||0,
    courier:mVal("courier"),
    recipient:mVal("recipient"),
    client:mVal("client"),
  };
  upsert("shipping",rec); notifyOnSave("shipping",rec,!id); closeModal(); pageShipping();
}

function exportSLCSV(){
  const cols=["Date","Tracking Number","Sender Company","AWL Charge","AWL Invoice","Payment Status","Amount","Courier","Recipient","Client"];
  const csv=[cols.join(","),...DB.shipping.map(r=>[
    r.date||"",r.trackingNo||"",`"${(r.senderCompany||"").replace(/"/g,'""')}"`,
    r.awlCharge||0,r.awlInvoice||"",r.paymentStatus||"",r.amount||0,
    r.courier||"",r.recipient||"",r.client||""
  ].join(","))].join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download="AW_Shipping_"+TODAY+".csv"; a.click();
  showToast("Exported","var(--green)");
}

// ═══════════════════════════════════════════════
//  PAGE: PRODUCT RESEARCH
// ═══════════════════════════════════════════════
const PR_NAMES = ["Gerald Napiza","Marjorie Bayani","Rex","Gerald James Maron","Christian Bayani","Aldrin Pizarra","Homer Medina","Winson Costales","Jayson Lee Barretto","Marc David"];
const APPROVER_NAMES = ["Kin","Daniel","Merylle","Wilson"];
const ASIN_STATUSES = ["Not Profitable","Restricted","Kin Reviewing","Gated","Ready for PO","Transferred to PO","Purchased","Brand/Amazon on Listing"];


