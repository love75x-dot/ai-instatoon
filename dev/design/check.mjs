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
  const btns = [...tb.querySelectorAll('.hnav .hb')].map((b) => { const cs = getComputedStyle(b); return { kind: b.classList.contains('pri') ? '주' : '보조', text: b.textContent.trim(), box: box(b), css: [cs.fontSize, cs.fontWeight, cs.paddingLeft, cs.borderRadius, cs.borderTopWidth, cs.backgroundColor, cs.color, cs.borderTopColor].join('|') }; });
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
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 디자인 기준 ${C.fail}건 실패` : '\n[PASS] 디자인 기준 전부 통과');
process.exit(C.fail ? 1 : 0);
