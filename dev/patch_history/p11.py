import sys
p='/home/claude/toon-planner/index.html'; s=open(p).read()
def rep(a,b,cnt=1):
    global s
    if s.count(a)!=cnt: print('MISSING/COUNT',s.count(a),':',a[:120]); sys.exit(1)
    s=s.replace(a,b)

# ---------- CSS ----------
rep('.toast.show{opacity:1}\n', '''.toast.show{opacity:1}
.todo{display:flex;align-items:center;gap:12px;background:var(--ink);color:var(--surface);border-radius:14px;padding:12px 14px 12px 16px;margin:0 0 16px}
.todo .k{flex:none;font-size:12px;font-weight:900;background:var(--accent);color:var(--accent-ink);border-radius:6px;padding:2px 8px}
.todo.done .k{background:#2FB36B;color:#fff}
.todo p{margin:0;flex:1;font-size:14.5px;font-weight:700;line-height:1.45}
.todo .prog{display:flex;gap:4px;flex:none}.todo .prog i{width:18px;height:4px;border-radius:2px;background:rgba(255,255,255,.25)}.todo .prog i.on{background:var(--accent)}
.todo .btn{flex:none;background:var(--surface);color:var(--ink);border-color:var(--surface)}
.flash{outline:3px solid var(--accent)!important;outline-offset:3px}
@media (max-width:640px){.todo{flex-wrap:wrap}.todo p{flex-basis:calc(100% - 90px)}.todo .prog{order:3;flex:1}}
.kit{border:1px solid var(--line);border-radius:14px;padding:16px;margin-top:10px}
.kit-copy{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}
.kwarn{background:var(--warn-bg);color:var(--warn);border-radius:10px;padding:8px 12px;font-size:13.5px;font-weight:700;margin:12px 0 0}.kwarn p{margin:2px 0}
.cnt{font-weight:600;color:var(--muted);font-size:12.5px;margin-left:6px}.cnt .bad{color:var(--bad);font-weight:800}.cnt .warn{color:var(--warn);font-weight:800}
.alt-row{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:8px;align-items:start;margin-top:8px}.alt-row b{font-size:13px;padding-top:10px}
.kchecks{display:flex;flex-direction:column;gap:2px}
.kck{display:flex;gap:10px;align-items:flex-start;padding:7px 6px;font-size:14px;cursor:pointer;border-radius:8px}.kck:hover{background:var(--sunken)}
.kck input{width:18px;height:18px;margin:1px 0 0;accent-color:var(--ink);flex:none}.kck input:checked+span{color:var(--muted);text-decoration:line-through}
.posted{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}.posted b{color:var(--ok)}.posted .in{flex:1;min-width:200px}
.pst{display:flex;gap:4px;margin-top:8px;flex-wrap:wrap}
.pstep{font:inherit;font-size:12px;font-weight:700;border:1px solid var(--line-2);background:var(--surface);color:var(--muted);border-radius:999px;padding:3px 11px;cursor:pointer}
.pstep.done{background:var(--sunken);color:var(--ink-2)}.pstep.on{background:var(--ink);color:var(--surface);border-color:var(--ink)}
.plan-item.st-posted{background:var(--sunken)}.plan-item.late{border-color:var(--bad)}.late-t{color:var(--bad)}
.pmeta{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center;font-size:13px}.in.sm{padding:6px 10px;font-size:13px;width:auto;flex:1;min-width:120px}
.pmeta a{font-weight:800;color:var(--ink)}
.plan-sum{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13.5px;color:var(--ink-2)}
.trb{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.trb details{border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.trb summary{padding:12px 14px;font-weight:800;font-size:14.5px;cursor:pointer}
.trb .tin{padding:0 14px 14px;font-size:14px}.trb .why{color:var(--muted);margin:0 0 8px}.trb ol{margin:0;padding-left:20px}.trb li{margin:4px 0}
.trb .say{display:flex;gap:8px;align-items:center;background:var(--accent-soft);border-radius:10px;padding:8px 10px;margin-top:10px;font-size:13.5px}.trb .say span{flex:1}
.prof summary small{font-weight:600;color:var(--muted);margin-left:6px}
''')

# ---------- markup ----------
rep('<button class="btn sm" data-act="help">사용 방법</button><div class="ai">','<button class="btn sm" data-act="trouble">막힐 때</button><button class="btn sm" data-act="help">사용 방법</button><div class="ai">')
rep('<section id="help" class="help" hidden></section>','<section id="help" class="help" hidden></section>\n  <section id="trouble" class="help" hidden></section>')
rep('<nav class="steps" id="steps" aria-label="만드는 순서"></nav>','<nav class="steps" id="steps" aria-label="만드는 순서"></nav>\n  <div class="todo" id="todo" role="status" hidden></div>')

# ---------- profile ----------
rep("function infoBlock(){ const i=S.info; return `[가게 정보]","""function prof(){ S.profile={voice:'',banned:'',tags:'',cta:'',loc:'',collab:'',...(S.profile||{})}; return S.profile; }
function profBlock(){ const p=prof(), o=[]; if(p.voice.trim()) o.push(`가게 말투(캡션·내레이션·고정 댓글에 적용): ${p.voice}`); if(p.banned.trim()) o.push(`절대 쓰지 말 것(대본·캡션·해시태그 모두): ${p.banned}`); if(p.cta.trim()) o.push(`예약·문의 안내(마지막 컷과 캡션의 행동 유도는 이 안내와 맞게, 다른 방법을 지어내지 말 것): ${p.cta}`); return o.length?`\\n[가게 프로필 - 꼭 지키기]\\n${o.join('\\n')}`:''; }
const bannedHits=t=>prof().banned.split(/[,\\n]/).map(x=>x.trim()).filter(Boolean).filter(w=>String(t||'').includes(w));
function profileHTML(){ const p=prof(), n=['voice','banned','tags','cta','loc','collab'].filter(k=>String(p[k]||'').trim()).length, v=k=>esc(p[k]||'');
  return `<details class="more prof"><summary>가게 프로필 <small>${n?`${n}/6칸 채움 · 모든 편에 자동 적용 중`:'한 번만 적어 두면 모든 편에 자동으로 들어가요'}</small></summary><div class="inner">
    <p class="sub" style="margin-top:0">직원이 바뀌어도 같은 말투, 같은 해시태그로 올라가요. 대본·캡션·한 달 기획을 만들 때 AI가 이 내용을 지키고, 올리기 전 점검에도 쓰여요.</p>
    <div class="g2">
      <div><label class="f" for="pf-voice">가게 말투</label><input class="in" id="pf-voice" data-prof="voice" value="${v('voice')}" placeholder="예: 다정한 존댓말, 이모지는 가끔"></div>
      <div><label class="f" for="pf-banned">쓰면 안 되는 말 <small>쉼표로 구분</small></label><input class="in" id="pf-banned" data-prof="banned" value="${v('banned')}" placeholder="예: 최고, 1등, 무조건, 100%"></div>
    </div>
    <label class="f" for="pf-tags">항상 넣는 해시태그 <small>1~3개 추천 · 매 편 해시태그 앞에 자동으로 붙어요</small></label><input class="in" id="pf-tags" data-prof="tags" value="${v('tags')}" placeholder="예: #망원동카페 #담커피">
    <label class="f" for="pf-cta">예약·문의 안내 <small>캡션 마지막 줄에 자동으로 붙어요</small></label><input class="in" id="pf-cta" data-prof="cta" value="${v('cta')}" placeholder="예: 📍예약은 프로필 링크 → 네이버 예약에서 해 주세요">
    <div class="g2">
      <div><label class="f" for="pf-loc">위치 태그 <small>올리기 체크리스트에 떠요</small></label><input class="in" id="pf-loc" data-prof="loc" value="${v('loc')}" placeholder="예: 담 사진관 망원점"></div>
      <div><label class="f" for="pf-collab">함께 태그할 계정 <small>선택</small></label><input class="in" id="pf-collab" data-prof="collab" value="${v('collab')}" placeholder="예: @dam_studio_2nd"></div>
    </div></div></details>`; }
function infoBlock(){ return infoBlock0()+profBlock(); }
function infoBlock0(){ const i=S.info; return `[가게 정보]""")
rep("- hashtags: 해시태그 12개, 공백 구분","- hashtags: 해시태그 ${Math.max(2,5-tagList(prof().tags).length)}개(인스타는 게시물당 5개까지만 반영). 동네·업종·이번 편 주제에 딱 맞는 구체적인 것, 공백 구분${prof().tags.trim()?`. 가게 고정 해시태그(${prof().tags})와 겹치지 않게`:''}")
rep('''    <details class="more">
      <summary>더 자세히 설정하기</summary>''','''    ${profileHTML()}
    <details class="more">
      <summary>더 자세히 설정하기</summary>''')
rep('<p class="sub" style="margin-top:8px">테마(${esc(artOf().name)})와 주인공 설정은','${profileHTML()}\n    <p class="sub" style="margin-top:8px">테마(${esc(artOf().name)})와 주인공 설정은')
rep('<label class="f">컷 수 <small>인스타 한 게시물에 최대 10장까지 올라가요</small></label>','<label class="f">컷 수 <small>인스타는 한 게시물에 20장까지 되지만, 인스타툰은 10컷 이내가 끝까지 잘 읽혀요</small></label>')
rep("  if(!out.length) out.push(['ok','좋아요']);","  const bh=bannedHits([c.title,c.sub,c.bubble,c.caption].join(' ')); if(bh.length) out.push(['bad','금지어: '+bh[0]]);\n  if(!out.length) out.push(['ok','좋아요']);")

# ---------- kit ----------
a=s.index('    <h2 class="sec">③ 인스타그램에 올리기</h2>')
b_=s.index("${!T.caption?'<p class=\"sub\">직접 쓰기로 만든 경우 캡션은 비어 있어요.</p>':''}")
b_=b_+len("${!T.caption?'<p class=\"sub\">직접 쓰기로 만든 경우 캡션은 비어 있어요.</p>':''}")
s=s[:a]+'    ${kitHTML()}'+s[b_:]
rep("  const have=cs.filter(c=>c.img).length;\n  $('#main').innerHTML=`<section class=\"panel\">\n    <div class=\"ph\"><div><h1>그림 만들고 올리기</h1>",
    "  const have=cs.filter(c=>c.img).length;\n  const px=planItem(); if(px&&have===n&&['plan','script'].includes(stOf(px))){ px.status='art'; save(); }\n  $('#main').innerHTML=`<section class=\"panel\">\n    <div class=\"ph\"><div><h1>그림 만들고 올리기</h1>")
rep("    <div class=\"actions\"><button class=\"btn ghost\" data-step=\"edit\">← 대본 다듬기</button><span class=\"grow\"></span><button class=\"btn acc\" data-act=\"next\">같은 가게로 다음 편 만들기</button></div>\n  </section>`;\n  drawAll();\n}",
    "    <div class=\"actions\"><button class=\"btn ghost\" data-step=\"edit\">← 대본 다듬기</button><span class=\"grow\"></span><button class=\"btn acc\" data-act=\"next\">같은 가게로 다음 편 만들기</button></div>\n  </section>`;\n  drawAll(); kitCounters();\n}\n"+r'''
/* ================= 게시 준비 키트 ================= */
const IG_CAP=2200, IG_TAGS=5;
const tagList=t=>[...new Set(String(t||'').split(/[\s,]+/).map(x=>x.trim().replace(/^#+/,'')).filter(Boolean).map(x=>'#'+x))];
const allTags=()=>[...new Set([...tagList(prof().tags),...tagList(S.toon?.hashtags)])];
function finalCaption(){ const cta=prof().cta.trim(); let c=String(S.toon?.caption||'').trim(); if(cta&&!c.includes(cta)) c+=(c?'\n\n':'')+cta; return c; }
function postText(){ const t=allTags().slice(0,IG_TAGS).join(' '); return finalCaption()+(t?'\n\n'+t:''); }
function altOf(c,i){ const T=S.toon; if(T.alts&&T.alts[i]) return T.alts[i];
  const d=String(c.direction||'').replace(/\s+/g,' ').trim(), first=(d.split(/(?<=[.!?。])\s/)[0]||d);
  const say=talk(c).map(t=>`${t.who?t.who+': ':''}"${t.text}"`).join(' '), ttl=lines(c.title).join(' ');
  return `${S.info.name||S.info.type||'가게'} 인스타툰 ${i+1}/${cuts().length}컷. ${ttl?`제목 "${ttl}". `:''}${first}${say?' '+say:''}`.slice(0,300); }
function kitChecks(){ const p=prof(), n=cuts().length; return [
  ['order',`완성 이미지 ${n}장을 1컷부터 순서대로 골랐어요`],
  ['crop',`사진 고르는 화면에서 비율(확장) 버튼으로 ${ratio().name}이 잘리지 않게 했어요`],
  ['cap','캡션 + 해시태그를 붙여 넣었어요'],
  ['loc',`위치 태그를 달았어요${p.loc?` (${p.loc})`:''}`],
  ...(p.collab?[['collab',`${p.collab} 계정을 함께 태그했어요`]]:[]),
  ['alt','"고급 설정"에서 컷마다 대체 텍스트를 넣었어요 (선택)'],
  ['cmt','올린 뒤 첫 댓글을 달고 고정했어요'] ]; }
function kitHTML(){ const T=S.toon, cs=cuts(), p=prof(), fixed=tagList(p.tags), pi=planItem();
  return `<h2 class="sec" id="kit">③ 인스타그램에 올리기 · 게시 준비 키트</h2>
  <p class="sub">이 칸만 보면서 올리면 돼요. 여기서 고친 글은 자동 저장돼요.</p>
  <div class="kit">
    <div class="kit-copy"><button class="btn pri" data-act="kitCopy">캡션 + 해시태그 한 번에 복사</button><span class="status">인스타의 "문구 입력" 칸에 그대로 붙여 넣으면 돼요</span></div>
    <div class="kwarn" id="kitWarn" hidden></div>
    <label class="f" for="k-cap">캡션 <span class="cnt" id="cnt-cap"></span></label>
    <textarea class="in" id="k-cap" data-kitv="caption" rows="6" placeholder="캡션을 적어 주세요. 첫 줄이 피드에서 보이는 부분이라 가장 궁금하게!">${esc(T.caption)}</textarea>
    <p class="sub" style="margin-top:6px">${p.cta.trim()?`가게 프로필의 예약·문의 안내가 캡션 끝에 자동으로 붙어요: <b>${esc(p.cta)}</b>`:'가게 프로필에 예약·문의 안내를 적어 두면 매번 캡션 끝에 자동으로 붙어요.'} 피드에서는 첫 줄(앞 125자 정도)만 보이고 나머지는 "더 보기"로 접혀요.</p>
    <label class="f" for="k-tag">해시태그 <span class="cnt" id="cnt-tag"></span></label>
    <input class="in" id="k-tag" data-kitv="hashtags" value="${esc(T.hashtags)}" placeholder="#동네이름카페 #업종 #주제">
    <p class="sub" style="margin-top:6px">인스타는 2025년 12월부터 게시물당 해시태그를 <b>5개까지만</b> 반영해요. 많이 다는 것보다 동네·업종·주제가 딱 맞는 게 좋아요.${fixed.length?` 가게 프로필 고정 해시태그 ${fixed.length}개(${esc(fixed.join(' '))})가 앞에 붙어요.`:''}</p>
    <div class="lab-row"><label class="f" for="k-cmt">첫 댓글 · 고정 댓글</label><button class="btn sm" data-copy="comment">복사</button></div>
    <textarea class="in" id="k-cmt" data-kitv="comment" rows="3" placeholder="예: 여러분 가게에도 이런 손님 있나요? 👀">${esc(T.comment)}</textarea>
    <details class="more" style="margin-top:14px"><summary>컷마다 대체 텍스트 <small style="font-weight:600;color:var(--muted)">선택 · 검색 노출, 화면을 잘 못 보는 손님을 위해</small></summary><div class="inner">
      <p class="sub" style="margin-top:0">올리기 직전 화면 아래 <b>"고급 설정" → "대체 텍스트 작성"</b>에서 컷마다 붙여 넣어요. 대본으로 자동으로 써 두었고, 고칠 수 있어요.</p>
      ${cs.map((c,i)=>`<div class="alt-row"><b>${i+1}컷</b><textarea class="in" data-kitv="alt-${i}" rows="2" aria-label="${i+1}컷 대체 텍스트">${esc(altOf(c,i))}</textarea><button class="btn sm" data-copy="alt-${i}">복사</button></div>`).join('')}
    </div></details>
    <label class="f">올리기 체크리스트 <span class="cnt" id="cnt-ck"></span></label>
    <div class="kchecks">${kitChecks().map(([k,t])=>`<label class="kck"><input type="checkbox" data-kitck="${k}" ${T.kit?.[k]?'checked':''}><span>${esc(t)}</span></label>`).join('')}</div>
    <div class="posted">${T.postedAt?`<b>✓ ${esc(T.postedAt)}에 올렸어요</b><input class="in" data-kitv="link" value="${esc(T.link||'')}" placeholder="게시물 링크를 붙여 두면 연재표에서 바로 열 수 있어요" aria-label="게시물 링크"><button class="btn sm ghost" data-act="unposted">올림 취소</button>`
      :`<button class="btn acc" data-act="posted">인스타에 올렸어요</button><span class="status">${pi?`한 달 연재표의 "${esc(pi.title)}"에도 올림으로 표시돼요`:'누르면 이번 편이 완료로 표시돼요'}</span>`}</div>
  </div>`; }
function kitCounters(){ const T=S.toon; renderTodo(); if(!T||!$('#kit')) return;
  const cap=finalCaption(), n=[...cap].length, first=[...(cap.split('\n')[0]||'')].length, tags=allTags(), fixed=tagList(prof().tags);
  $('#cnt-cap').innerHTML=`<span class="${n>IG_CAP?'bad':''}">${n.toLocaleString()} / 2,200자</span> · 첫 줄 ${first}자`;
  $('#cnt-tag').innerHTML=`<span class="${tags.length>IG_TAGS?'warn':''}">${tags.length} / ${IG_TAGS}개</span>${fixed.length?` · 고정 ${fixed.length}개 포함`:''}`;
  const ks=kitChecks(), done=ks.filter(([k])=>T.kit?.[k]).length; $('#cnt-ck').textContent=`${done} / ${ks.length}`;
  const w=[]; if(n>IG_CAP) w.push(`캡션이 ${n-IG_CAP}자 넘쳐요. 줄여야 올라가요.`);
  if(tags.length>IG_TAGS) w.push(`해시태그가 ${tags.length}개예요. 복사할 때 앞의 ${IG_TAGS}개만 들어가요: ${tags.slice(0,IG_TAGS).join(' ')}`);
  if(first>125) w.push('첫 줄이 길어서 피드에서 잘려 보여요. 첫 줄은 궁금한 한 문장으로 짧게!');
  const hits=bannedHits([cap,tags.join(' '),T.comment||'',...cuts().map(c=>[c.title,c.sub,c.bubble,c.caption].join(' '))].join(' '));
  if(hits.length) w.push(`가게 프로필의 "쓰면 안 되는 말"이 들어 있어요: ${[...new Set(hits)].join(', ')}`);
  const box=$('#kitWarn'); box.innerHTML=w.map(x=>`<p>⚠ ${esc(x)}</p>`).join(''); box.hidden=!w.length; }
const todayStr=()=>{ const d=new Date(); return `${d.getMonth()+1}/${d.getDate()}`; };

/* ================= 연재 진행판 ================= */
const STAT={plan:{n:'기획'},script:{n:'대본'},art:{n:'그림'},posted:{n:'올림'}}, STAT_KEYS=Object.keys(STAT);
const stOf=x=>x.status||(x.made?'script':'plan');
function planItem(){ const r=S.planRef; if(!r||!S.month||S.month.ym!==r.ym) return null; const x=S.month.items[r.k]; return x&&x.title===r.title?x:null; }
function dueOf(x){ const m=String(x.date||'').match(/(\d{1,2})\/(\d{1,2})/); if(!m||!S.month) return null; return new Date(Number(S.month.ym.slice(0,4)),Number(m[1])-1,Number(m[2]),23,59); }
const isLate=x=>{ const d=dueOf(x); return !!d&&stOf(x)!=='posted'&&d<new Date(); };
function nextPlan(){ const M=S.month; if(!M) return null; const k=M.items.findIndex(x=>stOf(x)!=='posted'); return k<0?null:{k,x:M.items[k]}; }

/* ================= 지금 할 일 ================= */
function todoInfo(){
  const i=S.info;
  if((S.mode||'one')==='month'){ const M=mo();
    if(!M.items.length) return {t:i.type.trim()?'달과 올리는 횟수를 고르고 "한 달 기획 만들기"를 눌러 주세요':'업종을 적어 주세요. 그다음 "한 달 기획 만들기"를 누르면 한 달 연재표가 나와요',go:i.type.trim()?'[data-act="monthMake"]':'#m-type'};
    const nx=nextPlan(); if(!nx) return {t:'이번 달 연재를 모두 올렸어요! 다음 달 기획을 만들어 보세요',done:1};
    const st=stOf(nx.x), late=isLate(nx.x)?' (날짜가 지났어요)':'';
    const what={plan:'"이 편 만들기"를 누르면 대본까지 자동으로 써요',script:'"한 편 만들기" 탭에서 그림을 그려 주세요',art:'그림 완성! "한 편 만들기" 탭에서 인스타에 올리고 "인스타에 올렸어요"를 눌러 주세요'}[st];
    return {t:`다음 편 ${nx.x.date}${late} "${nx.x.title}" · ${what}`,go:`[data-pk="${nx.k}"]`}; }
  const cs=cuts(), n=cs.length, T=S.toon;
  if(S.step==='input'||!n){ if(!i.type.trim()) return {t:'② 업종을 골라 주세요. 꼭 필요한 건 이것 하나예요',go:'[data-ind]',stage:0};
    return {t:n?'이미 만든 대본이 있어요. 새로 만들려면 "인스타툰 만들기", 이어서 하려면 "이어서 다듬기"를 눌러 주세요':'있었던 일을 적거나 비워 둔 채 "인스타툰 만들기"를 눌러 주세요',go:'#makeBtn',stage:0}; }
  if(S.step==='edit'){ const bad=cs.filter((c,k)=>checkCut(c,k,n).some(x=>x[0]==='bad')).length;
    if(bad) return {t:`빨간 표시가 있는 컷 ${bad}개를 먼저 고쳐 주세요. 컷을 누르면 열려요`,go:'.bdg.bad',stage:1};
    return {t:'오른쪽 미리보기를 손님처럼 넘겨 읽어 보고, 괜찮으면 맨 아래 "다 됐어요, 올리기 →"를 눌러 주세요',go:'.actions [data-step="post"]',stage:1}; }
  const have=cs.filter(c=>c.img).length, m=cs.findIndex(c=>!c.img);
  if(have<n){
    if(STANDALONE&&typeof autoCtl!=='undefined'&&autoCtl) return {t:`그리는 중이에요 (${have}/${n}컷). 창을 닫지 말고 기다려 주세요`,stage:2};
    if(STANDALONE&&API.key){ if(!refOf(0)) return {t:'주인공 기준 이미지를 올리거나 "AI로 만들기"를 눌러 주세요. 모든 컷이 이 얼굴로 그려져요',go:'.auto',stage:2};
      return {t:`"빈 컷 자동으로 그리기"를 누르면 ${m+1}컷부터 끝까지 그려요 (${have}/${n}컷 완료)`,go:'[data-act="autoEmpty"]',stage:2}; }
    if(!have) return {t:'아래 ①의 1번부터 순서대로 Gemini·ChatGPT에 붙여 넣고, 받은 그림을 컷마다 올려 주세요',go:'#guideBox',stage:2};
    return {t:`${m+1}컷 그림을 올려 주세요 (${have}/${n}컷 완료)`,go:`[data-slot="${m}"]`,stage:2}; }
  if(!T.zipped) return {t:'모든 컷 완성! "완성 이미지 전체 저장 (zip)"을 눌러 주세요',go:'[data-act="zip"]',stage:3};
  if(!T.postedAt) return {t:'게시 준비 키트를 보면서 인스타에 올리고 "인스타에 올렸어요"를 눌러 주세요',go:'#kit',stage:4};
  return {t:'이번 편 완료! "같은 가게로 다음 편 만들기"로 이어 가요',go:'[data-act="next"]',stage:4,done:1};
}
function renderTodo(){ const el=$('#todo'); if(!el) return; let t=null; try{ t=todoInfo(); }catch(_){}
  el.hidden=!t; if(!t) return; el.className='todo'+(t.done?' done':'');
  el.innerHTML=`<span class="k">${t.done?'완료':'지금 할 일'}</span><p>${esc(t.t)}</p>${t.stage!=null?`<span class="prog" aria-label="5단계 중 ${t.stage+1}단계">${[0,1,2,3,4].map(k=>`<i class="${k<=t.stage?'on':''}"></i>`).join('')}</span>`:''}${t.go?`<button class="btn sm" data-todo="1">여기로 ↓</button>`:''}`; }
function goTodo(){ const t=todoInfo(); const el=t&&t.go&&document.querySelector(t.go); if(!el){ toast('화면 아래쪽을 확인해 주세요'); return; }
  const d=el.closest('details'); if(d&&!d.open) d.open=true;
  el.scrollIntoView({behavior:'smooth',block:'center'}); el.classList.add('flash'); setTimeout(()=>el.classList.remove('flash'),1800); }

/* ================= 막힐 때 ================= */
const FIX_LABEL='그림에 제가 드리지 않은 글자가 들어갔어요. 인물 옆 이름·나이·역할 글자, 영어, 간판·메뉴판·화면 속 지어낸 글자를 모두 지우고, 제가 따옴표로 드린 문구만 남긴 같은 장면으로 다시 그려 주세요.';
const FIX_DRAW=()=>`설명 말고 이미지로 그려 주세요. 방금 드린 장면을 ${ratioText()} 그림 한 장으로 만들어 주세요.`;
const TROUBLE=[
  {q:'캐릭터 얼굴·머리·옷이 컷마다 달라져요',why:'대화가 길어지면 AI가 처음 첨부한 캐릭터를 흐리게 기억해요. 캐릭터 이미지를 첨부하지 않았을 때도 그래요.',fix:['아래 문장을 보내서 그 컷만 다시 그리게 하세요.','그래도 계속 달라지면 새 대화창을 열고 "규칙 알려주기"부터 다시 해요. 이때 캐릭터 이미지와 잘 나온 1컷을 같이 첨부하세요.',STANDALONE?'파일 버전은 "주인공 기준 이미지"가 마음에 드는지 먼저 확인하세요. 모든 컷이 그 얼굴을 따라가요.':'한 메시지에 한 컷씩만 보내야 덜 흔들려요.'],copy:'fixchar'},
  {q:'한글 글자가 틀리거나 깨져서 나와요',why:'이미지 AI는 긴 문장과 받침 많은 글자에 약해요.',fix:['아래 문장을 보내 글자만 다시 넣게 하세요.','"대본 다듬기"에서 한 줄을 12자 이하로 줄이면 훨씬 덜 틀려요.','계속 틀리면 ①에서 "그림만 받고 이 사이트에서 글자 입히기"로 바꾸세요. 글자는 사이트가 넣어서 100% 정확해요.'],copy:'fixtypo'},
  {q:'그림 비율이 컷마다 다르거나 이상해요',why:'Gemini·ChatGPT가 가끔 비율을 무시하고 그려요.',fix:['그냥 올려도 괜찮아요. 올리는 순간 정해 둔 비율로 맞춰서 저장돼요.','가장자리가 잘리는 게 싫으면 "전체 보이기", 여백이 싫으면 "꽉 채우기"를 고르세요.','다시 그리게 하고 싶으면 아래 문장을 보내세요.'],copy:'fixratio'},
  {q:'글자 모양이 1컷과 달라요',why:'컷마다 새로 그리다 보니 글씨체·크기가 조금씩 바뀌어요.',fix:['아래 문장과 함께 완성된 1컷 그림을 첨부해서 보내세요.','"② 글자 모양 정하기"의 설정은 모든 컷 프롬프트에 똑같이 들어가 있어요.'],copy:'fixstyle'},
  {q:'이름표·영어·지어낸 간판 글자가 그림에 들어가요',why:'AI가 캐릭터 설명(예: "사장님, 30대")을 글자로 그려 넣거나 간판·메뉴판을 채우려고 글자를 지어내요.',fix:['아래 문장을 보내 글자를 빼고 다시 그리게 하세요.','가게 이름이나 메뉴를 그림에 꼭 넣고 싶으면 대본의 제목·대사·자막 칸에 적어 주세요. 그 글자만 들어가요.'],copy:'fixlabel'},
  {q:'AI가 그림은 안 그리고 글로만 답해요',why:'그림을 못 그리는 모델을 쓰고 있거나, 요청을 설명으로 알아들었을 때 그래요. 실제 브랜드·유명인·특정 작품 캐릭터를 요청하면 거절하기도 해요.',fix:['아래 문장을 보내 보세요.','Gemini는 이미지 만들기가 되는 모드인지, ChatGPT는 이미지 생성이 되는 요금제·모델인지 확인하세요.','거절당했다면 그림 설명에서 실제 상표·인물·작품 이름을 빼고 다시 보내세요.'],copy:'fixdraw'},
  {q:'"인스타툰 만들기"를 눌러도 안 되거나 오류가 떠요',why:'업종이 비었거나 AI 연결이 안 된 경우가 대부분이에요.',fix:['업종이 선택돼 있는지 확인하세요. 꼭 필요한 건 업종 하나예요.',STANDALONE?'오른쪽 위에 초록 점과 "Gemini 연결됨"이 보이는지 확인하세요. 안 보이면 "API 키 설정"에서 키를 다시 넣어 주세요.':'오른쪽 위에 초록 점과 "AI 연결됨"이 보이는지 확인하세요. 처음 누를 때 뜨는 허용 창에서 허용을 눌러야 해요.','잠깐 문제가 생긴 거라면 1분 뒤 다시 누르면 돼요. AI 없이 "직접 쓰기"로 만들 수도 있어요.']},
  {q:'대본이 밋밋하고 재미없어요',why:'이야기 칸이 비어 있으면 AI가 흔한 이야기로 채워요.',fix:['"있었던 일" 칸 위의 질문 버튼을 눌러 답해 보세요. 시간·장소·손님이 한 말 한마디만 있어도 확 살아나요.','"더 자세히 설정하기"에서 분위기를 바꿔 보세요.','컷마다 "제목 아이디어 5개", "이 컷 고치기"(예: 더 반전 있게), "손님 눈으로 점검받기"를 써 보세요.']},
  {q:'만들어 둔 게 사라졌어요',why:'작업 내용은 이 브라우저에만 저장돼요. 다른 컴퓨터·브라우저·시크릿 창에서 열었거나, 인터넷 기록을 지우면 안 보여요.',fix:['평소 쓰던 컴퓨터와 브라우저에서 다시 열어 보세요.','백업 파일이 있다면 오른쪽 위 "불러오기"로 고르면 그대로 돌아와요.','앞으로는 한 편을 끝낼 때마다 "백업 저장"을 눌러 두세요.']},
  {q:'저장 버튼을 눌러도 파일이 안 받아져요',why:'브라우저가 다운로드를 막았거나 확인 창을 닫은 경우예요.',fix:['저장할 때 뜨는 확인 창에서 허용·저장을 눌러 주세요.','그래도 안 되면 완성 이미지를 우클릭(휴대폰은 길게 눌러서)해서 저장하세요.']},
  {q:'인스타에 올렸더니 그림 가장자리가 잘려요',why:'인스타는 사진을 고를 때 기본으로 정사각형으로 잘라요. 한 게시물의 모든 장은 첫 장 비율을 따라가요.',fix:['사진 고르는 화면에서 비율(확장) 버튼을 눌러 원본 비율로 바꾼 뒤 여러 장을 선택하세요.','이 사이트에서 저장한 이미지는 모든 컷이 같은 비율이라 첫 장만 맞추면 다 맞아요.']},
];
function troubleHTML(){ return `<div class="help-in">
  <div class="row"><h2 style="flex:1;margin:0;font-size:20px;font-weight:900">막힐 때</h2><button class="btn sm ghost" data-act="trouble">닫기</button></div>
  <p class="sub" style="margin:6px 0 0">지금 겪는 문제를 누르면 이유와 바로 할 일이 나와요. AI에게 보낼 문장은 복사해서 그대로 붙여 넣으면 돼요.</p>
  <div class="trb">${TROUBLE.map(x=>`<details><summary>${esc(x.q)}</summary><div class="tin"><p class="why">${esc(x.why)}</p><ol>${x.fix.map(f=>`<li>${esc(f)}</li>`).join('')}</ol>${x.copy?`<div class="say"><span>AI에게 보낼 문장</span><button class="btn sm" data-copy="${x.copy}">복사</button></div>`:''}</div></details>`).join('')}</div>
  <p class="sub" style="margin-top:12px">그래도 안 되면 오른쪽 위 "백업 저장"으로 파일을 받아 둔 뒤 페이지를 새로고침해 보세요.</p></div>`; }
function toggleTrouble(force){ const h=$('#trouble'); const show=force??h.hidden; h.hidden=!show; if(show){ $('#help').hidden=true; h.innerHTML=troubleHTML(); h.scrollIntoView({behavior:'smooth',block:'start'}); } }''')

rep("function toggleHelp(force){ const h=$('#help'); const show=force??h.hidden; h.hidden=!show; if(show){ h.innerHTML=","function toggleHelp(force){ const h=$('#help'); const show=force??h.hidden; h.hidden=!show; if(show){ $('#trouble').hidden=true; h.innerHTML=")
# help cards
rep('      <div class="hcard"><span class="hn">저장과 백업</span>','''      <div class="hcard"><span class="hn">가게 프로필</span><p>첫 화면의 <b>"가게 프로필"</b>에 말투, 쓰면 안 되는 말, 항상 넣는 해시태그, 예약 안내, 위치 태그를 한 번만 적어 두세요. 모든 편의 대본·캡션에 자동으로 들어가서 직원이 바뀌어도 같은 톤으로 올라가요.</p></div>
      <div class="hcard"><span class="hn">올리기와 진행 관리</span><p>3단계 아래 <b>"게시 준비 키트"</b>에서 캡션·해시태그를 한 번에 복사하고, 글자 수와 금지어를 확인하고, 체크리스트대로 올린 뒤 <b>"인스타에 올렸어요"</b>를 누르세요. 한 달 연재표에 기획 → 대본 → 그림 → 올림으로 표시되고, 담당자와 게시물 링크도 적어 둘 수 있어요.</p></div>
      <div class="hcard"><span class="hn">지금 할 일 · 막힐 때</span><p>단계 버튼 아래 검은 줄이 <b>지금 해야 할 일</b>을 한 줄로 알려줘요. "여기로"를 누르면 그 버튼으로 이동해요. 캐릭터가 달라지거나 글자가 깨지면 오른쪽 위 <b>"막힐 때"</b>에서 증상을 고르세요.</p></div>
      <div class="hcard"><span class="hn">저장과 백업</span>''')
# guide tips link
rep('      <p>한 메시지에 한 컷만 보내야 캐릭터가 덜 흔들려요.','      <div class="tip"><span>다른 문제가 생겼을 때</span><button class="btn sm" data-act="trouble">막힐 때 보기</button></div>\n      <p>한 메시지에 한 컷만 보내야 캐릭터가 덜 흔들려요.')

# ---------- month board ----------
rep('<span class="status">${M.items.filter(x=>x.made).length}/${M.items.length}편 만듦</span>','<span class="plan-sum">${STAT_KEYS.map(s=>`<span>${STAT[s].n} <b>${M.items.filter(x=>stOf(x)===s).length}</b></span>`).join(\'\')}${M.items.filter(isLate).length?`<b class="late-t">날짜 지났는데 안 올린 편 ${M.items.filter(isLate).length}개</b>`:\'\'}</span>')
rep('''<article class="plan-item ${x.made?'made':''}">''','''<article class="plan-item st-${stOf(x)} ${isLate(x)?'late':''}" data-pk="${k}">''')
rep('''${x.made?'<span class="tag done">만듦</span>':''}</div>
          <b class="ptitle">${esc(x.title)}</b><p>${esc(x.story)}</p></div>''','''${isLate(x)?'<span class="tag" style="background:var(--bad-bg);color:var(--bad)">날짜 지남</span>':''}</div>
          <b class="ptitle">${esc(x.title)}</b><p>${esc(x.story)}</p>
          <div class="pst" role="group" aria-label="진행 단계">${STAT_KEYS.map(s=>`<button class="pstep ${stOf(x)===s?'on':STAT_KEYS.indexOf(s)<STAT_KEYS.indexOf(stOf(x))?'done':''}" data-pst="${k}|${s}" aria-pressed="${stOf(x)===s}">${STAT[s].n}</button>`).join('')}</div>
          <div class="pmeta"><input class="in sm" data-pwho="${k}" value="${esc(x.who||'')}" placeholder="담당자 (예: 민지)" aria-label="담당자">${stOf(x)==='posted'?`<input class="in sm" data-plink="${k}" value="${esc(x.link||'')}" placeholder="게시물 링크" aria-label="게시물 링크">${/^https?:\\/\\//.test(x.link||'')?`<a href="${esc(x.link)}" target="_blank" rel="noopener">열기</a>`:''}${x.postedAt?`<span class="status">${esc(x.postedAt)} 올림</span>`:''}`:''}</div></div>''')
rep("await run(btn,()=>makeToon(x.title)); if(cuts().length){ x.made=true; save(); }","await run(btn,()=>makeToon(x.title)); if(cuts().length){ x.made=true; x.status='script'; x.postedAt=''; S.planRef={ym:mo().ym,k,title:x.title}; save(); renderTodo(); }")

# ---------- events ----------
rep("  if(b.dataset.pv){ pv+=+b.dataset.pv; return renderPhone(); }","""  if(b.dataset.pv){ pv+=+b.dataset.pv; return renderPhone(); }
  if(b.dataset.todo) return goTodo();
  if(b.dataset.pst){ const [k,s2]=b.dataset.pst.split('|'), x=mo().items[+k]; if(x){ x.status=s2; x.made=s2!=='plan'; if(s2==='posted'&&!x.postedAt) x.postedAt=todayStr(); if(s2!=='posted') x.postedAt=''; save(); vMonth(); renderTodo(); } return; }""")
rep("if(k.startsWith('cut-')){","if(k.startsWith('alt-')){ const i=+k.slice(4); return copy(altOf(cuts()[i],i)); } if(k.startsWith('cut-')){")
rep("fixstyle:FIX_STYLE}[k]","fixstyle:FIX_STYLE,fixlabel:FIX_LABEL,fixdraw:FIX_DRAW()}[k]")
rep("  if(a==='backup') return makeBackup();","""  if(a==='trouble') return toggleTrouble();
  if(a==='kitCopy'){ const t=postText(); if(!t.trim()){ toast('캡션이 비어 있어요'); return; } return copy(t); }
  if(a==='posted'){ const T=S.toon; T.postedAt=todayStr(); T.kit={...(T.kit||{}),order:true,cap:true}; const x=planItem(); if(x){ x.status='posted'; x.made=true; x.postedAt=T.postedAt; } save(); vPost(); toast(x?'연재표에도 올림으로 표시했어요':'이번 편을 완료로 표시했어요'); return; }
  if(a==='unposted'){ const T=S.toon; T.postedAt=''; const x=planItem(); if(x){ x.status='art'; x.postedAt=''; } save(); vPost(); return; }
  if(a==='backup') return makeBackup();""")
rep("  if(a==='zip') return run(b,makeZip);","  if(a==='zip') return run(b,async()=>{ await makeZip(); if(S.toon){ S.toon.zipped=true; save(); renderTodo(); } });")
rep("  if(a==='next'){ S.info.story=''; S.toon=null; S.check=null; pv=0; save();","  if(a==='next'){ S.info.story=''; S.toon=null; S.check=null; S.planRef=null; pv=0; save();")
rep("  if(el.dataset.month){ mo()[el.dataset.month]=el.value; return save(); }","""  if(el.dataset.month){ mo()[el.dataset.month]=el.value; return save(); }
  if(el.dataset.prof){ prof()[el.dataset.prof]=el.value; save(); return kitCounters(); }
  if(el.dataset.pwho){ const x=mo().items[+el.dataset.pwho]; if(x){ x.who=el.value; save(); } return; }
  if(el.dataset.plink){ const x=mo().items[+el.dataset.plink]; if(x){ x.link=el.value.trim(); save(); } return; }
  if(el.dataset.kitck){ const T=S.toon; T.kit={...(T.kit||{}),[el.dataset.kitck]:el.checked}; save(); return kitCounters(); }
  if(el.dataset.kitv){ const T=S.toon, k=el.dataset.kitv; if(k.startsWith('alt-')){ T.alts=T.alts||[]; T.alts[+k.slice(4)]=el.value; } else if(k==='link'){ T.link=el.value.trim(); const x=planItem(); if(x) x.link=T.link; } else T[k]=el.value;
    save(); kitCounters(); if(k==='caption'){ clearTimeout(window._kc); window._kc=setTimeout(renderPhone,300); } return; }""")
# todo refresh on phone render
rep("  $('#sideTip').textContent=n?'화살표로 넘기면서 손님처럼 읽어 보세요':'';","  $('#sideTip').textContent=n?'화살표로 넘기면서 손님처럼 읽어 보세요':'';\n  renderTodo();")
open(p,'w').write(s); print('ok')
