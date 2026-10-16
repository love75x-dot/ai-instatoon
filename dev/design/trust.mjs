// 5단계 검사: 푸터(운영자·문의·마지막 업데이트)·AI 이용 안내·문의/제보 / 공유 이미지·og·트위터 카드·theme-color·manifest(서비스 워커 없음) /
// 본문 바로가기 / 샘플 그림 파일 분리·지연 로딩 / 첫 화면 자리 확보(레이아웃 흔들림 방지).
//   node dev/design/trust.mjs     (먼저 npm run build)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { serve, launch, newPage, checker, root } from '../lib/harness.mjs';

const C = checker();
const dep = (p) => fs.readFileSync(path.join(root, 'deploy', p), 'utf8');
const home = dep('index.html'), guide = dep('guide/index.html'), trouble = dep('guide/instatoon-troubleshooting/index.html');

// ─── 푸터 한 줄 (빌드가 채움) ───
const dateRe = /마지막 업데이트 (\d{4}-\d{2}-\d{2})/;
const fm = (h) => (h.match(/<p class="fmeta"[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '';
C.ok(dateRe.test(fm(home)) && dateRe.test(fm(guide)) && dateRe.test(fm(trouble)), '앱 홈·노트 목록·노트 글 푸터에 "마지막 업데이트 날짜"가 있음(빌드 때 자동)');
C.ok(!/<time/.test(fm(home) + fm(guide)), '푸터 날짜는 일반 글자(허브의 글 날짜 목록과 섞이지 않음)');
const siteInfo = JSON.parse(fs.readFileSync(path.join(root, 'site', 'site-info.json'), 'utf8'));
if (!siteInfo.operatorName && !siteInfo.contactEmail && !siteInfo.contactUrl) C.ok(!/운영:|문의:/.test(fm(home)), '운영자·문의가 비어 있으면 그 항목은 보이지 않음(가짜 값 없음)');
// 실제 값이 들어 있으면 푸터(앱 홈·노트 목록·노트 글)와 안내 페이지에 그대로 보이고, 이메일은 mailto 링크
if (siteInfo.operatorName || siteInfo.contactEmail || siteInfo.contactUrl) {
  const href = siteInfo.contactUrl || (siteInfo.contactEmail ? 'mailto:' + siteInfo.contactEmail : '');
  const privacy = dep('privacy/index.html');
  for (const [n, h] of [['앱 홈', fm(home)], ['노트 목록', fm(guide)], ['노트 글', fm(trouble)]])
    C.ok((!siteInfo.operatorName || h.includes('운영: ' + siteInfo.operatorName)) && (!href || h.includes(`<a href="${href}"`)), `${n} 푸터에 운영자·문의(링크)가 보임`);
  C.ok(!siteInfo.contactEmail || privacy.includes(`mailto:${siteInfo.contactEmail}`), '개인정보처리방침에도 같은 문의 이메일(mailto)');
}
// 미리보기 프로그램을 위해 머리·본문을 명시적으로 나눔(</head>가 <body>보다 앞) + 공유 이미지 태그 묶음
{ const hi = home.indexOf('</head>'), bi = home.indexOf('<body>');
  C.ok(hi > 0 && bi > hi && home.indexOf('class="skip"') > bi, '앱 홈: </head>와 <body>를 명시적으로 나눔');
  C.ok(/og:image:secure_url/.test(home) && /rel="image_src"/.test(home) && /og:image:type" content="image\/png"/.test(home) && /og:image:width" content="1200"/.test(home) && /og:image:height" content="630"/.test(home), '앱 홈: og:image 와 type·width·height·secure_url·image_src 태그가 모두 있음');
  C.ok(home.indexOf('og:image"') < 4096, 'og:image 태그가 문서 맨 앞 4KB 안에 있음(앞부분만 읽는 미리보기 프로그램 대비)'); }
const probe = (info, date) => { const f = path.join(process.env.TEMP || '/tmp', '_siteinfo_probe.json'); fs.writeFileSync(f, JSON.stringify(info));
  const r = spawnSync(process.execPath, ['-e', `import('${path.join(root, 'site', 'site-meta.mjs').replace(/\\/g, '/').replace(/^([A-Za-z]):/, 'file:///$1:')}').then(m=>console.log(JSON.stringify({f:m.footerMetaHtml(),a:m.appSiteInfoLine()})))`], { env: { ...process.env, SITE_INFO_FILE: f, BUILD_DATE: date || '' }, encoding: 'utf8' });
  fs.rmSync(f, { force: true }); return r; };
const ok1 = probe({ operatorName: '홍길동 스튜디오', contactUrl: 'https://forms.example.com/inq', contactEmail: '' }, '2026-01-02');
const p1 = ok1.status === 0 ? JSON.parse(ok1.stdout.trim().split('\n').pop()) : { f: ok1.stderr };
C.ok(/운영: 홍길동 스튜디오 · 문의: <a href="https:\/\/forms\.example\.com\/inq" target="_blank" rel="noopener">문의하기<\/a> · 마지막 업데이트 2026-01-02/.test(p1.f), `값을 채우면 "운영 · 문의 · 마지막 업데이트" 순서로 보임 (${String(p1.f).slice(0, 90)})`);
const ok2 = probe({ operatorName: '', contactEmail: 'help@example.com' }, '2026-01-03');
const p2 = ok2.status === 0 ? JSON.parse(ok2.stdout.trim().split('\n').pop()) : { f: ok2.stderr };
C.ok(/문의: <a href="mailto:help@example\.com">help@example\.com<\/a> · 마지막 업데이트 2026-01-03/.test(p2.f), '문의 링크가 없으면 이메일로 보임');
const bad = probe({ contactUrl: 'javascript:alert(1)' });
C.ok(bad.status !== 0 && /contactUrl/.test(bad.stderr), '문의 링크가 https:// 가 아니면 빌드가 막음');

// ─── 공유 이미지 · og · 트위터 · theme-color · manifest ───
const png = fs.readFileSync(path.join(root, 'deploy', 'assets', 'og', 'og-default.png'));
const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
C.ok(png.subarray(1, 4).toString() === 'PNG' && w === 1200 && h === 630 && png.length < 300 * 1024, `공유 이미지: PNG ${w}×${h}, ${(png.length / 1024).toFixed(0)}KB(300KB 이하)`);
for (const [name, html] of [['앱 홈', home], ['노트 목록', guide], ['노트 글', trouble]]) {
  const og = (html.match(/property="og:image" content="([^"]+)"/) || [])[1];
  C.ok(og === 'https://www.ai-instatoon.com/assets/og/og-default.png' && /og:image:width" content="1200"/.test(html) && /og:image:height" content="630"/.test(html) && /twitter:card" content="summary_large_image"/.test(html) && /twitter:image" content="https:\/\/www\.ai-instatoon\.com\/assets\/og\/og-default\.png"/.test(html), `${name}: og:image(절대 주소)·크기·트위터 큰 카드·트위터 이미지`);
  C.ok(/name="theme-color" content="#ffffff"/.test(html) && /rel="manifest" href="\/manifest\.webmanifest"/.test(html), `${name}: theme-color·manifest 링크`);
}
C.ok(/og:title/.test(home) && /og:description/.test(home) && /og:url" content="https:\/\/www\.ai-instatoon\.com\/"/.test(home), '카카오톡·인스타 DM 미리보기에 쓰는 og:title·description·url');
const man = JSON.parse(dep('manifest.webmanifest'));
C.ok(man.name && man.short_name && man.start_url === '/' && man.display === 'standalone' && man.icons.length >= 2 && man.icons.every((i) => fs.existsSync(path.join(root, 'deploy', i.src))), 'manifest: 이름·시작 주소·standalone·아이콘 파일 있음');
C.ok(!/serviceWorker/.test(home + guide) && !fs.existsSync(path.join(root, 'deploy', 'sw.js')), '서비스 워커는 없음(홈 화면 추가용 manifest만)');

// ─── 샘플 그림 파일 분리 ───
const samples = JSON.parse((home.match(/const BUILTIN_SAMPLES=(\{.*?\});/) || [])[1] || '{}');
C.ok(Object.keys(samples).length === 13 && Object.values(samples).every((u) => /^\/assets\/samples\/[a-z0-9]+\.jpg$/.test(u) && fs.existsSync(path.join(root, 'deploy', u))), '샘플 그림 13장이 별도 파일(assets/samples)이고 모두 있음');
C.ok(!/data:image\/jpeg;base64,\/9j\//.test(home) && home.length < 600 * 1024, `index.html에 큰 base64 그림이 없음 (${(home.length / 1024).toFixed(0)}KB)`);

const srv = await serve(); const browser = await launch();
const sizes = {};
for (const [name, vp] of [['PC', { width: 1300, height: 900 }], ['태블릿', { width: 820, height: 900 }], ['휴대폰', { width: 390, height: 800 }]]) {
  const { page, errors } = await newPage(browser, srv.base, { viewport: vp, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' }, freeze: false });
  await page.goto(srv.base + '/'); await page.waitForTimeout(900);
  if (name === 'PC') {
    // 본문 바로가기: 첫 Tab이 바로가기 링크, 누르면 #main으로
    await page.keyboard.press('Tab');
    C.ok(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('skip') && document.activeElement.getAttribute('href') === '#main' && !!document.getElementById('main')), '첫 Tab이 "본문 바로가기"에 닿고 #main이 있음');
    // 푸터·사용 방법·키 시트
    C.ok(await page.evaluate(() => /마지막 업데이트 \d{4}-\d{2}-\d{2}/.test(document.querySelector('footer.gfoot .fmeta').textContent)), '앱 푸터에 마지막 업데이트');
    await page.evaluate(() => toggleHelp(true)); await page.waitForTimeout(300);
    const ht = await page.locator('#helpTrust').innerText();
    C.ok(/직접 고치는 건 AI를 부르지 않아요\. AI는 무료 맛보기\(하루 한도\) 또는 내 키로 불러요\./.test(ht) && /문의·제보/.test(ht), '사용 방법 안에 AI 이용 안내 한 줄과 문의·제보');
    C.ok(await page.locator('button, [role="button"]').filter({ hasText: /문의|제보/ }).count() === 0 || await page.locator('#helpTrust a').count() <= 2, '문의·제보 버튼을 따로 늘리지 않음(사용 방법 안과 푸터에만)');
    await page.evaluate(() => { toggleHelp(false); openKeySheet(); }); await page.waitForTimeout(300);
    C.ok(/직접 고치는 건 AI를 부르지 않아요\. AI는 무료 맛보기\(하루 한도\) 또는 내 키로 불러요\./.test(await page.locator('#keySheet').innerText()), '키 시트에도 같은 AI 이용 안내');
    await page.evaluate(() => closeKeySheet());
    // 샘플 그림이 실제로 뜸 + 지연 로딩·크기 지정
    await page.evaluate(() => { S.info.art = 'chibi'; render(); }); await page.waitForTimeout(400);
    const th = await page.evaluate(async () => { const i = document.querySelector('img.art-thumb'); if (!i) return null; await i.decode().catch(() => {}); return { w: i.naturalWidth, lazy: i.loading, dec: i.decoding, aw: i.getAttribute('width'), ah: i.getAttribute('height'), src: i.getAttribute('src') }; });
    C.ok(th && th.w > 0 && th.lazy === 'lazy' && th.dec === 'async' && th.aw === '44' && th.ah === '44' && /^\/assets\/samples\//.test(th.src), `웹툰 테마 샘플 그림이 파일에서 뜨고 지연 로딩·크기 지정 (${JSON.stringify(th)})`);
    const lazyAll = await page.evaluate(() => { document.querySelector('#artsBox').open = true; return [...document.querySelectorAll('#main img')].every((i) => i.loading === 'lazy'); });
    C.ok(lazyAll, '화면의 이미지는 모두 지연 로딩');
  }
  // 첫 화면 자리 확보: 비어 있을 때 잡아 둔 높이 = 그려진 뒤 높이 (레이아웃 흔들림 방지)
  const reserved = await page.evaluate(() => { const real = (sel) => { const e = document.querySelector(sel); return Math.round(e.getBoundingClientRect().height + (sel === '#keyWrap' ? parseFloat(getComputedStyle(e.firstElementChild).marginBottom) : 0)); };
    const empty = (sel) => { const e = document.querySelector(sel), saved = e.innerHTML; e.innerHTML = ''; const h = Math.round(e.getBoundingClientRect().height); e.innerHTML = saved; return h; };
    return { key: [empty('#keyWrap'), real('#keyWrap')], steps: [empty('#steps'), real('#steps')] }; });
  sizes[name] = reserved;
  C.ok(reserved.key[0] === reserved.key[1] && reserved.steps[0] === reserved.steps[1], `${name}: 열쇠 줄·단계 표시줄이 그려지기 전에도 같은 높이를 잡아 둠 (${JSON.stringify(reserved)})`);
  if (errors.length) C.ok(false, `${name} 콘솔 오류: ` + errors.slice(0, 2).join(' | '));
}
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 5단계 검사 ${C.fail}건 실패` : '\n[PASS] 5단계 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
