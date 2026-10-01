import sys
p='/home/claude/toon-planner/index.html'; s=open(p).read()
def rep(a,b,cnt=1):
    global s
    if s.count(a)!=cnt: print('MISSING/COUNT',s.count(a),':',a[:160]); sys.exit(1)
    s=s.replace(a,b)
def block(start,end,new):
    global s
    a=s.index(start); b=s.index(end,a); s=s[:a]+new+s[b:]

# makeToon: AI writes end-card head & button (facts come from profile only)
rep("- reelComment: 릴스 고정 댓글 1개(다음 편 예고나 가벼운 질문)","- reelComment: 릴스 고정 댓글 1개(다음 편 예고나 가벼운 질문)\n- endHead: 웹툰 맨 뒤 가게 안내 카드의 큰 문구. 이번 편 이야기와 이어지게 두 줄(\\n 구분), 한 줄 10자 이내, 광고 단어 금지\n- endBtn: 안내 카드 버튼 문구 12자 이내(손님이 할 행동, 예: 프로필 링크에서 예약)")
rep('"reelComment":"","cast":""','"reelComment":"","endHead":"","endBtn":"","cast":""')
rep("comment:String(r.reelComment||'')},cast:","comment:String(r.reelComment||'')},endHead:fixNL(r.endHead||''),endBtn:String(r.endBtn||''),cast:")

block("function endLi(){","function endLines(){",r'''function endAuto(){ const T=S.toon||{}, p=prof(), i=S.info;
  const L=[p.cta.trim(), i.offer.trim()?`🎁 ${i.offer.trim()}`:''].filter(Boolean);
  return {head:(T.endHead||'').trim()||'다음 편도\n궁금하다면?', lines:L.join('\n'), btn:(T.endBtn||'').trim()||(i.action.trim()&&[...i.action.trim()].length<=16?i.action.trim():'')||'프로필 링크에서 예약하기'}; }
function endVals(){ const e=ec(), a=endAuto(); return {head:e.head.trim()?e.head:a.head, lines:e.lines.trim()?e.lines:a.lines, btn:e.btn.trim()?e.btn:a.btn}; }
const endMax=()=>ratio().h===1080?2:4;
function endLi(){ const e=ec(), v=endVals(), tag=k=>e[k].trim()?'직접 고친 문구':'자동으로 채웠어요 · 고쳐도 돼요';
  return `<li class="endli"><div class="gh"><b>마지막 장 안내 카드 그리기</b><span class="tag">선택</span>${e.on?'<button class="btn sm" data-copy="endp">복사</button>':''}</div>
    <p>웹툰 맨 뒤에 붙는 가게 안내 한 장이에요. 우리 캐릭터가 손 흔드는 그림에 아래 문구가 함께 그려져요. 마지막 컷 다음에 같은 대화창에서 보내세요.</p>
    <div class="chips"><button class="chip" data-endon="1" aria-pressed="${e.on}">넣기</button><button class="chip" data-endon="0" aria-pressed="${!e.on}">안 넣기</button></div>
    ${e.on?`<div class="endf">
      <p class="sub" style="margin:4px 0 0">문구는 <b>자동으로 채워져 있어요.</b> 큰 문구·버튼은 대본을 만들 때 AI가 쓰고, 안내 줄은 가게 프로필의 예약 안내와 "이번에 알리고 싶은 것"에서 가져와요. 주소·영업시간처럼 AI가 지어내면 안 되는 건 직접 적어 주세요.</p>
      <label class="f" for="e-head">큰 문구 <small id="ea-head">${tag('head')}</small></label><textarea class="in" id="e-head" data-end="head" rows="2">${esc(v.head)}</textarea>
      <label class="f" for="e-lines">안내 <small id="ea-lines">${v.lines.trim()?tag('lines'):'비어 있으면 안내 줄 없이 그려요'} · ${ratio().h===1080?'1:1은 2줄까지':'4줄까지'}</small></label><textarea class="in" id="e-lines" data-end="lines" rows="3" placeholder="예: 매일 11:00~21:00 · 월요일 휴무 (직접 적어 주세요)">${esc(v.lines)}</textarea>
      <label class="f" for="e-btn">버튼 문구 <small id="ea-btn">${tag('btn')}</small></label><input class="in" id="e-btn" data-end="btn" value="${esc(v.btn)}">
      <label class="f">배경 느낌</label><div class="chips">${Object.entries(END_STYLES).map(([k,x])=>`<button class="chip" data-endst="${k}" aria-pressed="${e.style===k}">${x.name}</button>`).join('')}</div>
      ${e.head.trim()||e.lines.trim()||e.btn.trim()?'<div><button class="btn sm ghost" data-act="endReset">자동 문구로 되돌리기</button></div>':''}
    </div><pre id="endPre">${esc(endPrompt())}</pre>`:''}</li>`; }
''')
rep("function endLines(){ const l=lines(ec().lines); if(!l.length&&prof().cta.trim()) l.push(prof().cta.trim()); return","function endLines(){ const l=lines(endVals().lines); return l.slice(0,endMax()); return")
block("function endPrompt(){","function endImageParts(){",r'''function endPrompt(){ const e=ec(), v=endVals(), P=END_STYLES[e.style]||END_STYLES.light, name=S.info.name.trim(), sq=ratio().h===1080, head=lines(v.head).slice(0,2), btn=v.btn.trim();
  const ls=endLines().map(l=>{ const m=l.match(EMO); return {icon:m?m[0].trim():'',text:l.replace(EMO,'').trim()}; }).filter(x=>x.text);
  const who=hasP2()?`주인공 ${peopleIdx().length}명 [${peopleIdx().map(k=>whoKo(k)).join(' / ')}]`:`주인공(${whoKo()})`;
  const layout=sq
    ? `배치 (정사각형이라 글자는 적게, 크게): 위쪽 3분의 1에 큰 제목. 가운데에 안내 칸, 그 아래 버튼. ${who}은 오른쪽 아래 구석에 상반신만 작게, 손 흔들며 웃는 모습. 글자와 인물이 겹치지 않게, 가장자리에 여백을 넉넉히.`
    : `배치: 위쪽에 큰 제목, 가운데에 안내 칸과 버튼. ${who}은 아래쪽 3분의 1에서 손 흔들며 웃는 모습. 글자와 인물이 겹치지 않게.`;
  return `마지막 장(가게 안내 카드)을 그려 주세요. 앞 컷과 같은 캐릭터, 같은 그림체, 같은 글자 규칙이에요.
비율: ${ratioText()} (앞 컷과 똑같이)
${layout}
배경: ${P.desc}, ${S.info.type||'가게'} 분위기만 살짝. 단순하고 깔끔하게.

[이 장에 들어갈 글자 - 정확히 이대로]${name&&(!sq||!ls.length)?`\n가게 이름 (제목 위 작은 글씨): "${name}"`:''}
큰 제목 (1컷 제목과 같은 글씨 모양${head.length>1?', 두 줄':''}): ${head.map(l=>`"${l}"`).join(' / ')}${ls.length?`\n안내 (흰 둥근 네모 칸 안에 한 줄씩 또박또박, 읽기 쉬운 굵은 고딕체): ${ls.map(x=>`"${x.text}"`).join(' / ')}${ls.some(x=>x.icon)?`\n안내 줄 앞 작은 그림 아이콘: ${ls.filter(x=>x.icon).map(x=>`"${[...x.text].slice(0,6).join('')}…" 앞에 ${x.icon} 모양`).join(', ')} (아이콘은 글자가 아니라 그림으로)`:''}`:''}${btn?`\n버튼 (알약 모양 둥근 버튼 안): "${btn}"`:''}${sq?'':'\n맨 아래 작은 글씨: "저장해 두고 다음 편도 봐 주세요"'}

위 문구 말고 다른 글자는 넣지 마세요. 전화번호, 주소, 로고, 영업시간을 지어내지 마세요. 맞춤법 그대로, 한 글자도 바꾸지 마세요.`; }
''')
# inputs: update tags live
rep("  if(el.dataset.end){ ec()[el.dataset.end]=el.value; save(); const pr=$('#endPre'); if(pr) pr.textContent=endPrompt(); return; }",
    "  if(el.dataset.end){ const k=el.dataset.end, a=endAuto()[k]; ec()[k]=el.value.trim()===String(a).trim()?'':el.value; save(); const pr=$('#endPre'); if(pr) pr.textContent=endPrompt(); const t=$('#ea-'+k); if(t&&k!=='lines') t.textContent=ec()[k].trim()?'직접 고친 문구':'자동으로 채웠어요 · 고쳐도 돼요'; return; }")
rep("  if(a==='endUp'){","  if(a==='endReset'){ const e=ec(); e.head=''; e.lines=''; e.btn=''; save(); const g=$('#guideBox'); if(g) g.innerHTML=guideHTML(); toast('자동 문구로 되돌렸어요'); return; }\n  if(a==='endUp'){")
open(p,'w').write(s); print('ok')
