// 7단계 검사: 예시 갤러리 — 그림 파일(WebP 두 크기)·용량 한도 / 글(캡션·대체 텍스트) / 홈에서는 접혀 있는 동안 그림 요청 0 /
// 사용 방법 안에서도 열기 전엔 0 / 열면 지연 로딩·크기 지정 / PC 3열·휴대폰 옆으로 넘기는 띠 / "이 예시로 체험해 보기" 글자 링크 하나 / 숨은 체험(반찬가게)이 갤러리와 맞음.
//   node dev/design/gallery.mjs     (먼저 npm run build)
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, newPage, checker, root } from '../lib/harness.mjs';

const C = checker();
const dir = path.join(root, 'deploy', 'assets', 'examples');
const E = JSON.parse(fs.readFileSync(path.join(dir, 'examples.json'), 'utf8'));

// ─── 파일·용량·글 ───
C.ok(E.cuts.length === 6 && E.cuts.every((c, i) => c.n === i + 1 && c.file === `ex1-0${i + 1}`), '예시 6컷(1~6번, ex1-01~06)');
const sizes = { 360: [], 720: [] }, bad = [];
for (const c of E.cuts) for (const w of [360, 720]) { const f = path.join(dir, `${c.file}-${w}.webp`); if (!fs.existsSync(f)) { bad.push(f); continue; } const b = fs.readFileSync(f); sizes[w].push(b.length); if (b.subarray(0, 4).toString() !== 'RIFF' || b.subarray(8, 12).toString() !== 'WEBP') bad.push(f + ' (WebP 아님)'); }
const sum = (a) => a.reduce((x, y) => x + y, 0);
C.ok(!bad.length && sizes[360].every((n) => n <= 40 * 1024) && sum(sizes[360]) <= 250 * 1024, `360폭 WebP 6장: 한 장 40KB 이하·합계 250KB 이하 (합계 ${(sum(sizes[360]) / 1024).toFixed(0)}KB)`);
C.ok(sizes[720].every((n) => n <= 120 * 1024) && sum(sizes[720]) <= 600 * 1024, `720폭 WebP 6장: 한 장 120KB 이하·합계 600KB 이하 (합계 ${(sum(sizes[720]) / 1024).toFixed(0)}KB)`);
C.ok(E.cuts.every((c) => c.role && c.cap && c.alt && c.alt.length >= 30), '컷마다 역할·캡션·대체 텍스트(30자 이상)가 있음');
C.ok(!fs.existsSync(path.join(root, 'deploy', 'assets', 'examples', 'src')), '큰 원본(src/)은 배포 폴더에 들어가지 않음');

// ─── 브라우저 ───
const srv = await serve(); const browser = await launch();
for (const [name, vp] of [['PC', { width: 1300, height: 900 }], ['휴대폰', { width: 390, height: 800 }]]) {
  const { page, errors } = await newPage(browser, srv.base, { viewport: vp, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' }, freeze: false });
  const reqs = []; page.on('request', (r) => { if (/\/assets\/examples\/.+\.webp/.test(r.url())) reqs.push(r.url()); });
  await page.goto(srv.base + '/'); await page.waitForTimeout(1500);
  C.ok(reqs.length === 0 && await page.locator('#exGalIn .exg-f').count() === 0 && await page.locator('#exGal').evaluate((e) => !e.open), `${name}: 홈에서 접혀 있는 동안 예시 그림 요청 0, 그림 칸도 아직 없음`);
  if (name === 'PC') {
    C.ok(await page.locator('#exGal summary').innerText() === '이런 인스타툰이 나와요' && await page.locator('#exGal > summary').evaluate((e) => e.tagName === 'SUMMARY'), '홈 맨 아래에 접힌 글자 한 줄 "이런 인스타툰이 나와요"(버튼이 아님)');
    const before = await page.locator('button').count();
    await page.locator('#exGal summary').click(); await page.waitForTimeout(500);
    const after = await page.locator('button').count();
    C.ok(after - before === 1, `펼치면 늘어나는 버튼은 글자 링크 1개뿐 (${before} → ${after})`);
  } else { await page.locator('#exGal summary').click(); await page.waitForTimeout(500); }
  const g = await page.evaluate(() => { const gr = document.querySelector('#exGalIn .exg-g'); const imgs = [...document.querySelectorAll('#exGalIn img')]; const cs = getComputedStyle(gr); return { n: imgs.length, attrs: imgs.every((i) => i.width && i.height && i.loading === 'lazy' && i.decoding === 'async' && i.alt.length > 20 && /360w.*720w/.test(i.getAttribute('srcset'))), disp: cs.display, cols: cs.gridTemplateColumns.split(' ').length, scroll: gr.scrollWidth > gr.clientWidth + 2, page: document.documentElement.scrollWidth <= innerWidth + 1, fw: Math.round(imgs[0].getBoundingClientRect().width), left: Math.round(imgs[0].getBoundingClientRect().left) }; });
  C.ok(g.n === 6 && g.attrs, `${name}: 펼치면 그림 6장 — 크기(width·height)·지연 로딩·async 디코딩·대체 텍스트·srcset(360w·720w)`);
  if (name === 'PC') C.ok(g.disp === 'grid' && g.cols === 3 && g.page, `PC: 3열 격자, 가로 넘침 없음 (그림 폭 ${g.fw}px)`);
  else C.ok(g.disp === 'flex' && g.scroll && g.page && g.fw > 150 && g.fw < 200 && g.left === 16, `휴대폰: 옆으로 넘기는 띠(화면 폭 안에서만 스크롤), 페이지 가로 넘침 없음 (그림 폭 ${g.fw}px, 첫 그림 왼쪽 ${g.left}px)`);
  await page.locator('#exGalIn img').nth(0).scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
  const dec = await page.evaluate(() => { const i = document.querySelector('#exGalIn img'); return i.naturalWidth; });
  C.ok(dec > 0 && reqs.length >= 1, `${name}: 화면에 보이는 그림만 받아 오고(${reqs.length}개 요청) 실제로 그려짐`);
  const dpr = await page.evaluate(() => document.querySelector('#exGalIn img').currentSrc.replace(location.origin, ''));
  C.ok(/-360\.webp$/.test(dpr) || /-720\.webp$/.test(dpr), `${name}: 화면에 맞는 크기를 골라 받음 (${dpr})`);
  if (name === 'PC') {
    // 체험 링크 → 기존 체험 기능으로 열림, 갤러리와 같은 이야기
    const picks = await page.evaluate(() => demoPicks());
    C.ok((picks.match(/<button/g) || []).length === 3 && !/반찬/.test(picks), '1단계 "체험해 보기" 고르기는 그대로 3개(반찬가게 체험은 숨김)');
    await page.evaluate(() => { S.info.name = '내작업이름'; S.info.type = '카페'; save(); });
    await page.locator('#exGalIn [data-act="exDemo"]').click(); await page.waitForTimeout(700);
    const d = await page.evaluate(() => ({ demo: S.demo, key: S.demoKey, roles: S.toon.cuts.map((c) => c.role), title: S.toon.title, last: S.toon.cuts[5].title.replace(/\n/g, ' '), panels: S.toon.cuts[1].panels }));
    C.ok(d.demo && d.key === 'banchan' && d.roles.length === 6 && d.roles.every((r, i) => r === E.cuts[i].role) && /고객님 덕분에 오늘도 완판 성공!/.test(d.title) && /고객님 덕분에 오늘도 완판 성공!/.test(d.last), `"이 예시로 체험해 보기": 갤러리와 같은 6컷·같은 역할·마지막 컷 "고객님 덕분에 오늘도 완판 성공!" (${d.roles.join('/')})`);
    // 체험 화면이 3단계까지 정상: 프롬프트 만들기
    const gp = await page.evaluate(() => { S.step = 'post'; render(); return { p: gsPrompt(gsBundles()[0]), c: cutPrompt(cuts()[0], 0), s: setupPrompt() }; });
    C.ok(/고객님 덕분에|분명 아침엔/.test(gp.p) && /칸 나누기: 위 칸에는 팬에 볶는 장면/.test(gp.p) && gp.c.length > 100 && gp.s.length > 300, '체험 화면 3단계: 그림 프롬프트·젠스파크 프롬프트가 정상으로 만들어지고, 칸 나누기를 고른 2컷은 그대로 들어감');
    // 끝내면 내 작업으로
    await page.evaluate(() => endDemo()); await page.waitForTimeout(500);
    C.ok(await page.evaluate(() => !S.demo && S.info.name === '내작업이름' && S.info.type === '카페'), '체험을 끝내면 내 작업(업종·이름)이 그대로 돌아옴');
  }
  if (errors.length) C.ok(false, `${name} 콘솔 오류: ` + errors.slice(0, 2).join(' | '));
  await page.close();
}
// 사용 방법 안 갤러리: 열기 전에는 그림 요청이 0, 열면 6장이 지연 로딩으로 나옴
{ const { page } = await newPage(browser, srv.base, { viewport: { width: 1300, height: 900 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' }, freeze: false });
  const r = []; page.on('request', (x) => { if (/\/assets\/examples\/.+\.webp/.test(x.url())) r.push(x.url()); });
  await page.goto(srv.base + '/'); await page.waitForTimeout(2500);
  C.ok(r.length === 0, '사용 방법을 열지 않으면 첫 화면에서 예시 그림 요청이 0');
  await page.evaluate(() => toggleHelp(true)); await page.waitForTimeout(800);
  C.ok(await page.locator('#help .exg-f').count() === 6 && await page.locator('#help [data-act="exDemo"]').count() === 1 && await page.locator('#help img[loading="lazy"]').count() === 6, '사용 방법 안 "이렇게 나와요"가 그림 갤러리(6장, 지연 로딩)로 바뀌고 체험 링크는 1개');
  C.ok(!/<ol class="exl">/.test(await page.locator('#help').innerHTML()), '옛 글자 목록 예시는 없어짐');
  await page.close(); }
// 노트 글(사용법)에 들어간 같은 갤러리: examples.json 그대로, 대체 텍스트·크기·지연 로딩
for (const [name, vp, cols] of [['PC', { width: 1300, height: 900 }, 3], ['휴대폰', { width: 390, height: 800 }, 2]]) {
  const { page, errors } = await newPage(browser, srv.base, { viewport: vp, freeze: false });
  const r = []; page.on('request', (x) => { if (/\/assets\/examples\/.+\.webp/.test(x.url())) r.push(x.url()); });
  await page.goto(srv.base + '/guide/how-to-use-instatoon-room/'); await page.waitForTimeout(1500);
  const before = r.length;
  const g = await page.evaluate(() => { const f = [...document.querySelectorAll('.gal-f')], im = f.map((x) => x.querySelector('img')), gr = document.querySelector('.gal-g');
    return { n: f.length, h2: document.querySelector('.gal').closest('section').querySelector('h2').textContent, caps: f.map((x) => x.querySelector('figcaption').textContent), alts: im.map((i) => i.alt), attrs: im.every((i) => i.getAttribute('width') === '360' && i.getAttribute('height') === '360' && i.loading === 'lazy' && i.decoding === 'async' && /360w.*720w/.test(i.getAttribute('srcset'))), cols: getComputedStyle(gr).gridTemplateColumns.split(' ').length, over: document.documentElement.scrollWidth <= innerWidth + 1, note: document.querySelector('.gal-n').textContent }; });
  C.ok(g.n === 6 && g.attrs && g.over, `${name}: 노트 글에 갤러리 6장 — 크기·지연 로딩·async·srcset, 가로 넘침 없음`);
  C.ok(g.cols === cols, `${name}: 노트 글 갤러리 ${cols}열`);
  C.ok(g.caps.every((t, i) => t === `${E.cuts[i].n}컷 · ${E.cuts[i].role}${E.cuts[i].cap}`) && g.alts.every((a, i) => a === E.cuts[i].alt) && g.note.includes(E.title) && g.note.includes(E.note), `${name}: 노트 글의 캡션·대체 텍스트·제목·안내가 examples.json과 글자까지 같음(앱과 같은 데이터)`);
  await page.locator('.gal').scrollIntoViewIfNeeded(); await page.waitForTimeout(1200);
  C.ok(r.length === 6, `${name}: 갤러리 쪽으로 내려가면 그림 6장을 모두 받아 옴 (처음 ${before}개 → ${r.length}개, 브라우저가 가까워지면 미리 받음)`);
  if (name === 'PC') C.ok(g.h2.includes('예시 한 편'), '사용법 글 3단계 다음 "이렇게 나와요: 예시 한 편" 섹션 안에 있음');
  if (errors.length) C.ok(false, `${name} 노트 글 콘솔 오류: ` + errors.slice(0, 2).join(' | '));
  await page.close();
}
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 예시 갤러리 검사 ${C.fail}건 실패` : '\n[PASS] 예시 갤러리 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
