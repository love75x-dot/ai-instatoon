// 4c 이용자 키 한도(429) 검사: 같은 키로 다른 무료 모델 1회 자동 재시도, 그래도 막히면 한국 시간 기준 초기화 시각 안내, 만든 내용 보존.
//   node dev/design/limit.mjs
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();
const withKey = { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' };
const h = await newPage(browser, srv.base, { viewport: { width: 1300, height: 900 }, ls: withKey });
const { page, errors } = h;

const okBody = { candidates: [{ content: { parts: [{ text: JSON.stringify({ title: '제목', tone: '', cuts: [{ role: '장면', shot: '미디엄샷', title: '', highlight: '', sub: '', bubble: '사장님: 안녕', bubbleSide: 'l', sfx: '', direction: '가게 안', panels: '', caption: '', extras: '' }], hooks: [], caption: '', hashtags: '', comment: '', endHead: '', endBtn: '', cast: '', ideas: [], memory: { story: '줄거리', threads: [], tone: '' } }) }] } }] };
const quota = (kind) => ({ error: { code: 429, status: 'RESOURCE_EXHAUSTED', message: kind === 'day' ? 'You exceeded your current quota. Quota exceeded for metric: generate_content_free_tier_requests, limit: 20' : 'Quota exceeded. Please retry in 3.2s.', details: kind === 'day' ? [{ violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] }] : [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '3s' }] } });
const urls = [];
let plan = [];
await page.route(/generativelanguage\.googleapis\.com\/v1beta\/models\/[^:]+:generateContent/, (r) => {
  const m = decodeURIComponent(r.request().url().match(/models\/([^:]+):/)[1]); urls.push(m);
  const step = plan.shift() || { s: 200, b: okBody };
  return r.fulfill({ status: step.s, contentType: 'application/json', body: JSON.stringify(step.b) });
});
await page.goto(srv.base + '/'); await page.waitForTimeout(500);
await page.evaluate(() => { S = demoState('bakery'); S.demo = false; S.mode = 'one'; S.step = 'input'; S.toon = null; S.info.story = '지켜야 하는 이야기'; save(); });
const run = async () => page.evaluate(async () => { try { await makeToon(); return { ok: true, n: cuts().length, st: document.querySelector('#st-make')?.textContent || '' }; } catch (e) { return { ok: false, e: String(e && e.message || e) }; } });
const stMsg = () => page.evaluate(() => document.querySelector('#st-make')?.textContent || '');

// 기본 모델 이름
C.ok(await page.evaluate(() => API.text === 'gemini-3.1-flash-lite' && API.alt === 'gemini-3.5-flash'), '기본 무료 모델은 Flash-Lite, 예비는 Flash');
C.ok(await page.evaluate(() => { kv.setItem('instatoon.textModel', 'gemini-3.5-flash'); const a = API.alt; kv.removeItem('instatoon.textModel'); return a === 'gemini-3.1-flash-lite'; }), '기본 모델을 Flash로 바꾸면 예비는 Flash-Lite');

// 1) 첫 모델이 429(분당) → 같은 키로 예비 모델 1회 → 성공
plan = [{ s: 429, b: quota('min') }, { s: 200, b: okBody }]; urls.length = 0;
await page.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<div id="st-make"></div>'); });
let r = await run();
C.ok(r.ok && urls.join(',') === 'gemini-3.1-flash-lite,gemini-3.5-flash', '429가 나면 같은 키로 다른 무료 모델을 한 번 시도해 성공: ' + urls.join(','));
C.ok(await page.evaluate(() => cuts().length === 1 && S.series && S.series.length === 1), '재시도로 받은 결과가 그대로 반영되고 연재 기억도 쌓임');

// 2) 둘 다 429(하루) → 한국 시간 안내 + 내용 보존
await page.evaluate(() => { S.toon.postedAt = '10/13'; save(); });
const before = await page.evaluate(() => JSON.stringify({ t: S.toon.title, story: S.info.story, n: cuts().length }));
plan = [{ s: 429, b: quota('day') }, { s: 429, b: quota('day') }]; urls.length = 0;
r = await run();
const msg = await stMsg();
C.ok(urls.length === 2, '재시도는 딱 1번(총 2번 호출): ' + urls.length);
C.ok(/한국 시간으로 (오늘|내일) 오[전후] \d+시/.test(msg), '하루 한도면 한국 시간 초기화 시각을 쉬운 말로 안내: ' + msg.slice(0, 120));
C.ok(/다른 무료 모델로도 한 번 더 시도했지만/.test(msg) && /쓰던 내용은 그대로 저장돼 있어요/.test(msg), '재시도했다는 말과 내용 보존 안내');
C.ok(await page.evaluate((b) => JSON.stringify({ t: S.toon.title, story: S.info.story, n: cuts().length }) === b, before), '막혀도 입력과 직전 결과는 그대로 남음');
C.ok(await page.evaluate(() => { const o = JSON.parse(kv.getItem(KEY)); return o.info.story === '지켜야 하는 이야기'; }), '막히기 전에 지금 입력이 저장돼 있음');

// 3) 분당 한도 두 번 → 몇 초 뒤 안내
plan = [{ s: 429, b: quota('min') }, { s: 429, b: quota('min') }];
await run(); const m2 = await stMsg();
C.ok(/\d+초 뒤에 다시 눌러 주세요/.test(m2), '분당 한도면 몇 초 뒤 안내: ' + m2.slice(0, 60));

// 4) 429가 아니면 재시도하지 않음
plan = [{ s: 400, b: { error: { code: 400, status: 'INVALID_ARGUMENT', message: '잘못된 요청' } } }]; urls.length = 0;
await run();
C.ok(urls.length === 1, '429가 아닌 오류는 재시도하지 않음');

// 5) 초기화 시각 계산 (태평양시 자정 → 한국 시간)
const kst = (iso) => page.evaluate((i) => geminiResetKST(new Date(i)), iso);
C.ok(await kst('2026-10-15T12:00:00+09:00') === '오늘 오후 4시', '여름(태평양 서머타임): 오늘 오후 4시: ' + await kst('2026-10-15T12:00:00+09:00'));
C.ok(await kst('2026-10-15T20:00:00+09:00') === '내일 오후 4시', '한국 시간 저녁이면 내일 오후 4시');
C.ok(await kst('2026-12-15T12:00:00+09:00') === '오늘 오후 5시', '겨울: 오늘 오후 5시: ' + await kst('2026-12-15T12:00:00+09:00'));
C.ok(await kst('2026-10-31T21:00:00+09:00') === '내일 오후 4시', '서머타임이 끝나는 날 직전: 내일 오후 4시(11/1 0시 PDT 기준): ' + await kst('2026-10-31T21:00:00+09:00'));

// 6) 키 시트 고급 설정에 예비 모델 칸
await page.evaluate(() => openKeySheet());
C.ok(await page.locator('#ks-alt').count() === 1 && await page.locator('#ks-alt').inputValue() === 'gemini-3.5-flash', '키 시트 고급 설정에 "대신 쓸 모델" 칸이 있음');

C.ok(errors.length === 0, '페이지 오류 없음: ' + errors.slice(0, 3).join(' | '));
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 한도 검사 ${C.fail}건 실패` : '\n[PASS] 한도 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
