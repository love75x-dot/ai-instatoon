import re
p='index.html'; s=open(p).read()
def rep(a,b,cnt=1):
    global s
    if a not in s: raise SystemExit('MISSING: '+a[:110])
    s=s.replace(a,b,cnt)

# ===== RATIO =====
rep("const artOf=()=>ARTS[S.info.art]||ARTS.chibi;","""const RATIOS={'1:1':{h:1080,name:'1:1 정사각형',px:'1080×1080',api:'1:1'},'4:5':{h:1350,name:'4:5 세로',px:'1080×1350',api:'4:5'},'3:4':{h:1440,name:'3:4 세로',px:'1080×1440',api:'3:4'}};
const ratio=()=>RATIOS[S.info.ratio]||RATIOS['1:1'];
const ratioText=()=>`${ratio().name} 비율(${ratio().px}px)`;
function applyRatio(){ const r=ratio(); document.documentElement.style.setProperty('--ar',`1080 / ${r.h}`); }
const artOf=()=>ARTS[S.info.art]||ARTS.chibi;""")
rep("4. 1:1 정사각형. 윗부분 4분의 1은 제목 자리로 비교적 비워 두세요.","4. 모든 컷은 반드시 ${ratioText()}. 컷마다 비율이 달라지면 안 돼요. 윗부분 4분의 1은 제목 자리로 비교적 비워 두세요.")
rep("검은 테두리 선은 넣지 말고 1:1 화면을 끝까지","검은 테두리 선은 넣지 말고 ${ratio().name} 화면을 끝까지")
rep("{responseModalities:['TEXT','IMAGE'],responseFormat:{image:{aspectRatio:'1:1'}}}","{responseModalities:['TEXT','IMAGE'],responseFormat:{image:{aspectRatio:ratio().api}}}")
s=s.replace("imageConfig:{aspectRatio:'1:1'}","imageConfig:{aspectRatio:ratio().api}")
s=s.replace("1:1 정사각형. 글자, 숫자, 말풍선은 넣지 마세요.`}]);","${ratioText()}. 글자, 숫자, 말풍선은 넣지 마세요.`}]);")
# cut prompts: add ratio line at top
s=s.replace("${i+1}컷 / 총 ${n}컷을 그려 주세요. 앞 컷과 같은 주인공, 같은 그림체예요.\n","${i+1}컷 / 총 ${n}컷을 그려 주세요. 앞 컷과 같은 주인공, 같은 그림체예요.\n비율: ${ratioText()} (앞 컷과 똑같이)\n")
s=s.replace("${i+1}컷 / 총 ${n}컷을 그려 주세요. 앞 컷과 같은 주인공, 같은 그림체, 같은 글자 규칙이에요.\n","${i+1}컷 / 총 ${n}컷을 그려 주세요. 앞 컷과 같은 주인공, 같은 그림체, 같은 글자 규칙이에요.\n비율: ${ratioText()} (앞 컷과 똑같이)\n")
# compose W/H
rep("const W=1080, st=S.info.style||'classic',","const W=1080, H=ratio().h, st=S.info.style||'classic',")
rep("ctx=cv.getContext('2d'); cv.width=W; cv.height=W;\n  ctx.fillStyle='#F1F1EF'; ctx.fillRect(0,0,W,W);\n  if(c.img){ try{ const im=await getImg(c.img); const s=Math.max(W/im.width,W/im.height); ctx.drawImage(im,(W-im.width*s)/2,(W-im.height*s)/2,im.width*s,im.height*s); }catch(_){} }\n  else { ctx.fillStyle='#A0A0A0'; ctx.font='800 34px \"Gothic A1\"'; ctx.textAlign='center'; wrapText(ctx,c.direction||'그림을 올려 주세요',760).slice(0,4).forEach((l,k)=>ctx.fillText(l,W/2,560+k*48)); }",
"ctx=cv.getContext('2d'); cv.width=W; cv.height=H;\n  ctx.fillStyle=c.img&&S.info.fit==='contain'?'#FFFFFF':'#F1F1EF'; ctx.fillRect(0,0,W,H);\n  if(c.img){ try{ const im=await getImg(c.img); const s=S.info.fit==='contain'?Math.min(W/im.width,H/im.height):Math.max(W/im.width,H/im.height); ctx.drawImage(im,(W-im.width*s)/2,(H-im.height*s)/2,im.width*s,im.height*s); }catch(_){} }\n  else { ctx.fillStyle='#A0A0A0'; ctx.font='800 34px \"Gothic A1\"'; ctx.textAlign='center'; wrapText(ctx,c.direction||'그림을 올려 주세요',760).slice(0,4).forEach((l,k)=>ctx.fillText(l,W/2,H*0.52+k*48)); }")
rep("cy=Math.max(y-lh+size*0.5+(c.sub?size*0.7:0),W*0.3);","cy=Math.max(y-lh+size*0.5+(c.sub?size*0.7:0),H*0.3);")
rep("ctx.translate(W*0.8,W*0.46);","ctx.translate(W*0.8,H*0.46);")
rep("by=[(c.title?W*0.42:W*0.3)-bh+bh,W*0.58-bh,W-bh-110][pos]-(pos===0?bh:0)","by=[(c.title?H*0.42:H*0.3)-bh,H*0.58-bh,H-bh-110][pos]")
# canvases & css
s=s.replace('<canvas id="pcv" width="1080" height="1080"></canvas>','<canvas id="pcv" width="1080" height="${ratio().h}"></canvas>')
s=s.replace('<canvas data-cv="${i}" width="1080" height="1080"','<canvas data-cv="${i}" width="1080" height="${ratio().h}"')
for sel in [".frame{font-size:4.4cqi;position:relative;width:100%;aspect-ratio:1;",".cover-empty{aspect-ratio:1;",".slot canvas{width:100%;height:auto;aspect-ratio:1;",".car canvas{width:100%;height:auto;aspect-ratio:1;"]:
    rep(sel, sel.replace("aspect-ratio:1;","aspect-ratio:var(--ar,1);"))
# UI: ratio chips on input step (after 컷 수 chips) + fit in post
rep("""    <div class="chips">${[4,5,6,7,8,9,10].map(n=>`<button class="chip" data-cuts="${n}" aria-pressed="${i.cuts===n}">${n}컷</button>`).join('')}</div>""",
"""    <div class="chips">${[4,5,6,7,8,9,10].map(n=>`<button class="chip" data-cuts="${n}" aria-pressed="${i.cuts===n}">${n}컷</button>`).join('')}</div>
    <label class="f">이미지 비율 <small>한 게시물 안의 모든 컷이 이 비율로 고정돼요</small></label>
    <div class="chips">${Object.entries(RATIOS).map(([k,v])=>`<button class="chip" data-ratio="${k}" aria-pressed="${(i.ratio||'1:1')===k}">${v.name} · ${v.px}</button>`).join('')}</div>
    <p class="sub" style="margin-top:6px">피드에서 크게 보이는 건 세로 4:5, 3:4예요. 처음이면 1:1이 가장 무난해요.</p>""")
rep("""<div class="row" style="margin:14px 0"><button class="btn" data-act="upall">""","""<div class="ratio-bar"><b>${ratio().name} · ${ratio().px}</b><span>Gemini가 다른 비율로 그려도 올리는 순간 이 비율로 맞춰져요.</span><span class="chips">${[['cover','꽉 채우기(가장자리 조금 잘림)'],['contain','전체 보이기(남는 곳 흰 여백)']].map(([k,v])=>`<button class="chip" data-fit="${k}" aria-pressed="${(S.info.fit||'cover')===k}">${v}</button>`).join('')}</span></div>
    <div class="row" style="margin:14px 0"><button class="btn" data-act="upall">""")
rep("  if(b.dataset.pw){","  if(b.dataset.ratio){ S.info.ratio=b.dataset.ratio; save(); applyRatio(); document.querySelectorAll('[data-ratio]').forEach(c=>c.setAttribute('aria-pressed',c.dataset.ratio===S.info.ratio)); return renderPhone(); }\n  if(b.dataset.fit){ S.info.fit=b.dataset.fit; save(); document.querySelectorAll('[data-fit]').forEach(c=>c.setAttribute('aria-pressed',c.dataset.fit===S.info.fit)); drawAll(); return renderPhone(); }\n  if(b.dataset.pw){")
rep("applyFontVars();\nrender();","applyFontVars();\napplyRatio();\nrender();")
# FIX ratio phrase
rep("const FIX_TYPO=","const FIX_RATIO=()=>`비율이 앞 컷과 달라요. 그림 내용은 그대로 두고 ${ratioText()}로 다시 그려 주세요.`;\nconst FIX_TYPO=")
rep('<div class="tip"><span>캐릭터 얼굴이나 옷이 달라졌을 때</span><button class="btn sm" data-copy="fixchar">복사</button></div>','<div class="tip"><span>캐릭터 얼굴이나 옷이 달라졌을 때</span><button class="btn sm" data-copy="fixchar">복사</button></div>\n      <div class="tip"><span>비율이 다르게 나왔을 때 (그냥 올려도 사이트가 맞춰 줘요)</span><button class="btn sm" data-copy="fixratio">복사</button></div>')
rep("fixtypo:FIX_TYPO,","fixtypo:FIX_TYPO,fixratio:FIX_RATIO(),")

# ===== BUBBLE KINDS =====
rep("if(/속마음|생각/.test(who)){ kind='think'; who=who.replace(/\\(?(속마음|생각)\\)?/,'').trim(); } else if(/외침|소리/.test(who)){ kind='shout'; who=who.replace(/\\(?(외침|소리)\\)?/,'').trim(); }",
    "const KM=[[/속마음|생각/,'think'],[/외침|소리/,'shout'],[/속삭임|작게/,'whisper'],[/떨림|당황|덜덜/,'shaky']]; for(const [re,kd] of KM){ if(re.test(who)){ kind=kd; who=who.replace(new RegExp('\\\\(?('+re.source+')\\\\)?'),'').trim(); break; } }")
rep("${t.kind==='think'?'생각 말풍선(구름 모양, 작은 손글씨)':t.kind==='shout'?'외침 말풍선(뾰족한 모양, 굵은 글씨)':'말풍선'}",
    "${({think:'생각 말풍선(뭉게구름 모양, 동그라미 꼬리)',shout:'외침 말풍선(가장자리 뾰족한 폭발형, 글씨 크고 굵게)',whisper:'속삭임 말풍선(점선 테두리, 글씨 작게)',shaky:'떨림 말풍선(물결치는 테두리, 글씨 끝이 떨리게)'})[t.kind]||'말풍선'}")
rep("ctx.lineWidth=t.kind==='shout'?8:5; ctx.setLineDash(t.kind==='think'?[10,8]:[]);","ctx.lineWidth=t.kind==='shout'?8:t.kind==='whisper'?3:5; ctx.setLineDash(t.kind==='think'?[10,8]:t.kind==='whisper'?[6,7]:[]);")
rep("ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,t.kind==='shout'?12:Math.min(46,bh/2)); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);",
    "ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,t.kind==='shout'?12:Math.min(46,bh/2)); ctx.fill(); ctx.stroke(); if(t.kind==='shaky'){ ctx.lineWidth=2; ctx.beginPath(); ctx.roundRect(bx-7,by-7,bw+14,bh+14,Math.min(52,bh/2+7)); ctx.stroke(); } ctx.setLineDash([]);")
rep(".frame .bb.think{border-style:dashed}",".frame .bb.think{border-style:dashed} .frame .bb.whisper{border-style:dotted;font-size:.9em} .frame .bb.shaky{box-shadow:0 0 0 2px #fff,0 0 0 3px #141414}")
rep('속마음은 "인물(속마음): …", 외침은 "인물(외침): …".', '속마음은 "인물(속마음): …", 외침은 "인물(외침): …", 속삭임은 "인물(속삭임): …", 당황·떨림은 "인물(떨림): …".')
rep('placeholder="친구: 너 그거 아직도 다 직접 해?&#10;주인공(속마음): 언제부터 있었어?&#10;친구(외침): 아까부터!"','placeholder="친구: 너 그거 아직도 다 직접 해?&#10;주인공(떨림): 언, 언제부터 있었어?&#10;친구(속삭임): 아까부터."')
rep('<small>한 줄에 하나 · 인물: 대사 · 최대 3줄</small>','<small>한 줄에 하나 · 인물: 대사 · 최대 3줄 · 종류: (속마음) (외침) (속삭임) (떨림)</small>')

# ===== WEBTOON LETTER RULES =====
a=s.index("function letterRules(){"); b=s.index("\nfunction setupPrompt(){",a)
s=s[:a]+r"""function letterSpec(){ const st=S.info.style||'classic';
  if((S.info.letterMode||'theme')==='theme') return {...(artOf().letter||ARTS.chibi.letter),name:artOf().name+' 테마'};
  const title = st==='band' ? `위쪽 흰색 가로 띠 위에 검은색 ${fdesc('title')}` : st==='bold' ? `흰색 ${fdesc('title')}에 두꺼운 검은 외곽선과 검은 그림자` : `검은색 ${fdesc('title')}에 두꺼운 흰 외곽선`;
  return {name:'직접 고른 글씨', title, bubble:`흰 둥근 말풍선, 검은 테두리, 검은 ${fdesc('bubble')}`, sfx:`${st==='bold'?'빨간색':'검은색'} ${fdesc('sfx')}, 흰 외곽선`, hl:'강조 단어 아래 부드러운 노란 형광펜'}; }
function letterRules(){ const L=letterSpec();
  return `[글자 규칙 - 한국 웹툰 식자 방식 · ${L.name} · 모든 컷 똑같이]
■ 제목(컷 위 타이틀): 위쪽 가운데, ${L.title}. 한 줄 7~10자로 끊어 두 줄, 자간은 좁게, 제목 안에서도 강조 단어는 더 크게 해서 굵기·크기 대비를 준다. ${L.hl}. 그림 위에 스티커처럼 얹되 인물 얼굴은 가리지 않는다.
■ 소제목(제목 아래 작은 글씨): 제목 크기의 40% 정도, 제목과 같은 계열의 얇은 글씨, 제목에 바짝 붙여서.
■ 말풍선(대사): ${L.bubble}. 글자 둘레 여백을 넉넉히 두고, 두 줄 이상이면 가운데 정렬로 줄을 나눠 풍선이 둥근 달걀 모양이 되게. 꼬리는 짧고 뾰족하게 말하는 사람 입 쪽으로. 읽는 순서대로 위→아래, 왼쪽→오른쪽에 놓고, 같은 사람이 이어 말하면 풍선을 살짝 겹쳐 붙인다. 감정이 큰 대사는 글자를 더 크게.
■ 말풍선 종류 (대사에 적어 준 종류대로):
  - 보통 대사: 위 모양
  - 속마음·생각: 뭉게구름 모양 풍선, 꼬리 대신 작은 동그라미 2~3개, 글씨는 조금 가늘게
  - 외침: 가장자리가 뾰족뾰족한 폭발형 풍선, 굵고 큰 글씨, 살짝 기울임
  - 속삭임: 점선 테두리 풍선, 작은 글씨
  - 떨림·당황: 물결치는 테두리 풍선, 글씨 끝이 떨리듯
■ 효과음(의성어·의태어): ${L.sfx}. 웹툰처럼 그림의 일부로 그린다. 소리가 나는 물건이나 동작 바로 옆에, 움직이는 방향을 따라 기울이고, 글자마다 크기를 조금씩 달리해 리듬감을 준다.
■ 손글씨 의성어·작은 혼잣말: 디테일에 작은따옴표(' ')로 감싼 말만, 풍선 없이 인물 머리 옆에 작고 가는 손글씨로. 따옴표 없는 말(반짝이, 땀방울 등)은 글자로 쓰지 말고 그림으로만.
■ 내레이션·시간·장소 자막: 흰 네모 칸에 검은 테두리, 검은 고딕체. 컷 왼쪽 위나 왼쪽 아래 모서리에 붙여서. 모든 컷 같은 모양.
■ 감정 기호: 땀방울, 반짝이, 분노 마크, 물음표·느낌표 기호는 글자가 아니라 그림 기호로.
■ 휴대폰·모니터·메뉴판·간판 속: 제가 준 문구가 없으면 글자 없이 단순한 선과 아이콘으로만. 가게 이름, 앱 이름, 로고, 메뉴 이름을 지어내지 마세요.
${NO_LABEL.replace(/^- /,'■ ')}
■ 정확도: 글자는 제가 따옴표 안에 준 문구만, 한 글자도 바꾸지 말고 맞춤법 그대로. 그 밖의 글자와 영어는 넣지 마세요.
■ 통일: 글씨체, 글자 크기, 외곽선 두께, 말풍선 모양은 1컷부터 마지막 컷까지 똑같이.`; }"""+s[b:]
rep("- 강조: ${esc(L.hl)}</li></ul>","- 강조: ${esc(L.hl)}</li></ul>") if "- 강조: ${esc(L.hl)}</li></ul>" in s else None

# ===== IDEAS (title) =====
rep("async function ask(prompt,statusEl,msg='AI가 인스타툰을 쓰고 있어요 · 보통 30초~1분',imgs){","async function ask(prompt,statusEl,msg='AI가 인스타툰을 쓰고 있어요 · 보통 30초~1분',imgs,tier){")
rep("const o={signal:ctl.signal,cache:false};","const o={signal:ctl.signal,cache:false}; if(tier&&!STANDALONE) o.modelTier=tier;")
rep('<label class="f" for="c${i}-title">제목(내레이션) <small>선택 · 표지와 꼭 필요한 컷만</small></label>',
    '<div class="lab-row"><label class="f" for="c${i}-title">제목(내레이션) <small>선택 · 표지와 꼭 필요한 컷만</small></label><button class="btn sm" data-tidea="${i}">제목 아이디어 5개</button></div><div class="tideas" id="tideas-${i}"></div><div class="status" id="st-tidea-${i}"></div>')
rep('<div class="hooks" style="margin-bottom:22px">${T.hooks.map(','<div class="row" style="margin:-4px 0 8px"><button class="btn sm" data-act="moreHooks">첫 장 제목 후보 더 받기</button><span class="status" id="st-hooks"></span></div>\n    <div class="hooks" style="margin-bottom:22px">${T.hooks.map(')
rep("${T.hooks.length>1?`<label","${T.hooks.length>=1?`<label")
idea_js=r'''
const ideaCache={};
async function titleIdeas(i){
  const c=cuts()[i], st=$('#st-tidea-'+i);
  const prompt=`인스타툰 ${i+1}컷의 제목(컷 위 큰 글씨) 아이디어 5개를 써 줘.
${infoBlock()}
[전체 대본]
${toonText()}
[지금 제목] ${c.title.replace(/\n/g,' / ')||'(없음)'}
[이 컷의 역할] ${c.role}
규칙: 이야기 흐름과 사실은 그대로. 방식은 각각 달리(질문형, 반전형, 숫자·시간형, 대사 인용형, 감정 폭발형). 두 줄로 \\n 구분, 한 줄 공백 빼고 12자 이내. 광고 단어 금지${i===0?', 특히 첫 장이라 넘기던 손가락이 멈추게':''}.
JSON 하나로만 답해: {"ideas":[{"type":"질문형","title":"","highlight":"제목 안의 강조어"}]}`;
  try{ const r=await ask(prompt,st,'제목 떠올리는 중',null,'quick'); ideaCache[i]=(r.ideas||[]).slice(0,5).map(x=>({type:String(x.type||''),title:fixNL(x.title),highlight:String(x.highlight||'')})).filter(x=>x.title);
    $('#tideas-'+i).innerHTML=ideaCache[i].map((x,k)=>`<button class="hook" data-tpick="${i}|${k}"><span class="t">${esc(x.title)}</span><span class="s">${esc(x.type)}</span></button>`).join(''); }catch(_){}
}
async function moreHooks(){
  const T=S.toon, st=$('#st-hooks');
  const prompt=`인스타툰 첫 장(표지) 제목 후보 5개를 새로 써 줘. 피드를 넘기던 손가락이 멈추게.
${infoBlock()}
[전체 대본]
${toonText()}
[이미 있는 후보]
${T.hooks.join('\n')}
규칙: 이미 있는 후보와 겹치지 않게, 방식은 각각 달리(질문형, 반전형, 숫자·시간형, 대사 인용형, 공감형). 두 줄로 \\n 구분, 한 줄 공백 빼고 12자 이내. 광고 단어·상호명 금지. 사실은 대본 그대로.
JSON 하나로만 답해: {"hooks":["","","","",""]}`;
  try{ const r=await ask(prompt,st,'후보 떠올리는 중',null,'quick'); const add=(r.hooks||[]).map(fixNL).filter(Boolean); T.hooks=[...T.hooks,...add].slice(0,12); save(); vEdit(); toast(`후보 ${add.length}개를 더 받았어요`); }catch(_){}
}
'''
rep("/* ================= 이벤트 ================= */",idea_js+"\n/* ================= 이벤트 ================= */")
rep("  if(b.dataset.pw){","""  if(b.dataset.tidea) return run(b,()=>titleIdeas(+b.dataset.tidea));
  if(b.dataset.tpick){ const [i,k]=b.dataset.tpick.split('|').map(Number), x=ideaCache[i]?.[k], c=cuts()[i]; if(x&&c){ c.title=x.title; c.highlight=x.title.includes(x.highlight)?x.highlight:''; if(i===0&&S.toon.hooks.length) S.toon.hooks[S.toon.hookIdx]=c.title; pv=i; openCut=i; save(); vEdit(); renderPhone(); toast('제목을 바꿨어요'); } return; }
  if(b.dataset.pw){""")
rep("  if(a==='help') return toggleHelp();","  if(a==='help') return toggleHelp();\n  if(a==='moreHooks') return run(b,moreHooks);")

# ===== BACKUP =====
rep('<div class="row" style="gap:14px"><button class="btn sm" data-act="help">사용 방법</button>','<div class="row" style="gap:8px"><button class="btn sm" data-act="backup">백업 저장</button><button class="btn sm" data-act="restore">불러오기</button><button class="btn sm" data-act="help">사용 방법</button>')
bk=r'''
async function makeBackup(){
  const ls=k=>{ try{ return localStorage.getItem(k); }catch(_){ return null; } };
  const data={app:'instatoon',v:1,savedAt:new Date().toISOString(),state:S,photos:{},refs:{},samples:{},fonts:[]};
  [0,1,2].forEach(k=>{ const p=ls('instatoon.photo.'+k); if(p) data.photos[k]=p; const r=ls(refKey(k)); if(r) data.refs[k]=r; });
  Object.keys(ARTS).forEach(k=>{ const v=ls('instatoon.sample.'+k); if(v) data.samples[k]=v; });
  for(const f of await idbAll()){ try{ const u=new Uint8Array(f.buf); let bin=''; for(let j=0;j<u.length;j+=32768) bin+=String.fromCharCode.apply(null,u.subarray(j,j+32768)); data.fonts.push({f:f.f,b64:btoa(bin)}); }catch(_){} }
  const d=new Date(), name=`인스타툰_백업_${S.info.name||'우리가게'}_${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}.json`;
  await saveFile(name,new Blob([JSON.stringify(data)],{type:'application/json'}));
}
async function restoreBackup(file){
  try{ const data=JSON.parse(await file.text()); if(data.app!=='instatoon'||!data.state) throw 0;
    const b=blank(); S={...b,...data.state,info:{...b.info,...data.state.info}};
    const set=(k,v)=>{ try{ v?localStorage.setItem(k,v):localStorage.removeItem(k); }catch(_){} };
    [0,1,2].forEach(k=>{ set('instatoon.photo.'+k,data.photos?.[k]||''); setRef(k,data.refs?.[k]||null); });
    Object.entries(data.samples||{}).forEach(([k,v])=>set('instatoon.sample.'+k,v));
    for(const f of data.fonts||[]){ try{ const bin=atob(f.b64), u=new Uint8Array(bin.length); for(let j=0;j<bin.length;j++) u[j]=bin.charCodeAt(j); await registerFont(f.f,u.buffer.slice(0)); await idbPut({f:f.f,buf:u.buffer}); }catch(_){} }
    save(); applyFontVars(); applyRatio(); pv=0; render(); toast('백업을 불러왔어요');
  }catch(_){ toast('인스타툰 연재실 백업 파일이 아니에요. 백업 저장으로 받은 .json 파일을 골라 주세요'); }
}
'''
rep("/* ================= 이벤트 ================= */",bk+"\n/* ================= 이벤트 ================= */")
rep("  if(a==='help') return toggleHelp();","  if(a==='backup') return makeBackup();\n  if(a==='restore') return $('#backupIn').click();\n  if(a==='help') return toggleHelp();")
rep('<input type="file" id="fileIn" accept="image/*" hidden>','<input type="file" id="fileIn" accept="image/*" hidden>\n<input type="file" id="backupIn" accept=".json,application/json" hidden>')
rep("async function makeZip(){","document.getElementById('backupIn').addEventListener('change',e=>{ const f=e.target.files[0]; e.target.value=''; if(f) restoreBackup(f); });\nasync function makeZip(){")
# help text on storage
rep("<div class=\"hcard\"><span class=\"hn\">알아두세요</span><p>작성한 내용과 캐릭터·사진은 이 브라우저에만 저장돼요. 다른 기기에서는 처음부터 다시 해야 해요. 캐릭터 기준 이미지는 컴퓨터에 따로 저장해 두면 언제든 같은 캐릭터로 이어 갈 수 있어요.</p></div>",
    "<div class=\"hcard\"><span class=\"hn\">저장과 백업</span><p>작성한 내용은 이 브라우저에 자동 저장돼서 로그아웃하거나 컴퓨터를 꺼도 남아 있어요. 다만 다른 컴퓨터·휴대폰, 다른 브라우저, 인터넷 기록 삭제 후에는 사라져요. 오른쪽 위 <b>\"백업 저장\"</b>으로 파일 하나(연재표, 대본, 캐릭터, 사진, 폰트 포함)를 받아 두고, 다른 곳에서는 <b>\"불러오기\"</b>로 그 파일을 고르면 그대로 이어서 할 수 있어요.</p></div>")
# css
rep(".slot.busy canvas{opacity:.45}",".slot.busy canvas{opacity:.45}\n.lab-row{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;flex-wrap:wrap}.lab-row .btn{margin-bottom:6px}\n.tideas{display:flex;flex-direction:column;gap:6px}.tideas:not(:empty){margin-bottom:8px}\n.ratio-bar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;background:var(--sunken);border-radius:12px;padding:10px 14px;margin-top:16px;font-size:13.5px}.ratio-bar>span:not(.chips){color:var(--muted)}")
open(p,'w').write(s); print('ok')
