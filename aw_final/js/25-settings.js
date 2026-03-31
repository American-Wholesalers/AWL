// ── 25-settings.js ──

function checkExpiryNotifications(force=false){
  if(!currentUser) return;

  const ca = nowCA();
  const todayStr = ca.date; // e.g. "2026-03-17"

  // Parse any date string to YYYY-MM-DD
  function toISO(s){
    if(!s) return "";
    s = String(s).trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // MM/DD/YYYY
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if(m) return `${m[3]}-${m[1].padStart(2,"0")}-${m[2].padStart(2,"0")}`;
    return s;
  }

  // Simple date math: days between two YYYY-MM-DD strings
  function daysBetween(fromISO, toISO_){
    const a = new Date(fromISO+"T12:00:00");
    const b = new Date(toISO_+"T12:00:00");
    return Math.round((b - a) / 86400000);
  }

  // All items across stores
  const all = [
    ...(DB.inventory||[]).map(i=>({...i,_src:"inventory"})),
    ...(DB.firesale  ||[]).map(i=>({...i,_src:"firesale"})),
    ...(DB.archived  ||[]).map(i=>({...i,_src:"archived"})),
  ];

  let added = 0;
  all.forEach(item=>{
    const iso = toISO(item.expirationDate);
    if(!iso) return;

    const days = daysBetween(todayStr, iso);
    if(days < 0 || days > 30) return; // outside window

    // Deduplicate — skip if already notified today for this item (unless force)
    if(!force){
      const dup = (DB.notifications||[]).find(n=>
        n.type==="expiry" && n.itemId===item.id &&
        n.time && n.time.slice(0,10)===todayStr
      );
      if(dup) return;
    }

    const label = item._src==="firesale"?"🔥 Fire Sale":item._src==="archived"?"📦 Archived":"📋 Inventory";
    DB.notifications = DB.notifications||[];
    DB.notifications.unshift({
      id:uid("NTF"), type:"expiry", itemId:item.id,
      title:`⏰ Expiring in ${days} day${days!==1?"s":""}: ${item.name}`,
      body:`${item.client||"No client"} · Expires ${iso} · ${label} · Qty: ${num(item.qty||0)} ${item.unit||"pcs"}`,
      link: item._src==="firesale"?"firesale":item._src==="archived"?"archived":"inventory",
      time: ca.ts.slice(0,16), read:[], for:"all", daysLeft:days,
    });
    added++;
  });

  if(added > 0){
    refreshNotifBadge();
    buildNav();
    showToast(`⏰ ${added} item${added!==1?"s":""} expiring within 30 days`, "var(--orange)");
  }
}

// ═══════════════════════════════════════════════
//  PAGE: SETTINGS
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
//  PAGE: SETTINGS — Theme & Appearance
// ═══════════════════════════════════════════════

const AW_FONTS = [
  {label:"DM Sans (Default)", value:"'DM Sans', sans-serif"},
  {label:"Inter",             value:"'Inter', sans-serif"},
  {label:"Poppins",           value:"'Poppins', sans-serif"},
  {label:"Roboto",            value:"'Roboto', sans-serif"},
  {label:"Nunito",            value:"'Nunito', sans-serif"},
  {label:"Lato",              value:"'Lato', sans-serif"},
  {label:"Outfit",            value:"'Outfit', sans-serif"},
  {label:"Plus Jakarta Sans", value:"'Plus Jakarta Sans', sans-serif"},
  {label:"Raleway",           value:"'Raleway', sans-serif"},
  {label:"Source Sans 3",     value:"'Source Sans 3', sans-serif"},
];

const AW_THEMES = [
  {id:"dark",        label:"Navy & Red",   bg:"#0d1b3e", sidebar:"#091329", accent:"#e8192c"},
  {id:"navy-deep",   label:"Deep Navy",    bg:"#07122b", sidebar:"#04091c", accent:"#e8192c"},
  {id:"darker",      label:"Deep Dark",    bg:"#020408", sidebar:"#010306", accent:"#4f8ef7"},
  {id:"navy-blue",   label:"Navy Blue",    bg:"#0a0f1e", sidebar:"#070b18", accent:"#6c8ef7"},
  {id:"forest",      label:"Forest",       bg:"#0a1410", sidebar:"#070f0c", accent:"#4fcf8e"},
  {id:"purple",      label:"Purple",       bg:"#0e0a1a", sidebar:"#090718", accent:"#a78bfa"},
  {id:"slate",       label:"Slate",        bg:"#0f1117", sidebar:"#0b0d12", accent:"#60a5fa"},
];



// ═══════════════════════════════════════════════
//  PAGE: PHOTO UPLOAD
// ═══════════════════════════════════════════════
function pagePhotoUpload(){
  if(!DB.photoUploads) DB.photoUploads = [];
  var uploads = DB.photoUploads;
  var hasKey = !!(localStorage.getItem('aw_imgbb_key')||'');

  var rows = '';
  if(uploads.length){
    rows = uploads.slice().reverse().map(function(u){
      var isBase64 = (u.url||'').startsWith('data:');
      var typeTag = isBase64
        ? '<span class="badge" style="background:rgba(247,201,79,.12);color:var(--yellow)">Local</span>'
        : '<span class="badge" style="background:rgba(79,207,142,.12);color:var(--green)">ImgBB</span>';
      return '<tr>'
        +'<td style="padding:8px 12px"><img src="'+u.url+'" style="width:56px;height:56px;object-fit:cover;border-radius:6px;border:1px solid var(--border)"></td>'
        +'<td style="padding:8px 12px;font-size:13px;font-weight:500">'+u.name+'</td>'
        +'<td style="padding:8px 12px;font-size:11px;color:var(--muted)">'+u.size+'</td>'
        +'<td style="padding:8px 12px">'+typeTag+'</td>'
        +'<td style="padding:8px 12px;font-size:11px;color:var(--muted)">'+u.uploadedBy+'</td>'
        +'<td style="padding:8px 12px;font-size:11px;color:var(--muted)">'+u.uploadedAt+'</td>'
        +'<td style="padding:8px 12px">'
          +'<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">'
            +'<input readonly value="'+u.url+'" id="url-'+u.id+'" style="background:#080c14;border:1px solid var(--border);border-radius:6px;padding:5px 10px;color:var(--accent);font-size:11px;font-family:var(--mono);width:220px;outline:none" onclick="this.select()">'
            +'<button class="btn btn-info btn-sm" onclick="copyPhotoUrl(\''+u.id+'\')" >Copy</button>'
            +(isBase64
              ? '<button class="btn btn-ghost btn-sm" onclick="openBase64Photo(\''+u.id+'\')" >Open</button>'
              : '<a href="'+u.url+'" target="_blank" class="btn btn-ghost btn-sm">Open</a>'
            )
            +'<button class="btn btn-danger btn-sm" onclick="deletePhotoUpload(\''+u.id+'\')">✕</button>'
          +'</div>'
        +'</td>'
        +'</tr>';
    }).join('');
  } else {
    rows = '<tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--muted)">No photos uploaded yet</td></tr>';
  }

  var keyVal = localStorage.getItem('aw_imgbb_key')||'';
  var keySection = '<div style="margin-top:14px;padding:12px 14px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:var(--r)">'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
      +'<span style="font-size:14px">🔗</span>'
      +'<div style="font-size:12px;font-weight:600;color:var(--text)">Optional: ImgBB API Key — get a real public URL</div>'
      +(hasKey?'<span class="badge" style="background:rgba(79,207,142,.12);color:var(--green)">✓ Key saved</span>':'<span class="badge" style="background:rgba(247,201,79,.12);color:var(--yellow)">Not set</span>')
    +'</div>'
    +'<div style="font-size:11px;color:var(--muted);margin-bottom:10px">Without a key, images are saved locally (viewable inside this app only). With a key, you get a permanent public URL anyone can open. <a href="https://api.imgbb.com/" target="_blank" style="color:var(--accent)">Get free key →</a></div>'
    +'<div style="display:flex;gap:8px;align-items:center">'
      +'<input class="form-input" type="password" id="pu-apikey" placeholder="Paste ImgBB API key here (optional)" value="'+keyVal+'" style="flex:1;max-width:360px;font-family:var(--mono);font-size:12px">'
      +'<button class="btn btn-ghost btn-sm" onclick="var v=document.getElementById(\'pu-apikey\').value.trim();localStorage.setItem(\'aw_imgbb_key\',v);showToast(v?\'API key saved\':\'Key cleared\',\'var(--green)\');pagePhotoUpload()">Save Key</button>'
      +(hasKey?'<button class="btn btn-danger btn-sm" onclick="localStorage.removeItem(\'aw_imgbb_key\');showToast(\'Key removed\',\'var(--muted)\');pagePhotoUpload()">Remove</button>':'')
    +'</div>'
    +'</div>';

  render('<div>'
    +'<div class="page-header">'
      +'<div>'
        +'<div class="page-title" style="display:flex;align-items:center;gap:10px">'
          +'<span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;background:rgba(79,207,142,.15);border-radius:8px;font-size:18px">📷</span>'
          +'Photo Upload'
        +'</div>'
        +'<div class="page-sub">Upload images instantly · get shareable URLs with optional ImgBB key</div>'
      +'</div>'
    +'</div>'

    +'<div class="card" style="margin-bottom:16px">'
      +'<div class="card-title">📤 Upload Image</div>'

      // Drop zone
      +'<div id="pu-dropzone" '
        +'style="border:2px dashed var(--border);border-radius:var(--r2);padding:2.5rem;text-align:center;cursor:pointer;transition:all .2s;margin-bottom:12px" '
        +'onclick="document.getElementById(\'pu-file\').click()" '
        +'ondragover="event.preventDefault();this.style.borderColor=\'var(--accent)\';this.style.background=\'rgba(200,16,46,.05)\'" '
        +'ondragleave="this.style.borderColor=\'var(--border)\';this.style.background=\'\'" '
        +'ondrop="event.preventDefault();this.style.borderColor=\'var(--border)\';this.style.background=\'\';handlePhotoFiles(event.dataTransfer.files)">'
        +'<div style="font-size:40px;margin-bottom:10px">🖼️</div>'
        +'<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px">Drop images here or click to browse</div>'
        +'<div style="font-size:12px;color:var(--muted);margin-bottom:12px">Supports JPG, PNG, GIF, WebP</div>'
        +'<button class="btn btn-primary" onclick="event.stopPropagation();document.getElementById(\'pu-file\').click()">📁 Choose Files</button>'
      +'</div>'
      +'<input type="file" id="pu-file" accept="image/*" multiple style="display:none" onchange="handlePhotoFiles(this.files)">'

      // Progress
      +'<div id="pu-progress" style="display:none;margin-bottom:12px">'
        +'<div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px" id="pu-status">Processing...</div>'
        +'<div style="background:rgba(255,255,255,.06);border-radius:20px;height:8px;overflow:hidden">'
          +'<div id="pu-bar" style="background:var(--accent);height:100%;width:0%;transition:width .3s;border-radius:20px"></div>'
        +'</div>'
      +'</div>'

      +keySection
    +'</div>'

    // History
    +'<div class="card" style="padding:0;overflow:hidden">'
      +'<div style="padding:10px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">'
        +'<div style="font-size:13px;font-weight:600;color:var(--text)">Upload History <span style="font-size:11px;color:var(--muted);font-weight:400">('+uploads.length+' photos)</span></div>'
        +(uploads.length?'<button class="btn btn-danger btn-sm" onclick="confirm2(\'Clear all upload history?\',clearPhotoHistory)">🗑 Clear All</button>':'')
      +'</div>'
      +'<div class="tbl-wrap"><table>'
        +'<thead><tr><th>Preview</th><th>File Name</th><th>Size</th><th>Type</th><th>Uploaded By</th><th>Date</th><th>URL / Actions</th></tr></thead>'
        +'<tbody>'+rows+'</tbody>'
      +'</table></div>'
    +'</div>'
    +'</div>');
}

function handlePhotoFiles(files){
  if(!files || !files.length) return;
  var arr = Array.from(files);
  var done = 0;
  var apiKey = localStorage.getItem('aw_imgbb_key')||'';
  var prog = document.getElementById('pu-progress');
  var bar = document.getElementById('pu-bar');
  var status = document.getElementById('pu-status');
  if(prog) prog.style.display = 'block';

  function finish(){
    done++;
    if(bar) bar.style.width = Math.round((done/arr.length)*100)+'%';
    if(done === arr.length){
      setTimeout(function(){
        if(prog) prog.style.display = 'none';
        if(bar) bar.style.width = '0%';
        pagePhotoUpload();
      }, 500);
    }
  }

  function saveLocal(file, dataUrl){
    if(!DB.photoUploads) DB.photoUploads = [];
    DB.photoUploads.push({
      id: uid('IMG'),
      name: file.name,
      size: file.size > 1048576 ? (file.size/1048576).toFixed(1)+' MB' : Math.round(file.size/1024)+' KB',
      url: dataUrl,
      uploadedBy: currentUser ? currentUser.name : 'Unknown',
      uploadedAt: nowCA().ts,
    });
    saveToLocalStorage();
    showToast('Saved: '+file.name, 'var(--green)');
  }

  function saveImgBB(file, dataUrl, b64){
    if(status) status.textContent = 'Uploading to ImgBB ('+(done+1)+'/'+arr.length+'): '+file.name;
    var fd = new FormData();
    fd.append('key', apiKey);
    fd.append('image', b64);
    fd.append('name', file.name.replace(/\.[^.]+$/, ''));
    fetch('https://api.imgbb.com/1/upload', {method:'POST', body:fd})
      .then(function(r){ return r.json(); })
      .then(function(data){
        if(data.success){
          if(!DB.photoUploads) DB.photoUploads = [];
          DB.photoUploads.push({
            id: uid('IMG'),
            name: file.name,
            size: file.size > 1048576 ? (file.size/1048576).toFixed(1)+' MB' : Math.round(file.size/1024)+' KB',
            url: data.data.url,
            deleteUrl: data.data.delete_url||'',
            uploadedBy: currentUser ? currentUser.name : 'Unknown',
            uploadedAt: nowCA().ts,
          });
          saveToLocalStorage();
          showToast('Uploaded: '+file.name, 'var(--green)');
        } else {
          showToast('ImgBB failed, saving locally: '+file.name,'var(--yellow)');
          saveLocal(file, dataUrl);
        }
        finish();
      })
      .catch(function(){
        showToast('ImgBB error, saving locally: '+file.name,'var(--yellow)');
        saveLocal(file, dataUrl);
        finish();
      });
  }

  arr.forEach(function(file, idx){
    if(status) status.textContent = 'Processing ('+(idx+1)+'/'+arr.length+'): '+file.name;
    var reader = new FileReader();
    reader.onload = function(e){
      var dataUrl = e.target.result;
      var b64 = dataUrl.split(',')[1];
      if(apiKey){
        saveImgBB(file, dataUrl, b64);
      } else {
        saveLocal(file, dataUrl);
        finish();
      }
    };
    reader.readAsDataURL(file);
  });
}

function openBase64Photo(id){
  var u = (DB.photoUploads||[]).find(function(x){ return x.id===id; });
  if(!u) return;
  openModal(
    '<div class="modal-header"><div class="modal-title">'+u.name+'</div><button class="modal-close" onclick="closeModal()">×</button></div>'
    +'<div style="padding:12px;background:#000;text-align:center">'
      +'<img src="'+u.url+'" style="max-width:100%;max-height:75vh;object-fit:contain;border-radius:6px">'
    +'</div>'
    +'<div class="modal-footer" style="justify-content:flex-end">'
      +'<button class="btn btn-ghost" onclick="closeModal()">Close</button>'
    +'</div>',
    true
  );
}

function copyPhotoUrl(id){
  var input = document.getElementById('url-'+id);
  if(!input) return;
  input.select();
  if(navigator.clipboard){
    navigator.clipboard.writeText(input.value).then(function(){ showToast('URL copied!','var(--green)'); });
  } else {
    document.execCommand('copy');
    showToast('URL copied!','var(--green)');
  }
}

function deletePhotoUpload(id){
  if(!DB.photoUploads) return;
  DB.photoUploads = DB.photoUploads.filter(function(u){ return u.id !== id; });
  saveToLocalStorage();
  showToast('Removed','var(--muted)');
  pagePhotoUpload();
}

function clearPhotoHistory(){
  DB.photoUploads = [];
  saveToLocalStorage();
  showToast('History cleared','var(--muted)');
  pagePhotoUpload();
}



function pageSettings(){
  const ls = k => localStorage.getItem(uKey(k))||"";
  const curFont   = ls("font")   || AW_FONTS[0].value;
  const curTheme  = ls("theme")  || "dark";
  const curAccent = ls("accent") || "#4f8ef7";
  const curBg     = ls("bg")     || "";
  const curRadius = ls("radius") || "10";
  const curSize   = ls("fontsize") || "14";
  const curPic    = ls("profilePic") || "";

  const isAdmin = currentUser?.role==="Admin"||currentUser?.role==="Head";
  const settingsTab = window._settingsTab||"appearance";

  if(isAdmin && settingsTab==="access"){
    return pageAccessControl();
  }
  if(isAdmin && settingsTab==="clients"){
    return pageSettingsClients();
  }

  render(`
  <div>
    <div class="page-header">
      <div>
        <div class="page-title" style="display:flex;align-items:center;gap:10px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;background:rgba(79,142,247,.15);border-radius:8px;font-size:18px">🎨</span>
          Settings
        </div>
        <div class="page-sub">Customize your personal view — changes only apply to your account</div>
      </div>
      <div style="display:flex;gap:8px">
        ${isAdmin?`<button class="btn btn-ghost btn-sm" onclick="window._settingsTab='clients';pageSettings()">👥 Manage Clients</button>`:""}
        ${isAdmin?`<button class="btn btn-ghost btn-sm" onclick="window._settingsTab='access';pageSettings()">🔐 Access Control</button>`:""}
        <button class="btn btn-ghost btn-sm" onclick="resetTheme()">↺ Reset to Default</button>
        <button class="btn btn-primary" onclick="applyAndSaveTheme()">✓ Apply & Save</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">

      <!-- ── Profile Picture ── -->
      <div class="card">
        <div class="card-title">🧑 Profile Picture</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:16px">Your photo appears in the sidebar and chat.</div>
        <div style="display:flex;align-items:center;gap:20px;margin-bottom:16px">
          <!-- Avatar preview -->
          <div id="pic-preview" style="width:80px;height:80px;border-radius:50%;overflow:hidden;border:3px solid var(--accent);flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(200,16,46,.15);font-size:22px;font-weight:700;color:var(--accent)">
            ${curPic
              ? `<img src="${curPic}" style="width:100%;height:100%;object-fit:cover">`
              : `<span>${currentUser?.avatar||"?"}</span>`}
          </div>
          <div style="flex:1">
            <div style="font-weight:600;margin-bottom:4px">${currentUser?.name||""}</div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:10px">${currentUser?.role||""}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-ghost btn-sm" onclick="document.getElementById('pic-upload').click()">📷 Upload Photo</button>
              <input type="file" id="pic-upload" accept="image/*" style="display:none" onchange="loadProfilePic(this)">
              ${curPic?`<button class="btn btn-danger btn-sm" onclick="removeProfilePic()">✕ Remove</button>`:""}
            </div>
          </div>
        </div>
        <div style="font-size:11px;color:var(--dim);line-height:1.6">Accepted: JPG, PNG, GIF · Max 2MB · Will be cropped to a circle</div>
      </div>

      <!-- ── Color Themes ── -->
      <div class="card">
        <div class="card-title">🎨 Color Theme</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
          ${AW_THEMES.map(t=>`
            <div onclick="previewTheme('${t.id}')" id="theme-opt-${t.id}"
              style="cursor:pointer;border-radius:var(--r);overflow:hidden;border:2px solid ${curTheme===t.id?"var(--accent)":"var(--border)"};transition:all .15s"
              onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='${curTheme===t.id?"var(--accent)":"var(--border)"}'">
              <div style="height:40px;background:${t.bg};display:flex;gap:3px;padding:6px">
                <div style="width:26px;background:${t.sidebar};border-radius:4px"></div>
                <div style="flex:1;display:flex;flex-direction:column;gap:2px">
                  <div style="height:6px;background:${t.accent};border-radius:2px;width:70%"></div>
                  <div style="height:4px;background:rgba(255,255,255,.12);border-radius:2px"></div>
                  <div style="height:4px;background:rgba(255,255,255,.08);border-radius:2px;width:80%"></div>
                </div>
              </div>
              <div style="padding:5px 7px;font-size:11px;font-weight:${curTheme===t.id?"700":"500"};color:${curTheme===t.id?"var(--accent)":"var(--muted)"};background:rgba(255,255,255,.03);text-align:center">${t.label}</div>
            </div>`).join("")}
        </div>

        <!-- Accent color picker -->
        <div class="form-group">
          <label class="form-label">Accent Color</label>
          <div style="display:flex;align-items:center;gap:10px">
            <input type="color" id="s-accent" value="${curAccent}"
              oninput="document.getElementById('accent-preview').style.background=this.value"
              style="width:44px;height:36px;border:1px solid var(--border);border-radius:var(--r);background:transparent;cursor:pointer;padding:2px">
            <div id="accent-preview" style="flex:1;height:36px;border-radius:var(--r);background:${curAccent}"></div>
            <div style="display:flex;gap:5px">
              ${["#4f8ef7","#4fcf8e","#f7c94f","#f75c5c","#a78bfa","#4fd1c5","#fb923c","#ec4899"].map(c=>
                `<div onclick="document.getElementById('s-accent').value='${c}';document.getElementById('accent-preview').style.background='${c}'"
                  style="width:20px;height:20px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${curAccent===c?"#fff":"transparent"};transition:border .1s"
                  title="${c}"></div>`
              ).join("")}
            </div>
          </div>
        </div>
      </div>

      <!-- ── Typography ── -->
      <div class="card">
        <div class="card-title">✍️ Typography</div>
        <div class="form-group">
          <label class="form-label">Font Family</label>
          <select id="s-font" class="form-input" onchange="previewFont(this.value)">
            ${AW_FONTS.map(f=>`<option value="${f.value}"${curFont===f.value?" selected":""}>${f.label}</option>`).join("")}
          </select>
          <div style="margin-top:8px;padding:10px 12px;background:rgba(255,255,255,.04);border-radius:var(--r);border:1px solid var(--border)">
            <div id="font-preview" style="font-size:14px;line-height:1.6;font-family:${curFont}">
              The quick brown fox jumps over the lazy dog · American Wholesalers CMS
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Base Font Size — <span id="size-label">${curSize}px</span></label>
          <input type="range" id="s-fontsize" min="12" max="18" step="1" value="${curSize}"
            oninput="document.getElementById('size-label').textContent=this.value+'px';document.getElementById('font-preview').style.fontSize=this.value+'px'"
            style="width:100%;accent-color:var(--accent)">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--dim);margin-top:2px"><span>12px Small</span><span>14px Default</span><span>18px Large</span></div>
        </div>

        <div class="form-group">
          <label class="form-label">Border Radius — <span id="radius-label">${curRadius}px</span></label>
          <input type="range" id="s-radius" min="0" max="20" step="2" value="${curRadius}"
            oninput="document.getElementById('radius-label').textContent=this.value+'px'"
            style="width:100%;accent-color:var(--accent)">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--dim);margin-top:2px"><span>0 Sharp</span><span>10 Default</span><span>20 Rounded</span></div>
        </div>
      </div>

      <!-- ── Notification Sound ── -->
      <div class="card">
        <div class="card-title">🔔 Notification Sound</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Choose the sound played when you receive a new notification.</div>

        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label">Sound</label>
          <div style="display:flex;gap:8px;align-items:center">
            <select id="s-notif-sound" class="form-input" style="flex:1">
              ${[
                {value:"none",    label:"🔇 None (silent)"},
                {value:"ding",    label:"🔔 Ding"},
                {value:"chime",   label:"🎵 Chime"},
                {value:"pop",     label:"💬 Pop"},
                {value:"beep",    label:"📡 Beep"},
                {value:"bell",    label:"🔕 Bell"},
              ].map(s=>`<option value="${s.value}"${(ls("notifSound")||"ding")===s.value?" selected":""}>${s.label}</option>`).join("")}
            </select>
            <button class="btn btn-ghost btn-sm" onclick="previewNotifSound(document.getElementById('s-notif-sound').value)">▶ Test</button>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label">Volume — <span id="vol-label">${ls("notifVolume")||"80"}%</span></label>
          <input type="range" id="s-notif-volume" min="0" max="100" step="5" value="${ls("notifVolume")||"80"}"
            oninput="document.getElementById('vol-label').textContent=this.value+'%'"
            style="width:100%;accent-color:var(--accent)">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--dim);margin-top:2px"><span>0% Off</span><span>50%</span><span>100% Max</span></div>
        </div>

        <div class="form-group">
          <label class="form-label">Play sound for</label>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
            ${[
              {key:"notifSoundAll",    label:"All notifications",         default:true},
              {key:"notifSoundMtg",   label:"Meeting reminders only",    default:false},
              {key:"notifSoundUrgent",label:"Urgent/emergency only",     default:false},
            ].map(opt=>`
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                <input type="radio" name="notifSoundScope" value="${opt.key}"
                  ${(ls("notifSoundScope")||"notifSoundAll")===opt.key?"checked":""}
                  style="accent-color:var(--accent);width:15px;height:15px;cursor:pointer">
                <span style="font-size:13px">${opt.label}</span>
              </label>`).join("")}
          </div>
        </div>

        <button class="btn btn-primary btn-sm" style="margin-top:14px;width:100%" onclick="saveNotifSound()">💾 Save Sound Settings</button>
      </div>

      <!-- ── Background / Wallpaper ── -->
      <div class="card">
        <div class="card-title">🖼️ Background & Wallpaper</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:12px">Upload an image to use as the app background, or choose a gradient.</div>

        <!-- Upload -->
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <button class="btn btn-ghost btn-sm" style="flex:1" onclick="document.getElementById('bg-upload').click()">📷 Upload Image</button>
          <input type="file" id="bg-upload" accept="image/*" style="display:none" onchange="loadBgImage(this)">
          ${curBg?`<button class="btn btn-danger btn-sm" onclick="clearBg()">✕ Remove</button>`:""}
        </div>

        <!-- Preview -->
        <div id="bg-preview" style="height:80px;border-radius:var(--r);border:1px solid var(--border);overflow:hidden;margin-bottom:12px;
          background:${curBg?`url('${curBg}') center/cover no-repeat`:"var(--bg)"};display:flex;align-items:center;justify-content:center">
          ${curBg?"":`<span style="color:var(--dim);font-size:12px">No background set</span>`}
        </div>

        <!-- Gradients -->
        <div class="form-label" style="margin-bottom:8px">Or pick a gradient</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${[
            {label:"None",     v:""},
            {label:"Midnight", v:"linear-gradient(135deg,#0a0c1b 0%,#0f1632 100%)"},
            {label:"Ocean",    v:"linear-gradient(135deg,#0a0f1e 0%,#0d2137 100%)"},
            {label:"Forest",   v:"linear-gradient(135deg,#060f0a 0%,#0a1f12 100%)"},
            {label:"Cosmos",   v:"linear-gradient(135deg,#0a0714 0%,#160a2a 100%)"},
            {label:"Ember",    v:"linear-gradient(135deg,#120608 0%,#1f0d0d 100%)"},
          ].map(g=>`
            <div onclick="setBgGradient('${g.v.replace(/'/g,"\\'")}')" title="${g.label}"
              style="width:44px;height:30px;border-radius:6px;cursor:pointer;border:2px solid var(--border);
                     background:${g.v||"rgba(255,255,255,.06)"};transition:border .1s"
              onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
              ${g.v?"":`<span style="font-size:9px;color:var(--muted);display:flex;align-items:center;justify-content:center;height:100%">None</span>`}
            </div>`).join("")}
        </div>
      </div>

    </div>

    <!-- Live Preview Strip -->
    <div class="card" style="margin-top:16px">
      <div class="card-title">👁️ Live Preview</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <div id="lp-card" style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:var(--r);padding:12px 16px;min-width:160px">
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Sample Card</div>
          <div style="font-size:18px;font-weight:700;color:var(--accent)">1,284</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Total items</div>
        </div>
        <button class="btn btn-primary" style="pointer-events:none">Primary Button</button>
        <button class="btn btn-ghost" style="pointer-events:none">Ghost Button</button>
        <span class="badge" style="background:rgba(79,207,142,.12);color:var(--green)">Active</span>
        <span class="badge" style="background:rgba(247,92,92,.12);color:var(--red)">Out of Stock</span>
        <span class="badge" style="background:rgba(247,201,79,.12);color:var(--yellow)">Low Stock</span>
        <span class="tag">FBA</span>
      </div>

    <!-- ── Change Password ── -->
    <div class="card" style="margin-top:16px">
      <div class="card-title">🔑 Change Password</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:16px">Update your login password. You will need to know your current password.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;max-width:680px">
        <div class="form-group">
          <label class="form-label">Current Password</label>
          <input class="form-input" type="password" id="cp-current" placeholder="Current password" autocomplete="current-password">
        </div>
        <div class="form-group">
          <label class="form-label">New Password</label>
          <input class="form-input" type="password" id="cp-new" placeholder="New password" autocomplete="new-password">
        </div>
        <div class="form-group">
          <label class="form-label">Confirm New Password</label>
          <input class="form-input" type="password" id="cp-confirm" placeholder="Repeat new password" autocomplete="new-password">
        </div>
      </div>
      <div id="cp-error" style="display:none;font-size:12px;color:var(--red);margin-top:8px"></div>
      <button class="btn btn-primary" style="margin-top:14px" onclick="changePassword()">🔑 Update Password</button>
    </div>
    </div>
  </div>`);
}

// ── Theme helpers ──
function previewTheme(id){
  const t = AW_THEMES.find(x=>x.id===id); if(!t) return;
  document.documentElement.style.setProperty("--bg", t.bg);
  document.documentElement.style.setProperty("--sidebar", t.sidebar);
  document.documentElement.style.setProperty("--accent", t.accent);
  document.documentElement.style.setProperty("--accent2", t.accent);
  // Update selected border on theme swatches
  AW_THEMES.forEach(x=>{
    const el=document.getElementById("theme-opt-"+x.id);
    if(el) el.style.borderColor = x.id===id?"var(--accent)":"var(--border)";
  });
  // Store temp selection
  document.getElementById("s-accent").value = t.accent;
  document.getElementById("accent-preview").style.background = t.accent;
  localStorage.setItem("_temp_theme", id);
}

function previewFont(val){
  document.documentElement.style.setProperty("--font", val);
  document.getElementById("font-preview").style.fontFamily = val;
  // Load from Google Fonts if needed
  const name = val.replace(/['"]/g,"").split(",")[0].trim();
  if(!document.querySelector(`[href*="${encodeURIComponent(name)}"]`)){
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@300;400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }
}

// Per-user theme key helper
function uKey(k){ return `aw_u_${currentUser?.username||"default"}_${k}`; }

// ── Change Password ──────────────────────────────────────────
function changePassword(){
  const cur   = document.getElementById("cp-current")?.value||"";
  const nw    = document.getElementById("cp-new")?.value||"";
  const conf  = document.getElementById("cp-confirm")?.value||"";
  const errEl = document.getElementById("cp-error");
  const showErr = msg => { errEl.textContent=msg; errEl.style.display="block"; };
  errEl.style.display="none";

  if(!cur||!nw||!conf){ showErr("Please fill in all three fields."); return; }
  if(!currentUser){ showErr("No user session found."); return; }

  // Verify current password against USERS array
  const userInArr = USERS.find(u=>u.username===currentUser.username);
  const storedPw  = userInArr?.password || currentUser.password;
  if(cur !== storedPw){ showErr("Current password is incorrect."); return; }
  if(nw.length < 6){ showErr("New password must be at least 6 characters."); return; }
  if(nw !== conf){ showErr("New passwords do not match."); return; }

  // Update in USERS array
  if(userInArr) userInArr.password = nw;
  // Update on currentUser session object too
  currentUser.password = nw;
  // Persist to localStorage so it survives refresh
  const pwKey = "aw_pw_" + currentUser.username;
  localStorage.setItem(pwKey, nw);

  // Clear fields
  document.getElementById("cp-current").value = "";
  document.getElementById("cp-new").value = "";
  document.getElementById("cp-confirm").value = "";
  showToast("Password updated successfully ✓", "var(--green)");
}


// ── SETTINGS: MANAGE CLIENTS ──────────────────────────────────
function pageSettingsClients(){
  const platColors={Amazon:"#FF9900",Walmart:"#0071CE",Ebay:"#E53238",AWL:"#4f8ef7"};
  const platIcons={Amazon:"🛒",Walmart:"🛍",Ebay:"🏷",AWL:"🏢"};
  const platF = window._scPlatF||"All";
  const search = window._scSearch||"";

  const rows = DB.clients.filter(c=>{
    const mp = platF==="All"||(c.platform||"AWL")===platF;
    const mq = !search||(c.name||"").toLowerCase().includes(search.toLowerCase())||(c.contact||c.contactPerson||"").toLowerCase().includes(search.toLowerCase());
    return mp&&mq;
  }).sort((a,b)=>(a.name||"").localeCompare(b.name||""));

  render(`
  <div>
    <div class="page-header">
      <div>
        <div class="page-title" style="display:flex;align-items:center;gap:10px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;background:rgba(79,142,247,.15);border-radius:8px;font-size:18px">👥</span>
          Manage Clients
        </div>
        <div class="page-sub">Master client list — feeds every client dropdown across the app</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="window._settingsTab='appearance';pageSettings()">← Back to Settings</button>
        <button class="btn btn-primary" onclick="openSettingsClientModal()">+ Add Client</button>
      </div>
    </div>

    <!-- Platform tabs -->
    <div style="display:flex;gap:0;margin-bottom:1.25rem;border-bottom:2px solid var(--border)">
      ${["All","Amazon","Walmart","Ebay","AWL"].map(p=>{
        const cnt = p==="All" ? DB.clients.length : DB.clients.filter(c=>(c.platform||"AWL")===p).length;
        const col = platColors[p]||"var(--accent)";
        const active = platF===p;
        return `<button onclick="window._scPlatF='${p}';pageSettingsClients()"
          style="padding:9px 22px;background:none;border:none;border-bottom:3px solid ${active?col:"transparent"};
                 color:${active?col:"var(--muted)"};font-size:13px;font-weight:${active?"700":"500"};
                 cursor:pointer;font-family:var(--font);transition:all .15s;margin-bottom:-2px;white-space:nowrap">
          ${p==="All"?"All":(platIcons[p]+" "+p)}
          <span style="margin-left:6px;background:${active?"rgba(255,255,255,.12)":"rgba(255,255,255,.05)"};border-radius:20px;padding:1px 7px;font-size:11px">${cnt}</span>
        </button>`;
      }).join("")}
    </div>

    <!-- Search + stats -->
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input class="search-bar" placeholder="Search client name or contact…"
          value="${search}" oninput="window._scSearch=this.value;pageSettingsClients()"
          style="flex:1;min-width:200px;max-width:320px">
        <div style="display:flex;gap:12px;margin-left:auto">
          ${["Amazon","Walmart","Ebay","AWL"].map(p=>`
            <div style="text-align:center">
              <div style="font-size:16px;font-weight:700;color:${platColors[p]}">${DB.clients.filter(c=>(c.platform||"AWL")===p).length}</div>
              <div style="font-size:10px;color:var(--muted)">${platIcons[p]} ${p}</div>
            </div>`).join("")}
        </div>
      </div>
    </div>

    <!-- Client table -->
    <div class="card" style="padding:0;overflow:hidden">
      <div class="tbl-wrap">
        <table>
          <thead><tr>
            <th>Platform</th>
            <th>Client Name</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Added</th>
            <th></th>
          </tr></thead>
          <tbody>
          ${rows.length===0?`<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--muted)">No clients found</td></tr>`:""}
          ${rows.map(c=>{
            const plat=c.platform||"AWL";
            const col=platColors[plat]||"var(--accent)";
            const icon=platIcons[plat]||"🏢";
            return `<tr>
              <td>
                <select onchange="scSetPlatform('${c.id}',this.value)"
                  style="background:${col}18;border:1.5px solid ${col}40;border-radius:20px;
                         padding:4px 10px;color:${col};font-size:11px;font-weight:700;
                         font-family:var(--font);outline:none;cursor:pointer;appearance:auto">
                  ${["AWL","Amazon","Walmart","Ebay"].map(p=>`
                    <option value="${p}"${plat===p?" selected":""}>${platIcons[p]} ${p}</option>`).join("")}
                </select>
              </td>
              <td style="font-weight:600">${c.name}</td>
              <td style="font-size:12px;color:var(--muted)">${c.contact||c.contactPerson||"—"}</td>
              <td>
                <select onchange="scSetField('${c.id}','status',this.value)"
                  style="background:transparent;border:1px solid var(--border);border-radius:var(--r);
                         padding:3px 6px;font-size:11px;font-family:var(--font);color:var(--text);outline:none;cursor:pointer">
                  ${["Active","Inactive","Suspended"].map(s=>`<option value="${s}"${(c.status||"Active")===s?" selected":""}>${s}</option>`).join("")}
                </select>
              </td>
              <td style="font-size:11px;color:var(--dim)">${c.addedDate||"—"}</td>
              <td>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-info btn-sm" onclick="openSettingsClientModal('${c.id}')">Edit</button>
                  <button class="btn btn-danger btn-sm" onclick="confirm2('Remove ${c.name.replace(/'/g,"&#39;")}?',()=>scDeleteClient('${c.id}'))">✕</button>
                </div>
              </td>
            </tr>`;
          }).join("")}
          </tbody>
        </table>
      </div>
      <div style="padding:8px 14px;font-size:11px;color:var(--dim);border-top:1px solid var(--border)">${rows.length} of ${DB.clients.length} clients</div>
    </div>
  </div>`);
}

function scSetField(id, field, value){
  const c=DB.clients.find(x=>x.id===id); if(!c) return;
  c[field]=value;
  saveToLocalStorage();
  showToast("Saved","var(--green)");
}

function scSetPlatform(id, value){
  const c=DB.clients.find(x=>x.id===id); if(!c) return;
  c.platform=value;
  saveToLocalStorage();
  showToast(`Moved to ${value}`,"var(--green)");
  // Re-render page to update badge colors
  pageSettingsClients();
}

function scDeleteClient(id){
  DB.clients=DB.clients.filter(x=>x.id!==id);
  saveToLocalStorage();
  showToast("Client removed","var(--green)");
  pageSettingsClients();
}

function openSettingsClientModal(id=null){
  const c = id ? DB.clients.find(x=>x.id===id) : null;
  const isNew = !c;
  const platColors={Amazon:"#FF9900",Walmart:"#0071CE",Ebay:"#E53238",AWL:"#4f8ef7"};
  const platIcons={Amazon:"🛒",Walmart:"🛍",Ebay:"🏷",AWL:"🏢"};
  const curPlat = c?.platform||"";

  openModal(`${mHeader(isNew?"Add New Client":"Edit Client")}
  <div class="modal-body">
    <div class="form-grid">
      <div class="form-full"><div class="form-group">
        <label class="form-label">Client Code <span style="color:var(--red)">*</span></label>
        <input class="form-input" id="sc-code" value="${c?.code||c?.id||""}" placeholder="e.g. arc263" ${!isNew?"readonly style='opacity:.6'":""}>
        ${isNew?`<div style="font-size:10px;color:var(--dim);margin-top:3px">Format: arc###, amz##, etc.</div>`:""}
      </div></div>
      <div class="form-full"><div class="form-group">
        <label class="form-label">Contact Name <span style="color:var(--red)">*</span></label>
        <input class="form-input" id="sc-contact" value="${c?.contact||c?.contactPerson||""}" placeholder="e.g. John Smith">
      </div></div>
      <div class="form-full"><div class="form-group">
        <label class="form-label">Platform <span style="color:var(--red)">*</span></label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
          ${["AWL","Amazon","Walmart","Ebay"].map(p=>`
            <button type="button" id="sc-plat-${p}" onclick="scSelectPlatform('${p}')"
              style="padding:7px 18px;border-radius:20px;border:2px solid ${curPlat===p?platColors[p]:"var(--border)"};
                     background:${curPlat===p?platColors[p]+"22":"transparent"};
                     color:${curPlat===p?platColors[p]:"var(--muted)"};
                     font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s">
              ${platIcons[p]} ${p}
            </button>`).join("")}
        </div>
        <input type="hidden" id="sc-platform" value="${curPlat}">
      </div></div>
      <div class="form-full">${mField("Status","sc-status-sel",c?.status||"Active","select","Active,Inactive,Suspended")}</div>
      <div class="form-full">${mField("Industry","sc-industry",c?.industry||"","text","e.g. Consumer Goods")}</div>
    </div>
    <div id="sc-preview" style="margin-top:10px;padding:10px 14px;background:rgba(79,142,247,.06);border:1px solid rgba(79,142,247,.2);border-radius:var(--r);font-size:12px;color:var(--muted)">
      Client name preview: <strong id="sc-name-prev" style="color:var(--text)">${c?.name||"—"}</strong>
    </div>
  </div>
  ${mFooter(`saveSettingsClient('${id||""}')`)}`);

  setTimeout(()=>{
    const codeEl=document.getElementById("sc-code");
    const contactEl=document.getElementById("sc-contact");
    const prev=document.getElementById("sc-name-prev");
    const upd=()=>{ if(prev&&codeEl&&contactEl) prev.textContent=(codeEl.value&&contactEl.value)?codeEl.value+" "+contactEl.value:"—"; };
    codeEl?.addEventListener("input",upd);
    contactEl?.addEventListener("input",upd);
    codeEl?.focus();
  },50);
}

function scSelectPlatform(p){
  const platColors={Amazon:"#FF9900",Walmart:"#0071CE",Ebay:"#E53238",AWL:"#4f8ef7"};
  ["AWL","Amazon","Walmart","Ebay"].forEach(pl=>{
    const btn=document.getElementById("sc-plat-"+pl);
    if(!btn) return;
    const active=pl===p;
    btn.style.borderColor=active?platColors[pl]:"var(--border)";
    btn.style.background=active?platColors[pl]+"22":"transparent";
    btn.style.color=active?platColors[pl]:"var(--muted)";
  });
  const inp=document.getElementById("sc-platform");
  if(inp) inp.value=p;
}

function saveSettingsClient(id){
  const code=(document.getElementById("sc-code")?.value||"").trim();
  const contact=(document.getElementById("sc-contact")?.value||"").trim();
  const platform=(document.getElementById("sc-platform")?.value||"").trim();
  const status=document.getElementById("sc-status-sel")?.value||"Active";
  const industry=(document.getElementById("sc-industry")?.value||"").trim();
  if(!code) return showToast("Client code is required","var(--red)");
  if(!contact) return showToast("Contact name is required","var(--red)");
  if(!platform) return showToast("Please select a platform","var(--red)");
  const fullName=code+" "+contact;
  if(!id){
    if(DB.clients.find(c=>c.id===code||c.name===fullName))
      return showToast("Client already exists","var(--yellow)");
    DB.clients.push({
      id:code, name:fullName, code, contact, contactPerson:contact,
      platform, status, industry,
      addedBy:currentUser.username, addedDate:TODAY,
      sheetUrl:"", sheetTab:"", webhookEnabled:false, lastSync:"", syncStatus:"off", notes:""
    });
  } else {
    const c=DB.clients.find(x=>x.id===id); if(!c) return;
    c.contact=contact; c.contactPerson=contact;
    c.name=c.code+" "+contact;
    c.platform=platform; c.status=status; c.industry=industry;
  }
  saveToLocalStorage();
  closeModal();
  showToast(id?"Client updated":"Client added","var(--green)");
  pageSettingsClients();
}

// ── ACCESS CONTROL PAGE (Admin only) ──────────────────────────
function pageAccessControl(){
  if(!DB.rolePermissions) DB.rolePermissions={};

  const ALL_ROLES = Object.keys(ROLE_ACCESS).filter(r=>r!=="Admin"&&r!=="Head");
  const ALL_PAGES = NAV.flatMap(g=>g.items.map(i=>({id:i.id,label:i.label,group:g.group}))).filter(p=>p.id!=="settings");
  const selRole = window._acRole || ALL_ROLES[0];
  const perms = DB.rolePermissions[selRole] || {};

  // Default access for this role
  const defaultAccess = ROLE_ACCESS[selRole];
  const hasDefault = p => defaultAccess==="all" || (Array.isArray(defaultAccess)&&defaultAccess.includes(p));

  render(`
  <div>
    <div class="page-header">
      <div>
        <div class="page-title" style="display:flex;align-items:center;gap:10px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;background:rgba(247,92,92,.15);border-radius:8px;font-size:18px">🔐</span>
          Access Control
        </div>
        <div class="page-sub">Configure page access and edit permissions per role</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="window._settingsTab='appearance';pageSettings()">← Back to Settings</button>
        <button class="btn btn-danger btn-sm" onclick="resetRolePerms('${selRole}')">↺ Reset Role</button>
        <button class="btn btn-primary" onclick="saveRolePerms()">✓ Save Changes</button>
      </div>
    </div>

    <!-- Role selector tabs -->
    <div style="display:flex;gap:0;margin-bottom:1.25rem;border-bottom:2px solid var(--border);overflow-x:auto">
      ${ALL_ROLES.map(r=>`
        <button onclick="window._acRole='${r}';pageAccessControl()"
          style="padding:9px 18px;background:none;border:none;border-bottom:3px solid ${selRole===r?"var(--accent)":"transparent"};
                 color:${selRole===r?"var(--accent)":"var(--muted)"};font-size:12px;font-weight:${selRole===r?"700":"500"};
                 cursor:pointer;font-family:var(--font);transition:all .15s;margin-bottom:-2px;white-space:nowrap">
          ${r}
        </button>`).join("")}
    </div>

    <!-- Legend -->
    <div style="display:flex;gap:16px;align-items:center;margin-bottom:14px;flex-wrap:wrap">
      <div style="font-size:12px;font-weight:600;color:var(--text)">Permission levels:</div>
      ${[
        ["none",   "No Access",   "var(--border)",               "var(--muted)"],
        ["view",   "View Only",   "rgba(247,201,79,.2)",          "var(--yellow)"],
        ["submit", "View + Submit","rgba(79,142,247,.2)",         "var(--accent)"],
        ["edit",   "Full Edit",   "rgba(79,207,142,.2)",          "var(--green)"],
      ].map(([v,l,bg,col])=>`
        <div style="display:flex;align-items:center;gap:6px">
          <span style="width:14px;height:14px;border-radius:3px;background:${bg};border:1.5px solid ${col};display:inline-block"></span>
          <span style="font-size:12px;color:${col};font-weight:600">${l}</span>
        </div>`).join("")}
      <div style="font-size:11px;color:var(--dim);margin-left:8px">Orange dot = customized from default</div>
    </div>

    <!-- Permissions grid -->
    <div class="card" style="padding:0;overflow:hidden">
      <div style="padding:10px 16px;background:rgba(0,0,0,.2);border-bottom:1px solid var(--border);display:grid;grid-template-columns:1fr 140px 200px;align-items:center;gap:10px">
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">Page</div>
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">Default</div>
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">Custom Permission</div>
      </div>
      ${(() => {
        const groups = [...new Set(ALL_PAGES.map(p=>p.group))];
        return groups.map(grp=>{
          const pages = ALL_PAGES.filter(p=>p.group===grp);
          return `
          <div style="background:rgba(0,0,0,.1);padding:6px 16px;font-size:10px;font-weight:700;
                      text-transform:uppercase;letter-spacing:.1em;color:var(--dim);border-bottom:1px solid var(--border)">
            ${grp}
          </div>
          ${pages.map(p=>{
            const current = perms[p.id];
            const def = hasDefault(p.id) ? "edit" : "none";
            const display = current!==undefined ? current : def;
            const changed = current!==undefined && current!==def;
            return `
            <div style="display:grid;grid-template-columns:1fr 140px 200px;align-items:center;gap:10px;
                        padding:10px 16px;border-bottom:1px solid var(--border);
                        ${changed?"background:rgba(247,160,60,.04)":""}">
              <div style="display:flex;align-items:center;gap:8px">
                ${changed?`<span style="width:7px;height:7px;border-radius:50%;background:var(--orange);flex-shrink:0"></span>`:`<span style="width:7px;height:7px;border-radius:50%;flex-shrink:0"></span>`}
                <span style="font-size:13px;font-weight:500">${p.label.replace("🔥 ","")}</span>
              </div>
              <div>
                <span class="badge" style="background:${def==="edit"?"rgba(79,207,142,.15)":"rgba(107,118,148,.12)"};color:${def==="edit"?"var(--green)":"var(--muted)"}">
                  ${def==="edit"?"Edit":"No Access"}
                </span>
              </div>
              <div style="display:flex;gap:4px" id="perm-btns-${p.id}">
                ${["none","view","submit","edit"].map(v=>`
                  <button onclick="setPermBtn('${selRole}','${p.id}','${v}')"
                    id="perm-btn-${p.id}-${v}"
                    style="padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;
                           font-family:var(--font);transition:all .15s;
                           background:${display===v?(v==="none"?"rgba(247,92,92,.2)":v==="view"?"rgba(247,201,79,.2)":v==="submit"?"rgba(79,142,247,.2)":"rgba(79,207,142,.2)"):"rgba(255,255,255,.05)"};
                           color:${display===v?(v==="none"?"var(--red)":v==="view"?"var(--yellow)":v==="submit"?"var(--accent)":"var(--green)"):"var(--muted)"};
                           border:1.5px solid ${display===v?(v==="none"?"rgba(247,92,92,.4)":v==="view"?"rgba(247,201,79,.4)":v==="submit"?"rgba(79,142,247,.4)":"rgba(79,207,142,.4)"):"var(--border)"}">
                    ${v==="none"?"✕ None":v==="view"?"👁 View":v==="submit"?"📝 Submit":"✏ Edit"}
                  </button>`).join("")}
              </div>
            </div>`;
          }).join("")}`;
        }).join("");
      })()}
    </div>

    <!-- Bulk actions -->
    <div class="card" style="margin-top:12px;padding:12px 16px">
      <div style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--text)">Bulk Actions for <strong style="color:var(--accent)">${selRole}</strong></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="bulkSetPerms('${selRole}','edit')">✏ Set All Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="bulkSetPerms('${selRole}','submit')">📝 Set All Submit</button>
        <button class="btn btn-ghost btn-sm" onclick="bulkSetPerms('${selRole}','view')">👁 Set All View Only</button>
        <button class="btn btn-danger btn-sm" onclick="bulkSetPerms('${selRole}','none')">✕ Remove All Access</button>
        <button class="btn btn-ghost btn-sm" onclick="resetRolePerms('${selRole}')">↺ Reset to Default</button>
      </div>

    <!-- Tab Access -->
    <div class="card" style="margin-top:12px;padding:0;overflow:hidden">
      <div style="padding:10px 16px;background:rgba(0,0,0,.2);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">
        <span style="font-size:15px">🗂</span>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--text)">Tab Access</div>
          <div style="font-size:11px;color:var(--muted);margin-top:1px">Control which tabs within a page this role can see. All tabs shown by default.</div>
        </div>
      </div>
      ${Object.entries(PAGE_TABS).map(([pageId, tabs])=>{
        const roleTabPerms = ((DB.tabPermissions||{})[selRole]||{})[pageId];
        const allowedTabs = roleTabPerms || tabs.map(t=>t.id);
        const pageLabel = {brands:"Brands",replenishment:"Replenishment",emergency:"Emergency"}[pageId]||pageId;
        return `<div style="padding:12px 16px;border-bottom:1px solid var(--border)">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:10px">${pageLabel}</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${tabs.map(t=>{
              const on = allowedTabs.includes(t.id);
              return `<button
                onclick="toggleTabPerm('${selRole}','${pageId}','${t.id}')"
                id="tabperm-${selRole}-${pageId}-${t.id}"
                style="padding:5px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s;
                  background:${on?'rgba(79,207,142,.15)':'rgba(255,255,255,.05)'};
                  color:${on?'var(--green)':'var(--muted)'};
                  border:1.5px solid ${on?'rgba(79,207,142,.4)':'var(--border)'}">
                ${on?'✓':'✕'} ${t.label}
              </button>`;
            }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>
    </div>
  </div>`);
}

function setPermBtn(role, page, value){
  if(!DB.rolePermissions) DB.rolePermissions={};
  if(!DB.rolePermissions[role]) DB.rolePermissions[role]={};

  // Get default
  const defaultAccess = ROLE_ACCESS[role];
  const def = defaultAccess==="all"||(Array.isArray(defaultAccess)&&defaultAccess.includes(page)) ? "edit" : "none";

  if(value===def){
    // Same as default — remove custom override
    delete DB.rolePermissions[role][page];
  } else {
    DB.rolePermissions[role][page] = value;
  }

  // Update button visuals in-place without full re-render
  ["none","view","submit","edit"].forEach(v=>{
    const btn = document.getElementById(`perm-btn-${page}-${v}`);
    if(!btn) return;
    const active = value===v;
    const colors = {
      none:   {bg:"rgba(247,92,92,.2)",  color:"var(--red)",    border:"rgba(247,92,92,.4)"},
      view:   {bg:"rgba(247,201,79,.2)", color:"var(--yellow)", border:"rgba(247,201,79,.4)"},
      submit: {bg:"rgba(79,142,247,.2)", color:"var(--accent)", border:"rgba(79,142,247,.4)"},
      edit:   {bg:"rgba(79,207,142,.2)", color:"var(--green)",  border:"rgba(79,207,142,.4)"},
    };
    btn.style.background   = active ? colors[v].bg     : "rgba(255,255,255,.05)";
    btn.style.color        = active ? colors[v].color  : "var(--muted)";
    btn.style.borderColor  = active ? colors[v].border : "var(--border)";
  });
  // Show/hide changed dot
  const row = document.getElementById(`perm-btns-${page}`)?.closest("div[style*='grid']");
  const dot = row?.querySelector("span[style*='border-radius:50%']");
  const changed = DB.rolePermissions[role][page]!==undefined;
  if(dot) dot.style.background = changed?"var(--orange)":"transparent";
}

function bulkSetPerms(role, value){
  if(!DB.rolePermissions) DB.rolePermissions={};
  if(!DB.rolePermissions[role]) DB.rolePermissions[role]={};
  const ALL_PAGES = NAV.flatMap(g=>g.items.map(i=>i.id)).filter(id=>id!=="settings");
  ALL_PAGES.forEach(page=>{
    const defaultAccess = ROLE_ACCESS[role];
    const def = defaultAccess==="all"||(Array.isArray(defaultAccess)&&defaultAccess.includes(page)) ? "edit" : "none";
    if(value===def) delete DB.rolePermissions[role][page];
    else DB.rolePermissions[role][page] = value;
  });
  pageAccessControl();
}

function resetRolePerms(role){
  if(DB.rolePermissions) delete DB.rolePermissions[role];
  showToast(`${role} permissions reset to default`,"var(--green)");
  pageAccessControl();
}

function saveRolePerms(){
  saveToLocalStorage();
  showToast("Access permissions saved","var(--green)");
  buildNav();
  pageAccessControl();
}

function toggleTabPerm(role, pageId, tabId){
  if(!DB.tabPermissions) DB.tabPermissions={};
  if(!DB.tabPermissions[role]) DB.tabPermissions[role]={};
  const tabs = PAGE_TABS[pageId];
  if(!tabs) return;
  // If no restriction yet, all are allowed — set full list first then toggle
  if(!DB.tabPermissions[role][pageId]){
    DB.tabPermissions[role][pageId] = tabs.map(t=>t.id);
  }
  const allowed = DB.tabPermissions[role][pageId];
  const idx = allowed.indexOf(tabId);
  if(idx>=0){
    // Prevent removing the last tab
    if(allowed.length<=1){ showToast("At least one tab must remain accessible","var(--yellow)"); return; }
    allowed.splice(idx,1);
  } else {
    allowed.push(tabId);
  }
  // If all tabs allowed, remove restriction entirely (same as default)
  if(allowed.length===tabs.length) delete DB.tabPermissions[role][pageId];
  saveToLocalStorage();
  // Update button visuals in-place
  const btn = document.getElementById("tabperm-"+role+"-"+pageId+"-"+tabId);
  const on = !allowed || allowed.includes(tabId);
  if(btn){
    btn.style.background = on?"rgba(79,207,142,.15)":"rgba(255,255,255,.05)";
    btn.style.color      = on?"var(--green)":"var(--muted)";
    btn.style.borderColor= on?"rgba(79,207,142,.4)":"var(--border)";
    btn.textContent      = (on?"✓ ":"✕ ") + tabs.find(t=>t.id===tabId)?.label;
  }
  showToast("Tab access updated","var(--green)");
}

function applyAndSaveTheme(){
  const themeId = localStorage.getItem("_temp_theme") || localStorage.getItem(uKey("theme")) || "dark";
  const accent  = document.getElementById("s-accent")?.value   || "#4f8ef7";
  const font    = document.getElementById("s-font")?.value     || AW_FONTS[0].value;
  const size    = document.getElementById("s-fontsize")?.value || "14";
  const radius  = document.getElementById("s-radius")?.value   || "10";

  // Apply CSS vars
  document.documentElement.style.setProperty("--accent",  accent);
  document.documentElement.style.setProperty("--accent2", accent);
  document.documentElement.style.setProperty("--font",    font);
  document.body.style.fontSize = size+"px";
  document.documentElement.style.setProperty("--r",  radius+"px");
  document.documentElement.style.setProperty("--r2", (Number(radius)+4)+"px");
  document.documentElement.style.setProperty("--r3", (Number(radius)+10)+"px");

  const t = AW_THEMES.find(x=>x.id===themeId)||AW_THEMES[0];
  document.documentElement.style.setProperty("--bg",      t.bg);
  document.documentElement.style.setProperty("--sidebar", t.sidebar);

  // Save per-user
  localStorage.setItem(uKey("theme"),    themeId);
  localStorage.setItem(uKey("accent"),   accent);
  localStorage.setItem(uKey("font"),     font);
  localStorage.setItem(uKey("fontsize"), size);
  localStorage.setItem(uKey("radius"),   radius);
  localStorage.removeItem("_temp_theme");

  previewFont(font);
  showToast("✓ Theme saved — applies only to your account", "var(--green)");
  pageSettings();
}

function resetTheme(){
  [uKey("theme"),uKey("accent"),uKey("font"),uKey("fontsize"),uKey("radius"),uKey("bg"),"_temp_theme"].forEach(k=>localStorage.removeItem(k));
  applyStoredTheme();
  showToast("Theme reset to default", "var(--muted)");
  pageSettings();
}

// ── Profile Picture ─────────────────────────────────────────────────────────
function loadProfilePic(input){
  const file = input.files[0]; if(!file) return;
  if(file.size > 2*1024*1024){ showToast("Image must be under 2MB","var(--red)"); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    localStorage.setItem(uKey("profilePic"), dataUrl);
    // Update current user object
    if(currentUser) currentUser.profilePic = dataUrl;
    // Update sidebar avatar immediately
    updateSidebarAvatar();
    showToast("Profile picture updated ✓","var(--green)");
    pageSettings();
  };
  reader.readAsDataURL(file);
  input.value="";
}

function removeProfilePic(){
  localStorage.removeItem(uKey("profilePic"));
  if(currentUser) delete currentUser.profilePic;
  updateSidebarAvatar();
  showToast("Profile picture removed","var(--muted)");
  pageSettings();
}

function updateSidebarAvatar(){
  const pic = currentUser ? localStorage.getItem(uKey("profilePic")) : null;
  const el  = document.getElementById("sb-avatar");
  if(!el) return;
  if(pic){
    el.innerHTML = `<img src="${pic}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    el.textContent = "";
  } else {
    el.innerHTML = "";
    el.textContent = currentUser?.avatar || "?";
  }
}

// ── Notification Sound ──────────────────────────────────────────────────────
function saveNotifSound(){
  const sound  = document.getElementById("s-notif-sound")?.value  || "ding";
  const volume = document.getElementById("s-notif-volume")?.value || "80";
  const scope  = document.querySelector('[name="notifSoundScope"]:checked')?.value || "notifSoundAll";
  localStorage.setItem(uKey("notifSound"),  sound);
  localStorage.setItem(uKey("notifVolume"), volume);
  localStorage.setItem(uKey("notifSoundScope"), scope);
  showToast("Sound settings saved ✓","var(--green)");
  previewNotifSound(sound);
}

function previewNotifSound(sound){ playNotifSound(sound, true); }

function playNotifSound(sound, force=false){
  if(!sound||sound==="none") return;
  const scope  = localStorage.getItem(uKey("notifSoundScope"))||"notifSoundAll";
  if(!force && scope!=="notifSoundAll") return; // handled separately for scoped sounds
  const volume = Number(localStorage.getItem(uKey("notifVolume"))||80)/100;
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const g   = ctx.createGain();
    g.gain.value = volume;
    g.connect(ctx.destination);

    const sounds = {
      ding: ()=>{ // single high ping
        const o=ctx.createOscillator(); o.type="sine"; o.frequency.setValueAtTime(1040,ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(800,ctx.currentTime+0.15);
        g.gain.setValueAtTime(volume,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4);
        o.connect(g); o.start(); o.stop(ctx.currentTime+0.4);
      },
      chime: ()=>{ // two-tone chime
        [880,1100].forEach((freq,i)=>{
          const o=ctx.createOscillator(); o.type="sine"; o.frequency.value=freq;
          const gn=ctx.createGain(); gn.gain.setValueAtTime(0,ctx.currentTime+i*0.18);
          gn.gain.linearRampToValueAtTime(volume*0.8,ctx.currentTime+i*0.18+0.05);
          gn.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.18+0.5);
          o.connect(gn); gn.connect(ctx.destination); o.start(ctx.currentTime+i*0.18); o.stop(ctx.currentTime+i*0.18+0.55);
        });
      },
      pop: ()=>{ // short soft pop
        const o=ctx.createOscillator(); o.type="sine"; o.frequency.setValueAtTime(400,ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(200,ctx.currentTime+0.08);
        g.gain.setValueAtTime(volume*0.7,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.15);
        o.connect(g); o.start(); o.stop(ctx.currentTime+0.15);
      },
      beep: ()=>{ // double beep
        [0,0.2].forEach(delay=>{
          const o=ctx.createOscillator(); o.type="square"; o.frequency.value=600;
          const gn=ctx.createGain(); gn.gain.setValueAtTime(volume*0.3,ctx.currentTime+delay);
          gn.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+delay+0.12);
          o.connect(gn); gn.connect(ctx.destination); o.start(ctx.currentTime+delay); o.stop(ctx.currentTime+delay+0.13);
        });
      },
      bell: ()=>{ // bell with harmonics
        [440,880,1320].forEach((freq,i)=>{
          const o=ctx.createOscillator(); o.type="sine"; o.frequency.value=freq;
          const gn=ctx.createGain(); gn.gain.setValueAtTime(volume*(0.6-i*0.15),ctx.currentTime);
          gn.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.8-i*0.1);
          o.connect(gn); gn.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+0.85);
        });
      },
    };
    (sounds[sound]||sounds.ding)();
  } catch(e){ /* AudioContext not available */ }
}

// Called by showToast/pushNotif to auto-play based on user prefs
function maybePlayNotifSound(type=""){
  const sound  = localStorage.getItem(uKey("notifSound"))||"ding";
  const scope  = localStorage.getItem(uKey("notifSoundScope"))||"notifSoundAll";
  if(sound==="none") return;
  if(scope==="notifSoundAll") { playNotifSound(sound,true); return; }
  if(scope==="notifSoundMtg"    && type==="meeting")   { playNotifSound(sound,true); return; }
  if(scope==="notifSoundUrgent" && type==="emergency") { playNotifSound(sound,true); return; }
}

function loadBgImage(input){
  const file=input.files[0]; if(!file) return;
  if(file.size>5*1024*1024){ showToast("Image must be under 5MB","var(--red)"); return; }
  const reader=new FileReader();
  reader.onload=e=>{
    const dataUrl=e.target.result;
    localStorage.setItem(uKey("bg"), dataUrl);
    applyBg(dataUrl);
    const prev=document.getElementById("bg-preview");
    if(prev){ prev.style.background=`url('${dataUrl}') center/cover no-repeat`; prev.innerHTML=""; }
    showToast("Background image set ✓","var(--green)");
    pageSettings();
  };
  reader.readAsDataURL(file);
  input.value="";
}

function setBgGradient(v){
  localStorage.setItem(uKey("bg"), v);
  applyBg(v);
  const prev=document.getElementById("bg-preview");
  if(prev){ prev.style.background=v||"var(--bg)"; prev.innerHTML=v?"":`<span style="color:var(--dim);font-size:12px">No background set</span>`; }
}

function clearBg(){
  localStorage.removeItem(uKey("bg"));
  document.getElementById("app").style.background="";
  document.getElementById("app").style.backgroundImage="";
  showToast("Background removed","var(--muted)");
  pageSettings();
}

function applyBg(v){
  if(!v) return;
  const app=document.getElementById("app");
  if(v.startsWith("data:")||v.startsWith("http")){
    app.style.backgroundImage=`url('${v}')`;
    app.style.backgroundSize="cover";
    app.style.backgroundPosition="center";
    app.style.backgroundAttachment="fixed";
    app.style.background="";
  } else {
    app.style.backgroundImage="";
    app.style.background=v;
  }
}

// Apply stored theme for current user — called after login
function pagePurchases(){
  const poSearch=(window._poSearch)||"";
  const poStatusF=(window._poStatusF)||"All";
  const _poStatusF = window._poStatusF||"All";
  const poRows=DB.purchases.filter(p=>{
    const ms=poStatusF==="All"||p.status===poStatusF;
    const mq=!poSearch||(p.vendor||"").toLowerCase().includes(poSearch.toLowerCase())||(p.id||"").toLowerCase().includes(poSearch.toLowerCase());
    return ms&&mq;
  });
  render(`
  <div>
    <div class="page-header"><div><div class="page-title">Purchase Orders</div><div class="page-sub">${DB.purchases.length} orders</div></div><button class="btn btn-primary" onclick="openPOModal()">+ New PO</button></div>
    <div class="card" style="margin-bottom:12px;padding:.85rem 1.1rem"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><input class="search-bar" placeholder="Search vendor or PO number..." value="${poSearch}" oninput="window.poSearch=this.value;pagePurchases()" style="flex:1;min-width:200px;max-width:300px"><span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--dim)">Status:</span><div style="display:flex;gap:5px;flex-wrap:wrap">${['All', 'Pending', 'Approved', 'In Transit', 'Delivered', 'Cancelled'].map(s=>`<button class="filter-pill${_poStatusF===s?" active":""}" onclick="window._poStatusF='${s}';pagePurchases()">${s}</button>`).join("")}</div></div></div>
    <div class="metrics metrics-4">
      ${metric("Total POs",DB.purchases.length,"","var(--accent)")}
      ${metric("Pending",DB.purchases.filter(p=>p.status==="Pending").length,"","var(--yellow)")}
      ${metric("Total Value","₱"+((DB.purchases.reduce((a,p)=>a+p.amount,0))/1000).toFixed(0)+"K","","var(--green)")}
      ${metric("Delivered",DB.purchases.filter(p=>p.status==="Delivered").length,"","var(--accent)")}
    </div>
    <div class="card"><div class="tbl-wrap"><table>
      <thead><tr><th>PO Number</th><th>Vendor</th><th>Items</th><th>Amount (₱)</th><th>Requestor</th><th>Date</th><th>Status</th><th></th></tr></thead>
      <tbody>${DB.purchases.map(po=>`<tr>
        <td class="mono" style="color:var(--accent)">${po.id}</td><td class="fw6">${po.vendor}</td>
        <td class="text-muted">${po.items}</td><td class="fw6">${num(po.amount)}</td>
        <td class="text-muted">${po.requestor}</td><td class="text-muted">${po.date}</td>
        <td>${badge(po.status)}</td>
        <td><button class="btn btn-info btn-sm" onclick='openPOModal(${JSON.stringify(po).replace(/'/g,"&#39;")})'>Edit</button></td>
      </tr>`).join("")}</tbody>
    </table></div></div>
  </div>`);
}

function openPOModal(po=null){
  const isNew=!po;
  po=po||{id:"",vendor:"",items:"",amount:"",status:"Pending",date:TODAY,requestor:"",client:""};
  openModal(`${mHeader(isNew?"New PO":"Edit PO")}
  <div class="modal-body"><div class="form-grid">
    <div class="form-full">${mField("Vendor / Supplier","vendor",po.vendor,"text","",true)}</div>
    <div class="form-full">${clientSelect("client",po.client||"")}</div>
    ${mField("Requestor","requestor",po.requestor,"text","e.g. L. Mendoza",true)}
    ${mField("Date","date",po.date,"date")}
    ${mField("No. of Items","items",po.items,"number")}
    ${mField("Total Amount (₱)","amount",po.amount,"number","",true)}
    ${mField("Status","status",po.status,"select","Pending,Approved,In Transit,Delivered,Cancelled")}
  </div></div>
  ${mFooter("savePO('"+po.id+"')",po.id?"confirm2('Delete this PO?',()=>delRecord('purchases','"+po.id+"'))":"")}`);
}

function savePO(id){
  if(!mVal("vendor")||!mVal("requestor")||!mVal("amount")){showToast("Vendor, Requestor and Amount required.","var(--red)");return;}
  const rec={id:id||"PO-"+nowCA().year+"-"+String(Date.now()).slice(-4),vendor:mVal("vendor"),client:mVal("client"),items:Number(mVal("items"))||0,amount:Number(mVal("amount")),status:mVal("status"),date:mVal("date"),requestor:mVal("requestor")};
  upsert("purchases",rec); closeModal(); triggerWebhook("purchase.updated",rec); pagePurchases();
}

// ═══════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════
(function(){
  // Load saved DB from localStorage
  var saved = localStorage.getItem('aw_db');
  if(saved){
    try{
      var d = JSON.parse(saved);
      Object.keys(d).forEach(function(k){ if(DB[k]!==undefined) DB[k] = d[k]; });
    } catch(e){}
  }
  // Apply saved theme
  try{ applyStoredTheme(); } catch(e){}
  // Show login screen
  document.getElementById('login-user').focus();
  showSignIn();
})();




