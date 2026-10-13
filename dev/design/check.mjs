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
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 디자인 기준 ${C.fail}건 실패` : '\n[PASS] 디자인 기준 전부 통과');
process.exit(C.fail ? 1 : 0);
