// 상단 로고 위치 검사: 소개 화면의 로고와 작업 화면·노트·개인정보·404의 로고가 같은 자리·같은 크기·같은 글자 모양인지 숫자로 잰다.
//   (소개 → 작업 화면으로 넘어갈 때 로고가 움직이지 않아야 한다. ☰ 는 오른쪽, 순서: 인스타툰 노트 → ☰)
//   node dev/design/logo.mjs     (먼저 npm run build)
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(), browser = await launch();
const VPS = [['320', 320, 700], ['390', 390, 844], ['768', 768, 900], ['1300', 1300, 900], ['1389', 1389, 900]];
const r1 = (n) => Math.round(n * 10) / 10;

const introProbe = () => {
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
  const top = document.querySelector('#intro .in-top'), logo = document.querySelector('#intro .in-logo'), mark = logo.querySelector('.in-mark'), name = logo.querySelector('b'), cs = getComputedStyle(name);
  return { bar: box(top), logo: box(logo), mark: box(mark), name: { ...box(name), fs: cs.fontSize, fw: cs.fontWeight, ls: cs.letterSpacing }, gap: name.getBoundingClientRect().left - mark.getBoundingClientRect().right, sw: document.documentElement.clientWidth };
};
const appProbe = () => {
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
  const top = document.querySelector('.topbar'), logo = document.querySelector('.brand'), mark = logo.querySelector('.mark'), name = logo.querySelector('b'), cs = getComputedStyle(name);
  const menu = top.querySelector('#menuBtn'), note = top.querySelector('.hnav .hb:not(.pri)'), nav = top.querySelector('.hnav');
  const lb = box(logo), cp = getComputedStyle(logo);
  // 로고 칸에는 좌우 8px 안쪽 여백과 -8px 바깥 여백이 있어 글자 쪽 기준은 마크 위치로 본다
  return { bar: box(top), logo: lb, mark: box(mark), name: { ...box(name), fs: cs.fontSize, fw: cs.fontWeight, ls: cs.letterSpacing }, gap: name.getBoundingClientRect().left - mark.getBoundingClientRect().right, menu: menu && box(menu), note: note && box(note), navRight: box(nav).x + box(nav).w, barRight: box(top).x + box(top).w, navLeft: Math.min(...[...nav.children].filter((e) => getComputedStyle(e).display !== 'none' && e.getClientRects().length).map((e) => e.getBoundingClientRect().left)), nameRight: name.getBoundingClientRect().right, order: [...nav.children].map((e) => e.id || e.className.split(' ')[0]).filter(Boolean).join('>'), sw: document.documentElement.clientWidth };
};
const same = (a, b, tol = 0.6) => Math.abs(a - b) <= tol;

for (const [vk, w, h] of VPS) {
  // 소개 화면(처음 온 사람)
  const intro = await newPage(browser, srv.base, { intro: true, viewport: { width: w, height: h } });
  await intro.page.goto(srv.base + '/'); await intro.page.waitForTimeout(700);
  const I = await intro.page.evaluate(introProbe);
  // 같은 브라우저에서 [시작하기] → 작업 화면
  await intro.page.click('#intro .in-top [data-intro="start"]'); await intro.page.waitForTimeout(700);
  const A = await intro.page.evaluate(appProbe);
  const row = `${vk}px 소개 로고 x=${r1(I.mark.x)} y=${r1(I.mark.y)} / 작업 로고 x=${r1(A.mark.x)} y=${r1(A.mark.y)}`;
  C.ok(same(I.mark.x, A.mark.x) && same(I.mark.y, A.mark.y) && same(I.mark.w, A.mark.w) && same(I.mark.h, A.mark.h), `${row} · 로고 크기 ${r1(I.mark.w)}×${r1(I.mark.h)} / ${r1(A.mark.w)}×${r1(A.mark.h)}`);
  C.ok(same(I.bar.h, A.bar.h), `${vk}px 상단 높이 소개 ${r1(I.bar.h)} / 작업 ${r1(A.bar.h)}`);
  C.ok(same(I.name.x, A.name.x) && I.name.fs === A.name.fs && I.name.fw === A.name.fw && I.name.ls === A.name.ls && same(I.gap, A.gap), `${vk}px 로고 글자: 시작 x ${r1(I.name.x)} / ${r1(A.name.x)} · 크기 ${I.name.fs} / ${A.name.fs} · 굵기 ${I.name.fw} / ${A.name.fw} · 자간 ${I.name.ls} / ${A.name.ls} · 마크와 간격 ${r1(I.gap)} / ${r1(A.gap)}`);
  // ☰ 는 오른쪽 끝, 순서: 인스타툰 노트 → ☰ (저장 표시는 맨 앞에 있을 수 있음)
  C.ok(A.menu && A.note && A.menu.x > A.note.x && same(A.menu.x + A.menu.w, A.navRight, 1) && A.menu.x > A.mark.x && /hb(.*)menuBtn$/.test(A.order.replace(/\s/g, '')), `${vk}px ☰ 오른쪽 끝(순서: ${A.order}) — ☰ x=${A.menu && r1(A.menu.x)} 노트 x=${A.note && r1(A.note.x)}`);
  C.ok(A.nameRight <= A.navLeft - 4, `${vk}px 작업 화면: 로고 글자(끝 ${r1(A.nameRight)})가 오른쪽 버튼(시작 ${r1(A.navLeft)})에 가려지지 않음`);
  const ov = await intro.page.evaluate(() => document.documentElement.scrollWidth - innerWidth); C.ok(ov <= 1, `${vk}px 작업 화면 가로 넘침 없음 (${ov}px)`);
  await intro.ctx.close();
  // 노트·개인정보·404
  const { page } = await newPage(browser, srv.base, { viewport: { width: w, height: h } });
  for (const [name, u] of [['노트 목록', '/guide/'], ['노트 글', '/guide/how-to-use-instatoon-room/'], ['개인정보', '/privacy/'], ['404', '/없는-페이지/']]) {
    await page.goto(srv.base + u); await page.waitForTimeout(300);
    const N = await page.evaluate(appProbe);
    C.ok(same(I.mark.x, N.mark.x) && same(I.mark.y, N.mark.y) && same(I.bar.h, N.bar.h) && I.name.fs === N.name.fs && I.name.fw === N.name.fw && I.name.ls === N.name.ls && same(I.name.x, N.name.x) && same(I.gap, N.gap), `${vk}px ${name}: 로고 x=${r1(N.mark.x)} y=${r1(N.mark.y)} · 상단 ${r1(N.bar.h)} · 글자 ${N.name.fs}/${N.name.fw}/${N.name.ls} (소개 x=${r1(I.mark.x)} y=${r1(I.mark.y)} · ${r1(I.bar.h)} · ${I.name.fs}/${I.name.fw}/${I.name.ls})`);
    C.ok(N.menu && same(N.menu.x + N.menu.w, N.navRight, 1) && N.menu.x > N.mark.x, `${vk}px ${name}: ☰ 오른쪽 끝 (순서: ${N.order})`);
    C.ok(N.nameRight <= N.navLeft - 4, `${vk}px ${name}: 로고 글자(끝 ${r1(N.nameRight)})가 오른쪽 버튼(시작 ${r1(N.navLeft)})에 가려지지 않음`);
    const ovn = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); C.ok(ovn <= 1, `${vk}px ${name}: 가로 넘침 없음 (${ovn}px)`);
  }
  await page.context().close();
}
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 로고 위치 검사 ${C.fail}건 실패` : '\n[PASS] 로고 위치 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
