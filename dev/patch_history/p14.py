import sys,re
p='/home/claude/toon-planner/index.html'; s=open(p).read()
def rep(a,b,cnt=1):
    global s
    if s.count(a)!=cnt: print('MISSING/COUNT',s.count(a),':',a[:140]); sys.exit(1)
    s=s.replace(a,b)
def cut_between(start,end,new):
    global s
    a=s.index(start); b=s.index(end,a); s=s[:a]+new+s[b:]

# A. text always in image, theme lettering only
rep("const withText=()=>S.info.textInImg!==false;","const withText=()=>true;")
rep("function letterSpec(){ const st=S.info.style||'classic';","function letterSpec(){ return {...(artOf().letter||ARTS.chibi.letter),name:artOf().name+' 테마'};\n  const st=S.info.style||'classic';")
rep("{id:'post',  t:'그림·글자·올리기', d:'그림 받고 글자 입혀서 저장'}","{id:'post',  t:'그림·저장·올리기', d:'그림 받아서 저장하고 올리기'}")
rep("'계속 틀리면 ①에서 \"그림만 받고 이 사이트에서 글자 입히기\"로 바꾸세요. 글자는 사이트가 넣어서 100% 정확해요.'","'그래도 한두 글자가 틀리면 같은 대화창에서 그 컷만 다시 그리게 하는 게 가장 빨라요.'")
rep("'\"② 글자 모양 정하기\"의 설정은 모든 컷 프롬프트에 똑같이 들어가 있어요.'","'글자 모양은 고른 테마에 맞게 모든 컷 프롬프트에 똑같이 들어가 있어요.'")

# B/D. new vPost body
a=s.index("  $('#main').innerHTML=`<section class=\"panel\">\n    <div class=\"ph\"><div><h1>그림 만들고 올리기</h1>")
b=s.index("  drawAll(); kitCounters(); drawFeedCur(); renderSpell(); previewReuse();\n}",a)
new=r'''  $('#main').innerHTML=`<section class="panel">
    <div class="ph"><div><h1>그림 만들고 올리기</h1><p>대사·제목·효과음은 고른 테마(${esc(artOf().name)})에 맞는 웹툰 글씨로 그림 안에 함께 그려져요. 아래 순서대로 하면 돼요.</p></div></div>
    <div class="jump" role="navigation" aria-label="바로 가기">${[['#sec-draw','① 그림 그리기'],['#sec-save','② 모으기·저장'],['#reuse','③ 스토리·릴스'],['#kit','④ 올릴 글']].map(([h,t])=>`<button class="chip" data-jump="${h}">${t}</button>`).join('')}</div>

    <h2 class="sec" id="sec-draw" style="margin-top:0">① 그림 그리기</h2>
    ${autoSection()}
    <p class="sub"><b>${STANDALONE?'API 키 없이 직접 그릴 때':'Gemini나 ChatGPT로 그리기'}</b> · 이미지를 만들 수 있는 Gemini나 ChatGPT에서 <b>새 대화창 하나</b>를 열고, 아래 순서대로 한 번에 하나씩 붙여 넣으세요.</p>
    <div id="guideBox">${guideHTML()}</div>

    <h2 class="sec" id="sec-save">② 완성 이미지 모으기 · 저장</h2>
    <p class="sub">받은 그림을 컷마다 올리면 순서대로 모아서 한 번에 저장해요. 글자는 이미 그림 안에 있어서 사이트가 따로 얹지 않아요.</p>
    <div class="ratio-bar"><b>${ratio().name} · ${ratio().px}</b><span>Gemini가 다른 비율로 그려도 올리는 순간 이 비율로 맞춰져요.</span><span class="chips">${[['cover','꽉 채우기(가장자리 조금 잘림)'],['contain','전체 보이기(남는 곳 흰 여백)']].map(([k,v])=>`<button class="chip" data-fit="${k}" aria-pressed="${(S.info.fit||'cover')===k}">${v}</button>`).join('')}</span></div>
    <div class="row" style="margin:14px 0"><button class="btn" data-act="upall">그림 여러 장 한 번에 올리기</button><span class="status">${have}/${n}컷 올림</span></div>
    <div class="board">${cs.map((c,i)=>`<div class="slot" data-slot="${i}"><canvas data-cv="${i}" width="1080" height="${ratio().h}" aria-label="${i+1}컷 완성 이미지"></canvas>
      <div class="slot-bar"><b>${i+1}컷</b><span class="grow"></span><button class="btn sm" data-up="${i}">${c.img?'바꾸기':'그림 올리기'}</button>${c.img?`<button class="btn sm" data-dl="${i}">저장</button>`:''}${STANDALONE&&!autoCtl?`<button class="btn sm ghost" data-regen="${i}">AI로 다시</button>`:''}</div></div>`).join('')}</div>
    ${endHTML()}
    ${preHTML()}
    <div class="row" style="margin-top:14px"><button class="btn pri" data-act="zip" ${have?'':'disabled'}>완성 이미지 전체 저장 (zip)</button><span class="status" id="st-zip">${have?'':'그림을 올리면 저장할 수 있어요'}</span></div>
    <p class="sub" style="margin-top:8px">문구를 바꾸고 싶으면 "대본 다듬기"에서 고친 뒤 그 컷만 다시 그리면 돼요.</p>

    ${reuseHTML()}
    ${kitHTML()}

    <div class="actions"><button class="btn ghost" data-step="edit">← 대본 다듬기</button><span class="grow"></span><button class="btn acc" data-act="next">같은 가게로 다음 편 만들기</button></div>
  </section>`;
'''
s=s[:a]+new+s[b:]
rep('<h2 class="sec" id="reuse">④ 스토리·릴스로 한 번 더 알리기</h2>','<h2 class="sec" id="reuse">③ 스토리·릴스로 한 번 더 알리기</h2>')
rep('.hero-act{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}\n','.hero-act{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}\n.jump{display:flex;flex-wrap:wrap;gap:6px;margin:-6px 0 20px}\n')

# C. kit without feed / checklist / posted
a=s.index("function kitHTML(){"); b=s.index("const todayStr=",a)
s=s[:a]+r'''function kitHTML(){ const T=S.toon, cs=cuts(), p=prof(), fixed=tagList(p.tags);
  return `<h2 class="sec" id="kit">④ 인스타에 올릴 글</h2>
  <p class="sub">인스타에 게시물을 올릴 때 붙여 넣을 글이에요. 인스타 계정과 연결되는 기능은 아니고, 복사해서 쓰면 돼요. 여기서 고친 글은 자동 저장돼요.</p>
  <div class="kit">
    <div class="kit-copy"><button class="btn pri" data-act="kitCopy">캡션 + 해시태그 한 번에 복사</button><span class="status">인스타의 "문구 입력" 칸에 그대로 붙여 넣으면 돼요</span></div>
    <div class="kwarn" id="kitWarn" hidden></div>
    <label class="f" for="k-cap">캡션 <span class="cnt" id="cnt-cap"></span></label>
    <textarea class="in" id="k-cap" data-kitv="caption" rows="6" placeholder="캡션을 적어 주세요. 첫 줄이 피드에서 보이는 부분이라 가장 궁금하게!">${esc(T.caption)}</textarea>
    <p class="sub" style="margin-top:6px">${p.cta.trim()?`가게 프로필의 예약·문의 안내가 캡션 끝에 자동으로 붙어요: <b>${esc(p.cta)}</b>`:'가게 프로필에 예약·문의 안내를 적어 두면 매번 캡션 끝에 자동으로 붙어요.'} 피드에서는 첫 줄(앞 125자 정도)만 보이고 나머지는 "더 보기"로 접혀요.</p>
    <label class="f" for="k-tag">해시태그 <span class="cnt" id="cnt-tag"></span></label>
    <input class="in" id="k-tag" data-kitv="hashtags" value="${esc(T.hashtags)}" placeholder="#동네이름카페 #업종 #주제">
    <p class="sub" style="margin-top:6px">인스타는 2025년 12월부터 게시물당 해시태그를 <b>5개까지만</b> 반영해요. 동네·업종·주제가 딱 맞는 게 좋아요.${fixed.length?` 가게 프로필 고정 해시태그 ${fixed.length}개(${esc(fixed.join(' '))})가 앞에 붙어요.`:''}</p>
    <div class="lab-row"><label class="f" for="k-cmt">첫 댓글 · 고정 댓글 <small>올린 직후 직접 달고 "고정"해 두세요</small></label><button class="btn sm" data-copy="comment">복사</button></div>
    <textarea class="in" id="k-cmt" data-kitv="comment" rows="3" placeholder="예: 여러분 가게에도 이런 손님 있나요? 👀">${esc(T.comment)}</textarea>
    <details class="more" style="margin-top:14px"><summary>컷마다 대체 텍스트 <small style="font-weight:600;color:var(--muted)">선택 · 검색 노출, 화면을 잘 못 보는 손님을 위해</small></summary><div class="inner">
      <p class="sub" style="margin-top:0">올리기 직전 화면 아래 <b>"고급 설정" → "대체 텍스트 작성"</b>에서 컷마다 붙여 넣어요. 대본으로 자동으로 써 두었고, 고칠 수 있어요.</p>
      ${cs.map((c,i)=>`<div class="alt-row"><b>${i+1}컷</b><textarea class="in" data-kitv="alt-${i}" rows="2" aria-label="${i+1}컷 대체 텍스트">${esc(altOf(c,i))}</textarea><button class="btn sm" data-copy="alt-${i}">복사</button></div>`).join('')}
    </div></details>
  </div>`; }
function kitCounters(){ const T=S.toon; renderTodo(); if(!T||!$('#kit')) return;
  const cap=finalCaption(), n=[...cap].length, first=[...(cap.split('\n')[0]||'')].length, tags=allTags(), fixed=tagList(prof().tags);
  $('#cnt-cap').innerHTML=`<span class="${n>IG_CAP?'bad':''}">${n.toLocaleString()} / 2,200자</span> · 첫 줄 ${first}자`;
  $('#cnt-tag').innerHTML=`<span class="${tags.length>IG_TAGS?'warn':''}">${tags.length} / ${IG_TAGS}개</span>${fixed.length?` · 고정 ${fixed.length}개 포함`:''}`;
  const w=[]; if(n>IG_CAP) w.push(`캡션이 ${n-IG_CAP}자 넘쳐요. 줄여야 올라가요.`);
  if(tags.length>IG_TAGS) w.push(`해시태그가 ${tags.length}개예요. 복사할 때 앞의 ${IG_TAGS}개만 들어가요: ${tags.slice(0,IG_TAGS).join(' ')}`);
  if(first>125) w.push('첫 줄이 길어서 피드에서 잘려 보여요. 첫 줄은 궁금한 한 문장으로 짧게!');
  const hits=bannedHits([cap,tags.join(' '),T.comment||'',...cuts().map(c=>[c.title,c.sub,c.bubble,c.caption].join(' '))].join(' '));
  if(hits.length) w.push(`가게 프로필의 "쓰면 안 되는 말"이 들어 있어요: ${[...new Set(hits)].join(', ')}`);
  const box=$('#kitWarn'); box.innerHTML=w.map(x=>`<p>⚠ ${esc(x)}</p>`).join(''); box.hidden=!w.length; }
async function recordDone(){ const T=S.toon; if(!T||!cuts().length) return; T.hid=T.hid||Date.now(); const x=planItem(); if(x){ x.status='posted'; x.made=true; x.postedAt=todayStr(); }
  let th=''; try{ th=await coverThumb(); }catch(_){} const old=hist().find(h=>h.hid===T.hid)||{};
  S.history=[{...old,hid:T.hid,title:T.title,date:old.date||todayStr(),thumb:th||old.thumb||'',art:S.info.art,tone:T.tone||'',cuts:cuts().length,type:x?.type||old.type||'',goal:x?.goal||old.goal||'',hook:lines(cuts()[0]?.title).join(' ')},...hist().filter(h=>h.hid!==T.hid)].slice(0,30); save(); }
'''+s[b:]

# zip completion records episode
rep("  if(a==='zip') return run(b,async()=>{ await makeZip(); if(S.toon){ S.toon.zipped=true; save(); renderTodo(); } });",
    "  if(a==='zip') return run(b,async()=>{ await makeZip(); if(S.toon){ S.toon.zipped=true; if(cuts().every(c=>c.img)) await recordDone(); save(); renderTodo(); } });")
# todo
rep("  if(!T.postedAt) return {t:'게시 준비 키트를 보면서 인스타에 올리고 \"인스타에 올렸어요\"를 눌러 주세요',go:'#kit',stage:4};\n","")
rep("return {t:'이번 편 완료! 아래 ④에서 스토리·릴스로 한 번 더 알리고, 2~3일 뒤 \"반응·댓글\" 탭에 반응을 적어 주세요',go:'#reuse',stage:4,done:1};",
    "return {t:'완성! ③ 스토리·릴스를 만들고 ④ 캡션을 복사해 인스타에 올리세요. 2~3일 뒤 \"반응·댓글\" 탭에 반응을 적어 주세요',go:'#reuse',stage:4,done:1};")
rep("art:'그림 완성! \"한 편 만들기\" 탭에서 인스타에 올리고 \"인스타에 올렸어요\"를 눌러 주세요'","art:'그림 완성! \"한 편 만들기\" 탭에서 \"완성 이미지 전체 저장\"을 눌러 주세요'")
rep("return {t:'아직 올린 편이 없어요. \"한 편 만들기\"에서 올리고 \"인스타에 올렸어요\"를 누르면 여기에 쌓여요'};","return {t:'아직 완성한 편이 없어요. \"한 편 만들기\"에서 \"완성 이미지 전체 저장\"을 누르면 그 편이 여기에 쌓여요'};")
rep('아직 올린 편이 없어요.<br>"한 편 만들기"에서 인스타에 올리고 <b>"인스타에 올렸어요"</b>를 누르면 여기에 쌓여요.','아직 완성한 편이 없어요.<br>"한 편 만들기"에서 <b>"완성 이미지 전체 저장"</b>을 누르면 그 편이 여기에 자동으로 쌓여요.')
rep("const STAT={plan:{n:'기획'},script:{n:'대본'},art:{n:'그림'},posted:{n:'올림'}}","const STAT={plan:{n:'기획'},script:{n:'대본'},art:{n:'그림'},posted:{n:'완성'}}")
rep("${esc(x.postedAt)} 올림</span>","${esc(x.postedAt)} 완성</span>")
rep("날짜 지났는데 안 올린 편","날짜 지났는데 아직 못 만든 편")
# help cards
a=s.index('      <div class="hcard"><span class="hn">올리기와 진행 관리</span>'); b=s.index('</div>',s.index('</p>',a))+6
s=s[:a]+'      <div class="hcard"><span class="hn">올리기와 진행 관리</span><p>3단계 <b>"④ 인스타에 올릴 글"</b>에서 캡션·해시태그를 한 번에 복사하고 첫 댓글도 복사해 쓰세요. 인스타 계정과 연결되는 건 아니라 붙여 넣기만 하면 돼요. <b>"완성 이미지 전체 저장"</b>을 누르면 한 달 연재표에 완성으로 표시되고, "반응·댓글" 탭에도 자동으로 쌓여요.</p></div>'+s[b:]
rep('<p>3단계 맨 아래 <b>"스토리·릴스로 한 번 더 알리기"</b>','<p>3단계 <b>"③ 스토리·릴스로 한 번 더 알리기"</b>')

# B. end card via image prompt
a=s.index("async function drawEnd(cv){"); b=s.index("function refreshEnd(){",a)
s=s[:a]+r'''async function drawEnd(cv){ const e=ec(), W=1080, H=ratio().h, ctx=cv.getContext('2d'); cv.width=W; cv.height=H;
  if(e.img){ ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H); try{ const im=await getImg(e.img); const s2=S.info.fit==='contain'?Math.min(W/im.width,H/im.height):Math.max(W/im.width,H/im.height); ctx.drawImage(im,(W-im.width*s2)/2,(H-im.height*s2)/2,im.width*s2,im.height*s2); }catch(_){} return; }
  ctx.fillStyle='#F1F1EF'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#A0A0A0'; ctx.textAlign='center'; ctx.font='800 40px "Gothic A1"';
  ['마지막 장 안내 카드','','① 그림 그리기의 "안내 카드 그리기"','프롬프트로 그린 그림을 올려 주세요'].forEach((l,k)=>ctx.fillText(l,W/2,H*0.42+k*56)); }
const EMO=/^(\p{Extended_Pictographic}️?\s*)+/u;
function endPrompt(){ const e=ec(), P=END_STYLES[e.style]||END_STYLES.light, name=S.info.name.trim(), head=lines(e.head.trim()||'다음 편도 궁금하다면?').slice(0,2), btn=e.btn.trim()||'프로필 링크에서 예약하기';
  const ls=endLines().map(l=>{ const m=l.match(EMO); return {icon:m?m[0].trim():'',text:l.replace(EMO,'').trim()}; }).filter(x=>x.text);
  const who=hasP2()?`주인공 ${peopleIdx().length}명(${peopleIdx().map(k=>whoKo(k)).join(', ')})`:`주인공(${whoKo()})`;
  return `마지막 장(가게 안내 카드)을 그려 주세요. 앞 컷과 같은 캐릭터, 같은 그림체, 같은 글자 규칙이에요.
비율: ${ratioText()} (앞 컷과 똑같이)
장면: ${who}이 ${S.info.type||'가게'} 앞에서 손님에게 반갑게 손을 흔들며 활짝 웃고 있어요. 인물은 화면 아래쪽 3분의 1에 작게, 위쪽과 가운데는 글자 자리로 넉넉히 비워 주세요.
배경: ${P.desc}. 단순하고 깔끔하게, 가게 분위기만 살짝.

[이 장에 들어갈 글자 - 정확히 이대로]${name?`\n가게 이름 (맨 위 작은 글씨): "${name}"`:''}
큰 제목 (위쪽 가운데, 1컷 제목과 같은 글씨 모양${head.length>1?', 두 줄':''}): ${head.map(l=>`"${l}"`).join(' / ')}${ls.length?`\n안내 (가운데 흰 둥근 네모 칸 안에 한 줄씩 또박또박, 읽기 쉬운 굵은 고딕체): ${ls.map(x=>`"${x.text}"`).join(' / ')}${ls.some(x=>x.icon)?`\n안내 줄 앞 작은 그림 아이콘: ${ls.map(x=>x.icon?`"${x.text.slice(0,6)}…" 앞에 ${x.icon} 모양`:'').filter(Boolean).join(', ')} (아이콘은 글자가 아니라 그림으로)`:''}`:''}
버튼 (안내 아래, 알약 모양 둥근 버튼 안): "${btn}"
맨 아래 작은 글씨: "저장해 두고 다음 편도 봐 주세요"

위 문구 말고 다른 글자는 넣지 마세요. 전화번호, 주소, 로고, 영업시간을 지어내지 마세요. 맞춤법 그대로, 한 글자도 바꾸지 마세요.`; }
function endImageParts(){ const n=cuts().length, i=n>1?1:0, parts=cutImageParts(i); parts[0].text=parts[0].text.replace(cutPrompt(cuts()[i],i),endPrompt()); return parts; }
function endHTML(){ const e=ec();
  return `<div class="endbox" id="endbox"><div>
    <b style="font-size:15px">마지막 장 안내 카드</b> <small style="color:var(--muted)">선택 · 웹툰 맨 뒤에 한 장 더</small>
    <div class="chips" style="margin-top:8px"><button class="chip" data-endon="1" aria-pressed="${e.on}">붙이기</button><button class="chip" data-endon="0" aria-pressed="${!e.on}">안 붙이기</button></div>
    ${e.on?`<label class="f">배경 느낌</label><div class="chips">${Object.entries(END_STYLES).map(([k,v])=>`<button class="chip" data-endst="${k}" aria-pressed="${e.style===k}">${v.name}</button>`).join('')}</div>
    <label class="f" for="e-head">큰 문구 <small>두 줄까지</small></label><textarea class="in" id="e-head" data-end="head" rows="2" placeholder="다음 편도 궁금하다면?">${esc(e.head)}</textarea>
    <label class="f" for="e-lines">안내 <small>한 줄에 하나 · 최대 4줄 · 비우면 가게 프로필의 예약 안내</small></label><textarea class="in" id="e-lines" data-end="lines" rows="3" placeholder="📍 망원동 123-4 (망원역 2번 출구 3분)&#10;⏰ 매일 11:00~21:00 · 월요일 휴무">${esc(e.lines)}</textarea>
    <label class="f" for="e-btn">버튼 문구</label><input class="in" id="e-btn" data-end="btn" value="${esc(e.btn)}" placeholder="프로필 링크에서 예약하기">
    <p class="sub" style="margin-top:8px">이 문구로 <b>그림 프롬프트</b>가 만들어져요(① 그림 그리기 목록 맨 끝). 컷과 같은 대화창에서 그리면 같은 캐릭터·글씨로 나와요. 한 번 그려 두면 다음 편에도 그대로 붙어요.</p>`
    :`<p class="sub" style="margin-top:8px">예약 방법·위치·영업시간을 담은 한 장을 맨 뒤에 붙여요. 우리 캐릭터가 손 흔드는 그림으로, 컷과 같은 그림체·글씨로 그려요.</p>`}
  </div>${e.on?`<div><canvas id="endCv" width="1080" height="${ratio().h}" aria-label="마지막 장 안내 카드"></canvas>
    <div class="row" style="margin-top:8px;gap:6px"><button class="btn sm" data-act="endUp">${e.img?'바꾸기':'그림 올리기'}</button><button class="btn sm" data-copy="endp">프롬프트 복사</button>${STANDALONE?`<button class="btn sm ghost" data-act="endAI">AI로 그리기</button>`:''}${e.img?`<button class="btn sm" data-act="endDl">저장</button>`:''}</div><div class="status" id="st-end"></div></div>`:''}</div>`; }
'''+s[b:]
rep("const END_STYLES={light:{name:'흰 바탕',","const END_STYLES={light:{desc:'밝은 흰색·크림색 배경',name:'밝게',")
rep("dark:{name:'검은 바탕',","dark:{desc:'어두운 남색 배경에 밝은 글씨',name:'어둡게',")
rep("point:{name:'노란 포인트',","point:{desc:'선명한 노란색 배경',name:'노란 포인트',")
rep("function ec(){ S.endcard={on:false,style:'light',head:'',lines:'',btn:'',...(S.endcard||{})}; return S.endcard; }","function ec(){ S.endcard={on:false,style:'light',head:'',lines:'',btn:'',img:'',...(S.endcard||{})}; return S.endcard; }")
# zip & reel: only include end card if drawn
rep("  if(endOn()){ const cv=document.createElement('canvas'); await drawEnd(cv); zip.file(","  if(endOn()&&ec().img){ const cv=document.createElement('canvas'); await drawEnd(cv); zip.file(")
rep("if(endOn()){ const cv=document.createElement('canvas'); await drawEnd(cv); out.push(cv); } return out.map(","if(endOn()&&ec().img){ const cv=document.createElement('canvas'); await drawEnd(cv); out.push(cv); } return out.map(")
# guide item
rep("      ${cs.map((c,i)=>`<li><div class=\"gh\"><b>${i+1}컷 그리기</b><span class=\"tag\">${esc(c.role)}</span><button class=\"btn sm\" data-copy=\"cut-${i}\">복사</button></div><pre>${esc(cutPrompt(c,i))}</pre></li>`).join('')}\n",
    "      ${cs.map((c,i)=>`<li><div class=\"gh\"><b>${i+1}컷 그리기</b><span class=\"tag\">${esc(c.role)}</span><button class=\"btn sm\" data-copy=\"cut-${i}\">복사</button></div><pre>${esc(cutPrompt(c,i))}</pre></li>`).join('')}\n      ${ec().on?`<li><div class=\"gh\"><b>마지막 장 안내 카드 그리기</b><span class=\"tag\">${ec().img?'이미 있음 · 바뀔 때만':'선택'}</span><button class=\"btn sm\" data-copy=\"endp\">복사</button></div><p>마지막 컷 다음에 같은 대화창에서 보내세요. 문구는 ② 아래 \"마지막 장 안내 카드\"에서 바꿀 수 있어요.</p><pre>${esc(endPrompt())}</pre></li>`:`<li><div class=\"gh\"><b>마지막 장 안내 카드</b><span class=\"tag\">선택</span></div><p>② 아래 \"마지막 장 안내 카드\"에서 \"붙이기\"를 누르면 여기에 안내 카드 프롬프트가 생겨요.</p></li>`}\n")
rep("fixlabel:FIX_LABEL,fixdraw:FIX_DRAW()}[k]","fixlabel:FIX_LABEL,fixdraw:FIX_DRAW(),endp:endPrompt()}[k]")
# auto draw end card
rep("    autoCtl=null; vPost(); renderPhone();\n    if(st()){ st().className='status'; st().textContent='끝까지",
    "    if(ec().on&&(!onlyEmpty||!ec().img)){ if(st()){ st().className='status'; st().innerHTML='<span class=\"spin\"></span> 마지막 장 안내 카드 그리는 중'; } ec().img=await gimage(endImageParts(),sig); save(); }\n    autoCtl=null; vPost(); renderPhone();\n    if(st()){ st().className='status'; st().textContent='끝까지")
# events
rep("  if(b.dataset.endon){ ec().on=b.dataset.endon==='1'; save(); return refreshEnd(); }","  if(b.dataset.jump){ const el=document.querySelector(b.dataset.jump); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); return; }\n  if(b.dataset.endon){ ec().on=b.dataset.endon==='1'; save(); refreshEnd(); const g=$('#guideBox'); if(g) g.innerHTML=guideHTML(); return; }")
rep("  if(b.dataset.endst){ ec().style=b.dataset.endst; save(); return refreshEnd(); }","  if(b.dataset.endst){ ec().style=b.dataset.endst; save(); document.querySelectorAll('[data-endst]').forEach(c=>c.setAttribute('aria-pressed',c.dataset.endst===ec().style)); const g=$('#guideBox'); if(g) g.innerHTML=guideHTML(); return; }")
rep("  if(a==='endDl'){","  if(a==='endUp'){ endPick=true; feedPick=false; refPick=null; photoPick=null; upMany=false; return pickFile(false); }\n  if(a==='endAI') return run(b,async()=>{ if(!API.key){ toast('Gemini API 키를 먼저 넣어 주세요'); return; } const st=$('#st-end'); if(st){ st.className='status'; st.innerHTML='<span class=\"spin\"></span> 안내 카드 그리는 중 · 10~40초'; } try{ ec().img=await gimage(endImageParts()); save(); refreshEnd(); }catch(e){ const s3=$('#st-end'); if(s3){ s3.className='status err'; s3.textContent=e.message||'그리지 못했어요'; } } });\n  if(a==='endDl'){")
rep("let upTarget=0, upMany=false, refPick=null, photoPick=null, feedPick=false;","let upTarget=0, upMany=false, refPick=null, photoPick=null, feedPick=false, endPick=false;")
rep("  if(feedPick){","  if(endPick){ endPick=false; ec().img=await fileToImg(files[0]); save(); refreshEnd(); toast('안내 카드를 넣었어요. 맨 뒤 장으로 붙어요'); return; }\n  if(feedPick){")
# end input: refresh guide prompt text (debounced)
rep("  if(el.dataset.end){ ec()[el.dataset.end]=el.value; save(); clearTimeout(window._ed); window._ed=setTimeout(()=>{ const c=$('#endCv'); if(c) drawEnd(c); renderPhone(); },200); return; }",
    "  if(el.dataset.end){ ec()[el.dataset.end]=el.value; save(); clearTimeout(window._ed); window._ed=setTimeout(()=>{ const g=$('#guideBox'); if(g){ const sc=g.scrollTop; g.innerHTML=guideHTML(); } },400); return; }")
open(p,'w').write(s); print('ok')
