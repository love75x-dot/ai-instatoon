// "모던 심플" 디자인 기준 검사 (RENEWAL_PLAN 결정 기록 참고): 모바일 가로 넘침, 입력칸 16px, 그림자 없음, 노랑은 작은 곳에만, 화면 문구에 이모지 없음.
//   node dev/design/check.mjs
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();
const SCREENS = [
  ['시작', () => { S = blank(); S.step = 'input'; S.mode = 'one'; }],
  ['1단계', () => { S = demoState('bakery'); S.step = 'input'; S.mode = 'one'; }],
  ['2단계', () => { S = demoState('bakery'); S.step = 'edit'; S.mode = 'one'; }],
  ['3단계', () => { S = demoState('bakery'); S.step = 'post'; S.mode = 'one'; }],
  ['한 달 기획', () => { S = demoState('bakery'); S.mode = 'month'; }],
];
const probe = () => {
  const YEL = 'rgb(255, 213, 61)', okYellow = '.todo, .sumtodo, .endpv, .arts, .endsw, .mark, .endwrap, .swatches, .frame, .phone, .ftile';
  const out = { overflow: document.documentElement.scrollWidth - window.innerWidth, smallInputs: [], shadows: [], yellow: [], emoji: [] };
  const emo = /\p{Extended_Pictographic}/u;
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el); if (cs.display === 'none') continue;
    const tag = el.tagName.toLowerCase(), cls = el.className && el.className.baseVal === undefined ? '.' + String(el.className).trim().split(/\s+/).join('.') : '';
    if ((el.matches('input.in,textarea.in,.dd-btn,.snum input')) && parseFloat(cs.fontSize) < 16) out.smallInputs.push(tag + cls);
    if (cs.boxShadow !== 'none' && !el.closest('#tour,.tour-hl,.frame')) out.shadows.push(tag + cls);
    if (cs.backgroundColor === YEL && !el.closest(okYellow)) out.yellow.push(tag + cls);
    if (el.children.length === 0 && !el.closest('textarea,pre,.phone,.frame,.endpv,.kit,#kitWarn,.ig-cap,.capbox,.sb,.story-sb,.story-m') && emo.test(el.textContent || '')) out.emoji.push((el.textContent || '').trim().slice(0, 24));
  }
  return out;
};
for (const [vk, vp] of [['모바일 390', { width: 390, height: 844 }], ['PC 1300', { width: 1300, height: 900 }]]) {
  const { page, errors } = await newPage(browser, srv.base, { viewport: vp, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
  await page.goto(srv.base + '/'); await page.waitForTimeout(400);
  for (const [name, fn] of SCREENS) {
    await page.evaluate(`(${fn.toString()})(); save(); render();`); await page.waitForTimeout(150);
    const r = await page.evaluate(probe);
    C.ok(r.overflow <= 1, `${vk} ${name}: 가로로 넘치지 않음${r.overflow > 1 ? ` (${r.overflow}px)` : ''}`);
    C.ok(!r.smallInputs.length, `${vk} ${name}: 입력칸 글자 16px 이상${r.smallInputs.length ? ' ← ' + r.smallInputs.slice(0, 3) : ''}`);
    C.ok(!r.shadows.length, `${vk} ${name}: 그림자 없음${r.shadows.length ? ' ← ' + r.shadows.slice(0, 3) : ''}`);
    C.ok(!r.yellow.length, `${vk} ${name}: 노랑 면은 작은 곳(지금 할 일 칩 등)에만${r.yellow.length ? ' ← ' + r.yellow.slice(0, 3) : ''}`);
    C.ok(!r.emoji.length, `${vk} ${name}: 화면 문구에 이모지 없음${r.emoji.length ? ' ← ' + r.emoji.slice(0, 3) : ''}`);
  }
  C.ok(!errors.length, `${vk}: 페이지 오류 없음`);
}

// ---- 머리말 통일: 홈과 인스타툰 노트 페이지의 머리말이 같은 자리·같은 모양인지 ----
import fs from 'node:fs';
import path from 'node:path';
import { root } from '../lib/harness.mjs';
const blockOf = (html) => (html.split('\r\n').join('\n').match(/\/\* HEADER:BEGIN[\s\S]*?\/\* HEADER:END \*\//) || [''])[0];
const appCss = blockOf(fs.readFileSync(path.join(root, 'deploy', 'index.html'), 'utf8')), noteCss = blockOf(fs.readFileSync(path.join(root, 'deploy', 'guide', 'index.html'), 'utf8'));
C.ok(appCss.length > 200 && appCss === noteCss, '머리말 CSS 블록이 홈과 노트에서 글자까지 같음');
const HPAGES = [['홈', '/'], ['노트 목록', '/guide/'], ['노트 글', '/guide/how-to-make-instatoon/'], ['소개', '/about/'], ['개인정보', '/privacy/'], ['이용안내', '/terms/'], ['404', '/없는-주소/']];
const headProbe = () => {
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left * 10) / 10, y: Math.round(r.top * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, r: Math.round((window.innerWidth - r.right) * 10) / 10 }; };
  const tb = document.querySelector('.topbar'), brand = tb.querySelector('.brand'), mark = brand.querySelector('.mark'), name = brand.querySelector('b'), menu = tb.querySelector('#menuBtn');
  const btns = [...tb.querySelectorAll('.hnav .hb:not(.hmore)')].map((b) => { const cs = getComputedStyle(b); return { kind: b.classList.contains('pri') ? '주' : '보조', text: b.textContent.trim(), box: box(b), css: [cs.fontSize, cs.fontWeight, cs.paddingLeft, cs.borderRadius, cs.borderTopWidth, cs.backgroundColor, cs.color, cs.borderTopColor].join('|') }; });
  const ncs = getComputedStyle(name);
  return { tb: box(tb), menu: box(menu), mark: box(mark), name: { ...box(name), font: [ncs.fontSize, ncs.fontWeight, ncs.fontFamily].join('|') }, btns, overflow: document.documentElement.scrollWidth - window.innerWidth, logoHref: brand.tagName === 'A' ? brand.getAttribute('href') : '(앱: 첫 화면 이동 버튼)' };
};
for (const [vk, vp] of [['모바일 390', { width: 390, height: 844 }], ['태블릿 768', { width: 768, height: 900 }], ['PC 1300', { width: 1300, height: 900 }]]) {
  const res = {};
  for (const [name, u] of HPAGES) {
    const { page } = await newPage(browser, srv.base, { viewport: vp, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
    await page.goto(srv.base + u); await page.waitForTimeout(300);
    res[name] = await page.evaluate(headProbe); await page.close();
  }
  const base = res['홈'], same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  for (const [name, r] of Object.entries(res)) {
    C.ok(r.overflow <= 1, `${vk} ${name}: 머리말이 가로로 넘치지 않음`);
    C.ok(r.btns.every((b) => b.box.h === 40), `${vk} ${name}: 머리말 버튼 높이 40px, 한 줄(줄바꿈 없음)`);
    if (name === '홈') continue;
    C.ok(same(r.tb, base.tb) , `${vk} ${name}: 머리말 높이·위치가 홈과 같음 (${r.tb.h}px / 홈 ${base.tb.h}px)`);
    C.ok(same(r.mark, base.mark) && same(r.name, base.name) && same(r.menu, base.menu), `${vk} ${name}: ☰ 버튼·로고 위치·크기·글꼴이 홈과 같음`);
    const last = r.btns[r.btns.length - 1], hl = base.btns[base.btns.length - 1];
    C.ok(last.box.r === hl.box.r && last.box.y === hl.box.y, `${vk} ${name}: 맨 오른쪽 버튼의 오른쪽 여백·세로 위치가 홈과 같음 (${last.box.r}px)`);
  }
  // 버튼 모양: 모든 페이지의 주 버튼끼리, 보조 버튼끼리 글자·굵기·여백·둥글기·테두리·색이 같다
  const byKind = {};
  for (const [name, r] of Object.entries(res)) for (const b of r.btns) (byKind[b.kind] ||= []).push([name, b.css]);
  for (const [kind, list] of Object.entries(byKind)) C.ok(list.every(([, c]) => c === list[0][1]), `${vk} ${kind} 버튼 모양이 모든 페이지에서 같음(${list.length}곳)`);
  C.ok(Object.keys(byKind).sort().join() === '보조,주' && byKind['주'][0][1] !== byKind['보조'][0][1], `${vk} 버튼 종류는 주·보조 두 가지`);
  const lst = res['노트 목록'].btns.map((b) => b.kind).join(), art = res['노트 글'].btns.map((b) => b.kind).join();
  C.ok(base.btns.map((b) => b.kind).join() === '보조', `${vk} 홈 머리말: 보조 "인스타툰 노트"만`);
  C.ok(lst === '주', `${vk} 노트 목록 머리말: 주 "인스타툰 만들기"만`);
  for (const n of ['노트 글', '소개', '개인정보', '이용안내', '404']) C.ok(res[n].btns.map((b) => b.kind).join() === '보조,주', `${vk} ${n} 머리말: 보조 "인스타툰 노트" → 주 "인스타툰 만들기"`);
}
// ---- 4b: 머리말 [☰] 로고 …… [저장 상태] [인스타툰 노트], ☰ 메뉴, 모드 탭 없음 ----
const MENU_ITEMS = '인스타툰 만들기,한 달 기획,캐릭터 보관함,인스타툰 노트,백업 저장 · 불러오기,사용 방법,문제 해결';
const homeProbe = () => {
  const vis = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
  const tb = document.querySelector('.topbar'), h = (el) => Math.round(el.getBoundingClientRect().height * 10) / 10;
  const mb = document.querySelector('#menuBtn'), br = tb.querySelector('.brand'), note = tb.querySelector('.hnav > a.hb');
  return {
    menuBtn: vis(mb) && h(mb) === 40 && Math.round(mb.getBoundingClientRect().width) === 40, menuLeftOfLogo: mb.getBoundingClientRect().right <= br.getBoundingClientRect().left + 8,
    sameRow: Math.abs(mb.getBoundingClientRect().top - note.getBoundingClientRect().top) < 1,
    oldHeader: document.querySelectorAll('.htools, #hmoreBtn, #hpop, .apptools').length, modes: document.querySelectorAll('#modes, .modes, [data-mode2]').length,
    noStatus: !tb.querySelector('.hai,#aiDot,#aiText,#aiDotM,#aiTextM,.hpai,.dot') && !/연결됨|키 필요|연결 없음|연결 확인/.test(tb.textContent), keyRow: (document.querySelector('#keyTxt') || {}).textContent || '',
    overflow: document.documentElement.scrollWidth - window.innerWidth, tbH: h(tb), expanded: mb.getAttribute('aria-expanded'), wrapHidden: document.querySelector('#menuWrap').hidden,
  };
};
for (const [vk, w] of [['PC 1300', 1300], ['PC 1024', 1024], ['태블릿 768', 768], ['휴대폰 390', 390], ['휴대폰 320', 320]]) {
  const { page, errors } = await newPage(browser, srv.base, { viewport: { width: w, height: 800 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
  await page.goto(srv.base + '/'); await page.waitForTimeout(300);
  const r = await page.evaluate(homeProbe);
  C.ok(r.menuBtn && r.menuLeftOfLogo && r.sameRow, `${vk} 홈: ☰ 버튼이 로고 왼쪽에 높이 40px로 있고 "인스타툰 노트"와 같은 줄`);
  C.ok(r.oldHeader === 0 && r.modes === 0, `${vk} 홈: 옛 도구 버튼·⋯ 메뉴·모드 탭이 없음 (옛 요소 ${r.oldHeader}개, 모드 탭 ${r.modes}개)`);
  C.ok(r.overflow <= 1 && r.tbH === 72, `${vk} 홈: 가로 넘침 없음, 머리말 높이 72px`);
  C.ok(r.noStatus, `${vk} 홈: 머리말에 AI 연결 상태 표시(● 연결됨 / ● 키 필요) 없음`);
  C.ok(/API 키 설정/.test(r.keyRow) && /연결됨/.test(r.keyRow), `${vk} 홈: 연결 상태는 첫 화면 "API 키 설정" 줄에서만 보임(${r.keyRow.trim()})`);
  C.ok(r.wrapHidden && r.expanded === 'false', `${vk} 홈: 메뉴는 닫혀 있음`);
  // 열기
  await page.click('#menuBtn'); await page.waitForTimeout(350);
  const m = await page.evaluate(() => {
    const p = document.querySelector('#menuPanel'), rc = p.getBoundingClientRect(), items = [...p.querySelectorAll('.mi')], cur = p.querySelector('[aria-current="page"]'), ss = document.querySelector('#shopSlot');
    const cs = cur && getComputedStyle(cur);
    return { open: document.querySelector('#menuWrap').classList.contains('on'), expanded: document.querySelector('#menuBtn').getAttribute('aria-expanded'), items: items.map((e) => e.textContent.trim()).join(','), inView: rc.left >= -1 && rc.right <= window.innerWidth + 1 && rc.top >= 0 && rc.bottom <= window.innerHeight + 1,
      slotFirst: p.firstElementChild === ss, slotHidden: ss.hidden && ss.children.length === 0 && ss.textContent.trim() === '', cur: cur && cur.textContent.trim(), curColor: cs && cs.color, curLine: cs && cs.borderLeftWidth + ' ' + cs.borderLeftStyle, others: items.filter((e) => e !== cur).every((e) => getComputedStyle(e).color !== getComputedStyle(cur).color), focus: document.activeElement && document.activeElement.className, bodyLock: document.body.classList.contains('menu-open'), panelW: Math.round(rc.width), sheetOpen: document.body.classList.contains('sheet-open') };
  });
  C.ok(m.open && m.expanded === 'true' && m.items === MENU_ITEMS && m.inView, `${vk} 홈: ☰를 누르면 왼쪽에서 메뉴가 열리고 항목 7개가 순서대로 (${m.items})`);
  C.ok(m.slotFirst && m.slotHidden, `${vk} 홈: 메뉴 맨 위에 #shopSlot 빈 자리가 있고 지금은 아무것도 그리지 않음`);
  C.ok(m.cur === '인스타툰 만들기' && m.curColor === 'rgb(17, 17, 17)' && m.curLine === '2px solid' && m.others, `${vk} 홈: 지금 보는 항목은 검정 글씨 + 왼쪽 얇은 선, 나머지는 회색 (${m.cur})`);
  C.ok(m.panelW <= 300 && m.bodyLock, `${vk} 홈: 메뉴 폭 ${m.panelW}px, 열려 있는 동안 뒤 화면 스크롤 잠김`);
  // 닫기: Esc · 바깥 · 항목
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  C.ok(await page.evaluate(() => document.querySelector('#menuWrap').hidden && document.querySelector('#menuBtn').getAttribute('aria-expanded') === 'false' && document.activeElement.id === 'menuBtn'), `${vk} 홈: Esc로 메뉴가 닫히고 ☰로 초점이 돌아옴`);
  await page.click('#menuBtn'); await page.waitForTimeout(300); await page.mouse.click(Math.round(w - 6), 500); await page.waitForTimeout(300);
  C.ok(await page.evaluate(() => document.querySelector('#menuWrap').hidden), `${vk} 홈: 바깥(어두운 곳)을 누르면 메뉴가 닫힘`);
  // 한 달 기획 → 현재 표시가 옮겨감 → 인스타툰 만들기로 돌아오기
  await page.click('#menuBtn'); await page.waitForTimeout(300); await page.click('#menuPanel [data-menu="month"]'); await page.waitForTimeout(400);
  C.ok(await page.evaluate(() => S.mode === 'month' && document.querySelector('#menuWrap').hidden && !!document.querySelector('[data-act="monthMake"]') && location.hash === '#month'), `${vk} 홈: 메뉴의 "한 달 기획"으로 한 달 기획 화면이 열림`);
  await page.click('#menuBtn'); await page.waitForTimeout(300);
  C.ok(await page.evaluate(() => document.querySelector('#menuPanel [aria-current="page"]').textContent.trim() === '한 달 기획'), `${vk} 한 달 기획: 메뉴의 현재 표시가 "한 달 기획"으로 바뀜`);
  await page.click('#menuPanel [data-menu="home"]'); await page.waitForTimeout(400);
  C.ok(await page.evaluate(() => S.mode === 'one' && S.step === 'input' && !!document.querySelector('#makeBtn')), `${vk} 한 달 기획: 메뉴의 "인스타툰 만들기"로 홈에 돌아옴`);
  // 백업 · 사용 방법 · 문제 해결
  await page.click('#menuBtn'); await page.waitForTimeout(300); await page.click('#menuPanel [data-act="backupWin"]'); await page.waitForTimeout(300);
  const bk = await page.evaluate(() => { const w = document.querySelector('#bkWin'); return { open: !!w && !w.hidden, text: w && w.innerText.replace(/\s+/g, ' '), menuClosed: document.querySelector('#menuWrap').hidden, btns: w && [...w.querySelectorAll('.row .btn')].map((b) => b.textContent.trim()).join(',') }; });
  C.ok(bk.open && bk.menuClosed && bk.btns === '백업 저장,불러오기' && /작업은 이 브라우저에만 저장돼요\. 다른 기기로 옮기거나 브라우저 기록을 지우기 전에 백업 파일을 받아 두세요\./.test(bk.text) && /다른 기기에서는 백업 불러오기로 그대로 이어서 할 수 있어요\./.test(bk.text), `${vk} 홈: 메뉴의 "백업 저장 · 불러오기"가 백업 창을 열고 안내 문구 두 개가 그대로 들어 있음`);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 4000 }).catch(() => null), page.click('#bkWin [data-bkw="save"]')]);
  C.ok(!!dl, `${vk} 홈: 백업 창의 "백업 저장"이 실제로 백업 파일을 내려받음`);
  await page.evaluate(() => openBackupWin());
  const [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 4000 }).catch(() => null), page.click('#bkWin [data-bkw="load"]')]);
  C.ok(!!fc, `${vk} 홈: 백업 창의 "불러오기"가 파일 선택 창을 엶`);
  await page.evaluate(() => openBackupWin()); await page.keyboard.press('Escape');
  C.ok(await page.evaluate(() => document.querySelector('#bkWin').hidden), `${vk} 홈: Esc로 백업 창이 닫힘`);
  await page.click('#menuBtn'); await page.waitForTimeout(300); await page.click('#menuPanel [data-act="help"]'); await page.waitForTimeout(300);
  C.ok(await page.evaluate(() => !!document.querySelector('#tour')), `${vk} 홈: 메뉴의 "사용 방법"을 누르면 둘러보기가 시작됨`);
  C.ok(await page.evaluate(() => { const a = document.querySelector('#menuPanel a[href="/guide/instatoon-troubleshooting/"]'); const n = document.querySelector('#menuPanel a[href="/guide/"]'); return !!a && !!n && a.textContent.trim() === '문제 해결'; }), `${vk} 홈: "문제 해결"과 "인스타툰 노트"는 글 주소로 연결`);
  C.ok(!errors.length, `${vk} 홈 머리말·메뉴: 페이지 오류 없음${errors[0] ? ' ← ' + errors[0] : ''}`);
  await page.close();
}
{ // 저장 상태(머리말 오른쪽)
  const { page } = await newPage(browser, srv.base, { viewport: { width: 1300, height: 800 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
  await page.goto(srv.base + '/'); await page.waitForTimeout(400);
  C.ok(await page.evaluate(() => document.querySelector('#saveStat').hidden), '새 브라우저(저장된 것 없음): 저장 상태는 아직 안 보임');
  await page.evaluate(() => { S.info.type = '빵집'; save(); }); await page.waitForTimeout(250);
  const s1 = await page.evaluate(() => { const b = document.querySelector('#saveStat'); return { hidden: b.hidden, state: b.dataset.state, text: b.textContent.replace(/\s+/g, ' ').trim(), color: getComputedStyle(b).color, h: b.getBoundingClientRect().height, left: b.getBoundingClientRect().right <= document.querySelector('.hnav > a.hb').getBoundingClientRect().left }; });
  C.ok(!s1.hidden && s1.state === 'saved' && /^저장됨s?✓$/.test(s1.text) && s1.h === 40 && s1.left, `PC 홈: 작업을 시작하면 인스타툰 노트 버튼 왼쪽에 "${s1.text}"가 보임`);
  C.ok(s1.color === 'rgb(107, 107, 107)' || s1.color !== 'rgb(17, 17, 17)', 'PC 홈: 저장 상태는 작은 회색 글씨');
  await page.evaluate(() => { saveFailed = true; updateSaved(); });
  C.ok(await page.evaluate(() => { const b = document.querySelector('#saveStat'); return b.dataset.state === 'fail' && /저장 실패/.test(b.textContent); }), 'PC 홈: 저장에 실패하면 "저장 실패"로 바뀜');
  await page.evaluate(() => { saveFailed = false; updateSaved(); });
  await page.click('#saveStat'); await page.waitForTimeout(250);
  C.ok(await page.evaluate(() => !document.querySelector('#bkWin').hidden), 'PC 홈: 저장 상태를 누르면 백업 저장·불러오기 창이 열림');
  await page.close();
  const m = await newPage(browser, srv.base, { viewport: { width: 390, height: 800 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
  await m.page.goto(srv.base + '/'); await m.page.waitForTimeout(400); await m.page.evaluate(() => { S.info.type = '빵집'; save(); }); await m.page.waitForTimeout(250);
  const t = await m.page.evaluate(() => { const b = document.querySelector('#saveStat'); const vt = [...b.children].filter((c) => getComputedStyle(c).display !== 'none' && c.getBoundingClientRect().width > 0).map((c) => c.textContent.trim()).join(''); return { vt, ov: document.documentElement.scrollWidth - innerWidth }; });
  C.ok(t.vt === '✓' && t.ov <= 1, `휴대폰 홈: 저장 상태는 ✓만 보임 (${t.vt}), 넘침 없음`);
  await m.page.close();
}
{ // 새 기기: 저장된 작업이 없을 때만 "백업 불러오기" 한 줄, 작업을 시작하면 사라짐
  const { page } = await newPage(browser, srv.base, { viewport: { width: 390, height: 800 }, ls: { 'instatoon.helpSeen': '1' } });
  await page.goto(srv.base + '/'); await page.waitForTimeout(500);
  const a = await page.evaluate(() => { const n = document.querySelector('#newDev'); return { shown: !n.hidden && n.getClientRects().length > 0, text: n.textContent.replace(/\s+/g, ' ').trim() }; });
  C.ok(a.shown && /다른 기기에서 쓰던 작업이 있나요\? 백업 불러오기/.test(a.text), `새 기기: 입력칸 아래에 "${a.text}" 한 줄이 보임`);
  const [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 4000 }).catch(() => null), page.click('#newDev [data-act="restore"]')]);
  C.ok(!!fc, '새 기기: 그 줄의 "백업 불러오기"가 파일 선택 창을 엶');
  C.ok(await page.evaluate(() => !document.querySelector('#makeHint').hidden && /업종을 먼저 골라 주세요/.test(document.querySelector('#makeHint').textContent)), '업종이 비었을 때: 폼 안에 "업종을 먼저 골라 주세요" 한 줄 안내');
  await page.evaluate(() => { S.info.type = '카페'; save(); }); await page.waitForTimeout(150);
  C.ok(await page.evaluate(() => document.querySelector('#newDev').hidden && document.querySelector('#makeHint').hidden), '작업을 시작하면(업종 입력) 두 줄 모두 사라짐');
  await page.close();
  const old = await newPage(browser, srv.base, { viewport: { width: 390, height: 800 }, ls: { 'instatoon.helpSeen': '1', 'instatoonRoom.v4': JSON.stringify({ step: 'input', info: { type: '빵집', name: '옛 작업', story: '있었던 일' }, toon: null }) } });
  await old.page.goto(srv.base + '/'); await old.page.waitForTimeout(500);
  C.ok(await old.page.evaluate(() => document.querySelector('#newDev').hidden), '저장된 작업이 있는 브라우저: "다른 기기에서 쓰던 작업" 줄이 안 보임');
  await old.page.close();
}
{ // 인스타툰 노트 페이지의 ☰ 메뉴 + 주소로 들어오기(#month #vault #backup #help)
  for (const [vk, vp] of [['휴대폰 390', { width: 390, height: 800 }], ['PC 1300', { width: 1300, height: 800 }]]) {
    for (const [name, u, curText] of [['노트 목록', '/guide/', '인스타툰 노트'], ['노트 글', '/guide/how-to-make-instatoon/', '인스타툰 노트'], ['개인정보', '/privacy/', null], ['404', '/없는-주소/', null]]) {
      const { page, errors } = await newPage(browser, srv.base, { viewport: vp, ls: { 'instatoon.helpSeen': '1' } });
      await page.goto(srv.base + u); await page.waitForTimeout(250);
      const closed = await page.evaluate(() => ({ w: document.querySelector('#menuWrap').hidden, mb: document.querySelector('#menuBtn').getBoundingClientRect().height }));
      await page.click('#menuBtn'); await page.waitForTimeout(350);
      const o = await page.evaluate(() => { const p = document.querySelector('#menuPanel'), items = [...p.querySelectorAll('.mi')], cur = p.querySelector('[aria-current="page"]'); return { items: items.map((e) => e.textContent.trim()).join(','), hrefs: items.map((e) => e.getAttribute('href')).join(','), cur: cur && cur.textContent.trim(), slot: p.firstElementChild.id === 'shopSlot' && p.firstElementChild.hidden, on: document.querySelector('#menuWrap').classList.contains('on') }; });
      C.ok(closed.w && closed.mb === 40 && o.on && o.items === MENU_ITEMS && o.hrefs === '/,/#month,/#vault,/guide/,/#backup,/#help,/guide/instatoon-troubleshooting/' && o.slot && (o.cur || null) === curText, `${vk} ${name}: ☰ 메뉴가 홈과 같은 항목·순서로 열리고 링크가 맞음 (현재 표시: ${o.cur || '없음'})`);
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      C.ok(await page.evaluate(() => document.querySelector('#menuWrap').hidden), `${vk} ${name}: Esc로 메뉴가 닫힘`);
      await page.click('#menuBtn'); await page.waitForTimeout(300); await page.mouse.click(vp.width - 6, 500); await page.waitForTimeout(300);
      C.ok(await page.evaluate(() => document.querySelector('#menuWrap').hidden), `${vk} ${name}: 바깥을 누르면 메뉴가 닫힘`);
      C.ok(!errors.length, `${vk} ${name}: 페이지 오류 없음`);
      await page.close();
    }
  }
  const routes = [['#month', () => S.mode === 'month'], ['#backup', () => !!document.querySelector('#bkWin') && !document.querySelector('#bkWin').hidden], ['#vault', () => !!document.querySelector('#vaultSheet') && !document.querySelector('#vaultSheet').hidden], ['#help', () => !!document.querySelector('#tour')]];
  for (const [h, fn] of routes) {
    const { page, errors } = await newPage(browser, srv.base, { viewport: { width: 1300, height: 800 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
    await page.goto(srv.base + '/' + h); await page.waitForTimeout(700);
    C.ok(await page.evaluate(fn), `주소 /${h}로 들어오면 해당 화면이 바로 열림`) ; C.ok(!errors.length, `/${h}: 페이지 오류 없음${errors[0] ? ' ← ' + errors[0] : ''}`);
    await page.close();
  }
}
{ // 옛 작업·옛 백업의 mode(reels·stats)는 오류 없이 홈으로 열림, 저장된 반응·릴스 데이터는 그대로
  for (const mode of ['reels', 'stats']) {
    const st = { step: 'input', mode, info: { type: '빵집', name: '옛 가게' }, toon: { title: '옛 편', cuts: [], reel: { caption: '옛 릴스 글', hashtags: '#a', comment: '' } }, history: [{ hid: '1', title: '옛 편', stats: { like: 3, save: 2 } }], reuse: { sec: 4 } };
    const { page, errors } = await newPage(browser, srv.base, { viewport: { width: 1300, height: 800 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST', 'instatoonRoom.v4': JSON.stringify(st) } });
    await page.goto(srv.base + '/'); await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({ mode: S.mode, home: !!document.querySelector('#makeBtn'), reel: S.toon.reel.caption, like: S.history[0].stats.like, reuse: S.reuse.sec, block: /지난 편 반응/.test(statsBlock()) }));
    C.ok(r.mode === 'one' && r.home && r.reel === '옛 릴스 글' && r.like === 3 && r.reuse === 4 && r.block && !errors.length, `옛 작업(mode=${mode}): 오류 없이 홈으로 열리고 릴스 글·반응 기록·한 달 기획용 반응 요약이 그대로`);
    await page.close();
  }
}
// ---- 인스타툰 노트 목록: 10개씩 나누기 / 페이지 번호 ----
{
  const os = await import('node:os');
  const { serve: serveDir } = await import('../lib/harness.mjs');
  const { renderHub } = await import('../../site/guide/lib.mjs');
  const mk = (n, cats) => Array.from({ length: n }, (_, i) => ({ slug: 's' + i, cat: cats[i % cats.length], published: '2026-0' + (1 + (i % 9)) + '-1' + (i % 9), title: '테스트 글 ' + i, card: '요약 ' + i }));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hubtest-'));
  const fake = (name, arts) => { fs.mkdirSync(path.join(tmp, name, 'guide'), { recursive: true }); fs.writeFileSync(path.join(tmp, name, 'guide', 'index.html'), renderHub(arts)); fs.copyFileSync(path.join(root, 'deploy', '404.html'), path.join(tmp, name, '404.html')); };
  fake('big', mk(120, ['toon', 'insta', 'biz', 'ai', 'meta'])); fake('cat', mk(35, ['toon', 'toon', 'insta']));
  const sBig = await serveDir(path.join(tmp, 'big')), sCat = await serveDir(path.join(tmp, 'cat'));
  const info = (page) => page.evaluate(() => {
    const vis = [...document.querySelectorAll('#posts .post')].filter((li) => !li.hidden), pg = [...document.querySelectorAll('#pager > *')];
    const cs = pg.filter((e) => e.classList.contains('pg')).map((e) => e.getBoundingClientRect());
    return { visible: vis.length, cats: [...new Set(vis.map((li) => li.dataset.cat))], pagerShown: !document.querySelector('#pager').hidden, text: pg.map((e) => e.textContent.trim()).join(' '), cur: (document.querySelector('#pager [aria-current="page"]') || {}).textContent, dis: pg.filter((e) => e.classList.contains('dis')).map((e) => e.textContent.trim()).join(''), url: location.pathname + location.search + location.hash, minSize: Math.min(...cs.map((r) => Math.min(r.width, r.height))), oneRow: new Set(cs.map((r) => Math.round(r.top))).size <= 1, overflow: document.documentElement.scrollWidth - window.innerWidth, chip: ((document.querySelector('.chips [aria-current="true"]') || {}).dataset || {}).cat, topY: Math.round(document.querySelector('.chips').getBoundingClientRect().top) };
  });
  for (const [vk, vp] of [['모바일 390', { width: 390, height: 844 }], ['PC 1300', { width: 1300, height: 900 }]]) {
    const mob = vp.width <= 480;
    { // 실제 목록(23편)
      const { page, errors } = await newPage(browser, srv.base, { viewport: vp });
      await page.goto(srv.base + '/guide/'); await page.waitForTimeout(300);
      let r = await info(page);
      C.ok(r.visible === 10 && r.pagerShown && r.text === '‹ 1 2 3 ›' && r.cur === '1' && r.dis === '‹', `${vk} 노트 목록: 10개만 보이고 페이지 번호 1 2 3, 첫 페이지의 ‹가 흐림 (${r.visible}개, ${r.text})`);
      C.ok(r.minSize >= 40 && r.oneRow && r.overflow <= 1, `${vk} 노트 목록: 페이지 버튼 40px 이상, 한 줄, 가로 넘침 없음`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(100);
      await page.click('#pager a[data-p="2"]');
      await page.waitForFunction(() => { const y = document.querySelector('.chips').getBoundingClientRect().top; return y >= -2 && y < 200; }, null, { timeout: 4000 }).catch(() => {});
      r = await info(page);
      C.ok(r.visible === 10 && r.cur === '2' && r.url === '/guide/?page=2' && r.topY >= -2 && r.topY < 200, `${vk} 노트 목록: 2페이지로 이동, 주소에 ?page=2, 목록 맨 위로 부드럽게 올라감 (칩 위치 ${r.topY}px)`);
      await page.click('#pager a[data-p="3"]'); await page.waitForTimeout(200); r = await info(page);
      C.ok(r.visible === 3 && r.cur === '3' && r.dis === '›' && r.url === '/guide/?page=3', `${vk} 노트 목록: 마지막 3페이지는 3개, ›가 흐림`);
      await page.goBack(); await page.waitForTimeout(200); r = await info(page);
      C.ok(r.cur === '2' && r.visible === 10 && r.url === '/guide/?page=2', `${vk} 노트 목록: 뒤로가기하면 2페이지`);
      await page.goBack(); await page.waitForTimeout(200); r = await info(page);
      C.ok(r.cur === '1' && r.url === '/guide/', `${vk} 노트 목록: 뒤로가기 한 번 더 하면 1페이지`);
      await page.goForward(); await page.waitForTimeout(200); r = await info(page);
      C.ok(r.cur === '2', `${vk} 노트 목록: 앞으로가기하면 다시 2페이지`);
      await page.goto(srv.base + '/guide/?page=3'); await page.waitForTimeout(300); r = await info(page);
      C.ok(r.cur === '3' && r.visible === 3, `${vk} 노트 목록: 새로고침/직접 열어도 같은 페이지(3페이지)`);
      await page.goto(srv.base + '/guide/?page=9'); await page.waitForTimeout(300); r = await info(page);
      C.ok(r.cur === '3' && r.url === '/guide/?page=3', `${vk} 노트 목록: 없는 페이지 번호는 마지막 페이지로 바로잡음`);
      const cats = await page.evaluate(() => [...document.querySelectorAll('.chips a')].map((a) => a.dataset.cat));
      await page.goto(srv.base + '/guide/?page=3#biz'); await page.waitForTimeout(300);
      await page.click('.chips a[data-cat="toon"]'); await page.waitForTimeout(200); r = await info(page);
      const nToon = await page.evaluate(() => [...document.querySelectorAll('#posts .post')].filter((li) => li.dataset.cat === 'toon').length);
      C.ok(r.url === '/guide/#toon' && r.chip === 'toon' && r.cats.join() === 'toon' && r.visible === Math.min(10, nToon) && r.pagerShown === (nToon > 10), `${vk} 노트 목록: 카테고리를 바꾸면 1페이지로(주소에서 ?page 삭제), 글 ${nToon}편${nToon <= 10 ? '이라 페이지 번호 숨김' : ''}`);
      await page.goto(srv.base + '/guide/#insta'); await page.waitForTimeout(300); r = await info(page);
      C.ok(r.chip === 'insta' && r.cats.join() === 'insta', `${vk} 노트 목록: 기존 /guide/#insta 주소도 그대로 동작`);
      C.ok(cats.join() === 'all,toon,insta,biz,ai,meta', `${vk} 노트 목록: 카테고리 칩 6개 그대로`);
      C.ok(!errors.length, `${vk} 노트 목록: 페이지 오류 없음`);
      await page.close();
    }
    { // 글이 많은 목록(120편): 번호 줄여 보이기
      const { page } = await newPage(browser, sBig.base, { viewport: vp });
      const want = mob ? { 1: '‹ 1 2 3 … 12 ›', 5: '‹ 1 … 5 … 12 ›', 12: '‹ 1 … 10 11 12 ›' } : { 1: '‹ 1 2 3 4 5 … 12 ›', 5: '‹ 1 … 4 5 6 … 12 ›', 12: '‹ 1 … 8 9 10 11 12 ›' };
      for (const [p, text] of Object.entries(want)) {
        await page.goto(sBig.base + '/guide/?page=' + p); await page.waitForTimeout(250); const r = await info(page);
        C.ok(r.text === text && r.oneRow && r.overflow <= 1 && r.minSize >= 40, `${vk} 글 120편, ${p}페이지: "${r.text}"${r.text === text ? ' (한 줄, 버튼 40px 이상, 넘침 없음)' : ` ← 기대 "${text}"`}`);
      }
      await page.close();
    }
    { // 글이 많은 카테고리: 카테고리 안에서 10개씩, 바꾸면 1페이지
      const { page } = await newPage(browser, sCat.base, { viewport: vp });
      await page.goto(sCat.base + '/guide/#toon'); await page.waitForTimeout(250); let r = await info(page);
      C.ok(r.visible === 10 && r.pagerShown && r.text === '‹ 1 2 3 ›' && r.cats.join() === 'toon', `${vk} 카테고리(글 24편): 그 카테고리 안에서 10개씩 나뉨 (${r.text})`);
      await page.click('#pager a[data-p="2"]'); await page.waitForTimeout(250); r = await info(page);
      C.ok(r.visible === 10 && r.cur === '2' && r.url === '/guide/?page=2#toon' && r.cats.join() === 'toon', `${vk} 카테고리: 2페이지, 주소 ?page=2#toon`);
      await page.click('.chips a[data-cat="insta"]'); await page.waitForTimeout(250); r = await info(page);
      C.ok(r.cur === '1' && r.url === '/guide/#insta' && r.cats.join() === 'insta' && r.visible === 10, `${vk} 카테고리를 바꾸면 1페이지로 돌아옴`);
      await page.goBack(); await page.waitForTimeout(250); r = await info(page);
      C.ok(r.cur === '2' && r.url === '/guide/?page=2#toon', `${vk} 카테고리 바꾼 뒤 뒤로가기: 이전 카테고리의 2페이지`);
      await page.close();
    }
  }
  { // 자바스크립트가 꺼져 있으면 전체 목록
    const ctx = await browser.newContext({ javaScriptEnabled: false }); const page = await ctx.newPage();
    await page.route('**/*', (r) => (r.request().url().startsWith(srv.base) ? r.continue() : r.fulfill({ status: 200, body: '' })));
    await page.goto(srv.base + '/guide/');
    const html = await (await fetch(srv.base + '/guide/')).text();
    const shown = await page.locator('#posts .post:visible').count(), pagerVisible = await page.locator('#pager:visible').count();
    C.ok(shown === 23 && pagerVisible === 0, `자바스크립트 꺼짐: 노트 글 23개가 모두 보이고 페이지 번호는 숨김 (${shown}개)`);
    C.ok((html.match(/<li class="post"/g) || []).length === 23, 'HTML 안에 글 링크 23개가 모두 있음(화면에서만 숨김)');
    await ctx.close();
  }
  sBig.close(); sCat.close(); fs.rmSync(tmp, { recursive: true, force: true });
}
{ // 4b 수정: 본문 폭을 위쪽 줄(API 키 줄·단계 탭)과 맞추고, PC·태블릿에서는 1단계 입력칸을 2열로
  for (const [vk, vp] of [['PC 1300', { width: 1300, height: 900 }], ['태블릿 768', { width: 768, height: 1000 }], ['휴대폰 390', { width: 390, height: 844 }]]) {
    const { page, errors } = await newPage(browser, srv.base, { viewport: vp, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
    await page.goto(srv.base + '/'); await page.waitForTimeout(500);
    const edges = () => page.evaluate(() => { const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.right)]; }; const side = document.querySelector('#side'), main = document.querySelector('#main'), key = document.querySelector('#keyBox'), steps = document.querySelector('#steps');
      const m = r(main), sv = side && !side.hidden && getComputedStyle(side).display !== 'none' && side.getBoundingClientRect().width > 0 ? r(side) : null; return { key: r(key), steps: r(steps), body: [m[0], sv ? Math.max(m[1], sv[1]) : m[1]], ov: document.documentElement.scrollWidth - innerWidth }; });
    const same = (e, label) => C.ok(Math.abs(e.body[0] - e.key[0]) <= 1 && Math.abs(e.body[1] - e.key[1]) <= 1 && (e.steps[1] === e.steps[0] || (Math.abs(e.steps[0] - e.key[0]) <= 1 && Math.abs(e.steps[1] - e.key[1]) <= 1)) && e.ov <= 1, `${vk} ${label}: 본문 왼쪽·오른쪽 끝이 위쪽 줄(API 키 줄·단계 탭)과 같음 (본문 ${e.body} / 위쪽 ${e.key})`);
    // 1단계 (비어 있는 상태 = 접힌 칸들)
    await page.evaluate(() => { S = blank(); S.info.type = '빵집'; S.mode = 'one'; S.step = 'input'; render(); }); await page.waitForTimeout(250);
    same(await edges(), '1단계');
    const g = await page.evaluate(() => {
      const box = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), w: Math.round(b.width) }; };
      const dd = (id) => { const e = document.querySelector(id); return e && e.closest('.dd') ? e.closest('.dd').getBoundingClientRect() : null; };
      const type = document.querySelector('#ind-lb').parentElement.querySelector('.dd'), tb = type.getBoundingClientRect(), nm = box('#i-name'), who = [...document.querySelector('.fform .who').children].map((d) => Math.round(d.getBoundingClientRect().top)),
        hero = box('#moreHero'), prof = box('.fform .prof'), kind = document.querySelector('.kindrow .dd').getBoundingClientRect(), story = box('#i-story'), panel = box('#main .panel');
      const longInputs = [...document.querySelectorAll('.fform input.in')].filter((e) => e.getBoundingClientRect().width > 640 && e.getClientRects().length).length;
      const lefts = [...document.querySelectorAll('.fform > .h, .fform > .g2, .fform > .story, .fform > .kindrow')].filter((e) => e.getClientRects().length).map((e) => Math.round(e.getBoundingClientRect().left));
      return { typeT: Math.round(tb.top), nameT: nm.t, whoSame: new Set(who).size === 1, hero, prof, kindW: Math.round(kind.width), panelW: panel.w, story, longInputs, lefts, ov: document.documentElement.scrollWidth - innerWidth };
    });
    if (vp.width >= 721) {
      C.ok(Math.abs(g.typeT - g.nameT) <= 2, `${vk} 1단계: 업종 | 브랜드 이름이 한 줄에 나란히`);
      C.ok(g.whoSame, `${vk} 1단계: 역할·성별·나이가 한 줄`);
      C.ok(g.hero && g.prof && Math.abs(g.hero.t - g.prof.t) <= 2 && g.prof.l > g.hero.r - 2, `${vk} 1단계: "주인공 모습·컷 수·비율 더 설정하기"와 "브랜드 프로필"이 나란히`);
      C.ok(g.kindW <= (g.panelW - 56) / 2 + 2, `${vk} 1단계: 대본 유형 선택칸은 절반 폭까지만(${g.kindW}px) — 한 칸이 길게 늘어지지 않음`);
      C.ok(g.story.w >= (g.panelW - 56) * 0.9, `${vk} 1단계: 있었던 일은 가로 전체(${g.story.w}px)`);
      C.ok(g.longInputs === 0, `${vk} 1단계: 한 줄 입력칸이 640px보다 길게 늘어지지 않음 (${g.longInputs}개)`);
      // 열린 칸은 가로 전체로
      await page.evaluate(() => { document.querySelector('#moreHero').open = true; }); await page.waitForTimeout(150);
      C.ok(await page.evaluate(() => { const h = document.querySelector('#moreHero').getBoundingClientRect(), p = document.querySelector('#main .panel').getBoundingClientRect(); return h.width > (p.width - 56) * 0.9; }), `${vk} 1단계: 칸을 펼치면 가로 전체로 넓어짐`);
      await page.evaluate(() => { document.querySelector('#moreHero').open = false; });
    } else {
      C.ok(g.typeT < g.nameT && new Set(g.lefts).size === 1 && g.ov <= 1, `${vk} 1단계: 휴대폰은 1열(업종 → 이름 위아래, 칸들의 왼쪽 끝이 모두 같음)`);
    }
    // 2단계 · 3단계(그림 전·후) · 한 달 기획
    await page.evaluate(() => { S = demoState('bakery'); S.demo = false; S.mode = 'one'; S.step = 'edit'; S.toon.pics = []; render(); }); await page.waitForTimeout(250); same(await edges(), '2단계');
    await page.evaluate(() => { S.step = 'post'; render(); }); await page.waitForTimeout(250); same(await edges(), '3단계(그림 올리기 전)');
    await page.evaluate(() => { S.toon.pics = ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==']; render(); }); await page.waitForTimeout(250); same(await edges(), '3단계(그림을 올린 뒤)');
    await page.evaluate(() => { S.mode = 'month'; render(); }); await page.waitForTimeout(250); same(await edges(), '한 달 기획');
    C.ok(!errors.length, `${vk} 폭 맞추기: 페이지 오류 없음${errors[0] ? ' ← ' + errors[0] : ''}`);
    await page.close();
  }
}
{ // 3단계: 한 편을 끝냈을 때 "이 편까지 백업 저장" 안내를 편마다 한 번 (4b)
  const open1 = async () => { const h = await newPage(browser, srv.base, { viewport: { width: 1300, height: 900 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } }); await h.page.goto(srv.base + '/'); await h.page.waitForTimeout(400);
    await h.page.evaluate(() => { S = demoState('bakery'); S.demo = false; S.mode = 'one'; S.step = 'post'; S.toon.pics = []; delete S.toon.bkAsk; save(); render(); }); await h.page.waitForTimeout(250); return h; };
  const addAll = (page) => page.evaluate(async () => { const mk = () => new Promise((res) => { const c = document.createElement('canvas'); c.width = c.height = 8; c.getContext('2d').fillStyle = '#888'; c.getContext('2d').fillRect(0, 0, 8, 8); c.toBlob(res, 'image/png'); }); const fs = []; for (let i = 0; i < cuts().length; i++) fs.push(new File([await mk()], `${i + 1}.png`, { type: 'image/png' })); await addPics(fs, 'toon'); });
  const a = await open1();
  C.ok(await a.page.evaluate(() => !document.querySelector('#bkAsk')), '3단계: 그림을 올리기 전에는 백업 안내가 없음');
  await a.page.evaluate(async () => { const c = document.createElement('canvas'); c.width = c.height = 8; const b = await new Promise((r) => c.toBlob(r, 'image/png')); await addPics([new File([b], '1.png', { type: 'image/png' })], 'toon'); });
  C.ok(await a.page.evaluate(() => !document.querySelector('#bkAsk') && cuts().length > pics().length), '3단계: 그림을 일부만 올렸을 때는 아직 안내하지 않음');
  await addAll(a.page); await a.page.waitForTimeout(250);
  const t1 = await a.page.evaluate(() => { const e = document.querySelector('#bkAsk'); return { shown: !!e, text: e && e.innerText.replace(/\s+/g, ' '), flag: S.toon.bkAsk, btns: e && [...e.querySelectorAll('button')].map((b) => b.textContent.trim()).join(',') }; });
  C.ok(t1.shown && t1.flag === 'shown' && t1.btns === '이 편까지 백업 저장,나중에', `3단계: 그림을 다 올리면 "이 편까지 백업 저장" 안내가 한 번 뜸 (${t1.btns})`);
  await a.page.click('#bkAsk [data-bkask="later"]'); await a.page.waitForTimeout(150);
  C.ok(await a.page.evaluate(() => !document.querySelector('#bkAsk') && S.toon.bkAsk === 'later'), '"나중에"를 누르면 안내가 사라지고 이 편에서는 기록됨');
  await addAll(a.page); await a.page.evaluate(() => { render(); }); await a.page.waitForTimeout(250); await a.page.evaluate(() => { const b = document.querySelector('[data-act="kitCopy"]'); if (b) b.click(); }); await a.page.waitForTimeout(250);
  C.ok(await a.page.evaluate(() => !document.querySelector('#bkAsk') && S.toon.bkAsk === 'later'), '"나중에" 뒤에는 그림을 다시 올리거나 캡션을 복사해도 이 편에서 다시 안 뜸');
  await a.ctx.close();
  const b = await open1();
  await b.page.evaluate(() => { const bt = document.querySelector('[data-act="kitCopy"]'); if (bt) bt.click(); }); await b.page.waitForTimeout(300);
  C.ok(await b.page.evaluate(() => !!document.querySelector('#bkAsk') && S.toon.bkAsk === 'shown'), '3단계: 캡션을 복사해도 안내가 한 번 뜸');
  const [dl] = await Promise.all([b.page.waitForEvent('download', { timeout: 4000 }).catch(() => null), b.page.click('#bkAsk [data-bkask="save"]')]);
  C.ok(!!dl && await b.page.evaluate(() => !document.querySelector('#bkAsk') && S.toon.bkAsk === 'done'), '"이 편까지 백업 저장"을 누르면 백업 파일이 내려받아지고 안내가 사라짐');
  await b.page.evaluate(() => { render(); }); await b.page.waitForTimeout(200);
  C.ok(await b.page.evaluate(() => !document.querySelector('#bkAsk')), '백업한 편은 다시 안내하지 않음');
  await b.ctx.close();
  const d = await open1(); await d.page.evaluate(() => { S.demo = true; save(); }); await addAll(d.page); await d.page.waitForTimeout(250);
  C.ok(await d.page.evaluate(() => !document.querySelector('#bkAsk') && !S.toon.bkAsk), '체험(예시) 모드에서는 백업 안내가 뜨지 않음');
  C.ok(d.errors.length === 0, '백업 안내: 페이지 오류 없음' + (d.errors[0] ? ' ← ' + d.errors[0] : ''));
  await d.ctx.close();
}
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 디자인 기준 ${C.fail}건 실패` : '\n[PASS] 디자인 기준 전부 통과');
process.exit(C.fail ? 1 : 0);
