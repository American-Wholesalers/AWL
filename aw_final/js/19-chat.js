// ── 19-chat.js ──

function pageChat(){
  const _chatFilter = window._chatFilter||"All";

  const chatSearch=(window._chatSearch)||"";
  clearInterval(_chatPollTimer);

  const myUnread = (DB.chat||[]).filter(m=>
    m.mentions.includes(currentUser.username) &&
    !(m.readBy||[]).includes(currentUser.username) &&
    m.username !== currentUser.username
  ).length;

  render(`
  <style>
    .chat-wrap{display:flex;flex-direction:column;height:calc(100vh - 160px);min-height:400px}
    .chat-messages{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:2px}
    .chat-msg{display:flex;gap:10px;padding:6px 8px;border-radius:10px;transition:background .1s;max-width:100%}
    .chat-msg:hover{background:rgba(255,255,255,.04)}
    .chat-msg.mentioned{background:rgba(247,201,79,.07);border-left:3px solid var(--yellow)}
    .chat-msg.mine .chat-bubble{background:rgba(79,142,247,.15);border:1px solid rgba(79,142,247,.2)}
    .chat-bubble{background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;padding:8px 12px;flex:1;min-width:0}
    .chat-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:2px}
    .chat-author{font-size:12px;font-weight:700;color:var(--text);margin-bottom:2px}
    .chat-time{font-size:10px;color:var(--dim);margin-left:6px;font-weight:400}
    .chat-text{font-size:13px;color:var(--text);line-height:1.5;word-break:break-word}
    .chat-mention{color:var(--accent);font-weight:600;background:rgba(79,142,247,.12);border-radius:4px;padding:0 3px;cursor:pointer}
    .chat-mention.me{color:var(--yellow);background:rgba(247,201,79,.12)}
    .chat-reactions{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap}
    .chat-reaction{display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:20px;padding:2px 8px;font-size:12px;cursor:pointer;transition:background .1s}
    .chat-reaction:hover,.chat-reaction.reacted{background:rgba(79,142,247,.15);border-color:rgba(79,142,247,.3)}
    .chat-input-wrap{border-top:1px solid var(--border);padding:12px 16px;background:var(--sidebar);position:relative}
    .chat-input{width:100%;background:#080c14;border:1px solid var(--border2);border-radius:12px;padding:10px 50px 10px 14px;color:var(--text);font-size:13px;font-family:var(--font);outline:none;resize:none;min-height:42px;max-height:120px;line-height:1.5;overflow-y:auto}
    .chat-input:focus{border-color:var(--accent)}
    .chat-send-btn{position:absolute;right:24px;bottom:20px;background:var(--accent);border:none;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;font-size:15px;transition:background .15s}
    .chat-send-btn:hover{background:var(--accent2)}
    .mention-dropdown{position:absolute;bottom:calc(100% + 4px);left:16px;right:60px;background:#091329;border:1px solid var(--border2);border-radius:var(--r);box-shadow:0 8px 24px rgba(0,0,0,.5);z-index:200;overflow:hidden;max-height:200px;overflow-y:auto}
    .mention-opt{display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;transition:background .1s}
    .mention-opt:hover,.mention-opt.active{background:rgba(79,142,247,.12)}
    .mention-opt-avatar{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
    @keyframes msgSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .msg-new{animation:msgSlideIn .2s ease-out}
  </style>

  <div>
    <div class="page-header">
      <div>
        <div class="page-title" style="display:flex;align-items:center;gap:10px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;background:rgba(79,142,247,.15);border-radius:8px;font-size:18px">💬</span>
          Team Chat
        </div>
        <div class="page-sub">Type @ to mention a team member · Everyone can see this channel</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        ${myUnread>0?`<span style="background:rgba(247,201,79,.15);color:var(--yellow);font-size:12px;font-weight:600;border-radius:20px;padding:4px 12px;border:1px solid rgba(247,201,79,.25)">📣 ${myUnread} mention${myUnread!==1?"s":""}</span>`:""}
        <span style="font-size:12px;color:var(--muted)">${(DB.chat||[]).length} messages</span>
      </div>
    </div>
    <div class="card" style="margin-bottom:12px;padding:.75rem 1rem"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="font-size:10px;font-weight:600;color:var(--dim)">Show:</span><div style="display:flex;gap:5px">${["All","Mine","Mentions"].map(f=>`<button class="filter-pill${(window._chatFilter||"All")===f?" active":""}" onclick="window._chatFilter='${f}';renderChatMessages()">${f}</button>`).join("")}</div></div></div>

    <div class="card chat-wrap" style="padding:0;overflow:hidden">
      <!-- Messages -->
      <div style="border-bottom:1px solid var(--border);padding:8px 12px;background:rgba(0,0,0,.2)"><input class="search-bar" style="width:100%" placeholder="Search messages..." value="${chatSearch}" oninput="window._chatSearch=this.value;renderChatMessages()"></div>
          <div class="chat-messages" id="chat-messages">
        ${renderChatMessages()}
      </div>

      <!-- Mention dropdown (hidden by default) -->
      <div class="mention-dropdown" id="mention-dd" style="display:none"></div>

      <!-- Input -->
      <div class="chat-input-wrap">
        <textarea class="chat-input" id="chat-input" placeholder="Message the team… type @ to mention someone"
          rows="1"
          oninput="chatInputHandler(this)"
          onkeydown="chatKeyDown(event)"></textarea>
        <button class="chat-send-btn" onclick="sendChatMessage()" title="Send (Enter)">➤</button>
      </div>
    </div>
  </div>`);

  // Scroll to bottom
  setTimeout(()=>{
    const el=document.getElementById("chat-messages");
    if(el) el.scrollTop=el.scrollHeight;
    document.getElementById("chat-input")?.focus();
    markChatMentionsRead();
  },50);

  // Auto-refresh every 3s (simulates real-time for single-file app)
  _chatPollTimer = setInterval(()=>{
    if(currentPage!=="chat"){ clearInterval(_chatPollTimer); return; }
    const el=document.getElementById("chat-messages");
    if(!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    el.innerHTML = renderChatMessages();
    if(atBottom) el.scrollTop=el.scrollHeight;
  }, 3000);
}

function renderChatMessages(){
  const chatSearch=(window._chatSearch)||"";
  const chatFilter=(window._chatFilter)||"All";
  const allMsgs=(DB.chat||[]);
  const msgs=allMsgs.filter(m=>{
    const mf=chatFilter==="All"||(chatFilter==="Mine"&&m.senderId===currentUser?.id)||(chatFilter==="Mentions"&&(m.text||"").includes("@"+currentUser?.name));
    const ms=!chatSearch||(m.text||"").toLowerCase().includes(chatSearch.toLowerCase())||(m.sender||"").toLowerCase().includes(chatSearch.toLowerCase());
    return mf&&ms;
  });
  if(!msgs.length) return `<div style="text-align:center;color:var(--muted);padding:3rem;font-size:13px">No messages yet. Say hello! 👋</div>`;

  // Group by date
  let lastDate = "";
  return msgs.map((m,idx)=>{
    const isMine = m.username===currentUser.username;
    const isMentioned = m.mentions.includes(currentUser.username);
    const msgDate = (m.time||"").slice(0,10);
    const showDate = msgDate !== lastDate;
    lastDate = msgDate;

    const dateSep = showDate ? `
      <div style="text-align:center;margin:10px 0 4px">
        <span style="font-size:11px;color:var(--dim);background:var(--bg);padding:2px 10px;border-radius:20px;border:1px solid var(--border)">${formatChatDate(msgDate)}</span>
      </div>` : "";

    // Render text with @mentions highlighted
    const renderedText = renderMentions(m.text||"");

    // Reactions
    const reactionsHtml = Object.keys(m.reactions||{}).length ? `
      <div class="chat-reactions">
        ${Object.entries(m.reactions).map(([emoji,users])=>`
          <span class="chat-reaction${users.includes(currentUser.username)?" reacted":""}"
            onclick="toggleReaction('${m.id}','${emoji}')" title="${users.join(", ")}">
            ${emoji} ${users.length}
          </span>`).join("")}
        <span class="chat-reaction" onclick="showReactionPicker('${m.id}')" title="Add reaction">😊</span>
      </div>` : `
      <div class="chat-reactions">
        <span class="chat-reaction" onclick="showReactionPicker('${m.id}')" title="Add reaction" style="opacity:.4">😊</span>
      </div>`;

    // Avatar color based on username
    const avatarColors=["rgba(79,142,247,.3)","rgba(79,207,142,.3)","rgba(247,201,79,.3)","rgba(167,139,250,.3)","rgba(247,92,92,.3)","rgba(79,209,197,.3)"];
    const avatarColor=avatarColors[(m.username||"").charCodeAt(0)%avatarColors.length];
    // Use profile pic if available for this user
    const msgUserKey=m.username?`aw_u_${m.username}_profilePic`:"";
    const msgPic=msgUserKey?localStorage.getItem(msgUserKey):"";
    const avatarHtml=msgPic
      ? `<img src="${msgPic}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
      : (m.avatar||"?");

    return `${dateSep}
    <div class="chat-msg${isMentioned?" mentioned":""}${isMine?" mine":""}" id="msg-${m.id}">
      <div class="chat-avatar" style="background:${avatarColor};color:var(--text);overflow:hidden;padding:${msgPic?"0":""}}">${avatarHtml}</div>
      <div class="chat-bubble" style="flex:1">
        <div class="chat-author">
          ${m.author}
          <span class="chat-time">${(m.time||"").slice(11,16)}</span>
          ${isMine?`<button onclick="deleteMsg('${m.id}')" style="float:right;background:none;border:none;color:var(--dim);font-size:11px;cursor:pointer;opacity:.6" title="Delete">✕</button>`:""}
        </div>
        <div class="chat-text">${renderedText}</div>
        ${reactionsHtml}
      </div>
    </div>`;
  }).join("");
}

function renderMentions(text){
  return text.replace(/@(\w+)/g,(match,username)=>{
    const isMe = username===currentUser.username;
    const user = USERS.find(u=>u.username===username);
    const name = user?user.name:username;
    return `<span class="chat-mention${isMe?" me":""}" onclick="navigate('employees')" title="${name}">@${username}</span>`;
  });
}

function formatChatDate(dateStr){
  if(!dateStr) return "";
  const today = nowCA().date;
  const yesterday = new Date(today+"T12:00:00");
  yesterday.setDate(yesterday.getDate()-1);
  const yStr = yesterday.toISOString().slice(0,10);
  if(dateStr===today) return "Today";
  if(dateStr===yStr)  return "Yesterday";
  return new Date(dateStr+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"});
}

function chatInputHandler(el){
  // Auto-resize
  el.style.height="auto";
  el.style.height=Math.min(el.scrollHeight, 120)+"px";

  // @mention detection
  const val=el.value, cur=el.selectionStart||0;
  const before=val.slice(0,cur);
  const atMatch=before.match(/@(\w*)$/);
  if(atMatch){
    _chatMentionOpen=true;
    _chatMentionQuery=atMatch[1].toLowerCase();
    _chatMentionStart=cur-atMatch[0].length;
    showMentionDropdown(_chatMentionQuery);
  } else {
    _chatMentionOpen=false;
    hideMentionDropdown();
  }
}

function showMentionDropdown(q){
  const dd=document.getElementById("mention-dd");
  if(!dd) return;
  const matches=USERS.filter(u=>
    u.username!==currentUser.username &&
    (u.username.toLowerCase().includes(q)||u.name.toLowerCase().includes(q))
  ).slice(0,8);
  if(!matches.length){ hideMentionDropdown(); return; }
  const avatarColors=["rgba(79,142,247,.3)","rgba(79,207,142,.3)","rgba(247,201,79,.3)","rgba(167,139,250,.3)","rgba(247,92,92,.3)","rgba(79,209,197,.3)"];
  dd.innerHTML=matches.map((u,i)=>{
    const ini=(u.name||"").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
    const col=avatarColors[u.username.charCodeAt(0)%avatarColors.length];
    return `<div class="mention-opt${i===0?" active":""}" id="mopt-${i}" onclick="selectMention('${u.username}')">
      <div class="mention-opt-avatar" style="background:${col}">${ini}</div>
      <div>
        <div style="font-size:13px;font-weight:600">${u.name}</div>
        <div style="font-size:11px;color:var(--muted)">@${u.username} · ${u.role}</div>
      </div>
    </div>`;
  }).join("");
  dd.style.display="block";
}

function hideMentionDropdown(){
  const dd=document.getElementById("mention-dd");
  if(dd) dd.style.display="none";
  _chatMentionOpen=false;
}

function selectMention(username){
  const inp=document.getElementById("chat-input");
  if(!inp) return;
  const val=inp.value;
  const before=val.slice(0,_chatMentionStart);
  const after=val.slice(inp.selectionStart||0);
  inp.value=before+"@"+username+" "+after;
  inp.focus();
  const pos=before.length+username.length+2;
  inp.setSelectionRange(pos,pos);
  hideMentionDropdown();
  chatInputHandler(inp);
}

function chatKeyDown(e){
  if(_chatMentionOpen){
    const dd=document.getElementById("mention-dd");
    const opts=dd?.querySelectorAll(".mention-opt");
    const active=dd?.querySelector(".mention-opt.active");
    let idx=[...opts||[]].indexOf(active);
    if(e.key==="ArrowDown"){ e.preventDefault(); if(opts?.length){opts[idx]?.classList.remove("active");opts[Math.min(idx+1,opts.length-1)]?.classList.add("active");} return; }
    if(e.key==="ArrowUp"){ e.preventDefault(); if(opts?.length){opts[idx]?.classList.remove("active");opts[Math.max(idx-1,0)]?.classList.add("active");} return; }
    if(e.key==="Enter"||e.key==="Tab"){ e.preventDefault(); active?.click(); return; }
    if(e.key==="Escape"){ hideMentionDropdown(); return; }
  }
  if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendChatMessage(); }
}

function sendChatMessage(){
  const inp=document.getElementById("chat-input");
  const text=(inp?.value||"").trim();
  if(!text) return;
  hideMentionDropdown();

  // Extract @mentions
  const mentions=[...text.matchAll(/@(\w+)/g)].map(m=>m[1]).filter(u=>USERS.find(x=>x.username===u));

  const ini=(currentUser.name||"").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const msg={
    id:uid("MSG"),
    author:currentUser.name,
    username:currentUser.username,
    avatar:currentUser.avatar||ini,
    text,
    time:nowCA().ts.slice(0,16),
    mentions:[...new Set(mentions)],
    reactions:{},
    readBy:[currentUser.username],
  };
  DB.chat.push(msg);

  // Notify mentioned users
  mentions.forEach(uname=>{
    const user=USERS.find(u=>u.username===uname);
    if(!user) return;
    DB.notifications.unshift({
      id:uid("NTF"), type:"chat",
      title:`💬 ${currentUser.name} mentioned you in Team Chat`,
      body:text.length>80?text.slice(0,80)+"…":text,
      link:"chat", time:nowCA().ts.slice(0,16),
      read:[], for:uname,
    });
  });
  refreshNotifBadge(); buildNav();

  // Clear and re-render
  inp.value=""; inp.style.height="auto";
  const el=document.getElementById("chat-messages");
  if(el){
    el.innerHTML=renderChatMessages();
    el.scrollTop=el.scrollHeight;
  }
  // Update message count header
  const sub=document.querySelector(".page-sub");
  if(sub) sub.textContent=`Type @ to mention a team member · Everyone can see this channel`;
}

function deleteMsg(id){
  if(DB.chat.find(m=>m.id===id)?.username!==currentUser.username&&currentUser.role!=="Admin") return;
  DB.chat=DB.chat.filter(m=>m.id!==id);
  const el=document.getElementById("chat-messages");
  if(el){ el.innerHTML=renderChatMessages(); el.scrollTop=el.scrollHeight; }
}

function toggleReaction(msgId, emoji){
  const msg=DB.chat.find(m=>m.id===msgId);
  if(!msg) return;
  if(!msg.reactions) msg.reactions={};
  if(!msg.reactions[emoji]) msg.reactions[emoji]=[];
  const idx=msg.reactions[emoji].indexOf(currentUser.username);
  if(idx>=0) msg.reactions[emoji].splice(idx,1);
  else msg.reactions[emoji].push(currentUser.username);
  if(msg.reactions[emoji].length===0) delete msg.reactions[emoji];
  const el=document.getElementById("chat-messages");
  if(el){ const atBottom=el.scrollHeight-el.scrollTop-el.clientHeight<60; el.innerHTML=renderChatMessages(); if(atBottom) el.scrollTop=el.scrollHeight; }
}

function showReactionPicker(msgId){
  // Simple quick reactions
  const emojis=["👍","👎","❤️","🔥","😂","✅","⚠️","🙏"];
  const existing=document.getElementById("reaction-picker");
  if(existing) existing.remove();
  const msgEl=document.getElementById("msg-"+msgId);
  if(!msgEl) return;
  const picker=document.createElement("div");
  picker.id="reaction-picker";
  picker.style.cssText="position:fixed;z-index:9999;background:#091329;border:1px solid var(--border2);border-radius:var(--r);padding:8px;display:flex;gap:6px;box-shadow:0 8px 24px rgba(0,0,0,.5)";
  picker.innerHTML=emojis.map(e=>`<span onclick="toggleReaction('${msgId}','${e}');this.closest('#reaction-picker')?.remove()" style="font-size:18px;cursor:pointer;padding:3px;border-radius:6px;transition:background .1s" onmouseover="this.style.background='rgba(255,255,255,.1)'" onmouseout="this.style.background=''">${e}</span>`).join("");
  const rect=msgEl.getBoundingClientRect();
  picker.style.top=(rect.bottom+4)+"px";
  picker.style.left=rect.left+"px";
  document.body.appendChild(picker);
  setTimeout(()=>{ document.addEventListener("click",()=>picker.remove(),{once:true}); },10);
}

function markChatMentionsRead(){
  (DB.chat||[]).forEach(m=>{
    if(m.mentions.includes(currentUser.username)){
      if(!m.readBy) m.readBy=[];
      if(!m.readBy.includes(currentUser.username)) m.readBy.push(currentUser.username);
    }
  });
  refreshNotifBadge();
}

// ═══════════════════════════════════════════════
//  PAGE: FAQ & Q&A
// ═══════════════════════════════════════════════
if(!DB.faq) DB.faq=[
  {id:"FAQ-001",question:"What is the reorder lead time for PPE items?",askedBy:"Maria Santos",askedAt:"2026-03-14 08:00",category:"Inventory",status:"Answered",votes:3,answers:[
    {id:"ANS-001",text:"PPE items from SafeGear PH typically take 3–5 business days. For imported items, allow 2–3 weeks. Always check the supplier's current lead time on the replenishment request.",answeredBy:"Liza Mendoza",answeredAt:"2026-03-14 08:45",helpful:2,isAccepted:true},
  ]},
  {id:"FAQ-002",question:"How do I create an emergency shipment request?",askedBy:"Ramon Villaruel",askedAt:"2026-03-13 14:30",category:"Operations",status:"Answered",votes:5,answers:[
    {id:"ANS-002",text:"Go to Emergency Shipments in the sidebar, click '▲ Raise Emergency', fill in the item, quantity, priority level, and expected ETA. The team will be notified automatically.",answeredBy:"Jose Reyes",answeredAt:"2026-03-13 15:00",helpful:4,isAccepted:true},
  ]},
  {id:"FAQ-003",question:"Who approves Purchase Orders above ₱300,000?",askedBy:"Liza Mendoza",askedAt:"2026-03-12 10:00",category:"Finance",status:"Open",votes:2,answers:[]},
  {id:"FAQ-004",question:"How often is the warehouse inventory count verified physically?",askedBy:"Jose Reyes",askedAt:"2026-03-11 09:15",category:"Warehouse",status:"Open",votes:1,answers:[]},
];

const FAQ_CATS=["All","Inventory","Operations","Finance","Warehouse","HR","IT","General"];


