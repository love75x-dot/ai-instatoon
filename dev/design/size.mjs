// 글자 크기·가로 넘침 측정 검사: 모든 화면을 320·390·768·1300px에서 열어
//   (1) 눈에 보이는 글자가 모두 15px 이상인지(인스타 미리보기 모형·관리자·그림 글자 칸은 예외)
//   (2) 입력칸 글자가 16px 이상인지(휴대폰 확대 방지)
//   (3) 가로로 밀리지 않는지
// 를 잰다. 항목 이름 16px · 단계 16px 이상 · ☰ 메뉴 18px 같은 정해진 크기도 확인한다.
//   node dev/design/size.mjs     (먼저 npm run build)
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(), browser = await launch();
const VPS = [['320', { width: 320, height: 700 }], ['390', { width: 390, height: 844 }], ['768', { width: 768, height: 900 }], ['1300', { width: 1300, height: 900 }]];
const SKIP = '.phone,.endpv,.ig-top,.ig-cap,.car,.frame,canvas,[class*="adm"],#admWrap,noscript,script,style';

const probe = (skip) => {
  const out = { overflow: document.documentElement.scrollWidth - window.innerWidth, small: [], smallInputs: [] };
  const vis = (el) => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0; };
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest(skip) || !vis(el)) continue;
    const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize), tag = el.tagName.toLowerCase();
    const name = tag + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
    if (/^(input|textarea|select)$/.test(tag) && el.type !== 'hidden' && el.type !== 'file' && el.type !== 'checkbox' && el.type !== 'radio' && fs < 16) out.smallInputs.push(name + ' ' + fs);
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (own && fs < 15) out.small.push(name + ' ' + fs + 'px "' + [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').slice(0, 14) + '"');
  }
  return out;
};
const fsOf = (sel) => (document) => { const e = document.querySelector(sel); return e ? parseFloat(getComputedStyle(e).fontSize) : null; };

const SCREENS = [
  ['1단계', () => { S = demoState('bakery'); S.step = 'input'; S.mode = 'one'; }],
  ['2단계', () => { S = demoState('bakery'); S.step = 'edit'; S.mode = 'one'; }],
  ['3단계', () => { S = demoState('bakery'); S.step = 'post'; S.mode = 'one'; }],
  ['한 달 기획', () => { S = demoState('bakery'); S.mode = 'month'; }],
];
for (const [vk, vp] of VPS) {
  const { page, errors } = await newPage(browser, srv.base, { viewport: vp, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
  await page.goto(srv.base + '/'); await page.waitForTimeout(500);
  const rep = async (name) => {
    const r = await page.evaluate(probe, SKIP);
    C.ok(r.overflow <= 1, `${vk}px ${name}: 가로로 넘치지 않음${r.overflow > 1 ? ' (' + r.overflow + 'px)' : ''}`);
    C.ok(!r.small.length, `${vk}px ${name}: 글자 15px 이상${r.small.length ? ' ← ' + r.small.slice(0, 4).join(' | ') + (r.small.length > 4 ? ` 외 ${r.small.length - 4}` : '') : ''}`);
    C.ok(!r.smallInputs.length, `${vk}px ${name}: 입력칸 16px 이상${r.smallInputs.length ? ' ← ' + r.smallInputs.slice(0, 3).join(' | ') : ''}`);
  };
  for (const [name, fn] of SCREENS) { await page.evaluate(`(${fn.toString()})(); save(); render();`); await page.waitForTimeout(200); await rep(name); }
  // 정해진 크기(1단계)
  await page.evaluate(`(${SCREENS[0][1].toString()})(); save(); render();`); await page.waitForTimeout(200);
  const f = await page.evaluate(() => { const g = (s) => { const e = document.querySelector(s); return e ? parseFloat(getComputedStyle(e).fontSize) : null; }; return { label: g('label.f'), step: g('.steps .st .t'), keyTxt: g('#keyTxt'), keychg: g('.keychg'), input: g('#i-story') }; });
  C.ok(f.label === 16 && f.step >= 16 && f.keyTxt === 16 && f.keychg >= 15 && f.input >= 16, `${vk}px 정해진 크기: 항목 이름 ${f.label} · 단계 ${f.step} · "오늘 무료 1회" ${f.keyTxt} · "내 키 설정" ${f.keychg} · 입력 ${f.input}`);
  // ☰ 메뉴
  await page.click('#menuBtn'); await page.waitForTimeout(350);
  const mi = await page.evaluate(() => { const e = document.querySelector('#menuPanel .mi'); return e ? parseFloat(getComputedStyle(e).fontSize) : null; });
  C.ok(mi === 18, `${vk}px ☰ 메뉴 항목 글자 ${mi}px (18px)`); await rep('☰ 메뉴');
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  // 도움말 · 내 작업 저장·불러오기 · 내 캐릭터
  await page.evaluate(() => toggleHelp(true)); await page.waitForTimeout(400); await rep('도움말');
  await page.evaluate(() => toggleHelp(false));
  await page.evaluate(() => openBackupWin()); await page.waitForTimeout(500); await rep('내 작업 저장·불러오기');
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  await page.evaluate(() => { try { document.querySelector('#backupWin,[id*="backup"]')?.remove?.(); } catch (_) {} });
  await page.goto(srv.base + '/'); await page.waitForTimeout(500);
  await page.evaluate(() => openVault({})); await page.waitForTimeout(500); await rep('내 캐릭터(보관함)');
  C.ok(!errors.length, `${vk}px: 페이지 오류 없음${errors[0] ? ' ← ' + errors[0].slice(0, 100) : ''}`);
  await page.context().close();
}
// 정적 페이지: 노트 목록·글, 개인정보, 이용안내, 소개, 404
for (const [vk, vp] of VPS) {
  const { page } = await newPage(browser, srv.base, { viewport: vp });
  for (const [name, u] of [['노트 목록', '/guide/'], ['노트 글', '/guide/how-to-use-instatoon-room/'], ['개인정보', '/privacy/'], ['이용안내', '/terms/'], ['404', '/없는-페이지/']]) {
    await page.goto(srv.base + u); await page.waitForTimeout(250);
    const r = await page.evaluate(probe, SKIP);
    C.ok(r.overflow <= 1, `${vk}px ${name}: 가로로 넘치지 않음${r.overflow > 1 ? ' (' + r.overflow + 'px)' : ''}`);
    C.ok(!r.small.length, `${vk}px ${name}: 글자 15px 이상${r.small.length ? ' ← ' + r.small.slice(0, 4).join(' | ') + (r.small.length > 4 ? ` 외 ${r.small.length - 4}` : '') : ''}`);
    const mi = await page.evaluate(async () => { document.querySelector('#menuBtn')?.click(); await new Promise((r) => setTimeout(r, 350)); const e = document.querySelector('#menuPanel .mi'); return e ? parseFloat(getComputedStyle(e).fontSize) : null; });
    C.ok(mi === 18, `${vk}px ${name}: ☰ 메뉴 항목 글자 ${mi}px (18px)`);
  }
  await page.context().close();
}
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 글자 크기 검사 ${C.fail}건 실패` : '\n[PASS] 글자 크기 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
