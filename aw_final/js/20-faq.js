// ── 20-faq.js ──

function pageFAQ(){
  const _faqSelected = window._faqSelected||null;

  const search=(window._faqSearch)||"";
  const faqFilter=(window._faqFilter)||"All";
  const _faqFilter = window._faqFilter||"All";
  const cat=(window._faqCat)||"All";
  const _faqCat = window._faqCat||"All";
  const view=(window._faqView)||"list"; // list | detail
  const _faqView = window._faqView||"list";
  if(view==="detail"&&window._faqSelected) return renderFAQDetail(window._faqSelected);

  const rows=DB.faq.filter(q=>{
    const mf=faqFilter==="All"||faqFilter==="Answered"&&q.answers&&q.answers.length>0||faqFilter==="Unanswered"&&(!q.answers||q.answers.length===0)||faqFilter==="My Questions"&&q.authorId===currentUser?.id;
    return mf&&(cat==="All"||q.category===cat)&&(!search||q.question.toLowerCase().includes(search.toLowerCase())||q.askedBy.toLowerCase().includes(search.toLowerCase()));
  });

  render(`
  <div>
    <div class="page-header">
      <div><div class="page-title">FAQ & Q&A</div><div class="page-sub">Community knowledge base · ${DB.faq.length} questions</div></div>
      <button class="btn btn-primary" onclick="openAskModal()">+ Ask a Question</button>
    </div>

    <!-- Stats row -->
    <div class="metrics metrics-4" style="margin-bottom:1rem">
      ${metric("Total Questions",DB.faq.length,"","var(--accent)")}
      ${metric("Answered",DB.faq.filter(q=>q.status==="Answered").length,"","var(--green)")}
      ${metric("Open",DB.faq.filter(q=>q.status==="Open").length,"Waiting for answers","var(--yellow)")}
      ${metric("Total Answers",DB.faq.reduce((a,q)=>a+q.answers.length,0),"","var(--purple)")}
    </div>

    <div style="display:flex;gap:12px">
      <!-- Left: filters -->
      <div style="width:160px;flex-shrink:0">
        <div class="card" style="padding:.75rem">
          <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">Category</div>
          ${FAQ_CATS.map(c=>`<button onclick="window._faqCat='${c}';pageFAQ()" style="display:block;width:100%;text-align:left;padding:6px 8px;border:none;border-radius:6px;font-size:12px;cursor:pointer;background:${cat===c?"rgba(79,142,247,.15)":"transparent"};color:${cat===c?"var(--accent)":"var(--muted)"};font-weight:${cat===c?"600":"400"};transition:all .15s">${c}</button>`).join("")}
        </div>
      </div>

      <!-- Right: questions -->
      <div style="flex:1;min-width:0">
        <div style="margin-bottom:12px">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><input class="search-bar" style="flex:1" placeholder="Search questions…" value="${search}" oninput="window._faqSearch=this.value;pageFAQ()"><div style="display:flex;gap:5px">${["All","Answered","Unanswered"].map(s=>`<button class="filter-pill${faqFilter===s?" active":""}" onclick="window._faqFilter='${s}';pageFAQ()">${s}</button>`).join("")}</div></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
        ${rows.length===0?`<div class="card" style="text-align:center;padding:3rem;color:var(--muted)">No questions found. <button class="btn btn-ghost btn-sm" onclick="openAskModal()" style="margin-top:10px;display:block;margin:8px auto 0">Ask the first one →</button></div>`:""}
        ${rows.map(q=>`
          <div class="card" style="cursor:pointer;transition:border .15s" onclick="window._faqView='detail';window._faqSelected='${q.id}';pageFAQ()" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
            <div style="display:flex;gap:12px;align-items:flex-start">
              <!-- Vote count -->
              <div style="text-align:center;flex-shrink:0;width:36px">
                <div style="font-size:18px;font-weight:700;color:var(--accent);line-height:1">${q.votes}</div>
                <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">votes</div>
              </div>
              <!-- Answer count bubble -->
              <div style="text-align:center;flex-shrink:0;width:36px">
                <div style="width:36px;height:36px;border-radius:8px;background:${q.answers.length>0?"rgba(79,207,142,.15)":"rgba(255,255,255,.06)"};border:1px solid ${q.answers.length>0?"rgba(79,207,142,.3)":"var(--border)"};display:flex;align-items:center;justify-content:center;flex-direction:column">
                  <div style="font-size:14px;font-weight:700;color:${q.answers.length>0?"var(--green)":"var(--muted)"};line-height:1">${q.answers.length}</div>
                  <div style="font-size:8px;color:var(--muted)">ans</div>
                </div>
              </div>
              <!-- Question body -->
              <div style="flex:1;min-width:0">
                <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:5px;line-height:1.4">${q.question}</div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                  <span style="background:rgba(167,139,250,.12);color:var(--purple);font-size:10px;font-weight:600;border-radius:20px;padding:2px 8px">${q.category}</span>
                  ${badge(q.status)}
                  <span style="font-size:11px;color:var(--muted)">Asked by ${q.askedBy}</span>
                  <span style="font-size:11px;color:var(--dim)">${q.askedAt.slice(0,10)}</span>
                  ${q.answers.some(a=>a.isAccepted)?`<span style="font-size:10px;color:var(--green)">✓ Accepted answer</span>`:""}
                </div>
              </div>
            </div>
          </div>`).join("")}
        </div>
      </div>
    </div>
  </div>`);
}

function renderFAQDetail(id){
  const q=DB.faq.find(x=>x.id===id);
  if(!q){window._faqView="list";return pageFAQ();}

  render(`
  <div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.5rem">
      <button class="btn btn-ghost btn-sm" onclick="window._faqView='list';pageFAQ()">← Back to Q&A</button>
      <span style="background:rgba(167,139,250,.12);color:var(--purple);font-size:11px;font-weight:600;border-radius:20px;padding:3px 10px">${q.category}</span>
      ${badge(q.status)}
    </div>

    <!-- Question -->
    <div class="card" style="margin-bottom:16px;border-color:rgba(79,142,247,.25)">
      <div style="font-size:18px;font-weight:700;line-height:1.4;margin-bottom:12px;color:var(--text)">${q.question}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--border)">
        <div style="display:flex;gap:16px;align-items:center">
          <div style="font-size:12px;color:var(--muted)">Asked by <strong style="color:var(--text)">${q.askedBy}</strong> · ${q.askedAt}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn btn-ghost btn-sm" onclick="voteQuestion('${q.id}')">▲ ${q.votes} Votes</button>
          <button class="btn btn-primary btn-sm" onclick="openAnswerModal('${q.id}')">+ Answer</button>
          ${currentUser.role==="Admin"?`<button class="btn btn-danger btn-sm" onclick="confirm2('Delete question?',()=>{DB.faq=DB.faq.filter(x=>x.id!=='${q.id}');window._faqView='list';pageFAQ()})">Delete</button>`:""}
        </div>
      </div>
    </div>

    <!-- Answers -->
    <div style="margin-bottom:12px;font-size:13px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.07em">${q.answers.length} Answer${q.answers.length!==1?"s":""}</div>

    ${q.answers.length===0?`<div class="card" style="text-align:center;padding:2.5rem;color:var(--muted)"><div style="font-size:28px;margin-bottom:8px">💬</div><div>No answers yet. Be the first to answer!</div><button class="btn btn-primary btn-sm" onclick="openAnswerModal('${q.id}')" style="margin-top:12px">Write an Answer</button></div>`:""}

    <div style="display:flex;flex-direction:column;gap:10px">
    ${q.answers.map(a=>`
      <div class="card" style="border-left:3px solid ${a.isAccepted?"var(--green)":"var(--border)"}">
        <div style="display:flex;gap:12px">
          <div style="text-align:center;flex-shrink:0">
            <button onclick="voteAnswer('${q.id}','${a.id}')" style="background:${a.helpful>0?"rgba(79,207,142,.12)":"rgba(255,255,255,.06)"};border:1px solid ${a.helpful>0?"rgba(79,207,142,.3)":"var(--border)"};border-radius:6px;padding:6px 10px;color:${a.helpful>0?"var(--green)":"var(--muted)"};cursor:pointer;font-size:11px;font-weight:700">▲ ${a.helpful}</button>
            ${a.isAccepted?`<div style="margin-top:6px;color:var(--green);font-size:18px" title="Accepted answer">✓</div>`:""}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;line-height:1.7;color:var(--text);margin-bottom:10px">${a.text}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--border)">
              <div style="font-size:11px;color:var(--muted)">Answered by <strong style="color:var(--text)">${a.answeredBy}</strong> · ${a.answeredAt}</div>
              <div style="display:flex;gap:6px">
                ${!a.isAccepted&&(q.askedBy===currentUser.name||currentUser.role==="Admin")?`<button class="btn btn-success btn-sm" onclick="acceptAnswer('${q.id}','${a.id}')">✓ Accept</button>`:""}
                ${currentUser.role==="Admin"?`<button class="btn btn-danger btn-sm" onclick="deleteAnswer('${q.id}','${a.id}')">Delete</button>`:""}
              </div>
            </div>
          </div>
        </div>
      </div>`).join("")}
    </div>

    <!-- Write answer inline -->
    <div class="card" style="margin-top:16px;border-color:rgba(79,142,247,.2)">
      <div style="font-size:13px;font-weight:600;margin-bottom:10px">Your Answer</div>
      <textarea id="inline-answer" class="form-input" rows="4" placeholder="Type your answer here… Be specific and helpful!"></textarea>
      <div style="margin-top:10px;display:flex;justify-content:flex-end">
        <button class="btn btn-primary" onclick="submitInlineAnswer('${q.id}')">Post Answer</button>
      </div>
    </div>
  </div>`);
}

function openAskModal(){
  openModal(`${mHeader("Ask a Question")}
  <div class="modal-body" style="gap:14px">
    <div class="form-group">
      <label class="form-label">Your Question <span style="color:var(--red)">*</span></label>
      <textarea class="form-input" name="faq-q" rows="3" placeholder="Be specific — what exactly do you want to know?"></textarea>
    </div>
    ${mField("Category","faq-cat","General","select","Inventory,Operations,Finance,Warehouse,HR,IT,General")}
    <div style="font-size:11px;color:var(--muted)">Your name and timestamp will be recorded automatically.</div>
  </div>
  ${mFooter("submitQuestion()")}`,false);
}

function submitQuestion(){
  const q=document.querySelector('[name="faq-q"]')?.value.trim();
  const c=document.querySelector('[name="faq-cat"]')?.value||"General";
  if(!q){showToast("Question text is required.","var(--red)");return;}
  const rec={id:uid("FAQ"),question:q,askedBy:currentUser.name,askedAt:nowCA().ts.slice(0,16),category:c,status:"Open",votes:0,answers:[]};
  DB.faq.unshift(rec);
  closeModal();
  pushNotif("faq","New question in Q&A",`${currentUser.name}: "${q.slice(0,60)}${q.length>60?"…":""}"`,  "faq");
  window._faqView="detail"; window._faqSelected=rec.id; pageFAQ();
}

function openAnswerModal(qid){
  openModal(`${mHeader("Post an Answer")}
  <div class="modal-body">
    <div class="form-group">
      <label class="form-label">Your Answer <span style="color:var(--red)">*</span></label>
      <textarea class="form-input" name="ans-text" rows="5" placeholder="Write a clear, helpful answer…"></textarea>
    </div>
  </div>
  ${mFooter("submitAnswer('"+qid+"')")}`,false);
}

function submitAnswer(qid){
  const t=document.querySelector('[name="ans-text"]')?.value.trim();
  if(!t){showToast("Answer text is required.","var(--red)");return;}
  _postAnswer(qid,t); closeModal();
}

function submitInlineAnswer(qid){
  const t=document.getElementById("inline-answer")?.value.trim();
  if(!t){showToast("Write your answer first.","var(--red)");return;}
  _postAnswer(qid,t);
}

function _postAnswer(qid,text){
  const q=DB.faq.find(x=>x.id===qid);
  if(!q) return;
  const a={id:uid("ANS"),text,answeredBy:currentUser.name,answeredAt:nowCA().ts.slice(0,16),helpful:0,isAccepted:false};
  q.answers.push(a);
  q.status="Answered";
  pushNotif("answer",`New answer on: "${q.question.slice(0,50)}…"`,`Answered by ${currentUser.name}`,"faq");
  window._faqView="detail"; window._faqSelected=qid; pageFAQ();
}

function voteQuestion(qid){ const q=DB.faq.find(x=>x.id===qid); if(q){q.votes++;pageFAQ();} }
function voteAnswer(qid,aid){ const q=DB.faq.find(x=>x.id===qid); const a=q?.answers.find(x=>x.id===aid); if(a){a.helpful++;renderFAQDetail(qid);} }
function acceptAnswer(qid,aid){ const q=DB.faq.find(x=>x.id===qid); if(q){q.answers.forEach(a=>a.isAccepted=a.id===aid);q.status="Answered";renderFAQDetail(qid);} }
function deleteAnswer(qid,aid){ const q=DB.faq.find(x=>x.id===qid); if(q){q.answers=q.answers.filter(a=>a.id!==aid);if(!q.answers.length)q.status="Open";renderFAQDetail(qid);} }

// ═══════════════════════════════════════════════
//  PAGE: CALENDAR (Google Calendar OAuth)
// ═══════════════════════════════════════════════
// Google Calendar config — user sets their own Client ID
const GC_SCOPE="https://www.googleapis.com/auth/calendar.readonly";
let _gcToken=null;
let _gcEvents=[];


