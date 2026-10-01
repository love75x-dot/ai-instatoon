import sys
p='/home/claude/toon-planner/index.html'; s=open(p).read()
def rep(a,b,cnt=1):
    global s
    if s.count(a)!=cnt: print('MISSING/COUNT',s.count(a),':',a[:160]); sys.exit(1)
    s=s.replace(a,b)
def block(start,end,new):
    global s
    a=s.index(start); b=s.index(end,a); s=s[:a]+new+s[b:]

block("function endAuto(){","const END_STYLES=",r'''// 안내 카드 문구: 적은 칸만 그림에 들어가고, 비운 칸은 프롬프트에서 빠진다(기본 문구 없음)
const END_FIELDS=[['name','가게 이름','제목 위 작은 글씨','예: 우프스낵바',false],['head','큰 문구','두 줄까지 · 한 줄 10자 안팎','예: 다음 편도\n궁금하다면?',true],['lines','안내','한 줄에 하나','예: 📍 망원역 2번 출구 3분\n⏰ 매일 11:00~21:00 · 월요일 휴무',true],['btn','버튼 문구','알약 모양 버튼 안','예: 프로필 링크에서 예약하기',false],['foot','맨 아래 작은 글씨','','예: 저장해 두고 다음 편도 봐 주세요',false]];
function endSuggest(){ const T=S.toon||{}, p=prof(), i=S.info; return {name:i.name.trim(), head:(T.endHead||'').trim()||'다음 편도\n궁금하다면?', lines:[p.cta.trim(), i.offer.trim()?`🎁 ${i.offer.trim()}`:''].filter(Boolean).join('\n'), btn:(T.endBtn||'').trim()||'프로필 링크에서 예약하기', foot:'저장해 두고 다음 편도 봐 주세요'}; }
const endVals=()=>{ const e=ec(); return {name:e.name, head:e.head, lines:e.lines, btn:e.btn, foot:e.foot}; };
const endMax=()=>ratio().h===1080?2:4;
const endFilled=()=>END_FIELDS.some(([k])=>String(ec()[k]||'').trim());
function endLi(){ const e=ec();
  return `<li class="endli"><div class="gh"><b>마지막 장 안내 카드 그리기</b><span class="tag">선택</span>${e.on?'<button class="btn sm" data-copy="endp">복사</button>':''}</div>
    <p>웹툰 맨 뒤에 붙는 가게 안내 한 장이에요. 우리 캐릭터가 손 흔드는 그림에 아래 적은 문구가 함께 그려져요. 마지막 컷 다음에 같은 대화창에서 보내세요.</p>
    <div class="chips"><button class="chip" data-endon="1" aria-pressed="${e.on}">넣기</button><button class="chip" data-endon="0" aria-pressed="${!e.on}">안 넣기</button></div>
    ${e.on?`<div class="endf">
      <p class="sub" style="margin:4px 0 0"><b>적은 칸만 그림에 들어가요.</b> 비워 둔 칸은 프롬프트에서 빠져요. 흐린 글씨는 예시일 뿐 들어가지 않아요.</p>
      <div><button class="btn sm" data-act="endSuggest">추천 문구로 빈 칸 채우기</button> <small class="status">가게 이름, 대본의 AI 추천 문구, 가게 프로필의 예약 안내로 채워요</small></div>
      ${END_FIELDS.map(([k,n,h,ph,multi])=>`<label class="f" for="e-${k}">${n} <small>${h?h+' · ':''}비우면 빠져요${k==='lines'?` · ${ratio().h===1080?'1:1은 2줄까지':'4줄까지'}`:''}</small></label>${multi?`<textarea class="in" id="e-${k}" data-end="${k}" rows="${k==='lines'?3:2}" placeholder="${esc(ph)}">${esc(e[k])}</textarea>`:`<input class="in" id="e-${k}" data-end="${k}" value="${esc(e[k])}" placeholder="${esc(ph)}">`}`).join('')}
      <label class="f">배경 느낌</label><div class="chips">${Object.entries(END_STYLES).map(([k,x])=>`<button class="chip" data-endst="${k}" aria-pressed="${e.style===k}">${x.name}</button>`).join('')}</div>
    </div><pre id="endPre">${esc(endPrompt())}</pre>`:''}</li>`; }
''')
rep("function ec(){ return S.endcard=fillDef(S.endcard||{},{on:false,style:'light',head:'',lines:'',btn:'',img:''}); }",
    "function ec(){ return S.endcard=fillDef(S.endcard||{},{on:false,style:'light',name:'',head:'',lines:'',btn:'',foot:'',img:''}); }")
rep("function endLines(){ const l=lines(endVals().lines); return l.slice(0,endMax()); return l.slice(0,4); }","function endLines(){ return lines(ec().lines).slice(0,endMax()); }")
block("function endPrompt(){","function endImageParts(){",r'''function endPrompt(){ const e=ec(), P=END_STYLES[e.style]||END_STYLES.light, sq=ratio().h===1080;
  const name=e.name.trim(), head=lines(e.head).slice(0,2), btn=e.btn.trim(), foot=e.foot.trim();
  const ls=endLines().map(l=>{ const m=l.match(EMO); return {icon:m?m[0].trim():'',text:l.replace(EMO,'').trim()}; }).filter(x=>x.text);
  const who=hasP2()?`주인공 ${peopleIdx().length}명 [${peopleIdx().map(k=>whoKo(k)).join(' / ')}]`:`주인공(${whoKo()})`;
  const parts=[name&&'작은 가게 이름', head.length&&'큰 제목', ls.length&&'안내 칸', btn&&'버튼', foot&&'맨 아래 작은 글씨'].filter(Boolean);
  const any=parts.length>0;
  const layout=!any
    ? `장면: ${who}이 ${S.info.type||'가게'} 앞에서 손님에게 손 흔들며 활짝 웃는 모습을 크게. 글자는 넣지 않아요.`
    : sq
    ? `배치 (정사각형이라 글자는 적게, 크게): 위에서부터 ${parts.join(' → ')} 순서로. ${who}은 오른쪽 아래 구석에 상반신만 작게, 손 흔들며 웃는 모습. 글자와 인물이 겹치지 않게, 가장자리에 여백을 넉넉히.`
    : `배치: 위에서부터 ${parts.join(' → ')} 순서로. ${who}은 아래쪽 3분의 1에서 손 흔들며 웃는 모습. 글자와 인물이 겹치지 않게.`;
  const T=[];
  if(name) T.push(`가게 이름 (작은 글씨): "${name}"`);
  if(head.length) T.push(`큰 제목 (1컷 제목과 같은 글씨 모양${head.length>1?', 두 줄':''}): ${head.map(l=>`"${l}"`).join(' / ')}`);
  if(ls.length){ T.push(`안내 (흰 둥근 네모 칸 안에 한 줄씩 또박또박, 읽기 쉬운 굵은 고딕체): ${ls.map(x=>`"${x.text}"`).join(' / ')}`);
    if(ls.some(x=>x.icon)) T.push(`안내 줄 앞 작은 그림 아이콘: ${ls.filter(x=>x.icon).map(x=>`"${[...x.text].slice(0,6).join('')}…" 앞에 ${x.icon} 모양`).join(', ')} (아이콘은 글자가 아니라 그림으로)`); }
  if(btn) T.push(`버튼 (알약 모양 둥근 버튼 안): "${btn}"`);
  if(foot) T.push(`맨 아래 작은 글씨: "${foot}"`);
  return `마지막 장(가게 안내 카드)을 그려 주세요. 앞 컷과 같은 캐릭터, 같은 그림체, 같은 글자 규칙이에요.
비율: ${ratioText()} (앞 컷과 똑같이)
${layout}
배경: ${P.desc}, ${S.info.type||'가게'} 분위기만 살짝. 단순하고 깔끔하게.
${any?`\n[이 장에 들어갈 글자 - 정확히 이대로]\n${T.join('\n')}\n\n위 문구 말고 다른 글자는 넣지 마세요. 전화번호, 주소, 로고, 영업시간을 지어내지 마세요. 맞춤법 그대로, 한 글자도 바꾸지 마세요.`:'\n그림 안에 글자, 숫자, 로고는 넣지 마세요.'}`; }
''')
rep("  if(el.dataset.end){ const k=el.dataset.end, a=endAuto()[k]; ec()[k]=el.value.trim()===String(a).trim()?'':el.value; save(); const pr=$('#endPre'); if(pr) pr.textContent=endPrompt(); const t=$('#ea-'+k); if(t&&k!=='lines') t.textContent=ec()[k].trim()?'직접 고친 문구':'자동으로 채웠어요 · 고쳐도 돼요'; return; }",
    "  if(el.dataset.end){ ec()[el.dataset.end]=el.value; save(); const pr=$('#endPre'); if(pr) pr.textContent=endPrompt(); return; }")
rep("  if(a==='endReset'){ const e=ec(); e.head=''; e.lines=''; e.btn=''; save(); const g=$('#guideBox'); if(g) g.innerHTML=guideHTML(); toast('자동 문구로 되돌렸어요'); return; }",
    "  if(a==='endSuggest'){ const e=ec(), sg=endSuggest(); let n=0; END_FIELDS.forEach(([k])=>{ if(!String(e[k]||'').trim()&&sg[k]){ e[k]=sg[k]; n++; } }); save(); const g=$('#guideBox'); if(g) g.innerHTML=guideHTML(); toast(n?`빈 칸 ${n}개를 채웠어요. 필요 없는 칸은 지우면 빠져요`:'채울 빈 칸이 없어요'); return; }")
open(p,'w').write(s); print('ok')
