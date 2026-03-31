// ── 09-amazon.js ──

function pageAmazon(){
  const search=(window._amzSearch)||"";
  const statusF=(window._amzStatusF)||"All";
  const _amzStatusF = window._amzStatusF||"All";
  const canEdit = ["Admin","Manager","Purchaser"].includes(currentUser?.role) || currentUser?.name==="Kin";

  const rows=DB.amazon.filter(r=>{
    const ms=statusF==="All"||r.status===statusF;
    const mq=!search||
      (r.orderNumber||"").toLowerCase().includes(search.toLowerCase())||
      (r.client||"").toLowerCase().includes(search.toLowerCase())||
      (r.asin||"").toLowerCase().includes(search.toLowerCase())||
      (r.supplier||"").toLowerCase().includes(search.toLowerCase())||
      (r.itemCode||"").toLowerCase().includes(search.toLowerCase());
    return ms&&mq;
  });

  const totalVendor=rows.reduce((s,r)=>s+(Number(r.awlVendorPayment)||0),0);
  const totalProfit=rows.reduce((s,r)=>s+(Number(r.profit)||0),0);

  render(`
  <div>
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:28px;height:28px;background:#FF9900;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#000;font-size:14px">a</div>
        <div><div class="page-title">Amazon Purchases</div><div class="page-sub">${DB.amazon.length} orders${!canEdit?' · View only':''}</div></div>
      </div>
      <div style="display:flex;gap:8px">
        ${canEdit?`<button class="btn btn-ghost btn-sm" onclick="exportAMZCSV()">↓ Export</button>`:""}
      </div>
    </div>

    ${!canEdit?`<div style="background:rgba(79,142,247,.07);border:1px solid rgba(79,142,247,.2);border-radius:var(--r);padding:10px 14px;margin-bottom:14px;font-size:12px;color:var(--muted);display:flex;align-items:center;gap:8px">
      <span style="font-size:16px">👁️</span>
      <span>You have <strong style="color:var(--text)">view-only</strong> access to Amazon Purchases.</span>
    </div>`:""}

    <div class="metrics metrics-4" style="margin-bottom:1.25rem">
      ${metric("Total Orders",DB.amazon.length,"","#FF9900")}
      ${metric("Purchased",DB.amazon.filter(r=>r.status==="Purchased").length,"","var(--green)")}
      ${metric("Total Vendor Payment","$"+num(Math.round(totalVendor)),"","var(--accent)")}
      ${metric("Total Profit","$"+num(Math.round(totalProfit)),"","var(--teal)")}
    </div>

    <!-- Filters -->
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input class="search-bar" placeholder="Search order#, client, ASIN, supplier, item code…"
          value="${search}" oninput="window._amzSearch=this.value;pageAmazon()" style="flex:1;min-width:200px;max-width:320px">
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${["All","Purchased","Cancelled","Pending MOQ","Pending OOS","Pending"].map(s=>
            `<button class="filter-pill${statusF===s?" active":""}" onclick="window._amzStatusF='${s}';pageAmazon()">${s}</button>`
          ).join("")}
        </div>
      </div>
    </div>

    ${renderAMZOverdueBanner(canEdit)}

    <!-- Table -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r2);overflow:hidden">
      <div style="overflow-x:auto">
        <table style="width:max-content;min-width:100%">
          <thead><tr style="background:#0d1b3e;position:sticky;top:0;z-index:2">
            <th style="min-width:140px">Status</th>
            <th style="min-width:160px">New ASIN / Replen.</th>
            <th style="min-width:160px">Client</th>
            <th style="min-width:120px">Date Transferred</th>
            <th style="min-width:120px">Purchase Date</th>
            <th style="min-width:160px">Order Number</th>
            <th style="min-width:80px">Units</th>
            <th style="min-width:130px">Purchase Type</th>
            <th style="min-width:120px">2DS/FBA/FBM</th>
            <th style="min-width:150px">AWL Vendor Payment</th>
            <th style="min-width:140px">Supplier</th>
            <th style="min-width:130px">Manager</th>
            <th style="min-width:120px">ASIN</th>
            <th style="min-width:130px">Amazon Link</th>
            <th style="min-width:130px">Supplier Link</th>
            <th style="min-width:140px">Amazon Bundles</th>
            <th style="min-width:150px">Quickbooks Invoice</th>
            <th style="min-width:140px">Stripe Invoice</th>
            <th style="min-width:120px">Delivery Date</th>
            <th style="min-width:150px">Tracking Number</th>
            <th style="min-width:160px">Client Payment to AWL</th>
            <th style="min-width:120px">Invoice Sent</th>
            <th style="min-width:180px">Payment Status</th>
            <th style="min-width:100px">Profit</th>
            <th style="min-width:140px">Date Invoice Paid</th>
            <th style="min-width:160px">Supplier Invoice Date</th>
            <th style="min-width:90px">Refund</th>
            <th style="min-width:120px">Date Refund</th>
            <th style="min-width:160px">Notes</th>
            <th style="min-width:200px">Delay Reason</th>
            <th style="min-width:120px">Item Code</th>
            <th style="min-width:180px">Supplier Invoice Number</th>
            <th style="min-width:70px"></th>
          </tr></thead>
          <tbody>
          ${rows.length===0?`<tr><td colspan="28" style="text-align:center;color:var(--muted);padding:2.5rem">No records match your filters</td></tr>`:""}
          ${rows.map(r=>{
            const stColors={Purchased:"rgba(79,207,142,.15)",Cancelled:"rgba(247,92,92,.15)","Pending MOQ":"rgba(247,201,79,.15)","Pending OOS":"rgba(251,146,60,.15)",Pending:"rgba(107,118,148,.15)"};
            const stText={Purchased:"var(--green)",Cancelled:"var(--red)","Pending MOQ":"var(--yellow)","Pending OOS":"var(--orange)",Pending:"var(--muted)"};
            const psColors={Paid:"rgba(79,207,142,.15)","Paid/Pending to pay Supplier":"rgba(247,201,79,.15)",Open:"rgba(247,92,92,.15)"};
            const psText={Paid:"var(--green)","Paid/Pending to pay Supplier":"var(--yellow)",Open:"var(--red)"};
            const inSel = (field, val, opts, extraStyle="") => canEdit
              ? `<select onchange="saveAMZField('${r.id}','${field}',this.value)"
                  style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:var(--text);font-size:11px;font-family:var(--font);outline:none;cursor:pointer;${extraStyle}">
                  ${opts.map(o=>`<option value="${o}"${val===o?" selected":""}>${o||"— Not set —"}</option>`).join("")}
                </select>`
              : val||"—";
            const inText = (field, val, w="120px", color="var(--text)") => canEdit
              ? `<input type="text" value="${val||""}" onchange="saveAMZField('${r.id}','${field}',this.value)"
                  style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:${color};font-size:11px;font-family:var(--font);outline:none;width:${w}">`
              : `<span style="font-size:12px;color:${color}">${val||"—"}</span>`;
            const inDate = (field, val) => canEdit
              ? `<input type="date" value="${val||""}" onchange="saveAMZField('${r.id}','${field}',this.value)"
                  style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:var(--text);font-size:11px;font-family:var(--font);outline:none;width:130px">`
              : `<span style="font-size:12px;color:var(--muted)">${val||"—"}</span>`;
            const inNum = (field, val, color="var(--text)") => canEdit
              ? `<input type="number" value="${val||""}" onchange="saveAMZField('${r.id}','${field}',this.value)"
                  style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:${color};font-size:11px;font-family:var(--font);outline:none;width:90px">`
              : `<span style="color:${color};font-weight:600">${val!=null?"$"+Number(val).toFixed(2):"—"}</span>`;

            const rowBg = {
              "Purchased":   "background:rgba(79,207,142,.07);border-left:3px solid var(--green)",
              "Pending":     "background:rgba(247,201,79,.06);border-left:3px solid var(--yellow)",
              "Pending MOQ": "background:rgba(247,201,79,.06);border-left:3px solid var(--yellow)",
              "Pending OOS": "background:rgba(247,201,79,.06);border-left:3px solid var(--yellow)",
              "Cancelled":   "background:rgba(247,92,92,.07);border-left:3px solid var(--red)",
            }[r.status]||"";

            return `<tr style="${rowBg}">
              <td>${inSel("status",r.status,["Purchased","Cancelled","Pending MOQ","Pending OOS","Pending"])}</td>
              <td>
                <span style="font-size:11px;padding:2px 8px;border-radius:20px;font-weight:600;background:${r.asinType==="New ASIN"?"rgba(167,139,250,.15)":"rgba(79,142,247,.12)"};color:${r.asinType==="New ASIN"?"#a78bfa":"var(--accent)"}">${r.asinType||"—"}</span>
                ${r.fromResearchId?`<span style="display:block;font-size:9px;color:var(--muted);margin-top:2px;text-align:center">📋 From Research</span>`:""}
              </td>
              <td style="font-size:12px;color:var(--accent);font-weight:500">${r.client||"—"}</td>
              <td>${inDate("transferDate",r.transferDate)}</td>
              <td>${inDate("purchaseDate",r.purchaseDate)}</td>
              <td>${inText("orderNumber",r.orderNumber,"140px","#FF9900")}</td>
              <td style="font-weight:700">${r.units||"—"}</td>
              <td><span class="tag">${r.purchaseType||"—"}</span></td>
              <td>${inSel("fulfillmentType",r.fulfillmentType||"FBA",["FBA","FBM","2DS"])}</td>
              <td>${inNum("awlVendorPayment",r.awlVendorPayment,"var(--green)")}</td>
              <td>${inText("supplier",r.supplier,"130px")}</td>
              <td>${inText("manager",r.manager,"120px")}</td>
              <td class="mono" style="font-size:11px;color:var(--accent)">${r.asin||"—"}</td>
              <td style="font-size:12px">
                ${canEdit
                  ? inText("amazonLink",r.amazonLink,"120px","var(--accent)")
                  : r.amazonLink?`<a href="${r.amazonLink}" target="_blank" style="color:var(--accent);text-decoration:underline">View</a>`:"—"}
              </td>
              <td style="font-size:12px">
                ${canEdit
                  ? inText("supplierLink",r.supplierLink,"120px","var(--accent)")
                  : r.supplierLink?`<a href="${r.supplierLink}" target="_blank" style="color:var(--accent);text-decoration:underline">View</a>`:"—"}
              </td>
              <td>${inText("amazonBundles",r.amazonBundles,"110px","var(--muted)")}</td>
              <td>${inText("qbInvoice",r.qbInvoice,"130px","var(--muted)")}</td>
              <td>${inText("stripeInvoice",r.stripeInvoice,"120px","var(--muted)")}</td>
              <td>${inDate("deliveryDate",r.deliveryDate)}</td>
              <td>${inText("trackingNumber",r.trackingNumber,"140px","var(--muted)")}</td>
              <td>${inNum("clientPaymentToAwl",r.clientPaymentToAwl,"var(--teal)")}</td>
              <td>${inSel("invoiceSent",r.invoiceSent,["No","Yes"])}</td>
              <td>${inSel("paymentStatus",r.paymentStatus,["Open","Paid","Paid/Pending to pay Supplier"])}</td>
              <td>${inNum("profit",r.profit,Number(r.profit)>=0?"var(--green)":"var(--red)")}</td>
              <td>${inDate("dateInvoicePaid",r.dateInvoicePaid)}</td>
              <td>${inDate("supplierInvoiceDate",r.supplierInvoiceDate)}</td>
              <td>${inNum("refund",r.refund,Number(r.refund)>0?"var(--red)":"var(--muted)")}</td>
              <td>${inDate("dateRefund",r.dateRefund)}</td>
              <td style="max-width:160px">
                ${canEdit
                  ? `<div style="display:flex;align-items:center;gap:4px">
                      <span style="font-size:11px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:110px" title="${r.notes||""}">${r.notes||"—"}</span>
                      <button onclick="openAMZNoteModal('${r.id}')" style="flex-shrink:0;background:rgba(79,142,247,.12);border:1px solid rgba(79,142,247,.25);border-radius:5px;padding:2px 7px;color:var(--accent);font-size:10px;cursor:pointer;font-family:var(--font);font-weight:600">✏</button>
                    </div>`
                  : `<span style="font-size:12px;color:var(--muted)">${r.notes||"—"}</span>`}
              </td>
              <td style="max-width:200px">
                ${(()=>{
                  const isPendingOverdue = (r.status!=="Purchased"&&r.status!=="Cancelled") && r.transferDate && Math.ceil((new Date(TODAY)-new Date(r.transferDate))/(1000*60*60*24))>30;
                  if(!isPendingOverdue && !r.delayReason) return '<span style="font-size:12px;color:var(--dim)">—</span>';
                  return '<div style="display:flex;align-items:center;gap:4px">'
                    + (r.delayReason
                      ? '<span style="font-size:11px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px" title="'+r.delayReason+'">'+r.delayReason+'</span>'
                      : '<span style="font-size:11px;color:var(--red);font-style:italic">No reason yet</span>')
                    + (canEdit ? '<button onclick="openDelayReasonModal(&quot;'+r.id+'&quot;)" style="flex-shrink:0;background:rgba(247,92,92,.12);border:1px solid rgba(247,92,92,.25);border-radius:5px;padding:2px 7px;color:var(--red);font-size:10px;cursor:pointer;font-family:var(--font);font-weight:600">✏</button>' : '')
                    + '</div>';
                })()}
              </td>
              <td>${inText("itemCode",r.itemCode,"100px")}</td>
              <td>${inText("supplierInvoiceNumber",r.supplierInvoiceNumber,"150px","var(--muted)")}</td>
              <td>${canEdit?`<button class="btn btn-info btn-sm" onclick="openAMZById('${r.id}')">Edit</button>`:""}</td>
            </tr>`;
          }).join("")}
          </tbody>
        </table>
      </div>
      <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${rows.length} of ${DB.amazon.length} records · scroll horizontally to see all columns</div>
    </div>
  </div>`);
}

function renderAMZOverdueBanner(canEdit){
  var today = new Date(TODAY);
  var overdue = (DB.amazon||[]).filter(function(r){
    if(r.status==="Purchased"||r.status==="Cancelled") return false;
    if(!r.transferDate) return false;
    return Math.ceil((today-new Date(r.transferDate))/(1000*60*60*24)) > 30;
  });
  if(!overdue.length) return "";
  var items = overdue.map(function(r){
    var days = Math.ceil((today-new Date(r.transferDate))/(1000*60*60*24));
    var reasonHtml = r.delayReason
      ? '<span style="font-size:11px;color:var(--muted);font-style:italic;flex:1">Reason: '+r.delayReason+'</span>'
      : '<span style="font-size:11px;color:var(--red);font-style:italic;flex:1">⚠ No reason provided</span>';
    var btnHtml = canEdit
      ? '<button class="btn btn-sm" style="background:rgba(247,92,92,.15);color:var(--red);border:1px solid rgba(247,92,92,.3);font-size:11px;white-space:nowrap" onclick="openDelayReasonModal(&quot;'+r.id+'&quot;)">✏ Add Reason</button>'
      : '';
    return '<div style="background:rgba(0,0,0,.15);border-radius:var(--r);padding:8px 12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
      +'<span style="font-size:11px;font-weight:700;color:var(--red);white-space:nowrap">'+days+'d overdue</span>'
      +'<span style="font-size:12px;font-weight:600;color:var(--text)">'+(r.asin||"No ASIN")+'</span>'
      +'<span style="font-size:11px;color:var(--muted)">'+(r.client||"—")+'</span>'
      +'<span class="badge" style="background:rgba(247,201,79,.15);color:var(--yellow)">'+(r.status||"Pending")+'</span>'
      +reasonHtml
      +btnHtml
      +'</div>';
  }).join("");
  return '<div style="background:rgba(247,92,92,.08);border:1px solid rgba(247,92,92,.3);border-radius:var(--r);padding:12px 16px;margin-bottom:14px">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
      +'<span style="font-size:18px">⚠️</span>'
      +'<div>'
        +'<div style="font-size:13px;font-weight:700;color:var(--red)">Unpurchased ASINs Over 30 Days</div>'
        +'<div style="font-size:11px;color:var(--muted);margin-top:2px">'+overdue.length+' order'+(overdue.length!==1?'s':'')+" still pending — purchasers must provide a reason</div>"
      +'</div>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:6px">'+items+'</div>'
    +'</div>';
}

function openDelayReasonModal(id){
  var r = (DB.amazon||[]).find(function(x){ return x.id===id; });
  if(!r) return;
  openModal(mHeader("Delay Reason — "+(r.asin||r.id))
    +'<div class="modal-body">'
      +'<div style="font-size:12px;color:var(--muted);margin-bottom:10px">This ASIN has been pending for over 30 days. Please provide a reason why it has not been purchased yet.</div>'
      +'<div class="form-group">'
        +'<label class="form-label">Reason for Delay <span style="color:var(--red)">*</span></label>'
        +'<textarea name="delay-reason" class="form-input" rows="4" placeholder="e.g. Waiting for supplier quote, MOQ too high, client on hold...">'+(r.delayReason||"")+'</textarea>'
      +'</div>'
    +'</div>'
    +mFooter("saveDelayReason('"+id+"')")
  );
}

function saveDelayReason(id){
  var r = (DB.amazon||[]).find(function(x){ return x.id===id; });
  if(!r) return;
  var reason = mVal("delay-reason");
  if(!reason){ showToast("Please enter a reason","var(--red)"); return; }
  r.delayReason = reason;

  // Build list of usernames to notify
  var targets = [];

  // 1. Notify the manager on the Amazon record (match by name to USERS)
  if(r.manager){
    var managerUser = USERS.find(function(u){ return u.name===r.manager || u.username===r.manager; });
    if(managerUser && !targets.includes(managerUser.username)) targets.push(managerUser.username);
    // Also search DB.users
    if(DB.users){ var du=DB.users.find(function(u){ return u.name===r.manager||u.username===r.manager; }); if(du&&!targets.includes(du.username)) targets.push(du.username); }
  }

  // 2. Notify CS reps assigned to this client via csAssignments
  if(r.client && DB.csAssignments){
    var clientRec = (DB.clients||[]).find(function(c){ return c.name===r.client||c.id===r.client; });
    var clientId = clientRec ? clientRec.id : null;
    DB.csAssignments.forEach(function(a){
      if(clientId && a.clientIds && a.clientIds.includes(clientId)){
        if(a.csUsername && !targets.includes(a.csUsername)) targets.push(a.csUsername);
      }
    });
  }

  // 3. Always notify Admins
  USERS.forEach(function(u){ if((u.role==="Admin"||u.role==="Head") && !targets.includes(u.username)) targets.push(u.username); });

  // Push notification to all targets
  if(!DB.notifications) DB.notifications = [];
  var days = r.transferDate ? Math.ceil((new Date(TODAY)-new Date(r.transferDate))/(1000*60*60*24)) : "?";
  var notif = {
    id: uid("NTF"),
    type: "po",
    title: "⚠ Unpurchased ASIN — " + (r.asin||"No ASIN") + " (" + days + "d overdue)",
    body: "Client: " + (r.client||"—") + " · Status: " + (r.status||"Pending") + " · Reason: " + reason,
    link: "amazon",
    time: nowCA().ts.slice(0,16),
    read: [],
    for: targets.length ? targets : "all"
  };
  DB.notifications.unshift(notif);
  refreshNotifBadge();
  buildNav();

  saveToLocalStorage();
  closeModal();
  showToast("Delay reason saved & team notified ✓","var(--green)");
  pageAmazon();
}

function openAMZById(id){
  const r=DB.amazon.find(x=>x.id===id);
  if(r) openAMZModal(r);
}

function openAMZModal(item=null){
  const isNew=!item;
  item=item||{id:"",status:"Pending",asinType:"Replenishment",client:"",transferDate:"",purchaseDate:TODAY,orderNumber:"",units:"",purchaseType:"Units",fulfillmentType:"FBA",awlVendorPayment:"",supplier:"",manager:"",asin:"",amazonLink:"",supplierLink:"",amazonBundles:"",qbInvoice:"",stripeInvoice:"",deliveryDate:"",trackingNumber:"",clientPaymentToAwl:"",invoiceSent:"No",paymentStatus:"Open",profit:"",dateInvoicePaid:"",supplierInvoiceDate:"",refund:"",dateRefund:"",notes:"",itemCode:"",supplierInvoiceNumber:""};

  openModal(`${mHeader(isNew?"Add Amazon Order":"Edit Amazon Order")}
  <div class="modal-body">

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin-bottom:8px">Order Info</div>
    <div class="form-grid">
      ${mField("Status","status",item.status,"select","Purchased,Cancelled,Pending MOQ,Pending OOS,Pending")}
      ${mField("New ASIN / Replenishment","asinType",item.asinType,"select","New ASIN,Replenishment")}
      <div class="form-full">${clientSelectFiltered("client",item.client,"Amazon",false)}</div>
      ${mField("Date Transferred","transferDate",item.transferDate,"date")}
      ${mField("Purchase Date","purchaseDate",item.purchaseDate,"date")}
      ${mField("Order Number","orderNumber",item.orderNumber,"text","e.g. 111-XXXXXXX-XXXXXXX")}
      ${mField("Units","units",item.units,"number")}
      ${mField("Purchase Type","purchaseType",item.purchaseType,"select","Units,Bundles")}
      ${mField("2DS/FBA/FBM","fulfillmentType",item.fulfillmentType||"FBA","select","FBA,FBM,2DS")}
      ${mField("ASIN","asin",item.asin,"text","e.g. B08N5WRWNW")}
      ${mField("Amazon Link","amazonLink",item.amazonLink||"","text","https://amazon.com/dp/...")}
      ${mField("Supplier Link","supplierLink",item.supplierLink||"","text","https://...")}
      ${mField("Amazon Bundles","amazonBundles",item.amazonBundles,"text","e.g. 2-pack")}
      ${mField("Item Code","itemCode",item.itemCode,"text","e.g. ITM-001")}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Supplier & Delivery</div>
    <div class="form-grid">
      ${mField("Supplier","supplier",item.supplier,"text")}
      ${mField("Manager","manager",item.manager,"text","e.g. Maria Santos")}
      ${mField("Supplier Invoice Date","supplierInvoiceDate",item.supplierInvoiceDate,"date")}
      ${mField("Supplier Invoice Number","supplierInvoiceNumber",item.supplierInvoiceNumber,"text")}
      ${mField("Delivery Date","deliveryDate",item.deliveryDate,"date")}
      ${mField("Tracking Number","trackingNumber",item.trackingNumber,"text")}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Financials & Invoicing</div>
    <div class="form-grid">
      ${mField("AWL Vendor Payment ($)","awlVendorPayment",item.awlVendorPayment,"number")}
      ${mField("Client Payment to AWL ($)","clientPaymentToAwl",item.clientPaymentToAwl,"number")}
      ${mField("Profit ($)","profit",item.profit,"number")}
      ${mField("Invoice Sent","invoiceSent",item.invoiceSent,"select","No,Yes")}
      ${mField("Quickbooks Invoice","qbInvoice",item.qbInvoice,"text","e.g. QB-2026-001")}
      ${mField("Stripe Invoice","stripeInvoice",item.stripeInvoice,"text","e.g. SI-2026-001")}
      ${mField("Payment Status","paymentStatus",item.paymentStatus,"select","Open,Paid,Paid/Pending to pay Supplier")}
      ${mField("Date Invoice Paid","dateInvoicePaid",item.dateInvoicePaid,"date")}
      ${mField("Refund ($)","refund",item.refund,"number")}
      ${mField("Date Refund","dateRefund",item.dateRefund,"date")}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Notes</div>
    <div class="form-grid">
      <div class="form-full">${mField("Notes","notes",item.notes,"textarea")}</div>
    </div>

  </div>
  ${mFooter("saveAMZ('"+item.id+"')",item.id?"confirm2('Delete this order?',()=>delRecord('amazon','"+item.id+"'))":"")}`,true);
}

function saveAMZ(id){
  const rec={
    id:id||uid("AMZ"),
    status:mVal("status"),asinType:mVal("asinType"),client:mVal("client"),
    transferDate:mVal("transferDate"),purchaseDate:mVal("purchaseDate"),
    orderNumber:mVal("orderNumber"),units:Number(mVal("units"))||0,
    purchaseType:mVal("purchaseType"),awlVendorPayment:Number(mVal("awlVendorPayment"))||0,
    supplier:mVal("supplier"),manager:mVal("manager"),asin:mVal("asin"),qbInvoice:mVal("qbInvoice"),
    stripeInvoice:mVal("stripeInvoice"),deliveryDate:mVal("deliveryDate"),
    trackingNumber:mVal("trackingNumber"),clientPaymentToAwl:Number(mVal("clientPaymentToAwl"))||0,
    invoiceSent:mVal("invoiceSent"),paymentStatus:mVal("paymentStatus"),
    profit:Number(mVal("profit"))||0,dateInvoicePaid:mVal("dateInvoicePaid"),
    supplierInvoiceDate:mVal("supplierInvoiceDate"),refund:Number(mVal("refund"))||0,
    dateRefund:mVal("dateRefund"),notes:mVal("notes"),itemCode:mVal("itemCode"),
    amazonBundles:mVal("amazonBundles"),supplierInvoiceNumber:mVal("supplierInvoiceNumber"),
    fulfillmentType:mVal("fulfillmentType")||"FBA",
    amazonLink:mVal("amazonLink"),
    supplierLink:mVal("supplierLink"),
  };
  upsert("amazon",rec); notifyOnSave("amazon",rec,!id); closeModal(); triggerWebhook("amazon.updated",rec);
  if(rec.client) pushClientNotif("po",`Amazon Order: ${rec.orderNumber||rec.asin}`,`Client: ${rec.client} · Status: ${rec.status}`,"amazon",rec.client);
  pageAmazon();
}

// Inline field save for Amazon Purchases table
function saveAMZField(id, field, value){
  const r=DB.amazon.find(x=>x.id===id);
  if(!r) return;
  const numFields=["awlVendorPayment","clientPaymentToAwl","profit","refund","units","unitCost","totalCost","awlCharge10","buyboxPrice","fbaFees","referralFees"];
  r[field] = numFields.includes(field) ? (Number(value)||0) : value;
  saveToLocalStorage();
  showToast("Saved","var(--green)");
  // Re-render on status change so row color updates immediately
  if(field==="status") pageAmazon();
}

// Inline notes edit modal for Amazon Purchases
function openAMZNoteModal(id){
  const r=DB.amazon.find(x=>x.id===id);
  if(!r) return;
  openModal(`${mHeader("Edit Notes — "+( r.asin||r.orderNumber||r.id))}
  <div class="modal-body">
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea name="amz-notes" class="form-input" rows="4">${r.notes||""}</textarea>
    </div>
  </div>
  ${mFooter(`saveAMZNote('${id}')`)}`)
}
function saveAMZNote(id){
  const r=DB.amazon.find(x=>x.id===id);
  if(!r) return;
  r.notes=mVal("amz-notes");
  closeModal();
  showToast("Notes saved","var(--green)");
  pageAmazon();
}

function exportAMZCSV(){
  const cols=["Status","New ASIN/Replen.","Client","Transfer Date","Purchase Date","Order Number","Units","Purchase Type","AWL Vendor Payment","Supplier","Manager","ASIN","QB Invoice","Stripe Invoice","Delivery Date","Tracking Number","Client Payment to AWL","Invoice Sent","Payment Status","Profit","Date Invoice Paid","Supplier Invoice Date","Refund","Date Refund","Notes","Item Code","Amazon Bundles","Supplier Invoice Number","Amazon Link","Supplier Link"];
  const csv=[cols.join(","),...DB.amazon.map(r=>[
    r.status||"",r.asinType||"",r.client||"",r.transferDate||"",r.purchaseDate||"",
    r.orderNumber||"",r.units||0,r.purchaseType||"",r.awlVendorPayment||0,
    r.supplier||"",r.manager||"",r.asin||"",r.qbInvoice||"",r.stripeInvoice||"",
    r.deliveryDate||"",r.trackingNumber||"",r.clientPaymentToAwl||0,
    r.invoiceSent||"",r.paymentStatus||"",r.profit||0,r.dateInvoicePaid||"",
    r.supplierInvoiceDate||"",r.refund||0,r.dateRefund||"",
    `"${(r.notes||"").replace(/"/g,'""')}"`,r.itemCode||"",r.amazonBundles||"",r.supplierInvoiceNumber||"",
    r.amazonLink||"",r.supplierLink||""
  ].join(","))].join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download="AW_Amazon_"+TODAY+".csv"; a.click();
  showToast("Amazon orders exported","var(--green)");
}

// ═══════════════════════════════════════════════
//  PAGE: TICKETING SYSTEM
// ═══════════════════════════════════════════════
function pageTickets(){
  if(!DB.tickets) DB.tickets=[];
  const search   = (window._tkSearch)||"";
  const statusF  = (window._tkStatusF)||"All";
  const priorityF= (window._tkPriorityF)||"All";
  const _tkStatusF   = statusF;
  const _tkPriorityF = priorityF;

  const rows = DB.tickets.filter(t=>{
    const ms = statusF==="All"  || t.status===statusF;
    const mp = priorityF==="All"|| t.priority===priorityF;
    const mq = !search ||
      (t.id||"").toLowerCase().includes(search.toLowerCase())||
      (t.title||"").toLowerCase().includes(search.toLowerCase())||
      (t.submittedBy||"").toLowerCase().includes(search.toLowerCase())||
      (t.assignedTo||"").toLowerCase().includes(search.toLowerCase())||
      (t.description||"").toLowerCase().includes(search.toLowerCase());
    return ms&&mp&&mq;
  }).sort((a,b)=>b.date.localeCompare(a.date));

  const rowBgMap={
    Open:     "background:rgba(247,201,79,.06);border-left:3px solid var(--yellow)",
    Assigned: "background:rgba(79,142,247,.06);border-left:3px solid var(--accent)",
    Resolved: "background:rgba(79,207,142,.06);border-left:3px solid var(--green)",
  };
  const priorityColor={High:"var(--red)",Medium:"var(--yellow)",Low:"var(--green)"};
  const statusColor={Open:"var(--yellow)",Assigned:"var(--accent)",Resolved:"var(--green)"};

  const open=DB.tickets.filter(t=>t.status==="Open").length;
  const assigned=DB.tickets.filter(t=>t.status==="Assigned").length;
  const resolved=DB.tickets.filter(t=>t.status==="Resolved").length;
  const highPri=DB.tickets.filter(t=>t.priority==="High"&&t.status!=="Resolved").length;

  // All users for submitted by dropdown + warehouse team for assigned to
  const allUsers=[...new Set([
    ...DB.employees.filter(e=>e.status==="Active"&&e.username).map(e=>e.name),
    ...USERS.map(u=>u.name)
  ])].sort();
  const warehouseTeam=[...new Set([
    ...DB.employees.filter(e=>e.role==="Warehouse"&&e.status==="Active").map(e=>e.name),
    ...USERS.filter(u=>u.role==="Warehouse").map(u=>u.name),
    ...DB.employees.filter(e=>e.role==="Admin"||e.role==="Manager").map(e=>e.name),
  ])].sort();

  render(`
  <div>
    <div class="page-header">
      <div>
        <div class="page-title" style="display:flex;align-items:center;gap:10px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;background:rgba(247,92,92,.15);border-radius:8px;font-size:18px">🎫</span>
          Ticketing System
        </div>
        <div class="page-sub">${DB.tickets.length} total tickets</div>
      </div>
      ${canSubmit("tickets")?'<button class="btn btn-primary" onclick="openTicketModal()">+ New Ticket</button>':""}
    </div>

    <div class="metrics metrics-4" style="margin-bottom:1.25rem">
      ${metric("Open",     open,     "Awaiting action",  "var(--yellow)")}
      ${metric("Assigned", assigned, "Being handled",    "var(--accent)")}
      ${metric("Resolved", resolved, "Completed",        "var(--green)")}
      ${metric("High Priority", highPri, "Unresolved",   "var(--red)")}
    </div>

    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input class="search-bar" placeholder="Search ticket ID, title, submitted by…"
          value="${search}" oninput="window._tkSearch=this.value;pageTickets()"
          style="flex:1;min-width:200px;max-width:300px">
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${["All","Open","Assigned","Resolved"].map(s=>
            `<button class="filter-pill${_tkStatusF===s?" active":""}" onclick="window._tkStatusF='${s}';pageTickets()">${s}</button>`
          ).join("")}
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${["All","High","Medium","Low"].map(p=>
            `<button class="filter-pill${_tkPriorityF===p?" active":""}"
              style="${p!=="All"?"border-color:"+priorityColor[p]+"40":""}"
              onclick="window._tkPriorityF='${p}';pageTickets()">${p==="All"?"All Priority":p}</button>`
          ).join("")}
        </div>
      </div>
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th>Ticket ID</th>
            <th>Date</th>
            <th>Title</th>
            <th>Platform</th>
            <th>Priority</th>
            <th>Submitted By</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Last Updated</th>
            <th>Date Resolved</th>
            <th>Description</th>
            <th>Notes</th>
            <th></th>
          </tr></thead>
          <tbody>
          ${rows.length===0?`<tr><td colspan="13" style="text-align:center;padding:3rem;color:var(--muted)">No tickets found</td></tr>`:""}
          ${rows.map(t=>{
            const rowBg = rowBgMap[t.status]||"";
            const pc    = priorityColor[t.priority]||"var(--muted)";
            const sc    = statusColor[t.status]||"var(--muted)";
            return `<tr style="${rowBg}">
              <td class="mono" style="font-size:11px;color:var(--accent);font-weight:700;white-space:nowrap">${t.id}</td>
              <td style="font-size:12px;color:var(--muted);white-space:nowrap">${t.date}</td>
              <td style="font-weight:600;min-width:160px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.title}">${t.title}</td>
              <td><span class="tag">${t.platform||"—"}</span></td>
              <td><span class="badge" style="background:${pc}18;color:${pc};font-weight:700">${t.priority}</span></td>
              <td style="font-size:12px">${t.submittedBy||"—"}</td>
              <td>
                ${canEdit("tickets") ? `<select onchange="saveTicketStatus('${t.id}',this.value)"` : `<select disabled`}
                  style="background:${sc}18;border:1px solid ${sc}40;border-radius:20px;
                         padding:3px 10px;color:${sc};font-size:11px;font-weight:700;
                         font-family:var(--font);outline:none;cursor:pointer">
                  ${["Open","Assigned","Resolved"].map(s=>
                    `<option value="${s}"${t.status===s?" selected":""}>${s}</option>`
                  ).join("")}
                </select>
              </td>
              <td>
                ${canEdit("tickets") ? `<select onchange="saveTicketField('${t.id}','assignedTo',this.value)"` : `<select disabled`}
                  style="background:transparent;border:1px solid var(--border);border-radius:var(--r);
                         padding:3px 6px;color:var(--text);font-size:11px;font-family:var(--font);
                         outline:none;cursor:pointer;min-width:120px">
                  <option value="">— Unassigned —</option>
                  ${warehouseTeam.map(n=>`<option value="${n}"${t.assignedTo===n?" selected":""}>${n}</option>`).join("")}
                </select>
              </td>
              <td style="font-size:11px;color:var(--muted);white-space:nowrap">${t.lastUpdatedAt||"—"}</td>
              <td style="font-size:11px;color:var(--green);white-space:nowrap">${t.dateResolved||"—"}</td>
              <td style="font-size:12px;color:var(--muted);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.description||""}">${t.description||"—"}</td>
              <td style="max-width:180px">
                <div style="display:flex;align-items:center;gap:4px">
                  <input type="text" value="${(t.notes||"").replace(/"/g,'&quot;')}"
                    ${canEdit("tickets") ? `onblur="saveTicketField('${t.id}','notes',this.value)"` : `disabled`}
                    onkeydown="if(event.key==='Enter')this.blur()"
                    placeholder="Add notes…"
                    style="background:transparent;border:1px solid var(--border);border-radius:var(--r);
                           padding:3px 7px;color:var(--muted);font-size:11px;font-family:var(--font);
                           width:100%;outline:none;min-width:120px">
                </div>
              </td>
              <td>${canEdit("tickets")?`<button class="btn btn-info btn-sm" onclick='openTicketEditModal(${JSON.stringify(t).replace(/'/g,"&#39;")})'>Edit</button>`:""}</td>
            </tr>`;
          }).join("")}
          </tbody>
        </table>
      </div>
      <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${rows.length} of ${DB.tickets.length} tickets</div>
    </div>
  </div>`);
}

function saveTicketStatus(id, newStatus){
  const t=DB.tickets.find(x=>x.id===id); if(!t) return;
  const ts=nowCA().ts.slice(0,16);
  t.status=newStatus;
  if(newStatus==="Assigned"  && !t.lastUpdatedAt) t.lastUpdatedAt=ts;
  if(newStatus==="Assigned")  t.lastUpdatedAt=ts;
  if(newStatus==="Resolved")  { t.dateResolved=ts; t.lastUpdatedAt=ts; notifyTicketResolved(t); }
  if(newStatus==="Open")      { t.dateResolved=""; }
  saveToLocalStorage();
  showToast("Status updated","var(--green)");
  pageTickets();
}

function notifyTicketResolved(t){
  if(!t.submittedBy) return;
  // Find username from submittedBy name
  const emp  = DB.employees.find(e=>e.name===t.submittedBy);
  const user = USERS.find(u=>u.name===t.submittedBy);
  const username = emp?.username || user?.username;
  if(!username) return;
  if(!DB.notifications) DB.notifications=[];
  DB.notifications.unshift({
    id:uid("NTF"), type:"ticket",
    title:`✅ Ticket Resolved — ${t.id}`,
    body:`"${t.title}" has been resolved.${t.assignedTo?" Resolved by: "+t.assignedTo:""}`,
    link:"tickets",
    time:nowCA().ts.slice(0,16),
    read:[], for:[username]
  });
  // Also notify admins and managers
  DB.employees.concat(USERS).forEach(u=>{
    if((u.role==="Admin"||u.role==="Manager")&&u.username&&u.username!==username){
      DB.notifications[0].for = [...new Set([...DB.notifications[0].for, u.username])];
    }
  });
  saveToLocalStorage();
  refreshNotifBadge(); buildNav();
  if(currentUser?.username===username||currentUser?.role==="Admin"||currentUser?.role==="Manager"){
    showToast(`✅ ${t.submittedBy} notified — ticket resolved`,"var(--green)");
    maybePlayNotifSound("ticket");
  }
}

function saveTicketField(id, field, value){
  const t=DB.tickets.find(x=>x.id===id); if(!t) return;
  t[field]=value;
  if(field==="assignedTo"&&value&&t.status==="Open"){
    t.status="Assigned";
    t.lastUpdatedAt=nowCA().ts.slice(0,16);
  }
  saveToLocalStorage();
  showToast("Saved","var(--green)");
  pageTickets();
}

function openTicketModal(){
  // All active users for submitted by
  const allUsers=[...new Set([
    ...DB.employees.filter(e=>e.status==="Active"&&e.name).map(e=>e.name),
    ...USERS.map(u=>u.name)
  ])].sort();

  openModal(`${mHeader("New Ticket")}
  <div class="modal-body"><div class="form-grid">
    ${mField("Date","tk_date",nowCA().date,"date","",true)}
    <div class="form-full">${mField("Title","tk_title","","text","Brief description of the issue",true)}</div>
    ${mField("Platform","tk_platform","Amazon","select","Amazon,Walmart,Ebay",true)}
    ${mField("Priority","tk_priority","Medium","select","High,Medium,Low",true)}
    ${mField("Submitted By","tk_submittedBy",currentUser?.name||"","select",allUsers.join(","),true)}
    <div class="form-full">${mField("Description","tk_description","","textarea","Detailed description of the issue",true)}</div>
  </div></div>
  ${mFooter("saveTicket(null)")}`);
}

function openTicketEditModal(t){
  const warehouseTeam=[...new Set([
    ...DB.employees.filter(e=>e.role==="Warehouse"&&e.status==="Active").map(e=>e.name),
    ...USERS.filter(u=>u.role==="Warehouse").map(u=>u.name),
    ...DB.employees.filter(e=>e.role==="Admin"||e.role==="Manager").map(e=>e.name),
  ])].sort();

  openModal(`${mHeader("Edit Ticket — "+t.id)}
  <div class="modal-body"><div class="form-grid">
    <div class="form-full">${mField("Status","tk_status",t.status,"select","Open,Assigned,Resolved")}</div>
    ${mField("Assigned To","tk_assignedTo",t.assignedTo||"","select",","+warehouseTeam.join(","))}
    <div class="form-full">${mField("Notes","tk_notes",t.notes||"","textarea")}</div>
  </div></div>
  ${mFooter("saveTicket('${t.id}')",
    "confirm2('Delete this ticket?',()=>delRecord('tickets','"+t.id+"'))"
  )}`
  .replace("'${t.id}'","'"+t.id+"'"));
}

function saveTicket(id){
  if(!DB.tickets) DB.tickets=[];
  const ts=nowCA().ts.slice(0,16);

  if(!id){
    // New ticket — validate required fields
    if(!mVal("tk_date"))        return showToast("Date is required","var(--red)");
    if(!mVal("tk_title"))       return showToast("Title is required","var(--red)");
    if(!mVal("tk_platform"))    return showToast("Platform is required","var(--red)");
    if(!mVal("tk_priority"))    return showToast("Priority is required","var(--red)");
    if(!mVal("tk_submittedBy")) return showToast("Submitted By is required","var(--red)");
    if(!mVal("tk_description")) return showToast("Description is required","var(--red)");

    // Auto-generate Ticket ID
    const existing=DB.tickets.filter(t=>t.id.startsWith("AW-WH-")).length;
    const nextNum=String(existing+1).padStart(3,"0");
    const newId=`AW-WH-${nextNum}`;

    const rec={
      id:           newId,
      date:         mVal("tk_date"),
      title:        mVal("tk_title"),
      platform:     mVal("tk_platform"),
      description:  mVal("tk_description"),
      priority:     mVal("tk_priority"),
      submittedBy:  mVal("tk_submittedBy"),
      status:       "Open",
      assignedTo:   "",
      lastUpdatedAt:"",
      dateResolved: "",
      notes:        "",
    };
    DB.tickets.unshift(rec);
    saveToLocalStorage();
    closeModal();
    showToast(`Ticket ${newId} created!`,"var(--green)");
    pageTickets();
  } else {
    // Edit ticket
    const t=DB.tickets.find(x=>x.id===id); if(!t) return;
    const newStatus=mVal("tk_status");
    t.assignedTo=mVal("tk_assignedTo");
    t.notes=mVal("tk_notes");
    if(newStatus!==t.status){
      t.status=newStatus;
      t.lastUpdatedAt=ts;
      if(newStatus==="Resolved") { t.dateResolved=ts; notifyTicketResolved(t); }
      if(newStatus==="Open") t.dateResolved="";
    }
    if(t.assignedTo&&t.status==="Open"){ t.status="Assigned"; t.lastUpdatedAt=ts; }
    saveToLocalStorage();
    closeModal();
    showToast("Ticket updated","var(--green)");
    pageTickets();
  }
}

// ═══════════════════════════════════════════════
//  PAGE: WALMART PURCHASES
// ═══════════════════════════════════════════════

