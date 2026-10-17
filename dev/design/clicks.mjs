// 클릭 끊김 검사: 1단계의 선택 버튼을 실제 마우스 클릭으로 전부 눌러 보고 선택 저장·표시·프롬프트 반영을 확인
//   node dev/design/clicks.mjs
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();
const LS = { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' };

for (const [vk, vp] of [['PC 1300', { width: 1300, height: 900 }], ['휴대폰 390', { width: 390, height: 844 }]]) {
  const { page, errors } = await newPage(browser, srv.base, { viewport: vp, ls: LS });
  await page.goto(srv.base + '/'); await page.waitForTimeout(500);

  // 1) 웹툰 테마: 전부 눌러서 선택·요약줄 이름/썸네일·프롬프트가 바뀌는지
  await page.click('#artsBox summary'); await page.waitForTimeout(150);
  const keys = await page.$$eval('#artsBox .pick[data-art]', (b) => b.map((x) => x.dataset.art));
  let bad = [];
  for (const k of keys) {
    await page.click(`#artsBox [data-art="${k}"]`); await page.waitForTimeout(60);
    const r = await page.evaluate((k) => {
      const nm = ARTS[k].name, sm = document.querySelector('#artsBox summary'), im = sm.querySelector('.art-thumb');
      return { saved: S.info.art === k && JSON.parse(localStorage.getItem(Object.keys(localStorage).find((x) => /state|instatoon\.s/i.test(x)) || '') || '{}') !== null,
        only: [...document.querySelectorAll('#artsBox [data-art]')].every((c) => (c.getAttribute('aria-pressed') === 'true') === (c.dataset.art === k)),
        name: sm.querySelector('.art-sumt small').textContent === nm,
        thumb: !sampleOf(k) || (!!im && im.getAttribute('src') === sampleOf(k)),
        prompt: artBlock().includes(nm) && cutPrompt(cuts()[0] || {}, 0) !== undefined };
    }, k).catch((e) => ({ err: String(e).slice(0, 80) }));
    if (r.err || !(r.only && r.name && r.thumb && r.saved && r.prompt)) bad.push(k + JSON.stringify(r));
  }
  C.ok(keys.length >= 2 && !bad.length, `${vk} 웹툰 테마 ${keys.length}개 모두: 선택 저장·aria-pressed·요약줄 이름/썸네일·프롬프트 반영${bad.length ? ' ← ' + bad[0] : ''}`);
  // 새로고침해도 마지막 선택이 남음
  const last = keys[keys.length - 1];
  await page.reload(); await page.waitForTimeout(500);
  C.ok(await page.evaluate((k) => S.info.art === k && document.querySelector('#artsBox summary small').textContent === ARTS[k].name && document.querySelector(`#artsBox [data-art="${k}"]`).getAttribute('aria-pressed') === 'true', last), `${vk} 새로고침 뒤에도 고른 테마 유지`);

  // 2) 캐릭터 칸: 보관함에서 고르기 / 새로 만들기 (주인공·조연)
  const vaultOpen = () => page.evaluate(() => { const w = document.getElementById('vaultSheet'); return !!w && !w.hidden && w.getClientRects().length > 0; });
  const closeV = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(120); if (await vaultOpen()) await page.evaluate(() => { const w = document.getElementById('vaultSheet'); if (w) w.hidden = true; }); };
  for (const [v, label] of [['pick', '보관함에서 고르기'], ['newslot', '새로 만들기']]) {
    const n = await page.$$eval(`.cast [data-v="${v}"]`, (b) => b.length); let okc = 0;
    for (let i = 0; i < n; i++) {
      await page.locator(`.cast [data-v="${v}"]`).nth(i).click(); await page.waitForTimeout(250);
      if (await vaultOpen()) okc++; await closeV();
    }
    C.ok(n === 2 && okc === n, `${vk} 캐릭터 "${label}" ${n}개 모두 눌림(${okc}/${n}) → 보관함 창 열림`);
  }

  // 3) 더 자세히 설정하기: 대본 유형·컷 수·비율·분위기·이야기 방식·한 장 구성·디테일
  await page.evaluate(() => { document.querySelector('#moreAll').open = true; });
  const groups = [['kind', (v) => S.info.kind === v], ['cuts', (v) => String(S.info.cuts) === v], ['ratio', (v) => S.info.ratio === v], ['tone', (v) => S.info.tone === v], ['mode', (v) => S.info.mode === v], ['layout', (v) => S.info.layout === v]];
  for (const [g] of groups) {
    const vals = await page.$$eval(`#moreAll [data-${g}]`, (b, g) => b.map((x) => x.dataset[g]), g); let badg = [];
    for (const v of vals) {
      const dd = page.locator(`#moreAll .dd:has([data-${g}="${v}"]) .dd-btn`);
      if (await dd.count() && !(await page.locator(`#moreAll [data-${g}="${v}"]`).isVisible())) { await dd.first().click(); await page.waitForTimeout(80); }
      try { await page.locator(`#moreAll [data-${g}="${v}"]`).click({ timeout: 2000 }); } catch (e) { badg.push(v + ':클릭불가'); continue; }
      await page.waitForTimeout(60);
      const r = await page.evaluate(([g, v]) => { const st = { kind: S.info.kind, cuts: String(S.info.cuts), ratio: S.info.ratio, tone: S.info.tone, mode: S.info.mode, layout: S.info.layout }[g];
        return st === v && [...document.querySelectorAll(`#moreAll [data-${g}]`)].every((c) => (c.getAttribute('aria-pressed') === 'true') === (c.dataset[g] === v)); }, [g, v]);
      if (!r) badg.push(v);
    }
    C.ok(vals.length >= 2 && !badg.length, `${vk} 더 자세히 · ${g} ${vals.length}개 모두 눌러 선택 저장·표시${badg.length ? ' ← ' + badg.join(',') : ''}`);
  }
  {
    const vals = await page.$$eval('#moreAll [data-detail]', (b) => b.map((x) => x.dataset.detail)); let badg = [];
    for (const v of vals) {
      const dd = page.locator(`#moreAll .dd:has([data-detail="${v}"]) .dd-btn`);
      if (!(await page.locator(`#moreAll [data-detail="${v}"]`).isVisible())) { await dd.first().click(); await page.waitForTimeout(80); }
      const before = await page.evaluate((v) => detailOn(v), v);
      try { await page.locator(`#moreAll [data-detail="${v}"]`).click({ timeout: 2000 }); } catch (e) { badg.push(v + ':클릭불가'); continue; }
      await page.waitForTimeout(60);
      const r = await page.evaluate(([v, before]) => detailOn(v) === !before && document.querySelector(`#moreAll [data-detail="${v}"]`).getAttribute('aria-pressed') === String(!before), [v, before]);
      if (!r) badg.push(v);
    }
    C.ok(vals.length >= 4 && !badg.length, `${vk} 더 자세히 · 디테일 ${vals.length}개 모두 눌러 켜짐/꺼짐 저장·표시${badg.length ? ' ← ' + badg.join(',') : ''}`);
  }
  C.ok(!errors.length, `${vk} 클릭 검사: 페이지 오류 없음${errors[0] ? ' ← ' + errors[0] : ''}`);
  await page.close();
}

// 4) 내 가게 설정: 홈의 "내 가게 설정 ›" → 창이 열리고, 안의 버튼(목록으로, 닫기)이 눌림
{
  const { page, errors } = await newPage(browser, srv.base, { viewport: { width: 390, height: 844 }, ls: LS });
  await page.goto(srv.base + '/'); await page.waitForTimeout(400);
  await page.click('#main [data-shop="settings"]'); await page.waitForTimeout(250);
  C.ok(await page.evaluate(() => { const w = document.getElementById('shopSheet'); return !!w && !w.hidden && w.querySelector('h2').textContent === '내 가게 설정'; }), '내 가게 설정 › 눌림 → 설정 창 열림');
  await page.fill('#pf-voice', '다정한 존댓말'); await page.waitForTimeout(100);
  C.ok(await page.evaluate(() => S.profile.voice === '다정한 존댓말' && /다정한 존댓말/.test(infoBlock())), '내 가게 설정 입력 → 저장 → 프롬프트 반영');
  await page.click('#shopSheet [data-shop="listback"]'); await page.waitForTimeout(150);
  C.ok(await page.evaluate(() => document.querySelector('#shopSheet h2').textContent === '가게'), '내 가게 설정 안의 "가게 목록" 버튼 눌림');
  C.ok(!errors.length, `내 가게 설정 클릭: 페이지 오류 없음${errors[0] ? ' ← ' + errors[0] : ''}`);
  await page.close();
}
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 클릭 검사 ${C.fail}건 실패` : '\n[PASS] 클릭 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
