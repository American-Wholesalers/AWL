// ── 22-gmail.js ──

function pageGmail(){
  const stored=sessionStorage.getItem("gm_token_"+currentUser.username);
  if(stored){_gmToken=stored; return renderGmailConnected();}
  renderGmailConnect();
}

function renderGmailConnect(){
  render(`
  <div>
    <div class="page-header"><div><div class="page-title">Gmail</div><div class="page-sub">Google Gmail integration</div></div></div>
    <div style="max-width:520px;margin:0 auto">
      <div class="card" style="text-align:center;padding:2.5rem;border-color:rgba(234,67,53,.3)">
        <div style="width:60px;height:60px;margin:0 auto 16px;background:linear-gradient(135deg,#EA4335,#FBBC05);border-radius:14px;display:flex;align-items:center;justify-content:center">
          <svg viewBox="0 0 24 24" fill="white" width="32" height="32"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        </div>
        <div style="font-size:18px;font-weight:700;margin-bottom:8px">Connect Gmail</div>
        <div style="font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:20px">Read-only access to your inbox — see recent emails without leaving American Wholesalers. Uses the same Google OAuth setup as Calendar.</div>

        <div class="form-group" style="text-align:left;margin-bottom:14px">
          <label class="form-label">Google OAuth Client ID</label>
          <input id="gm-client-id" class="form-input" placeholder="XXXXXXXXXX-xxxxxxxx.apps.googleusercontent.com" value="${localStorage.getItem('gc_client_id')||''}">
          <div style="font-size:10px;color:var(--dim);margin-top:4px">Same Client ID as Calendar. Must have Gmail API enabled.</div>
        </div>

        <button onclick="connectGmail()" style="width:100%;padding:12px;border:none;border-radius:var(--r);background:#EA4335;color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px">
          <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.729 0-.788-.085-1.39-.189-1.989H12.24z"/></svg>
          Sign in with Google
        </button>
        <div id="gm-error" style="display:none;margin-top:10px;color:var(--red);font-size:12px"></div>
      </div>
    </div>
  </div>`);
}

function connectGmail(){
  const clientId=document.getElementById("gm-client-id")?.value.trim();
  if(!clientId){const e=document.getElementById("gm-error");e.style.display="block";e.textContent="Please enter your Client ID.";return;}
  localStorage.setItem("gc_client_id",clientId);
  const errEl=document.getElementById("gm-error");
  const doAuth=()=>{
    try{
      const client=google.accounts.oauth2.initTokenClient({
        client_id:clientId,
        scope:GM_SCOPE+" https://www.googleapis.com/auth/gmail.modify",
        callback:(resp)=>{
          if(resp.error){errEl.style.display="block";errEl.textContent="Auth error: "+resp.error;return;}
          _gmToken=resp.access_token;
          sessionStorage.setItem("gm_token_"+currentUser.username,_gmToken);
          renderGmailConnected();
        },
      });
      client.requestAccessToken();
    } catch(e){ errEl.style.display="block"; errEl.textContent="Error: "+e.message; }
  };
  if(!window.google?.accounts){
    const script=document.createElement("script");
    script.src="https://accounts.google.com/gsi/client";
    script.onload=doAuth;
    script.onerror=()=>{errEl.style.display="block";errEl.textContent="Could not load Google sign-in library.";};
    document.head.appendChild(script);
  } else doAuth();
}

async function renderGmailConnected(){
  render(`
  <div>
    <div class="page-header">
      <div><div class="page-title">Gmail</div><div class="page-sub">Your inbox</div></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="refreshGmail()">↺ Refresh</button>
        <button class="btn btn-ghost btn-sm" onclick="disconnectGmail()">Disconnect</button>
      </div>
    </div>
    <div id="gmail-body"><div style="text-align:center;padding:3rem;color:var(--muted)">Loading inbox…</div></div>
  </div>`);
  await loadGmailThreads();
}

async function loadGmailThreads(q=""){
  const body=document.getElementById("gmail-body");
  try{
    // Fetch thread list
    const listUrl=`https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=20&labelIds=INBOX${q?"&q="+encodeURIComponent(q):""}`;
    const listRes=await fetch(listUrl,{headers:{Authorization:"Bearer "+_gmToken}});
    if(listRes.status===401){disconnectGmail();return;}
    const listData=await listRes.json();
    const threads=listData.threads||[];
    if(!threads.length){if(body)body.innerHTML=`<div class="card" style="text-align:center;padding:3rem;color:var(--muted)"><div style="font-size:28px;margin-bottom:8px">📭</div><div>Inbox is empty.</div></div>`;return;}

    // Fetch thread snippets in parallel (first 20)
    const details=await Promise.all(threads.slice(0,20).map(t=>
      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${t.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,{headers:{Authorization:"Bearer "+_gmToken}}).then(r=>r.json())
    ));
    _gmThreads=details;
    renderGmailList(q);
  } catch(e){
    if(body) body.innerHTML=`<div class="alert-banner alert-danger">Failed to load Gmail: ${e.message}</div>`;
  }
}

function renderGmailList(q=""){
  const body=document.getElementById("gmail-body");
  if(!body) return;

  body.innerHTML=`
  <div>
    <div style="display:flex;gap:8px;margin-bottom:14px">
      <input class="search-bar" id="gmail-search" style="flex:1" placeholder="Search inbox…" value="${q}" onkeydown="if(event.key==='Enter')loadGmailThreads(this.value)">
      <button class="btn btn-primary btn-sm" onclick="loadGmailThreads(document.getElementById('gmail-search').value)">Search</button>
      <button class="btn btn-ghost btn-sm" onclick="loadGmailThreads('')">Clear</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:0;border:1px solid var(--border);border-radius:var(--r2);overflow:hidden">
    ${_gmThreads.map((thread,idx)=>{
      const msgs=thread.messages||[];
      const last=msgs[msgs.length-1];
      const headers=last?.payload?.headers||[];
      const getH=n=>headers.find(h=>h.name===n)?.value||"";
      const subject=getH("Subject")||"(No Subject)";
      const from=getH("From")||"Unknown";
      const fromName=from.replace(/<[^>]+>/,"").replace(/"/g,"").trim()||from;
      const date=getH("Date");
      const dateF=date?new Date(date).toLocaleDateString("en-PH",{month:"short",day:"numeric"}):"-";
      const unread=msgs.some(m=>(m.labelIds||[]).includes("UNREAD"));
      const snippet=last?.snippet||"";
      return `
      <div onclick="openEmailThread('${thread.id}')" style="display:flex;gap:14px;padding:12px 16px;cursor:pointer;background:${unread?"rgba(66,133,244,.05)":"transparent"};border-bottom:1px solid var(--border);transition:background .15s" onmouseover="this.style.background='rgba(255,255,255,.05)'" onmouseout="this.style.background='${unread?"rgba(66,133,244,.05)":"transparent"}'">
        <div style="width:32px;height:32px;border-radius:50%;background:${["#EA4335","#4285F4","#34A853","#FBBC05","#ab47bc","#0097a7"][idx%6]};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0">${(fromName[0]||"?").toUpperCase()}</div>
        <div style="flex:1;min-width:0;overflow:hidden">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <div style="font-size:13px;font-weight:${unread?"700":"500"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${unread?"var(--text)":"var(--muted)"}">${fromName}</div>
            <div style="font-size:11px;color:var(--dim);flex-shrink:0">${dateF}</div>
          </div>
          <div style="font-size:12px;font-weight:${unread?"600":"400"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${unread?"var(--text)":"var(--muted)"};margin-top:2px">${subject}</div>
          <div style="font-size:11px;color:var(--dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px">${snippet}</div>
        </div>
        ${unread?`<div style="width:8px;height:8px;border-radius:50%;background:#4285F4;flex-shrink:0;margin-top:6px"></div>`:""}
      </div>`;
    }).join("")}
    </div>
    <div style="text-align:center;padding:10px;font-size:11px;color:var(--dim)">Showing ${_gmThreads.length} threads · Read-only view</div>
  </div>`;
}

async function openEmailThread(threadId){
  const thread=_gmThreads.find(t=>t.id===threadId);
  if(!thread) return;
  const msgs=thread.messages||[];
  const last=msgs[msgs.length-1];
  const headers=last?.payload?.headers||[];
  const getH=n=>headers.find(h=>h.name===n)?.value||"";
  const subject=getH("Subject")||"(No Subject)";
  const from=getH("From")||"Unknown";
  const date=getH("Date")?new Date(getH("Date")).toLocaleString("en-PH"):"";

  // Decode email body
  function decodeBody(part){
    if(!part) return "";
    if(part.body?.data) return atob(part.body.data.replace(/-/g,"+").replace(/_/g,"/"));
    if(part.parts) return part.parts.map(decodeBody).join("");
    return "";
  }

  const bodyHtml=decodeBody(last?.payload)||last?.snippet||"";
  const isHtml=bodyHtml.includes("<");

  openModal(`${mHeader(subject)}
  <div class="modal-body" style="gap:0">
    <div style="padding-bottom:12px;border-bottom:1px solid var(--border);margin-bottom:12px">
      <div style="font-size:13px;font-weight:600">${from}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px">${date}</div>
    </div>
    <div style="font-size:13px;line-height:1.8;max-height:420px;overflow-y:auto;color:var(--text)">
      ${isHtml?`<div style="background:#fff;color:#333;border-radius:6px;padding:12px">${bodyHtml}</div>`:`<pre style="white-space:pre-wrap;font-family:var(--font)">${bodyHtml.replace(/</g,"&lt;")}</pre>`}
    </div>
  </div>
  <div class="modal-footer"><div></div><div style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" onclick="closeModal()">Close</button><a href="https://mail.google.com/mail/u/0/#inbox/${threadId}" target="_blank" class="btn btn-primary btn-sm">Open in Gmail ↗</a></div></div>`,true);
}

function refreshGmail(){ _gmThreads=[]; renderGmailConnected(); }
function disconnectGmail(){
  _gmToken=null;
  sessionStorage.removeItem("gm_token_"+currentUser.username);
  pageGmail();
}

// ═══════════════════════════════════════════════
//  PAGE: BRANDS
// ═══════════════════════════════════════════════
if(!DB.brands) DB.brands=[
  {
    id:"BRD-001",submissionDate:"2026-03-01",brandName:"ApexGear",submittedBy:"Maria Santos",
    contactName:"James Lin",jobTitle:"VP Sales",phone:"+1-555-0101",email:"j.lin@apexgear.com",
    website:"apexgear.com",primarySubcategory:"Power Tools",subcategoryMonthlyRevenue:480000,
    marketShare:12.4,totalSellers:38,topCompetingBrands:"TitanTool, ProForce",topCompetitorRevenue:920000,
    brandKeyword:"apex power drill",competitorKeyword:"titan cordless drill",amazonInStockRate:94.2,
    notes:"Strong brand recognition. Follow up on exclusivity.",productsWithAds:14,
    topProductRevenue:85000,topCompetingProductRevenue:112000,topSeller:"ApexDrill X200",
    totalUPCs:42,estAdSpend:18000,submissionId:"SUB-2026-031",
    followUpPat:"2026-03-28",followUpCesar:"2026-04-05",status:"Approved"
  },
  {
    id:"BRD-002",submissionDate:"2026-03-05",brandName:"ClearVue",submittedBy:"Liza Mendoza",
    contactName:"Sara Ng",jobTitle:"Brand Manager",phone:"+1-555-0202",email:"s.ng@clearvue.com",
    website:"clearvue.com",primarySubcategory:"Safety Eyewear",subcategoryMonthlyRevenue:210000,
    marketShare:8.1,totalSellers:22,topCompetingBrands:"ShieldEye, SafeView",topCompetitorRevenue:440000,
    brandKeyword:"clearvue safety glasses",competitorKeyword:"shieldeye ansi z87",amazonInStockRate:88.5,
    notes:"Interested in bulk wholesale pricing.",productsWithAds:6,
    topProductRevenue:42000,topCompetingProductRevenue:67000,topSeller:"ClearVue Z87 Pro",
    totalUPCs:18,estAdSpend:7500,submissionId:"SUB-2026-035",
    followUpPat:"2026-04-01",followUpCesar:"2026-04-10",status:"Pending"
  },
  {
    id:"BRD-003",submissionDate:"2026-03-10",brandName:"IronShield",submittedBy:"Jose Reyes",
    contactName:"Marco Tan",jobTitle:"Director",phone:"+1-555-0303",email:"m.tan@ironshield.com",
    website:"ironshield.com",primarySubcategory:"Work Gloves",subcategoryMonthlyRevenue:155000,
    marketShare:5.3,totalSellers:61,topCompetingBrands:"GripMax, ToughHand",topCompetitorRevenue:310000,
    brandKeyword:"ironshield work gloves",competitorKeyword:"gripmax heavy duty gloves",amazonInStockRate:76.0,
    notes:"Low in-stock rate is a concern. Discuss fulfillment.",productsWithAds:3,
    topProductRevenue:28000,topCompetingProductRevenue:55000,topSeller:"IronShield Cut-5",
    totalUPCs:11,estAdSpend:4200,submissionId:"SUB-2026-042",
    followUpPat:"2026-03-25",followUpCesar:"2026-04-02",status:"Declined"
  },
];

const BRAND_COLS=[
  {key:"brandName",                 label:"Brand Name",                    w:160, bold:true},
  {key:"primarySubcategory",        label:"Primary Subcategory",           w:170},
  {key:"primarySubcategoryRevenue",   label:"Primary Subcategory Revenue",   w:190, currency:true},
  {key:"totalUPCs",                 label:"Total UPCs",                    w:100, num:true},
  {key:"amazonInStockRate",         label:"Amazon In-Stock Rate",          w:140, pct:true},
  {key:"topSeller",                 label:"Top Seller",                    w:150},
  {key:"topSellerPct",              label:"Top Seller %",                  w:110, pct:true},
  {key:"totalSellers",              label:"Total Sellers",                 w:110, num:true},
  {key:"topCompetingBrands",        label:"Competitor Brand Name",         w:170},
  {key:"brandKeyword",              label:"Brand Keyword",                 w:150},
  {key:"competitorKeyword",         label:"Competitor Keyword",            w:160},
  {key:"subcategoryMonthlyRevenue", label:"Brand Monthly Revenue",         w:170, currency:true},
  {key:"topCompetitorRevenue",      label:"Competitor Monthly Revenue",    w:180, currency:true},
  {key:"marketShare",               label:"Brand Market Share %",          w:140, pct:true},
  {key:"competitorMarketShare",     label:"Competitor Market Share %",     w:170, pct:true},
  {key:"brandSearchTerms",          label:"Brand Search Terms",            w:140, num:true},
  {key:"competitorSearchTerms",     label:"Competitor Search Terms",       w:170, num:true},
  {key:"productsWithAds",           label:"Brand Products w/ Ads",        w:150, num:true},
  {key:"competitorProductsWithAds", label:"Competitor Products w/ Ads",   w:180, num:true},
  {key:"estAdSpend",                label:"Brand Monthly Ads",             w:150, currency:true},
  {key:"competitorAdSpend",         label:"Competitor Monthly Ads",        w:170, currency:true},
  {key:"topProductRevenue",         label:"Brand Top Product / Mo",        w:165, currency:true},
  {key:"topCompetingProduct",       label:"Competitor Top Product",        w:180},
  {key:"topCompetingProductRevenue",label:"Competitor Top Product / Mo",   w:190, currency:true},
];

const BRAND_STATUS_STYLES={
  Approved:{bg:"rgba(79,207,142,.12)",color:"#4fcf8e"},
  Pending:{bg:"rgba(247,201,79,.12)",color:"#f7c94f"},
  Declined:{bg:"rgba(247,92,92,.12)",color:"#f75c5c"},
};

