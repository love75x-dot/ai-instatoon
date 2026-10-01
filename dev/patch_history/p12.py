import sys
p='/home/claude/toon-planner/index.html'; s=open(p).read()
def rep(a,b,cnt=1):
    global s
    if s.count(a)!=cnt: print('MISSING/COUNT',s.count(a),':',a[:140]); sys.exit(1)
    s=s.replace(a,b)

# ---------- CSS ----------
rep('.prof summary small{font-weight:600;color:var(--muted);margin-left:6px}\n', r'''.prof summary small{font-weight:600;color:var(--muted);margin-left:6px}
.feed{border:1px solid var(--line);border-radius:14px;padding:14px;margin-top:8px;max-width:420px;background:var(--surface)}
.feed-top{display:flex;align-items:center;gap:12px;margin-bottom:12px}.feed-top b{display:block;font-size:15px}.feed-top small{color:var(--muted);font-size:12.5px}
.fava{width:44px;height:44px;border-radius:50%;background:var(--ink);color:var(--surface);display:grid;place-items:center;font-weight:900;font-size:18px;flex:none}
.fgridi{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px}
.ftile{position:relative;aspect-ratio:3/4;background:var(--sunken);overflow:hidden}.ftile img,.ftile canvas{width:100%;height:100%;object-fit:cover;display:block}
.ftile .now{position:absolute;left:4px;top:4px;background:var(--accent);color:var(--accent-ink);font-size:10.5px;font-weight:900;padding:1px 6px;border-radius:4px}
.ftile .x{position:absolute;right:3px;top:3px;width:22px;height:22px;border-radius:50%;border:0;background:rgba(0,0,0,.55);color:#fff;font-size:13px;cursor:pointer;line-height:22px;padding:0}
.ftile.ph{border:1.5px dashed var(--line-2);background:transparent;display:grid;place-items:center;color:var(--muted);font-size:11.5px;text-align:center}
.ftile .cap{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.65));color:#fff;font-size:10.5px;padding:12px 5px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.endbox{display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:16px;border:1px solid var(--line);border-radius:14px;padding:16px;margin-top:14px;align-items:start}
.endbox canvas{width:100%;height:auto;border-radius:10px;border:1px solid var(--line);display:block}
@media (max-width:640px){.endbox{grid-template-columns:1fr}}
.pre{border:1px solid var(--line);border-radius:14px;padding:16px;margin-top:14px}
.pre .kck small{display:block;color:var(--muted);font-size:12.5px;margin-top:2px;text-decoration:none}.pre .kck small.hot{color:var(--bad);font-weight:700}
.pre .kck input:checked+span small{text-decoration:none}
#tour{position:fixed;inset:0;z-index:60}
.tour-hl{position:fixed;border-radius:14px;box-shadow:0 0 0 9999px rgba(10,10,12,.62);outline:3px solid var(--accent);pointer-events:none;transition:left .2s,top .2s,width .2s,height .2s}
.tour-tip{position:fixed;background:var(--surface);color:var(--ink);border-radius:14px;padding:14px 16px;box-shadow:0 12px 40px rgba(0,0,0,.28)}
.tour-tip b{display:block;font-size:16.5px;font-weight:900;margin:4px 0}.tour-tip p{margin:0 0 12px;font-size:14px;color:var(--ink-2);line-height:1.55}.tour-n{font-size:12px;font-weight:800;color:var(--muted)}
.demo-bar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;background:var(--accent);color:var(--accent-ink);border-radius:12px;padding:10px 14px;margin-bottom:14px;font-weight:700;font-size:14px}.demo-bar span{flex:1;min-width:200px}
.hero-act{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
''')

# ---------- markup ----------
rep('<section id="help" class="help" hidden></section>','<div class="demo-bar" id="demoBar" hidden></div>\n  <section id="help" class="help" hidden></section>')
rep('<div class="chips">${INDUSTRIES.map(','<div class="chips" id="indChips">${INDUSTRIES.map(')
rep('<p>업종만 골라도 만들 수 있어요. 실제로 있었던 일을 적어 주면 훨씬 재밌어져요.</p></div></div>','<p>업종만 골라도 만들 수 있어요. 실제로 있었던 일을 적어 주면 훨씬 재밌어져요.</p>${S.demo?\'\':`<div class="hero-act"><button class="btn sm" data-act="demo">예시 가게로 먼저 체험해 보기</button><button class="btn sm ghost" data-act="tour">30초 둘러보기</button></div>`}</div></div>')
rep('<div class="row"><h2 style="flex:1;margin:0;font-size:20px;font-weight:900">사용 방법</h2><button class="btn sm ghost" data-act="help">닫기</button></div>',
    '<div class="row"><h2 style="flex:1;margin:0;font-size:20px;font-weight:900">사용 방법</h2><button class="btn sm" data-act="tour">30초 둘러보기</button>${S.demo?\'\':\'<button class="btn sm" data-act="demo">예시 가게로 체험</button>\'}<button class="btn sm ghost" data-act="help">닫기</button></div>')

# ---------- renderPhone: end card slide ----------
rep("const cs=cuts(),n=cs.length,name=S.info.name||'우리가게';\n  if(pv>=n) pv=Math.max(0,n-1);",
    "const cs=cuts(),n=cs.length,name=S.info.name||'우리가게', tot=n+(endOn()?1:0);\n  if(pv>=tot) pv=Math.max(0,tot-1); const isEnd=n>0&&pv===n;")
rep('${cs[pv].img?`<canvas id="pcv"','${isEnd||cs[pv].img?`<canvas id="pcv"')
rep('${pv<n-1?`<button class="navb next"','${pv<tot-1?`<button class="navb next"')
rep('<span class="cnt">${pv+1}/${n}</span>','<span class="cnt">${pv+1}/${tot}</span>')
rep('<div class="dots">${cs.map((_,k)=>`<i class="${k===pv?\'on\':\'\'}"></i>`).join(\'\')}</div>','<div class="dots">${Array.from({length:tot},(_,k)=>`<i class="${k===pv?\'on\':\'\'}"></i>`).join(\'\')}</div>')
rep("const pc=$('#pcv'); if(pc) compose(pc,cs[pv]);","const pc=$('#pcv'); if(pc) (isEnd?drawEnd(pc):compose(pc,cs[pv]));")
rep("function drawAll(){","function drawAll(){ const ecv=document.getElementById('endCv'); if(ecv) drawEnd(ecv);")

# ---------- post layout ----------
rep('    <div class="row" style="margin-top:14px"><button class="btn pri" data-act="zip"','    ${endHTML()}\n    ${preHTML()}\n    <div class="row" style="margin-top:14px"><button class="btn pri" data-act="zip"')
rep('  <p class="sub">이 칸만 보면서 올리면 돼요. 여기서 고친 글은 자동 저장돼요.</p>','  <p class="sub">이 칸만 보면서 올리면 돼요. 여기서 고친 글은 자동 저장돼요.</p>\n  ${feedHTML()}')
rep("  drawAll(); kitCounters();\n}","  drawAll(); kitCounters(); drawFeedCur(); renderSpell();\n}")
rep("['order',`완성 이미지 ${n}장을 1컷부터 순서대로 골랐어요`]","['order',`완성 이미지 ${n+(endOn()?1:0)}장을 1컷부터 순서대로 골랐어요`]")

# zip includes end card
rep("  for(let i=0;i<cuts().length;i++){ if(cuts()[i].img) zip.file(`${base}_${String(i+1).padStart(2,'0')}.png`, await composedBlob(i)); }",
    "  for(let i=0;i<cuts().length;i++){ if(cuts()[i].img) zip.file(`${base}_${String(i+1).padStart(2,'0')}.png`, await composedBlob(i)); }\n  if(endOn()){ const cv=document.createElement('canvas'); await drawEnd(cv); zip.file(`${base}_${String(cuts().length+1).padStart(2,'0')}_안내.png`, await cvBlob(cv)); }")

# todo: pre-check stage
rep("  if(!T.zipped) return {t:'모든 컷 완성!","  const pl=preLeft(); if(pl&&!T.zipped) return {t:`모든 컷 완성! 저장 전에 올리기 전 점검 ${pl}개를 확인해 주세요`,go:'#pre',stage:3};\n  if(!T.zipped) return {t:'모든 컷 완성!")

# ---------- new code block ----------
rep("/* ================= 연재 진행판 ================= */", r'''/* ================= 마지막 장 안내 카드 ================= */
const END_STYLES={light:{name:'흰 바탕',bg:'#FFFFFF',ink:'#121214',sub:'#55555C',pill:'#121214',pillInk:'#FFFFFF',line:'#E3E3E0'},dark:{name:'검은 바탕',bg:'#141416',ink:'#FFFFFF',sub:'#B8B8BF',pill:'#FFD53D',pillInk:'#121214',line:'#34343A'},point:{name:'노란 포인트',bg:'#FFD53D',ink:'#121214',sub:'#3A3A3F',pill:'#121214',pillInk:'#FFFFFF',line:'#E6BE2E'}};
function ec(){ S.endcard={on:false,style:'light',head:'',lines:'',btn:'',...(S.endcard||{})}; return S.endcard; }
const endOn=()=>!!(S.endcard&&S.endcard.on)&&cuts().length>0;
function endLines(){ const l=lines(ec().lines); if(!l.length&&prof().cta.trim()) l.push(prof().cta.trim()); return l.slice(0,4); }
function rrect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
async function drawEnd(cv){ const e=ec(), P=END_STYLES[e.style]||END_STYLES.light, W=1080, H=ratio().h, ctx=cv.getContext('2d'); cv.width=W; cv.height=H;
  const name=S.info.name||S.info.type||'우리 가게', head=e.head.trim()||'다음 편도 궁금하다면?', ls=endLines(), btn=e.btn.trim()||'프로필 링크에서 예약하기', tall=H>1200;
  await loadFonts({title:head+btn,sub:'',bubble:'',sfx:''}); try{ await document.fonts.load('800 40px "Gothic A1"',name+ls.join('')+'저장해 두고 다음 편도 봐 주세요'); }catch(_){}
  ctx.fillStyle=P.bg; ctx.fillRect(0,0,W,H); ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  const R=tall?128:100, cy=(tall?90:60)+R; const withImg=cuts().filter(c=>c.img); let src=(withImg[withImg.length-1]||{}).img||null;
  if(!src){ try{ src=refOf(0)||null; }catch(_){} }
  ctx.save(); ctx.beginPath(); ctx.arc(W/2,cy,R,0,Math.PI*2); ctx.fillStyle=P.line; ctx.fill();
  if(src){ try{ const im=await getImg(src); ctx.clip(); const s2=Math.max(2*R/im.width,2*R/im.height)*1.35; ctx.drawImage(im,W/2-im.width*s2/2,cy-im.height*s2*0.42,im.width*s2,im.height*s2); }catch(_){} }
  else { ctx.fillStyle=P.ink; ctx.font=`900 ${Math.round(R*0.9)}px "Gothic A1"`; ctx.textBaseline='middle'; ctx.fillText([...name][0]||'가',W/2,cy+6); ctx.textBaseline='alphabetic'; }
  ctx.restore(); ctx.lineWidth=7; ctx.strokeStyle=P.ink; ctx.beginPath(); ctx.arc(W/2,cy,R,0,Math.PI*2); ctx.stroke();
  let y=cy+R+62; ctx.fillStyle=P.sub; ctx.font='800 38px "Gothic A1"'; ctx.fillText(name,W/2,y);
  let size=tall?100:86; ctx.font=fspec('title',size); let hl=head.split('\n').flatMap(l=>wrapText(ctx,l,W-150)).slice(0,2);
  while(size>52&&Math.max(...hl.map(l=>ctx.measureText(l).width))>W-140){ size-=4; ctx.font=fspec('title',size); hl=head.split('\n').flatMap(l=>wrapText(ctx,l,W-150)).slice(0,2); }
  y+=tall?40:26; ctx.fillStyle=P.ink; hl.forEach(l=>{ y+=size*1.15; ctx.fillText(l,W/2,y); });
  const fs=tall?38:34, gap=tall?60:50; ctx.font=`700 ${fs}px "Gothic A1"`; ctx.fillStyle=P.sub; y+=tall?44:30;
  ls.forEach(l=>{ const w=wrapText(ctx,l,W-160)[0]; y+=gap; ctx.fillText(w,W/2,y); });
  const bh=tall?112:96, bf=tall?44:40; ctx.font=`800 ${bf}px "Gothic A1"`; const bw=Math.min(W-140,ctx.measureText(btn).width+150);
  const by=Math.min(H-(tall?210:160),Math.max(y+(tall?70:44),H*(tall?0.74:0.72)));
  ctx.fillStyle=P.pill; rrect(ctx,(W-bw)/2,by,bw,bh,bh/2); ctx.fill(); ctx.fillStyle=P.pillInk; ctx.textBaseline='middle'; ctx.fillText(btn,W/2,by+bh/2+2); ctx.textBaseline='alphabetic';
  ctx.fillStyle=P.sub; ctx.font='700 30px "Gothic A1"'; ctx.fillText('저장해 두고 다음 편도 봐 주세요',W/2,H-(tall?70:52)); }
function endHTML(){ const e=ec();
  return `<div class="endbox" id="endbox"><div>
    <b style="font-size:15px">마지막 장 안내 카드</b> <small style="color:var(--muted)">선택 · 웹툰 맨 뒤에 한 장 더</small>
    <div class="chips" style="margin-top:8px"><button class="chip" data-endon="1" aria-pressed="${e.on}">붙이기</button><button class="chip" data-endon="0" aria-pressed="${!e.on}">안 붙이기</button></div>
    ${e.on?`<label class="f">색</label><div class="chips">${Object.entries(END_STYLES).map(([k,v])=>`<button class="chip" data-endst="${k}" aria-pressed="${e.style===k}">${v.name}</button>`).join('')}</div>
    <label class="f" for="e-head">큰 문구</label><input class="in" id="e-head" data-end="head" value="${esc(e.head)}" placeholder="다음 편도 궁금하다면?">
    <label class="f" for="e-lines">안내 <small>한 줄에 하나 · 최대 4줄 · 비우면 가게 프로필의 예약 안내</small></label><textarea class="in" id="e-lines" data-end="lines" rows="3" placeholder="📍 망원동 123-4 (망원역 2번 출구 3분)&#10;⏰ 매일 11:00~21:00 · 월요일 휴무">${esc(e.lines)}</textarea>
    <label class="f" for="e-btn">버튼 문구</label><input class="in" id="e-btn" data-end="btn" value="${esc(e.btn)}" placeholder="프로필 링크에서 예약하기">
    <p class="sub" style="margin-top:8px">한 번 만들어 두면 다음 편에도 그대로 붙어요. 전체 저장(zip)할 때 마지막 번호로 들어가고, 가운데 동그라미엔 마지막 컷 그림이 들어가요.</p>`
    :`<p class="sub" style="margin-top:8px">예약 방법·위치·영업시간을 담은 한 장을 맨 뒤에 붙여요. 웹툰을 끝까지 본 손님이 바로 행동할 수 있게요.</p>`}
  </div>${e.on?`<div><canvas id="endCv" width="1080" height="${ratio().h}" aria-label="마지막 장 안내 카드 미리보기"></canvas><button class="btn sm" data-act="endDl" style="margin-top:8px">이 장만 저장</button></div>`:''}</div>`; }
function refreshEnd(){ const b=$('#endbox'); if(b) b.outerHTML=endHTML(); drawAll(); renderPhone(); kitCounters(); }

/* ================= 피드 격자 미리보기 ================= */
const hist=()=>(S.history=S.history||[]);
function cropThumb(src){ const cv=document.createElement('canvas'); cv.width=270; cv.height=360; const ctx=cv.getContext('2d'), w=src.width, h=src.height, s2=Math.max(270/w,360/h); ctx.fillStyle='#fff'; ctx.fillRect(0,0,270,360); ctx.drawImage(src,(270-w*s2)/2,(360-h*s2)/2,w*s2,h*s2); return cv; }
async function coverThumb(){ const c=document.createElement('canvas'); await compose(c,cuts()[0]); return cropThumb(c).toDataURL('image/jpeg',0.82); }
async function drawFeedCur(){ const t=$('#feedCur'); if(!t||!cuts().length) return; const c=document.createElement('canvas'); await compose(c,cuts()[0]); t.getContext('2d').drawImage(cropThumb(c),0,0); }
function feedHTML(){ const T=S.toon, H=hist(), name=S.info.name||'우리가게', cur=!T.postedAt;
  const tiles=[...(cur?[`<div class="ftile"><canvas id="feedCur" width="270" height="360" aria-label="이번 편 표지"></canvas><span class="now">이번 편</span></div>`]:[]),
    ...H.map(h=>`<div class="ftile">${h.thumb?`<img src="${h.thumb}" alt="${esc(h.title)} 표지">`:''}<span class="cap">${esc((h.date?h.date+' ':'')+h.title)}</span>${h.hid===T.hid?'<span class="now">이번 편</span>':''}<button class="x" data-fdel="${h.hid}" aria-label="격자에서 빼기">×</button></div>`)];
  while(tiles.length<6) tiles.push('<div class="ftile ph">지난<br>게시물</div>');
  return `<div class="lab-row" style="margin-top:6px"><label class="f">피드 격자 미리보기 <small>프로필에 들어온 손님이 보는 모습</small></label><button class="btn sm" data-act="feedAdd">예전 게시물 표지 추가</button></div>
  <div class="feed"><div class="feed-top"><span class="fava">${esc([...name][0]||'가')}</span><div><b>${esc(name)}</b><small>게시물 ${H.length+(cur?1:0)}</small></div></div><div class="fgridi">${tiles.slice(0,12).join('')}</div></div>
  <p class="sub" style="margin-top:6px">인스타 프로필 격자는 세로 3:4로 잘려 보여요.${ratio().h!==1440?` 지금 비율(${ratio().name})은 양옆이 조금 잘리니 표지 제목은 가운데에 두세요.`:''} "인스타에 올렸어요"를 누르면 이번 편 표지가 여기 쌓여서, 다음 편 표지 색과 느낌을 비교할 수 있어요. 예전에 올린 게시물은 화면을 캡처해서 추가하면 돼요.</p>`; }

/* ================= 올리기 전 점검 ================= */
const AD_WORDS=['최고','최초','1등','유일','100%','무조건','완치','보장','특효','최저가','부작용 없'];
function preItems(){ const T=S.toon||{}, all=[...cuts().map(c=>[c.title,c.sub,c.bubble,c.caption].join(' ')),T.caption||'',T.comment||'',ec().on?[ec().head,ec().lines,ec().btn].join(' '):''].join(' ');
  const nums=[...new Set(all.match(/\d[\d,.]*\s*(%|원|만원|천원|시간|시|분|일|개월|명|개|회|잔|kg|g)|\d{1,2}\/\d{1,2}|\d{1,2}월\s?\d{1,2}일/g)||[])];
  const ads=[...new Set([...AD_WORDS.filter(w=>all.includes(w)),...bannedHits(all)])], photo=[0,1,2].some(k=>getPhoto(k));
  return [
    ['spell','제목·대사·캡션의 맞춤법과 띄어쓰기를 확인했어요','아래 "AI 맞춤법 검사"로 한 번에 볼 수 있어요.',false],
    ['fact','가격·할인·날짜·영업시간이 실제와 같아요',nums.length?`확인할 숫자: ${nums.slice(0,8).join(', ')}`:'대본에 숫자가 없어요.',false],
    ['ad','과장 광고 표현이 없어요',ads.length?`찾은 표현: ${ads.join(', ')} · 병원·약국·식품·뷰티는 광고 규정에 걸릴 수 있어요`:'찾은 과장 표현이 없어요.',ads.length>0],
    ['consent',photo?'사진을 참고한 직원·손님에게 인스타에 쓴다고 동의를 받았어요':'실제 손님 이야기라면 알아볼 수 있는 이름·얼굴을 뺐어요',photo?'사진으로 만든 캐릭터는 실제 인물과 닮아 보여요.':'',false],
    ['copy','다른 작품 캐릭터나 브랜드 로고를 따라 하지 않았어요','',false],
    ['look','폰 크기로 넘겨 보며 글자가 잘 읽히는지 확인했어요','오른쪽 미리보기에서 한 장씩 넘겨 보세요.',false] ]; }
const preLeft=()=>{ const T=S.toon; if(!T) return 0; return preItems().filter(([k])=>!T.pre?.[k]).length; };
function preHTML(){ const T=S.toon, it=preItems();
  return `<div class="pre" id="pre"><div class="lab-row"><b style="font-size:15px">올리기 전 점검 <span class="cnt" id="cnt-pre">${it.length-preLeft()} / ${it.length}</span></b><button class="btn sm" data-act="spell">AI 맞춤법 검사</button></div>
    <p class="sub" style="margin:4px 0 8px">한 번 올리면 고치기 어려워요. 저장하기 전에 30초만 확인해 주세요.</p>
    <div class="kchecks">${it.map(([k,t,h,hot])=>`<label class="kck"><input type="checkbox" data-preck="${k}" ${T.pre?.[k]?'checked':''}><span>${esc(t)}${h?`<small class="${hot?'hot':''}">${esc(h)}</small>`:''}</span></label>`).join('')}</div>
    <div class="status" id="st-spell"></div><div class="fixes" id="spellList" style="margin-top:8px"></div></div>`; }
async function spellCheck(){ const T=S.toon, st=$('#st-spell');
  const prompt=`아래 인스타툰 대본과 캡션에서 한국어 맞춤법·띄어쓰기·오타만 찾아 줘. 말투, 사투리, 일부러 쓴 줄임말, 의성어·의태어, 말줄임은 고치지 마. 뜻과 길이는 그대로.
[대본]
${toonText()}
[캡션]
${T.caption||'(없음)'}
before는 원문에 글자 그대로 있는 짧은 부분(단어~짧은 구절)만. 틀린 곳이 없으면 빈 배열.
JSON 하나로만 답해: {"fixes":[{"cut":1,"field":"title","before":"","after":"","reason":""}]}
field는 title, bubble, sub, sfx, caption 중 하나. 캡션이면 cut은 0, field는 "caption".`;
  try{ const r=await ask(prompt,st,'맞춤법 보는 중',null,'quick');
    T.spell=(r.fixes||[]).filter(f=>f&&f.before&&f.after&&f.before!==f.after).slice(0,20).map(f=>({cut:Number(f.cut)||0,field:String(f.field||''),before:String(f.before),after:String(f.after),reason:String(f.reason||''),applied:false}));
    save(); renderSpell(); if(st) st.textContent=T.spell.length?`${T.spell.length}곳을 찾았어요. 맞으면 "반영"을 눌러 주세요.`:'틀린 곳을 찾지 못했어요 👍'; }catch(_){} }
function renderSpell(){ const T=S.toon, el=$('#spellList'); if(!el||!T) return;
  el.innerHTML=(T.spell||[]).map((f,k)=>`<div class="fix"><div><b>${f.field==='caption'?'캡션':`${f.cut}컷 ${fieldName(f.field)}`}</b><br><del>${esc(f.before)}</del> → <ins>${esc(f.after)}</ins>${f.reason?`<small>${esc(f.reason)}</small>`:''}</div><button class="btn sm" data-spfix="${k}" ${f.applied?'disabled':''}>${f.applied?'반영됨':'반영'}</button></div>`).join(''); }
function applySpell(k){ const T=S.toon, f=T.spell?.[k]; if(!f) return; const tgt=f.field==='caption'?T:cuts()[f.cut-1], key=f.field==='caption'?'caption':f.field;
  if(!tgt||typeof tgt[key]!=='string'||!tgt[key].includes(f.before)){ toast('원문에서 그 부분을 찾지 못했어요. 직접 고쳐 주세요'); return; }
  tgt[key]=tgt[key].replace(f.before,f.after); f.applied=true; save(); renderSpell(); drawAll(); renderPhone(); const kc=$('#k-cap'); if(kc&&key==='caption') kc.value=T.caption; kitCounters(); toast('반영했어요'); }

/* ================= 둘러보기 ================= */
const TOUR=()=>[
  ['#modes','두 가지 방법이 있어요','"한 편 만들기"는 가게 이야기 하나로 인스타툰 한 편, "한 달 기획"은 한 달 동안 올릴 주제를 날짜별로 한 번에 짜요.'],
  ['#steps','한 편은 딱 3단계','이야기 적기 → 대본 다듬기 → 그림 받고 올리기. 끝난 단계엔 ✓가 붙어요.'],
  ['#todo','헷갈리면 이 줄만 보세요','지금 해야 할 일을 한 줄로 알려줘요. "여기로"를 누르면 그 버튼으로 데려가요.'],
  ['.arts','① 그림체 고르기','13가지 웹툰 테마 중 하나를 고르면 모든 컷과 캐릭터가 같은 그림체로 나와요.'],
  ['#indChips','② 업종만 고르면 시작할 수 있어요','꼭 필요한 건 업종 하나예요. 주인공, 있었던 일, 알리고 싶은 것은 적을수록 재밌어져요.'],
  ['.prof','가게 프로필은 한 번만','말투, 해시태그, 예약 안내를 적어 두면 모든 편에 자동으로 들어가요.'],
  ['#makeBtn','이 버튼 하나면 대본 완성','30초~1분이면 컷별 대본, 첫 장 제목 후보, 캡션, 해시태그가 나와요.'],
  ['#phone','인스타에서 보이는 모습','만든 인스타툰을 여기서 손님처럼 넘겨 볼 수 있어요.'],
  ['.topbar>.row','막히거나 옮길 때','"막힐 때"는 자주 생기는 문제 해결, "백업 저장"은 다른 컴퓨터로 옮길 때 써요. 이 안내는 "사용 방법"에서 다시 볼 수 있어요.'],
];
let tourI=-1;
const tourVis=sel=>{ const el=document.querySelector(sel); return !!el&&!el.closest('[hidden]')&&el.getClientRects().length>0; };
function startTour(){ $('#help').hidden=true; $('#trouble').hidden=true; if((S.mode||'one')!=='one'||S.step!=='input'){ S.mode='one'; S.step='input'; save(); render(); } tourI=0; showTour(1); try{ localStorage.setItem('instatoon.helpSeen','1'); }catch(_){} }
function endTour(){ tourI=-1; const o=$('#tour'); if(o) o.remove(); }
function showTour(dir=1){ const st=TOUR(); while(tourI>=0&&tourI<st.length&&!tourVis(st[tourI][0])) tourI+=dir; if(tourI<0) tourI=0; if(tourI>=st.length) return endTour();
  document.querySelector(st[tourI][0]).scrollIntoView({block:'center'});
  let o=$('#tour'); if(!o){ o=document.createElement('div'); o.id='tour'; o.innerHTML='<div class="tour-hl"></div><div class="tour-tip" role="dialog" aria-modal="true" aria-label="둘러보기"></div>'; document.body.appendChild(o); }
  const [,t,d]=st[tourI]; o.querySelector('.tour-tip').innerHTML=`<span class="tour-n">${tourI+1} / ${st.length}</span><b>${esc(t)}</b><p>${esc(d)}</p><div class="row"><button class="btn sm ghost" data-tour="end">건너뛰기</button><span class="grow"></span>${tourI?'<button class="btn sm" data-tour="prev">이전</button>':''}<button class="btn sm pri" data-tour="next">${tourI===st.length-1?'시작하기':'다음'}</button></div>`;
  placeTour(); o.querySelector('[data-tour="next"]').focus({preventScroll:true}); }
function placeTour(){ const o=$('#tour'); if(!o||tourI<0) return; const el=document.querySelector(TOUR()[tourI][0]); if(!el) return;
  const r=el.getBoundingClientRect(), pad=8, hl=o.querySelector('.tour-hl'), tip=o.querySelector('.tour-tip');
  const top=Math.max(4,r.top-pad), bot=Math.min(innerHeight-4,r.bottom+pad);
  Object.assign(hl.style,{left:Math.max(4,r.left-pad)+'px',top:top+'px',width:Math.min(innerWidth-8,r.width+pad*2)+'px',height:Math.max(0,bot-top)+'px'});
  const tw=Math.min(340,innerWidth-32); tip.style.width=tw+'px'; const th=tip.offsetHeight;
  let ty=bot+12; if(ty+th>innerHeight-12) ty=top-12-th; if(ty<12) ty=innerHeight-th-16;
  tip.style.top=ty+'px'; tip.style.left=Math.min(Math.max(16,r.left),innerWidth-tw-16)+'px'; }
addEventListener('resize',placeTour); addEventListener('scroll',placeTour,{passive:true});
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&tourI>=0) endTour(); });

/* ================= 예시 가게 체험 ================= */
let demoSaved=null;
function demoState(){ const b=blank(), M=monthOptions()[0], dates=planDates(M,8);
  const cut=(o,k)=>normCut({role:'',shot:'미디엄샷',title:'',highlight:'',sub:'',bubble:'',bubbleSide:'l',sfx:'',direction:'',panels:'',caption:'',extras:'',...o},k);
  return {...b, demo:true, step:'edit', mode:'one',
    info:{...b.info,type:'빵집',name:'보리당',role:'사장님',gender:'여성',age:'40대',looks:'짧은 단발, 동그란 안경, 밀가루 묻은 베이지 앞치마',story:'오후 3시에 빵이 전부 사라졌다. CCTV를 보니 단골 할머니가 경로당 친구들 몫까지 다 사 가신 것. 그 뒤로 오후 3시에 한 판 더 굽는다.',offer:'오후 3시 추가 굽기',cuts:6,art:'chibi',p2:{role:'알바생',gender:'남성',age:'20대',looks:'까치머리, 초록 앞치마',on:true}},
    profile:{voice:'다정한 존댓말, 이모지는 한두 개',banned:'최고, 1등',tags:'#보리당 #망원동빵집',cta:'📍 망원동 보리당 · 매일 8시~20시 (일요일 휴무)',loc:'보리당',collab:''},
    endcard:{on:true,style:'point',head:'내일 오후 3시,\n갓 구운 빵 한 판 더',lines:'📍 망원동 보리당 (망원역 1번 출구 5분)\n⏰ 매일 8:00~20:00 · 일요일 휴무',btn:'프로필 링크에서 길 찾기'},
    toon:{title:'오후 3시, 빵이 다 사라졌다',tone:'미스터리 반전',hookIdx:0,hooks:['오후 3시,\n빵이 다 사라졌다','CCTV에 찍힌\n범인의 정체','빵집 사장님이\n얼어붙은 이유'],
      cuts:[cut({role:'표지 · 사건',shot:'부감',title:'오후 3시,\n빵이 다 사라졌다',highlight:'다 사라졌다',sfx:'텅—',direction:'텅 빈 빵 진열대 앞에 사장님이 빈 쟁반을 든 채 얼어붙어 있다.',extras:'땀방울'},0),
        cut({role:'궁금증',shot:'미디엄샷',bubble:'사장님(떨림): 아, 아까까지 가득했는데…\n알바생: 사장님… 저 아무것도 안 했어요',caption:'오후 2시 58분',direction:'사장님이 진열대를 가리키고, 알바생이 두 손을 들고 억울한 표정.'},1),
        cut({role:'추적',shot:'클로즈업',bubble:'알바생(속삭임): CCTV 돌려 볼까요?\n사장님: …돌려 봐',sfx:'딸깍',direction:'둘이 계산대 모니터에 얼굴을 바짝 대고 있다. 모니터 화면은 글자 없이 흐릿한 실루엣만.'},2),
        cut({role:'반전',shot:'초클로즈업',title:'범인은\n단골 할머니',highlight:'단골 할머니',bubble:'사장님(외침): 저 할머니가…?!',direction:'모니터 속 작은 할머니가 빵을 쟁반 가득 담는 모습, 사장님 눈이 커진다.',extras:'집중선'},3),
        cut({role:'진실',shot:'미디엄샷',bubble:'할머니: 경로당 친구들이 여기 빵만 찾아서~\n사장님(속마음): 우리 빵이… 소문이 났구나',caption:'다음 날 오전',direction:'할머니가 웃으며 사장님 손을 꼭 잡는다. 따뜻한 햇살.'},4),
        cut({role:'행동 유도',shot:'풀샷',title:'그래서 이제\n오후 3시에 한 판 더',highlight:'한 판 더',bubble:'사장님: 늦게 오셔도 드실 수 있게 구워 둘게요',sub:'보리당 · 오후 3시 추가 굽기',direction:'사장님과 알바생이 갓 구운 빵 쟁반을 들고 환하게 웃는다. 김이 모락모락.',extras:'반짝이'},5)],
      caption:'빵이 전부 사라진 오후 3시, CCTV를 돌려 봤더니… 🥐\n범인은 매일 오시는 단골 할머니였어요.\n경로당 친구분들께 나눠 드리려고 한 번에 다 담아 가셨대요.\n그래서 이제 오후 3시에 한 판 더 굽습니다.\n늦게 오셔도 빈손으로 돌아가지 않게요 😊',
      hashtags:'#망원동빵집 #동네빵집 #빵집일상',comment:'여러분 동네에도 이런 단골 계신가요? 👀\n📌 오후 3시 추가 굽기는 월~토 매일이에요!',cast:'단골 할머니 - 흰 단발 파마, 보라색 카디건, 장바구니',ideas:['알바생의 첫 반죽','새벽 5시의 빵집','비 오는 날 우산 대여']},
    month:{ym:M,freq:8,memo:'단골 할머니 사건\n알바생 첫 출근',concept:'빵 냄새 나는 동네 미스터리',items:[
      {date:dates[0]||'',type:'실화 사건',title:'오후 3시, 빵이 다 사라졌다',story:'빵이 전부 사라진 오후, CCTV 속 범인은 단골 할머니였다.',goal:'공감',cuts:6,made:true,status:'script'},
      {date:dates[1]||'',type:'비하인드',title:'새벽 5시, 불 켜진 빵집',story:'아무도 모르는 새벽 반죽 시간. 사장님이 매일 하는 한 가지 의식.',goal:'신뢰',cuts:6,status:'plan'},
      {date:dates[2]||'',type:'손님 고민',title:'식빵, 냉동해도 되나요?',story:'가장 많이 받는 질문에 사장님이 답한다. 맛있게 보관하는 법.',goal:'정보',cuts:5,status:'plan'},
      {date:dates[3]||'',type:'소식',title:'알바생의 첫 작품',story:'알바생이 처음 만든 빵이 진열대에 올라가는 날. 결과는?',goal:'홍보',cuts:6,status:'plan'}]},
    history:[]}; }
function startDemo(){ if(S.demo) return; const snap=JSON.stringify(S); let ok=true; try{ localStorage.setItem('instatoon.demoBackup',snap); }catch(_){ ok=false; demoSaved=snap; }
  S=demoState(); pv=0; openCut=0; save(); $('#help').hidden=true; render(); window.scrollTo({top:0,behavior:'smooth'});
  toast(ok?'예시 가게 "보리당"으로 체험을 시작해요':'체험 중에는 새로고침하지 마세요. 원래 작업이 커서 임시 보관만 해 뒀어요'); }
function endDemo(){ let snap=demoSaved; try{ snap=localStorage.getItem('instatoon.demoBackup')||snap; localStorage.removeItem('instatoon.demoBackup'); }catch(_){}
  let d=null; try{ d=JSON.parse(snap||'null'); }catch(_){} const b=blank(); S=d&&d.info?{...b,...d,info:{...b.info,...d.info}}:b; delete S.demo; demoSaved=null; pv=0; save(); applyRatio(); render(); window.scrollTo({top:0,behavior:'smooth'}); toast('내 가게 작업으로 돌아왔어요'); }
function renderDemo(){ const el=$('#demoBar'); if(!el) return; el.hidden=!S.demo; if(S.demo) el.innerHTML='<span>🥐 지금은 예시 가게 "보리당"으로 체험 중이에요. 마음껏 눌러 보세요. 내 작업은 안전하게 따로 보관돼 있어요.</span><button class="btn sm" data-act="demoEnd">체험 끝내고 내 가게로</button>'; }

/* ================= 연재 진행판 ================= */''')

rep("function render(){ renderModes();","function render(){ renderDemo(); renderModes();")
rep("try{ if(!localStorage.getItem('instatoon.helpSeen')) toggleHelp(true); }catch(_){}","try{ if(!localStorage.getItem('instatoon.helpSeen')) setTimeout(startTour,700); }catch(_){}")

# ---------- events ----------
rep("  if(b.dataset.todo) return goTodo();","""  if(b.dataset.todo) return goTodo();
  if(b.dataset.tour){ const d=b.dataset.tour; if(d==='end') return endTour(); if(d==='next'&&tourI>=TOUR().length-1) return endTour(); tourI+=d==='next'?1:-1; return showTour(d==='prev'?-1:1); }
  if(b.dataset.endon){ ec().on=b.dataset.endon==='1'; save(); return refreshEnd(); }
  if(b.dataset.endst){ ec().style=b.dataset.endst; save(); return refreshEnd(); }
  if(b.dataset.fdel){ S.history=hist().filter(h=>String(h.hid)!==b.dataset.fdel); save(); return vPost(); }
  if(b.dataset.spfix) return applySpell(+b.dataset.spfix);""")
rep("  if(a==='trouble') return toggleTrouble();","""  if(a==='trouble') return toggleTrouble();
  if(a==='tour') return startTour();
  if(a==='demo') return startDemo();
  if(a==='demoEnd') return endDemo();
  if(a==='spell') return run(b,spellCheck);
  if(a==='feedAdd'){ feedPick=true; refPick=null; photoPick=null; upMany=false; return pickFile(false); }
  if(a==='endDl'){ const cv=document.createElement('canvas'); await drawEnd(cv); return saveFile(`${(S.info.name||'instatoon').replace(/\\s+/g,'_')}_${cuts().length+1}_안내.png`, await cvBlob(cv)); }""")
rep("save(); vPost(); toast(x?'연재표에도","T.hid=T.hid||Date.now(); let th=''; try{ th=await coverThumb(); }catch(_){} S.history=[{hid:T.hid,title:T.title,date:T.postedAt,thumb:th,link:T.link||''},...hist().filter(h=>h.hid!==T.hid)].slice(0,12); save(); vPost(); toast(x?'연재표에도")
rep("if(a==='unposted'){ const T=S.toon; T.postedAt='';","if(a==='unposted'){ const T=S.toon; T.postedAt=''; S.history=hist().filter(h=>h.hid!==T.hid);")
rep("  if(a==='zip') return run(b,","  if(a==='zip'&&preLeft()&&!window._zipOk){ window._zipOk=true; const el=$('#pre'); if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.classList.add('flash'); setTimeout(()=>el.classList.remove('flash'),1800); } toast('올리기 전 점검을 먼저 확인해 주세요. 그냥 저장하려면 한 번 더 누르세요'); return; }\n  if(a==='zip') return run(b,")
rep("else if(k==='link'){ T.link=el.value.trim(); const x=planItem(); if(x) x.link=T.link; }","else if(k==='link'){ T.link=el.value.trim(); const x=planItem(); if(x) x.link=T.link; const h=hist().find(h=>h.hid===T.hid); if(h) h.link=T.link; }")
rep("  if(el.dataset.kitck){","""  if(el.dataset.preck){ const T=S.toon; T.pre={...(T.pre||{}),[el.dataset.preck]:el.checked}; save(); const c=$('#cnt-pre'); if(c) c.textContent=`${preItems().length-preLeft()} / ${preItems().length}`; return renderTodo(); }
  if(el.dataset.end){ ec()[el.dataset.end]=el.value; save(); clearTimeout(window._ed); window._ed=setTimeout(()=>{ const c=$('#endCv'); if(c) drawEnd(c); renderPhone(); },200); return; }
  if(el.dataset.kitck){""")
rep("let upTarget=0, upMany=false, refPick=null, photoPick=null;","let upTarget=0, upMany=false, refPick=null, photoPick=null, feedPick=false;")
rep("  if(photoPick!==null){","  if(feedPick){ feedPick=false; try{ const d=await fileToImg(files[0]); const im=await getImg(d); S.history=[...hist(),{hid:Date.now(),title:'지난 게시물',date:'',thumb:cropThumb(im).toDataURL('image/jpeg',0.82),link:''}].slice(0,12); save(); vPost(); toast('격자에 추가했어요'); }catch(_){ toast('이미지를 읽지 못했어요'); } return; }\n  if(photoPick!==null){")
open(p,'w').write(s); print('ok')
