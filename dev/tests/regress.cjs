// 배포 폴더(deploy/)를 로컬 서버로 띄워 실제 브라우저(Playwright)로 메인 앱과 가이드 페이지를 확인한다.
// 실행: NODE_PATH=<playwright가 설치된 node_modules> node dev/tests/regress.cjs   (Gemini·폰트·CDN 요청은 가짜 응답)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const dep = path.resolve(__dirname, '../../deploy');
const types = { '.html': 'text/html; charset=utf-8', '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.js': 'text/javascript' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]), f = path.join(dep, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(fs.readFileSync(path.join(dep, '404.html'))); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(0);
const toon = { title: '손님이 사라졌다', hooks: ['a\nb'], cuts: Array.from({ length: 4 }, (_, i) => ({ role: 'r', shot: '미디엄샷', title: i ? '' : '손님이\n사라졌다', highlight: '', sub: '', bubble: '사장님: 좋아', bubbleSide: 'l', sfx: '', direction: 'd', panels: '', caption: '', extras: '' })), caption: '테스트 캡션', hashtags: '#a', comment: 'x', reelCaption: 'r', reelHashtags: '#r', reelComment: 'rc', endHead: '내일도\n문 열어요', endBtn: '네이버 예약', cast: '', ideas: [] };
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('[FAIL]', m); } else console.log('[PASS]', m); };

(async () => {
  const base = `http://localhost:${srv.address().port}`;
  const b = await chromium.launch();
  const errs = [];
  const mk = async (vp) => {
    const ctx = await b.newContext({ viewport: vp });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::/.test(m.text())) errs.push(m.text()); });
    await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await p.route(/cdnjs\.cloudflare\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    await p.route(/googletagmanager\.com|google-analytics\.com/, (r) => r.abort());
    await p.route('**generativelanguage.googleapis.com/**', (r) => r.fulfill({ json: { candidates: [{ content: { parts: [{ text: JSON.stringify(toon) }] } }] } }));
    return p;
  };

  // 1) 데스크톱: 메인 로딩, 업종 선택, 대본 생성, 3단계
  const p = await mk({ width: 1300, height: 1000 });
  await p.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.clear(); localStorage.setItem('instatoon.key', 'TEST'); localStorage.setItem('instatoon.helpSeen', '1'); } });
  const r0 = await p.goto(base + '/'); await p.waitForTimeout(800);
  ok(r0.status() === 200, '메인 200');
  ok(await p.locator('a[href="/guide/"]').count() >= 2, '메인에 콘텐츠 가이드 링크(상단+하단)');
  ok(await p.locator('footer.gfoot a[href="/about/"], footer.gfoot a[href="/privacy/"]').count() >= 2, '메인 하단에 소개/개인정보 링크');
  ok(await p.locator('[data-ind="카페"]').count() === 1, '업종 칩 표시(앱 렌더링)');
  await p.click('[data-ind="카페"]'); await p.fill('#i-name', '테스트카페'); await p.fill('#i-offer', '신메뉴 출시');
  await p.click('#makeBtn'); await p.waitForTimeout(1500);
  ok((await p.locator('.cutlist .cut, .cutlist > *').count()) >= 4, '대본 생성 후 컷 카드 표시');
  await p.click('.actions [data-step="post"]'); await p.waitForTimeout(500);
  ok((await p.textContent('body')).includes('테스트 캡션'), '3단계에 캡션 표시');
  ok(await p.locator('[data-copy]').count() > 0, '복사 버튼 존재');
  await p.screenshot({ path: process.env.SHOT_DIR ? path.join(process.env.SHOT_DIR, 'main-step3.png') : undefined });
  // 저장/불러오기 버튼, 사용 방법
  await p.click('[data-act="help"]'); await p.waitForTimeout(300);
  ok(await p.locator('#help:not([hidden])').count() === 1, '사용 방법 열림');
  // 저장 공간 가득 참 → 사용자에게 알림(조용히 실패하지 않음)
  await p.evaluate(() => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'instatoonRoom.v4') throw new DOMException('full', 'QuotaExceededError'); return o.call(this, k, v); }; });
  await p.evaluate(() => save()); await p.waitForTimeout(300);
  ok(/저장 공간이 가득/.test(await p.textContent('#toast')), '저장 실패 시 안내 토스트 표시');
  await p.evaluate(() => { delete Storage.prototype.setItem; });
  await p.reload(); await p.waitForTimeout(600);
  ok(!errs.length, '콘솔/페이지 오류 없음 ' + JSON.stringify(errs.slice(0, 3)));

  // 2) 모바일 가로 스크롤 없음
  const m = await mk({ width: 390, height: 800 });
  for (const u of ['/', '/guide/', '/guide/what-is-instatoon/', '/guide/restaurant-instagram-content/', '/about/', '/privacy/', '/terms/']) {
    const r = await m.goto(base + u); await m.waitForTimeout(300);
    const w = await m.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    if (r.status() === 404) { console.log('[SKIP]', u, '아직 없음'); continue; }
    ok(r.status() === 200 && w[0] <= w[1] + 1, `모바일 ${u} 가로 넘침 없음 (${w[0]}/${w[1]})`);
  }
  await m.goto(base + '/guide/what-is-instatoon/');
  await m.screenshot({ path: process.env.SHOT_DIR ? path.join(process.env.SHOT_DIR, 'guide-mobile.png') : undefined, fullPage: false });
  ok(!errs.length, '가이드 포함 오류 없음 ' + JSON.stringify(errs.slice(0, 3)));
  await b.close(); srv.close();
  process.exit(fail ? 1 : 0);
})();
