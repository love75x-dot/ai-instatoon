// 6단계 검사: 글꼴 직접 호스팅 — 외부 글꼴 서버 없음 / 모든 @font-face가 font-display: swap · woff2 파일이 실제로 있음 /
// 화면 글꼴 IntroSquare(400·700·800)만 preload(전부 실제로 쓰임, Pretendard는 조각에 없는 글자용 대체라 preload 안 함) / 긴 캐시 헤더 / 그림 글자용 글꼴(Gothic A1 800·Black Han Sans·Gaegu 700)이 캔버스에서 불러와짐.
//   node dev/design/fonts.mjs     (먼저 npm run build)
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, newPage, checker, root } from '../lib/harness.mjs';

const C = checker();
const dep = (p) => fs.readFileSync(path.join(root, 'deploy', p), 'utf8');
const pages = { 앱홈: dep('index.html'), 노트목록: dep('guide/index.html'), 노트글: dep('guide/instatoon-troubleshooting/index.html'), 개인정보: dep('privacy/index.html'), '404': dep('404.html') };

// ─── 외부 글꼴 서버를 쓰지 않음 ───
for (const [n, h] of Object.entries(pages)) C.ok(!/cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(h.replace(/https:\/\/generativelanguage\.googleapis\.com/g, '')), `${n}: jsDelivr·Google Fonts 주소가 없음`);
const priv = pages['개인정보'];
C.ok(!/jsDelivr|Google Fonts/.test(priv) && /글꼴은 이 사이트에서 직접 제공/.test(priv) && /cdnjs\.cloudflare\.com/.test(priv) && /challenges\.cloudflare\.com/.test(priv), '개인정보처리방침의 외부 요청 안내가 바뀐 구조(글꼴은 직접 제공, 남은 외부: cdnjs·Turnstile)와 맞음');

// ─── CSS와 woff2 파일 ───
const fontDir = path.join(root, 'deploy', 'assets', 'fonts');
const isq = fs.readFileSync(path.join(fontDir, 'introsquare.css'), 'utf8'), isqFaces = isq.match(/@font-face\s*\{[^}]*\}/g) || [], isqUrls = [...isq.matchAll(/url\("?(\/assets\/fonts\/[^)"]+)"?\)/g)].map((m) => m[1]);
C.ok(isqFaces.length === 3 && isqFaces.every((x) => /font-display:\s*swap/.test(x)) && isqUrls.length === 3 && isqUrls.every((u) => fs.existsSync(path.join(root, 'deploy', u)) && fs.readFileSync(path.join(root, 'deploy', u)).subarray(0, 4).toString() === 'wOF2') && !/https?:\/\//.test(isq), 'introsquare.css: @font-face 3개(400·700·800) 모두 swap, 진짜 woff2가 있고 외부 주소 없음');
for (const name of ['pretendard', 'toon']) {
  const css = fs.readFileSync(path.join(fontDir, name + '.css'), 'utf8');
  const faces = css.match(/@font-face\s*\{[^}]*\}/g) || [];
  const urls = [...css.matchAll(/url\((\/assets\/fonts\/[^)]+)\)/g)].map((m) => m[1]);
  const missing = urls.filter((u) => !fs.existsSync(path.join(root, 'deploy', u)));
  const badMagic = urls.filter((u) => fs.existsSync(path.join(root, 'deploy', u)) && fs.readFileSync(path.join(root, 'deploy', u)).subarray(0, 4).toString() !== 'wOF2');
  C.ok(faces.length > 80 && faces.every((f) => /font-display:\s*swap/.test(f)) && urls.length === faces.length, `${name}.css: @font-face ${faces.length}개 모두 font-display: swap, 글꼴 주소 ${urls.length}개`);
  C.ok(!missing.length && !badMagic.length && urls.every((u) => /\.woff2$/.test(u)), `${name}: 글꼴 파일이 모두 있고 진짜 woff2 (${urls.length}개, 없음 ${missing.length}, 형식 오류 ${badMagic.length})`);
  C.ok(!/https?:\/\//.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), `${name}.css: 외부 주소 없음(같은 사이트 주소만)`);
}
const toon = fs.readFileSync(path.join(fontDir, 'toon.css'), 'utf8');
C.ok(/font-family:\s*'Gothic A1'[^}]*font-weight:\s*800/.test(toon) && /font-family:\s*'Black Han Sans'/.test(toon) && /font-family:\s*'Gaegu'[^}]*font-weight:\s*700/.test(toon), '그림 글자용 글꼴 3종(Gothic A1 800 · Black Han Sans · Gaegu 700)이 toon.css에 있음');
C.ok(/<link rel="stylesheet" href="\/assets\/fonts\/toon\.css" media="print" onload="this\.media='all'">/.test(pages['앱홈']), '그림 글자용 CSS는 화면을 막지 않게 늦게 불러옴');

// ─── preload ───
const INTRO = ['IntroSquare-400.woff2', 'IntroSquare-700.woff2', 'IntroSquare-800.woff2'];
const tags = (h) => [...h.matchAll(/<link rel="preload" href="(\/assets\/fonts\/introsquare\/[^"]+)" as="font" type="font\/woff2" crossorigin>/g)].map((m) => path.basename(m[1]));
// 앱 홈의 글꼴 preload는 소개 화면 방문자에게는 소개 쪽 스크립트가 따로 하므로, 소개 판단 스크립트 뒤의 작은 스크립트가 html.intro 가 아닐 때만 넣는다(site/build.mjs appPreload)
const scriptPre = (h) => { const m = h.match(/classList\.contains\('intro'\)\)return;(\[[^\]]*\])\.forEach/); return m ? JSON.parse(m[1]).map((u) => path.basename(u)) : []; };
C.ok(tags(pages['앱홈']).length === 0 && JSON.stringify(scriptPre(pages['앱홈'])) === JSON.stringify(INTRO), '앱 홈 preload는 IntroSquare 3개(소개 화면이 아닐 때만 스크립트로)');
C.ok(JSON.stringify(tags(pages['노트목록'])) === JSON.stringify(INTRO) && JSON.stringify(tags(pages['노트글'])) === JSON.stringify(INTRO) && JSON.stringify(tags(pages['개인정보'])) === JSON.stringify(INTRO) && JSON.stringify(tags(pages['404'])) === JSON.stringify(INTRO), '노트·개인정보·404 preload는 IntroSquare 3개');
C.ok(!/rel="preload"[^>]*toon\//.test(pages['앱홈']) && !/rel="preload"[^>]*pretendard\//.test(pages['앱홈'] + pages['노트글']), '그림 글자용 글꼴·Pretendard(대체)는 preload하지 않음');
C.ok(INTRO.every((n) => fs.existsSync(path.join(fontDir, 'introsquare', n))), 'preload 파일이 모두 있음');

// ─── 헤더 ───
const hd = fs.readFileSync(path.join(root, 'site', '_headers'), 'utf8').replace(/\r\n/g, '\n');
C.ok(/\/assets\/fonts\/pretendard\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/.test(hd) && /\/assets\/fonts\/toon\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/.test(hd) && /^\/\*\n(\s+[A-Za-z-]+: .*\n){4}/m.test(hd), '글꼴 파일 1년 캐시 규칙이 있고 보안 헤더 4개 규칙은 그대로');
C.ok(fs.readFileSync(path.join(root, 'deploy', '_headers'), 'utf8').replace(/\r\n/g, '\n') === hd, 'deploy/_headers가 site/_headers와 같음');

// ─── 브라우저: 실제로 쓰이는지 ───
const srv = await serve(); const browser = await launch();
const { page, errors } = await newPage(browser, srv.base, { viewport: { width: 390, height: 800 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' }, freeze: false });
const got = new Set(), pgot = new Set(), warns = [];
page.on('response', (r) => { const m = r.url().match(/\/assets\/fonts\/introsquare\/([^/?]+\.woff2)/); if (m) got.add(m[1]); const p = r.url().match(/\/assets\/fonts\/pretendard\/([^/?]+\.woff2)/); if (p) pgot.add(p[1]); });
page.on('console', (m) => { if (/preload/i.test(m.text())) warns.push(m.text()); });
await page.goto(srv.base + '/'); await page.waitForTimeout(3500);
C.ok(INTRO.every((n) => got.has(n)), `앱 홈에서 preload한 IntroSquare ${INTRO.length}개를 모두 실제로 받아 씀`);
C.ok(!warns.length, 'preload했지만 안 쓰였다는 브라우저 경고가 없음' + (warns[0] ? ' ← ' + warns[0].slice(0, 100) : ''));
const ext = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name).filter((u) => /jsdelivr|fonts\.g/.test(u)));
C.ok(ext.length === 0, '앱 홈이 외부 글꼴 서버에 요청하지 않음');
const used = await page.evaluate(async () => { await document.fonts.ready; return { isq: document.fonts.check('16px "IntroSquare"', '인스타툰 연재실'), fam: getComputedStyle(document.body).fontFamily.slice(0, 20), loaded: [...document.fonts].filter((f) => f.status === 'loaded' && f.family.includes('IntroSquare')).length }; });
C.ok(used.isq && /IntroSquare/.test(used.fam) && used.loaded >= 3, `화면 글꼴 IntroSquare가 직접 호스팅 파일로 적용됨 (불러온 굵기 ${used.loaded}개, body ${used.fam})`);
C.ok(pgot.size <= 2, `앱 첫 화면에서 Pretendard(대체)는 원본 글꼴에 없는 기호(› 등)용으로만 최대 2개 (${pgot.size}개)`);
// 자모(ㅋㅋ·ㅠㅠ)는 IntroSquare가 직접 그리고, 조각에 없는 드문 글자(뷁)는 Pretendard가 대신 그려서 빈칸(□)이 되지 않음
const cov = await page.evaluate(async () => { await document.fonts.load('800 40px "IntroSquare"', 'ㅋㅠ'); await document.fonts.load('400 40px "Pretendard Variable"', '뷁'); const c = document.createElement('canvas').getContext('2d'), w = (font, s) => { c.font = font; return c.measureText(s).width; };
  return { jamo: w('800 40px "IntroSquare", monospace', 'ㅋㅠ') !== w('800 40px monospace', 'ㅋㅠ'), rare: w('400 40px "IntroSquare","Pretendard Variable", monospace', '뷁') === w('400 40px "Pretendard Variable", monospace', '뷁'), rareNotMono: w('400 40px "Pretendard Variable", monospace', '뷁') !== w('400 40px monospace', '뷁') }; });
C.ok(cov.jamo && cov.rare && cov.rareNotMono, `자모는 IntroSquare, 드문 글자는 Pretendard가 대신 그림 (${JSON.stringify(cov)})`);
const toonOk = await page.evaluate(async () => { const r = {}; for (const [k, spec] of [['Gothic A1', '800 34px "Gothic A1"'], ['Black Han Sans', '400 80px "Black Han Sans"'], ['Gaegu', '700 44px "Gaegu"']]) { const f = await document.fonts.load(spec, '가나다 오후 3시'); r[k] = f.length; } return r; });
C.ok(Object.values(toonOk).every((n) => n > 0), `그림 글자용 글꼴 3종이 직접 호스팅 파일에서 불러와짐 (${JSON.stringify(toonOk)})`);
const cv = await page.evaluate(async () => { S = demoState('bakery'); S.demo = false; await loadFonts(cuts()[0]); const c = document.createElement('canvas'); await compose(c, cuts()[0]); return c.width + 'x' + c.height; });
C.ok(/^1080x/.test(cv), `그림 글자 캔버스(compose)가 직접 호스팅 글꼴로 그려짐 (${cv})`);
if (errors.length) C.ok(false, '콘솔 오류: ' + errors.slice(0, 2).join(' | '));
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 글꼴 검사 ${C.fail}건 실패` : '\n[PASS] 글꼴 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
