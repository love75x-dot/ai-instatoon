// 파일 버전(site/instatoon.html)을 디스크에서 직접 열었을 때(file://, site/assets/ 와 같은 곳): 샘플 그림·예시 갤러리 그림이 보이고 화면 오류가 없는지.
// 배포 버전(deploy/index.html)은 /assets/ 절대 주소를 그대로 쓴다.
//   node dev/design/filever.mjs     (먼저 npm run build)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch, checker, root } from '../lib/harness.mjs';

const C = checker();
const file = fs.readFileSync(path.join(root, 'site', 'instatoon.html'), 'utf8'), dep = fs.readFileSync(path.join(root, 'deploy', 'index.html'), 'utf8');
C.ok(!/["'(]\/assets\//.test(file) && /["'(]assets\//.test(file), '파일 버전에는 절대 주소(/assets/)가 없고 상대 주소(assets/…)만 있음');
C.ok(/(src|href)="\/assets\//.test(dep) && !/(src|href)="assets\//.test(dep) && !/url\(assets\//.test(dep), '배포 버전은 절대 주소(/assets/…) 그대로(상대 주소 없음)');

const browser = await launch(); const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } }); const page = await ctx.newPage();
const errs = [], failed = [];
page.on('pageerror', (e) => errs.push(e.message)); page.on('requestfailed', (r) => { if (/\/assets\/(samples|examples)\//.test(r.url())) failed.push(r.url().split('/assets/')[1]); });
await page.route(/^https?:/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' })); // 외부 주소(JSZip 등)는 막음
await page.addInitScript(() => { try { localStorage.setItem('instatoon.helpSeen', '1'); localStorage.setItem('instatoon.key', 'TEST'); } catch (_) {} });
await page.goto(pathToFileURL(path.join(root, 'site', 'instatoon.html')).href); await page.waitForTimeout(1800);
const t = await page.evaluate(async () => { const i = document.querySelector('img.art-thumb'); if (i) await i.decode().catch(() => {}); return { thumb: i ? i.naturalWidth : -1, src: i && i.getAttribute('src') }; });
C.ok(t.thumb > 0 && /^assets\/samples\//.test(t.src), `파일 버전: 웹툰 테마 샘플 그림이 디스크의 assets/에서 보임 (${t.src})`);
await page.evaluate(() => toggleHelp(true)); await page.waitForTimeout(800);
await page.locator('#help .hex img').first().scrollIntoViewIfNeeded(); await page.waitForTimeout(1200);
const su = await page.evaluate(() => [safeUrl('assets/samples/chibi.jpg'), safeUrl('assets/samples/../../x.png'), safeUrl('javascript:alert(1)'), safeUrl('assets/other/x.png'), safeUrl('//evil.example/x.png')]);
C.ok(su[0] === 'assets/samples/chibi.jpg' && su[1] === '' && su[2] === '' && su[3] === '' && su[4] === '', `safeUrl은 우리 샘플 그림만 상대 주소로 허용하고 나머지 상대 주소·스크립트·'//'(프로토콜 생략) 주소는 막음 (${JSON.stringify(su)})`);
const g = await page.evaluate(() => { const im = [...document.querySelectorAll('#help .hex img')]; return { n: im.length, ok: im.filter((i) => i.complete && i.naturalWidth > 0).length }; });
C.ok(g.n === 6 && g.ok === 6, `파일 버전: 예시 갤러리 그림 6장이 모두 보임 (${g.ok}/${g.n})`);
C.ok(!failed.length, '파일 버전: 샘플·예시 그림 파일을 못 불러온 요청이 없음(글꼴은 file://에서 브라우저가 막아 기본 글꼴로 보임)' + (failed[0] ? ' ← ' + failed[0] : ''));
C.ok(!errs.length, '파일 버전: 화면 오류 없음' + (errs[0] ? ' ← ' + errs[0].slice(0, 100) : ''));
await browser.close();
console.log(C.fail ? `\n[FAIL] 파일 버전 검사 ${C.fail}건 실패` : '\n[PASS] 파일 버전 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
