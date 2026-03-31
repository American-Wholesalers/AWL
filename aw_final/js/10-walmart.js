// ── 10-walmart.js ──

function pageWalmart(){
  const search=(window._wmtSearch)||"";
  const wmtSearch2 = search;
  const wmtStatusF=(window._wmtStatusF)||"All";
  const _wmtStatusF = wmtStatusF;
  const rows=DB.walmart.filter(r=>{
    const ms=wmtStatusF==="All"||r.status===wmtStatusF;
    const mq=!search||r.product.toLowerCase().includes(search)||r.orderNo.toLowerCase().includes(search);
    return ms&&mq;
  });
  const total=DB.walmart.reduce((a,r)=>a+r.total,0);
  render(`
  <div>
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:10px"><div style="width:26px;height:26px;background:#0071CE;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#FFC220;font-size:12px">W</div><div><div class="page-title">Walmart Purchases</div><div class="page-sub">${DB.walmart.length} orders</div></div></div>
      ${canSubmit("walmart")?'<button class="btn btn-primary" onclick="openWMTModal()">+ Add Order</button>':""}
    </div>
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><input class="search-bar" placeholder="Search orders or products..." value="${wmtSearch2}" oninput="window.wmtSearch2=this.value;pageWalmart()" style="flex:1;min-width:200px;max-width:300px"><span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--dim)">Status:</span><div style="display:flex;gap:5px;flex-wrap:wrap">${['All', 'Processing', 'Shipped', 'In Transit', 'Delivered', 'Returned', 'Cancelled'].map(s=>`<button class="filter-pill${_wmtStatusF===s?" active":""}" onclick="window._wmtStatusF='${s}';pageWalmart()">${s}</button>`).join("")}</div></div></div>
    <div class="metrics metrics-4">
      ${metric("Total Orders",DB.walmart.length,"","var(--accent)")}
      ${metric("In Transit",DB.walmart.filter(r=>["In Transit","Shipped"].includes(r.status)).length,"","var(--yellow)")}
      ${metric("Total Spend","$"+total.toFixed(0),"USD","#0071CE")}
      ${metric("Delivered",DB.walmart.filter(r=>r.status==="Delivered").length,"","var(--green)")}
    </div>
    <div class="card">
      <div style="margin-bottom:14px"><input class="search-bar" id="wmt-search" placeholder="Search orders or products…" value="${search}" oninput="pageWalmart()" style="width:300px"></div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Order No.</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Category</th><th>Requestor</th><th>Date</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows.map(r=>`<tr>
          <td class="mono" style="color:#0071CE;font-size:11px">${r.orderNo}</td>
          <td class="fw6">${r.product}</td>
          <td class="text-muted">${r.qty}</td><td class="text-muted">$${r.unitPrice.toFixed(2)}</td>
          <td class="fw6">$${r.total.toFixed(2)}</td>
          <td><span class="tag">${r.category}</span></td>
          <td class="text-muted">${r.requestor}</td>
          <td class="text-muted">${r.date}</td>
          <td>${badge(r.status)}</td>
              <td>${canEdit("walmart")?`<button class="btn btn-info btn-sm" onclick='openWMTModal(${JSON.stringify(r).replace(/'/g,"&#39;")})'>Edit</button>`:""}</td>
        </tr>`).join("")}</tbody>
      </table></div>
    </div>
  </div>`);
}

function openWMTModal(item=null){
  const isNew=!item;
  item=item||{id:"",orderNo:"",product:"",qty:"",unitPrice:"",total:"",category:"Supplies",status:"Processing",date:TODAY,requestor:""};
  openModal(`${mHeader(isNew?"Add Walmart Order":"Edit Walmart Order")}
  <div class="modal-body"><div class="form-grid">
    <div class="form-full">${mField("Walmart Order Number","orderNo",item.orderNo,"text","e.g. WM-2026-XXXXXX",true)}</div>
    <div class="form-full">${mField("Product Name","product",item.product,"text","",true)}</div>
    ${mField("Qty","qty",item.qty,"number")}${mField("Unit Price ($)","unitPrice",item.unitPrice,"number")}
    ${mField("Total ($)","total",item.total,"number")}${mField("Category","category",item.category,"select","PPE,Warehouse,Supplies,Electronics,Tools,Cleaning,Other")}
    ${mField("Requestor","requestor",item.requestor,"text")}${mField("Date","date",item.date,"date")}
    <div class="form-full">${mField("Status","status",item.status,"select","Processing,Shipped,In Transit,Delivered,Returned,Cancelled")}</div>
  </div></div>
  ${mFooter("saveWMT('"+item.id+"')",item.id?"confirm2('Delete this order?',()=>delRecord('walmart','"+item.id+"'))":"")}`);
}

function saveWMT(id){
  if(!mVal("product")||!mVal("orderNo")){showToast("Order No. and Product required.","var(--red)");return;}
  const rec={id:id||uid("WMT"),orderNo:mVal("orderNo"),product:mVal("product"),qty:Number(mVal("qty"))||1,unitPrice:Number(mVal("unitPrice"))||0,total:Number(mVal("total"))||0,category:mVal("category"),status:mVal("status"),date:mVal("date"),requestor:mVal("requestor")};
  upsert("walmart",rec); notifyOnSave("walmart",rec,!id); closeModal(); triggerWebhook("walmart.updated",rec); pageWalmart();
}

// ═══════════════════════════════════════════════
//  PAGE: EMERGENCY SHIPMENTS
// ═══════════════════════════════════════════════

