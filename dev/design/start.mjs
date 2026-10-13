// 리뉴얼 2단계 검사: 오른쪽 패널(요약 카드·스토리보드·인스타 카드), 하단 고정 버튼, 단계 뒤로가기, API 키 바닥 시트,
// 저장 표시·7일 백업 알림, 첫 방문 둘러보기, FAQ·갤러리 자리, 휴대폰 "툰 만들기".
//   node dev/design/start.mjs
import fs from 'node:fs';
import path from 'node:path';
import { root, serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();
const NOW = new Date('2026-10-13T12:00:00+09:00').getTime(), DAY = 86400000;
const full = JSON.parse(fs.readFileSync(path.join(root, 'dev', 'compat', 'fixtures', 'ls-full.json'), 'utf8'));
{ const st = JSON.parse(full['instatoonRoom.v4']); delete st.demo; delete st.demoKey; full['instatoonRoom.v4'] = JSON.stringify(st); } // 체험 중이 아닌 보통 작업으로
const SEEN = { 'instatoon.helpSeen': '1' };
const withKey = { ...SEEN, 'instatoon.key': 'TEST' };
const open = async (vp, ls, url = '/') => { const h = await newPage(browser, srv.base, { viewport: vp, ls }); await h.page.goto(srv.base + url); await h.page.waitForTimeout(350); return h; };
const setState = (page, fn) => page.evaluate(`(${fn.toString()})(); save(); render();`);
const PC = { width: 1300, height: 900 }, MOB = { width: 390, height: 844 };
const vis = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.closest('[hidden]') && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0; }, sel);

// 1) 오른쪽 패널
{
  const { page, errors } = await open(PC, withKey);
  await setState(page, () => { S = demoState('bakery'); S.mode = 'one'; S.step = 'input'; });
  const sum = await page.evaluate(() => ({ kind: document.querySelector('#side').dataset.kind, labels: [...document.querySelectorAll('#sideSummary dt')].map((e) => e.textContent.trim()), todo: !!document.querySelector('#sideSummary .sumtodo'), phone: !document.querySelector('#phoneWrap').hidden, badge: document.querySelectorAll('.ex-badge').length, bannerHidden: getComputedStyle(document.querySelector('#todo')).display === 'none' }));
  C.ok(sum.kind === 'summary' && sum.labels.join() === '가게·이름,테마,인물,컷 수' && sum.todo, `PC 앱 1단계: 오른쪽에 요약 카드(가게·테마·인물·컷 수 + 지금 할 일) (${sum.labels})`);
  C.ok(!sum.phone && sum.badge === 0, 'PC 앱 1단계: 인스타 폰 미리보기와 "예시" 표시가 없음');
  C.ok(sum.bannerHidden, 'PC 앱 1단계: 요약 카드에 "지금 할 일"이 있어 위쪽 검정 배너는 숨김(중복 제거)');
  await setState(page, () => { S.step = 'edit'; });
  const sb = await page.evaluate(() => ({ kind: document.querySelector('#side').dataset.kind, items: document.querySelectorAll('#sideStory .sb li').length, cuts: cuts().length, frames: document.querySelectorAll('#sideStory .frame, #sideStory canvas, #sideStory img').length, cap: !!document.querySelector('#capPrev'), count: (document.querySelector('#capPrev .cnt2') || {}).textContent, fold: !!document.querySelector('#capPrev .cap-fold'), hasWho: /사장님|알바생/.test(document.querySelector('#sideStory').textContent) }));
  C.ok(sb.kind === 'story' && sb.items === sb.cuts && sb.frames === 0 && sb.hasWho, `PC 앱 2단계: 오른쪽에 텍스트 스토리보드(컷 ${sb.items}개, 그림 박스 없음, 인물·대사 포함)`);
  C.ok(sb.cap && /\/ 2,200자/.test(sb.count) && sb.fold, `PC 앱 2단계: 아래에 캡션 미리보기(글자 수 ${sb.count}, 125자 기준선)`);
  await setState(page, () => { S.step = 'post'; });
  let p3 = await page.evaluate(() => ({ kind: document.querySelector('#side').dataset.kind, phone: !document.querySelector('#phoneWrap').hidden }));
  C.ok(p3.kind === 'summary' && !p3.phone, 'PC 앱 3단계(그림 올리기 전): 인스타 카드 미리보기가 보이지 않음');
  await setState(page, () => { S.toon.pics = ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==']; });
  p3 = await page.evaluate(() => ({ kind: document.querySelector('#side').dataset.kind, phone: !document.querySelector('#phoneWrap').hidden }));
  C.ok(p3.kind === 'phone' && p3.phone, 'PC 앱 3단계(그림을 올린 뒤): 인스타 카드 미리보기가 나타남');
  await setState(page, () => { S = demoState('bakery'); S.mode = 'one'; S.mode = 'month'; });
  C.ok(await page.evaluate(() => document.querySelector('#side').hidden), 'PC 한 달 기획 탭: 오른쪽 패널 없음(본문이 넓게)');
  C.ok(!errors.length, 'PC 오른쪽 패널: 페이지 오류 없음' + (errors[0] ? ' ← ' + errors[0] : ''));
  await page.close();
}
{
  const { page } = await open(MOB, withKey);
  await setState(page, () => { S = demoState('bakery'); S.mode = 'one'; S.step = 'edit'; });
  const m = await page.evaluate(() => ({ aside: getComputedStyle(document.querySelector('#side')).display, storyM: getComputedStyle(document.querySelector('#storyM')).display, items: document.querySelectorAll('#storyM .sb li').length, ov: document.documentElement.scrollWidth - innerWidth }));
  C.ok(m.aside === 'none' && m.storyM !== 'none' && m.items === 6 && m.ov <= 1, `휴대폰 앱 2단계: 스토리보드가 본문 위에 나옴(오른쪽 패널은 숨김), 넘침 없음 (${m.items}컷)`);
  await setState(page, () => { S.step = 'input'; });
  C.ok(await page.evaluate(() => getComputedStyle(document.querySelector('#side')).display === 'none'), '휴대폰 앱 1단계: 요약 카드는 숨김(본문이 먼저)');
  await page.close();
}

// 2) 하단 고정 버튼(휴대폰)과 뒤로가기
{
  const { page } = await open(MOB, withKey);
  await setState(page, () => { S = demoState('bakery'); S.mode = 'one'; S.step = 'input'; });
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(250);
  let d = await page.evaluate(() => ({ on: document.querySelector('#dock').classList.contains('on'), shown: getComputedStyle(document.querySelector('#dock')).display, text: document.querySelector('#dockBtn').textContent, pos: getComputedStyle(document.querySelector('#dock')).position }));
  C.ok(d.on && d.shown === 'block' && d.pos === 'fixed' && d.text === '툰 만들기', `휴대폰 앱 1단계: 아래에 고정된 검정 "툰 만들기" 버튼 (${d.text})`);
  await page.evaluate(() => document.querySelector('#makeBtn').scrollIntoView({ block: 'center' })); await page.waitForTimeout(350);
  C.ok(await page.evaluate(() => getComputedStyle(document.querySelector('#dock')).display === 'none'), '휴대폰 앱 1단계: 본문의 만들기 버튼이 보이면 고정 버튼은 숨김');
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(250);
  await page.evaluate(() => { S.step = 'edit'; render(); window.scrollTo(0, 0); }); await page.waitForTimeout(300);
  d = await page.evaluate(() => ({ text: document.querySelector('#dockBtn').textContent, shown: getComputedStyle(document.querySelector('#dock')).display }));
  C.ok(d.text === '그림 그리러 가기 →' && d.shown === 'block', `휴대폰 앱 2단계: 고정 버튼은 "${d.text}"`);
  await page.click('#dockBtn'); await page.waitForTimeout(300);
  C.ok(await page.evaluate(() => S.step === 'post' && location.hash === '#post'), '휴대폰 고정 버튼을 누르면 3단계로 이동(주소 #post)');
  await page.goBack(); await page.waitForTimeout(300);
  C.ok(await page.evaluate(() => S.step === 'edit' && location.hash === '#edit'), '뒤로가기하면 이전 단계(2단계, #edit)');
  await page.goBack(); await page.waitForTimeout(300);
  C.ok(await page.evaluate(() => S.step === 'input' && location.hash === ''), '뒤로가기 한 번 더 하면 1단계');
  await page.goForward(); await page.waitForTimeout(300);
  C.ok(await page.evaluate(() => S.step === 'edit'), '앞으로가기하면 다시 2단계');
  await page.close();
  const pc = await open(PC, withKey);
  await setState(pc.page, () => { S = demoState('bakery'); S.mode = 'one'; S.step = 'input'; });
  C.ok(await pc.page.evaluate(() => getComputedStyle(document.querySelector('#dock')).display === 'none'), 'PC: 하단 고정 버튼은 없음');
  await pc.page.close();
}
// 휴대폰 단계 칩 한 줄
{
  const { page } = await open(MOB, withKey);
  await setState(page, () => { S = demoState('bakery'); S.mode = 'one'; S.step = 'input'; });
  const st = await page.evaluate(() => { const r = [...document.querySelectorAll('#steps .st')].map((e) => e.getBoundingClientRect()); return { n: r.length, oneRow: new Set(r.map((x) => Math.round(x.top))).size === 1, h: Math.min(...r.map((x) => x.height)), ov: document.documentElement.scrollWidth - innerWidth, txt: [...document.querySelectorAll('#steps .st')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()).join(' | ') }; });
  C.ok(st.n === 3 && st.oneRow && st.h >= 40 && st.ov <= 1, `휴대폰: 상단 단계 칩이 한 줄(${st.txt}), 높이 40px 이상`);
  const art = await page.evaluate(() => { const d = document.querySelector('#artsBox'); return { open: d.open, sum: d.querySelector('summary').textContent.trim() }; });
  C.ok(!art.open && /귀여운|웹툰 테마/.test(art.sum), `휴대폰 앱 1단계: 웹툰 테마는 접혀 있고 선택한 테마 이름이 보임 (${art.sum.slice(0, 30)})`);
  await page.click('#artsBox summary'); await page.waitForTimeout(150);
  const cols = await page.evaluate(() => getComputedStyle(document.querySelector('.arts')).gridTemplateColumns.split(' ').length);
  C.ok(cols === 2, `휴대폰: 스타일 갤러리 2열 (${cols}열)`);
  const hb = await page.evaluate(() => 0);
  await page.close();
  const pc = await open(PC, withKey); await setState(pc.page, () => { S = demoState('bakery'); S.mode = 'one'; S.step = 'input'; });
  C.ok(await pc.page.evaluate(() => document.querySelector('#artsBox').open), 'PC 앱 1단계: 웹툰 테마는 펼쳐져 있음');
  await pc.page.close();
}
// 휴대폰 "툰 만들기"
for (const [vk, vp, want] of [['휴대폰 390', MOB, '툰 만들기'], ['PC 1300', PC, '인스타툰 만들기']]) {
  const { page } = await open(vp, withKey, '/guide/how-to-make-instatoon/');
  const t = await page.evaluate(() => { const b = document.querySelector('.hnav .hb.pri'); return { text: b.innerText.split(String.fromCharCode(10)).join('').trim(), h: b.getBoundingClientRect().height, ov: document.documentElement.scrollWidth - innerWidth }; });
  C.ok(t.text === want && t.h === 40 && t.ov <= 1, `${vk} 노트 머리말의 주 버튼 글자: "${t.text}"`);
  await page.close();
}

// 3) API 키 바닥 시트
{
  const { page, errors } = await open(PC, SEEN);
  const reqs = []; page.on('request', (r) => { if (/generativelanguage/.test(r.url())) reqs.push(r.method() + ' ' + r.url().replace(/\?.*/, '')); });
  let line = await page.evaluate(() => ({ text: document.querySelector('#keyBox summary').textContent.trim(), open: document.querySelector('#keyBox').open }));
  C.ok(/API 키 설정 · 필요해요/.test(line.text) && !line.open, `키 없음: "API 키 설정" 줄은 접혀 있고 "${line.text}" 로 보임`);
  await setState(page, () => { S = demoState('bakery'); S.mode = 'one'; S.step = 'input'; });
  line = await page.evaluate(() => document.querySelector('#keyBox summary').textContent.trim());
  C.ok(/체험 중/.test(line) && !/필요해요$/.test(line), `체험 모드: "API 키 필요" 대신 "${line}"`);
  await page.click('#makeBtn'); await page.waitForTimeout(250);
  let sh = await page.evaluate(() => { const w = document.querySelector('#keySheet'); return { shown: !!w && !w.hidden, text: w ? w.textContent : '', terms: !!(w && w.querySelector('a[href="https://ai.google.dev/gemini-api/terms"]')), role: w && w.getAttribute('role'), pos: w && getComputedStyle(w.querySelector('.sheet-in')).borderRadius }; });
  C.ok(sh.shown && sh.role === 'dialog' && /Gemini API 키가 필요해요/.test(sh.text), '키 없이 "툰 만들기"를 누르면 키 입력 시트가 열림');
  C.ok(/이 브라우저에만/.test(sh.text) && /내 Google 키/.test(sh.text), '시트에 "저장은 이 브라우저에만, AI 호출은 내 Google 키로" 안내');
  C.ok(/무료 키/.test(sh.text) && /서비스 개선/.test(sh.text) && sh.terms, '시트에 무료 키 데이터 사용 안내와 Google 약관 출처 링크');
  await page.click('[data-sheet="save"]'); await page.waitForTimeout(100);
  C.ok(await page.evaluate(() => /붙여 넣어/.test(document.querySelector('#ks-st').textContent) && !document.querySelector('#keySheet').hidden), '키를 비우고 저장하면 시트가 닫히지 않고 안내가 나옴');
  await page.fill('#ks-key', 'AIza-bad-key');
  await page.route('**generativelanguage.googleapis.com/v1beta/models?*', (r) => r.fulfill({ status: 400, json: { error: { status: 'INVALID_ARGUMENT', message: 'API key not valid. Please pass a valid API key.' } } }));
  await page.click('[data-sheet="test"]'); await page.waitForTimeout(300);
  C.ok(await page.evaluate(() => /올바르지 않아요/.test(document.querySelector('#ks-st').textContent)), '키 테스트: 잘못된 키는 "올바르지 않아요" 안내');
  await page.unroute('**generativelanguage.googleapis.com/v1beta/models?*');
  await page.click('[data-sheet="test"]'); await page.waitForTimeout(300);
  C.ok(await page.evaluate(() => /연결됐어요/.test(document.querySelector('#ks-st').textContent)), '키 테스트: 맞는 키는 "연결됐어요 ✓"');
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  C.ok(await page.evaluate(() => document.querySelector('#keySheet').hidden && !localStorage.getItem('instatoon.key')), 'Esc로 시트를 닫으면 키는 저장되지 않음');
  await page.click('#makeBtn'); await page.waitForTimeout(200); await page.fill('#ks-key', 'AIza-good-key');
  await page.click('[data-sheet="save"]'); await page.waitForTimeout(600);
  const after = await page.evaluate(() => ({ closed: document.querySelector('#keySheet').hidden, key: localStorage.getItem('instatoon.key'), line: document.querySelector('#keyBox summary').textContent.trim() }));
  C.ok(after.closed && after.key === 'AIza-good-key' && /연결됨 ✓/.test(after.line), `키를 저장하면 시트가 닫히고 줄이 "${after.line}"로 바뀜`);
  C.ok(reqs.some((r) => r.startsWith('POST') && /generateContent/.test(r)), '키를 저장하면 누르려던 "툰 만들기"가 이어서 실행됨(AI 호출 발생)');
  C.ok(!errors.length, '키 시트: 페이지 오류 없음' + (errors[0] ? ' ← ' + errors[0] : ''));
  await page.close();
  const mob = await open(MOB, SEEN); await setState(mob.page, () => { S = demoState('bakery'); S.mode = 'one'; S.step = 'input'; });
  await mob.page.click('#makeBtn'); await mob.page.waitForTimeout(250);
  const g = await mob.page.evaluate(() => { const i = document.querySelector('#keySheet .sheet-in').getBoundingClientRect(); return { bottom: Math.round(innerHeight - i.bottom), w: Math.round(i.width), ov: document.documentElement.scrollWidth - innerWidth }; });
  C.ok(g.bottom <= 1 && g.w === 390 && g.ov <= 1, '휴대폰: 키 입력 시트가 화면 아래에서 올라오는 바닥 시트(폭 꽉 참)');
  await mob.page.close();
}

// 4) 저장 표시 · 7일 백업 알림
{
  const { page } = await open(PC, { ...full, ...SEEN });
  await page.evaluate(() => { save(); });
  C.ok(await page.evaluate(() => document.querySelector('#savedTxt').textContent === '방금 저장됨'), '저장하면 "방금 저장됨"이 표시됨');
  C.ok(await page.evaluate(() => !document.querySelector('#bkNote')), '백업한 지 얼마 안 됐거나 기준 시각이 오늘이면 알림 없음');
  await page.close();
  const old = { ...full, ...SEEN, 'instatoon.lastBackup': String(NOW - 8 * DAY) };
  const a = await open(PC, old);
  const note = await a.page.evaluate(() => (document.querySelector('#bkNote') || {}).textContent || '');
  C.ok(/8일 전/.test(note) && /지금 백업 저장/.test(note), `마지막 백업이 8일 전이면 알림이 뜸 (${note.slice(0, 30)})`);
  const [dl] = await Promise.all([a.page.waitForEvent('download', { timeout: 4000 }).catch(() => null), a.page.click('#bkNote [data-act="backup"]')]);
  await a.page.waitForTimeout(300);
  C.ok(!!dl && await a.page.evaluate(() => !document.querySelector('#bkNote') && +localStorage.getItem('instatoon.lastBackup') === Date.now()), '"지금 백업 저장"을 누르면 백업 파일이 받아지고 알림이 사라짐(백업 시각 기록)');
  await a.page.close();
  const b = await open(PC, old);
  await b.page.click('#bkNote [data-act="bkLater"]'); await b.page.waitForTimeout(150);
  C.ok(await b.page.evaluate(() => !document.querySelector('#bkNote')), '"나중에"를 누르면 알림이 숨음');
  await b.page.reload(); await b.page.waitForTimeout(350);
  C.ok(await b.page.evaluate(() => !document.querySelector('#bkNote')), '새로고침해도 하루 동안은 다시 안 뜸');
  await b.page.close();
  const never = await open(PC, { ...full, ...SEEN, 'instatoon.backupBase': String(NOW - 9 * DAY) });
  C.ok(await never.page.evaluate(() => /백업한 적이 없어요/.test((document.querySelector('#bkNote') || {}).textContent || '')), '한 번도 백업하지 않았고 작업한 지 7일이 넘으면 "백업한 적이 없어요" 알림');
  await never.page.close();
  const dm = await open(PC, old); await setState(dm.page, () => { S = demoState('bakery'); S.mode = 'one'; });
  C.ok(await dm.page.evaluate(() => !document.querySelector('#bkNote')), '예시 체험 중에는 백업 알림이 뜨지 않음');
  await dm.page.close();
  const fresh = await open(PC, SEEN);
  C.ok(await fresh.page.evaluate(() => !document.querySelector('#bkNote')), '작업이 없으면 백업 알림이 뜨지 않음');
  await fresh.page.close();
}

// 5) 첫 방문 둘러보기
{
  const noSeen = { ...full }; delete noSeen['instatoon.helpSeen'];
  const a = await open(PC, noSeen); await a.page.evaluate(() => { S.step = 'post'; save(); }); await a.page.reload(); await a.page.waitForTimeout(1300);
  const r = await a.page.evaluate(() => ({ step: S.step, tour: !!document.querySelector('#tour'), seen: localStorage.getItem('instatoon.helpSeen') }));
  C.ok(r.step === 'post' && !r.tour && r.seen === '1', `작업이 있는 방문자: 둘러보기가 자동으로 뜨지 않고 단계가 3단계로 유지됨 (단계 ${r.step})`);
  await a.page.close();
  const b = await open(PC, {}); await b.page.waitForTimeout(1000);
  C.ok(await b.page.evaluate(() => !!document.querySelector('#tour') && S.step === 'input'), '작업이 없는 첫 방문자: 둘러보기가 뜸');
  await b.page.click('[data-tour="end"]'); await b.page.waitForTimeout(150);
  C.ok(await b.page.evaluate(() => !document.querySelector('#tour') && S.step === 'input'), '건너뛰기 후 1단계 유지');
  await b.page.close();
  const c = await open(PC, { ...full, ...SEEN }); await c.page.evaluate(() => { S.step = 'edit'; save(); render(); });
  await c.page.evaluate(() => startTour()); await c.page.waitForTimeout(250);
  const mid = await c.page.evaluate(() => S.step);
  await c.page.click('[data-tour="end"]'); await c.page.waitForTimeout(250);
  const back = await c.page.evaluate(() => S.step);
  C.ok(mid === 'input' && back === 'edit', `사용 방법의 둘러보기: 보는 동안만 1단계로 가고 끝나면 하던 단계(2단계)로 돌아옴 (${mid} → ${back})`);
  await c.page.close();
}

// 6) FAQ · 갤러리 자리, 넘침
for (const [vk, vp] of [['휴대폰 390', MOB], ['PC 1300', PC]]) {
  const { page } = await open(vp, withKey);
  const f = await page.evaluate(() => ({ faq: document.querySelectorAll('.faq details').length, gal: !!document.querySelector('.galslot'), demos: document.querySelectorAll('#galDemos button').length, ov: document.documentElement.scrollWidth - innerWidth }));
  C.ok(f.faq === 5 && f.gal && f.demos === 3 && f.ov <= 1, `${vk} 첫 화면 아래: FAQ ${f.faq}개, 갤러리 자리, 예시 체험 버튼 ${f.demos}개, 넘침 없음`);
  const before = await page.evaluate(() => document.querySelector('.faq details').open);
  await page.click('.faq summary'); C.ok(await page.evaluate(() => document.querySelector('.faq details').open) && !before, `${vk} FAQ를 누르면 열림`);
  await page.close();
}
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 2단계 검사 ${C.fail}건 실패` : '\n[PASS] 2단계 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
