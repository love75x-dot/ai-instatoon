// "이번 편 AI 호출 횟수" 표시 검사: 0이면 숨김, 부를 때마다 +1, 다시 만들기는 이어서, 새 편(만들기)은 0부터, 저장 데이터에는 안 들어감.
//   node dev/design/aicount.mjs
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();
const h = await newPage(browser, srv.base, { viewport: { width: 1300, height: 900 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
const { page, errors } = h;
const okBody = { candidates: [{ content: { parts: [{ text: JSON.stringify({ title: '제목', tone: '', cuts: [{ role: '장면', shot: '미디엄샷', title: '', highlight: '', sub: '', bubble: '사장님: 안녕', bubbleSpeaker: '사장님', bubbleType: '말', caption: '', direction: '가게 안', alt: '' }] }) }] } }] };
await page.route(/generativelanguage\.googleapis\.com\/v1beta\/models\/[^:]+:generateContent/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(okBody) }));
await page.goto(srv.base + '/'); await page.waitForTimeout(500);
await page.evaluate(() => { S = demoState('bakery'); S.demo = false; S.mode = 'one'; S.step = 'input'; S.toon = null; S.info.story = '지켜야 하는 이야기'; save(); });
const gen = (keep) => page.evaluate(async (k) => { document.getElementById('st-make') || document.body.insertAdjacentHTML('beforeend', '<div id="st-make"></div>'); if (k) aiKeep = true; try { await makeToon(); } catch (e) {} return aiCalls; }, !!keep);

C.ok(await page.evaluate(() => aiCalls === 0), '처음에는 0번');
C.ok((await gen()) === 1, '만들기 1번 → 1');
C.ok((await gen(true)) === 2, '"통째로 다시 만들기"는 이어서 센다 → 2');
C.ok((await gen()) === 1, '새 편 만들기는 0부터 다시 → 1');

// 화면: 2단계에 글자가 보이고, 0이면 숨김
await page.evaluate(() => { go('edit'); });
await page.waitForTimeout(300);
const t = await page.evaluate(() => { const e = document.getElementById('aiCnt'); return e ? { hid: e.hidden, tx: e.textContent } : null; });
C.ok(t && !t.hid && t.tx === '이번 편에서 AI를 1번 불렀어요 · 직접 고치는 건 세지 않아요', '2단계에 "이번 편에서 AI를 1번 불렀어요 · 직접 고치는 건 세지 않아요" 표시');
await page.evaluate(() => { aiCalls = 0; renderAiCount(); });
C.ok(await page.evaluate(() => document.getElementById('aiCnt').hidden), '0번이면 숨김');
C.ok(await page.evaluate(() => !JSON.stringify(S).includes('aiCalls') && !JSON.stringify(localStorage).includes('aiCalls')), '저장 데이터에는 횟수를 넣지 않음');
C.ok(!errors.length, '화면 오류 없음' + (errors[0] ? ' ← ' + String(errors[0]).slice(0, 100) : ''));
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] AI 횟수 검사 ${C.fail}건 실패` : '\n[PASS] AI 횟수 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
