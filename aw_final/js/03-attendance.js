// ── 03-attendance.js ──

function pageAttendance(){
  const attNameF = (window._attNameF)||"";
  const _attNameF = attNameF;
  const attStatusF = (window._attStatusF)||"All";
  const _attStatusF = attStatusF;
  const activeTab = document.querySelector("#att-tab-active")?.value || "log";
  const fd = document.querySelector("#att-date")?.value || TODAY;
  const selMonth = document.querySelector("#att-month")?.value || TODAY.slice(0,7);

  // ── Shared data ──
  const allRecs = DB.attendance;

  if(activeTab === "monthly"){
    renderAttMonthly(selMonth);
    return;
  }

  // ── Daily Log tab ──
  const rows = allRecs.filter(a => !fd || a.date === fd);
  const present = rows.filter(r=>r.status==="Present").length;
  const late    = rows.filter(r=>r.status==="Late").length;
  const absent  = rows.filter(r=>["Absent","On Leave"].includes(r.status)).length;

  render(`
  <div>
    <div class="page-header">
      <div><div class="page-title">Attendance Log</div><div class="page-sub">Daily employee time tracking</div></div>
      <button class="btn btn-primary" onclick="openAttModal()">+ Log Attendance</button>
    </div>

    
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><input class="search-bar" placeholder="Search employee name..." value="${attNameF}" oninput="window.attNameF=this.value;pageAttendance()" style="flex:1;min-width:200px;max-width:300px"><span style="font-size:10px;font-weight:600;color:var(--dim)">Status:</span><div style="display:flex;gap:5px;flex-wrap:wrap">${['All', 'Present', 'Late', 'Absent', 'Half Day', 'On Leave'].map(s=>`<button class="filter-pill${_attStatusF===s?" active":""}" onclick="window._attStatusF='${s}';pageAttendance()">${s}</button>`).join("")}</div></div></div>
    <!-- Tabs -->
    <div style="display:flex;gap:4px;margin-bottom:1.25rem;background:rgba(255,255,255,.04);border-radius:var(--r2);padding:4px;width:fit-content">
      <input type="hidden" id="att-tab-active" value="log">
      <button onclick="switchAttTab('log')" style="padding:7px 20px;border-radius:var(--r);border:none;font-family:var(--font);font-size:13px;font-weight:600;cursor:pointer;background:var(--accent);color:#fff">📋 Daily Log</button>
      <button onclick="switchAttTab('monthly')" style="padding:7px 20px;border-radius:var(--r);border:none;font-family:var(--font);font-size:13px;font-weight:500;cursor:pointer;background:transparent;color:var(--muted)">📊 Monthly Summary</button>
    </div>

    <div class="metrics metrics-4">
      ${metric("Present",present,"","var(--green)")}
      ${metric("Late",late,"","var(--yellow)")}
      ${metric("Absent / Leave",absent,"","var(--red)")}
      ${metric("Total",rows.length,"","var(--muted)")}
    </div>

    <div class="card">
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap">
        <span style="font-size:13px;color:var(--muted)">Date:</span>
        <input type="date" id="att-date" value="${fd}" onchange="pageAttendance()" class="form-input" style="width:160px">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('att-date').value='';pageAttendance()">All Dates</button>
        <button class="btn btn-ghost btn-sm" onclick="exportAttCSV()">↓ Export</button>
      </div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Employee</th><th>Date</th><th>Time In</th><th>Status</th><th>Notes</th><th></th></tr></thead>
        <tbody>${rows.map(a=>`<tr>
          <td class="fw6">${a.name}</td>
          <td class="text-muted">${a.date}</td>
          <td style="color:${a.timeIn?"var(--green)":"var(--muted)"}">${a.timeIn||"—"}</td>
          <td>${badge(a.status)}</td>
          <td style="font-size:12px;color:var(--muted)">${a.notes||"—"}</td>
          <td><button class="btn btn-info btn-sm" onclick='openAttModal(${JSON.stringify(a).replace(/'/g,"&#39;")})'>Edit</button></td>
        </tr>`).join("")}
        ${rows.length===0?`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:2rem">No records for this date</td></tr>`:""}
        </tbody>
      </table></div>
    </div>
  </div>`);
}

function switchAttTab(tab){
  document.getElementById("att-tab-active").value = tab;
  pageAttendance();
}

function renderAttMonthly(selMonth){
  // Get all unique employee names from attendance + employees
  const allNames = [...new Set([
    ...DB.attendance.map(a=>a.name),
    ...DB.employees.map(e=>e.name)
  ])].sort();

  // Parse month
  const [yr, mo] = selMonth.split("-").map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const mid = 15; // cutoff for first half

  // Count records per employee
  const summary = allNames.map(name => {
    const recs = DB.attendance.filter(a => a.name===name && a.date.startsWith(selMonth));
    const present1 = recs.filter(a=>a.date.slice(8,10)<=String(mid).padStart(2,"0") && (a.status==="Present"||a.status==="Late")).length;
    const present2 = recs.filter(a=>a.date.slice(8,10)>String(mid).padStart(2,"0")  && (a.status==="Present"||a.status==="Late")).length;
    const absent   = recs.filter(a=>["Absent","On Leave"].includes(a.status)).length;
    const total    = present1 + present2;
    const working1 = mid;                    // 1st–15th = 15 working days
    const working2 = daysInMonth - mid;      // 16th–end
    return { name, present1, present2, total, absent, working1, working2,
             pct1: Math.round((present1/working1)*100),
             pct2: Math.round((present2/working2)*100),
             pct:  Math.round((total/(working1+working2))*100) };
  });

  const monthLabel = new Date(yr, mo-1, 1).toLocaleDateString("en-US",{month:"long",year:"numeric"});

  render(`
  <div>
    <div class="page-header">
      <div><div class="page-title">Attendance Log</div><div class="page-sub">Monthly check-in summary</div></div>
      <button class="btn btn-primary" onclick="openAttModal()">+ Log Attendance</button>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:4px;margin-bottom:1.25rem;background:rgba(255,255,255,.04);border-radius:var(--r2);padding:4px;width:fit-content">
      <input type="hidden" id="att-tab-active" value="monthly">
      <button onclick="switchAttTab('log')" style="padding:7px 20px;border-radius:var(--r);border:none;font-family:var(--font);font-size:13px;font-weight:500;cursor:pointer;background:transparent;color:var(--muted)">📋 Daily Log</button>
      <button onclick="switchAttTab('monthly')" style="padding:7px 20px;border-radius:var(--r);border:none;font-family:var(--font);font-size:13px;font-weight:600;cursor:pointer;background:var(--accent);color:#fff">📊 Monthly Summary</button>
    </div>

    <!-- Month picker + legend -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:1.25rem;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:13px;color:var(--muted)">Month:</span>
        <input type="month" id="att-month" value="${selMonth}" onchange="renderAttMonthly(this.value)" class="form-input" style="width:170px">
      </div>
      <div style="font-size:13px;font-weight:600;color:var(--text)">${monthLabel}</div>
      <button class="btn btn-ghost btn-sm" onclick="exportAttMonthlySummary('${selMonth}')">↓ Export</button>
      <div style="margin-left:auto;display:flex;gap:12px;font-size:11px;color:var(--muted);flex-wrap:wrap">
        <span>🟦 1st–15th &nbsp;(${mid} days)</span>
        <span>🟩 16th–${daysInMonth}th &nbsp;(${daysInMonth-mid} days)</span>
      </div>
    </div>

    <!-- Summary metrics -->
    <div class="metrics metrics-4" style="margin-bottom:1.25rem">
      ${metric("Employees",allNames.length,"","var(--accent)")}
      ${metric("Avg Check-ins",(summary.length?Math.round(summary.reduce((s,r)=>s+r.total,0)/summary.length):0)+" / "+daysInMonth+" days","","var(--green)")}
      ${metric("Perfect Attendance",summary.filter(r=>r.total===daysInMonth).length+" employees","","var(--teal)")}
      ${metric("Below 50%",summary.filter(r=>r.pct<50).length+" employees","","var(--red)")}
    </div>

    <!-- Main table -->
    <div class="card">
      <div style="font-size:12px;color:var(--muted);margin-bottom:12px">
        Showing check-ins (Present + Late) for <strong style="color:var(--text)">${monthLabel}</strong>.
        Working days: <strong>1st–15th = ${mid}</strong>, <strong>16th–${daysInMonth}th = ${daysInMonth-mid}</strong>.
      </div>
      <div class="tbl-wrap"><table>
        <thead><tr>
          <th>Employee</th>
          <th style="text-align:center;color:#60a5fa">1st – 15th<br><span style="font-weight:400;font-size:10px">out of ${mid}</span></th>
          <th style="text-align:center;color:#34d399">16th – ${daysInMonth}th<br><span style="font-weight:400;font-size:10px">out of ${daysInMonth-mid}</span></th>
          <th style="text-align:center">Total<br><span style="font-weight:400;font-size:10px">out of ${daysInMonth}</span></th>
          <th style="text-align:center">Absent / Leave</th>
          <th style="text-align:center">Attendance %</th>
        </tr></thead>
        <tbody>
        ${summary.map(r=>{
          const pctColor = r.pct>=90?"var(--green)":r.pct>=70?"var(--yellow)":"var(--red)";
          const bar1w  = r.working1>0?Math.round((r.present1/r.working1)*100):0;
          const bar2w  = r.working2>0?Math.round((r.present2/r.working2)*100):0;
          return `<tr>
            <td class="fw6">${r.name}</td>
            <td style="text-align:center">
              <div style="font-size:15px;font-weight:700;color:${r.present1===r.working1?"var(--green)":r.present1===0?"var(--red)":"var(--text)"}">
                ${r.present1}<span style="font-size:11px;color:var(--muted);font-weight:400"> / ${r.working1}</span>
              </div>
              <div class="progress-bar" style="margin-top:4px"><div class="progress-fill" style="width:${bar1w}%;background:#60a5fa"></div></div>
            </td>
            <td style="text-align:center">
              <div style="font-size:15px;font-weight:700;color:${r.present2===r.working2?"var(--green)":r.present2===0?"var(--red)":"var(--text)"}">
                ${r.present2}<span style="font-size:11px;color:var(--muted);font-weight:400"> / ${r.working2}</span>
              </div>
              <div class="progress-bar" style="margin-top:4px"><div class="progress-fill" style="width:${bar2w}%;background:#34d399"></div></div>
            </td>
            <td style="text-align:center">
              <div style="font-size:16px;font-weight:800;color:${pctColor}">${r.total}</div>
              <div style="font-size:10px;color:var(--muted)">of ${r.working1+r.working2}</div>
            </td>
            <td style="text-align:center">
              <span style="font-size:14px;font-weight:600;color:${r.absent>0?"var(--red)":"var(--muted)"}">${r.absent}</span>
            </td>
            <td style="text-align:center">
              <div style="font-size:14px;font-weight:700;color:${pctColor}">${r.pct}%</div>
              <div class="progress-bar" style="margin-top:4px"><div class="progress-fill" style="width:${r.pct}%;background:${pctColor}"></div></div>
            </td>
          </tr>`;
        }).join("")}
        ${summary.length===0?`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:2rem">No attendance records for this month</td></tr>`:""}
        </tbody>
      </table></div>
    </div>
  </div>`);
}

function exportAttCSV(){
  const fd = document.querySelector("#att-date")?.value||"";
  const rows = DB.attendance.filter(a=>!fd||a.date===fd);
  const csv = ["Employee,Date,Time In,Status,Notes",
    ...rows.map(a=>`${a.name},${a.date},${a.timeIn||""},${a.status},"${(a.notes||"").replace(/"/g,'""')}"`)
  ].join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download="AW_Attendance_"+(fd||"All")+".csv"; a.click();
  showToast("Attendance exported","var(--green)");
}

function exportAttMonthlySummary(selMonth){
  const [yr,mo] = selMonth.split("-").map(Number);
  const daysInMonth = new Date(yr,mo,0).getDate();
  const allNames = [...new Set([...DB.attendance.map(a=>a.name),...DB.employees.map(e=>e.name)])].sort();
  const rows = allNames.map(name=>{
    const recs = DB.attendance.filter(a=>a.name===name&&a.date.startsWith(selMonth));
    const p1 = recs.filter(a=>a.date.slice(8,10)<="15"&&(a.status==="Present"||a.status==="Late")).length;
    const p2 = recs.filter(a=>a.date.slice(8,10)>"15" &&(a.status==="Present"||a.status==="Late")).length;
    const abs= recs.filter(a=>["Absent","On Leave"].includes(a.status)).length;
    return `${name},${p1}/15,${p2}/${daysInMonth-15},${p1+p2}/${daysInMonth},${abs},${Math.round(((p1+p2)/daysInMonth)*100)}%`;
  });
  const csv=["Employee,1st-15th,16th-End,Total,Absent/Leave,Attendance%",...rows].join("\n");
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download="AW_AttendanceSummary_"+selMonth+".csv"; a.click();
  showToast("Monthly summary exported","var(--green)");
}

function openAttModal(att=null){
  const isNew=!att;
  att=att||{id:"",name:"",date:TODAY,timeIn:"",status:"Present",notes:""};
  openModal(`${mHeader(isNew?"Log Attendance":"Edit Attendance")}
  <div class="modal-body"><div class="form-grid">
    <div class="form-full">${mField("Employee Name","name",att.name,"text","e.g. Maria Santos",true)}</div>
    ${mField("Date","date",att.date,"date","",true)}
    ${mField("Status","status",att.status,"select","Present,Late,Absent,On Leave,Half Day")}
    ${mField("Time In","timeIn",att.timeIn,"time")}
    <div class="form-full">${mField("Notes","notes",att.notes,"textarea")}</div>
  </div></div>
  ${mFooter("saveAtt('"+att.id+"')",att.id?"confirm2('Delete attendance record?',()=>delRecord('attendance','"+att.id+"'))":"")}`);
}

function saveAtt(id){
  const n=mVal("name"),d=mVal("date");
  if(!n||!d){showToast("Name and date required.","var(--red)");return;}
  const rec={id:id||uid("ATT"),name:n,date:d,timeIn:mVal("timeIn"),status:mVal("status"),notes:mVal("notes")};
  upsert("attendance",rec); closeModal(); pageAttendance();
}

// ═══════════════════════════════════════════════
//  PAGE: INVENTORY
// ═══════════════════════════════════════════════
// Column definitions for inventory table
const INV_COLS=[
  {key:"listingStatus",label:"Listing Status", w:140, type:"listing"},
  {key:"invStatus",  label:"Stock Status",    w:110, type:"status"},
  {key:"rack",       label:"Rack",            w:70,  type:"rack"},
  {key:"station",    label:"Station",         w:80,  type:"station"},
  {key:"asin",       label:"ASIN",            w:120, type:"mono"},
  {key:"upc",        label:"UPC",             w:120, type:"mono"},
  {key:"name",       label:"Product",         w:180, type:"bold"},
  {key:"client",     label:"Client",          w:130},
  {key:"platform",    label:"Platform",        w:100, type:"platform"},
  {key:"storeName",  label:"Store Name",      w:130},
  {key:"expirationDate",label:"Exp. Date",    w:100, type:"date"},
  {key:"shippingType",label:"Shipping",       w:80,  type:"tag"},
  {key:"initialStock",label:"Initial Stock",  w:110, type:"num"},
  {key:"qty",        label:"Remaining Stock", w:120, type:"stock"},
  {key:"damagedQty", label:"Damaged Items",   w:110, type:"damaged"},
  {key:"weightDimension",label:"Weight & Dim.",w:140},
  {key:"whNotes",    label:"WH Notes",        w:160, type:"notes"},
  {key:"unitCost",   label:"Unit Cost",       w:100, type:"cur"},
  {key:"discountedAmount",label:"Discount",   w:90,  type:"cur"},
  {key:"profit",     label:"Profit",          w:90,  type:"profit"},
  {key:"manager",    label:"Manager",         w:120},
  {key:"originalInvoice",label:"Orig. Invoice",w:130,type:"mono"},
  {key:"totalShipped",label:"Total Shipped",  w:110, type:"num"},
  {key:"response",   label:"Response",        w:150, type:"notes"},
  {key:"actionTaken",label:"Action Taken",    w:150, type:"notes"},
  {key:"totalPurchased",label:"Total Purchased",w:120,type:"num"},
  {key:"confirmedQty",label:"Confirmed Qty",  w:110, type:"num"},
  {key:"lastScannedBy",label:"Scanned By",    w:130, type:"scannedby"},
  {key:"lastScannedAt",label:"Scan Timestamp",w:150, type:"scannedtime"},
];

// Listing status options & colors
const LISTING_STATUSES = [
  "Deactivated","OOS","Waiting for response","Shipped",
  "Trash","Liquidated","Ebay Live","Amazon Live","Walmart Live","ASIN Live","Fire Sale"
];

const LISTING_STATUS_MAP = {
  "Deactivated":          {bg:"rgba(107,118,148,.15)", color:"#6b7694"},
  "OOS":                  {bg:"rgba(247,92,92,.15)",   color:"#f75c5c"},
  "Waiting for response": {bg:"rgba(247,201,79,.15)",  color:"#f7c94f"},
  "Shipped":              {bg:"rgba(79,142,247,.15)",  color:"#4f8ef7"},
  "Trash":                {bg:"rgba(100,100,100,.15)", color:"#888"},
  "Liquidated":           {bg:"rgba(251,146,60,.15)",  color:"#fb923c"},
  "Ebay Live":            {bg:"rgba(79,207,142,.18)",  color:"#4fcf8e"},
  "Amazon Live":          {bg:"rgba(79,207,142,.18)",  color:"#4fcf8e"},
  "Walmart Live":         {bg:"rgba(79,207,142,.18)",  color:"#4fcf8e"},
  "ASIN Live":            {bg:"rgba(79,207,142,.18)",  color:"#4fcf8e"},
  "Fire Sale":            {bg:"rgba(247,92,92,.2)",    color:"#ff6b6b"},
};

// Returns true if this listing status should highlight the whole row green
function showAttendancePopup(){
  // Check if already logged attendance today
  const existing = DB.attendance.find(a =>
    a.date === TODAY &&
    (a.name === currentUser.name || a.username === currentUser.username)
  );

  const ca    = nowCA();
  const now   = ca.asDate();
  const timeNow = ca.time;
  const isLate  = Number(ca.hour) > 8 || (Number(ca.hour)===8 && Number(ca.minute)>15);

  const container = document.createElement("div");
  container.id = "att-popup-overlay";
  container.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9990;
    display:flex;align-items:center;justify-content:center;padding:1rem;
    animation:fadeIn .25s ease`;
  container.innerHTML = `
    <style>
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes popIn{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}
      #att-popup{
        background:#091329;border:1px solid var(--border2);border-radius:20px;
        width:100%;max-width:420px;overflow:hidden;
        animation:popIn .3s cubic-bezier(.34,1.56,.64,1);
        box-shadow:0 24px 64px rgba(0,0,0,.6);
      }
    </style>

    <div id="att-popup">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,rgba(79,142,247,.2),rgba(79,207,142,.15));
                  padding:1.75rem 1.75rem 1.25rem;border-bottom:1px solid var(--border);
                  display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:22px;font-weight:800;color:var(--text);letter-spacing:-.02em">
            Good ${Number(ca.hour)<12?"Morning":Number(ca.hour)<17?"Afternoon":"Evening"}, ${currentUser.name.split(" ")[0]}! 👋
          </div>
          <div style="font-size:13px;color:var(--muted);margin-top:4px">
            ${new Date(ca.date+"T12:00:00").toLocaleDateString("en-US",{timeZone:"America/Los_Angeles",weekday:"long",month:"long",day:"numeric",year:"numeric"})}
          </div>
        </div>
        <button onclick="closeAttPopup()"
          style="background:rgba(255,255,255,.08);border:none;border-radius:8px;width:30px;height:30px;
                 color:var(--muted);font-size:18px;cursor:pointer;display:flex;align-items:center;
                 justify-content:center;flex-shrink:0;margin-left:12px;line-height:1"
          title="Close — you can log attendance later">×</button>
      </div>

      <!-- Body -->
      <div style="padding:1.5rem 1.75rem">
        ${existing ? `
          <!-- Already logged -->
          <div style="text-align:center;padding:.5rem 0">
            <div style="font-size:40px;margin-bottom:10px">✅</div>
            <div style="font-size:16px;font-weight:700;color:var(--green)">You're checked in!</div>
            <div style="font-size:13px;color:var(--muted);margin-top:6px">
              Logged at <strong style="color:var(--text)">${existing.timeIn||"—"}</strong>
              &nbsp;·&nbsp; Status: ${badge(existing.status)}
            </div>
            <button onclick="closeAttPopup()"
              class="btn btn-primary" style="margin-top:20px;width:100%;font-size:14px;padding:11px">
              Continue to Dashboard
            </button>
          </div>
        ` : `
          <!-- Not yet logged -->
          <div style="text-align:center;margin-bottom:20px">
            <div style="font-size:48px;margin-bottom:8px">🕐</div>
            <div style="font-size:16px;font-weight:700;color:var(--text)">Mark your attendance</div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px">
              Current time: <strong style="color:var(--accent)">${timeNow}</strong>
              ${isLate?`<span style="margin-left:6px;font-size:11px;color:var(--yellow);background:rgba(247,201,79,.12);border-radius:10px;padding:1px 7px">Late</span>`:""}
            </div>
          </div>

          <!-- Status buttons -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
            <button onclick="submitAttPopup('Present','${timeNow}')"
              style="padding:14px 10px;border:2px solid rgba(79,207,142,.3);border-radius:12px;
                     background:rgba(79,207,142,.08);color:var(--green);font-weight:700;font-size:13px;
                     cursor:pointer;font-family:var(--font);transition:all .15s;display:flex;
                     flex-direction:column;align-items:center;gap:6px"
              onmouseover="this.style.background='rgba(79,207,142,.18)'" onmouseout="this.style.background='rgba(79,207,142,.08)'">
              <span style="font-size:24px">✅</span>Present
            </button>
            <button onclick="submitAttPopup('Late','${timeNow}')"
              style="padding:14px 10px;border:2px solid rgba(247,201,79,.3);border-radius:12px;
                     background:rgba(247,201,79,.08);color:var(--yellow);font-weight:700;font-size:13px;
                     cursor:pointer;font-family:var(--font);transition:all .15s;display:flex;
                     flex-direction:column;align-items:center;gap:6px"
              onmouseover="this.style.background='rgba(247,201,79,.18)'" onmouseout="this.style.background='rgba(247,201,79,.08)'">
              <span style="font-size:24px">⏰</span>Late
            </button>
            <button onclick="submitAttPopup('On Leave','')"
              style="padding:14px 10px;border:2px solid rgba(79,142,247,.3);border-radius:12px;
                     background:rgba(79,142,247,.08);color:var(--accent);font-weight:700;font-size:13px;
                     cursor:pointer;font-family:var(--font);transition:all .15s;display:flex;
                     flex-direction:column;align-items:center;gap:6px"
              onmouseover="this.style.background='rgba(79,142,247,.18)'" onmouseout="this.style.background='rgba(79,142,247,.08)'">
              <span style="font-size:24px">🏖️</span>On Leave
            </button>
            <button onclick="submitAttPopup('Absent','')"
              style="padding:14px 10px;border:2px solid rgba(247,92,92,.3);border-radius:12px;
                     background:rgba(247,92,92,.08);color:var(--red);font-weight:700;font-size:13px;
                     cursor:pointer;font-family:var(--font);transition:all .15s;display:flex;
                     flex-direction:column;align-items:center;gap:6px"
              onmouseover="this.style.background='rgba(247,92,92,.18)'" onmouseout="this.style.background='rgba(247,92,92,.08)'">
              <span style="font-size:24px">❌</span>Absent
            </button>
          </div>

          <!-- Optional notes -->
          <div class="form-group" style="margin-bottom:14px">
            <label class="form-label">Notes <span style="font-size:10px;color:var(--dim);font-weight:400;text-transform:none;letter-spacing:0">(optional)</span></label>
            <input id="att-popup-notes" class="form-input" placeholder="e.g. WFH, doctor's appointment…">
          </div>

          <!-- Skip link -->
          <button onclick="closeAttPopup()"
            style="width:100%;background:none;border:1px solid var(--border);border-radius:var(--r);
                   padding:9px;color:var(--muted);font-size:12px;cursor:pointer;font-family:var(--font)">
            Skip for now — I'll log it later
          </button>
        `}
      </div>
    </div>`;

  document.body.appendChild(container);
  // Close on backdrop click
  container.addEventListener("click", e=>{ if(e.target===container) closeAttPopup(); });
}

function submitAttPopup(status, timeIn){
  const notes = document.getElementById("att-popup-notes")?.value||"";
  const rec = {
    id: uid("ATT"),
    name: currentUser.name,
    username: currentUser.username,
    date: TODAY,
    timeIn: timeIn||"",
    status,
    notes,
  };
  // Remove any existing entry for today by this user first
  DB.attendance = DB.attendance.filter(a=>
    !(a.date===TODAY && (a.name===currentUser.name||a.username===currentUser.username))
  );
  DB.attendance.unshift(rec);
  closeAttPopup();

  const statusColor = status==="Present"?"var(--green)":status==="Late"?"var(--yellow)":status==="On Leave"?"var(--accent)":"var(--red)";
  showToast(`Attendance marked: ${status}${timeIn?" at "+timeIn:""}`, statusColor);

  // Refresh attendance page if open
  if(currentPage==="attendance") pageAttendance();
}

function closeAttPopup(){
  const el = document.getElementById("att-popup-overlay");
  if(el){
    el.style.opacity="0";
    el.style.transition="opacity .2s";
    setTimeout(()=>el.remove(), 200);
  }
}

// ═══════════════════════════════════════════════
//  EXPIRY NOTIFICATIONS
// ═══════════════════════════════════════════════

