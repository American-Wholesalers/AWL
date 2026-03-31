// ── 03-utils.js ──

function canAccess(page){
  if(!currentUser) return false;
  const custom = (DB.rolePermissions||{})[currentUser.role];
  if(custom && custom[page] !== undefined){
    return custom[page] !== "none";
  }
  if(ROLE_ACCESS[currentUser.role]==="all") return true;
  return (ROLE_ACCESS[currentUser.role]||[]).includes(page);
}

function canEdit(page){
  if(!currentUser) return false;
  if(currentUser.role==="Admin"||currentUser.role==="Head") return true;
  const custom = (DB.rolePermissions||{})[currentUser.role];
  if(custom && custom[page] !== undefined){
    return custom[page] === "edit";
  }
  return canAccess(page);
}

function canSubmit(page){
  if(!currentUser) return false;
  if(currentUser.role==="Admin"||currentUser.role==="Head") return true;
  const custom = (DB.rolePermissions||{})[currentUser.role];
  if(custom && custom[page] !== undefined){
    // submit = "edit" or "submit" level
    return custom[page] === "edit" || custom[page] === "submit";
  }
  // Default: same as canEdit
  return canAccess(page);
}

// ── Tab Access ──
// PAGE_TABS defines all tabs per page that can have permissions controlled
const PAGE_TABS = {
  brands:        [{id:"submissions",label:"Brand Submissions"},{id:"future",label:"Future Attempts"},{id:"spoke",label:"Brands We've Spoken To"},{id:"monthly",label:"Monthly Reports"},{id:"tradeshows",label:"Upcoming Trade Shows"}],
  replenishment: [{id:"Amazon",label:"Amazon"},{id:"Walmart",label:"Walmart"},{id:"Ebay",label:"eBay"}],
  emergency:     [{id:"Amazon",label:"Amazon"},{id:"Walmart",label:"Walmart"},{id:"Ebay",label:"eBay"}],
};

function canAccessTab(page, tabId){
  if(!currentUser) return false;
  if(currentUser.role==="Admin"||currentUser.role==="Head") return true;
  const tp = (DB.tabPermissions||{})[currentUser.role];
  if(!tp || !tp[page]) return true; // no restriction set = allow all tabs
  const allowed = tp[page];
  return allowed.includes(tabId);
}

// ── Auth ──
function togglePw(){
  const i=document.getElementById("login-pass");
  const b=document.getElementById("pw-toggle");
  if(i.type==="password"){i.type="text";b.textContent="Hide";}
  else{i.type="password";b.textContent="Show";}
}

function toggleSuPw(){
  const i=document.getElementById("su-pass");
  const b=document.getElementById("su-pw-toggle");
  if(i.type==="password"){i.type="text";b.textContent="Hide";}
  else{i.type="password";b.textContent="Show";}
}

function showSignIn(){
  document.getElementById("signup-panel").style.display="none";
  document.getElementById("signin-panel").style.display="block";
  document.getElementById("login-sub-text").textContent="Sign in to your account";
  setTimeout(()=>document.getElementById("login-user")?.focus(),50);
}

function showSignUp(){
  document.getElementById("signin-panel").style.display="none";
  document.getElementById("signup-panel").style.display="block";
  document.getElementById("login-sub-text").textContent="Create your account";
  document.getElementById("signup-error").style.display="none";
  document.getElementById("signup-success").style.display="none";
  document.getElementById("signup-form-fields").style.display="block";
  // Reset form
  ["su-name","su-email","su-username","su-pass","su-pass2","su-clients"].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value="";
  });
  const dept=document.getElementById("su-dept"); if(dept) dept.value="";
  const plat=document.getElementById("su-platform"); if(plat) plat.value="";
  suToggleClients();
  setTimeout(()=>document.getElementById("su-name")?.focus(),50);
}

function suToggleClients(){
  const dept=(document.getElementById("su-dept")?.value)||"";
  const wrap=document.getElementById("su-clients-wrap");
  if(wrap) wrap.style.display=(dept==="Manager"||dept==="Customer Service")?"block":"none";
}

function showSuErr(msg){
  const el=document.getElementById("signup-error");
  if(el){ el.textContent=msg; el.style.display="block"; }
  document.getElementById("signup-success").style.display="none";
}

// Pending sign-up requests (Admin approves in Employees page)
if(!window._pendingSignups) window._pendingSignups = [];

function doSignUp(){
  const name     = (document.getElementById("su-name")?.value||"").trim();
  const email    = (document.getElementById("su-email")?.value||"").trim().toLowerCase();
  const username = (document.getElementById("su-username")?.value||"").trim().toLowerCase();
  const dept     = document.getElementById("su-dept")?.value||"";
  const platform = document.getElementById("su-platform")?.value||"";
  const clients  = (document.getElementById("su-clients")?.value||"").trim();
  const pass     = document.getElementById("su-pass")?.value||"";
  const pass2    = document.getElementById("su-pass2")?.value||"";

  if(!name)              return showSuErr("Full name is required.");
  if(!email)             return showSuErr("AWL email is required.");
  if(!email.endsWith("@theamericanwholesalers.com"))
                         return showSuErr("Please use your @theamericanwholesalers.com email.");
  if(!username)          return showSuErr("Username is required.");
  if(username.length<3)  return showSuErr("Username must be at least 3 characters.");
  if(!dept)              return showSuErr("Please select your role.");
  if(!platform)          return showSuErr("Please select your platform.");
  if((dept==="Manager"||dept==="Customer Service")&&!clients)
                         return showSuErr("Please list the clients you handle.");
  if(!pass)              return showSuErr("Password is required.");
  if(pass.length<8)      return showSuErr("Password must be at least 8 characters.");
  if(pass!==pass2)       return showSuErr("Passwords do not match.");
  if(USERS.find(u=>u.username===username))
                         return showSuErr("Username already taken. Please choose another.");
  if(USERS.find(u=>u.email===email))
                         return showSuErr("An account with this email already exists.");
  if((window._pendingSignups||[]).find(u=>u.email===email&&u.status==="Pending"))
                         return showSuErr("A sign-up request for this email is already pending.");

  const parts  = name.split(" ").filter(Boolean);
  const avatar = ((parts[0]?.[0]||"")+(parts[1]?.[0]||"")).toUpperCase();

  const req = {
    id: uid("SUSR"),
    username, password: pass, name, email,
    dept, role: dept, avatar,
    platform,
    clientsHandled: clients,
    requestedAt: nowCA().ts,
    status: "Pending"
  };
  window._pendingSignups.push(req);

  // Notify admins
  if(!DB.notifications) DB.notifications=[];
  DB.notifications.unshift({
    id: uid("NTF"), type:"signup",
    title:"New account request: "+name,
    body: username+" · "+dept+" · "+platform+(clients?" · Clients: "+clients.slice(0,40):"")+" · "+email,
    link:"employees", time:nowCA().ts.slice(0,16),
    read:[], for:"Admin"
  });

  // Show success
  document.getElementById("signup-form-fields").style.display="none";
  const successEl = document.getElementById("signup-success");
  successEl.innerHTML=`
    <div style="text-align:center;padding:.5rem 0">
      <div style="font-size:32px;margin-bottom:8px">🎉</div>
      <div style="font-size:15px;font-weight:700;margin-bottom:6px">Request submitted!</div>
      <div style="font-size:12px;line-height:1.7;color:var(--muted)">
        Your account request has been sent to the Admin for approval.<br>
        You'll be able to sign in once it's approved.<br><br>
        <strong style="color:var(--text)">Name:</strong> ${name}<br>
        <strong style="color:var(--text)">Email:</strong> ${email}<br>
        <strong style="color:var(--text)">Username:</strong> ${username}<br>
        <strong style="color:var(--text)">Role:</strong> ${dept}
      </div>
    </div>`;
  successEl.style.display="block";
  document.getElementById("signup-error").style.display="none";
}

function doLogin(){
  const u=document.getElementById("login-user").value.trim();
  const p=document.getElementById("login-pass").value;
  const err=document.getElementById("login-error");
  const btn=document.getElementById("login-btn");
  err.style.display="none";
  if(!u||!p){showErr("Please enter username and password.");return;}
  btn.disabled=true; btn.textContent="Signing in…";
  setTimeout(()=>{
    // Check localStorage for password overrides (from changePassword())
    const user=USERS.find(x=>{
      if(x.username!==u) return false;
      const saved=localStorage.getItem("aw_pw_"+x.username);
      return (saved||x.password)===p;
    });
    if(user){
      currentUser=user;
      document.getElementById("login-screen").style.display="none";
      document.getElementById("app").style.display="flex";
      document.getElementById("sb-avatar").textContent=user.avatar;
      document.getElementById("sb-uname").textContent=user.name;
      document.getElementById("sb-urole").textContent=user.role;
      updateSidebarAvatar();
      buildNav(); navigate("dashboard");
      // Show attendance check-in popup after a short delay
      setTimeout(showAttendancePopup, 600);
      // Check for expiring items on login
      setTimeout(checkExpiryNotifications, 1200);
      // Resume auto-save if it was enabled
      if(localStorage.getItem("aw_autosave")==="1") toggleAutoSave(true);
    } else {
      showErr("Invalid username or password.");
      btn.disabled=false; btn.textContent="Sign In";
    }
  },500);
  function showErr(m){err.textContent=m;err.style.display="block";}
}

function logout(){
  currentUser=null;
  document.getElementById("app").style.display="none";
  document.getElementById("login-screen").style.display="flex";
  document.getElementById("login-user").value="";
  document.getElementById("login-pass").value="";
  document.getElementById("login-error").style.display="none";
  document.getElementById("login-btn").disabled=false;
  document.getElementById("login-btn").textContent="Sign In";
}

// ── Nav ──
function applyStoredTheme(){
  // If no user logged in, use global defaults only
  const prefix = currentUser ? `aw_u_${currentUser.username}_` : null;
  const ls = k => prefix ? (localStorage.getItem(prefix+k)||"") : "";

  const t = AW_THEMES.find(x=>x.id===ls("theme"))||AW_THEMES[0];
  document.documentElement.style.setProperty("--bg",      t.bg);
  document.documentElement.style.setProperty("--sidebar", t.sidebar);
  if(ls("accent")){
    document.documentElement.style.setProperty("--accent",  ls("accent"));
    document.documentElement.style.setProperty("--accent2", ls("accent"));
  }
  if(ls("font")){
    document.documentElement.style.setProperty("--font", ls("font"));
    previewFont(ls("font"));
  }
  if(ls("fontsize")) document.body.style.fontSize = ls("fontsize")+"px";
  if(ls("radius")){
    const r = ls("radius");
    document.documentElement.style.setProperty("--r",  r+"px");
    document.documentElement.style.setProperty("--r2", (Number(r)+4)+"px");
    document.documentElement.style.setProperty("--r3", (Number(r)+10)+"px");
  }
  if(ls("bg")) applyBg(ls("bg"));
}

// ── Data persistence helpers ──
function saveToLocalStorage(){
  try{
    localStorage.setItem("aw_db",JSON.stringify(DB));
    localStorage.setItem("aw_last_save",nowCA().ts);
    showToast("✓ Data saved","var(--green)");
  } catch(e){ showToast("Save failed: "+e.message,"var(--red)"); }
}

// ═══════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════
(function(){
  try{
    const raw=localStorage.getItem("aw_db");
    if(raw){
      const saved=JSON.parse(raw);
      Object.keys(saved).forEach(k=>{ if(DB[k]!==undefined) DB[k]=saved[k]; });
      console.log("[AW] Data loaded from localStorage");
    }
  } catch(e){ console.warn("[AW] Could not load saved data:",e); }
})();
// Auto-load saved data from localStorage if available
(function(){
  try{
    const raw=localStorage.getItem("aw_db");
    if(raw){
      const saved=JSON.parse(raw);
      Object.keys(saved).forEach(k=>{ if(DB[k]!==undefined) DB[k]=saved[k]; });
    }
  } catch(e){ console.warn("[AW] Could not load saved data:",e); }
  // Apply saved theme before login screen shows
  try{ applyStoredTheme(); } catch(e){}
})();
document.getElementById("login-user").focus();


