// ── 02-employees.js ──

function accessBadge(val){
  if(!val) return `<span style="color:var(--dim);font-size:12px">—</span>`;
  const given = val==="Access Given";
  return `<span class="badge" style="background:${given?"rgba(79,207,142,.12)":"rgba(247,92,92,.12)"};color:${given?"var(--green)":"var(--red)"};white-space:nowrap;font-size:11px">${given?"✓ Given":"✕ Removed"}</span>`;
}

function pageEmployees(){
  const search = (window._empSearch)||"";
  const empSearch = search;
  const viewMode = (window._empView)||"table";
  const _empView = window._empView||"table";
  const pending = (window._pendingSignups||[]).filter(u=>u.status==="Pending");

  const roleF = (window._empRoleF)||"All";
  const _empRoleF = roleF;
  const empStatusF = (window._empStatusF)||"All";
  const _empStatusF = empStatusF;
  const rows = DB.employees.filter(e=>{
    const mr = roleF==="All"||e.role===roleF;
    const ms = empStatusF==="All"||e.status===empStatusF;
    const mq = !search||(e.name||"").toLowerCase().includes(search.toLowerCase())||(e.dept||"").toLowerCase().includes(search.toLowerCase())||(e.role||"").toLowerCase().includes(search.toLowerCase());
    return mr&&ms&&mq;
  });

  render(`
  <div>
    <div class="page-header">
      <div><div class="page-title">Employee Directory</div><div class="page-sub">${DB.employees.length} personnel records</div></div>
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><input class="search-bar" placeholder="Search name, role, dept..." value="${empSearch}" oninput="window.empSearch=this.value;pageEmployees()" style="flex:1;min-width:200px;max-width:300px"><span style="font-size:10px;font-weight:600;color:var(--dim)">Role:</span><div style="display:flex;gap:5px;flex-wrap:wrap">${['All', 'Admin', 'Manager', 'Purchaser', 'Warehouse', 'Website Developer', 'Account Health', 'Brands', 'Customer Service', 'Product Research', 'Bookkeeper'].map(s=>`<button class="filter-pill${_empRoleF===s?" active":""}" onclick="window._empRoleF='${s}';pageEmployees()">${s}</button>`).join("")}</div><span style="font-size:10px;font-weight:600;color:var(--dim)">Status:</span><div style="display:flex;gap:5px;flex-wrap:wrap">${['All', 'Active', 'On Leave', 'Terminated'].map(s=>`<button class="filter-pill${_empStatusF===s?" active":""}" onclick="window._empStatusF='${s}';pageEmployees()">${s}</button>`).join("")}</div></div></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="exportEmpCSV()">↓ Export</button>
        ${currentUser.role==="Admin"?`<button class="btn btn-primary" onclick="openEmpModal()">+ Add Employee</button>`:""}
      </div>
    </div>

    ${currentUser.role==="Admin" && pending.length > 0 ? `
    <div class="card" style="margin-bottom:1.25rem;border:1px solid rgba(247,201,79,.3);background:rgba(247,201,79,.04)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <span style="font-size:18px">📋</span>
        <div>
          <div class="card-title" style="margin:0;color:var(--yellow)">Pending Account Requests</div>
          <div style="font-size:12px;color:var(--muted)">${pending.length} request${pending.length!==1?"s":""} awaiting approval</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${pending.map(u=>`
        <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--r);padding:12px 14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div style="width:36px;height:36px;border-radius:50%;background:rgba(79,142,247,.15);color:var(--accent);font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${u.avatar||"?"}</div>
          <div style="flex:1;min-width:160px">
            <div style="font-size:13px;font-weight:600">${u.name}</div>
            <div style="font-size:11px;color:var(--muted)">${u.email}</div>
            <div style="font-size:11px;color:var(--dim);margin-top:1px">@${u.username} · ${u.dept} · Requested ${u.requestedAt?.slice(0,16)||""}</div>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <select id="role-${u.id}" class="form-input" style="font-size:12px;padding:5px 8px;width:140px">
              <option value="Manager">Manager</option>
              <option value="Purchaser">Purchaser</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Website Developer">Website Developer</option>
              <option value="Account Health">Account Health</option>
              <option value="Brands">Brands</option>
              <option value="Customer Service">Customer Service</option>
              <option value="Product Research">Product Research</option>
              <option value="Bookkeeper">Bookkeeper</option>
              <option value="Auditor">Auditor</option>
              <option value="Brand CSR">Brand CSR</option>
              <option value="Head">Head</option>
              <option value="Purchasing Manager">Purchasing Manager</option>
              <option value="Product Auditor">Product Auditor</option>
              <option value="Admin">Admin</option>
            </select>
            <button class="btn btn-success btn-sm" onclick="approveSignUp('${u.id}')">✓ Approve</button>
            <button class="btn btn-danger btn-sm" onclick="rejectSignUp('${u.id}')">✕ Reject</button>
          </div>
        </div>`).join("")}
      </div>
    </div>` : ""}

    <div class="metrics metrics-3" style="margin-bottom:1.25rem">
      ${metric("Total",DB.employees.length,"","var(--accent)")}
      ${metric("Active",DB.employees.filter(e=>e.status==="Active").length,"","var(--green)")}
      ${metric("On Leave / Terminated",DB.employees.filter(e=>e.status!=="Active").length,"","var(--yellow)")}
    </div>

    <!-- Filters -->
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input class="search-bar" placeholder="Search name, dept, email, role…" value="${search}"
          oninput="window._empSearch=this.value;pageEmployees()" style="flex:1;min-width:200px;max-width:320px">
        <div style="margin-left:auto;display:flex;gap:3px;background:rgba(255,255,255,.05);border-radius:8px;padding:3px">
          <button class="btn btn-sm" style="${viewMode==="table"?"background:var(--accent);color:#fff":"background:transparent;color:var(--muted)"}" onclick="window._empView='table';pageEmployees()">☰ Table</button>
          <button class="btn btn-sm" style="${viewMode==="cards"?"background:var(--accent);color:#fff":"background:transparent;color:var(--muted)"}" onclick="window._empView='cards';pageEmployees()">⊞ Cards</button>
        </div>
      </div>
    </div>

    ${viewMode==="cards" ? renderEmpCards(rows) : renderEmpTable(rows)}
  </div>`);
}

function renderEmpTable(rows){
  if(!rows.length) return `<div class="card" style="text-align:center;padding:3rem;color:var(--muted)">No employees match your search.</div>`;
  return `
  <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r2);overflow:hidden">
    <div style="overflow-x:auto">
      <table style="width:max-content;min-width:100%">
        <thead><tr style="background:#0d1b3e;position:sticky;top:0;z-index:2">
          <th style="min-width:160px">Name</th>
          <th style="min-width:130px">Role / Position</th>
          <th style="min-width:120px">Department</th>
          <th style="min-width:80px">Status</th>
          <th style="min-width:180px">Email</th>
          <th style="min-width:100px">CMS Login</th>
          <th style="min-width:100px">Date Hired</th>
          <!-- Clients Handled -->
          <th style="min-width:200px;background:rgba(79,207,142,.06)">Clients Handled</th>
          <!-- Access Status Columns -->
          <th style="min-width:120px;background:rgba(79,142,247,.06)">AWL Email</th>
          <th style="min-width:110px;background:rgba(79,142,247,.06)">Slack</th>
          <th style="min-width:120px;background:rgba(79,142,247,.06)">1Password</th>
          <th style="min-width:120px;background:rgba(79,142,247,.06)">AZ Insight</th>
          <th style="min-width:120px;background:rgba(79,142,247,.06)">Zoom Info</th>
          ${currentUser.role==="Admin"?`<th style="min-width:70px"></th>`:""}
        </tr></thead>
        <tbody>
        ${rows.map(emp=>{
          const dc=DEPT_COLORS[emp.dept]||"var(--muted)";
          const ini=emp.name.split(" ").map(w=>w[0]).join("").slice(0,2);
          return `<tr>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:30px;height:30px;border-radius:50%;background:${dc}22;color:${dc};font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ini}</div>
                <span style="font-weight:600;font-size:13px">${emp.name}</span>
              </div>
            </td>
            <td style="font-size:12px;color:var(--muted)">${emp.role||"—"}</td>
            <td><span style="font-size:12px;color:${dc};font-weight:500">${emp.dept||"—"}</span></td>
            <td>${badge(emp.status)}</td>
            <td style="font-size:12px;color:var(--muted)">${emp.email||"—"}</td>
            <td><span style="font-size:12px;color:${emp.username?"var(--accent)":"var(--dim)"};font-family:var(--mono)">${emp.username||"No access"}</span></td>
            <td style="font-size:12px;color:var(--muted)">${emp.hired||"—"}</td>
            <!-- Clients Handled -->
            <td style="background:rgba(79,207,142,.03);max-width:200px">
              ${currentUser.role==="Admin"
                ? (() => {
                    const canAssign = ["Manager","Customer Service"].includes(emp.role);
                    return `<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
                      ${(emp.assignedClients||[]).map(c=>`
                        <span style="background:rgba(79,207,142,.12);color:var(--green);font-size:10px;font-weight:600;border-radius:20px;padding:2px 8px;display:inline-flex;align-items:center;gap:3px;white-space:nowrap">
                          ${c.split(" ").slice(0,2).join(" ")}
                          <span onclick="removeEmpClient('${emp.id}','${c.replace(/'/g,"&#39;")}')" style="cursor:pointer;color:rgba(79,207,142,.6);font-size:11px;margin-left:1px" title="Remove">×</span>
                        </span>`).join("")}
                      ${canAssign
                        ? `<button onclick="openAssignClientModal('${emp.id}')"
                            style="background:rgba(79,142,247,.1);border:1px dashed rgba(79,142,247,.3);border-radius:20px;padding:2px 8px;color:var(--accent);font-size:10px;cursor:pointer;font-family:var(--font);white-space:nowrap">
                            + Assign
                          </button>`
                        : `<span style="font-size:10px;color:var(--dim);font-style:italic">N/A for role</span>`}
                    </div>`;
                  })()
                : `<div style="display:flex;flex-wrap:wrap;gap:3px">
                    ${(emp.assignedClients||[]).length
                      ? (emp.assignedClients).map(c=>`<span style="background:rgba(79,207,142,.1);color:var(--green);font-size:10px;font-weight:600;border-radius:20px;padding:2px 7px">${c.split(" ").slice(0,2).join(" ")}</span>`).join("")
                      : `<span style="color:var(--dim);font-size:12px">—</span>`}
                  </div>`}
            </td>
            ${ACCESS_TOOLS.map(t=>`<td style="background:rgba(79,142,247,.03)">
              ${currentUser.role==="Admin"
                ? `<select onchange="saveEmpAccess('${emp.id}','${t.key}',this.value)"
                    style="background:transparent;border:1px solid var(--border);border-radius:var(--r);padding:3px 6px;color:var(--text);font-size:11px;font-family:var(--font);outline:none;cursor:pointer;width:100%;max-width:120px">
                    <option value=""${!emp[t.key]?" selected":""}>— Not set —</option>
                    <option value="Access Given"${emp[t.key]==="Access Given"?" selected":""}>✓ Access Given</option>
                    <option value="Access Removed"${emp[t.key]==="Access Removed"?" selected":""}>✕ Access Removed</option>
                  </select>`
                : accessBadge(emp[t.key])}
            </td>`).join("")}
            ${currentUser.role==="Admin"?`<td><button class="btn btn-info btn-sm" onclick="openEmpById('${emp.id}')">Edit</button></td>`:""}
          </tr>`;
        }).join("")}
        </tbody>
      </table>
    </div>
    <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${rows.length} employee${rows.length!==1?"s":""} · scroll horizontally to see all columns</div>
  </div>`;
}

function renderEmpCards(rows){
  if(!rows.length) return `<div class="card" style="text-align:center;padding:3rem;color:var(--muted)">No employees match your search.</div>`;
  return `<div class="card"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px">
    ${rows.map(emp=>{
      const dc=DEPT_COLORS[emp.dept]||"var(--muted)";
      const ini=emp.name.split(" ").map(w=>w[0]).join("").slice(0,2);
      return `<div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--r);padding:1rem">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="width:38px;height:38px;border-radius:50%;background:${dc}22;color:${dc};font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ini}</div>
          <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${emp.name}</div><div style="font-size:12px;color:var(--muted)">${emp.role}</div></div>
          ${badge(emp.status)}
        </div>
        <div style="border-top:1px solid var(--border);padding-top:10px;display:flex;flex-direction:column;gap:5px">
          <div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--muted)">Dept</span><span style="font-size:12px;color:${dc}">${emp.dept}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--muted)">Email</span><span style="font-size:11px;overflow:hidden;text-overflow:ellipsis">${emp.email}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--muted)">Login</span><span style="font-size:12px;color:${emp.username?"var(--accent)":"var(--muted)"}">${emp.username||"No access"}</span></div>
          <!-- Clients Handled in card -->
          <div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border)">
            <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Clients Handled (${(emp.assignedClients||[]).length})</div>
            <div style="display:flex;flex-wrap:wrap;gap:3px">
              ${(emp.assignedClients||[]).length
                ? (emp.assignedClients||[]).map(c=>`<span style="background:rgba(79,207,142,.1);color:var(--green);font-size:10px;font-weight:600;border-radius:20px;padding:2px 7px">${c.split(" ").slice(0,2).join(" ")}</span>`).join("")
                : `<span style="color:var(--dim);font-size:11px">None assigned</span>`}
            </div>
          </div>
          <!-- Access badges in card -->
          <div style="border-top:1px solid var(--border);margin-top:4px;padding-top:6px;display:flex;flex-direction:column;gap:3px">
            ${ACCESS_TOOLS.map(t=>`<div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:11px;color:var(--dim)">${t.label}</span>${accessBadge(emp[t.key])}
            </div>`).join("")}
          </div>
          ${currentUser.role==="Admin"?`<button class="btn btn-info btn-sm" style="margin-top:6px;width:100%" onclick="openEmpById('${emp.id}')">Edit Record</button>`:""}
        </div>
      </div>`;
    }).join("")}
  </div></div>`;
}

function saveEmpAccess(empId, field, value){
  const emp = DB.employees.find(e=>e.id===empId);
  if(!emp) return;
  emp[field] = value;
  const toolLabel = ACCESS_TOOLS.find(t=>t.key===field)?.label||field;
  showToast(`${emp.name} — ${toolLabel}: ${value||"cleared"}`, value==="Access Given"?"var(--green)":"var(--red)");
}

function openEmpById(id){
  const emp=DB.employees.find(e=>e.id===id);
  if(emp) openEmpModal(emp);
}

function openAssignClientModal(empId){
  const emp = DB.employees.find(e=>e.id===empId);
  if(!emp) return;
  const assigned = emp.assignedClients||[];
  const allClients = DB.clients.map(c=>c.name).sort();
  const unassigned = allClients.filter(c=>!assigned.includes(c));

  openModal(`${mHeader("Assign Clients — "+emp.name)}
  <div class="modal-body">
    <div style="font-size:12px;color:var(--muted);margin-bottom:12px;line-height:1.6">
      Select clients for <strong style="color:var(--text)">${emp.name}</strong>. They will be notified of any changes to inventory, warehouse, purchases, and other pages for their assigned clients.
    </div>

    <!-- Currently assigned -->
    <div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--accent);margin-bottom:8px">Currently Assigned (${assigned.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;min-height:32px;padding:8px;background:rgba(79,207,142,.04);border:1px solid rgba(79,207,142,.15);border-radius:var(--r)">
        ${assigned.length ? assigned.map(c=>`
          <span style="background:rgba(79,207,142,.15);color:var(--green);font-size:11px;font-weight:600;border-radius:20px;padding:3px 10px;display:inline-flex;align-items:center;gap:5px">
            ${c}
            <span onclick="quickRemoveClient('${empId}','${c.replace(/'/g,"&#39;")}')" style="cursor:pointer;font-size:13px;line-height:1;opacity:.7" title="Remove">×</span>
          </span>`).join("")
          : `<span style="color:var(--dim);font-size:12px;padding:4px">No clients assigned yet</span>`}
      </div>
    </div>

    <!-- Search & add -->
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--accent);margin-bottom:8px">Add Clients</div>
    <input id="client-assign-search" class="search-bar" placeholder="Search clients to add…"
      oninput="filterAssignList('${empId}',this.value)" style="width:100%;margin-bottom:8px">
    <div id="assign-client-list" style="max-height:260px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r)">
      ${unassigned.map(c=>`
        <div class="assign-client-opt" data-name="${c}"
          style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .1s"
          onmouseover="this.style.background='rgba(255,255,255,.05)'" onmouseout="this.style.background=''"
          onclick="quickAddClient('${empId}','${c.replace(/'/g,"&#39;")}')">
          <span style="font-size:13px">${c}</span>
          <span style="font-size:11px;color:var(--accent);font-weight:600">+ Add</span>
        </div>`).join("")}
      ${unassigned.length===0?`<div style="text-align:center;padding:1.5rem;color:var(--muted);font-size:13px">All clients assigned!</div>`:""}
    </div>
  </div>
  <div class="modal-footer" style="justify-content:flex-end">
    <button class="btn btn-ghost btn-sm" onclick="closeModal()">Done</button>
  </div>`);
}

function filterAssignList(empId, query){
  const opts = document.querySelectorAll(".assign-client-opt");
  const q = query.toLowerCase();
  opts.forEach(el=>{
    const name = el.dataset.name||"";
    el.style.display = name.toLowerCase().includes(q) ? "" : "none";
  });
}

function quickAddClient(empId, clientName){
  const emp = DB.employees.find(e=>e.id===empId);
  if(!emp) return;
  if(!emp.assignedClients) emp.assignedClients=[];
  if(!emp.assignedClients.includes(clientName)){
    emp.assignedClients.push(clientName);
    showToast(`${clientName} assigned to ${emp.name}`, "var(--green)");
  }
  openAssignClientModal(empId);
}

function quickRemoveClient(empId, clientName){
  const emp = DB.employees.find(e=>e.id===empId);
  if(!emp) return;
  emp.assignedClients = (emp.assignedClients||[]).filter(c=>c!==clientName);
  showToast(`${clientName} removed from ${emp.name}`, "var(--muted)");
  openAssignClientModal(empId);
}

function removeEmpClient(empId, clientName){
  quickRemoveClient(empId, clientName);
  pageEmployees();
}

function approveSignUp(reqId){
  const req = (window._pendingSignups||[]).find(u=>u.id===reqId);
  if(!req) return;
  const roleEl = document.getElementById("role-"+reqId);
  const role   = roleEl?.value || "Warehouse";

  // Add to USERS so they can log in
  const newUser = {
    id: uid("USR"),
    username: req.username,
    password: req.password,
    name: req.name,
    email: req.email,
    role,
    dept: req.dept,
    avatar: req.avatar||req.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),
  };
  USERS.push(newUser);

  // Also add to employees directory
  DB.employees.push({
    id: uid("EMP"),
    name: req.name,
    role,
    dept: req.dept,
    email: req.email,
    username: req.username,
    status: "Active",
    phone: "",
    startDate: TODAY,
    notes: "Account created via sign-up request",
  });

  // Mark as approved
  req.status = "Approved";

  showToast(`✓ Account approved for ${req.name} (@${req.username})`, "var(--green)");
  pageEmployees();
}

function rejectSignUp(reqId){
  const req = (window._pendingSignups||[]).find(u=>u.id===reqId);
  if(!req) return;
  req.status = "Rejected";
  showToast(`Account request rejected for ${req.name}`, "var(--red)");
  pageEmployees();
}

function openEmpModal(emp=null){
  const isNew=!emp;
  emp=emp||{id:"",name:"",dept:"Operations",role:"",status:"Active",hired:TODAY,email:"",username:"",awlEmail:"",slack:"",onePassword:"",azInsight:"",zoomInfo:"",assignedClients:[]};
  openModal(`${mHeader(isNew?"Add Employee":"Edit Employee")}
  <div class="modal-body">
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin-bottom:8px">Employee Info</div>
    <div class="form-grid">
      <div class="form-full">${mField("Full Name","name",emp.name,"text","e.g. Maria Santos",true)}</div>
      ${mField("Email","email",emp.email,"email","",true)}
      ${mField("Role / Position","role",emp.role,"text","e.g. Analyst",true)}
      ${mField("Department","dept",emp.dept,"select","Admin,Manager,Purchaser,Warehouse,Website Developer,Account Health,Brands,Customer Service,Product Research,Bookkeeper")}
      ${mField("Status","status",emp.status,"select","Active,On Leave,Terminated")}
      ${mField("Date Hired","hired",emp.hired,"date")}
      <div class="form-full">${mField("CMS System Username","username",emp.username,"text","Leave blank if no CMS access")}</div>
    </div>

    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Tool Access Status</div>
    <div class="form-grid">
      ${ACCESS_TOOLS.map(t=>mField(t.label,t.key,emp[t.key],"select",",Access Given,Access Removed")).join("")}
    </div>

    ${emp.id?`<div style="margin-top:8px;font-size:11px;color:var(--dim)">ID: <span class="mono">${emp.id}</span></div>`:""}

    ${emp.id && ["Manager","Customer Service"].includes(emp.role) ? `
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:14px 0 8px">Clients Handled (${(emp.assignedClients||[]).length})</div>
    <div style="padding:10px 12px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--r);margin-bottom:6px">
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">
        ${(emp.assignedClients||[]).length
          ? (emp.assignedClients||[]).map(c=>`<span style="background:rgba(79,207,142,.12);color:var(--green);font-size:11px;font-weight:600;border-radius:20px;padding:2px 9px">${c}</span>`).join("")
          : `<span style="color:var(--dim);font-size:12px">No clients assigned yet</span>`}
      </div>
      <button class="btn btn-ghost btn-sm" onclick="closeModal();openAssignClientModal('${emp.id}')">⊕ Manage Client Assignments</button>
    </div>` : emp.id ? `<div style="margin-top:10px;padding:8px 12px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--r);font-size:12px;color:var(--dim)">💡 Client assignments only apply to <strong style="color:var(--muted)">Manager</strong> and <strong style="color:var(--muted)">Customer Service</strong> roles.</div>` : `<div style="font-size:11px;color:var(--muted);margin-top:8px">💡 Save the employee first, then assign clients from the employee table.</div>`}
  </div>
  ${mFooter("saveEmp('"+emp.id+"')",emp.id?"confirm2('Remove this employee?',()=>delRecord('employees','"+emp.id+"'))":"")}`);
}

function saveEmp(id){
  const n=mVal("name"),e=mVal("email"),r=mVal("role");
  if(!n||!e||!r){showToast("Name, Email and Role required.","var(--red)");return;}
  // Preserve existing assignedClients if editing
  const existing = DB.employees.find(emp=>emp.id===id);
  const rec={
    id:id||uid("EMP"),name:n,dept:mVal("dept"),role:r,
    status:mVal("status"),hired:mVal("hired"),email:e,username:mVal("username"),
    awlEmail:mVal("awlEmail"),slack:mVal("slack"),
    onePassword:mVal("onePassword"),azInsight:mVal("azInsight"),zoomInfo:mVal("zoomInfo"),
    assignedClients: existing?.assignedClients||[],
  };
  upsert("employees",rec); closeModal(); triggerWebhook("employee.updated",rec); pageEmployees();
}

function exportEmpCSV(){
  const cols=["Name","Role","Department","Status","Email","CMS Login","Date Hired","AWL Email","Slack","1Password","AZ Insight","Zoom Info"];
  const csv=[cols.join(","),...DB.employees.map(e=>[
    e.name||"",e.role||"",e.dept||"",e.status||"",e.email||"",e.username||"",e.hired||"",
    e.awlEmail||"",e.slack||"",e.onePassword||"",e.azInsight||"",e.zoomInfo||""
  ].join(","))].join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download="AW_Employees_"+TODAY+".csv"; a.click();
  showToast("Employee data exported","var(--green)");
}

// ═══════════════════════════════════════════════
//  PAGE: ATTENDANCE
// ═══════════════════════════════════════════════

