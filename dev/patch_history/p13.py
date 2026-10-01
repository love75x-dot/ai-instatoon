import sys
p='/home/claude/toon-planner/index.html'; s=open(p).read()
def rep(a,b,cnt=1):
    global s
    if s.count(a)!=cnt: print('MISSING/COUNT',s.count(a),':',a[:140]); sys.exit(1)
    s=s.replace(a,b)

rep('.modes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}','.modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px}')
rep('.hero-act{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}\n', r'''.hero-act{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.reuse{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:10px}
.rcard{border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:8px}
.rcard canvas,.rcard video{width:100%;max-width:240px;aspect-ratio:9/16;height:auto;border-radius:12px;background:#111;display:block;margin:0 auto}
.rcard b{font-size:15px}.rcard p{margin:0;font-size:13.5px;color:var(--muted);line-height:1.5}
@media (max-width:640px){.reuse{grid-template-columns:1fr}}
.srows{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.srow{display:grid;grid-template-columns:52px minmax(0,1fr);gap:12px;border:1px solid var(--line);border-radius:12px;padding:10px 12px;align-items:start}
.srow img,.srow .noth{width:52px;aspect-ratio:3/4;object-fit:cover;border-radius:6px;background:var(--sunken);display:block}
.srow .st{font-weight:800;font-size:14.5px}.srow .sm2{font-size:12.5px;color:var(--muted);margin:2px 0 8px}
.snum{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.snum label{font-size:11.5px;font-weight:700;color:var(--muted);display:flex;flex-direction:column;gap:3px}
.snum input{width:100%;border:1px solid var(--line-2);border-radius:8px;padding:6px 8px;font:inherit;font-size:14px;background:var(--surface)}
@media (max-width:640px){.snum{grid-template-columns:repeat(3,minmax(0,1fr))}}
.bars{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.bar{display:grid;grid-template-columns:minmax(0,9em) minmax(0,1fr) 3.5em;gap:8px;align-items:center;font-size:13px}
.bar span:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar i{display:block;height:12px;border-radius:0 4px 4px 0;background:var(--ink);min-width:2px}.bar i.top{background:#E0A800}.bar em{font-style:normal;font-weight:800;text-align:right}
.ins{background:var(--sunken);border-radius:12px;padding:14px;margin-top:14px;font-size:14px}.ins h3{margin:0 0 6px;font-size:15px}.ins ul{margin:6px 0 0;padding-left:18px}.ins li{margin:3px 0}
.reply{border:1px solid var(--line);border-radius:14px;padding:16px;margin-top:10px}
.rout{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.rline{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:14px}.rline small{display:block;color:var(--muted);font-size:12px;font-weight:700}
''')

# modes
rep("[['one','한 편 만들기','가게 이야기로 인스타툰 한 편'],['month','한 달 기획','한 달치 연재 주제를 한 번에']]","[['one','한 편 만들기','가게 이야기로 인스타툰 한 편'],['month','한 달 기획','한 달치 연재 주제를 한 번에'],['stats','반응·댓글','올린 편 반응 기록 · 답글 도우미']]")
rep("$('#steps').hidden=m==='month'; }","$('#steps').hidden=m!=='one'; }")
rep("function render(){ renderDemo(); renderModes(); if((S.mode||'one')==='month'){ vMonth(); renderPhone(); return; }","function render(){ renderDemo(); renderModes(); if((S.mode||'one')==='month'){ vMonth(); renderPhone(); return; } if(S.mode==='stats'){ vStats(); renderPhone(); return; }")

# month prompt uses stats
rep("[사장님 소재 메모]\n${M.memo||'(없음)'}\n","[사장님 소재 메모]\n${M.memo||'(없음)'}\n${statsBlock()}")

# post: reuse section
rep("    ${kitHTML()}","    ${kitHTML()}\n    ${reuseHTML()}")
rep("  drawAll(); kitCounters(); drawFeedCur(); renderSpell();\n}","  drawAll(); kitCounters(); drawFeedCur(); renderSpell(); previewReuse();\n}")
rep("return {t:'이번 편 완료! \"같은 가게로 다음 편 만들기\"로 이어 가요',go:'[data-act=\"next\"]',stage:4,done:1};",
    "return {t:'이번 편 완료! 아래 ④에서 스토리·릴스로 한 번 더 알리고, 2~3일 뒤 \"반응·댓글\" 탭에 반응을 적어 주세요',go:'#reuse',stage:4,done:1};")
# history meta
rep("S.history=[{hid:T.hid,title:T.title,date:T.postedAt,thumb:th,link:T.link||''}","S.history=[{hid:T.hid,title:T.title,date:T.postedAt,thumb:th,link:T.link||'',art:S.info.art,tone:T.tone||'',cuts:cuts().length,type:x?.type||'',goal:x?.goal||'',hook:lines(cuts()[0]?.title).join(' '),stats:(hist().find(h=>h.hid===T.hid)||{}).stats||null}")

rep("/* ================= 연재 진행판 ================= */", r'''/* ================= 스토리·릴스 ================= */
function ru(){ S.reuse={storyHead:'새 에피소드 올라왔어요',sec:3,...(S.reuse||{})}; return S.reuse; }
let reelBlob=null, reelExt='mp4', reelUrl='';
function reuseHTML(){ const r=ru();
  return `<h2 class="sec" id="reuse">④ 스토리·릴스로 한 번 더 알리기</h2>
  <p class="sub">같은 웹툰으로 두 번 더 알릴 수 있어요. 둘 다 세로 9:16(1080×1920)으로 만들어요. 릴스는 팔로워가 아닌 사람에게도 잘 퍼져요.</p>
  <div class="reuse">
    <div class="rcard"><canvas id="storyCv" width="1080" height="1920" aria-label="스토리 홍보 이미지 미리보기"></canvas><b>스토리 홍보 이미지</b>
      <p>게시물을 올린 날 스토리에 올리세요. 스토리 편집 화면에서 <b>"링크" 스티커</b>로 게시물이나 예약 링크를 붙이면 바로 넘어와요.</p>
      <label class="f" for="rs-head" style="margin:0">위 문구</label><input class="in" id="rs-head" data-reuse="storyHead" value="${esc(r.storyHead)}" placeholder="새 에피소드 올라왔어요">
      <button class="btn" data-act="storyDl">스토리 이미지 저장</button></div>
    <div class="rcard"><canvas id="reelCv" width="1080" height="1920" aria-label="릴스 영상 미리보기"></canvas><video id="reelVid" controls playsinline hidden></video><b>릴스 영상</b>
      <p>컷이 한 장씩 넘어가는 짧은 영상이에요${endOn()?' (마지막 장 안내 카드 포함)':''}. 소리는 없으니 인스타에서 올릴 때 <b>음악</b>을 붙여 주세요.</p>
      <div class="chips">${[2,3,4].map(n=>`<button class="chip" data-rsec="${n}" aria-pressed="${r.sec===n}">한 장에 ${n}초</button>`).join('')}</div>
      <div class="row"><button class="btn pri" data-act="reelMake">릴스 영상 만들기</button><button class="btn" data-act="reelDl" ${reelBlob?'':'hidden'}>영상 저장</button></div>
      <span class="status" id="st-reel">약 ${cuts().length+(endOn()?1:0)*1}장 × ${r.sec}초 = ${(cuts().length+(endOn()?1:0))*r.sec}초. 만드는 동안 이 화면을 켜 두세요.</span></div>
  </div>`; }
function blurBg(cv){ const b=document.createElement('canvas'); b.width=270; b.height=480; const x=b.getContext('2d'); const s2=Math.max(270/cv.width,480/cv.height)*1.15; x.fillStyle='#222'; x.fillRect(0,0,270,480); x.filter='blur(10px)'; x.drawImage(cv,(270-cv.width*s2)/2,(480-cv.height*s2)/2,cv.width*s2,cv.height*s2); x.filter='none'; x.fillStyle='rgba(0,0,0,.5)'; x.fillRect(0,0,270,480); return b; }
async function reelSlides(){ const out=[]; for(const c of cuts()){ const cv=document.createElement('canvas'); await compose(cv,c); out.push(cv); } if(endOn()){ const cv=document.createElement('canvas'); await drawEnd(cv); out.push(cv); } return out.map(cv=>({cv,bg:blurBg(cv)})); }
function drawReelFrame(ctx,sl,t,D){ const W=1080,H=1920,N=sl.length; if(!N) return; const i=Math.min(N-1,Math.floor(t/D)), lt=t-i*D, p=Math.min(1,lt/380), e=1-Math.pow(1-p,3);
  const cur=sl[i].cv, ch=Math.round(W*cur.height/cur.width), y=Math.round((H-ch)/2), z=1+0.04*Math.min(1,lt/D);
  ctx.drawImage(sl[i].bg,0,0,W,H);
  if(i>0&&p<1){ const pc=sl[i-1].cv, ph=Math.round(W*pc.height/pc.width); ctx.drawImage(pc,-W*e,Math.round((H-ph)/2),W,ph); }
  ctx.save(); ctx.translate(i>0?W*(1-e):0,0); ctx.beginPath(); ctx.rect(0,y,W,ch); ctx.clip(); const zw=W*z, zh=ch*z; ctx.drawImage(cur,(W-zw)/2,y+(ch-zh)/2,zw,zh); ctx.restore();
  const bw=(W-80-(N-1)*8)/N; for(let k=0;k<N;k++){ ctx.fillStyle='rgba(255,255,255,.3)'; ctx.fillRect(40+k*(bw+8),70,bw,6); ctx.fillStyle='#fff'; ctx.fillRect(40+k*(bw+8),70,bw*(k<i?1:k>i?0:Math.min(1,lt/D)),6); }
  ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle='#fff'; ctx.font=fspec('title',60);
  const tl=wrapText(ctx,String(S.toon?.title||''),W-140).slice(0,2); tl.forEach((l,k)=>ctx.fillText(l,W/2,y-56-(tl.length-1-k)*74));
  ctx.font='700 36px "Gothic A1"'; ctx.fillStyle='rgba(255,255,255,.88)'; ctx.fillText(i<N-1?`${i+1} / ${N}`:`${S.info.name||'우리 가게'} · 전체 이야기는 게시물에서`,W/2,y+ch+86); }
async function drawStory(cv){ const W=1080,H=1920, ctx=cv.getContext('2d'); cv.width=W; cv.height=H; if(!cuts().length) return;
  const c0=document.createElement('canvas'); await compose(c0,cuts()[0]); ctx.drawImage(blurBg(c0),0,0,W,H);
  const cw=880, ch=Math.round(cw*c0.height/c0.width), x=(W-cw)/2, y=Math.round((H-ch)/2)+60;
  ctx.save(); ctx.shadowColor='rgba(0,0,0,.45)'; ctx.shadowBlur=50; ctx.shadowOffsetY=16; rrect(ctx,x,y,cw,ch,34); ctx.fillStyle='#fff'; ctx.fill(); ctx.restore();
  ctx.save(); rrect(ctx,x,y,cw,ch,34); ctx.clip(); ctx.drawImage(c0,x,y,cw,ch); ctx.restore();
  const head=ru().storyHead.trim()||'새 에피소드 올라왔어요'; await loadFonts({title:head+'NEW',sub:'',bubble:'',sfx:''});
  ctx.textAlign='center'; ctx.font='900 34px "Gothic A1"'; const pw=ctx.measureText('NEW EPISODE').width+56; ctx.fillStyle='#FFD53D'; rrect(ctx,(W-pw)/2,y-250,pw,60,30); ctx.fill(); ctx.fillStyle='#121214'; ctx.textBaseline='middle'; ctx.fillText('NEW EPISODE',W/2,y-220); ctx.textBaseline='alphabetic';
  ctx.fillStyle='#fff'; let fs=76; ctx.font=fspec('title',fs); while(fs>44&&ctx.measureText(head).width>W-120){ fs-=4; ctx.font=fspec('title',fs); } ctx.fillText(head,W/2,y-100);
  ctx.font='700 38px "Gothic A1"'; ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fillText(wrapText(ctx,String(S.toon?.title||''),W-160)[0]||'',W/2,y-40);
  ctx.font='800 36px "Gothic A1"'; ctx.fillStyle='rgba(255,255,255,.92)'; ctx.fillText(`${S.info.name||'우리 가게'} 인스타툰 · 게시물에서 끝까지 보기`,W/2,Math.min(H-120,y+ch+110)); }
async function previewReuse(){ const sc=$('#storyCv'); if(sc) drawStory(sc); const rc=$('#reelCv'); if(rc&&!reelBusy){ const sl=await reelSlides(); const ctx=rc.getContext('2d'); ctx.clearRect(0,0,1080,1920); drawReelFrame(ctx,sl,Math.min(ru().sec*1000*0.6,1500),ru().sec*1000); }
  const v=$('#reelVid'); if(v&&reelUrl){ v.src=reelUrl; v.hidden=false; if(rc) rc.hidden=true; } }
let reelBusy=false;
async function makeReel(){ const st=$('#st-reel');
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){ st.className='status err'; st.textContent='이 브라우저는 영상 만들기를 지원하지 않아요. 크롬 최신 버전에서 열어 주세요.'; return; }
  const mime=['video/mp4;codecs=avc1.42E01E','video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>{ try{ return MediaRecorder.isTypeSupported(m); }catch(_){ return false; } });
  if(!mime){ st.className='status err'; st.textContent='이 브라우저는 영상 저장 형식을 지원하지 않아요.'; return; }
  reelBusy=true; st.className='status'; st.innerHTML='<span class="spin"></span> 컷을 준비하는 중';
  try{ const sl=await reelSlides(); const D=ru().sec*1000, total=D*sl.length+400;
    let rc=$('#reelCv'), v=$('#reelVid'); if(v){ v.hidden=true; v.removeAttribute('src'); } rc.hidden=false; const ctx=rc.getContext('2d');
    drawReelFrame(ctx,sl,0,D); const stream=rc.captureStream(30), rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000}), chunks=[];
    rec.ondataavailable=e=>{ if(e.data&&e.data.size) chunks.push(e.data); }; const done=new Promise(r=>rec.onstop=r);
    rec.start(250); const t0=performance.now();
    await new Promise(res=>{ const tick=()=>{ const t=performance.now()-t0; drawReelFrame(ctx,sl,Math.min(t,total-1),D); const s2=$('#st-reel'); if(s2) s2.innerHTML=`<span class="spin"></span> 녹화 중 ${Math.min(100,Math.round(t/total*100))}% · 이 화면을 켜 두세요`; if(t<total) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
    rec.stop(); await done; stream.getTracks().forEach(t=>t.stop());
    reelExt=mime.includes('mp4')?'mp4':'webm'; reelBlob=new Blob(chunks,{type:mime.split(';')[0]}); if(reelUrl) URL.revokeObjectURL(reelUrl); reelUrl=URL.createObjectURL(reelBlob);
    v=$('#reelVid'); if(v){ v.src=reelUrl; v.hidden=false; } rc.hidden=true; const dl=document.querySelector('[data-act="reelDl"]'); if(dl) dl.hidden=false;
    const s3=$('#st-reel'); s3.className='status'; s3.textContent=`완성! ${Math.round(total/1000)}초 영상 · ${(reelBlob.size/1048576).toFixed(1)}MB${reelExt==='webm'?' · 이 브라우저는 webm으로만 만들 수 있어요. 인스타 앱에 안 올라가면 크롬 최신 버전이나 사파리에서 다시 만들어 주세요.':''}`;
  }catch(e){ const s3=$('#st-reel'); if(s3){ s3.className='status err'; s3.textContent='영상을 만들지 못했어요. 페이지를 새로고침하고 다시 해 주세요.'; } }
  finally{ reelBusy=false; } }

/* ================= 반응 기록 ================= */
const SKEYS=[['reach','도달'],['like','좋아요'],['cmt','댓글'],['save','저장'],['share','공유']];
const hasStats=h=>!!h.stats&&SKEYS.some(([k])=>Number(h.stats[k])>0);
const sv=(h,k)=>Number(h.stats?.[k])||0;
const keep=h=>sv(h,'save')+sv(h,'share');
function statsBlock(){ const H=hist().filter(hasStats); if(!H.length) return '';
  const rows=H.slice(0,10).map(h=>`- ${h.title} / 유형: ${h.type||'-'} / 테마: ${ARTS[h.art]?.name||'-'} / 도달 ${sv(h,'reach')} · 좋아요 ${sv(h,'like')} · 댓글 ${sv(h,'cmt')} · 저장 ${sv(h,'save')} · 공유 ${sv(h,'share')}`).join('\n');
  return `\n[지난 편 반응 - 저장·공유가 많을수록 손님에게 도움이 된 편]\n${rows}\n→ 반응이 좋았던 편과 비슷한 유형·소재를 더 넣고, 약했던 방식은 줄여.\n`; }
function insHTML(){ const H=hist(), R=H.filter(hasStats); if(!R.length) return `<div class="ins"><h3>아직 적은 반응이 없어요</h3><p style="margin:0">두 편 이상 적으면 어떤 편이 잘 됐는지 비교해 드려요.</p></div>`;
  const mx=Math.max(1,...R.map(keep)), best=[...R].sort((a,b)=>keep(b)-keep(a)||sv(b,'like')-sv(a,'like'))[0];
  const grp=(f,name)=>{ const m={}; R.forEach(h=>{ const k=f(h); if(!k) return; (m[k]=m[k]||[]).push(keep(h)); }); const e=Object.entries(m); if(e.length<2) return ''; const avg=e.map(([k,v])=>[k,v.reduce((a,b)=>a+b,0)/v.length,v.length]).sort((a,b)=>b[1]-a[1]); return `<li>${name}별로는 <b>${esc(avg[0][0])}</b>이(가) 평균 저장+공유 ${avg[0][1].toFixed(1)}로 가장 좋아요 (${avg[0][2]}편 기준).</li>`; };
  const rate=R.filter(h=>sv(h,'reach')>0).map(h=>[h,keep(h)/sv(h,'reach')*100]).sort((a,b)=>b[1]-a[1]);
  return `<div class="ins"><h3>무엇이 잘 먹혔을까</h3><ul>
    <li>저장+공유가 가장 많은 편은 <b>${esc(best.title)}</b>(저장 ${sv(best,'save')} · 공유 ${sv(best,'share')})예요. 저장과 공유는 "다시 보고 싶다, 알려 주고 싶다"는 뜻이라 인스타가 더 멀리 보여 주는 신호예요.</li>
    ${best.hook?`<li>그 편의 첫 장 제목: "${esc(best.hook)}" — 다음 편 제목을 지을 때 참고하세요.</li>`:''}
    ${grp(h=>h.type,'이야기 유형')}${grp(h=>ARTS[h.art]?.name,'테마')}${grp(h=>h.goal,'목적')}
    ${rate.length?`<li>도달 대비 저장+공유 비율이 가장 높은 편: <b>${esc(rate[0][0].title)}</b> (${rate[0][1].toFixed(1)}%)</li>`:''}
  </ul>
  <div class="bars" aria-label="편별 저장+공유">${R.map(h=>`<div class="bar"><span title="${esc(h.title)}">${esc(h.title)}</span><i class="${h===best?'top':''}" style="width:${Math.round(keep(h)/mx*100)}%"></i><em>${keep(h)}</em></div>`).join('')}</div>
  <p class="sub" style="margin:8px 0 0">막대는 편별 저장+공유 수예요. 한 달 기획을 새로 만들면 이 기록이 AI에게 함께 전달돼요.</p>
  ${S.statsAI?`<div style="margin-top:12px"><b>AI 분석</b><ul>${(S.statsAI.insights||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${(S.statsAI.next||[]).length?`<b>다음 달에 해 볼 것</b><ul>${S.statsAI.next.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</div>`:''}</div>`; }
async function statsAI(){ const H=hist().filter(hasStats); const st=$('#st-sai'); if(H.length<2){ toast('두 편 이상 반응을 적으면 분석할 수 있어요'); return; }
  const prompt=`너는 동네 가게 인스타툰 운영 코치야. 아래 반응 기록을 보고 무엇이 잘 먹혔는지 사장님이 바로 이해할 말로 분석해.
${infoBlock0()}
[올린 편 반응]
${H.map(h=>`- ${h.title} / 첫 장 제목: ${h.hook||'-'} / 유형: ${h.type||'-'} / 목적: ${h.goal||'-'} / 테마: ${ARTS[h.art]?.name||'-'} / 컷 ${h.cuts||'-'} / 도달 ${sv(h,'reach')} 좋아요 ${sv(h,'like')} 댓글 ${sv(h,'cmt')} 저장 ${sv(h,'save')} 공유 ${sv(h,'share')}`).join('\n')}
규칙: 숫자에 근거해서만 말하고 편 수가 적으면 "아직 편 수가 적어 참고용"이라고 밝혀. 저장·공유를 가장 중요하게, 그다음 댓글, 좋아요 순으로 봐. 어려운 마케팅 용어 금지. insights 3개(각 60자 이내), next 3개(다음 달에 해 볼 구체적인 것, 각 50자 이내).
JSON 하나로만 답해: {"insights":["","",""],"next":["","",""]}`;
  try{ const r=await ask(prompt,st,'반응 분석 중',null,'quick'); S.statsAI={insights:(r.insights||[]).map(String).slice(0,4),next:(r.next||[]).map(String).slice(0,4)}; save(); $('#statsIns').innerHTML=insHTML(); }catch(_){} }

/* ================= 댓글 답글 도우미 ================= */
let replyOut=null;
async function makeReply(){ const txt=($('#r-in')?.value||'').trim(), st=$('#st-reply'); if(!txt){ toast('손님 댓글을 먼저 붙여 넣어 주세요'); return; }
  const h=hist().find(x=>String(x.hid)===($('#r-ep')?.value||''));
  const prompt=`너는 동네 가게 인스타 계정의 댓글 담당이야. 손님 댓글에 달 답글 3개를 써 줘.
${infoBlock()}
[이 댓글이 달린 편] ${h?h.title+(h.hook?` (첫 장: ${h.hook})`:''):'모름'}
[손님 댓글]
${txt}
규칙:
- 먼저 댓글 종류를 판단: 칭찬, 질문, 불만, 장난, 광고·스팸 중 하나.
- 답글 3개는 방식을 다르게: "짧고 다정하게", "정보 담아서", "재치 있게". 불만이면 세 번째 대신 "정중한 사과 + DM 안내".
- 가게 프로필 말투를 따르고, 답글 하나 80자 이내, 이모지 0~2개. 사장님(가게) 입장에서.
- 가게 정보에 없는 사실(가격, 주차, 영업시간, 재고 등)은 지어내지 말고 "DM 주시면 바로 알려 드릴게요"처럼 확인을 약속해.
- @아이디는 쓰지 마(앱에서 답글 달기를 누르면 자동으로 붙어요).
- 광고·스팸이면 replies는 빈 배열, note에 답글 대신 숨기기·신고를 권해.
- note: 이 댓글을 다룰 때 한 줄 조언(예: 불만이면 공개 답글은 짧게, 자세한 건 DM으로).
JSON 하나로만 답해: {"kind":"","note":"","replies":[{"style":"","text":""}]}`;
  try{ const r=await ask(prompt,st,'답글 쓰는 중',null,'quick'); replyOut={kind:String(r.kind||''),note:String(r.note||''),replies:(r.replies||[]).map(x=>({style:String(x.style||''),text:String(x.text||'')})).filter(x=>x.text).slice(0,3)}; renderReply(); }catch(_){} }
function renderReply(){ const el=$('#replyOut'); if(!el||!replyOut) return; const R=replyOut;
  el.innerHTML=`${R.kind?`<div class="row" style="gap:6px"><span class="tag">${esc(R.kind)}</span>${R.note?`<span class="status">${esc(R.note)}</span>`:''}</div>`:''}<div class="rout">${R.replies.map((x,k)=>`<div class="rline"><div><small>${esc(x.style)}</small>${esc(x.text)}</div><button class="btn sm" data-rcopy="${k}">복사</button></div>`).join('')||'<p class="sub">답글을 다는 것보다 숨기거나 신고하는 게 좋아요.</p>'}</div>`; }

function vStats(){ const H=hist();
  $('#main').innerHTML=`<section class="panel">
    <div class="ph"><div><h1>반응 기록 · 댓글 도우미</h1><p>올린 편의 반응을 적어 두면 무엇이 잘 먹혔는지 보이고, 다음 달 기획에 자동으로 반영돼요.</p></div></div>
    <div class="callout">숫자는 인스타 앱에서 게시물 아래 <b>"인사이트 보기"</b>를 누르면 나와요 (프로페셔널 계정이어야 보여요). 올리고 <b>2~3일 뒤</b>에 적는 게 정확해요. 모르는 칸은 비워 두세요.</div>
    ${H.length?`<div class="srows">${H.map(h=>`<div class="srow">${h.thumb?`<img src="${h.thumb}" alt="">`:'<span class="noth"></span>'}<div><div class="st">${esc(h.title)}</div><div class="sm2">${esc([h.date&&h.date+' 올림',h.type,ARTS[h.art]?.name].filter(Boolean).join(' · '))}${h.link&&/^https?:\/\//.test(h.link)?` · <a href="${esc(h.link)}" target="_blank" rel="noopener">게시물 열기</a>`:''}</div>
      <div class="snum">${SKEYS.map(([k,n])=>`<label>${n}<input type="number" min="0" inputmode="numeric" data-stat="${h.hid}|${k}" value="${h.stats?.[k]??''}"></label>`).join('')}</div></div></div>`).join('')}</div>`
      :`<div class="empty" style="margin-top:12px">아직 올린 편이 없어요.<br>"한 편 만들기"에서 인스타에 올리고 <b>"인스타에 올렸어요"</b>를 누르면 여기에 쌓여요.<br><br><button class="btn" data-mode2="one">한 편 만들기로</button></div>`}
    <div id="statsIns">${H.length?insHTML():''}</div>
    ${H.length?`<div class="row" style="margin-top:10px"><button class="btn" data-act="statsAI">AI로 분석 받기</button><span class="status" id="st-sai">두 편 이상 적으면 AI가 다음 달 전략까지 정리해 줘요</span></div>`:''}

    <h2 class="sec">댓글 답글 도우미</h2>
    <p class="sub">손님 댓글을 붙여 넣으면 가게 말투로 답글 3개를 제안해요. 가벼운 AI 호출 한 번이에요.</p>
    <div class="reply" id="reply">
      <label class="f" for="r-in" style="margin-top:0">손님 댓글</label><textarea class="in" id="r-in" rows="3" placeholder="예: 여기 주차 되나요?? 빵 너무 맛있어 보여요 ㅠㅠ"></textarea>
      <label class="f" for="r-ep">어느 편에 달린 댓글인가요? <small>선택</small></label>
      <select class="in" id="r-ep"><option value="">잘 모르겠어요</option>${H.map(h=>`<option value="${h.hid}">${esc(h.title)}</option>`).join('')}</select>
      <div class="row" style="margin-top:12px"><button class="btn pri" data-act="reply">답글 3개 받기</button><span class="status" id="st-reply"></span></div>
      <div id="replyOut"></div>
      <p class="sub" style="margin:12px 0 0">질문 댓글엔 하루 안에 답하는 게 좋아요. 광고·욕설 댓글은 답글 대신 길게 눌러 숨기거나 신고하세요.</p>
    </div>
  </section>`; renderReply(); }

/* ================= 연재 진행판 ================= */''')

# todo stats mode
rep("  const cs=cuts(), n=cs.length, T=S.toon;\n  if(S.step==='input'||!n){","""  if(S.mode==='stats'){ const H=hist(); if(!H.length) return {t:'아직 올린 편이 없어요. "한 편 만들기"에서 올리고 "인스타에 올렸어요"를 누르면 여기에 쌓여요'};
    const due=H.filter(h=>!hasStats(h)&&Date.now()-Number(h.hid)>=2*86400000);
    if(due.length) return {t:`올린 지 2일이 지난 편 ${due.length}개의 반응을 적어 주세요`,go:`[data-stat^="${due[0].hid}|"]`};
    if(H.some(h=>!hasStats(h))) return {t:'반응은 올리고 2~3일 뒤에 적어 주세요. 그 사이 댓글에 답글을 달아 보세요',go:'#reply'};
    return {t:'기록 완료! "AI로 분석 받기"로 다음 달 전략을 받아 보세요',go:'[data-act="statsAI"]'}; }
  const cs=cuts(), n=cs.length, T=S.toon;
  if(S.step==='input'||!n){""")

# events
rep("  if(b.dataset.spfix) return applySpell(+b.dataset.spfix);","""  if(b.dataset.spfix) return applySpell(+b.dataset.spfix);
  if(b.dataset.rsec){ ru().sec=+b.dataset.rsec; save(); document.querySelectorAll('[data-rsec]').forEach(c=>c.setAttribute('aria-pressed',c.dataset.rsec===b.dataset.rsec)); const s2=$('#st-reel'); const nn=cuts().length+(endOn()?1:0); if(s2&&!reelBusy){ s2.className='status'; s2.textContent=`약 ${nn}장 × ${ru().sec}초 = ${nn*ru().sec}초. 만드는 동안 이 화면을 켜 두세요.`; } return; }
  if(b.dataset.rcopy) return copy(replyOut?.replies?.[+b.dataset.rcopy]?.text||'');""")
rep("  if(a==='tour') return startTour();","""  if(a==='tour') return startTour();
  if(a==='storyDl'){ const cv=document.createElement('canvas'); await drawStory(cv); return saveFile(`${(S.info.name||'instatoon').replace(/\\s+/g,'_')}_스토리.png`, await cvBlob(cv)); }
  if(a==='reelMake'){ if(reelBusy) return; b.disabled=true; try{ await makeReel(); } finally{ b.disabled=false; } return; }
  if(a==='reelDl'){ if(!reelBlob) return; return saveFile(`${(S.info.name||'instatoon').replace(/\\s+/g,'_')}_릴스.${reelExt}`, reelBlob); }
  if(a==='statsAI') return run(b,statsAI);
  if(a==='reply') return run(b,makeReply);""")
rep("  if(el.dataset.preck){","""  if(el.dataset.stat){ const [hid,k]=el.dataset.stat.split('|'), h=hist().find(x=>String(x.hid)===hid); if(h){ h.stats={...(h.stats||{}),[k]:el.value===''?'':Math.max(0,Number(el.value)||0)}; save(); clearTimeout(window._st); window._st=setTimeout(()=>{ const i2=$('#statsIns'); if(i2) i2.innerHTML=insHTML(); renderTodo(); },250); } return; }
  if(el.dataset.reuse){ ru()[el.dataset.reuse]=el.value; save(); clearTimeout(window._ru); window._ru=setTimeout(()=>{ const c=$('#storyCv'); if(c) drawStory(c); },250); return; }
  if(el.dataset.preck){""")
# help card
rep('      <div class="hcard"><span class="hn">저장과 백업</span>','''      <div class="hcard"><span class="hn">스토리·릴스·반응</span><p>3단계 맨 아래 <b>"스토리·릴스로 한 번 더 알리기"</b>에서 스토리 이미지와 컷이 넘어가는 릴스 영상을 만들 수 있어요. 올리고 2~3일 뒤 위쪽 <b>"반응·댓글"</b> 탭에 도달·좋아요·댓글·저장·공유를 적으면 잘 된 편을 비교해 주고, 다음 달 기획에도 반영돼요. 같은 탭에서 손님 댓글 답글도 받아 볼 수 있어요.</p></div>
      <div class="hcard"><span class="hn">저장과 백업</span>''')
open(p,'w').write(s); print('ok')
