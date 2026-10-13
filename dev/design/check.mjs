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
  ['스토리·릴스', () => { S = demoState('bakery'); S.mode = 'reels'; }],
  ['반응·댓글', () => { S = demoState('bakery'); S.mode = 'stats'; }],
];
const probe = () => {
  const YEL = 'rgb(255, 213, 61)', okYellow = '.todo, .endpv, .arts, .endsw, .mark, .endwrap, .swatches, .frame, .phone, .ftile';
  const out = { overflow: document.documentElement.scrollWidth - window.innerWidth, smallInputs: [], shadows: [], yellow: [], emoji: [] };
  const emo = /\p{Extended_Pictographic}/u;
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el); if (cs.display === 'none') continue;
    const tag = el.tagName.toLowerCase(), cls = el.className && el.className.baseVal === undefined ? '.' + String(el.className).trim().split(/\s+/).join('.') : '';
    if ((el.matches('input.in,textarea.in,.dd-btn,.snum input')) && parseFloat(cs.fontSize) < 16) out.smallInputs.push(tag + cls);
    if (cs.boxShadow !== 'none' && !el.closest('#tour,.tour-hl,.frame')) out.shadows.push(tag + cls);
    if (cs.backgroundColor === YEL && !el.closest(okYellow)) out.yellow.push(tag + cls);
    if (el.children.length === 0 && !el.closest('textarea,pre,.phone,.frame,.endpv,.kit,#kitWarn,.ig-cap') && emo.test(el.textContent || '')) out.emoji.push((el.textContent || '').trim().slice(0, 24));
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
const blockOf = (html) => (html.match(/\/\* HEADER:BEGIN[\s\S]*?\/\* HEADER:END \*\//) || [''])[0];
const appCss = blockOf(fs.readFileSync(path.join(root, 'deploy', 'index.html'), 'utf8')), noteCss = blockOf(fs.readFileSync(path.join(root, 'deploy', 'guide', 'index.html'), 'utf8'));
C.ok(appCss.length > 200 && appCss === noteCss, '머리말 CSS 블록이 홈과 노트에서 글자까지 같음');
const HPAGES = [['홈', '/'], ['노트 목록', '/guide/'], ['노트 글', '/guide/how-to-make-instatoon/'], ['소개', '/about/'], ['개인정보', '/privacy/'], ['이용안내', '/terms/'], ['404', '/없는-주소/']];
const headProbe = () => {
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left * 10) / 10, y: Math.round(r.top * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, r: Math.round((window.innerWidth - r.right) * 10) / 10 }; };
  const tb = document.querySelector('.topbar'), brand = tb.querySelector('.brand'), mark = brand.querySelector('.mark'), name = brand.querySelector('b');
  const btns = [...tb.querySelectorAll('.hnav .hb:not(.hmore)')].map((b) => { const cs = getComputedStyle(b); return { kind: b.classList.contains('pri') ? '주' : '보조', text: b.textContent.trim(), box: box(b), css: [cs.fontSize, cs.fontWeight, cs.paddingLeft, cs.borderRadius, cs.borderTopWidth, cs.backgroundColor, cs.color, cs.borderTopColor].join('|') }; });
  const ncs = getComputedStyle(name);
  return { tb: box(tb), mark: box(mark), name: { ...box(name), font: [ncs.fontSize, ncs.fontWeight, ncs.fontFamily].join('|') }, btns, overflow: document.documentElement.scrollWidth - window.innerWidth, logoHref: brand.tagName === 'A' ? brand.getAttribute('href') : '(앱: 첫 화면 이동 버튼)' };
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
    C.ok(same(r.mark, base.mark) && same(r.name, base.name), `${vk} ${name}: 로고 위치·크기·글꼴이 홈과 같음`);
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
// ---- 홈 머리말: 한 줄(PC·태블릿) / ⋯ 메뉴(휴대폰), 별도 도구 줄 없음 ----
const homeProbe = () => {
  const vis = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
  const tb = document.querySelector('.topbar'), top = (el) => Math.round(el.getBoundingClientRect().top * 10) / 10, h = (el) => Math.round(el.getBoundingClientRect().height * 10) / 10;
  const tools = [...tb.querySelectorAll('.htools .ht')], note = tb.querySelector('.hnav > a.hb');
  const outside = [...document.querySelectorAll('[data-act="backup"],[data-act="restore"],[data-act="help"],a[href="/guide/instatoon-troubleshooting/"]')].filter((e) => ['백업 저장', '불러오기', '문제 해결', '사용 방법'].includes(e.textContent.trim()) && !e.closest('.topbar') && !e.closest('#help,#trouble,.tour,#tour,.help-in,main'));
  return {
    noToolRow: !document.querySelector('.apptools'), outside: outside.map((e) => e.textContent.trim()),
    toolsVisible: tools.every(vis), toolLabels: tools.map((t) => t.textContent.trim()).join(','),
    rowTops: [...tools, note].filter(vis).map(top), rowHeights: [...tools, note].filter(vis).map(h),
    toolCss: [...new Set(tools.map((t) => { const c = getComputedStyle(t); return [c.fontSize, c.fontWeight, c.borderTopWidth, c.color, c.height].join('|'); }))].length,
    menuVisible: vis(tb.querySelector('.hmenu')), moreH: h(tb.querySelector('.hmore')), aiVisible: vis(tb.querySelector('.hai')),
    overflow: document.documentElement.scrollWidth - window.innerWidth, tbH: h(tb),
  };
};
for (const [vk, w] of [['PC 1300', 1300], ['PC 1024', 1024], ['태블릿 768', 768], ['한 줄 최소 721', 721], ['휴대폰 720', 720], ['휴대폰 390', 390], ['휴대폰 320', 320]]) {
  const { page, errors } = await newPage(browser, srv.base, { viewport: { width: w, height: 800 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
  await page.goto(srv.base + '/'); await page.waitForTimeout(300);
  const r = await page.evaluate(homeProbe), one = w > 720;
  C.ok(r.noToolRow && !r.outside.length, `${vk} 홈: 머리말 아래 별도 도구 줄 없음, 도구 버튼이 모두 머리말 안에 있음${r.outside.length ? ' ← 밖에 있음: ' + r.outside : ''}`);
  C.ok(r.overflow <= 1 && r.tbH === 72, `${vk} 홈: 가로 넘침 없음, 머리말 높이 72px`);
  if (one) {
    C.ok(r.toolsVisible && r.toolLabels === '백업 저장,불러오기,문제 해결,사용 방법' && !r.menuVisible, `${vk} 홈: 도구 4개가 머리말에 글자 버튼으로 보이고 ⋯는 숨김`);
    C.ok(new Set(r.rowTops).size === 1 && r.rowHeights.every((x) => x === 40), `${vk} 홈: 도구 4개와 "인스타툰 노트"가 같은 줄·높이 40px`);
    C.ok(r.toolCss === 1, `${vk} 홈: 도구 버튼 글자 14px·굵기·테두리 없음·회색이 모두 같음`);
    C.ok(w >= 800 ? r.aiVisible : !r.aiVisible, `${vk} 홈: AI 연결 상태 ${w >= 800 ? '점 + 짧은 글씨가 도구 왼쪽에 보임' : '(좁아서 숨김, 첫 화면 위쪽 "API 키 설정" 줄과 ⋯ 메뉴 없이도 상단 키 줄에서 확인)'}`);
  } else {
    C.ok(r.menuVisible && r.moreH === 40 && !r.toolsVisible && !r.aiVisible, `${vk} 홈: ⋯ 버튼(높이 40px)과 "노트"만 보임`);
    const bounds = await page.evaluate(() => { const b = document.querySelector('.hmore').getBoundingClientRect(), n = document.querySelector('.hnav > a.hb').getBoundingClientRect(); return { sameRow: Math.abs(b.top - n.top) < 1 && b.height === n.height, gap: n.left - b.right }; });
    C.ok(bounds.sameRow && bounds.gap >= 4, `${vk} 홈: ⋯와 "노트"가 같은 줄(간격 ${Math.round(bounds.gap)}px)`);
    await page.click('#hmoreBtn');
    const m = await page.evaluate(() => { const pop = document.querySelector('#hpop'), items = [...pop.querySelectorAll('button,a')].map((e) => e.textContent.trim()), r = pop.getBoundingClientRect(); return { open: !pop.hidden, items, expanded: document.querySelector('#hmoreBtn').getAttribute('aria-expanded'), inView: r.left >= 0 && r.right <= window.innerWidth, ai: document.querySelector('#aiTextM').textContent, first: getComputedStyle(pop.querySelector('button')).backgroundColor }; });
    C.ok(m.open && m.expanded === 'true' && m.items.join(',') === '백업 저장,불러오기,문제 해결,사용 방법' && m.inView, `${vk} 홈: ⋯를 누르면 메뉴가 열리고 백업 저장이 맨 위(화면 안에 들어옴)`);
    C.ok(/연결됨/.test(m.ai), `${vk} 홈: 메뉴에 AI 연결 상태 표시(${m.ai})`);
    C.ok(m.first === 'rgb(17, 17, 17)', `${vk} 홈: 메뉴의 백업 저장이 검정으로 눈에 띔`);
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 4000 }).catch(() => null), page.click('#hpop .hpri')]);
    C.ok(!!dl, `${vk} 홈: 메뉴의 "백업 저장"이 실제로 백업 파일을 내려받음`);
    C.ok(await page.evaluate(() => document.querySelector('#hpop').hidden), `${vk} 홈: 메뉴 항목을 누르면 메뉴가 닫힘`);
    await page.click('#hmoreBtn'); await page.keyboard.press('Escape');
    C.ok(await page.evaluate(() => document.querySelector('#hpop').hidden), `${vk} 홈: Esc로 메뉴가 닫힘`);
    await page.click('#hmoreBtn'); await page.mouse.click(Math.round(w / 2), 400);
    C.ok(await page.evaluate(() => document.querySelector('#hpop').hidden), `${vk} 홈: 바깥을 누르면 메뉴가 닫힘`);
    await page.click('#hmoreBtn'); await page.click('#hpop [data-act="help"]'); await page.waitForTimeout(200);
    C.ok(await page.evaluate(() => !document.querySelector('#help').hidden), `${vk} 홈: 메뉴의 "사용 방법"이 도움말을 엶`);
  }
  C.ok(!errors.length, `${vk} 홈 머리말: 페이지 오류 없음${errors[0] ? ' ← ' + errors[0] : ''}`);
  await page.close();
}
{ // 한 줄 모드에서 "백업 저장"·"불러오기"·"사용 방법" 기능
  const { page } = await newPage(browser, srv.base, { viewport: { width: 1300, height: 800 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
  await page.goto(srv.base + '/'); await page.waitForTimeout(300);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 4000 }).catch(() => null), page.click('.htools [data-act="backup"]')]);
  C.ok(!!dl, 'PC 1300 홈: 머리말 "백업 저장" 버튼이 백업 파일을 내려받음');
  const [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 4000 }).catch(() => null), page.click('.htools [data-act="restore"]')]);
  C.ok(!!fc, 'PC 1300 홈: 머리말 "불러오기" 버튼이 파일 선택 창을 엶');
  await page.click('.htools [data-act="help"]'); await page.waitForTimeout(200);
  C.ok(await page.evaluate(() => !document.querySelector('#help').hidden), 'PC 1300 홈: 머리말 "사용 방법" 버튼이 도움말을 엶');
  C.ok(await page.evaluate(() => document.querySelector('.htools a.ht').getAttribute('href') === '/guide/instatoon-troubleshooting/'), 'PC 1300 홈: "문제 해결"이 문제 해결 글로 연결');
  await page.close();
}
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 디자인 기준 ${C.fail}건 실패` : '\n[PASS] 디자인 기준 전부 통과');
process.exit(C.fail ? 1 : 0);
