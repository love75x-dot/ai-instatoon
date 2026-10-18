// 6단계 검사: 글꼴 직접 호스팅 — 외부 글꼴 서버 없음 / 모든 @font-face가 font-display: swap · woff2 파일이 실제로 있음 /
// 첫 화면 글자 조각만 preload(전부 실제로 쓰임) / 긴 캐시 헤더 / 그림 글자용 글꼴(Gothic A1 800·Black Han Sans·Gaegu 700)이 캔버스에서 불러와짐.
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
const pre = JSON.parse(fs.readFileSync(path.join(root, 'site', 'font-preload.json'), 'utf8'));
const tags = (h) => [...h.matchAll(/<link rel="preload" href="(\/assets\/fonts\/pretendard\/[^"]+)" as="font" type="font\/woff2" crossorigin>/g)].map((m) => path.basename(m[1]));
// 앱 홈의 글자 조각 preload는 소개 화면 방문자에게 필요 없어서 소개 판단 스크립트 뒤의 작은 스크립트가 html.intro 가 아닐 때만 넣는다(site/build.mjs appPreload)
const scriptPre = (h) => { const m = h.match(/classList\.contains\('intro'\)\)return;(\[[^\]]*\])\.forEach/); return m ? JSON.parse(m[1]).map((u) => path.basename(u)) : []; };
C.ok(tags(pages['앱홈']).length === 0 && JSON.stringify(scriptPre(pages['앱홈'])) === JSON.stringify(pre.app) && pre.app.length > 0 && pre.app.length <= 14, `앱 홈 preload ${pre.app.length}개(14개 이하, 소개 화면이 아닐 때만 스크립트로)가 font-preload.json과 같음`);
C.ok(JSON.stringify(tags(pages['노트목록'])) === JSON.stringify(pre.guide) && JSON.stringify(tags(pages['노트글'])) === JSON.stringify(pre.guide) && pre.guide.length <= 14, `노트 페이지 preload ${pre.guide.length}개가 font-preload.json과 같음`);
C.ok(!/rel="preload"[^>]*toon\//.test(pages['앱홈']), '그림 글자용 글꼴은 preload하지 않음(첫 화면에 안 씀)');
C.ok(/\.subset\.\d+\.woff2/.test(pre.app[0]) && pre.app.every((n) => fs.existsSync(path.join(fontDir, 'pretendard', n))), 'preload 파일이 모두 있음');

// ─── 헤더 ───
const hd = fs.readFileSync(path.join(root, 'site', '_headers'), 'utf8').replace(/\r\n/g, '\n');
C.ok(/\/assets\/fonts\/pretendard\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/.test(hd) && /\/assets\/fonts\/toon\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/.test(hd) && /^\/\*\n(\s+[A-Za-z-]+: .*\n){4}/m.test(hd), '글꼴 파일 1년 캐시 규칙이 있고 보안 헤더 4개 규칙은 그대로');
C.ok(fs.readFileSync(path.join(root, 'deploy', '_headers'), 'utf8').replace(/\r\n/g, '\n') === hd, 'deploy/_headers가 site/_headers와 같음');

// ─── 브라우저: 실제로 쓰이는지 ───
const srv = await serve(); const browser = await launch();
const { page, errors } = await newPage(browser, srv.base, { viewport: { width: 390, height: 800 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' }, freeze: false });
const got = new Set(), warns = [];
page.on('response', (r) => { const m = r.url().match(/\/assets\/fonts\/pretendard\/([^/?]+\.woff2)/); if (m) got.add(m[1]); });
page.on('console', (m) => { if (/preload/i.test(m.text())) warns.push(m.text()); });
await page.goto(srv.base + '/'); await page.waitForTimeout(3500);
C.ok(pre.app.every((n) => got.has(n)), `앱 홈에서 preload한 ${pre.app.length}개 글자 조각을 모두 실제로 받아 씀`);
C.ok(!warns.length, 'preload했지만 안 쓰였다는 브라우저 경고가 없음' + (warns[0] ? ' ← ' + warns[0].slice(0, 100) : ''));
const ext = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name).filter((u) => /jsdelivr|fonts\.g/.test(u)));
C.ok(ext.length === 0, '앱 홈이 외부 글꼴 서버에 요청하지 않음');
const used = await page.evaluate(async () => { await document.fonts.ready; return { pre: document.fonts.check('16px "Pretendard Variable"', '인스타툰 연재실'), fam: getComputedStyle(document.body).fontFamily.slice(0, 40), loaded: [...document.fonts].filter((f) => f.status === 'loaded' && f.family.includes('Pretendard')).length }; });
C.ok(used.pre && used.loaded >= pre.app.length, `화면 글꼴 Pretendard가 직접 호스팅 파일로 적용됨 (불러온 조각 ${used.loaded}개)`);
const toonOk = await page.evaluate(async () => { const r = {}; for (const [k, spec] of [['Gothic A1', '800 34px "Gothic A1"'], ['Black Han Sans', '400 80px "Black Han Sans"'], ['Gaegu', '700 44px "Gaegu"']]) { const f = await document.fonts.load(spec, '가나다 오후 3시'); r[k] = f.length; } return r; });
C.ok(Object.values(toonOk).every((n) => n > 0), `그림 글자용 글꼴 3종이 직접 호스팅 파일에서 불러와짐 (${JSON.stringify(toonOk)})`);
const cv = await page.evaluate(async () => { S = demoState('bakery'); S.demo = false; await loadFonts(cuts()[0]); const c = document.createElement('canvas'); await compose(c, cuts()[0]); return c.width + 'x' + c.height; });
C.ok(/^1080x/.test(cv), `그림 글자 캔버스(compose)가 직접 호스팅 글꼴로 그려짐 (${cv})`);
if (errors.length) C.ok(false, '콘솔 오류: ' + errors.slice(0, 2).join(' | '));
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 글꼴 검사 ${C.fail}건 실패` : '\n[PASS] 글꼴 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
