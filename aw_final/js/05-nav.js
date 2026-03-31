// ── 05-nav.js ──


// ── Utility functions (restored) ──
function render(html){document.getElementById("main").innerHTML=html;}

// ── Helpers ──
function badge(status){const s=BADGE_STYLES[status]||{bg:"rgba(107,118,148,.12)",color:"#6b7694"};return `<span class="badge" style="background:${s.bg};color:${s.color}">${status}</span>`;}
function num(n){return Number(n).toLocaleString();}
function cur(n,sym="₱"){const v=Number(n);if(isNaN(v))return"—";return sym+Math.abs(v).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:2})+(v<0?" (loss)":"");}
function uid(pre){return pre+"-"+String(Date.now()).slice(-5);}
function metric(label,value,sub="",color="var(--accent)"){return `<div class="metric"><div class="metric-label">${label}</div><div class="metric-value" style="color:${color}">${value}</div>${sub?`<div class="metric-sub">${sub}</div>`:""}</div>`;}

function invStatus(i){return i.qty===0?"OUT":i.qty<i.min?"LOW":"OK";}
function calcInvStatus(qty,min=0){return qty===0?"Out of Stock":qty<=min&&min>0?"Low Stock":"Active";}

// ── Modal system ──
function openModal(html,wide=false){
  document.getElementById("modal-root").innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal${wide?" modal-wide":""}">${html}</div></div>`;
}
function closeModal(){document.getElementById("modal-root").innerHTML="";}

function confirm2(msg,onYes){
  document.getElementById("confirm-root").innerHTML=`<div class="confirm-overlay"><div class="confirm-box"><div class="confirm-icon">⚠</div><div class="confirm-msg">${msg}</div><div style="display:flex;gap:10px;justify-content:center"><button class="btn btn-ghost" onclick="closeConfirm()">Cancel</button><button class="btn btn-danger" onclick="confirmYes()">Yes, Delete</button></div></div></div>`;
  window._confirmCb=onYes;
}
function closeConfirm(){document.getElementById("confirm-root").innerHTML="";}
function confirmYes(){if(window._confirmCb)window._confirmCb();closeConfirm();}

function mHeader(title){return `<div class="modal-header"><span class="modal-title">${title}</span><button class="modal-close" onclick="closeModal()">×</button></div>`;}
function mFooter(saveF,delF=""){return `<div class="modal-footer"><div>${delF?`<button class="btn btn-danger btn-sm" onclick="${delF}">Delete</button>`:""}</div><div style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancel</button><button class="btn btn-primary btn-sm" onclick="${saveF}">Save</button></div></div>`;}
function mField(label,name,value,type="text",opts="",req=false){
  if(type==="select"){return `<div class="form-group"><label class="form-label">${label}${req?'<span> *</span>':''}</label><select class="form-input" name="${name}">${opts.split(",").map(o=>`<option value="${o.trim()}"${value===o.trim()?" selected":""}>${o.trim()}</option>`).join("")}</select></div>`;}
  if(type==="textarea"){return `<div class="form-group"><label class="form-label">${label}</label><textarea class="form-input" name="${name}" rows="3">${value||""}</textarea></div>`;}
  return `<div class="form-group"><label class="form-label">${label}${req?'<span class="form-label"> *</span>':''}</label><input class="form-input" type="${type}" name="${name}" value="${(value||"").toString().replace(/"/g,'&quot;')}" placeholder="${opts}"></div>`;
}
function mVal(name){return document.querySelector(`[name="${name}"]`)?.value||"";}

// ── Webhook simulator ──
function triggerWebhook(event,data){
  // In production this would POST to a real webhook URL
  // For now it logs and shows a toast notification
  console.log("[AW Webhook]",event,data);
  const clients=DB.clients.filter(c=>c.webhookEnabled&&c.sheetUrl);
  if(clients.length){
    showToast(`Sync triggered for ${clients.length} connected sheet(s)`,"var(--green)");
  }
}

function showToast(msg,color="var(--accent)"){
  const t=document.createElement("div");
  t.style.cssText=`position:fixed;bottom:1.5rem;right:1.5rem;background:#091329;border:1px solid ${color};border-radius:10px;padding:10px 16px;font-size:12px;font-weight:500;color:${color};z-index:9999;display:flex;align-items:center;gap:8px;box-shadow:0 8px 24px rgba(0,0,0,.4);transition:opacity .3s`;
  t.innerHTML=`<span style="width:6px;height:6px;border-radius:50%;background:${color};flex-shrink:0"></span>${msg}`;
  document.body.appendChild(t);
  setTimeout(()=>{t.style.opacity="0";setTimeout(()=>t.remove(),300);},3000);
}

// ── CS Rep helpers ──
function clientNames(){
  return DB.clients.map(c=>c.name);
}

// Shared client <select> HTML for all modals and pages
// fieldName = name attribute, selected = currently selected value, required = show * label
// ── Searchable Client Dropdown ──
// Generates a custom searchable dropdown. The hidden <input name=fieldName>
// holds the actual value so mVal() and form reads still work.
let _csdCounter = 0;

function clientSelect(fieldName, selected="", required=false, extraStyle=""){
  const id = "csd-"+(++_csdCounter);
  const label = selected || "— Select Client —";
  const isPlaceholder = !selected;
  const addBtn = currentUser?.role==="Admin"
    ? `<div class="csd-add" onclick="event.stopPropagation();csdClose('${id}');openAddClientQuick()">＋ Add New Client</div>`
    : "";

  const opts = DB.clients.map(c=>{
    const platColors={Amazon:"#FF9900",Walmart:"#0071CE",Ebay:"#E53238",AWL:"var(--accent)"};
    const platIcon={Amazon:"🛒",Walmart:"🛍",Ebay:"🏷",AWL:"🏢"};
    const platBadge = c.platform
      ? `<span style="font-size:9px;font-weight:700;color:${platColors[c.platform]||"var(--muted)"};background:${platColors[c.platform]||"var(--muted)"}18;border-radius:3px;padding:1px 5px;margin-left:5px;flex-shrink:0">${platIcon[c.platform]||""}${c.platform}</span>`
      : "";
    return `<div class="csd-opt${c.name===selected?" selected":""}" onclick="csdSelect('${id}','${c.name.replace(/'/g,"&#39;")}','${fieldName}')"
      style="display:flex;align-items:center;justify-content:space-between">
      <span>${c.name}</span>${platBadge}
    </div>`;
  }).join("");

  return `<div class="form-group" style="${extraStyle}">
    <label class="form-label">Client${required?` <span style="color:var(--red)">*</span>`:""}
    </label>
    <input type="hidden" name="${fieldName}" id="${id}-val" value="${selected}">
    <div class="csd-wrap" id="${id}">
      <div class="csd-trigger" id="${id}-trigger" onclick="csdToggle('${id}')">
        <span class="csd-trigger-text${isPlaceholder?" placeholder":""}" id="${id}-label">${label}</span>
        <span class="csd-arrow">▼</span>
      </div>
      <div class="csd-panel" id="${id}-panel">
        <div class="csd-search-wrap">
          <input class="csd-search" id="${id}-search" placeholder="Search client…" oninput="csdFilter('${id}')" autocomplete="off" onkeydown="csdKey(event,'${id}')">
        </div>
        <div class="csd-list" id="${id}-list">
          <div class="csd-opt${!selected?" selected":""}" onclick="csdSelect('${id}','','${fieldName}')">— None —</div>
          ${opts}
        </div>
        <div class="csd-empty" id="${id}-empty" style="display:none">No clients match</div>
        ${addBtn}
      </div>
    </div>
  </div>`;
}

function csdToggle(id){
  const wrap=document.getElementById(id);
  const trigger=document.getElementById(id+"-trigger");
  const panel=document.getElementById(id+"-panel");
  const search=document.getElementById(id+"-search");
  if(!wrap||!trigger||!panel) return;
  const isOpen=panel.classList.contains("open");
  // Close all other open dropdowns
  document.querySelectorAll(".csd-panel.open").forEach(p=>{
    if(p.id===id+"-panel") return;
    p.classList.remove("open");
    const wid=p.id.replace("-panel","");
    document.getElementById(wid+"-trigger")?.classList.remove("open");
  });
  if(isOpen){ csdClose(id); return; }

  // Move panel into body-level portal to escape any overflow:hidden/auto ancestors
  const portal = document.getElementById("csd-portal")||document.body;
  if(panel.parentNode !== portal){
    panel._origParent = panel.parentNode;
    portal.appendChild(panel);
  }

  // Position using viewport coords
  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const spaceAbove = rect.top - 8;
  const useAbove = spaceAbove > spaceBelow && spaceAbove > 150;
  const listH = Math.max(120, Math.min(300, useAbove ? spaceAbove - 52 : spaceBelow - 52));

  panel.style.position = "fixed";
  panel.style.left = rect.left + "px";
  panel.style.width = Math.max(rect.width, 240) + "px";
  panel.style.maxWidth = "500px";
  panel.style.zIndex = "99999";

  if(useAbove){
    panel.style.bottom = (window.innerHeight - rect.top + 4) + "px";
    panel.style.top = "auto";
  } else {
    panel.style.top = (rect.bottom + 4) + "px";
    panel.style.bottom = "auto";
  }

  const listEl = panel.querySelector(".csd-list");
  if(listEl){ listEl.style.maxHeight = listH + "px"; listEl.style.overflowY = "auto"; }

  panel.classList.add("open");
  trigger.classList.add("open");

  // Reposition on scroll (modal scroll changes trigger position)
  function reposition(){
    const r = trigger.getBoundingClientRect();
    panel.style.left = r.left + "px";
    panel.style.width = Math.max(r.width, 240) + "px";
    const sb = window.innerHeight - r.bottom - 8;
    const sa = r.top - 8;
    if(sa > sb && sa > 150){
      panel.style.bottom = (window.innerHeight - r.top + 4) + "px";
      panel.style.top = "auto";
    } else {
      panel.style.top = (r.bottom + 4) + "px";
      panel.style.bottom = "auto";
    }
  }
  panel._reposition = reposition;
  document.addEventListener("scroll", reposition, true);

  setTimeout(()=>{
    search?.focus();
    function outsideHandler(e){
      if(!trigger.contains(e.target) && !panel.contains(e.target)){
        csdClose(id);
        document.removeEventListener("mousedown", outsideHandler);
        document.removeEventListener("touchstart", outsideHandler);
      }
    }
    document.addEventListener("mousedown", outsideHandler);
    document.addEventListener("touchstart", outsideHandler);
    panel._outsideHandler = outsideHandler;
  }, 10);
}

function csdClose(id){
  const panel = document.getElementById(id+"-panel");
  if(!panel) return;
  panel.classList.remove("open");
  document.getElementById(id+"-trigger")?.classList.remove("open");
  // Remove scroll listener
  if(panel._reposition){ document.removeEventListener("scroll", panel._reposition, true); panel._reposition = null; }
  // Remove outside handler
  if(panel._outsideHandler){ document.removeEventListener("mousedown", panel._outsideHandler); document.removeEventListener("touchstart", panel._outsideHandler); panel._outsideHandler = null; }
  // Move panel back to original parent
  if(panel._origParent && panel._origParent !== panel.parentNode){ panel._origParent.appendChild(panel); panel._origParent = null; }
  const search = document.getElementById(id+"-search");
  if(search) search.value = "";
  csdFilter(id);
}




function csdSelect(id, value, fieldName){
  // Auto-fill platform when client is selected in inventory modal
  if(fieldName==="client"){
    var c = (DB.clients||[]).find(function(x){ return x.name===value; });
    if(c && c.platform){
      var platInput = document.querySelector('[name="platform"]');
      if(platInput) platInput.value = c.platform;
    }
  }
  document.getElementById(id+"-val").value = value;
  const labelEl = document.getElementById(id+"-label");
  if(labelEl){
    labelEl.textContent = value || "— Select Client —";
    labelEl.className = "csd-trigger-text"+(value?"":" placeholder");
  }
  // Update selected state
  document.querySelectorAll(`#${id}-list .csd-opt`).forEach(el=>el.classList.remove("selected"));
  const opts = document.querySelectorAll(`#${id}-list .csd-opt`);
  opts.forEach(el=>{ if(el.textContent.trim()===value||(value===""&&el.textContent.trim()==="— None —")) el.classList.add("selected"); });
  csdClose(id);
  // If this is scan-client, refocus the UPC input
  if(fieldName==="scan-client-field") setTimeout(()=>document.getElementById("upc-input")?.focus(),50);
}

function csdFilter(id){
  const q=(document.getElementById(id+"-search")?.value||"").toLowerCase();
  const opts=document.querySelectorAll(`#${id}-list .csd-opt`);
  let vis=0;
  opts.forEach(el=>{
    const txt=el.textContent.toLowerCase();
    const match=!q||txt.includes(q)||(el.textContent==="— None —"&&!q);
    el.classList.toggle("hidden",!match);
    if(match) vis++;
  });
  const empty=document.getElementById(id+"-empty");
  if(empty) empty.style.display=(vis===0)?"block":"none";
}

// Close all panels on scroll or resize
window.addEventListener("scroll",()=>{ document.querySelectorAll(".csd-panel.open").forEach(p=>{ const id=p.id.replace("-panel",""); csdClose(id); }); },true);
window.addEventListener("resize",()=>{ document.querySelectorAll(".csd-panel.open").forEach(p=>{ const id=p.id.replace("-panel",""); csdClose(id); }); });

function csdKey(e, id){
  if(e.key==="Escape"){ csdClose(id); return; }
  if(e.key==="Enter"){
    e.preventDefault();
    const first=document.querySelector(`#${id}-list .csd-opt:not(.hidden)`);
    if(first) first.click();
  }
}

// Handler for new-product receiving client selector
function csdNewSelect(value){
  const hidden=document.getElementById("new-client-val");
  if(hidden) hidden.value=value;
  const label=document.getElementById("csd-new-label");
  if(label){ label.textContent=value||"— Select Client —"; label.className="csd-trigger-text"+(value?"":" placeholder"); }
  document.querySelectorAll("#csd-new-list .csd-opt").forEach(el=>el.classList.remove("selected"));
  document.querySelectorAll("#csd-new-list .csd-opt").forEach(el=>{ if(el.textContent.trim()===(value||"— None —")) el.classList.add("selected"); });
  csdClose("csd-new");
}

// Special handler for scan page client selector
function csdScanSelect(value){
  const hidden=document.getElementById("scan-client");
  if(hidden) hidden.value=value;
  const label=document.getElementById("csd-scan-label");
  if(label){ label.textContent=value||"— Select Client —"; label.className="csd-trigger-text"+(value?"":" placeholder"); }
  document.querySelectorAll("#csd-scan-list .csd-opt").forEach(el=>el.classList.remove("selected"));
  document.querySelectorAll("#csd-scan-list .csd-opt").forEach(el=>{ if(el.textContent.trim()===(value||"— None —")) el.classList.add("selected"); });
  csdClose("csd-scan");
  if(value) setTimeout(()=>document.getElementById("upc-input")?.focus(),60);
}

// Platform-filtered client select — only shows clients matching given platform(s)
function clientSelectFiltered(fieldName, selected="", platform=null, required=false, extraStyle=""){
  // If no platform filter, show all
  if(!platform) return clientSelect(fieldName, selected, required, extraStyle);
  const platforms = Array.isArray(platform) ? platform : [platform];
  // Temporarily filter DB.clients
  const allClients = DB.clients;
  const filtered = allClients.filter(c => !c.platform || platforms.includes(c.platform));
  DB.clients = filtered;
  const result = clientSelect(fieldName, selected, required, extraStyle);
  DB.clients = allClients;
  return result;
}

// Read value from a clientSelect — works with hidden input
function csdVal(fieldName){
  const el=document.querySelector(`[name="${fieldName}"]`);
  return el?.value||"";
}

// Quick-add client modal (Admin only)
function openAddClientQuick(){
  openModal(`${mHeader("Add New Client")}
  <div class="modal-body">
    <div style="font-size:12px;color:var(--muted);margin-bottom:12px;line-height:1.6">The new client will be added to the dropdown immediately and available across all pages.</div>
    <div class="form-grid">
      <div class="form-full"><div class="form-group">
        <label class="form-label">Client Code <span style="color:var(--red)">*</span></label>
        <input class="form-input" name="qc-code" placeholder="e.g. arc263" autocomplete="off">
        <div style="font-size:10px;color:var(--dim);margin-top:3px">Use format: arc###, amz##, aw#</div>
      </div></div>
      <div class="form-full"><div class="form-group">
        <label class="form-label">Contact Name <span style="color:var(--red)">*</span></label>
        <input class="form-input" name="qc-contact" placeholder="e.g. John Smith" autocomplete="off">
      </div></div>
      <div class="form-full"><div class="form-group">
        <label class="form-label">Platform <span style="color:var(--red)">*</span></label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px" id="qc-platform-btns">
          ${["Amazon","Walmart","Ebay","AWL"].map(p=>{
            const colors={Amazon:"#FF9900",Walmart:"#0071CE",Ebay:"#E53238",AWL:"var(--accent)"};
            return `<button type="button" onclick="qcSelectPlatform('${p}')"
              id="qc-plat-${p}"
              style="padding:6px 16px;border-radius:20px;border:2px solid var(--border);
                     background:transparent;color:var(--muted);font-size:12px;font-weight:600;
                     cursor:pointer;font-family:var(--font);transition:all .15s">
              ${p==="Amazon"?"🛒":p==="Walmart"?"🛍":p==="Ebay"?"🏷":"🏢"} ${p}
            </button>`;
          }).join("")}
          <input type="hidden" name="qc-platform" id="qc-platform-val" value="">
        </div>
        <div style="font-size:10px;color:var(--dim);margin-top:4px">Select which platform this client sells on</div>
      </div></div>
    </div>
    <div id="qc-preview" style="margin-top:10px;padding:10px 14px;background:rgba(79,142,247,.06);border:1px solid rgba(79,142,247,.2);border-radius:var(--r);font-size:13px;color:var(--muted)">
      Full name preview: <strong id="qc-name-preview" style="color:var(--text)">—</strong>
    </div>
  </div>
  <div class="modal-footer">
    <div></div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" onclick="saveQuickClient()">Add Client</button>
    </div>
  </div>`);
  setTimeout(()=>{
    const code=document.querySelector('[name="qc-code"]');
    const contact=document.querySelector('[name="qc-contact"]');
    const preview=document.getElementById("qc-name-preview");
    const upd=()=>{ if(preview) preview.textContent=(code?.value&&contact?.value)?code.value+" "+contact.value:"—"; };
    code?.addEventListener("input",upd); contact?.addEventListener("input",upd);
    code?.focus();
  },50);
}

function qcSelectPlatform(p){
  const colors={Amazon:"#FF9900",Walmart:"#0071CE",Ebay:"#E53238",AWL:"#4f8ef7"};
  ["Amazon","Walmart","Ebay","AWL"].forEach(pl=>{
    const btn=document.getElementById("qc-plat-"+pl);
    if(!btn) return;
    if(pl===p){
      btn.style.borderColor=colors[p];
      btn.style.background=colors[p]+"22";
      btn.style.color=colors[p];
    } else {
      btn.style.borderColor="var(--border)";
      btn.style.background="transparent";
      btn.style.color="var(--muted)";
    }
  });
  const val=document.getElementById("qc-platform-val");
  if(val) val.value=p;
}

function saveQuickClient(){
  const code=(document.querySelector('[name="qc-code"]')?.value||"").trim();
  const contact=(document.querySelector('[name="qc-contact"]')?.value||"").trim();
  const platform=(document.getElementById("qc-platform-val")?.value||"").trim();
  if(!code||!contact){showToast("Code and Contact Name are required.","var(--red)");return;}
  if(!platform){showToast("Please select a platform.","var(--red)");return;}
  const fullName=code+" "+contact;
  if(DB.clients.find(c=>c.name===fullName)){showToast("Client already exists.","var(--yellow)");return;}
  const newClient={
    id:code, name:fullName, code, contact,
    platform, status:"Active",
    addedBy:currentUser.username, addedDate:TODAY,
    sheetUrl:"", sheetTab:"", webhookEnabled:false, lastSync:"", syncStatus:"off", notes:""
  };
  DB.clients.push(newClient);
  saveToLocalStorage();
  closeModal();
  showToast(`"${fullName}" (${platform}) added to client list`,"var(--green)");
}

function clientDropdown(selected=""){
  return clientSelect("client", selected);
}
// Returns array of usernames who handle a given client name
function csRepsForClient(clientName){
  // Find all employees (Manager or Customer Service) who have this client assigned
  const targets = [];
  DB.employees.forEach(emp=>{
    if((emp.role==="Manager"||emp.role==="Customer Service")&&
       (emp.assignedClients||[]).some(c=>c===clientName||c.startsWith(clientName.split(" ")[0]))){
      if(emp.username) targets.push(emp.username);
    }
  });
  // Also check csAssignments if it exists
  if(DB.csAssignments){
    DB.csAssignments.filter(a=>a.clientIds.some(cid=>{
      const c=DB.clients.find(x=>x.id===cid);
      return c&&c.name===clientName;
    })).forEach(a=>{ if(a.csUsername) targets.push(a.csUsername); });
  }
  return [...new Set(targets)];
}
// Push a notification targeted to specific usernames + all admins/managers
function pushClientNotif(type,title,body,link,clientName){
  const targets=csRepsForClient(clientName);
  // Also notify all admins and managers
  DB.employees.forEach(emp=>{
    if((emp.role==="Admin"||emp.role==="Manager")&&emp.username)
      targets.push(emp.username);
  });
  USERS.forEach(u=>{if(u.role==="Admin"||u.role==="Manager") targets.push(u.username);});
  const unique=[...new Set(targets)];
  if(!DB.notifications) DB.notifications=[];
  const n={
    id:uid("NTF"),type,title,body,link,
    time:nowCA().ts.slice(0,16),
    read:[],for:unique,client:clientName
  };
  DB.notifications.unshift(n);
  saveToLocalStorage();
  // If current user is affected, show toast + refresh badge
  if(unique.includes(currentUser?.username)||currentUser?.role==="Admin"){
    refreshNotifBadge(); buildNav();
    showToast(title,"var(--accent)");
    maybePlayNotifSound(type);
  }
}
// Returns notifications for current user (targeted or all)
function myNotifications(){
  return DB.notifications.filter(n=>
    n.for==="all"||
    (Array.isArray(n.for)&&n.for.includes(currentUser.username))||
    currentUser.role==="Admin"
  );
}
// Returns unread my-notifications count
function myUnreadCount(scope){
  const notifSearch=(window._notifSearch)||"";
  const allNotifs=myNotifications();
  const all=notifSearch?allNotifs.filter(n=>(n.title||"").toLowerCase().includes(notifSearch.toLowerCase())||(n.body||"").toLowerCase().includes(notifSearch.toLowerCase())):allNotifs;
  if(scope==="all") return all.filter(n=>!isRead(n)).length;
  if(scope==="faq") return all.filter(n=>["faq","answer"].includes(n.type)&&!isRead(n)).length;
  return 0;
}
// My client alert banners: unread notifications for my clients
function myClientAlerts(){
  if(!currentUser) return [];
  return myNotifications().filter(n=>!isRead(n)&&n.client&&["stock","replenishment","po","shipping"].includes(n.type));
}
function invStatusBadge(s){
  const st=INV_STATUS_MAP[s]||{bg:"rgba(107,118,148,.12)",color:"#6b7694"};
  return `<span class="badge" style="background:${st.bg};color:${st.color}">${s||"—"}</span>`;
}

function openResModal(r=null){
  const isNew=!r;
  r=r||{id:"",product:"",category:"Mechanical",stage:"Evaluation",score:"",analyst:"",notes:""};
  openModal(`${mHeader(isNew?"New Research":"Edit Research")}
  <div class="modal-body"><div class="form-grid">
    <div class="form-full">${mField("Product Name","product",r.product,"text","",true)}</div>
    ${mField("Category","category",r.category,"select","Mechanical,Electrical,PPE,Hardware,Chemical,Electronics,Other")}
    ${mField("Score (0–100)","score",r.score,"number")}
    ${mField("Stage","stage",r.stage,"select","Evaluation,Shortlisted,Approved,Rejected")}
    <div class="form-full">${mField("Analyst","analyst",r.analyst,"text","",true)}</div>
    <div class="form-full">${mField("Notes","notes",r.notes,"textarea")}</div>
  </div></div>
  ${mFooter("saveRes('"+r.id+"')",r.id?"confirm2('Delete this research?',()=>delRecord('research','"+r.id+"'))":"")}`);
}

function saveRes(id){
  if(!mVal("product")||!mVal("analyst")){showToast("Product and Analyst required.","var(--red)");return;}
  const rec={id:id||uid("RES"),product:mVal("product"),category:mVal("category"),stage:mVal("stage"),score:Number(mVal("score"))||0,analyst:mVal("analyst"),notes:mVal("notes")};
  upsert("research",rec); closeModal(); pageResearch();
}

// ═══════════════════════════════════════════════
//  PAGE: REPORTS
// ═══════════════════════════════════════════════
function upsert(table,rec){
  const idx=DB[table].findIndex(r=>r.id===rec.id);
  if(idx>=0) DB[table][idx]=rec;
  else DB[table].unshift(rec);
}

function delRecord(table,id){
  DB[table]=DB[table].filter(r=>r.id!==id);
  closeModal();
  const map={employees:pageEmployees,attendance:pageAttendance,inventory:pageInventory,replenishment:pageReplenishment,warehouse:pageWarehouse,tickets:pageTickets,purchases:pagePurchases,amazon:pageAmazon,walmart:pageWalmart,emergency:pageEmergency,pnl:pagePnL,liquidations:pageLiquidations,shipping:pageShipping,research:pageResearch,clients:pageClients};
  if(map[table]) map[table]();
}

// ═══════════════════════════════════════════════
//  PAGE: SKU SCAN STATION
// ═══════════════════════════════════════════════

// Scan log lives in DB — add it if not present
if(!DB.scanLog) DB.scanLog = [
  {id:"SCN-001",upc:"012345678906",product:"Steel Bolt M16x80",mode:"shipout",qtyBefore:4501,qtyAfter:4500,scannedBy:"jreyes",scannedAt:"2026-03-14 08:14:22",status:"Active"},
  {id:"SCN-002",upc:"012345678901",product:"Industrial Valve A4",mode:"shipout",qtyBefore:343,qtyAfter:342,scannedBy:"jreyes",scannedAt:"2026-03-14 08:22:05",status:"Active"},
  {id:"SCN-003",upc:"012345678907",product:"Filter Cartridge F3",mode:"receiving",qtyBefore:20,qtyAfter:23,scannedBy:"rvillaruel",scannedAt:"2026-03-14 09:01:47",status:"Active"},
];

// ── Scanner state ──
let _scanBuffer  = "";
let _scanTimer   = null;
let _scanActive  = false;
let _pendingItem = null;
let _scanMode    = "shipout"; // "shipout" | "receiving"
let _pendingNewUPC = null;    // for new-product receiving flow

// Global keydown — USB scanner fires chars rapidly then Enter
document.addEventListener("keydown", function(e){
  if(!_scanActive) return;
  // Don't intercept if user is typing in a modal input
  if(document.getElementById("modal-root")?.innerHTML) return;
  if(e.key === "Enter"){
    const upc = _scanBuffer.trim();
    _scanBuffer = "";
    clearTimeout(_scanTimer);
    if(upc) handleUPCScan(upc);
  } else if(e.key.length === 1 && !e.ctrlKey && !e.metaKey){
    _scanBuffer += e.key;
    clearTimeout(_scanTimer);
    _scanTimer = setTimeout(()=>{ _scanBuffer = ""; }, 200);
  }
});

// ── Page ──
function nowTS(){
  return nowCA().ts;
}

function playBeep(type){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if(type==="success"){ osc.frequency.value=880; gain.gain.value=0.08; osc.start(); gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.15); setTimeout(()=>ctx.close(),200); }
    else if(type==="found"){ osc.frequency.value=660; gain.gain.value=0.06; osc.start(); gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.1); setTimeout(()=>ctx.close(),150); }
    else if(type==="warning"){ osc.type="square"; osc.frequency.value=440; gain.gain.value=0.05; osc.start(); gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.25); setTimeout(()=>ctx.close(),300); }
    else if(type==="alert"){ osc.type="sawtooth"; osc.frequency.value=200; gain.gain.value=0.07; osc.start(); gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4); setTimeout(()=>ctx.close(),500); }
    else{ osc.type="square"; osc.frequency.value=220; gain.gain.value=0.05; osc.start(); gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.2); setTimeout(()=>ctx.close(),300); }
  } catch(e){ /* audio not supported */ }
}

// ═══════════════════════════════════════════════
//  NOTIFICATION ENGINE
// ═══════════════════════════════════════════════
if(!DB.notifications) DB.notifications = [
  {id:"NTF-001",type:"stock",title:"Safety Helmet Class E is OUT OF STOCK",body:"Current qty: 0. Immediate replenishment required.",link:"inventory",time:"2026-03-14 09:00",read:[],for:"all"},
  {id:"NTF-002",type:"replenishment",title:"New replenishment request: Copper Wire 12AWG",body:"Raised by J. Reyes · Priority: High",link:"replenishment",time:"2026-03-14 08:30",read:[],for:"all"},
  {id:"NTF-003",type:"emergency",title:"Emergency shipment raised: ES-2025-007",body:"Item: Copper Wire 12AWG · Priority: Critical",link:"emergency",time:"2026-03-14 08:15",read:[],for:"all"},
  {id:"NTF-004",type:"faq",title:"New question posted in Q&A",body:"Maria Santos asked: 'What is the reorder lead time for PPE items?'",link:"faq",time:"2026-03-14 08:00",read:[],for:"all"},
  {id:"NTF-005",type:"po",title:"New Purchase Order created: PO-2025-0041",body:"Vendor: Mekong Industrial · ₱485,000 · Requested by L. Mendoza",link:"purchases",time:"2026-03-13 17:45",read:[],for:"all"},
  {id:"NTF-006",type:"stock",title:"Filter Cartridge F3 is LOW on stock",body:"Current qty: 23 / Min: 30. Consider replenishment.",link:"inventory",time:"2026-03-13 14:20",read:[],for:"all"},
];

const NOTIF_ICONS={stock:"📦",replenishment:"🔄",emergency:"🚨",faq:"💬",po:"🛒",answer:"✅",system:"ℹ"};
const NOTIF_COLORS={stock:"var(--yellow)",replenishment:"var(--accent)",emergency:"var(--red)",faq:"var(--purple)",po:"var(--green)",answer:"var(--teal)",system:"var(--muted)"};

function pushNotif(type,title,body,link=""){
  const n={id:uid("NTF"),type,title,body,link,time:nowCA().ts.slice(0,16),read:[],for:"all"};
  DB.notifications.unshift(n);
  refreshNotifBadge();
  buildNav();
  showToast(title,NOTIF_COLORS[type]||"var(--accent)");
  maybePlayNotifSound(type);
}

function markRead(id){
  const n=DB.notifications.find(x=>x.id===id);
  if(n&&!n.read.includes(currentUser.username)) n.read.push(currentUser.username);
}
function markAllRead(){
  myNotifications().forEach(n=>{if(!n.read.includes(currentUser.username))n.read.push(currentUser.username);});
  refreshNotifBadge(); buildNav(); pageNotifications();
}

function isRead(n){return Array.isArray(n.read)&&n.read.includes(currentUser?.username);}

function getUnreadCount(scope){
  if(!currentUser) return 0;
  return myUnreadCount(scope);
}

function refreshNotifBadge(){
  const cnt=getUnreadCount("all");
  const badge=document.getElementById("notif-badge");
  if(!badge) return;
  if(cnt>0){badge.textContent=cnt>9?"9+":cnt;badge.style.display="flex";}
  else badge.style.display="none";
}

// Patch existing save functions to auto-push notifications
// Override specific saves to push notifications (called after save)
function notifyOnSave(table,rec,isNew){
  const client = rec.client||rec.clientName||rec.recipient||"";
  const who = currentUser?.name||"Someone";
  const action = isNew?"added":"updated";

  // Global notifications (no client filter)
  if(isNew){
    if(table==="emergency") pushNotif("emergency",`🚨 Emergency shipment: ${rec.item}`,`Priority: ${rec.priority} · By ${rec.requestor}`,"emergency");
    if(table==="purchases") pushNotif("po",`New PO created: ${rec.id}`,`Vendor: ${rec.vendor} · $${Number(rec.amount).toLocaleString()}`,"purchases");
  }

  // Client-targeted notifications — notify CS + Manager assigned to this client
  if(!client) return;
  const pageMap = {
    inventory:      "inventory",
    firesale:       "firesale",
    archived:       "archived",
    replenishment:  "replenishment",
    warehouse:      "warehouse",
    amazon:         "amazon",
    walmart:        "walmart",
    emergency:      "emergency",
    research:       "research",
    liquidations:   "liquidations",
    shipping:       "shipping",
    pnl:            "pnl",
  };
  const pageLabels = {
    inventory:"Inventory",firesale:"Fire Sale",archived:"Archived",
    replenishment:"Replenishment",warehouse:"Warehouse",amazon:"Amazon Purchases",
    walmart:"Walmart Purchases",emergency:"Emergency",research:"Product Research",
    liquidations:"Liquidations",shipping:"Shipping Labels",pnl:"P&L",
  };
  if(!pageMap[table]) return;
  const label = pageLabels[table]||table;

  // Build a concise summary of what changed
  const detail = [
    rec.asin       ? `ASIN: ${rec.asin}`       : "",
    rec.status     ? `Status: ${rec.status}`   : "",
    rec.orderStatus? `Order: ${rec.orderStatus}`: "",
    rec.amount     ? `Amount: $${Number(rec.amount).toFixed(2)}` : "",
    rec.totalAmount? `Amount: $${Number(rec.totalAmount).toFixed(2)}` : "",
    rec.trackingNo || rec.trackingNumber ? `Tracking: ${rec.trackingNo||rec.trackingNumber}` : "",
  ].filter(Boolean).slice(0,2).join(" · ");

  pushClientNotif(
    "client_update",
    `${label} ${action} — ${client}`,
    `${who} ${action} a record${detail?" · "+detail:""} · ${label}`,
    pageMap[table],
    client
  );
}

// ═══════════════════════════════════════════════
//  PAGE: NOTIFICATIONS
// ═══════════════════════════════════════════════

function buildNav(){
  const nav=document.getElementById("nav-menu");
  nav.innerHTML=NAV.map(g=>{
    const items=g.items.filter(i=>canAccess(i.id));
    if(!items.length) return "";
    return `<div class="sb-section"><div class="sb-section-label">${g.group}</div>${items.map(i=>{
      const unread=i.notif?getUnreadCount(i.notif):0;
      const dot=unread>0?`<span style="margin-left:auto;background:var(--red);color:#fff;font-size:9px;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;padding:0 3px">${unread>9?"9+":unread}</span>`:"";
      return `<button class="sb-item${i.id===currentPage?" active":""}" onclick="navigate('${i.id}')" id="nav-${i.id}">${i.icon}<span>${i.label}</span>${dot}</button>`;
    }).join("")}</div>`;
  }).join("");
  refreshNotifBadge();
}

function navigate(page){
  if(!canAccess(page)){render(`<div style="padding:3rem;text-align:center"><p class="text-red fw6">Access Restricted</p><p class="text-muted" style="margin-top:8px;font-size:13px">You don't have permission to view this page.</p></div>`);return;}
  // Stop chat auto-refresh when leaving chat
  if(page!=="chat"&&typeof _chatPollTimer!=="undefined"){ clearInterval(_chatPollTimer); }
  // Deactivate scanner when leaving scan page
  if(page!=="scan") _scanActive=false;
  currentPage=page;
  document.querySelectorAll(".sb-item").forEach(el=>el.classList.remove("active"));
  const active=document.getElementById("nav-"+page);
  if(active) active.classList.add("active");
  const pages={dashboard:pageDashboard,employees:pageEmployees,attendance:pageAttendance,inventory:pageInventory,firesale:pageFireSale,archived:pageArchived,replenishment:pageReplenishment,warehouse:pageWarehouse,tickets:pageTickets,amazon:pageAmazon,walmart:pageWalmart,emergency:pageEmergency,pnl:pagePnL,liquidations:pageLiquidations,shipping:pageShipping,research:pageResearch,reports:pageReports,clients:pageClients,scan:pageScan,faq:pageFAQ,chat:pageChat,notifications:pageNotifications,calendar:pageCalendar,brands:pageBrands,settings:pageSettings,photoupload:pagePhotoUpload};
  if(pages[page]) pages[page]();
}


