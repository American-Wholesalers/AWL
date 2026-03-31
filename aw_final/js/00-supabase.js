const SUPABASE_URL  = 'https://irdtbtsrlisgavcvpkcg.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZHRidHNybGlzZ2F2Y3Zwa2NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODQ2OTQsImV4cCI6MjA5MDU2MDY5NH0.jNIKkktgpTEU0T6_TzjTMZIKv_xQvT3Pa4XIstaq6SE';

const SB = {
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON,
    'Authorization': 'Bearer ' + SUPABASE_ANON,
    'Prefer': 'return=representation'
  },
  url(table){ return SUPABASE_URL + '/rest/v1/' + table; },
  async select(table, query=''){
    const r = await fetch(SB.url(table) + (query?'?'+query:''), { headers: SB.headers });
    if(!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async upsert(table, row){
    const r = await fetch(SB.url(table), {
      method: 'POST',
      headers: { ...SB.headers, 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(row)
    });
    if(!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async update(table, id, data){
    const r = await fetch(SB.url(table) + '?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: SB.headers,
      body: JSON.stringify(data)
    });
    if(!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async delete(table, id){
    const r = await fetch(SB.url(table) + '?id=eq.' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: SB.headers
    });
    if(!r.ok) throw new Error(await r.text());
    return true;
  },
  subscribe(table, callback){
    const ws = new WebSocket(
      SUPABASE_URL.replace('https','wss') + '/realtime/v1/websocket?apikey=' + SUPABASE_ANON + '&vsn=1.0.0'
    );
    ws.onopen = () => {
      ws.send(JSON.stringify({ topic: 'realtime:public:'+table, event: 'phx_join', payload: {}, ref: '1' }));
    };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if(msg.event === 'UPDATE' || msg.event === 'INSERT' || msg.event === 'DELETE'){
        callback(msg.event, msg.payload?.record);
      }
    };
    return ws;
  }
};

const toSnake = obj => {
  if(Array.isArray(obj)) return obj.map(toSnake);
  if(obj===null||typeof obj!=='object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k,v])=>[
      k.replace(/([A-Z])/g,m=>'_'+m.toLowerCase()),
      Array.isArray(v) ? v : (v!==null&&typeof v==='object') ? toSnake(v) : v
    ])
  );
};

const toCamel = obj => {
  if(Array.isArray(obj)) return obj.map(toCamel);
  if(obj===null||typeof obj!=='object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k,v])=>[
      k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),
      Array.isArray(v) ? v : (v!==null&&typeof v==='object') ? toCamel(v) : v
    ])
  );
};

const TABLE_MAP = {
  employees:       'employees',
  inventory:       'inventory',
  attendance:      'attendance',
  replenishment:   'replenishment',
  warehouse:       'warehouse',
  purchases:       'purchases',
  amazon:          'amazon',
  walmart:         'walmart',
  emergency:       'emergency',
  pnl:             'pnl',
  liquidations:    'liquidations',
  meetings:        'meetings',
  tickets:         'tickets',
  shipping:        'shipping',
  research:        'research',
  clients:         'clients',
  csAssignments:   'cs_assignments',
  notifications:   'notifications',
  chat:            'chat',
  faq:             'faq',
  brands:          'brands',
  brandsFuture:    'brands_future',
  brandsSpoke:     'brands_spoke',
  brandsMonthly:   'brands_monthly',
  brandsTradeShows:'brands_tradeshows',
  photoUploads:    'photo_uploads',
  firesale:        'firesale',
  archived:        'archived',
};

async function loadFromSupabase(){
  showToast('Loading data from cloud...', 'var(--accent)');
  try {
    const tables = Object.keys(TABLE_MAP);
    const results = await Promise.all(
      tables.map(t => SB.select(TABLE_MAP[t])
        .then(rows => ({ t, rows }))
        .catch(e => { console.warn('Failed to load '+t, e); return {t, rows:[]}; }))
    );
    results.forEach(({t, rows}) => {
      DB[t] = rows.map(toCamel);
    });
    try {
      const perms = await SB.select('role_permissions');
      DB.rolePermissions = {};
      DB.tabPermissions  = {};
      perms.forEach(p => {
        if(p.permissions)     DB.rolePermissions[p.role] = p.permissions;
        if(p.tab_permissions) DB.tabPermissions[p.role]  = p.tab_permissions;
      });
    } catch(e){ console.warn('permissions load failed', e); }
    showToast('Data loaded from cloud', 'var(--green)');
  } catch(e){
    console.error('Supabase load failed:', e);
    showToast('Cloud load failed - using local data', 'var(--yellow)');
  }
}

async function saveToSupabase(tableName, record){
  const sbTable = TABLE_MAP[tableName];
  if(!sbTable) return;
  try {
    await SB.upsert(sbTable, toSnake(record));
  } catch(e){
    console.error('Supabase save failed for '+tableName+':', e);
  }
}

async function deleteFromSupabase(tableName, id){
  const sbTable = TABLE_MAP[tableName];
  if(!sbTable) return;
  try {
    await SB.delete(sbTable, id);
  } catch(e){
    console.error('Supabase delete failed:', e);
  }
}

window.saveToLocalStorage = function(){
  try {
    localStorage.setItem('aw_db', JSON.stringify(DB));
    localStorage.setItem('aw_last_save', (typeof nowCA==='function') ? nowCA().ts : new Date().toISOString());
  } catch(e){}
};

const _origUpsert = window.upsert;
window.upsert = function(table, rec){
  if(_origUpsert) _origUpsert(table, rec);
  saveToSupabase(table, rec);
};

const _origDelRecord = window.delRecord;
window.delRecord = function(table, id){
  if(_origDelRecord) _origDelRecord(table, id);
  deleteFromSupabase(table, id);
};

window.initSupabase = async function(){
  await loadFromSupabase();
};

console.log('Supabase ready');
