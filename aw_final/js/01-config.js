// ── 01-config.js ──


// ═══════════════════════════════════════════════
//  DATA & CONFIG
// ═══════════════════════════════════════════════
const USERS = [
  {id:"USR-001",username:"admin",password:"admin123",name:"Maria Santos",role:"Admin",dept:"Operations",avatar:"MS"},
  {id:"USR-002",username:"jreyes",password:"jose2024",name:"Jose Reyes",role:"Manager",dept:"Manager",avatar:"JR"},
  {id:"USR-003",username:"acruz",password:"ana2024",name:"Ana Cruz",role:"Warehouse",dept:"Warehouse",avatar:"AC"},
  {id:"USR-008",username:"warehouse",password:"warehouse2024",name:"Carlos Reyes",role:"Warehouse",dept:"Warehouse",avatar:"CR"},
  {id:"USR-004",username:"lmendoza",password:"liza2024",name:"Liza Mendoza",role:"Purchaser",dept:"Purchaser",avatar:"LM"},
  {id:"USR-007",username:"purchaser",password:"purchase2024",name:"John Cruz",role:"Purchaser",dept:"Purchaser",avatar:"JC"},
  {id:"USR-005",username:"rvillaruel",password:"ramon2024",name:"Ramon Villaruel",role:"Account Health",dept:"Account Health",avatar:"RV"},
  {id:"USR-006",username:"bookkeeper",password:"books2024",name:"BookKeeper",role:"Customer Service",dept:"Customer Service",avatar:"BK"},
];

const ROLE_ACCESS = {
  Admin:              "all",
  Manager:            ["dashboard","inventory","firesale","archived","replenishment","warehouse","amazon","walmart","emergency","pnl","liquidations","shipping","research","reports","clients","scan","faq","chat","notifications","brands","employees"],
  Purchaser:          ["dashboard","inventory","firesale","archived","replenishment","amazon","walmart","warehouse","research","liquidations","shipping","reports","clients","faq","chat","notifications","calendar"],
  Warehouse:          ["dashboard","inventory","firesale","archived","warehouse","replenishment","scan","shipping","tickets","emergency","faq","chat","notifications","calendar"],
  "Website Developer":["dashboard","inventory","clients","research","brands","faq","chat","notifications","calendar"],
  "Account Health":   ["dashboard","inventory","firesale","archived","clients","reports","pnl","faq","chat","notifications","calendar","tickets"],
  Brands:             ["dashboard","inventory","brands","research","clients","faq","chat","notifications","calendar"],
  "Customer Service": ["dashboard","inventory","amazon","clients","shipping","faq","chat","notifications","calendar","tickets"],
  "Product Research": ["dashboard","inventory","research","brands","clients","faq","chat","notifications","calendar"],
  Bookkeeper:         ["dashboard","attendance","pnl","liquidations","reports","faq","chat","notifications","calendar"],
  Auditor:            ["dashboard","inventory","firesale","archived","replenishment","amazon","walmart","warehouse","reports","pnl","liquidations","faq","chat","notifications","calendar"],
  "Brand CSR":        ["dashboard","inventory","brands","clients","research","faq","chat","notifications","calendar","tickets"],
  Head:               "all",
  "Purchasing Manager":["dashboard","inventory","firesale","archived","replenishment","amazon","walmart","warehouse","research","liquidations","shipping","reports","clients","faq","chat","notifications","calendar"],
  "Product Auditor":  ["dashboard","inventory","firesale","archived","research","reports","faq","chat","notifications","calendar"],
};

const NAV = [
  {group:"Overview",items:[
    {id:"dashboard",label:"Dashboard",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>`},
    {id:"employees",label:"Employees",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>`},
    {id:"attendance",label:"Attendance",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 3V1m6 2V1M2 7h12"/><path d="M6 10.5l1.5 1.5L10 9"/></svg>`},
  ]},
  {group:"Inventory & Warehouse",items:[
    {id:"scan",label:"UPC Scan Station",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="14" height="10" rx="1.5"/><path d="M4 6v4M6 5v6M8 6v4M10 5v6M12 6v4"/></svg>`},
    {id:"inventory",label:"Inventory",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 5l6-3 6 3v6l-6 3-6-3V5z"/><path d="M8 2v12M2 5l6 3 6-3"/></svg>`},
    {id:"firesale",label:"🔥 Fire Sale!!",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 14c-3.3 0-6-2-6-5 0-2 1-3.5 2.5-4.5 0 1.5 1 2.5 1 2.5C6 5 7 3 7 1c2 1 4 3.5 4 6 .5-.5.8-1.2 1-2 1 1.2 1 2.5 1 3.5 0 2.5-2.2 4.5-5 4.5z"/></svg>`},
    {id:"archived",label:"Archived Items",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="14" height="4" rx="1"/><path d="M2 5v9a1 1 0 001 1h10a1 1 0 001-1V5"/><path d="M6 8h4"/></svg>`},
    {id:"warehouse",label:"Warehouse Receivables",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 7l7-5 7 5v7H1V7z"/><rect x="5" y="10" width="3" height="4"/><rect x="9" y="8" width="3" height="3"/></svg>`},
    {id:"tickets",label:"Ticketing System",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M5 7h6M5 10h4"/><circle cx="12.5" cy="4.5" r="2.5" fill="var(--red)" stroke="none"/></svg>`},
  ]},
  {group:"Procurement",items:[
    {id:"replenishment",label:"Replenishment",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 8A5 5 0 1 1 8 3"/><path d="M13 3v5h-5"/></svg>`},
    {id:"amazon",label:"Amazon Purchases",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="12" height="8" rx="2"/><path d="M5 12c1 1.5 5 1.5 6 0"/></svg>`},
    {id:"walmart",label:"Walmart Purchases",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1v14M1 8h14M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>`},
    {id:"emergency",label:"Emergency Shipments",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2L2 14h12L8 2z"/><path d="M8 7v3M8 12h.01"/></svg>`},
  ]},
  {group:"Finance",items:[
    {id:"pnl",label:"P&L per Client",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12l4-4 3 3 5-6"/><circle cx="14" cy="5" r="1.5" fill="currentColor" stroke="none"/></svg>`},
    {id:"liquidations",label:"Liquidations",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v8M5 7l3 3 3-3"/><path d="M3 13h10"/></svg>`},
  ]},
  {group:"Workspace",items:[
    {id:"chat",label:"Team Chat",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h12a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 2V4a1 1 0 011-1z"/><path d="M5 7h6M5 9.5h4"/></svg>`,notif:"chat"},
    {id:"faq",label:"FAQ & Q&A",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M6.3 6a2 2 0 0 1 3.8.7c0 1.3-2.1 2-2.1 2"/><circle cx="8" cy="11.5" r=".5" fill="currentColor" stroke="none"/></svg>`,notif:"faq"},
    {id:"notifications",label:"Notifications",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2a5 5 0 0 1 5 5v2l1 2H2l1-2V7a5 5 0 0 1 5-5z"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0"/></svg>`,notif:"all"},
    {id:"calendar",label:"Calendar",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 3V1m6 2V1M2 7h12"/><path d="M5 10h2M9 10h2M5 13h2"/></svg>`},
    {id:"settings",label:"Settings",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"/></svg>`},
  ]},
  {group:"Operations",items:[
    {id:"brands",label:"Brands",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1l2 4h4l-3 3 1 4-4-2-4 2 1-4L2 5h4z"/></svg>`},
    {id:"clients",label:"Client Sheets",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6h6M5 9h4"/></svg>`},
    {id:"shipping",label:"Shipping Labels",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="5" width="14" height="9" rx="1.5"/><path d="M1 8h14M5 5V3h6v2"/></svg>`},
    {id:"research",label:"Product Research",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="4"/><path d="M10 10l3 3"/></svg>`},
    {id:"reports",label:"Reports",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2h10v12H3z"/><path d="M6 6h4M6 9h4M6 12h2"/></svg>`},
    {id:"photoupload",label:"Photo Upload",icon:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="14" height="10" rx="1.5"/><circle cx="8" cy="9" r="2.5"/><path d="M5 4l1.5-2h3L11 4"/></svg>`},
  ]},
];

// ── Status badge styles ──
const BADGE_STYLES = {
  OK:{bg:"rgba(79,207,142,.12)",color:"#4fcf8e"},LOW:{bg:"rgba(247,201,79,.12)",color:"#f7c94f"},OUT:{bg:"rgba(247,92,92,.12)",color:"#f75c5c"},
  Active:{bg:"rgba(79,207,142,.12)",color:"#4fcf8e"},"On Leave":{bg:"rgba(79,142,247,.12)",color:"#4f8ef7"},Terminated:{bg:"rgba(247,92,92,.12)",color:"#f75c5c"},
  Present:{bg:"rgba(79,207,142,.12)",color:"#4fcf8e"},Late:{bg:"rgba(247,201,79,.12)",color:"#f7c94f"},Absent:{bg:"rgba(247,92,92,.12)",color:"#f75c5c"},"Half Day":{bg:"rgba(251,146,60,.12)",color:"#fb923c"},
  Approved:{bg:"rgba(79,207,142,.12)",color:"#4fcf8e"},Pending:{bg:"rgba(247,201,79,.12)",color:"#f7c94f"},Delivered:{bg:"rgba(79,142,247,.12)",color:"#4f8ef7"},
  "In Transit":{bg:"rgba(167,139,250,.12)",color:"#a78bfa"},Shipped:{bg:"rgba(167,139,250,.12)",color:"#a78bfa"},Processing:{bg:"rgba(247,201,79,.12)",color:"#f7c94f"},
  Complete:{bg:"rgba(79,207,142,.12)",color:"#4fcf8e"},Partial:{bg:"rgba(247,201,79,.12)",color:"#f7c94f"},Rejected:{bg:"rgba(247,92,92,.12)",color:"#f75c5c"},
  Completed:{bg:"rgba(79,142,247,.12)",color:"#4f8ef7"},"Under Review":{bg:"rgba(247,201,79,.12)",color:"#f7c94f"},Dispatched:{bg:"rgba(167,139,250,.12)",color:"#a78bfa"},
  Ordered:{bg:"rgba(79,142,247,.12)",color:"#4f8ef7"},Critical:{bg:"rgba(247,92,92,.12)",color:"#f75c5c"},High:{bg:"rgba(251,146,60,.12)",color:"#fb923c"},
  Medium:{bg:"rgba(247,201,79,.12)",color:"#f7c94f"},Low:{bg:"rgba(79,207,142,.12)",color:"#4fcf8e"},Draft:{bg:"rgba(107,118,148,.12)",color:"#6b7694"},
  Final:{bg:"rgba(79,207,142,.12)",color:"#4fcf8e"},"Under Review":{bg:"rgba(247,201,79,.12)",color:"#f7c94f"},
  Evaluation:{bg:"rgba(247,201,79,.12)",color:"#f7c94f"},Shortlisted:{bg:"rgba(79,142,247,.12)",color:"#4f8ef7"},
  Cancelled:{bg:"rgba(247,92,92,.12)",color:"#f75c5c"},Failed:{bg:"rgba(247,92,92,.12)",color:"#f75c5c"},Returned:{bg:"rgba(251,146,60,.12)",color:"#fb923c"},
  Received:{bg:"rgba(79,207,142,.12)",color:"#4fcf8e"},
};

// ── California Time (America/Los_Angeles) ──
function nowCA(){
  // Returns a plain object with CA date/time parts
  const fmt = new Intl.DateTimeFormat("en-US",{
    timeZone:"America/Los_Angeles",
    year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p=>[p.type,p.value]));
  return {
    year:  parts.year,
    month: parts.month,
    day:   parts.day,
    hour:  parts.hour==="24"?"00":parts.hour,
    minute:parts.minute,
    second:parts.second,
    date:  `${parts.year}-${parts.month}-${parts.day}`,
    time:  `${parts.hour==="24"?"00":parts.hour}:${parts.minute}`,
    ts:    `${parts.year}-${parts.month}-${parts.day} ${parts.hour==="24"?"00":parts.hour}:${parts.minute}:${parts.second}`,
    asDate(){ return new Date(`${this.date}T${this.hour}:${this.minute}:${this.second}`); }
  };
}

const TODAY = nowCA().date;

// ── All data stores ──

