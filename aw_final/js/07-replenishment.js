// ── 07-replenishment.js ──

function pageReplenishment(){
  var search=(window._repSearch)||"";
  var statusF=(window._repStatusF)||"All";
  const _repStatusF = window._repStatusF||"All";
  var repTab=(window._repTab)||"Amazon";
  // Redirect if active tab is not accessible
  {const _allowed=["Amazon","Walmart","Ebay"].filter(t=>canAccessTab("replenishment",t));if(_allowed.length&&!_allowed.includes(repTab)){window._repTab=_allowed[0];repTab=_allowed[0];}}

  const amzColor="#FF9900", wmtColor="#0071CE", ebayColor="#E53238";
  const tabColor=repTab==="Amazon"?amzColor:repTab==="Walmart"?wmtColor:ebayColor;

  // Filter by platform tab first, then status/search
  var platformRows=DB.replenishment.filter(function(r){
    return (r.platform||"Amazon")===repTab;
  });
  var rows=platformRows.filter(function(r){
    var ms=statusF==="All"||r.status===statusF||r.orderStatus===statusF;
    var mq=!search||
      (r.productDesc||"").toLowerCase().includes(search.toLowerCase())||
      (r.client||"").toLowerCase().includes(search.toLowerCase())||
      (r.asin||"").toLowerCase().includes(search.toLowerCase())||
      (r.prName||"").toLowerCase().includes(search.toLowerCase())||
      (r.vaName||"").toLowerCase().includes(search.toLowerCase());
    return ms&&mq;
  });

  var repNeeded=platformRows.filter(function(r){return r.replenishmentNeeded==="Yes";}).length;
  var totalPOValue=platformRows.reduce(function(s,r){return s+(Number(r.poValue)||0);},0);
  var repCanEdit=canEdit("replenishment");

  function sel(id,f,v,opts){
    if(!repCanEdit) return v||"—";
    var s='<select onchange="saveRepField(\''+id+'\',\''+f+'\',this.value)" style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:var(--text);font-size:11px;font-family:var(--font);outline:none;cursor:pointer;max-width:150px">';
    opts.forEach(function(o){s+='<option value="'+o+'"'+(v===o?' selected':'')+'>'+o+'</option>';});
    return s+'</select>';
  }
  function txt(id,f,v,w,c){
    w=w||"110px";c=c||"var(--text)";
    if(!repCanEdit) return '<span style="font-size:12px;color:'+c+'">'+(v||"—")+'</span>';
    return '<input type="text" value="'+(v||"").replace(/"/g,"&quot;")+'" onchange="saveRepField(\''+id+'\',\''+f+'\',this.value)" style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:'+c+';font-size:11px;font-family:var(--font);outline:none;width:'+w+'">';
  }
  function num(id,f,v,c,w){
    c=c||"var(--text)";w=w||"85px";
    var disp=v!=null?"$"+Number(v).toFixed(2):"—";
    if(!repCanEdit) return '<span style="color:'+c+';font-weight:600">'+disp+'</span>';
    return '<input type="number" value="'+(v||"")+'" onchange="saveRepField(\''+id+'\',\''+f+'\',this.value)" style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:'+c+';font-size:11px;font-family:var(--font);outline:none;width:'+w+'">';
  }
  function dte(id,f,v){
    if(!repCanEdit) return '<span style="font-size:12px;color:var(--muted)">'+(v||"—")+'</span>';
    return '<input type="date" value="'+(v||"")+'" onchange="saveRepField(\''+id+'\',\''+f+'\',this.value)" style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:var(--text);font-size:11px;font-family:var(--font);outline:none;width:130px">';
  }
  function nte(id,f,v){
    if(!repCanEdit) return '<span style="font-size:11px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px" title="'+(v||"")+'">'+(v||"—")+'</span>';
    return '<div style="display:flex;align-items:center;gap:4px"><span style="font-size:11px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px" title="'+(v||"")+'">'+(v||"—")+'</span><button onclick="openRepNoteModal(\''+id+'\',\''+f+'\')" style="flex-shrink:0;background:rgba(79,142,247,.12);border:1px solid rgba(79,142,247,.25);border-radius:5px;padding:2px 7px;color:var(--accent);font-size:10px;cursor:pointer;font-family:var(--font);font-weight:600">\u270f</button></div>';
  }

  var prNames=["","Gerald Napiza","Marjorie Bayani","Rex","Gerald James Maron","Christian Bayani","Aldrin Pizarra","Homer Medina","Winson Costales","Jayson Lee Barretto","Marc David"];

  var tbodyHtml="";
  if(rows.length===0){
    tbodyHtml='<tr><td colspan="48" style="text-align:center;color:var(--muted);padding:2.5rem">No records match your filters</td></tr>';
  } else {
    rows.forEach(function(r){
      var repBg=r.replenishmentNeeded==="Yes"?"background:rgba(247,92,92,.07)":"";
      var tr='<tr style="'+repBg+'">';
      tr+='<td>'+sel(r.id,"status",r.status,["Pending","Approved","Denied","Kin Denied"])+'</td>';
      var approvedByOpts = (r.platform==="Walmart"||r.platform==="Ebay") ? ["","Kin"] : ["","Kin","Daniel","Merylle"];
      var orderStatusOpts = (r.platform==="Walmart"||r.platform==="Ebay")
        ? ["Pending","Received PO","Purchased","Min. QTY Required","OOS","Cancelled"]
        : ["Pending","Received PO","Purchased","Min. QTY Required","OOS","Cancelled","PO Sent to AWL Team"];
      tr+='<td>'+sel(r.id,"approvedBy",r.approvedBy,approvedByOpts)+'</td>';
      tr+='<td>'+sel(r.id,"orderStatus",r.orderStatus,orderStatusOpts)+'</td>';
      tr+='<td>'+sel(r.id,"platform",r.platform,["Amazon","Walmart","Ebay"])+'</td>';
      tr+='<td>'+txt(r.id,"awlPct",r.awlPct,"60px","var(--accent)")+'</td>';
      tr+='<td>'+num(r.id,"approvedQty",r.approvedQty,"var(--text)","70px")+'</td>';
      tr+='<td>'+sel(r.id,"purchaseType",r.purchaseType,["Units","Bundles"])+'</td>';
      tr+='<td>'+num(r.id,"profitUnit",r.profitUnit,"var(--green)","80px")+'</td>';
      tr+='<td style="font-size:12px;color:var(--accent);font-weight:500">'+(r.client||"—")+'</td>';
      tr+='<td>'+txt(r.id,"profitMarginUnit",r.profitMarginUnit,"70px","var(--green)")+'</td>';
      tr+='<td>'+num(r.id,"poValue",r.poValue,"var(--teal)","85px")+'</td>';
      tr+='<td>'+nte(r.id,"notes",r.notes)+'</td>';
      tr+='<td>'+dte(r.id,"date",r.date)+'</td>';
      tr+='<td>'+txt(r.id,"manager",r.manager,"110px")+'</td>';
      tr+='<td>'+txt(r.id,"vaName",r.vaName,"110px")+'</td>';
      tr+='<td>'+txt(r.id,"asin",r.asin,"110px","var(--accent)")+'</td>';
      tr+='<td>'+sel(r.id,"fulfillmentType",r.fulfillmentType,["FBA","FBM","2DS"])+'</td>';
      tr+='<td style="font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+(r.productDesc||"")+'">'+(r.productDesc||"—")+'</td>';
      tr+='<td style="font-size:12px">'+(r.amazonLink?'<a href="'+r.amazonLink+'" target="_blank" style="color:var(--accent);text-decoration:underline">View</a>':"—")+'</td>';
      tr+='<td style="font-size:12px">'+(r.supplierLink?'<a href="'+r.supplierLink+'" target="_blank" style="color:var(--accent);text-decoration:underline">View</a>':"—")+'</td>';
      tr+='<td>'+sel(r.id,"awlClientAccount",r.awlClientAccount,["AWL","Clients"])+'</td>';
      tr+='<td>'+num(r.id,"unitCost",r.unitCost,"var(--green)","80px")+'</td>';
      tr+='<td>'+txt(r.id,"amzPackBundleQty",String(r.amzPackBundleQty||""),"80px")+'</td>';
      tr+='<td>'+num(r.id,"totalCost",r.totalCost,"var(--teal)","85px")+'</td>';
      tr+='<td>'+num(r.id,"awlCharge10",r.awlCharge10,"var(--orange)","80px")+'</td>';
      tr+='<td>'+num(r.id,"buyboxPrice",r.buyboxPrice,"var(--text)","80px")+'</td>';
      tr+='<td>'+num(r.id,"fbaFees",r.fbaFees,"var(--muted)","80px")+'</td>';
      tr+='<td>'+num(r.id,"referralFees",r.referralFees,"var(--muted)","80px")+'</td>';
      tr+='<td>'+num(r.id,"awlPrep",r.awlPrep,"var(--muted)","80px")+'</td>';
      tr+='<td>'+num(r.id,"inboundShipping",r.inboundShipping,"var(--muted)","80px")+'</td>';
      tr+='<td style="color:var(--red);font-weight:600">'+(r.totalCogs10!=null?"$"+Number(r.totalCogs10).toFixed(2):"—")+'</td>';
      tr+='<td style="color:'+(Number(r.profit10)>=0?"var(--green)":"var(--red)")+';font-weight:700">'+(r.profit10!=null?"$"+Number(r.profit10).toFixed(2):"—")+'</td>';
      tr+='<td style="color:var(--green)">'+(r.profitMargin10||"—")+'</td>';
      tr+='<td>'+nte(r.id,"notes2",r.notes2)+'</td>';
      tr+='<td style="font-weight:600">'+(r.originalQty||"—")+'</td>';
      tr+='<td style="color:'+(Number(r.currentQty)===0?"var(--red)":"var(--yellow)")+';font-weight:700">'+(r.currentQty!=null?r.currentQty:0)+'</td>';
      tr+='<td>'+(r.weeksLive||"—")+'</td>';
      tr+='<td>'+sel(r.id,"replenishmentNeeded",r.replenishmentNeeded,["No","Yes"])+'</td>';
      tr+='<td>'+num(r.id,"replenishmentQty",r.replenishmentQty,"var(--accent)","80px")+'</td>';
      tr+='<td>'+dte(r.id,"dateFirstSale",r.dateFirstSale)+'</td>';
      tr+='<td>'+dte(r.id,"dateLive",r.dateLive)+'</td>';
      tr+='<td>'+nte(r.id,"notes3",r.notes3)+'</td>';
      tr+='<td>'+num(r.id,"profitAmt",r.profitAmt,"var(--green)","85px")+'</td>';
      tr+='<td>'+nte(r.id,"purchasersNotes",r.purchasersNotes)+'</td>';
      tr+='<td>'+txt(r.id,"profitMargin",r.profitMargin,"80px","var(--green)")+'</td>';
      tr+='<td>'+sel(r.id,"prName",r.prName,prNames)+'</td>';
      tr+='<td><button class="btn btn-info btn-sm" onclick="openRepById(\''+r.id+'\')">Edit</button></td>';
      tr+='</tr>';
      tbodyHtml+=tr;
    });
  }

  var filterPills=["All","Approved","Denied","Pending","Kin Denied","Purchased","OOS","Cancelled"].map(function(s){
    return '<button class="filter-pill'+(statusF===s?" active":"")+'" onclick="window._repStatusF=\''+s+'\';pageReplenishment()">'+s+'</button>';
  }).join("");

  render('<div>'
    +'<div class="page-header"><div><div class="page-title">Replenishment</div><div class="page-sub">Stock reorder management &middot; '+DB.replenishment.length+' records</div></div>'
    +'<div style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" onclick="exportRepCSV()">&#8595; Export</button>'
    +''+(canSubmit("replenishment")?'<button class="btn btn-primary" onclick="openRepModal()">+ New Request</button>':'')+'</div></div>'

    // Platform Tabs
    +'<div style="display:flex;gap:0;margin-bottom:1.25rem;border-bottom:2px solid var(--border)">'
    +[{id:"Amazon",label:"🛒 Amazon",color:amzColor},{id:"Walmart",label:"🛍 Walmart",color:wmtColor},{id:"Ebay",label:"🏷 eBay",color:ebayColor}].filter(function(p){return canAccessTab("replenishment",p.id);}).map(function(p){
      var cnt=DB.replenishment.filter(function(r){return (r.platform||"Amazon")===p.id;}).length;
      return '<button onclick="window._repTab=\''+p.id+'\';window._repStatusF=\'All\';window._repSearch=\'\';pageReplenishment()"'
        +' style="padding:10px 28px;background:none;border:none;border-bottom:3px solid '+(repTab===p.id?p.color:"transparent")+";"
        +'color:'+(repTab===p.id?p.color:"var(--muted)")+';font-size:14px;font-weight:'+(repTab===p.id?"700":"500")+";"
        +'cursor:pointer;font-family:var(--font);transition:all .15s;margin-bottom:-2px">'
        +p.label
        +'<span style="margin-left:8px;background:'+(repTab===p.id?"rgba(255,255,255,.12)":"rgba(255,255,255,.05)")+';border-radius:20px;padding:2px 8px;font-size:11px">'+cnt+'</span>'
        +'</button>';
    }).join("")
    +'</div>'

    +'<div class="metrics metrics-4" style="margin-bottom:1.25rem">'
    +metric("Total",platformRows.length,"","var(--accent)")
    +metric("Approved",platformRows.filter(function(r){return r.status==="Approved";}).length,"","var(--green)")
    +metric("Replenishment Needed",repNeeded,"","var(--red)")
    +metric("Total PO Value","$"+num(totalPOValue),"","var(--teal)")
    +'</div>'
    +'<div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">'
    +'<input class="search-bar" placeholder="Search product, ASIN, client, VA, PR name\u2026" value="'+search.replace(/"/g,"&quot;")+'" oninput="window._repSearch=this.value;pageReplenishment()" style="flex:1;min-width:200px;max-width:320px">'
    +'<div style="display:flex;gap:5px;flex-wrap:wrap">'+filterPills+'</div></div></div>'
    +'<div style="background:var(--card);border:1px solid var(--border);border-top:3px solid '+tabColor+';border-radius:var(--r2);overflow:hidden"><div style="overflow-x:auto">'
    +'<table style="width:max-content;min-width:100%"><thead><tr style="background:#0d1b3e;position:sticky;top:0;z-index:2">'
    +'<th style="min-width:120px">Status</th><th style="min-width:120px">Approved By</th><th style="min-width:160px">Status of Order</th>'
    +'<th style="min-width:110px">Platform</th><th style="min-width:80px">AWL %</th><th style="min-width:100px">Approved QTY</th>'
    +'<th style="min-width:120px">Purchase Type</th><th style="min-width:100px">Profit/Unit</th><th style="min-width:150px">Client</th>'
    +'<th style="min-width:150px">Profit Margin/Unit</th><th style="min-width:100px">PO Value</th><th style="min-width:160px">Notes</th>'
    +'<th style="min-width:110px">Date</th><th style="min-width:130px">Manager</th><th style="min-width:130px">VA Name</th>'
    +'<th style="min-width:120px">ASIN</th><th style="min-width:110px">2DS/FBA/FBM</th><th style="min-width:200px">Product Description</th>'
    +'<th style="min-width:160px">Amazon Link</th><th style="min-width:160px">Supplier Link</th><th style="min-width:160px">AWL/Clients Account</th>'
    +'<th style="min-width:100px">Unit Cost</th><th style="min-width:150px">AMZ Pack/Bundle/QTY</th><th style="min-width:110px">Total Cost</th>'
    +'<th style="min-width:130px">AWL Charge (10%)</th><th style="min-width:110px">Buybox Price</th><th style="min-width:100px">FBA Fees</th>'
    +'<th style="min-width:110px">Referral Fees</th><th style="min-width:100px">AWL Prep</th><th style="min-width:140px">Inbound Shipping</th>'
    +'<th style="min-width:180px">Total COGs (10%)</th><th style="min-width:150px">Profit (10%)</th><th style="min-width:180px">Profit Margin (10%)</th>'
    +'<th style="min-width:160px">Notes 2</th><th style="min-width:110px">Original QTY</th><th style="min-width:110px">Current QTY</th>'
    +'<th style="min-width:100px">Weeks Live</th><th style="min-width:160px">Replen. Needed?</th><th style="min-width:130px">Replen. QTY</th>'
    +'<th style="min-width:140px">Date First Sale</th><th style="min-width:130px">Date Went Live</th><th style="min-width:160px">Notes 3</th>'
    +'<th style="min-width:140px">$ Profit Amount</th><th style="min-width:180px">Purchasers Notes</th>'
    +'<th style="min-width:130px">Profit Margin</th><th style="min-width:110px">PR Name</th><th style="min-width:70px"></th>'
    +'</tr></thead><tbody>'+tbodyHtml+'</tbody></table></div>'
    +'<div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">'+rows.length+' of '+platformRows.length+' '+repTab+' records</div>'
    +'</div></div>');
}

function openRepById(id){
  const r=DB.replenishment.find(x=>x.id===id);
  if(r) openRepModal(r);
}

function openRepModal(r=null){
  const isNew=!r;
  r=r||{id:"",status:"Pending",approvedBy:"",orderStatus:"Pending",platform:(window._repTab)||"Amazon",awlPct:"10",approvedQty:"",purchaseType:"Units",profitUnit:"",client:"",profitMarginUnit:"",poValue:"",notes:"",date:TODAY,manager:currentUser?.name||"",vaName:"",asin:"",fulfillmentType:"FBA",productDesc:"",amazonLink:"",supplierLink:"",awlClientAccount:"AWL",unitCost:"",amzPackBundleQty:"",totalCost:"",awlCharge10:"",buyboxPrice:"",fbaFees:"",referralFees:"",awlPrep:"",inboundShipping:"",totalCogs10:"",profit10:"",profitMargin10:"",notes2:"",originalQty:"",currentQty:"",weeksLive:"",replenishmentNeeded:"No",replenishmentQty:"",dateFirstSale:"",dateLive:"",notes3:"",poValue2:"",profitAmt:"",purchasersNotes:"",profitMargin:"",prName:""};

  openModal(`${mHeader(isNew?"New Replenishment Request":"Edit Replenishment Request")}
  <div class="modal-body">

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin-bottom:8px">Approval & Status</div>
    <div class="form-grid">
      ${mField("Status","status",r.status,"select","Pending,Approved,Denied,Kin Denied")}
      ${mField("Approved By","approvedBy",r.approvedBy,"select",(r.platform==="Walmart"||r.platform==="Ebay")?",Kin":",Kin,Daniel,Merylle")}
      ${mField("Status of Order","orderStatus",r.orderStatus,"select",(r.platform==="Walmart"||r.platform==="Ebay")?"Pending,Received PO,Purchased,Min. QTY Required,OOS,Cancelled":"Pending,Received PO,Purchased,Min. QTY Required,OOS,Cancelled,PO Sent to AWL Team")}
      ${mField("Platform","platform",r.platform,"select","Amazon,Walmart,Ebay")}
      ${mField("AWL %","awlPct",r.awlPct,"text","e.g. 10")}
      ${mField("Approved QTY","approvedQty",r.approvedQty,"number")}
      ${mField("Purchase Type","purchaseType",r.purchaseType,"select","Units,Bundles")}
      ${mField("AWL/Clients Account","awlClientAccount",r.awlClientAccount,"select","AWL,Clients")}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Product Info</div>
    <div class="form-grid">
      ${mField("ASIN","asin",r.asin,"text","e.g. B08N5WRWNW")}
      ${mField("2DS/FBA/FBM","fulfillmentType",r.fulfillmentType,"select","FBA,FBM,2DS")}
      <div class="form-full">${clientSelectFiltered("client",r.client,(window._repTab)||"Amazon",false)}</div>
      <div class="form-full">${mField("Product Description","productDesc",r.productDesc,"textarea")}</div>
      ${mField("Amazon Link","amazonLink",r.amazonLink,"text","https://...")}
      ${mField("Supplier Link","supplierLink",r.supplierLink,"text","https://...")}
      ${mField("PR Name","prName",r.prName,"select",",Gerald Napiza,Marjorie Bayani,Rex,Gerald James Maron,Christian Bayani,Aldrin Pizarra,Homer Medina,Winson Costales,Jayson Lee Barretto,Marc David")}
      ${mField("AMZ Pack/Bundle/QTY","amzPackBundleQty",r.amzPackBundleQty,"number")}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Financials</div>
    <div class="form-grid">
      ${mField("Unit Cost ($)","unitCost",r.unitCost,"number")}
      ${mField("Buybox Price ($)","buyboxPrice",r.buyboxPrice,"number")}
      ${mField("FBA Fees ($)","fbaFees",r.fbaFees,"number")}
      ${mField("Referral Fees ($)","referralFees",r.referralFees,"number")}
      ${mField("AWL Prep ($)","awlPrep",r.awlPrep,"number")}
      ${mField("Inbound Shipping ($)","inboundShipping",r.inboundShipping,"number")}
      ${mField("Total Cost ($)","totalCost",r.totalCost,"number")}
      ${mField("AWL Charge 10% ($)","awlCharge10",r.awlCharge10,"number")}
      ${mField("Total COGs 10% ($)","totalCogs10",r.totalCogs10,"number")}
      ${mField("Profit 10% ($)","profit10",r.profit10,"number")}
      ${mField("Profit Margin 10%","profitMargin10",r.profitMargin10,"text","e.g. 27%")}
      ${mField("Profit/Unit ($)","profitUnit",r.profitUnit,"number")}
      ${mField("Profit Margin/Unit","profitMarginUnit",r.profitMarginUnit,"text","e.g. 18%")}
      ${mField("PO Value ($)","poValue",r.poValue,"number")}
      ${mField("$ Profit Amount","profitAmt",r.profitAmt,"number")}
      ${mField("Profit Margin","profitMargin",r.profitMargin,"text","e.g. 27%")}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Stock & Timeline</div>
    <div class="form-grid">
      ${mField("Original QTY","originalQty",r.originalQty,"number")}
      ${mField("Current QTY","currentQty",r.currentQty,"number")}
      ${mField("Weeks Live","weeksLive",r.weeksLive,"number")}
      ${mField("Replenishment Needed?","replenishmentNeeded",r.replenishmentNeeded,"select","No,Yes")}
      ${mField("Replenishment QTY","replenishmentQty",r.replenishmentQty,"number")}
      ${mField("Date of First Sale","dateFirstSale",r.dateFirstSale,"date")}
      ${mField("Date It Went Live","dateLive",r.dateLive,"date")}
      ${mField("Date","date",r.date,"date")}
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Team & Notes</div>
    <div class="form-grid">
      ${mField("Manager","manager",r.manager,"text")}
      ${mField("VA Name","vaName",r.vaName,"text")}
      <div class="form-full">${mField("Notes","notes",r.notes,"textarea")}</div>
      <div class="form-full">${mField("Notes 2","notes2",r.notes2,"textarea")}</div>
      <div class="form-full">${mField("Notes 3","notes3",r.notes3,"textarea")}</div>
      <div class="form-full">${mField("Purchasers Notes","purchasersNotes",r.purchasersNotes,"textarea")}</div>
    </div>

  </div>
  ${mFooter("saveRep('"+r.id+"')",r.id?"confirm2('Delete request?',()=>delRecord('replenishment','"+r.id+"'))":"")}`,true);
}

function saveRep(id){
  const rec={
    id:id||uid("REP"),
    status:mVal("status"),approvedBy:mVal("approvedBy"),
    orderStatus:mVal("orderStatus"),platform:mVal("platform"),
    awlPct:mVal("awlPct"),approvedQty:Number(mVal("approvedQty"))||0,
    purchaseType:mVal("purchaseType"),profitUnit:Number(mVal("profitUnit"))||0,
    client:mVal("client"),profitMarginUnit:mVal("profitMarginUnit"),
    poValue:Number(mVal("poValue"))||0,notes:mVal("notes"),
    date:mVal("date"),manager:mVal("manager"),vaName:mVal("vaName"),
    asin:mVal("asin"),fulfillmentType:mVal("fulfillmentType"),
    productDesc:mVal("productDesc"),amazonLink:mVal("amazonLink"),
    supplierLink:mVal("supplierLink"),awlClientAccount:mVal("awlClientAccount"),
    unitCost:Number(mVal("unitCost"))||0,amzPackBundleQty:Number(mVal("amzPackBundleQty"))||0,
    totalCost:Number(mVal("totalCost"))||0,awlCharge10:Number(mVal("awlCharge10"))||0,
    buyboxPrice:Number(mVal("buyboxPrice"))||0,fbaFees:Number(mVal("fbaFees"))||0,
    referralFees:Number(mVal("referralFees"))||0,awlPrep:Number(mVal("awlPrep"))||0,
    inboundShipping:Number(mVal("inboundShipping"))||0,
    totalCogs10:Number(mVal("totalCogs10"))||0,profit10:Number(mVal("profit10"))||0,
    profitMargin10:mVal("profitMargin10"),notes2:mVal("notes2"),
    originalQty:Number(mVal("originalQty"))||0,currentQty:Number(mVal("currentQty"))||0,
    weeksLive:Number(mVal("weeksLive"))||0,
    replenishmentNeeded:mVal("replenishmentNeeded"),
    replenishmentQty:Number(mVal("replenishmentQty"))||0,
    dateFirstSale:mVal("dateFirstSale"),dateLive:mVal("dateLive"),
    notes3:mVal("notes3"),
    profitAmt:Number(mVal("profitAmt"))||0,purchasersNotes:mVal("purchasersNotes"),
    profitMargin:mVal("profitMargin"),prName:mVal("prName"),
  };
  upsert("replenishment",rec);
  notifyOnSave("replenishment",rec,!id);
  closeModal();
  triggerWebhook("replenishment.updated",rec);
  // Notify assigned CS/Manager for this client
  if(rec.client) pushClientNotif("replenishment",`Replenishment: ${rec.productDesc||rec.asin||"item"}`,`Client: ${rec.client} · Status: ${rec.status}`,"replenishment",rec.client);

  // Auto-transfer to Amazon Purchases ONLY when platform is Amazon + PO Sent to AWL Team + AWL account
  if(rec.orderStatus==="PO Sent to AWL Team" && rec.awlClientAccount==="AWL" && (rec.platform||"Amazon")==="Amazon"){
    // Check if already transferred (avoid duplicates)
    const alreadyTransferred = (DB.amazon||[]).some(a=>a.fromRepId===rec.id);
    if(!alreadyTransferred) transferRepToAmazon(rec);
  }

  pageReplenishment();
}

function transferRepToAmazon(rec){
  const amzRec = {
    id:               uid("AMZ"),
    status:           "Pending",
    asinType:         "Replenishment",
    // Client → Client
    client:           rec.client||"",
    // Approved QTY → Units
    units:            Number(rec.approvedQty)||0,
    // Purchase Type → Purchase Type
    purchaseType:     rec.purchaseType||"Units",
    // 2DS/FBA/FBM → fulfillmentType
    fulfillmentType:  rec.fulfillmentType||"FBA",
    // ASIN
    asin:             rec.asin||"",
    // Amazon Link → amazonLink
    amazonLink:       rec.amazonLink||"",
    // Supplier Link → supplierLink
    supplierLink:     rec.supplierLink||"",
    // AMZ Pack/Bundle/QTY → amazonBundles
    amazonBundles:    rec.amzPackBundleQty?String(rec.amzPackBundleQty):"",
    // Unit Cost
    unitCost:         Number(rec.unitCost)||0,
    // Manager
    manager:          rec.manager||"",
    // AWL/Clients Account
    awlClientAccount: rec.awlClientAccount||"AWL",
    // Tracking source
    fromRepId:        rec.id,
    // Financial fields from replenishment
    totalCost:        Number(rec.totalCost)||0,
    awlCharge10:      Number(rec.awlCharge10)||0,
    buyboxPrice:      Number(rec.buyboxPrice)||0,
    fbaFees:          Number(rec.fbaFees)||0,
    referralFees:     Number(rec.referralFees)||0,
    // Defaults
    supplier:         "",
    awlVendorPayment: 0,
    transferDate:     nowCA().date,
    purchaseDate:     TODAY,
    orderNumber:      "",
    qbInvoice:        "",
    stripeInvoice:    "",
    deliveryDate:     "",
    trackingNumber:   "",
    clientPaymentToAwl: 0,
    invoiceSent:      "No",
    paymentStatus:    "Open",
    profit:           0,
    dateInvoicePaid:  "",
    supplierInvoiceDate:"",
    refund:           0,
    dateRefund:       "",
    itemCode:         "",
    supplierInvoiceNumber:"",
    notes:            rec.productDesc||"",
  };
  upsert("amazon", amzRec);

  // Single notification to Admins, Managers and Purchasers
  const targets = [...new Set(
    USERS.filter(u=>u.role==="Admin"||u.role==="Manager"||APPROVER_NAMES.includes(u.name))
         .map(u=>u.username)
  )];
  DB.notifications.unshift({
    id:uid("NTF"), type:"po",
    title:`📦 Replenishment PO Transferred to Amazon Purchases`,
    body:`${rec.productDesc||rec.asin||"Item"} — Client: ${rec.client||"—"} · ${rec.approvedQty||0} ${rec.purchaseType||"units"} · AWL Account`,
    link:"amazon",
    time:nowCA().ts.slice(0,16),
    read:[], for:targets
  });
  refreshNotifBadge(); buildNav();
  showToast(`✓ Replenishment PO transferred to Amazon Purchases!`, "var(--green)");
}

// Inline field save for Replenishment table (Admin + Kin only)
function saveRepField(id, field, value){
  const r=DB.replenishment.find(x=>x.id===id);
  if(!r) return;
  const numFields=["approvedQty","profitUnit","poValue","unitCost","totalCost","awlCharge10","buyboxPrice","fbaFees","referralFees","awlPrep","inboundShipping","replenishmentQty","profitAmt"];
  r[field] = numFields.includes(field) ? (Number(value)||0) : value;
  // Trigger auto-transfer ONLY for Amazon platform + PO Sent to AWL Team + AWL account
  if(field==="orderStatus" && value==="PO Sent to AWL Team" && r.awlClientAccount==="AWL" && (r.platform||"Amazon")==="Amazon"){
    const alreadyTransferred=(DB.amazon||[]).some(a=>a.fromRepId===r.id);
    if(!alreadyTransferred) transferRepToAmazon(r);
  }
  showToast("Saved","var(--green)");
}

// Inline notes modal for Replenishment
function openRepNoteModal(id, field){
  const r=DB.replenishment.find(x=>x.id===id);
  if(!r) return;
  const labels={notes:"Notes",notes2:"Notes 2",notes3:"Notes 3",purchasersNotes:"Purchasers Notes"};
  openModal(`${mHeader((labels[field]||field)+" — "+( r.productDesc||r.asin||r.id))}
  <div class="modal-body">
    <div class="form-group">
      <label class="form-label">${labels[field]||field}</label>
      <textarea name="rep-note-val" class="form-input" rows="4">${r[field]||""}</textarea>
    </div>
  </div>
  ${mFooter(`saveRepNote('${id}','${field}')`)}`)
}
function saveRepNote(id, field){
  const r=DB.replenishment.find(x=>x.id===id);
  if(!r) return;
  r[field]=mVal("rep-note-val");
  closeModal();
  showToast("Saved","var(--green)");
  pageReplenishment();
}

function exportRepCSV(){
  const cols=["Status","Approved By","Status of Order","Platform","AWL %","Approved QTY","Purchase Type","Profit/Unit","Client","Profit Margin/Unit","PO Value","Notes","Date","Manager","VA Name","ASIN","2DS/FBA/FBM","Product Description","Amazon Link","Supplier Link","AWL/Clients Account","Unit Cost","AMZ Pack/Bundle/QTY","Total Cost","AWL Charge 10%","Buybox Price","FBA Fees","Referral Fees","AWL Prep","Inbound Shipping","Total COGs 10%","Profit 10%","Profit Margin 10%","Notes 2","Original QTY","Current QTY","Weeks Live","Replenishment Needed","Replenishment QTY","Date First Sale","Date Went Live","Notes 3","$ Profit Amount","Purchasers Notes","Profit Margin","PR Name"];
  const csv=[cols.join(","),...DB.replenishment.map(r=>[
    r.status||"",r.approvedBy||"",r.orderStatus||"",r.platform||"",r.awlPct||"",
    r.approvedQty||0,r.purchaseType||"",r.profitUnit||0,r.client||"",r.profitMarginUnit||"",
    r.poValue||0,`"${(r.notes||"").replace(/"/g,'""')}"`,r.date||"",r.manager||"",r.vaName||"",
    r.asin||"",r.fulfillmentType||"",`"${(r.productDesc||"").replace(/"/g,'""')}"`,
    r.amazonLink||"",r.supplierLink||"",r.awlClientAccount||"",r.unitCost||0,
    r.amzPackBundleQty||0,r.totalCost||0,r.awlCharge10||0,r.buyboxPrice||0,
    r.fbaFees||0,r.referralFees||0,r.awlPrep||0,r.inboundShipping||0,
    r.totalCogs10||0,r.profit10||0,r.profitMargin10||"",
    `"${(r.notes2||"").replace(/"/g,'""')}"`,r.originalQty||0,r.currentQty||0,
    r.weeksLive||0,r.replenishmentNeeded||"",r.replenishmentQty||0,
    r.dateFirstSale||"",r.dateLive||"",`"${(r.notes3||"").replace(/"/g,'""')}"`,
    r.profitAmt||0,`"${(r.purchasersNotes||"").replace(/"/g,'""')}"`,
    r.profitMargin||"",r.prName||""
  ].join(","))].join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download="AW_Replenishment_"+TODAY+".csv"; a.click();
  showToast("Replenishment data exported","var(--green)");
}

// ═══════════════════════════════════════════════
//  PAGE: WAREHOUSE RECEIVABLES
// ═══════════════════════════════════════════════

