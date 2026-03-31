// ── 15-research.js ──

function isPRTeam(){
  return currentUser?.role==="Product Research";
}
function canApproveResearch(){
  // Approvers: Admin, Manager, Purchaser, or their name is in APPROVER_NAMES
  return currentUser?.role==="Admin" ||
         currentUser?.role==="Manager" ||
         currentUser?.role==="Purchaser" ||
         APPROVER_NAMES.includes(currentUser?.name);
}

function pageResearch(){
  const resTab = window._resTab||"research";
  if(resTab==="asinchecker") return pageAsinChecker();

  const search  = (window._resSearch)||"";
  const statusF = (window._resStatusF)||"All";
  const _resStatusF = window._resStatusF||"All";
  const isApprover = canApproveResearch();
  const isPR    = isPRTeam();

  const rows = DB.research.filter(r=>{
    const ms = statusF==="All"||r.status===statusF;
    const mq = !search||
      (r.asin||"").toLowerCase().includes(search.toLowerCase())||
      (r.productDesc||"").toLowerCase().includes(search.toLowerCase())||
      (r.prMember||"").toLowerCase().includes(search.toLowerCase())||
      (r.client||"").toLowerCase().includes(search.toLowerCase());
    return ms&&mq;
  });

  render(`
  <div>
    <div class="page-header">
      <div>
        <div class="page-title" style="display:flex;align-items:center;gap:10px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;background:rgba(79,142,247,.15);border-radius:8px;font-size:18px">🔬</span>
          Product Research
        </div>
        <div class="page-sub">PR Team submits ASINs · Approvers: Kin, Daniel, Merylle, Wilson</div>
      </div>
      <div style="display:flex;gap:8px">
        ${isApprover ? `<button class="btn btn-ghost btn-sm" onclick="exportResCSV()">↓ Export</button>` : ""}
        <button class="btn btn-primary" onclick="openResSubmitModal()">+ Submit ASIN</button>
      </div>
    </div>

    <!-- Tab bar -->
    <div style="display:flex;gap:0;margin-bottom:1.25rem;border-bottom:2px solid var(--border)">
      <button onclick="window._resTab='research';pageResearch()"
        style="padding:9px 20px;background:none;border:none;border-bottom:3px solid ${'research'===resTab?'var(--accent)':'transparent'};
               color:${'research'===resTab?'var(--accent)':'var(--muted)'};font-size:13px;font-weight:${'research'===resTab?'700':'500'};
               cursor:pointer;font-family:var(--font);transition:all .15s;margin-bottom:-2px;white-space:nowrap">
        🔬 Research List
      </button>
      <button onclick="window._resTab='asinchecker';pageResearch()"
        style="padding:9px 20px;background:none;border:none;border-bottom:3px solid ${'asinchecker'===resTab?'var(--accent)':'transparent'};
               color:${'asinchecker'===resTab?'var(--accent)':'var(--muted)'};font-size:13px;font-weight:${'asinchecker'===resTab?'700':'500'};
               cursor:pointer;font-family:var(--font);transition:all .15s;margin-bottom:-2px;white-space:nowrap">
        🔍 ASIN Checker
      </button>
    </div>

    ${isPR ? `
    <div style="background:rgba(79,142,247,.07);border:1px solid rgba(79,142,247,.2);border-radius:var(--r);padding:10px 14px;margin-bottom:14px;font-size:12px;color:var(--muted);display:flex;align-items:center;gap:8px">
      <span style="font-size:16px">👁️</span>
      <span>You have <strong style="color:var(--text)">view-only</strong> access. Use <strong style="color:var(--accent)">+ Submit ASIN</strong> to submit a new ASIN for approval.</span>
    </div>` : ""}

    <div class="metrics metrics-4" style="margin-bottom:1.25rem">
      ${metric("Total",DB.research.length,"","var(--accent)")}
      ${metric("Approved",DB.research.filter(r=>r.status==="Approved").length,"","var(--green)")}
      ${metric("New Asin",DB.research.filter(r=>r.status==="New Asin").length,"","#a78bfa")}
      ${metric("Denied",DB.research.filter(r=>r.status==="Denied").length,"","var(--red)")}
    </div>

    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input class="search-bar" placeholder="Search ASIN, product, PR member, client…"
          value="${search}" oninput="window._resSearch=this.value;pageResearch()" style="flex:1;min-width:200px;max-width:320px">
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          ${["All","New Asin","Pending","Approved","Denied"].map(s=>
            `<button class="filter-pill${statusF===s?" active":""}" onclick="window._resStatusF='${s}';pageResearch()">${s}</button>`
          ).join("")}
        </div>
      </div>
    </div>

    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r2);overflow:hidden">
      <div style="overflow-x:auto">
        <table style="width:max-content;min-width:100%;border-collapse:separate;border-spacing:0">
          <thead><tr style="background:#0d1b3e;position:sticky;top:0;z-index:4">
            <!-- Frozen approval columns — Actions first -->
            ${isApprover?`<th style="min-width:120px;width:120px;position:sticky;left:0;z-index:5;background:#0d1b3e;box-shadow:1px 0 0 rgba(247,201,79,.15)">Actions</th>`:""}
            <th style="min-width:130px;width:130px;position:sticky;left:${isApprover?120:0}px;z-index:5;background:#0d1b3e;box-shadow:1px 0 0 rgba(247,201,79,.15)">Status</th>
            <th style="min-width:130px;width:130px;position:sticky;left:${isApprover?250:130}px;z-index:5;background:#0d1b3e;box-shadow:1px 0 0 rgba(247,201,79,.15)">Approved By</th>
            <th style="min-width:190px;width:190px;position:sticky;left:${isApprover?380:260}px;z-index:5;background:#0d1b3e;box-shadow:1px 0 0 rgba(247,201,79,.15)">ASIN Status</th>
            <th style="min-width:120px;width:120px;position:sticky;left:${isApprover?570:450}px;z-index:5;background:#0d1b3e;box-shadow:1px 0 0 rgba(247,201,79,.15)">Date Reviewed</th>
            <th style="min-width:110px;width:110px;position:sticky;left:${isApprover?690:570}px;z-index:5;background:#0d1b3e;box-shadow:1px 0 0 rgba(247,201,79,.15)">QTY to Purchase</th>
            <th style="min-width:130px;width:130px;position:sticky;left:${isApprover?800:680}px;z-index:5;background:#0d1b3e;box-shadow:1px 0 0 rgba(247,201,79,.15)">Purchase Type</th>
            <th style="min-width:150px;width:150px;position:sticky;left:${isApprover?930:810}px;z-index:5;background:#0d1b3e;box-shadow:1px 0 0 rgba(247,201,79,.15)">Total Purchase Value</th>
            <th style="min-width:150px;width:150px;position:sticky;left:${isApprover?1080:960}px;z-index:5;background:#0d1b3e;box-shadow:1px 0 0 rgba(247,201,79,.15)">Client</th>
            <th style="min-width:200px;width:200px;position:sticky;left:${isApprover?1230:1110}px;z-index:5;background:#0d1b3e;box-shadow:1px 0 0 rgba(247,201,79,.15)">Notes (Approver)</th>
            <th style="min-width:130px;width:130px;position:sticky;left:${isApprover?1430:1310}px;z-index:5;background:#0d1b3e;box-shadow:2px 0 6px rgba(0,0,0,.4)">Gated/Ungated</th>
            <!-- PR submission columns -->
            <th style="min-width:110px">Date</th>
            <th style="min-width:120px">Manager</th>
            <th style="min-width:130px">PR Member</th>
            <th style="min-width:110px">FBA/FBM</th>
            <th style="min-width:120px">ASIN</th>
            <th style="min-width:220px">Product Description</th>
            <th style="min-width:130px">Amazon Link</th>
            <th style="min-width:130px">Supplier Link</th>
            <th style="min-width:100px">Unit Cost</th>
            <th style="min-width:160px">AMZ Pack/Bundle/QTY</th>
            <th style="min-width:110px">Total Cost</th>
            <th style="min-width:120px">AWL Charge 10%</th>
            <th style="min-width:110px">Buybox Price</th>
            <th style="min-width:100px">FBA Fees</th>
            <th style="min-width:110px">Referral Fees</th>
            <th style="min-width:100px">Storage Fee</th>
            <th style="min-width:140px">Inbound/Ship Fee</th>
            <th style="min-width:100px">Units Sold</th>
            <th style="min-width:120px">Total COGs</th>
            <th style="min-width:100px">Profit</th>
            <th style="min-width:160px">% (10% AWL)</th>
            <th style="min-width:200px">PR Team Notes</th>
          </tr></thead>
          <tbody>
          ${rows.length===0?`<tr><td colspan="${isApprover?33:32}" style="text-align:center;color:var(--muted);padding:2.5rem">No submissions yet</td></tr>`:""}
          ${rows.map(r=>{
            const stBg={"New Asin":"rgba(167,139,250,.15)",Approved:"rgba(79,207,142,.12)",Pending:"rgba(247,201,79,.12)",Denied:"rgba(247,92,92,.12)"};
            const stColor={"New Asin":"#a78bfa",Approved:"var(--green)",Pending:"var(--yellow)",Denied:"var(--red)"};
            const rowBg={
              "New Asin":"background:rgba(167,139,250,.07);border-left:3px solid #a78bfa",
              "Approved": "background:rgba(79,207,142,.07);border-left:3px solid var(--green)",
              "Pending":  "background:rgba(247,201,79,.07);border-left:3px solid var(--yellow)",
              "Denied":   "background:rgba(247,92,92,.07);border-left:3px solid var(--red)",
            }[r.status]||"";
            const totalPurchaseVal = (Number(r.qtyToPurchase)||0)*(Number(r.unitCost)||0);
            const asinStBg={"Not Profitable":"rgba(247,92,92,.12)","Restricted":"rgba(251,146,60,.12)","Kin Reviewing":"rgba(247,201,79,.12)","Gated":"rgba(107,118,148,.12)","Ready for PO":"rgba(79,207,142,.12)","Transferred to PO":"rgba(79,142,247,.12)","Purchased":"rgba(79,207,142,.2)","Brand/Amazon on Listing":"rgba(167,139,250,.12)"};
            const asinStColor={"Not Profitable":"var(--red)","Restricted":"var(--orange)","Kin Reviewing":"var(--yellow)","Gated":"var(--muted)","Ready for PO":"var(--green)","Transferred to PO":"var(--accent)","Purchased":"var(--green)","Brand/Amazon on Listing":"#a78bfa"};
            return `<tr style="${rowBg}">
              <!-- Approval cells (frozen) -->
              ${isApprover?`<td style="background:rgba(10,15,26,.98);position:sticky;left:0;z-index:3;box-shadow:1px 0 0 rgba(247,201,79,.15);">
                <div style="display:flex;gap:4px;flex-wrap:wrap">
                  ${r.status!=="Approved"?`<button class="btn btn-success btn-sm" onclick="approveResearch('${r.id}')">✓</button>`:""}
                  ${r.status!=="Denied"?`<button class="btn btn-danger btn-sm" onclick="denyResearch('${r.id}')">✕</button>`:""}
                  ${canEdit("research")?`<button class="btn btn-info btn-sm" onclick="openResEditModal('${r.id}')">Edit</button>`:""}
                </div>
              </td>`:""}
              <td style="background:rgba(10,15,26,.98);position:sticky;left:${isApprover?120:0}px;z-index:3;box-shadow:1px 0 0 rgba(247,201,79,.1);"><span class="badge" style="background:${stBg[r.status]||"rgba(107,118,148,.12)"};color:${stColor[r.status]||"var(--muted)"};white-space:nowrap">${r.status||"—"}</span></td>
              <td style="background:rgba(10,15,26,.98);position:sticky;left:${isApprover?250:130}px;z-index:3;box-shadow:1px 0 0 rgba(247,201,79,.1);">
                ${isApprover
                  ? `<select onchange="saveResField('${r.id}','approvedBy',this.value)" style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:var(--text);font-size:11px;font-family:var(--font);outline:none;cursor:pointer">
                      <option value="">— None —</option>
                      ${APPROVER_NAMES.map(n=>`<option value="${n}"${r.approvedBy===n?" selected":""}>${n}</option>`).join("")}
                    </select>`
                  : `<span style="font-size:12px;font-weight:600;color:var(--yellow)">${r.approvedBy||"—"}</span>`}
              </td>
              <td style="background:rgba(10,15,26,.98);position:sticky;left:${isApprover?380:260}px;z-index:3;box-shadow:1px 0 0 rgba(247,201,79,.1);">
                ${isApprover
                  ? `<select onchange="saveResField('${r.id}','asinStatus',this.value)" style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:${asinStColor[r.asinStatus]||"var(--text)"};font-size:11px;font-family:var(--font);outline:none;cursor:pointer;max-width:180px">
                      <option value="">— Not set —</option>
                      ${ASIN_STATUSES.map(s=>`<option value="${s}"${r.asinStatus===s?" selected":""}>${s}</option>`).join("")}
                    </select>`
                  : `${r.asinStatus?`<span class="badge" style="background:${asinStBg[r.asinStatus]||"rgba(107,118,148,.12)"};color:${asinStColor[r.asinStatus]||"var(--muted)"};font-size:10px;white-space:nowrap">${r.asinStatus}</span>`:"—"}`}
              </td>
              <td style="background:rgba(10,15,26,.98);position:sticky;left:${isApprover?570:450}px;z-index:3;box-shadow:1px 0 0 rgba(247,201,79,.1);">
                ${isApprover
                  ? `<input type="date" value="${r.dateReviewed||""}" onchange="saveResField('${r.id}','dateReviewed',this.value)"
                      style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:var(--text);font-size:11px;font-family:var(--font);outline:none;cursor:pointer;width:130px">`
                  : `<span style="font-size:12px;color:var(--muted)">${r.dateReviewed||"—"}</span>`}
              </td>
              <td style="background:rgba(10,15,26,.98);position:sticky;left:${isApprover?690:570}px;z-index:3;box-shadow:1px 0 0 rgba(247,201,79,.1);">
                ${isApprover
                  ? `<input type="number" value="${r.qtyToPurchase||""}" min="0" onchange="saveResField('${r.id}','qtyToPurchase',this.value);pageResearch()"
                      style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:var(--text);font-size:11px;font-family:var(--font);outline:none;cursor:pointer;width:80px;font-weight:700">`
                  : `<span style="font-weight:700">${r.qtyToPurchase||"—"}</span>`}
              </td>
              <td style="background:rgba(10,15,26,.98);position:sticky;left:${isApprover?800:680}px;z-index:3;box-shadow:1px 0 0 rgba(247,201,79,.1);">
                ${isApprover
                  ? `<select onchange="saveResField('${r.id}','purchaseType',this.value)" style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:var(--text);font-size:11px;font-family:var(--font);outline:none;cursor:pointer">
                      <option value="">— Not set —</option>
                      <option value="Units"${r.purchaseType==="Units"?" selected":""}>Units</option>
                      <option value="Bundles"${r.purchaseType==="Bundles"?" selected":""}>Bundles</option>
                    </select>`
                  : `<span class="tag">${r.purchaseType||"—"}</span>`}
              </td>
              <td style="background:rgba(10,15,26,.98);position:sticky;left:${isApprover?930:810}px;z-index:3;box-shadow:1px 0 0 rgba(247,201,79,.1);color:var(--teal);font-weight:600;">${totalPurchaseVal>0?"$"+totalPurchaseVal.toFixed(2):"—"}</td>
              <td style="background:rgba(10,15,26,.98);position:sticky;left:${isApprover?1080:960}px;z-index:3;box-shadow:1px 0 0 rgba(247,201,79,.1);">
                ${isApprover
                  ? `<select onchange="saveResField('${r.id}','client',this.value)" style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:var(--accent);font-size:11px;font-family:var(--font);outline:none;cursor:pointer;max-width:150px">
                      <option value="">— None —</option>
                      ${DB.clients.map(c=>`<option value="${c.name}"${r.client===c.name?" selected":""}>${c.name}</option>`).join("")}
                    </select>`
                  : `<span style="font-size:12px;color:var(--accent)">${r.client||"—"}</span>`}
              </td>
              <td style="background:rgba(10,15,26,.98);position:sticky;left:${isApprover?1230:1110}px;z-index:3;box-shadow:1px 0 0 rgba(247,201,79,.1);max-width:200px;">
                ${isApprover
                  ? `<div style="display:flex;align-items:center;gap:5px">
                      <span style="font-size:11px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px" title="${r.approverNotes||""}">${r.approverNotes||"—"}</span>
                      <button onclick="openResInlineNote('${r.id}')" style="flex-shrink:0;background:rgba(79,142,247,.12);border:1px solid rgba(79,142,247,.25);border-radius:5px;padding:2px 7px;color:var(--accent);font-size:10px;cursor:pointer;font-family:var(--font);font-weight:600">✏</button>
                    </div>`
                  : `<span style="font-size:11px;color:var(--muted)">${r.approverNotes||"—"}</span>`}
              </td>
              <td style="background:rgba(10,15,26,.98);position:sticky;left:${isApprover?1430:1310}px;z-index:3;box-shadow:1px 0 0 rgba(247,201,79,.1);box-shadow:2px 0 8px rgba(0,0,0,.4)!important;">
                ${isApprover
                  ? `<select onchange="saveResField('${r.id}','gatedUngated',this.value)" style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:var(--text);font-size:11px;font-family:var(--font);outline:none;cursor:pointer">
                      <option value="">— Not set —</option>
                      <option value="Ungated"${r.gatedUngated==="Ungated"?" selected":""}>Ungated</option>
                      <option value="Gated"${r.gatedUngated==="Gated"?" selected":""}>Gated</option>
                    </select>`
                  : `${r.gatedUngated?`<span style="font-size:11px;padding:2px 8px;border-radius:20px;font-weight:600;background:${r.gatedUngated==="Ungated"?"rgba(79,207,142,.12)":"rgba(247,201,79,.12)"};color:${r.gatedUngated==="Ungated"?"var(--green)":"var(--yellow)"}">${r.gatedUngated}</span>`:"—"}`}
              </td>
              <!-- PR submission cells -->
              <td style="font-size:12px;color:var(--muted)">${r.date||"—"}</td>
              <td style="font-size:12px;font-weight:500">${r.manager||"—"}</td>
              <td style="font-size:12px;color:#a78bfa;font-weight:500">${r.prMember||"—"}</td>
              <td><span class="tag">${r.fulfillmentType||"—"}</span></td>
              <td class="mono" style="font-size:11px;color:var(--accent)">
                ${r.asin||"—"}
                ${r.duplicateReason?`<span style="display:inline-block;margin-left:4px;background:rgba(247,201,79,.2);color:var(--yellow);font-size:9px;font-weight:700;border-radius:4px;padding:1px 5px;font-family:var(--font)" title="Duplicate: ${r.duplicateReason}">DUP</span>`:""}
              </td>
              <td style="font-size:12px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.productDesc||""}">${r.productDesc||"—"}</td>
              <td style="font-size:12px">${r.amazonLink?`<a href="${r.amazonLink}" target="_blank" style="color:var(--accent);text-decoration:underline">View</a>`:"—"}</td>
              <td style="font-size:12px">${r.supplierLink?`<a href="${r.supplierLink}" target="_blank" style="color:var(--accent);text-decoration:underline">View</a>`:"—"}</td>
              <td style="color:var(--muted)">${r.unitCost!=null?"$"+Number(r.unitCost).toFixed(2):"—"}</td>
              <td style="font-size:12px;color:var(--muted)">${r.amzPackBundleQty||"—"}</td>
              <td style="color:var(--green)">${r.totalCost!=null?"$"+Number(r.totalCost).toFixed(2):"—"}</td>
              <td style="color:var(--orange)">${r.awlCharge10!=null?"$"+Number(r.awlCharge10).toFixed(2):"—"}</td>
              <td style="font-weight:600">${r.buyboxPrice!=null?"$"+Number(r.buyboxPrice).toFixed(2):"—"}</td>
              <td style="color:var(--muted)">${r.fbaFees!=null?"$"+Number(r.fbaFees).toFixed(2):"—"}</td>
              <td style="color:var(--muted)">${r.referralFees!=null?"$"+Number(r.referralFees).toFixed(2):"—"}</td>
              <td style="color:var(--muted)">${r.storageFee!=null?"$"+Number(r.storageFee).toFixed(2):"—"}</td>
              <td style="color:var(--muted)">${r.inboundFee!=null?"$"+Number(r.inboundFee).toFixed(2):"—"}</td>
              <td style="font-weight:500">${r.unitsSold!=null?num(r.unitsSold):"—"}</td>
              <td style="color:var(--red);font-weight:600">${r.totalCogs!=null?"$"+Number(r.totalCogs).toFixed(2):"—"}</td>
              <td style="color:${Number(r.profit)>=0?"var(--green)":"var(--red)"};font-weight:700">${r.profit!=null?"$"+Number(r.profit).toFixed(2):"—"}</td>
              <td style="color:var(--green)">${r.percentage||"—"}</td>
              <td style="font-size:12px;color:var(--muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.prNotes||""}">${r.prNotes||"—"}</td>
            </tr>`;
          }).join("")}
          </tbody>
        </table>
      </div>
      <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${rows.length} of ${DB.research.length} submissions · Yellow columns = approver fields · scroll horizontally</div>
    </div>
  </div>`);
}

// Inline save single field for approvers
function saveResField(id, field, value){
  const r=DB.research.find(x=>x.id===id);
  if(!r) return;
  r[field] = field==="qtyToPurchase" ? (Number(value)||0) : value;
  // Recalculate Total Purchase Value whenever qty or unitCost changes
  if(field==="qtyToPurchase"||field==="unitCost"){
    r._tpv = (Number(r.qtyToPurchase)||0) * (Number(r.unitCost)||0);
  }
  // Auto-set dateReviewed if approvedBy or asinStatus changed
  if(field==="approvedBy"||field==="asinStatus") r.dateReviewed=r.dateReviewed||nowCA().date;
  if(field==="approvedBy"||field==="asinStatus") r.dateReviewed=r.dateReviewed||nowCA().date;

  // ── Auto-transfer to Amazon Purchases when ASIN Status = Ready for PO ──
  if(field==="asinStatus" && value==="Ready for PO"){
    transferResToAmazon(r);
  }

  showToast(`Updated`, "var(--green)");
}

function transferResToAmazon(r){
  // Field mapping: Research → Amazon Purchases
  const amzRec = {
    id:             uid("AMZ"),
    status:         "Pending",
    asinType:       "New ASIN",
    // ApprovedQTY → Units
    units:          Number(r.qtyToPurchase)||0,
    // Purchase Type
    purchaseType:   r.purchaseType||"Units",
    // Client
    client:         r.client||"",
    // AWL Vendor Payment — left blank for purchaser to fill in
    awlVendorPayment: 0,
    // Date
    purchaseDate:   r.dateReviewed||TODAY,
    transferDate:   nowCA().date,
    // Manager → stored in notes for reference
    orderNumber:    "",
    // ASIN
    asin:           r.asin||"",
    // 2DS/FBA/FBM
    fulfillmentType: r.fulfillmentType||"FBA",
    // Product Description → stored as notes
    notes:          r.productDesc||"",
    // Amazon Link
    amazonLink:     r.amazonLink||"",
    // Supplier Link
    supplierLink:   r.supplierLink||"",
    // AWL/Clients Account
    awlClientAccount: r.awlClientAccount||"AWL",
    // Unit Cost
    unitCost:       Number(r.unitCost)||0,
    // AMZ Pack/Bundle/QTY
    amzPackBundleQty: "",
    // Total Cost
    totalCost:      Number(r.totalCost)||0,
    awlCharge10:    Number(r.awlCharge10)||0,
    buyboxPrice:    Number(r.buyboxPrice)||0,
    fbaFees:        Number(r.fbaFees)||0,
    referralFees:   Number(r.referralFees)||0,
    supplier:       "",
    qbInvoice:      "",
    stripeInvoice:  "",
    deliveryDate:   "",
    trackingNumber: "",
    clientPaymentToAwl: 0,
    invoiceSent:    "No",
    paymentStatus:  "Open",
    profit:         0,
    dateInvoicePaid:"",
    supplierInvoiceDate:"",
    refund:         0,
    dateRefund:     "",
    itemCode:       "",
    amazonBundles:  "",
    supplierInvoiceNumber:"",
    // Track source
    fromResearchId: r.id,
    manager:        r.manager||"",
  };

  upsert("amazon", amzRec);

  // Change ASIN Status to Transferred to PO
  r.asinStatus = "Transferred to PO";

  // Single broadcast notification to all Admins, Managers, Purchasers and Approvers
  const notifTargets = [...new Set(
    USERS
      .filter(u=>u.role==="Admin"||u.role==="Manager"||u.role==="Purchaser"||APPROVER_NAMES.includes(u.name))
      .map(u=>u.username)
  )];
  DB.notifications.unshift({
    id:uid("NTF"), type:"po",
    title:`📦 New PO Transferred — Action Required`,
    body:`${r.productDesc||r.asin} (${r.asin}) — Client: ${r.client||"—"} · ${r.qtyToPurchase||0} ${r.purchaseType||"units"} · Click to view Amazon Purchases`,
    link:"amazon",
    time:nowCA().ts.slice(0,16),
    read:[], for:notifTargets
  });
  refreshNotifBadge(); buildNav();

  showToast(`✓ "${r.productDesc||r.asin}" transferred to Amazon Purchases!`, "var(--green)");
}

// Inline note editor for approvers
function openResInlineNote(id){
  const r=DB.research.find(x=>x.id===id);
  if(!r) return;
  openModal(`${mHeader("Approver Notes — "+r.productDesc||r.asin)}
  <div class="modal-body">
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px">ASIN: <span class="mono" style="color:var(--accent)">${r.asin}</span> · Submitted by <strong>${r.prMember||r.submittedBy||"—"}</strong></div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea name="approverNotes" class="form-input" rows="4" placeholder="Add notes about this ASIN…">${r.approverNotes||""}</textarea>
    </div>
  </div>
  ${mFooter(`saveResApproverNote('${id}')`)}`)
}
function saveResApproverNote(id){
  const r=DB.research.find(x=>x.id===id);
  if(!r) return;
  r.approverNotes=mVal("approverNotes");
  closeModal();
  showToast("Notes saved","var(--green)");
  pageResearch();
}

// ── PR Team: Submit ASIN form ──
function openResSubmitModal(){
  const isPR = isPRTeam();
  const defaultBy = isPR && PR_NAMES.includes(currentUser?.name) ? currentUser.name : "";

  openModal(`${mHeader("Submit ASIN for Approval")}
  <div class="modal-body">
    <div style="background:rgba(79,142,247,.07);border:1px solid rgba(79,142,247,.2);border-radius:var(--r);padding:10px 12px;margin-bottom:14px;font-size:12px;color:var(--muted)">
      📋 Fill in the details below. <strong style="color:var(--text)">Kin, Daniel, Merylle or Wilson</strong> will review your submission.
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin-bottom:8px">Submission Info</div>
    <div class="form-grid">
      ${mField("Date","date",TODAY,"date","",true)}
      ${mField("Manager","manager","","select",",Daniel,Merylle,Wilson",true)}
      ${mField("PR Member","prMember",defaultBy,"select",","+PR_NAMES.join(","),true)}
      ${mField("FBA/FBM","fulfillmentType","FBA","select","FBA,FBM,2DS",true)}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Product Info</div>
    <div class="form-grid">
      ${mField("ASIN","asin","","text","e.g. B08N5WRWNW",true)}
      <div class="form-full">${mField("Product Description","productDesc","","text","",true)}</div>
      ${mField("Amazon Link","amazonLink","","text","https://...",true)}
      ${mField("Supplier Link","supplierLink","","text","https://...",true)}
      <div class="form-full">${clientSelect("client","",false)}</div>
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Financials <span style="font-size:10px;color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">— formulas auto-calculate on save</span></div>
    <div class="form-grid">
      ${mField("Unit Cost ($)","unitCost","","number","",true)}
      ${mField("AMZ Pack/Bundle/QTY","amzPackBundleQty","","select",",Units,Bundles,2-Pack,3-Pack,4-Pack,5-Pack,6-Pack,10-Pack,12-Pack",true)}
      ${mField("Total Cost ($)","totalCost","","number","Auto: unitCost × qty",true)}
      ${mField("AWL Charge 10% ($)","awlCharge10","","number","Auto: totalCost × 10%",true)}
      ${mField("Buybox Price ($)","buyboxPrice","","number","",true)}
      ${mField("FBA Fees ($)","fbaFees","","number","",true)}
      ${mField("Referral Fees ($)","referralFees","","number","",true)}
      ${mField("Storage Fee ($)","storageFee","","number","",true)}
      ${mField("Inbound/Shipping Fee ($)","inboundFee","","number","",true)}
      ${mField("Units Sold","unitsSold","","number","",true)}
    </div>
    <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--r);padding:10px 12px;margin:8px 0 14px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
      <div><div style="font-size:10px;color:var(--muted);margin-bottom:3px">Total COGs (auto)</div><div id="res-cogs-preview" style="font-size:14px;font-weight:700;color:var(--red)">$0.00</div></div>
      <div><div style="font-size:10px;color:var(--muted);margin-bottom:3px">Profit (auto)</div><div id="res-profit-preview" style="font-size:14px;font-weight:700;color:var(--green)">$0.00</div></div>
      <div><div style="font-size:10px;color:var(--muted);margin-bottom:3px">% 10% AWL (auto)</div><div id="res-pct-preview" style="font-size:14px;font-weight:700;color:var(--accent)">0.00%</div></div>
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin-bottom:8px">Notes</div>
    <div class="form-grid">
      <div class="form-full">${mField("PR Team Notes","prNotes","","textarea","",true)}</div>
    </div>
  </div>
  ${mFooter("saveResSubmit()")}`,true);

  // Attach live formula listeners after modal renders
  setTimeout(()=>{
    ["unitCost","totalCost","awlCharge10","buyboxPrice","fbaFees","referralFees","storageFee","inboundFee"].forEach(f=>{
      const el=document.querySelector(`[name="${f}"]`);
      if(el) el.addEventListener("input", updateResFormulas);
    });
  },100);
}

function updateResFormulas(){
  const g = n => Number((document.querySelector(`[name="${n}"]`)?.value)||0);
  const totalCost = g("totalCost");
  const awl       = g("awlCharge10");
  const fba       = g("fbaFees");
  const ref       = g("referralFees");
  const store     = g("storageFee");
  const inbound   = g("inboundFee");
  const buybox    = g("buyboxPrice");

  const cogs    = totalCost + awl + fba + ref + store + inbound;
  const profit  = buybox - cogs;
  const pct     = buybox > 0 ? (profit/buybox*100) : 0;

  const cogsEl   = document.getElementById("res-cogs-preview");
  const profitEl = document.getElementById("res-profit-preview");
  const pctEl    = document.getElementById("res-pct-preview");
  if(cogsEl)   cogsEl.textContent   = "$"+cogs.toFixed(2);
  if(profitEl){ profitEl.textContent= "$"+profit.toFixed(2); profitEl.style.color=profit>=0?"var(--green)":"var(--red)"; }
  if(pctEl)    pctEl.textContent    = pct.toFixed(2)+"%";
}

function saveResSubmit(forceReason=""){
  // ── Full required field validation ──
  const required = [
    {key:"date",          label:"Date"},
    {key:"manager",       label:"Manager"},
    {key:"prMember",      label:"PR Member"},
    {key:"fulfillmentType",label:"FBA/FBM"},
    {key:"asin",          label:"ASIN"},
    {key:"productDesc",   label:"Product Description"},
    {key:"amazonLink",    label:"Amazon Link"},
    {key:"supplierLink",  label:"Supplier Link"},
    {key:"unitCost",      label:"Unit Cost"},
    {key:"amzPackBundleQty",label:"AMZ Pack/Bundle/QTY"},
    {key:"totalCost",     label:"Total Cost"},
    {key:"awlCharge10",   label:"AWL Charge 10%"},
    {key:"buyboxPrice",   label:"Buybox Price"},
    {key:"fbaFees",       label:"FBA Fees"},
    {key:"referralFees",  label:"Referral Fees"},
    {key:"storageFee",    label:"Storage Fee"},
    {key:"inboundFee",    label:"Inbound/Shipping Fee"},
    {key:"unitsSold",     label:"Units Sold"},
    {key:"prNotes",       label:"PR Team Notes"},
  ];

  // If coming from duplicate confirm flow, values are in window._pendingResSubmit
  const src = forceReason && window._pendingResSubmit ? window._pendingResSubmit : null;
  const g2 = k => src ? (src[k]||"") : mVal(k);

  const missing = required.filter(f => !g2(f.key) && g2(f.key)!=="0");
  if(missing.length > 0){
    showToast(`Required: ${missing.map(f=>f.label).join(", ")}`, "var(--red)");
    // Highlight missing fields
    missing.forEach(f=>{
      const el = document.querySelector(`[name="${f.key}"]`);
      if(el){ el.style.borderColor="var(--red)"; el.style.boxShadow="0 0 0 2px rgba(247,92,92,.2)"; setTimeout(()=>{ el.style.borderColor=""; el.style.boxShadow=""; },3000); }
    });
    return;
  }

  const asin=g2("asin"), name=g2("productDesc"), by=g2("prMember");

  // ── Duplicate ASIN detection ──
  const existingInResearch = DB.research.filter(r=>
    r.asin && r.asin.trim().toLowerCase()===asin.trim().toLowerCase()
  );
  const existingInInventory = (DB.inventory||[]).find(i=>
    i.asin && i.asin.trim().toLowerCase()===asin.trim().toLowerCase()
  );
  const existingInAmazon = (DB.amazon||[]).find(a=>
    a.asin && a.asin.trim().toLowerCase()===asin.trim().toLowerCase()
  );
  const existingInReplen = (DB.replenishment||[]).find(r=>
    r.asin && r.asin.trim().toLowerCase()===asin.trim().toLowerCase()
  );

  const hasDuplicate = existingInResearch.length>0 || existingInInventory || existingInAmazon || existingInReplen;

  if(hasDuplicate && !forceReason){
    const locations = [];
    existingInResearch.forEach(r=>locations.push(`📋 Research — <em>${r.productDesc||r.productName}</em> (${r.status}, by ${r.prMember||r.submittedBy})`));
    if(existingInInventory) locations.push(`📦 Inventory — <em>${existingInInventory.name}</em> (Client: ${existingInInventory.client||"—"})`);
    if(existingInAmazon)    locations.push(`🛒 Amazon Purchases — Order ${existingInAmazon.orderNumber||"—"} (${existingInAmazon.status})`);
    if(existingInReplen)    locations.push(`🔄 Replenishment — <em>${existingInReplen.productDesc||"—"}</em>`);

    window._pendingResSubmit = {
      asin, name, by,
      date:mVal("date"),manager:mVal("manager"),fulfillmentType:mVal("fulfillmentType"),
      client:mVal("client"),amazonLink:mVal("amazonLink"),supplierLink:mVal("supplierLink"),
      unitCost:mVal("unitCost"),amzPackBundleQty:mVal("amzPackBundleQty"),
      totalCost:mVal("totalCost"),awlCharge10:mVal("awlCharge10"),
      buyboxPrice:mVal("buyboxPrice"),fbaFees:mVal("fbaFees"),
      referralFees:mVal("referralFees"),storageFee:mVal("storageFee"),
      inboundFee:mVal("inboundFee"),unitsSold:mVal("unitsSold"),
      prNotes:mVal("prNotes"),
    };

    openModal(`${mHeader("⚠️ Duplicate ASIN Detected")}
    <div class="modal-body">
      <div style="background:rgba(247,201,79,.08);border:1px solid rgba(247,201,79,.3);border-radius:var(--r);padding:12px 14px;margin-bottom:14px">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
          <span style="font-size:20px">⚠️</span>
          <div>
            <div style="font-weight:700;font-size:13px">This ASIN already exists in the system</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;font-family:var(--mono)">${asin}</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:12px">
          ${locations.map(l=>`<div style="padding:5px 8px;background:rgba(255,255,255,.04);border-radius:var(--r);border:1px solid var(--border)">${l}</div>`).join("")}
        </div>
      </div>
      <div style="font-size:13px;margin-bottom:10px">Do you still want to submit? Please provide a reason.</div>
      <div class="form-group">
        <label class="form-label">Reason for Duplicate Submission <span style="color:var(--red)">*</span></label>
        <textarea id="dup-reason" class="form-input" rows="3" placeholder="e.g. Different supplier, new bundle size, price drop opportunity…"></textarea>
      </div>
    </div>
    <div class="modal-footer" style="justify-content:space-between">
      <button class="btn btn-ghost btn-sm" onclick="closeModal();openResSubmitModal()">← Go Back</button>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancel</button>
        <button class="btn btn-warning" onclick="confirmDupResSubmit()" style="background:var(--yellow);color:#000;font-weight:700">Submit Anyway →</button>
      </div>
    </div>`);
    return;
  }

  const unitCost    = Number(g2("unitCost"))||0;
  const totalCost   = Number(g2("totalCost"))||0;
  const awlCharge10 = Number(g2("awlCharge10"))||0;
  const buyboxPrice = Number(g2("buyboxPrice"))||0;
  const fbaFees     = Number(g2("fbaFees"))||0;
  const referralFees= Number(g2("referralFees"))||0;
  const storageFee  = Number(g2("storageFee"))||0;
  const inboundFee  = Number(g2("inboundFee"))||0;
  const totalCogs   = totalCost + awlCharge10 + fbaFees + referralFees + storageFee + inboundFee;
  const profit      = buyboxPrice - totalCogs;
  const percentage  = buyboxPrice > 0 ? (profit/buyboxPrice*100).toFixed(2)+"%" : "0.00%";
  const prNotesVal  = g2("prNotes");
  const finalPrNotes= forceReason ? (prNotesVal?prNotesVal+"\n\n[Duplicate reason]: "+forceReason:"[Duplicate reason]: "+forceReason) : prNotesVal;

  const rec={
    id:uid("RES"),
    asin: src?src.asin:asin,
    productDesc: src?src.name:name,
    productName: src?src.name:name, // alias for compatibility
    submittedBy: src?src.by:by,
    prMember: src?src.by:by,
    submittedAt:nowCA().ts.slice(0,16),
    date:g2("date")||TODAY,
    manager:g2("manager"),
    fulfillmentType:g2("fulfillmentType"),
    client:g2("client"),
    amazonLink:g2("amazonLink"),supplierLink:g2("supplierLink"),
    unitCost,amzPackBundleQty:g2("amzPackBundleQty"),
    totalCost,awlCharge10,buyboxPrice,fbaFees,referralFees,storageFee,inboundFee,
    unitsSold:Number(g2("unitsSold"))||0,
    totalCogs,profit,percentage,
    prNotes:finalPrNotes,
    status:"New Asin",
    approvedBy:"",approvedAt:"",dateReviewed:"",
    asinStatus:"",qtyToPurchase:"",purchaseType:"",
    approverNotes:"",gatedUngated:"",kinNotes:"",
    duplicateReason:forceReason||"",
  };
  window._pendingResSubmit = null;

  upsert("research",rec);
  notifyOnSave("research",rec,!id);
  closeModal();
  USERS.filter(u=>u.role==="Admin"||u.role==="Manager"||APPROVER_NAMES.includes(u.name)).forEach(u=>{
    DB.notifications.unshift({
      id:uid("NTF"),type:"po",
      title:`🔬 New ASIN Submitted${forceReason?" (Duplicate)":""}`,
      body:`${rec.prMember} submitted ${rec.productDesc} (${rec.asin})${forceReason?" — Duplicate: "+forceReason:""}`,
      link:"research",time:nowCA().ts.slice(0,16),read:[],for:u.username
    });
  });
  refreshNotifBadge(); buildNav();
  showToast(`✓ ASIN submitted! Awaiting approval.`,"var(--green)");
  pageResearch();
}

function confirmDupResSubmit(){
  const reason = (document.getElementById("dup-reason")?.value||"").trim();
  if(!reason){ showToast("Please provide a reason","var(--red)"); return; }
  saveResSubmit(reason);
}

// ── Approver: Approve / Deny with notes ──
function approveResearch(id){
  const r=DB.research.find(x=>x.id===id);
  if(!r) return;
  openModal(`${mHeader("Approve ASIN — "+(r.productDesc||r.asin))}
  <div class="modal-body">
    <div style="background:rgba(79,207,142,.07);border:1px solid rgba(79,207,142,.2);border-radius:var(--r);padding:12px 14px;margin-bottom:14px;display:flex;gap:10px;align-items:center">
      <span style="font-size:22px">✅</span>
      <div><div style="font-weight:600">${r.productDesc||r.asin}</div><div style="font-size:12px;color:var(--muted)">ASIN: ${r.asin} · Submitted by ${r.prMember||r.submittedBy}</div></div>
    </div>
    <div class="form-grid">
      ${mField("Approved By","approvedBy",r.approvedBy||currentUser?.name,"select",","+APPROVER_NAMES.join(","))}
      ${mField("ASIN Status","asinStatus",r.asinStatus,"select",","+ASIN_STATUSES.join(","))}
      ${mField("Date Reviewed","dateReviewed",r.dateReviewed||TODAY,"date")}
      ${mField("QTY to Purchase","qtyToPurchase",r.qtyToPurchase,"number")}
  </div>`);
}

function denyResearch(id){
  const r=DB.research.find(x=>x.id===id);
  if(!r) return;
  openModal(`${mHeader("Deny ASIN — "+(r.productDesc||r.asin))}
  <div class="modal-body">
    <div style="background:rgba(247,92,92,.07);border:1px solid rgba(247,92,92,.2);border-radius:var(--r);padding:12px 14px;margin-bottom:14px;display:flex;gap:10px;align-items:center">
      <span style="font-size:22px">❌</span>
      <div><div style="font-weight:600">${r.productDesc||r.asin}</div><div style="font-size:12px;color:var(--muted)">Submitted by ${r.prMember||r.submittedBy}</div></div>
    </div>
    <div class="form-grid">
      ${mField("Denied By","approvedBy",currentUser?.name,"select",","+APPROVER_NAMES.join(","))}
      ${mField("ASIN Status","asinStatus",r.asinStatus,"select",","+ASIN_STATUSES.join(","))}
      <div class="form-full">${mField("Reason for Denial","approverNotes",r.approverNotes,"textarea","Required — explain why this ASIN is denied")}</div>
    </div>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancel</button>
    <button class="btn btn-danger" onclick="confirmApproveResearch('${id}',false)">✕ Deny</button>
  </div>`);
}

function confirmApproveResearch(id, approved){
  const r=DB.research.find(x=>x.id===id);
  if(!r) return;
  if(!approved && !mVal("approverNotes")){ showToast("Please provide a reason for denial","var(--red)"); return; }
  r.status        = approved?"Approved":"Denied";
  r.approvedBy    = mVal("approvedBy")||currentUser?.name;
  r.approvedAt    = nowCA().ts.slice(0,16);
  r.dateReviewed  = mVal("dateReviewed")||nowCA().date;
  r.approverNotes = mVal("approverNotes")||r.approverNotes||"";
  r.asinStatus    = mVal("asinStatus")||r.asinStatus||"";
  r.gatedUngated  = mVal("gatedUngated")||r.gatedUngated||"";
  if(approved){
    r.qtyToPurchase = Number(mVal("qtyToPurchase"))||r.qtyToPurchase||0;
    r.purchaseType  = mVal("purchaseType")||r.purchaseType||"Units";
  }
  // Notify submitter
  const submitter=USERS.find(u=>u.name===r.prMember||u.username===r.prMember||u.name===r.submittedBy);
  if(submitter){
    DB.notifications.unshift({
      id:uid("NTF"),type:approved?"answer":"system",
      title:`${approved?"✅ ASIN Approved":"❌ ASIN Denied"}: ${r.productDesc||r.asin}`,
      body:`${r.approvedBy} ${approved?"approved":"denied"} your submission (${r.asin})${r.approverNotes?" — "+r.approverNotes:""}`,
      link:"research",time:nowCA().ts.slice(0,16),read:[],for:submitter.username
    });
    refreshNotifBadge(); buildNav();
  }
  closeModal();
  showToast(`${r.productDesc||r.asin} ${approved?"approved ✓":"denied ✕"}`,approved?"var(--green)":"var(--red)");
  pageResearch();
}

// ── Full edit modal (approvers only) ──
function openResEditModal(id){
  const r=DB.research.find(x=>x.id===id);
  if(!r) return;
  openModal(`${mHeader("Edit — "+(r.productDesc||r.asin))}
  <div class="modal-body">
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--yellow);margin-bottom:8px">Approver Fields</div>
    <div class="form-grid">
      ${mField("Status","status",r.status,"select","New Asin,Pending,Approved,Denied")}
      ${mField("Approved By","approvedBy",r.approvedBy,"select",","+APPROVER_NAMES.join(","))}
      ${mField("ASIN Status","asinStatus",r.asinStatus,"select",","+ASIN_STATUSES.join(","))}
      ${mField("Date Reviewed","dateReviewed",r.dateReviewed,"date")}
      ${mField("QTY to Purchase","qtyToPurchase",r.qtyToPurchase,"number")}
      ${mField("Purchase Type","purchaseType",r.purchaseType||"Units","select","Units,Bundles")}
      ${mField("Gated/Ungated","gatedUngated",r.gatedUngated,"select",",Ungated,Gated")}
      <div class="form-full">${mField("Approver Notes","approverNotes",r.approverNotes,"textarea")}</div>
    </div>
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">PR Submission Fields</div>
    <div class="form-grid">
      ${mField("Date","date",r.date,"date")}
      ${mField("Manager","manager",r.manager,"select",",Daniel,Merylle,Wilson")}
      ${mField("PR Member","prMember",r.prMember||r.submittedBy,"select",","+PR_NAMES.join(","))}
      ${mField("FBA/FBM","fulfillmentType",r.fulfillmentType,"select","FBA,FBM,2DS")}
      ${mField("ASIN","asin",r.asin,"text")}
      <div class="form-full">${mField("Product Description","productDesc",r.productDesc||r.productName,"text")}</div>
      ${mField("Amazon Link","amazonLink",r.amazonLink,"text")}
      ${mField("Supplier Link","supplierLink",r.supplierLink,"text")}
      <div class="form-full">${clientSelect("client",r.client,false)}</div>
      ${mField("Unit Cost ($)","unitCost",r.unitCost,"number")}
      ${mField("AMZ Pack/Bundle/QTY","amzPackBundleQty",r.amzPackBundleQty,"text")}
      ${mField("Total Cost ($)","totalCost",r.totalCost,"number")}
      ${mField("AWL Charge 10% ($)","awlCharge10",r.awlCharge10,"number")}
      ${mField("Buybox Price ($)","buyboxPrice",r.buyboxPrice,"number")}
      ${mField("FBA Fees ($)","fbaFees",r.fbaFees,"number")}
      ${mField("Referral Fees ($)","referralFees",r.referralFees,"number")}
      ${mField("Storage Fee ($)","storageFee",r.storageFee,"number")}
      ${mField("Inbound/Shipping Fee ($)","inboundFee",r.inboundFee,"number")}
      ${mField("Units Sold","unitsSold",r.unitsSold,"number")}
      <div class="form-full">${mField("PR Team Notes","prNotes",r.prNotes,"textarea")}</div>
    </div>
  </div>
  ${mFooter(`saveResEdit('${id}')`,`confirm2('Delete this submission?',()=>delRecord('research','${id}'))`)}`,true);
}

function saveResEdit(id){
  const r=DB.research.find(x=>x.id===id);
  if(!r) return;
  const fields=["status","approvedBy","asinStatus","dateReviewed","qtyToPurchase","purchaseType","gatedUngated","approverNotes","date","manager","prMember","fulfillmentType","asin","productDesc","amazonLink","supplierLink","client","unitCost","amzPackBundleQty","totalCost","awlCharge10","buyboxPrice","fbaFees","referralFees","storageFee","inboundFee","unitsSold","prNotes"];
  fields.forEach(f=>{ r[f]=mVal(f); });
  r.productName=r.productDesc;
  r.submittedBy=r.prMember;
  // Recalculate formulas
  const tc=Number(r.totalCost)||0, awl=Number(r.awlCharge10)||0, fba=Number(r.fbaFees)||0;
  const ref=Number(r.referralFees)||0, store=Number(r.storageFee)||0, inb=Number(r.inboundFee)||0;
  const bb=Number(r.buyboxPrice)||0;
  r.totalCogs=tc+awl+fba+ref+store+inb;
  r.profit=bb-r.totalCogs;
  r.percentage=bb>0?(r.profit/bb*100).toFixed(2)+"%":"0.00%";
  closeModal();
  showToast("Submission updated","var(--green)");
  pageResearch();
}

function exportResCSV(){
  const cols=["Status","Approved By","ASIN Status","Date Reviewed","QTY to Purchase","Purchase Type","Total Purchase Value","Client","Approver Notes","Gated/Ungated","Date","Manager","PR Member","FBA/FBM","ASIN","Product Description","Amazon Link","Supplier Link","Unit Cost","AMZ Pack/Bundle/QTY","Total Cost","AWL Charge 10%","Buybox Price","FBA Fees","Referral Fees","Storage Fee","Inbound/Ship Fee","Units Sold","Total COGs","Profit","% 10% AWL","PR Notes","Duplicate Reason"];
  const csv=[cols.join(","),...DB.research.map(r=>{
    const tpv=(Number(r.qtyToPurchase)||0)*(Number(r.unitCost)||0);
    return [
      r.status||"",r.approvedBy||"",r.asinStatus||"",r.dateReviewed||"",r.qtyToPurchase||0,
      r.purchaseType||"",tpv.toFixed(2),r.client||"",
      `"${(r.approverNotes||"").replace(/"/g,'""')}"`,r.gatedUngated||"",
      r.date||"",r.manager||"",r.prMember||r.submittedBy||"",r.fulfillmentType||"",
      r.asin||"",`"${(r.productDesc||r.productName||"").replace(/"/g,'""')}"`,
      r.amazonLink||"",r.supplierLink||"",r.unitCost||0,r.amzPackBundleQty||"",
      r.totalCost||0,r.awlCharge10||0,r.buyboxPrice||0,r.fbaFees||0,
      r.referralFees||0,r.storageFee||0,r.inboundFee||0,r.unitsSold||0,
      r.totalCogs?.toFixed(2)||0,r.profit?.toFixed(2)||0,r.percentage||"",
      `"${(r.prNotes||"").replace(/"/g,'""')}"`,r.duplicateReason||""
    ].join(",");
  })].join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download="AW_Research_"+TODAY+".csv"; a.click();
  showToast("Research data exported","var(--green)");
}


//  PAGE: REPORTS
// ═══════════════════════════════════════════════

