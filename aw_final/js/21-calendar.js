// ── 21-calendar.js ──

function pageCalendar(){
  if(!DB.meetings) DB.meetings=[];
  const calView=(window._calView)||"month";
  const now=nowCA();
  const calYear=Number(window._calYear||now.year);
  const calMonth=Number(window._calMonth||now.month);
  const isAdmin=currentUser?.role==="Admin";

  // My meetings = meetings where I'm in attendees or createdBy
  const myMeetings=DB.meetings.filter(m=>
    (m.attendees||[]).includes(currentUser?.username)||
    m.createdBy===currentUser?.username||
    isAdmin
  );

  // Month grid helpers
  const firstDay=new Date(calYear,calMonth-1,1);
  const lastDay=new Date(calYear,calMonth,0);
  const startDow=firstDay.getDay(); // 0=Sun
  const totalDays=lastDay.getDate();
  const monthName=firstDay.toLocaleDateString("en-US",{month:"long",year:"numeric"});

  // upcoming meetings sorted
  const upcoming=[...myMeetings]
    .filter(m=>m.date>=now.date)
    .sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time))
    .slice(0,8);

  // meetings this month
  const monthStr=`${String(calYear).padStart(4,"0")}-${String(calMonth).padStart(2,"0")}`;
  const thisMonthMeetings=myMeetings.filter(m=>m.date.startsWith(monthStr));

  const typeColors={
    "Team":"var(--accent)","Review":"var(--purple)","1-on-1":"var(--green)",
    "Training":"var(--teal)","Client":"var(--orange)","Other":"var(--muted)"
  };

  // Prev/next month
  const prevMonth=calMonth===1?12:calMonth-1;
  const prevYear=calMonth===1?calYear-1:calYear;
  const nextMonth=calMonth===12?1:calMonth+1;
  const nextYear=calMonth===12?calYear+1:calYear;

  render(`
  <div>
    <div class="page-header">
      <div><div class="page-title">📅 Calendar</div>
      <div class="page-sub">${myMeetings.length} meeting${myMeetings.length!==1?"s":""} scheduled</div></div>
      ${isAdmin?`<button class="btn btn-primary" onclick="openMeetingModal()">+ Schedule Meeting</button>`:""}
    </div>

    <div style="display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start">

      <!-- ── LEFT: Month Calendar ── -->
      <div class="card" style="padding:0;overflow:hidden">
        <!-- Month nav -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid var(--border)">
          <button class="btn btn-ghost btn-sm" onclick="window._calMonth=${prevMonth};window._calYear=${prevYear};pageCalendar()">‹ Prev</button>
          <div style="font-size:16px;font-weight:700">${monthName}</div>
          <button class="btn btn-ghost btn-sm" onclick="window._calMonth=${nextMonth};window._calYear=${nextYear};pageCalendar()">Next ›</button>
        </div>

        <!-- Day headers -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid var(--border)">
          ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>
            `<div style="text-align:center;padding:8px 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">${d}</div>`
          ).join("")}
        </div>

        <!-- Calendar grid -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr)">
          ${Array.from({length:startDow},(_,i)=>`<div style="min-height:80px;border-right:1px solid var(--border);border-bottom:1px solid var(--border)"></div>`).join("")}
          ${Array.from({length:totalDays},(_,i)=>{
            const d=i+1;
            const dateStr=`${String(calYear).padStart(4,"0")}-${String(calMonth).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const dayMeetings=myMeetings.filter(m=>m.date===dateStr);
            const isToday=dateStr===now.date;
            const dow=(startDow+i)%7;
            const isWeekend=dow===0||dow===6;
            return `<div style="min-height:80px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);padding:4px;${isWeekend?"background:rgba(255,255,255,.015)":""}">
              <div style="display:flex;justify-content:flex-end">
                <span style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:12px;font-weight:${isToday?"700":"400"};color:${isToday?"#fff":"var(--muted)"};background:${isToday?"var(--accent)":"transparent"}">${d}</span>
              </div>
              ${dayMeetings.map(m=>{
                const col=typeColors[m.type]||"var(--muted)";
                return `<div onclick="viewMeetingDetail('${m.id}')" title="${m.title}" style="background:${col}22;border-left:2px solid ${col};border-radius:3px;padding:2px 4px;font-size:10px;font-weight:600;color:${col};cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px">${m.time} ${m.title}</div>`;
              }).join("")}
            </div>`;
          }).join("")}
        </div>
      </div>

      <!-- ── RIGHT: Upcoming Meetings ── -->
      <div style="display:flex;flex-direction:column;gap:12px">

        <div class="card">
          <div class="card-title">Upcoming Meetings</div>
          ${upcoming.length===0?`<div style="text-align:center;color:var(--muted);padding:1.5rem;font-size:13px">No upcoming meetings</div>`:""}
          <div style="display:flex;flex-direction:column;gap:8px">
            ${upcoming.map(m=>{
              const col=typeColors[m.type]||"var(--muted)";
              const isToday=m.date===now.date;
              const dateLabel=isToday?"Today":new Date(m.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
              return `<div onclick="viewMeetingDetail('${m.id}')" style="padding:10px 12px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-left:3px solid ${col};border-radius:var(--r);cursor:pointer;transition:background .15s" onmouseover="this.style.background='rgba(255,255,255,.07)'" onmouseout="this.style.background='rgba(255,255,255,.04)'">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px">
                  <div style="font-size:13px;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.title}</div>
                  <span style="font-size:10px;background:${col}22;color:${col};border-radius:20px;padding:2px 7px;font-weight:600;margin-left:6px;white-space:nowrap">${m.type||"Meeting"}</span>
                </div>
                <div style="font-size:11px;color:var(--muted)">${isToday?`<span style="color:var(--accent);font-weight:700">Today</span>`:dateLabel} · ${m.time}${m.endTime?" – "+m.endTime:""}</div>
                ${m.zoomLink?`<div style="font-size:11px;color:var(--teal);margin-top:2px">🎥 Zoom meeting</div>`:""}
                ${m.attendees?.length?`<div style="font-size:11px;color:var(--dim);margin-top:2px">👥 ${m.attendees.length} attendee${m.attendees.length!==1?"s":""}</div>`:""}
              </div>`;
            }).join("")}
          </div>
        </div>

        <!-- This month summary -->
        <div class="card">
          <div class="card-title">${monthName}</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${["Team","Review","1-on-1","Training","Client","Other"].map(t=>{
              const cnt=thisMonthMeetings.filter(m=>m.type===t).length;
              if(!cnt) return "";
              const col=typeColors[t]||"var(--muted)";
              return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)">
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="width:8px;height:8px;border-radius:50%;background:${col}"></div>
                  <span style="font-size:13px">${t}</span>
                </div>
                <span style="font-size:13px;font-weight:700;color:${col}">${cnt}</span>
              </div>`;
            }).join("")}
            ${thisMonthMeetings.length===0?`<div style="text-align:center;color:var(--muted);padding:1rem;font-size:13px">No meetings this month</div>`:""}
          </div>
        </div>

      </div>
    </div>
  </div>`);
}

function viewMeetingDetail(id){
  if(!DB.meetings) return;
  const m=DB.meetings.find(x=>x.id===id);
  if(!m) return;
  const isAdmin=currentUser?.role==="Admin";
  const typeColors={Team:"var(--accent)",Review:"var(--purple)","1-on-1":"var(--green)",Training:"var(--teal)",Client:"var(--orange)",Other:"var(--muted)"};
  const col=typeColors[m.type]||"var(--muted)";
  const attendeeNames=(m.attendees||[]).map(u=>{
    const emp=DB.employees.find(e=>e.username===u)||USERS.find(e=>e.username===u);
    return emp?emp.name:u;
  }).join(", ");
  openModal(`${mHeader("Meeting Details")}
  <div class="modal-body" style="gap:10px">
    <div style="padding:12px;background:${col}14;border:1px solid ${col}33;border-radius:var(--r);text-align:center">
      <div style="font-size:18px;font-weight:700;margin-bottom:4px">${m.title}</div>
      <span style="font-size:11px;background:${col}22;color:${col};border-radius:20px;padding:3px 10px;font-weight:700">${m.type||"Meeting"}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--muted);margin-bottom:3px">Date</div><div style="font-size:13px;font-weight:600">${m.date}</div></div>
      <div><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--muted);margin-bottom:3px">Time</div><div style="font-size:13px;font-weight:600">${m.time}${m.endTime?" – "+m.endTime:""}</div></div>
    </div>
    <div><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--muted);margin-bottom:3px">Attendees</div><div style="font-size:13px">${attendeeNames||"—"}</div></div>
    ${m.description?`<div><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--muted);margin-bottom:3px">Description</div><div style="font-size:13px;color:var(--muted);line-height:1.6">${m.description}</div></div>`:""}
    ${m.zoomLink?`<div><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--muted);margin-bottom:3px">Zoom Link</div><a href="${m.zoomLink}" target="_blank" style="font-size:13px;color:var(--accent);text-decoration:underline;word-break:break-all">🎥 Join Meeting</a></div>`:""}
    ${m.recurrence&&m.recurrence!=="none"?`<div><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--muted);margin-bottom:3px">Recurring</div><div style="font-size:13px">🔁 ${{"daily":"Daily","weekly":"Weekly","biweekly":"Every 2 Weeks","monthly":"Monthly"}[m.recurrence]||m.recurrence}${m.recurrenceEnd?" until "+m.recurrenceEnd:""}</div></div>`:""}
    ${m.recurrenceParent?`<div style="font-size:11px;color:var(--dim)">🔁 Part of a recurring series</div>`:""}  </div>
  <div class="modal-footer" style="justify-content:space-between">
    <div>${isAdmin?`<button class="btn btn-danger btn-sm" onclick="confirm2('Delete this meeting?',()=>{delRecord('meetings','${m.id}');closeModal();pageCalendar()})">Delete</button>`:"&nbsp;"}</div>
    <div style="display:flex;gap:8px">
      ${isAdmin?`<button class="btn btn-ghost" onclick="closeModal();openMeetingModal(DB.meetings.find(x=>x.id==='${m.id}'))">Edit</button>`:""}
      <button class="btn btn-primary" onclick="closeModal()">Close</button>
    </div>
  </div>`);
}

function openMeetingModal(m=null){
  if(!DB.meetings) DB.meetings=[];
  const isNew=!m;
  m=m||{id:"",title:"",date:nowCA().date,time:"09:00",endTime:"10:00",type:"Team",attendees:[],description:"",createdBy:currentUser?.username||""};

  // Build attendees checklist from employees + USERS
  const allUsers=[...new Set([
    ...DB.employees.filter(e=>e.username).map(e=>({username:e.username,name:e.name,role:e.role})),
    ...USERS.map(u=>({username:u.username,name:u.name,role:u.role}))
  ].reduce((acc,u)=>{ if(!acc.find(x=>x.username===u.username)) acc.push(u); return acc; },[]))];

  const attendeeChecks=allUsers.map(u=>`
    <label class="att-row" data-name="${(u.name+' '+u.role).toLowerCase()}" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:var(--r);cursor:pointer;transition:background .1s" onmouseover="this.style.background='rgba(255,255,255,.05)'" onmouseout="this.style.background='transparent'">
      <input type="checkbox" name="att_${u.username}" value="${u.username}" ${(m.attendees||[]).includes(u.username)?"checked":""}
        style="accent-color:var(--accent);width:15px;height:15px;cursor:pointer">
      <div>
        <div style="font-size:13px;font-weight:500">${u.name}</div>
        <div style="font-size:10px;color:var(--muted)">${u.role}</div>
      </div>
    </label>`).join("");

  openModal(`${mHeader(isNew?"Schedule Meeting":"Edit Meeting")}
  <div class="modal-body"><div class="form-grid">
    <div class="form-full">${mField("Meeting Title","title",m.title,"text","e.g. Weekly Sync",true)}</div>
    ${mField("Date","date",m.date,"date","",true)}
    ${mField("Start Time","time",m.time,"time","",true)}
    ${mField("End Time","endTime",m.endTime,"time")}
    <div class="form-full">${mField("Type","type",m.type,"select","Team,Review,1-on-1,Training,Client,Other")}</div>
    <div class="form-full">${mField("Description","description",m.description,"textarea")}</div>
    <div class="form-full">${mField("Zoom Meeting Link","zoomLink",m.zoomLink||"","text","https://zoom.us/j/...")}</div>
    <div class="form-full">
      <label class="form-label">Recurring</label>
      <select name="recurrence" class="form-input" onchange="
        document.getElementById('rec-end-wrap').style.display=this.value!=='none'?'block':'none'
      ">
        <option value="none" ${(m.recurrence||'none')==='none'?'selected':''}>None — one-time</option>
        <option value="daily"  ${m.recurrence==='daily' ?'selected':''}>Daily</option>
        <option value="weekly" ${m.recurrence==='weekly'?'selected':''}>Weekly</option>
        <option value="biweekly" ${m.recurrence==='biweekly'?'selected':''}>Every 2 Weeks</option>
        <option value="monthly" ${m.recurrence==='monthly'?'selected':''}>Monthly</option>
      </select>
    </div>
    <div id="rec-end-wrap" class="form-full" style="display:${m.recurrence&&m.recurrence!=='none'?'block':'none'}">
      ${mField("Repeat Until","recurrenceEnd",m.recurrenceEnd||"","date","End date for recurrence")}
    </div>
    <div class="form-full">
      <label class="form-label">Attendees <span style="color:var(--red)">*</span></label>
      <input id="att-search" class="form-input" placeholder="Search attendees…"
        oninput="document.querySelectorAll('.att-row').forEach(el=>{
          const q=this.value.toLowerCase();
          el.style.display=el.dataset.name.includes(q)?'':'none';
        })" style="margin-bottom:6px">
      <div style="background:#080c14;border:1px solid var(--border2);border-radius:var(--r);max-height:220px;overflow-y:auto;padding:4px">
        ${attendeeChecks}
      </div>
    </div>
  </div></div>
  ${mFooter("saveMeeting('"+m.id+"')",m.id?"confirm2('Delete this meeting?',()=>delRecord('meetings','"+m.id+"'))":"")}`);
}

function saveMeeting(id){
  if(!mVal("title")) return showToast("Title is required.","var(--red)");
  if(!mVal("date"))  return showToast("Date is required.","var(--red)");
  if(!mVal("time"))  return showToast("Start time is required.","var(--red)");

  // Collect checked attendees
  const attendees=[...document.querySelectorAll('[name^="att_"]:checked')].map(el=>el.value);
  if(!attendees.length) return showToast("Please select at least one attendee.","var(--red)");

  const rec={
    id:id||uid("MTG"),
    title:mVal("title"),
    date:mVal("date"),
    time:mVal("time"),
    endTime:mVal("endTime"),
    type:mVal("type")||"Team",
    attendees,
    description:mVal("description"),
    zoomLink:mVal("zoomLink"),
    recurrence:mVal("recurrence")||"none",
    recurrenceEnd:mVal("recurrenceEnd")||"",
    createdBy:currentUser?.username||"admin",
  };

  if(!DB.meetings) DB.meetings=[];

  // If editing and recurrence changed, remove old auto-generated instances
  if(id) {
    DB.meetings = DB.meetings.filter(m=>m.id===id||m.recurrenceParent!==id);
  }

  upsert("meetings",rec);

  // Generate recurring instances
  if(rec.recurrence&&rec.recurrence!=="none"&&rec.recurrenceEnd){
    const stepDays={daily:1,weekly:7,biweekly:14,monthly:0}[rec.recurrence]||7;
    let cur=new Date(rec.date+"T12:00:00");
    const end=new Date(rec.recurrenceEnd+"T12:00:00");
    let count=0;
    while(count<52){ // max 52 instances safety cap
      // Advance date
      if(rec.recurrence==="monthly"){
        cur=new Date(cur.getFullYear(), cur.getMonth()+1, cur.getDate(),12);
      } else {
        cur=new Date(cur.getTime()+stepDays*86400000);
      }
      if(cur>end) break;
      const dateStr=cur.toISOString().slice(0,10);
      const instId=uid("MTG");
      DB.meetings.push({...rec, id:instId, date:dateStr, recurrenceParent:rec.id, recurrence:"none", recurrenceEnd:""});
      count++;
    }
    showToast(`Scheduled ${count+1} occurrences`,"var(--green)");
  }

  // Notify attendees
  if(!DB.notifications) DB.notifications=[];
  const isNew=!id;
  attendees.forEach(uname=>{
    if(uname===currentUser?.username) return; // don't notify yourself
    DB.notifications.unshift({
      id:uid("NTF"),type:"meeting",
      title:(isNew?"📅 New meeting: ":"📅 Meeting updated: ")+rec.title,
      body:`${rec.date} at ${rec.time}${rec.endTime?" – "+rec.endTime:""} · ${rec.type}${rec.zoomLink?" · 🎥 Zoom":""}`,
      link:"calendar",time:nowCA().ts.slice(0,16),
      read:[],for:[uname]
    });
  });

  refreshNotifBadge();
  saveToLocalStorage();
  closeModal();
  showToast(isNew?"Meeting scheduled!":"Meeting updated!","var(--green)");
  pageCalendar();
}

// ═══════════════════════════════════════════════
//  PAGE: GMAIL
// ═══════════════════════════════════════════════
const GM_SCOPE="https://www.googleapis.com/auth/gmail.readonly";
let _gmToken=null;
let _gmThreads=[];


