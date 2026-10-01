import sys,re
p='/home/claude/toon-planner/index.html'; s=open(p).read()
def rep(a,b,cnt=1):
    global s
    if s.count(a)!=cnt: print('MISSING/COUNT',s.count(a),':',a[:160]); sys.exit(1)
    s=s.replace(a,b)
def block(start,end,new,incl_end=False):
    global s
    a=s.index(start); b=s.index(end,a)
    if incl_end: b+=len(end)
    s=s[:a]+new+s[b:]

# ---------- CSS ----------
rep('.modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px}','.modes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:10px}')
rep('@media (max-width:640px){.mode>span{display:none}.mode b{font-size:14.5px;white-space:nowrap}}','@media (max-width:640px){.modes{grid-template-columns:1fr 1fr}.mode>span{display:none}.mode b{font-size:14.5px;white-space:nowrap}}')
rep('.jump{display:flex;flex-wrap:wrap;gap:6px;margin:-6px 0 20px}\n',r'''.jump{display:flex;flex-wrap:wrap;gap:6px;margin:-6px 0 20px}
.drop{border:2px dashed var(--line-2);border-radius:14px;padding:18px;display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;justify-content:center;text-align:center;background:var(--sunken);font-size:14px}
.drop.over{border-color:var(--ink);background:var(--accent-soft)}
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:10px;margin-top:14px}
.pth{margin:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--surface)}
.pth img{width:100%;aspect-ratio:var(--ar);display:block;background:#fff}
.pth figcaption{display:flex;align-items:center;gap:3px;padding:5px 6px;font-size:13px}
.ib{width:26px;height:26px;border-radius:7px;border:1px solid var(--line-2);background:var(--surface);color:var(--ink);cursor:pointer;font-size:14px;line-height:1;padding:0;flex:none}.ib:disabled{opacity:.3;cursor:default}
.endf{display:grid;gap:4px;margin:10px 0 4px}.endf .f{margin-top:6px}
.prelist{margin:6px 0 0;padding-left:18px;font-size:13.5px}.prelist li{margin:3px 0}.prelist .hot{color:var(--bad);font-weight:700}
.howto{margin:14px 0 0;padding-left:20px;font-size:14px;color:var(--ink-2)}.howto li{margin:4px 0}
''')

# ---------- modes ----------
rep("['month','한 달 기획','한 달치 연재 주제를 한 번에'],['stats','반응·댓글','올린 편 반응 기록 · 답글 도우미']]","['month','한 달 기획','한 달치 연재 주제를 한 번에'],['reels','스토리·릴스','완성 그림으로 영상·스토리'],['stats','반응·댓글','올린 편 반응 기록 · 답글 도우미']]")
rep("if(S.mode==='stats'){ vStats(); renderPhone(); return; }","if(S.mode==='stats'){ vStats(); renderPhone(); return; } if(S.mode==='reels'){ vReels(); renderPhone(); return; }")
rep("({input:vInput,edit:vEdit,post:vPost})[S.step](); renderPhone();","({input:vInput,edit:vEdit,post:vPost})[S.step](); renderPhone(); renderSpell();")
rep("  if(b.dataset.mode2){ S.mode=b.dataset.mode2; save(); render(); return; }","  if(b.dataset.mode2){ S.mode=b.dataset.mode2; if(b.dataset.src) ru().src=b.dataset.src; save(); render(); window.scrollTo({top:0,behavior:'smooth'}); return; }")
rep("['#modes','두 가지 방법이 있어요','\"한 편 만들기\"는 가게 이야기 하나로 인스타툰 한 편, \"한 달 기획\"은 한 달 동안 올릴 주제를 날짜별로 한 번에 짜요.'],",
    "['#modes','탭 네 개','\"한 편 만들기\"는 인스타툰 한 편, \"한 달 기획\"은 한 달 주제, \"스토리·릴스\"는 완성 그림으로 영상 만들기, \"반응·댓글\"은 올린 뒤 관리예요.'],")

# ---------- phone preview uses finished pictures ----------
block("function renderPhone(){","  $('#phone').innerHTML=",r'''function renderPhone(){
  const P=pics(), cs=cuts(), useP=P.length>0, n=useP?P.length:cs.length, name=S.info.name||'우리가게';
  if(pv>=n) pv=Math.max(0,n-1);
  const body=n?`<div class="car">${useP?`<canvas id="pcv" width="1080" height="${ratio().h}"></canvas>`:frameHTML(cs[pv],pv)}
      ${pv>0?`<button class="navb prev" data-pv="-1" aria-label="이전 장">‹</button>`:''}
      ${pv<n-1?`<button class="navb next" data-pv="1" aria-label="다음 장">›</button>`:''}
      <span class="cnt">${pv+1}/${n}</span></div>
      <div class="dots">${Array.from({length:n},(_,k)=>`<i class="${k===pv?'on':''}"></i>`).join('')}</div>`
    :`<div class="cover-empty"><b>${busy?'만드는 중…':'여기에 완성된\n인스타툰이 떠요'}</b><span>${busy?'잠시만 기다려 주세요':'왼쪽에 업종을 고르고\n"인스타툰 만들기"를 눌러 보세요'}</span></div><div class="dots">${Array.from({length:S.info.cuts},(_,k)=>`<i class="${k?'':'on'}"></i>`).join('')}</div>`;
  const cap=S.toon?.caption||'';
''')
rep("  const pc=$('#pcv'); if(pc) (isEnd?drawEnd(pc):compose(pc,cs[pv]));\n  $('#sideTip').textContent=n?'화살표로 넘기면서 손님처럼 읽어 보세요':'';",
    "  const pc=$('#pcv'); if(pc&&useP){ const k=pv; fitCanvas(P[k]).then(c=>{ if(pv!==k) return; pc.getContext('2d').drawImage(c,0,0,pc.width,pc.height); }); }\n  $('#sideTip').textContent=useP?'완성 그림을 넘겨 보세요':(n?'대본 미리보기예요. 그림을 올리면 실제 그림으로 바뀌어요':'');")

# ---------- guide: end card item with fields ----------
a=s.index("      ${ec().on?`<li><div class=\"gh\"><b>마지막 장 안내 카드 그리기</b>"); b=s.index("\n",a)
s=s[:a]+"      ${endLi()}"+s[b:]
rep("/* ================= 마지막 장 안내 카드 ================= */",r'''/* ================= 마지막 장 안내 카드 (프롬프트) ================= */
function endLi(){ const e=ec();
  return `<li class="endli"><div class="gh"><b>마지막 장 안내 카드 그리기</b><span class="tag">선택</span>${e.on?'<button class="btn sm" data-copy="endp">복사</button>':''}</div>
    <p>웹툰 맨 뒤에 붙는 가게 안내 한 장이에요. 우리 캐릭터가 손 흔드는 그림에 아래 문구가 함께 그려져요. 마지막 컷 다음에 같은 대화창에서 보내세요. 한 번 그린 그림은 다음 편에도 다시 써도 돼요.</p>
    <div class="chips"><button class="chip" data-endon="1" aria-pressed="${e.on}">넣기</button><button class="chip" data-endon="0" aria-pressed="${!e.on}">안 넣기</button></div>
    ${e.on?`<div class="endf">
      <label class="f" for="e-head">큰 문구 <small>두 줄까지</small></label><textarea class="in" id="e-head" data-end="head" rows="2" placeholder="다음 편도 궁금하다면?">${esc(e.head)}</textarea>
      <label class="f" for="e-lines">안내 <small>한 줄에 하나 · 최대 4줄 · 비우면 가게 프로필의 예약 안내</small></label><textarea class="in" id="e-lines" data-end="lines" rows="3" placeholder="📍 망원동 123-4 (망원역 2번 출구 3분)&#10;⏰ 매일 11:00~21:00 · 월요일 휴무">${esc(e.lines)}</textarea>
      <label class="f" for="e-btn">버튼 문구</label><input class="in" id="e-btn" data-end="btn" value="${esc(e.btn)}" placeholder="프로필 링크에서 예약하기">
      <label class="f">배경 느낌</label><div class="chips">${Object.entries(END_STYLES).map(([k,v])=>`<button class="chip" data-endst="${k}" aria-pressed="${e.style===k}">${v.name}</button>`).join('')}</div>
    </div><pre id="endPre">${esc(endPrompt())}</pre>`:''}</li>`; }''')
rep("const endOn=()=>!!(S.endcard&&S.endcard.on)&&cuts().length>0;","const endOn=()=>false;")
rep("  if(b.dataset.endst){ ec().style=b.dataset.endst; save(); document.querySelectorAll('[data-endst]').forEach(c=>c.setAttribute('aria-pressed',c.dataset.endst===ec().style)); const g=$('#guideBox'); if(g) g.innerHTML=guideHTML(); return; }",
    "  if(b.dataset.endst){ ec().style=b.dataset.endst; save(); document.querySelectorAll('[data-endst]').forEach(c=>c.setAttribute('aria-pressed',c.dataset.endst===ec().style)); const pr=$('#endPre'); if(pr) pr.textContent=endPrompt(); return; }")
rep("  if(b.dataset.endon){ ec().on=b.dataset.endon==='1'; save(); refreshEnd(); const g=$('#guideBox'); if(g) g.innerHTML=guideHTML(); return; }",
    "  if(b.dataset.endon){ ec().on=b.dataset.endon==='1'; save(); const g=$('#guideBox'); if(g) g.innerHTML=guideHTML(); renderTodo(); return; }")
rep("  if(el.dataset.end){ ec()[el.dataset.end]=el.value; save(); clearTimeout(window._ed); window._ed=setTimeout(()=>{ const g=$('#guideBox'); if(g){ const sc=g.scrollTop; g.innerHTML=guideHTML(); } },400); return; }",
    "  if(el.dataset.end){ ec()[el.dataset.end]=el.value; save(); const pr=$('#endPre'); if(pr) pr.textContent=endPrompt(); return; }")

# ---------- vPost ----------
a=s.index("  const have=cs.filter(c=>c.img).length;\n  const px=planItem();")
b=s.index("    ${reuseHTML()}\n    ${kitHTML()}",a)
s=s[:a]+r'''  const P=pics(), need=n+(ec().on?1:0), fit=S.info.fit==='contain'?'contain':'cover';
  const px=planItem(); if(px&&P.length>=n&&['plan','script'].includes(stOf(px))){ px.status='art'; save(); }
  $('#main').innerHTML=`<section class="panel">
    <div class="ph"><div><h1>그림 만들고 올리기</h1><p>대사·제목·효과음은 고른 테마(${esc(artOf().name)})에 맞는 웹툰 글씨로 그림 안에 함께 그려져요. 아래 순서대로 하면 돼요.</p></div></div>
    <div class="jump" role="navigation" aria-label="바로 가기">${[['#sec-draw','① 그림 그리기'],['#sec-save','② 그림 올리기·저장'],['#kit','③ 게시물 글']].map(([h,t])=>`<button class="chip" data-jump="${h}">${t}</button>`).join('')}<button class="chip" data-mode2="reels" data-src="toon">스토리·릴스 탭 →</button></div>

    <h2 class="sec" id="sec-draw" style="margin-top:0">① 그림 그리기</h2>
    ${autoSection()}
    <p class="sub"><b>${STANDALONE?'API 키 없이 직접 그릴 때':'Gemini나 ChatGPT로 그리기'}</b> · 이미지를 만들 수 있는 Gemini나 ChatGPT에서 <b>새 대화창 하나</b>를 열고, 아래 순서대로 한 번에 하나씩 붙여 넣으세요.</p>
    <div id="guideBox">${guideHTML()}</div>

    <h2 class="sec" id="sec-save">② 완성 그림 올리기 · 저장</h2>
    <p class="sub">받은 그림을 <b>한 번에 모두</b> 올리세요. 파일 이름 순서대로 들어가고, 순서는 ‹ › 로 바꿀 수 있어요. 몇 장이든 괜찮아요${need?` (이번 대본은 ${need}장)`:''}.</p>
    <div class="drop" id="drop"><span>그림 파일을 여기로 끌어다 놓거나</span><button class="btn pri" data-act="upall">그림 고르기 (여러 장 가능)</button><span class="status">${P.length?`${P.length}장 올라가 있어요`:'아직 올린 그림이 없어요'}</span></div>
    <div class="ratio-bar"><b>${ratio().name} · ${ratio().px}</b><span>Gemini가 다른 비율로 그려도 저장할 때 이 비율로 맞춰져요.</span><span class="chips">${[['cover','꽉 채우기(가장자리 조금 잘림)'],['contain','전체 보이기(남는 곳 흰 여백)']].map(([k,v])=>`<button class="chip" data-fit="${k}" aria-pressed="${fit===k}">${v}</button>`).join('')}</span></div>
    ${P.length?`<div class="pgrid">${P.map((src,i)=>`<figure class="pth"><img src="${src}" alt="${i+1}번째 그림" style="object-fit:${fit}"><figcaption><b>${i+1}</b><span class="grow"></span><button class="ib" data-pmove="${i}|-1" data-list="toon" ${i?'':'disabled'} aria-label="${i+1}번 앞으로">‹</button><button class="ib" data-pmove="${i}|1" data-list="toon" ${i<P.length-1?'':'disabled'} aria-label="${i+1}번 뒤로">›</button>${STANDALONE&&!autoCtl&&(i<n||(i===n&&ec().on))?`<button class="ib" data-regen="${i}" title="AI로 다시 그리기" aria-label="${i+1}번 AI로 다시 그리기">↻</button>`:''}<button class="ib" data-pdel="${i}" data-list="toon" aria-label="${i+1}번 빼기">×</button></figcaption></figure>`).join('')}</div>`:''}
    <div class="row" style="margin-top:14px"><button class="btn pri" data-act="zip" ${P.length?'':'disabled'}>완성 그림 전체 저장 (zip)</button><button class="btn" data-mode2="reels" data-src="toon" ${P.length?'':'disabled'}>이 그림으로 스토리·릴스 만들기 →</button><span class="status" id="st-zip"></span></div>
    <p class="sub" style="margin-top:8px">저장하면 모든 그림이 ${ratio().name}로 맞춰지고 1, 2, 3… 순서대로 이름이 붙어요. 한 달 연재표에도 이 편이 "완성"으로 표시되고 "반응·댓글" 탭에 쌓여요.</p>

'''+s[b:]
rep("    ${reuseHTML()}\n    ${kitHTML()}","    ${kitHTML()}")
rep("  drawAll(); kitCounters(); drawFeedCur(); renderSpell(); previewReuse();\n}","  kitCounters();\n}")
rep("<h2 class=\"sec\" id=\"kit\">④ 인스타에 올릴 글</h2>\n  <p class=\"sub\">인스타에 게시물을 올릴 때 붙여 넣을 글이에요. 인스타 계정과 연결되는 기능은 아니고, 복사해서 쓰면 돼요. 여기서 고친 글은 자동 저장돼요.</p>",
    "<h2 class=\"sec\" id=\"kit\">③ 인스타 게시물(웹툰)에 올릴 글</h2>\n  <p class=\"sub\">웹툰 그림 여러 장을 한 게시물로 올릴 때 붙여 넣을 글이에요. 인스타 계정과 연결되는 기능은 아니고, 복사해서 쓰면 돼요. <b>릴스에 올릴 글은 \"스토리·릴스\" 탭에 따로 있어요.</b></p>")

# ---------- pictures list, fit, zip ----------
rep("/* ================= 게시 준비 키트 ================= */",r'''/* ================= 완성 그림 목록 ================= */
function pics(){ const T=S.toon; if(!T) return []; if(!Array.isArray(T.pics)) T.pics=cuts().map(c=>c.img).filter(Boolean); return T.pics; }
function putPic(i,d){ const P=pics(); if(i<P.length) P[i]=d; else P.push(d); }
async function fitCanvas(src){ const W=1080,H=ratio().h, cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,W,H);
  try{ const im=await getImg(src); const s2=S.info.fit==='contain'?Math.min(W/im.width,H/im.height):Math.max(W/im.width,H/im.height); x.drawImage(im,(W-im.width*s2)/2,(H-im.height*s2)/2,im.width*s2,im.height*s2); }catch(_){} return cv; }
function listOf(kind){ return kind==='own'?ru().own:pics(); }
async function addPics(files,kind){ const L=listOf(kind); if(kind!=='own'&&!S.toon){ toast('먼저 대본을 만들어 주세요'); return; }
  files=[...files].filter(f=>/^image\//.test(f.type)).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})); if(!files.length){ toast('그림 파일(jpg, png)을 골라 주세요'); return; }
  for(const f of files){ try{ L.push(await fileToImg(f)); }catch(_){} }
  try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(_){ toast('그림이 많아서 새로고침하면 다시 올려야 할 수 있어요. 저장은 바로 해 두세요'); }
  pv=0; render(); toast(`${files.length}장을 순서대로 넣었어요`); }

/* ================= 게시 준비 키트 ================= */''')
block("async function makeZip(){","/* ================= 파일 버전",r'''async function makeZip(){
  const st=$('#st-zip'), P=pics(); if(!P.length) return false;
  if(!window.JSZip){ st.className='status err'; st.textContent='압축 도구를 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.'; return false; }
  st.className='status'; st.innerHTML='<span class="spin"></span> 그림을 맞추는 중';
  const zip=new JSZip(), base=(S.info.name||'instatoon').replace(/\s+/g,'_');
  for(let i=0;i<P.length;i++){ zip.file(`${base}_${String(i+1).padStart(2,'0')}.png`, await cvBlob(await fitCanvas(P[i]))); }
  const blob=await zip.generateAsync({type:'blob'}); st.textContent='';
  await saveFile(`${base}_인스타툰.zip`,blob); return true;
}

''')
rep("  if(a==='zip') return run(b,async()=>{ await makeZip(); if(S.toon){ S.toon.zipped=true; if(cuts().every(c=>c.img)) await recordDone(); save(); renderTodo(); } });",
    "  if(a==='zip') return run(b,async()=>{ const ok=await makeZip(); if(ok&&S.toon){ S.toon.zipped=true; await recordDone(); save(); renderTodo(); } });")
rep("async function coverThumb(){ const c=document.createElement('canvas'); await compose(c,cuts()[0]); return cropThumb(c).toDataURL('image/jpeg',0.82); }",
    "async function coverThumb(){ let c; if(pics().length) c=await fitCanvas(pics()[0]); else { c=document.createElement('canvas'); await compose(c,cuts()[0]); } return cropThumb(c).toDataURL('image/jpeg',0.82); }")
rep("async function recordDone(){ const T=S.toon; if(!T||!cuts().length) return;","async function recordDone(){ const T=S.toon; if(!T||!pics().length) return;")

# ---------- auto draw into pics ----------
s=s.replace("cuts()[0].img","pics()[0]")
rep("  try{ cuts()[i].img=await gimage(cutImageParts(i),signal); save(); }","  try{ putPic(i,await gimage(cutImageParts(i),signal)); save(); }")
a=s.index("    for(let i=0;i<cuts().length;i++){\n      if(onlyEmpty&&cuts()[i].img) continue;")
b=s.index("    autoCtl=null; vPost(); renderPhone();\n    if(st()){ st().className='status'; st().textContent='끝까지",a)
s=s[:a]+r'''    const n=cuts().length, total=n+(ec().on?1:0); if(!onlyEmpty){ S.toon.pics=[]; S.toon.zipped=false; }
    for(let i=pics().length;i<total;i++){
      if(i<n) await drawOne(i,sig); else await drawEndOne(sig);
      save(); vPost(); renderPhone(); pv=i;
    }
'''+s[b:]
rep("async function drawOne(i,signal){","async function drawEndOne(signal){ const st=$('#st-auto'); if(st){ st.className='status'; st.innerHTML='<span class=\"spin\"></span> 마지막 장 안내 카드 그리는 중'; } putPic(cuts().length,await gimage(endImageParts(),signal)); save(); }\nasync function drawOne(i,signal){")
rep("try{ await drawOne(i,autoCtl.signal); toast(`${i+1}컷을 다시 그렸어요`); }","try{ if(i<cuts().length) await drawOne(i,autoCtl.signal); else await drawEndOne(autoCtl.signal); toast(`${i+1}번 그림을 다시 그렸어요`); }")

# ---------- uploads ----------
rep("  const cs=cuts(); let start=upMany?0:upTarget;\n  for(const f of files){ if(start>=cs.length) break; cs[start].img=await fileToImg(f); start++; }\n  try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(_){ toast('이미지가 커서 새로고침하면 다시 올려야 할 수 있어요'); }\n  vPost(); renderPhone(); toast(files.length>1?`${Math.min(files.length,cs.length)}장을 순서대로 넣었어요`:'그림을 넣었어요');",
    "  return addPics(files,upDest);")
rep("let upTarget=0, upMany=false, refPick=null, photoPick=null, feedPick=false, endPick=false;","let upTarget=0, upMany=false, refPick=null, photoPick=null, feedPick=false, endPick=false, upDest='toon';")
rep("  if(a==='upall'){ refPick=null; photoPick=null; upMany=true; return pickFile(true); }","  if(a==='upall'){ refPick=null; photoPick=null; feedPick=false; endPick=false; upMany=true; upDest='toon'; return pickFile(true); }\n  if(a==='rup'){ refPick=null; photoPick=null; feedPick=false; endPick=false; upMany=true; upDest='own'; return pickFile(true); }")
rep("  if(b.dataset.jump){","  if(b.dataset.pmove){ const [i,d]=b.dataset.pmove.split('|').map(Number), L=listOf(b.dataset.list), j=i+d; if(j<0||j>=L.length) return; [L[i],L[j]]=[L[j],L[i]]; save(); pv=j; return render(); }\n  if(b.dataset.pdel){ const L=listOf(b.dataset.list); L.splice(+b.dataset.pdel,1); if(b.dataset.list!=='own'&&S.toon) S.toon.zipped=false; save(); pv=0; return render(); }\n  if(b.dataset.rsrc){ ru().src=b.dataset.rsrc; save(); return vReels(); }\n  if(b.dataset.jump){")
rep("document.getElementById('backupIn').addEventListener('change',","""document.addEventListener('dragover',e=>{ const d=e.target.closest&&e.target.closest('.drop'); if(d){ e.preventDefault(); d.classList.add('over'); } });
document.addEventListener('dragleave',e=>{ const d=e.target.closest&&e.target.closest('.drop'); if(d) d.classList.remove('over'); });
document.addEventListener('drop',e=>{ const d=e.target.closest&&e.target.closest('.drop'); if(!d) return; e.preventDefault(); d.classList.remove('over'); addPics(e.dataTransfer.files,d.id==='rdrop'?'own':'toon'); });
document.getElementById('backupIn').addEventListener('change',""")

# ---------- todo ----------
a=s.index("  const have=cs.filter(c=>c.img).length, m=cs.findIndex(c=>!c.img);")
b=s.index("\n}\nfunction renderTodo(){",a)
s=s[:a]+r'''  const P=pics(), need=n+(ec().on?1:0);
  if(STANDALONE&&typeof autoCtl!=='undefined'&&autoCtl) return {t:`그리는 중이에요 (${P.length}/${need}장). 창을 닫지 말고 기다려 주세요`,stage:2};
  if(!P.length){
    if(STANDALONE&&API.key){ const miss=peopleIdx().find(k=>!refOf(k)); if(miss!==undefined) return {t:`${whoLabel(miss)} 기준 이미지를 올리거나 "AI로 만들기"를 눌러 주세요. 모든 컷이 이 얼굴로 그려져요`,go:'.auto',stage:2};
      return {t:'"빈 컷 자동으로 그리기"를 누르면 1컷부터 끝까지 그려요',go:'[data-act="autoEmpty"]',stage:2}; }
    return {t:'① 목록을 1번부터 Gemini·ChatGPT에 붙여 넣어 그림을 받고, ②에 한 번에 올려 주세요',go:'#guideBox',stage:2}; }
  if(!T.zipped) return {t:`그림 ${P.length}장이 올라가 있어요${P.length<need?` (대본은 ${need}장)`:''}. 순서를 확인하고 "완성 그림 전체 저장"을 눌러 주세요`,go:'[data-act="zip"]',stage:2};
  return {t:'완성! "스토리·릴스" 탭에서 영상을 만들고, ③ 게시물 글을 복사해 인스타에 올리세요',go:'.jump [data-mode2="reels"]',stage:2,done:1};'''+s[b:]
rep("<span class=\"prog\" aria-label=\"5단계 중 ${t.stage+1}단계\">${[0,1,2,3,4].map(","<span class=\"prog\" aria-label=\"3단계 중 ${t.stage+1}단계\">${[0,1,2].map(")
rep("  if(S.mode==='stats'){ const H=hist();","""  if(S.mode==='reels'){ const L=mediaList(); if(!L.length) return {t:pics().length?'"이번 편 완성 그림"을 고르거나 그림을 직접 올려 주세요':'완성 그림을 올려 주세요. 올린 순서대로 영상이 넘어가요',go:'#rsrc'};
    if(!reelBlob) return {t:`그림 ${L.length}장으로 "릴스 영상 만들기"를 눌러 주세요 (약 ${L.length*ru().sec}초)`,go:'[data-act="reelMake"]'};
    return {t:'영상 저장 후 인스타 릴스에 올리고, 아래 "릴스에 올릴 글"을 복사해 붙여 넣으세요',go:'#reelText',done:1}; }
  if(S.mode==='stats'){ const H=hist();""")
rep("go:'.actions [data-step=\"post\"]',stage:1}; }","go:'.actions [data-step=\"post\"]',stage:1}; }",1)
rep("<button class=\"btn acc\" data-step=\"post\">다 됐어요, 올리기 →</button>","<button class=\"btn acc\" data-step=\"post\">다 됐어요, 그림 그리러 →</button>")
rep("괜찮으면 맨 아래 \"다 됐어요, 올리기 →\"를 눌러 주세요","괜찮으면 맨 아래 \"다 됐어요, 그림 그리러 →\"를 눌러 주세요")

# ---------- edit: check before drawing ----------
rep('    <div class="review">','''    <div class="pre" id="pre" style="margin:0 0 14px"><div class="lab-row"><b style="font-size:15px">그림 그리기 전에 확인</b><button class="btn sm" data-act="spell">AI 맞춤법 검사</button></div>
      <p class="sub" style="margin:4px 0 0">글자가 그림 안에 같이 그려지니까 틀린 글자는 지금 고쳐야 다시 그릴 일이 없어요.</p>
      <ul class="prelist" id="prelist">${preHints()}</ul>
      <div class="status" id="st-spell"></div><div class="fixes" id="spellList" style="margin-top:8px"></div></div>
    <div class="review">''')
rep("function preHTML(){","function preHints(){ const T=S.toon||{}, all=[...cuts().map(c=>[c.title,c.sub,c.bubble,c.caption].join(' ')),T.caption||'',T.comment||''].join(' ');\n  const nums=[...new Set(all.match(/\\d[\\d,.]*\\s*(%|원|만원|천원|시간|시|분|일|개월|명|개|회|잔|kg|g)|\\d{1,2}\\/\\d{1,2}|\\d{1,2}월\\s?\\d{1,2}일/g)||[])];\n  const ads=[...new Set([...AD_WORDS.filter(w=>all.includes(w)),...bannedHits(all)])], photo=[0,1,2].some(k=>getPhoto(k));\n  return [nums.length?`<li>가격·날짜·시간이 실제와 같은지 확인: <b>${esc(nums.slice(0,8).join(', '))}</b></li>`:'',ads.length?`<li class=\"hot\">과장 광고로 보일 수 있는 표현: ${esc(ads.join(', '))} · 병원·약국·식품·뷰티는 광고 규정에 걸릴 수 있어요</li>`:'',photo?'<li>사진을 참고한 직원·손님에게 인스타에 쓴다고 동의를 받았는지 확인하세요.</li>':'','<li>실제 손님 이야기라면 알아볼 수 있는 이름·얼굴은 빼 주세요.</li>'].filter(Boolean).join(''); }\nfunction preHTML(){")
rep("  tgt[key]=tgt[key].replace(f.before,f.after); f.applied=true; save(); renderSpell(); drawAll(); renderPhone(); const kc=$('#k-cap'); if(kc&&key==='caption') kc.value=T.caption; kitCounters(); toast('반영했어요'); }",
    "  tgt[key]=tgt[key].replace(f.before,f.after); f.applied=true; save(); renderSpell();\n  if(key!=='caption'){ const ta=document.getElementById(`c${f.cut-1}-${({title:'title',bubble:'bb',sub:'sub',sfx:'fx'})[key]}`); if(ta){ ta.value=tgt[key]; ta.dispatchEvent(new Event('input',{bubbles:true})); } }\n  renderPhone(); const kc=$('#k-cap'); if(kc&&key==='caption') kc.value=T.caption; const pl=$('#prelist'); if(pl) pl.innerHTML=preHints(); toast('반영했어요'); }")
rep("  if(a==='zip'&&preLeft()&&!window._zipOk){","  if(false){")

# ---------- reel text in makeToon ----------
rep("- comment: 댓글 유도 질문 1개와 사장님 고정 댓글 1개, 줄바꿈 구분","- comment: 댓글 유도 질문 1개와 사장님 고정 댓글 1개, 줄바꿈 구분\n- reelCaption: 같은 웹툰을 릴스 영상으로 올릴 때의 캡션. 게시물 caption과 다르게 새로. 첫 줄은 20자 이내 궁금증(결말 스포일러 금지), 2~3줄, 마지막 줄은 \"전체 이야기는 프로필 게시물에서\" 같은 안내. 이모지 1~2개\n- reelHashtags: 릴스용 해시태그 5개 이내, 공백 구분. 동네·업종 + 릴스 추천에 맞는 조금 넓은 주제 1~2개\n- reelComment: 릴스 고정 댓글 1개(다음 편 예고나 가벼운 질문)")
rep('"comment":"","cast":""','"comment":"","reelCaption":"","reelHashtags":"","reelComment":"","cast":""')
rep("comment:String(r.comment||''),cast:","comment:String(r.comment||''),reel:{caption:String(r.reelCaption||''),hashtags:Array.isArray(r.reelHashtags)?r.reelHashtags.join(' '):String(r.reelHashtags||''),comment:String(r.reelComment||'')},cast:")
rep("comment:'여러분 동네에도 이런 단골 계신가요? 👀\\n📌 오후 3시 추가 굽기는 월~토 매일이에요!',","comment:'여러분 동네에도 이런 단골 계신가요? 👀\\n📌 오후 3시 추가 굽기는 월~토 매일이에요!',reel:{caption:'오후 3시, 빵집이 텅 비었다 😳\\nCCTV에 찍힌 범인의 정체는…?\\n전체 이야기는 프로필 게시물에서 확인하세요!',hashtags:'#망원동빵집 #빵집브이로그 #인스타툰',comment:'다음 편: 새벽 5시, 불 켜진 빵집의 비밀 🌙'},")

# ---------- reels tab: replace old reuse block ----------
block("/* ================= 스토리·릴스 ================= */","/* ================= 반응 기록 ================= */",r'''/* ================= 스토리·릴스 탭 ================= */
function ru(){ return S.reuse=fillDef(S.reuse||{},{storyHead:'새 에피소드 올라왔어요',sec:3,src:'toon',own:[],title:''}); }
const mediaList=()=>ru().src!=='own'&&pics().length?pics():ru().own;
const reelTitle=()=>ru().title.trim()||S.toon?.title||'';
function rt(){ if(S.toon) return S.toon.reel=fillDef(S.toon.reel||{},{caption:'',hashtags:'',comment:''}); return S.reelOwn=fillDef(S.reelOwn||{},{caption:'',hashtags:'',comment:''}); }
function reelPostText(){ const r=rt(), cta=prof().cta.trim(); let c=r.caption.trim(); if(cta&&!c.includes(cta)) c+=(c?'\n\n':'')+cta; const t=[...new Set([...tagList(prof().tags),...tagList(r.hashtags)])].slice(0,IG_TAGS).join(' '); return c+(t?'\n\n'+t:''); }
let reelBlob=null, reelExt='mp4', reelUrl='', reelBusy=false;
function vReels(){ const r=ru(), useT=r.src!=='own'&&pics().length>0, L=mediaList(), R=rt();
  $('#main').innerHTML=`<section class="panel">
    <div class="ph"><div><h1>스토리·릴스 만들기</h1><p>완성된 그림만 있으면 돼요. 올린 순서대로 한 장씩 넘어가는 <b>릴스 영상</b>과, 새 편을 알리는 <b>스토리 이미지</b>를 만들어요.</p></div></div>
    <label class="f" style="margin-top:0">① 어떤 그림으로 만들까요?</label>
    <div class="chips" id="rsrc"><button class="chip" data-rsrc="toon" aria-pressed="${useT}" ${pics().length?'':'disabled'}>이번 편 완성 그림 ${pics().length}장</button><button class="chip" data-rsrc="own" aria-pressed="${!useT}">그림 직접 올리기${r.own.length?` (${r.own.length}장)`:''}</button></div>
    ${useT?`<p class="sub" style="margin-top:8px">"한 편 만들기" ② 에 올린 그림을 그 순서 그대로 써요. 순서를 바꾸려면 그곳에서 바꿔 주세요.</p>`
      :`<div class="drop" id="rdrop" style="margin-top:10px"><span>그림 파일을 여기로 끌어다 놓거나</span><button class="btn pri" data-act="rup">그림 고르기 (여러 장 가능)</button><span class="status">${r.own.length?`${r.own.length}장 올라가 있어요`:'파일 이름 순서대로 들어가요'}</span></div>`}
    ${L.length?`<div class="pgrid">${L.map((src,i)=>`<figure class="pth"><img src="${src}" alt="${i+1}번째 그림" style="object-fit:cover"><figcaption><b>${i+1}</b><span class="grow"></span>${useT?'':`<button class="ib" data-pmove="${i}|-1" data-list="own" ${i?'':'disabled'} aria-label="${i+1}번 앞으로">‹</button><button class="ib" data-pmove="${i}|1" data-list="own" ${i<L.length-1?'':'disabled'} aria-label="${i+1}번 뒤로">›</button><button class="ib" data-pdel="${i}" data-list="own" aria-label="${i+1}번 빼기">×</button>`}</figcaption></figure>`).join('')}</div>`:''}
    <label class="f" for="rs-title">② 영상 위에 보일 제목 <small>비우면 이번 편 제목</small></label>
    <input class="in" id="rs-title" data-reuse="title" value="${esc(r.title)}" placeholder="${esc(S.toon?.title||'예: 오후 3시, 빵이 다 사라졌다')}">
    <div class="reuse">
      <div class="rcard"><canvas id="reelCv" width="1080" height="1920" aria-label="릴스 영상 미리보기"></canvas><video id="reelVid" controls playsinline ${reelUrl?'':'hidden'} ${reelUrl?`src="${reelUrl}"`:''}></video><b>릴스 영상</b>
        <p>한 장씩 밀려 들어오며 살짝 확대돼요. 소리는 없으니 인스타에서 올릴 때 <b>음악</b>을 붙여 주세요.</p>
        <div class="chips">${[2,3,4].map(k=>`<button class="chip" data-rsec="${k}" aria-pressed="${r.sec===k}">한 장에 ${k}초</button>`).join('')}</div>
        <div class="row"><button class="btn pri" data-act="reelMake" ${L.length?'':'disabled'}>릴스 영상 만들기</button><button class="btn" data-act="reelDl" ${reelBlob?'':'hidden'}>영상 저장</button></div>
        <span class="status" id="st-reel">${L.length?`${L.length}장 × ${r.sec}초 = 약 ${L.length*r.sec}초. 만드는 동안 이 화면을 켜 두세요.`:'그림을 먼저 골라 주세요.'}</span></div>
      <div class="rcard"><canvas id="storyCv" width="1080" height="1920" aria-label="스토리 이미지 미리보기"></canvas><b>스토리 홍보 이미지</b>
        <p>1번 그림으로 만들어요. 스토리에 올린 뒤 <b>"링크" 스티커</b>로 게시물이나 예약 링크를 붙이면 바로 넘어와요.</p>
        <label class="f" for="rs-head" style="margin:0">위 문구</label><input class="in" id="rs-head" data-reuse="storyHead" value="${esc(r.storyHead)}" placeholder="새 에피소드 올라왔어요">
        <button class="btn" data-act="storyDl" ${L.length?'':'disabled'}>스토리 이미지 저장</button></div>
    </div>

    <h2 class="sec" id="reelText">③ 릴스에 올릴 글 <small style="font-weight:600;color:var(--muted);font-size:13px">게시물 글과 달라요</small></h2>
    <p class="sub">릴스는 팔로워가 아닌 사람에게 먼저 보여져요. 그래서 첫 줄은 더 짧고 궁금하게, 끝은 "전체 이야기는 프로필 게시물에서"로 이어 줘요.</p>
    <div class="kit">
      <div class="kit-copy"><button class="btn pri" data-act="reelCopy">캡션 + 해시태그 한 번에 복사</button><button class="btn" data-act="reelText">${R.caption?'릴스용 글 새로 받기':'릴스용 글 만들기'}</button><span class="status" id="st-rt"></span></div>
      <label class="f" for="rt-cap">릴스 캡션</label><textarea class="in" id="rt-cap" data-rt="caption" rows="4" placeholder="예: 오후 3시, 빵집이 텅 비었다 😳">${esc(R.caption)}</textarea>
      <label class="f" for="rt-tag">릴스 해시태그 <small>5개까지 반영돼요 · 가게 프로필 고정 해시태그가 앞에 붙어요</small></label><input class="in" id="rt-tag" data-rt="hashtags" value="${esc(R.hashtags)}" placeholder="#동네이름 #업종 #인스타툰">
      <div class="lab-row"><label class="f" for="rt-cmt">릴스 고정 댓글</label><button class="btn sm" data-act="reelCmtCopy">복사</button></div><textarea class="in" id="rt-cmt" data-rt="comment" rows="2" placeholder="예: 다음 편 예고 👀">${esc(R.comment)}</textarea>
    </div>
    <ol class="howto"><li>"영상 저장"으로 받은 파일을 휴대폰으로 옮겨요.</li><li>인스타 <b>+ → 릴스</b>에서 영상을 고르고 <b>음악</b>을 붙여요.</li><li>커버는 1번 그림 장면으로 고르면 피드에서 눈에 잘 띄어요.</li><li>위 릴스 글을 붙여 넣고 공유한 뒤, 고정 댓글을 달아요.</li><li>스토리는 이미지를 올리고 <b>링크 스티커</b>로 게시물이나 예약 링크를 붙여요.</li></ol>
  </section>`; previewReuse(); }
function blurBg(cv){ const b=document.createElement('canvas'); b.width=270; b.height=480; const x=b.getContext('2d'); const s2=Math.max(270/cv.width,480/cv.height)*1.15; x.fillStyle='#222'; x.fillRect(0,0,270,480); x.filter='blur(10px)'; x.drawImage(cv,(270-cv.width*s2)/2,(480-cv.height*s2)/2,cv.width*s2,cv.height*s2); x.filter='none'; x.fillStyle='rgba(0,0,0,.5)'; x.fillRect(0,0,270,480); return b; }
async function srcCanvas(src){ const im=await getImg(src); const W=1080, H=Math.min(1500,Math.round(W*im.height/im.width)), cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d'); const s2=Math.max(W/im.width,H/im.height); x.drawImage(im,(W-im.width*s2)/2,(H-im.height*s2)/2,im.width*s2,im.height*s2); return cv; }
async function reelSlides(){ const out=[]; for(const src of mediaList()){ try{ out.push(await srcCanvas(src)); }catch(_){} } return out.map(cv=>({cv,bg:blurBg(cv)})); }
function drawReelFrame(ctx,sl,t,D){ const W=1080,H=1920,N=sl.length; ctx.fillStyle='#111'; ctx.fillRect(0,0,W,H); if(!N) return; const i=Math.min(N-1,Math.floor(t/D)), lt=t-i*D, p=Math.min(1,lt/380), e=1-Math.pow(1-p,3);
  const cur=sl[i].cv, ch=cur.height, y=Math.round((H-ch)/2), z=1+0.04*Math.min(1,lt/D);
  ctx.drawImage(sl[i].bg,0,0,W,H);
  if(i>0&&p<1){ const pc=sl[i-1].cv; ctx.drawImage(pc,-W*e,Math.round((H-pc.height)/2),W,pc.height); }
  ctx.save(); ctx.translate(i>0?W*(1-e):0,0); ctx.beginPath(); ctx.rect(0,y,W,ch); ctx.clip(); const zw=W*z, zh=ch*z; ctx.drawImage(cur,(W-zw)/2,y+(ch-zh)/2,zw,zh); ctx.restore();
  const bw=(W-80-(N-1)*8)/N; for(let k=0;k<N;k++){ ctx.fillStyle='rgba(255,255,255,.3)'; ctx.fillRect(40+k*(bw+8),70,bw,6); ctx.fillStyle='#fff'; ctx.fillRect(40+k*(bw+8),70,bw*(k<i?1:k>i?0:Math.min(1,lt/D)),6); }
  ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle='#fff'; ctx.font=fspec('title',60);
  const tl=wrapText(ctx,reelTitle(),W-140).slice(0,2), ty=Math.max(200,y-56); tl.forEach((l,k)=>ctx.fillText(l,W/2,ty-(tl.length-1-k)*74));
  ctx.font='700 36px "Gothic A1"'; ctx.fillStyle='rgba(255,255,255,.88)'; ctx.fillText(i<N-1?`${i+1} / ${N}`:`${S.info.name||'우리 가게'} · 전체 이야기는 게시물에서`,W/2,Math.min(H-60,y+ch+86)); }
async function drawStory(cv){ const W=1080,H=1920, ctx=cv.getContext('2d'); cv.width=W; cv.height=H; ctx.fillStyle='#1b1b1f'; ctx.fillRect(0,0,W,H); const L=mediaList(); if(!L.length) return;
  const c0=await srcCanvas(L[0]); ctx.drawImage(blurBg(c0),0,0,W,H);
  const cw=880, ch=Math.round(cw*c0.height/c0.width), x=(W-cw)/2, y=Math.round((H-ch)/2)+60;
  ctx.save(); ctx.shadowColor='rgba(0,0,0,.45)'; ctx.shadowBlur=50; ctx.shadowOffsetY=16; rrect(ctx,x,y,cw,ch,34); ctx.fillStyle='#fff'; ctx.fill(); ctx.restore();
  ctx.save(); rrect(ctx,x,y,cw,ch,34); ctx.clip(); ctx.drawImage(c0,x,y,cw,ch); ctx.restore();
  const head=ru().storyHead.trim()||'새 에피소드 올라왔어요'; await loadFonts({title:head+reelTitle(),sub:'',bubble:'',sfx:''});
  ctx.textAlign='center'; ctx.font='900 34px "Gothic A1"'; const pw=ctx.measureText('NEW EPISODE').width+56; ctx.fillStyle='#FFD53D'; rrect(ctx,(W-pw)/2,y-250,pw,60,30); ctx.fill(); ctx.fillStyle='#121214'; ctx.textBaseline='middle'; ctx.fillText('NEW EPISODE',W/2,y-220); ctx.textBaseline='alphabetic';
  ctx.fillStyle='#fff'; let fs=76; ctx.font=fspec('title',fs); while(fs>44&&ctx.measureText(head).width>W-120){ fs-=4; ctx.font=fspec('title',fs); } ctx.fillText(head,W/2,y-100);
  ctx.font='700 38px "Gothic A1"'; ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fillText(wrapText(ctx,reelTitle(),W-160)[0]||'',W/2,y-40);
  ctx.font='800 36px "Gothic A1"'; ctx.fillStyle='rgba(255,255,255,.92)'; ctx.fillText(`${S.info.name||'우리 가게'} 인스타툰 · 게시물에서 끝까지 보기`,W/2,Math.min(H-120,y+ch+110)); }
async function previewReuse(){ const sc=$('#storyCv'); if(sc) drawStory(sc); const rc=$('#reelCv'); const v=$('#reelVid');
  if(v&&reelUrl){ v.hidden=false; if(rc) rc.hidden=true; return; }
  if(rc&&!reelBusy){ const sl=await reelSlides(); drawReelFrame(rc.getContext('2d'),sl,Math.min(ru().sec*1000*0.6,1500),ru().sec*1000); } }
function resetReel(){ reelBlob=null; if(reelUrl) URL.revokeObjectURL(reelUrl); reelUrl=''; }
async function makeReel(){ const st=$('#st-reel');
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){ st.className='status err'; st.textContent='이 브라우저는 영상 만들기를 지원하지 않아요. 크롬 최신 버전에서 열어 주세요.'; return; }
  const mime=['video/mp4;codecs=avc1.42E01E','video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>{ try{ return MediaRecorder.isTypeSupported(m); }catch(_){ return false; } });
  if(!mime){ st.className='status err'; st.textContent='이 브라우저는 영상 저장 형식을 지원하지 않아요.'; return; }
  reelBusy=true; resetReel(); st.className='status'; st.innerHTML='<span class="spin"></span> 그림을 준비하는 중';
  try{ const sl=await reelSlides(); if(!sl.length) throw 0; const D=ru().sec*1000, total=D*sl.length+400;
    const rc=$('#reelCv'), v=$('#reelVid'); if(v){ v.hidden=true; v.removeAttribute('src'); } rc.hidden=false; const ctx=rc.getContext('2d');
    drawReelFrame(ctx,sl,0,D); const stream=rc.captureStream(30), rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000}), chunks=[];
    rec.ondataavailable=e=>{ if(e.data&&e.data.size) chunks.push(e.data); }; const done=new Promise(r=>rec.onstop=r);
    rec.start(250); const t0=performance.now();
    await new Promise(res=>{ const tick=()=>{ const t=performance.now()-t0; drawReelFrame(ctx,sl,Math.min(t,total-1),D); const s2=$('#st-reel'); if(s2) s2.innerHTML=`<span class="spin"></span> 영상 만드는 중 ${Math.min(100,Math.round(t/total*100))}% · 이 화면을 켜 두세요`; if(t<total) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
    rec.stop(); await done; stream.getTracks().forEach(t=>t.stop());
    reelExt=mime.includes('mp4')?'mp4':'webm'; reelBlob=new Blob(chunks,{type:mime.split(';')[0]}); reelUrl=URL.createObjectURL(reelBlob);
    const v2=$('#reelVid'); if(v2){ v2.src=reelUrl; v2.hidden=false; } rc.hidden=true; const dl=document.querySelector('[data-act="reelDl"]'); if(dl) dl.hidden=false;
    const s3=$('#st-reel'); s3.className='status'; s3.textContent=`완성! ${Math.round(total/1000)}초 영상 · ${(reelBlob.size/1048576).toFixed(1)}MB${/avc1/.test(mime)?'':' · 이 브라우저는 인스타가 가장 잘 받는 H.264 형식을 못 만들어요. 인스타 앱에 안 올라가면 크롬 최신 버전이나 사파리에서 다시 만들어 주세요.'}`;
    renderTodo();
  }catch(e){ const s3=$('#st-reel'); if(s3){ s3.className='status err'; s3.textContent='영상을 만들지 못했어요. 페이지를 새로고침하고 다시 해 주세요.'; } }
  finally{ reelBusy=false; } }
async function makeReelText(){ const st=$('#st-rt');
  const prompt=`너는 동네 가게 인스타 담당이야. 이 인스타툰을 그림이 한 장씩 넘어가는 릴스 영상으로도 올려. 릴스에 붙일 글을 써 줘.
${infoBlock()}
${S.toon?`[웹툰 대본]\n${toonText()}\n[게시물 캡션 - 이것과 겹치지 않게]\n${S.toon.caption||'(없음)'}`:`[영상 제목] ${reelTitle()||'(없음)'}`}
규칙: caption은 첫 줄 20자 이내 궁금증(결말 스포일러 금지), 모두 2~3줄, 마지막 줄은 "전체 이야기는 프로필 게시물에서" 같은 안내. 이모지 1~2개. hashtags는 5개 이내, 공백 구분, 동네·업종 + 릴스 추천에 맞는 조금 넓은 주제 1~2개. comment는 릴스 고정 댓글 1개(다음 편 예고나 가벼운 질문). 광고 단어·과장 표현 금지, 가게 정보에 없는 사실은 지어내지 않기.
JSON 하나로만 답해: {"caption":"","hashtags":"","comment":""}`;
  try{ const r=await ask(prompt,st,'릴스 글 쓰는 중',null,'quick'); const R=rt(); R.caption=String(r.caption||''); R.hashtags=Array.isArray(r.hashtags)?r.hashtags.join(' '):String(r.hashtags||''); R.comment=String(r.comment||''); save(); vReels(); toast('릴스용 글을 만들었어요'); }catch(_){} }

''')
# reels events
rep("  if(b.dataset.rsec){ ru().sec=+b.dataset.rsec; save(); document.querySelectorAll('[data-rsec]').forEach(c=>c.setAttribute('aria-pressed',c.dataset.rsec===b.dataset.rsec)); const s2=$('#st-reel'); const nn=cuts().length+(endOn()?1:0); if(s2&&!reelBusy){ s2.className='status'; s2.textContent=`약 ${nn}장 × ${ru().sec}초 = ${nn*ru().sec}초. 만드는 동안 이 화면을 켜 두세요.`; } return; }",
    "  if(b.dataset.rsec){ ru().sec=+b.dataset.rsec; save(); document.querySelectorAll('[data-rsec]').forEach(c=>c.setAttribute('aria-pressed',c.dataset.rsec===b.dataset.rsec)); const s2=$('#st-reel'), nn=mediaList().length; if(s2&&!reelBusy&&nn){ s2.className='status'; s2.textContent=`${nn}장 × ${ru().sec}초 = 약 ${nn*ru().sec}초. 만드는 동안 이 화면을 켜 두세요.`; } renderTodo(); return; }")
rep("  if(a==='statsAI') return run(b,statsAI);","  if(a==='statsAI') return run(b,statsAI);\n  if(a==='reelText') return run(b,makeReelText);\n  if(a==='reelCopy'){ const t=reelPostText(); if(!t.trim()){ toast('릴스 캡션이 비어 있어요. \"릴스용 글 만들기\"를 눌러 보세요'); return; } return copy(t); }\n  if(a==='reelCmtCopy') return copy(rt().comment||'');")
rep("  if(el.dataset.reuse){ ru()[el.dataset.reuse]=el.value; save(); clearTimeout(window._ru); window._ru=setTimeout(()=>{ const c=$('#storyCv'); if(c) drawStory(c); },250); return; }",
    "  if(el.dataset.reuse){ ru()[el.dataset.reuse]=el.value; save(); clearTimeout(window._ru); window._ru=setTimeout(()=>{ if(el.dataset.reuse==='title'&&reelUrl&&!reelBusy){ resetReel(); const v=$('#reelVid'); if(v){ v.hidden=true; v.removeAttribute('src'); } const rc=$('#reelCv'); if(rc) rc.hidden=false; const dl=document.querySelector('[data-act=\"reelDl\"]'); if(dl) dl.hidden=true; } previewReuse(); },300); return; }\n  if(el.dataset.rt){ rt()[el.dataset.rt]=el.value; return save(); }")
# media change resets reel video
rep("async function addPics(files,kind){","async function addPics(files,kind){ resetReel();")
rep("  if(b.dataset.pmove){","  if(b.dataset.pmove||b.dataset.pdel||b.dataset.rsrc) resetReel();\n  if(b.dataset.pmove){")

# ---------- help cards ----------
a=s.index('      <div class="hcard"><span class="hn">올리기와 진행 관리</span>'); b=s.index('</div>',s.index('</p>',a))+6
s=s[:a]+'      <div class="hcard"><span class="hn">그림 올리기와 글</span><p>3단계 ②에 Gemini·ChatGPT에서 받은 그림을 <b>한 번에 모두</b> 올리면 순서대로 모여요(몇 장이든 괜찮아요). <b>"완성 그림 전체 저장"</b>을 누르면 비율이 맞춰진 파일로 저장되고, 한 달 연재표에 "완성"으로 표시돼요. ③에서 게시물용 캡션·해시태그·첫 댓글을 복사해 쓰세요.</p></div>'+s[b:]
a=s.index('      <div class="hcard"><span class="hn">스토리·릴스·반응</span>'); b=s.index('</div>',s.index('</p>',a))+6
s=s[:a]+'      <div class="hcard"><span class="hn">스토리·릴스 · 반응</span><p>위쪽 <b>"스토리·릴스"</b> 탭에서 이번 편 그림(또는 직접 올린 그림)으로 한 장씩 넘어가는 릴스 영상과 스토리 이미지를 만들어요. 릴스용 캡션·해시태그·고정 댓글은 게시물과 따로 만들어져요. 올리고 2~3일 뒤 <b>"반응·댓글"</b> 탭에 반응을 적으면 다음 달 기획에 반영돼요.</p></div>'+s[b:]
open(p,'w').write(s); print('ok')
