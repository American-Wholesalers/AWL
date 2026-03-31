// ── 18-notifications.js ──

function pageNotifications(){
  const filter=(window._notifFilter)||"all";
  const _notifFilter = window._notifFilter||"all";
  const notifSearch=(window._notifSearch)||"";

  const all=myNotifications();
  const shown=filter==="unread"?all.filter(n=>!isRead(n)):all;
  const unreadCnt=all.filter(n=>!isRead(n)).length;

  render(`
  <div>
    <div class="page-header">
      <div><div class="page-title">Notifications</div><div class="page-sub">${unreadCnt} unread · ${all.length} total</div></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="checkExpiryNotifications(true);pageNotifications()" title="Scan all items for expiry dates within 30 days">⏰ Check Expiry</button>
        ${unreadCnt>0?`<button class="btn btn-ghost btn-sm" onclick="markAllRead()">Mark all read</button>`:""}
      </div>
    </div>

    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:1rem"><input class="search-bar" placeholder="Search notifications..." value="${notifSearch}" oninput="window._notifSearch=this.value;pageNotifications()" style="flex:1;min-width:180px;max-width:280px">
      <div style="display:flex;gap:6px">${["all","unread"].map(f=>`<button class="filter-pill${filter===f?" active":""}" onclick="window._notifFilter='${f}';pageNotifications()">${f==="all"?"All ("+all.length+")":"Unread ("+unreadCnt+")"}</button>`).join("")}
    </div></div>

    <div style="display:flex;flex-direction:column;gap:8px">
    ${shown.length===0?`<div class="card" style="text-align:center;padding:3rem;color:var(--muted)"><div style="font-size:32px;margin-bottom:10px">🔔</div><div>All caught up! No ${filter==="unread"?"unread ":""}notifications.</div></div>`:""}
    ${shown.map(n=>{
      const read=isRead(n);
      const c=NOTIF_COLORS[n.type]||"var(--muted)";
      const isFireSale = n.type==="firesale";
      const isExpiry   = n.type==="expiry";

      const cardBg =
        isFireSale && !read ? "rgba(247,92,92,.08)" :
        isExpiry && !read   ? "rgba(251,146,60,.07)" :
        read ? "rgba(255,255,255,.02)" : "rgba(79,142,247,.06)";

      const cardBorder =
        isFireSale && !read ? "rgba(247,92,92,.35)" :
        isExpiry && !read   ? "rgba(251,146,60,.3)" :
        read ? "var(--border)" : "rgba(79,142,247,.2)";

      const titleColor =
        isFireSale && !read ? "var(--red)" :
        isExpiry && !read   ? "var(--orange)" :
        read ? "var(--muted)" : "var(--text)";

      const dotColor =
        isFireSale ? "var(--red)" :
        isExpiry   ? "var(--orange)" : "var(--accent)";

      return `<div onclick="markRead('${n.id}');${n.link?`navigate('${n.link}')`:""}" style="display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:${cardBg};border:1px solid ${cardBorder};border-radius:var(--r);cursor:${n.link?"pointer":"default"};transition:all .15s" onmouseover="this.style.background='rgba(255,255,255,.05)'" onmouseout="this.style.background='${cardBg}'">
        <div style="width:36px;height:36px;border-radius:8px;background:${c}22;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${NOTIF_ICONS[n.type]||"ℹ"}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
            <div style="font-size:13px;font-weight:${read?"500":"700"};color:${titleColor}">${n.title}</div>
            <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
              ${!read?`<span style="width:7px;height:7px;border-radius:50%;background:${dotColor};flex-shrink:0"></span>`:""}
              <span style="font-size:11px;color:var(--dim);white-space:nowrap">${n.time}</span>
            </div>
          </div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;line-height:1.5">${n.body}</div>
          ${isFireSale && n.link ? `
          <div style="margin-top:8px">
            <button onclick="event.stopPropagation();markRead('${n.id}');navigate('${n.link}')"
              style="background:var(--red);color:#fff;border:none;border-radius:var(--r);padding:5px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);display:inline-flex;align-items:center;gap:6px">
              🔥 Click here to view Fire Sale items →
            </button>
          </div>`
          : isExpiry && n.link ? `
          <div style="margin-top:8px">
            <button onclick="event.stopPropagation();markRead('${n.id}');navigate('${n.link}')"
              style="background:var(--orange);color:#fff;border:none;border-radius:var(--r);padding:5px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font);display:inline-flex;align-items:center;gap:6px">
              ⏰ Click here for more info →
            </button>
          </div>`
          : n.link ? `<div style="font-size:11px;color:var(--accent);margin-top:5px">→ Click to go to ${n.link}</div>` : ""}
        </div>
      </div>`;
    }).join("")}
    </div>
  </div>`);
  // Mark visible as read after 2s
  setTimeout(()=>{ shown.forEach(n=>markRead(n.id)); refreshNotifBadge(); buildNav(); },2000);
}

// ═══════════════════════════════════════════════
//  PAGE: TEAM CHAT
// ═══════════════════════════════════════════════
if(!DB.chat) DB.chat = [
  {id:"MSG-001",author:"Maria Santos",username:"admin",avatar:"MS",text:"Good morning team! 👋 Don't forget to update your attendance.",time:"2026-03-17 08:05",mentions:[],reactions:{}},
  {id:"MSG-002",author:"Jose Reyes",username:"jreyes",avatar:"JR",text:"@admin Got it! Also, the new shipment from AsiaTech arrived. @acruz can you confirm the qty in WH?",time:"2026-03-17 08:22",mentions:["admin","acruz"],reactions:{"👍":["admin"]}},
  {id:"MSG-003",author:"Ana Cruz",username:"acruz",avatar:"AC",text:"@jreyes Yes, confirmed 8 units. One was damaged, raising a claim now.",time:"2026-03-17 08:35",mentions:["jreyes"],reactions:{"✅":["jreyes","admin"]}},
];

let _chatMentionOpen = false;
let _chatMentionQuery = "";
let _chatMentionStart = 0;
let _chatPollTimer = null;


