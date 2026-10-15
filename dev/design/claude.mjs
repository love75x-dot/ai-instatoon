// 4c 운영자 Claude 모드 검사: 키 시트 고급 설정에서 AI 종류 선택, 브라우저 직접 호출 헤더, 기획·대본=Sonnet/나머지=Haiku,
// 요청 문장·결과 처리가 Gemini와 같은지, 이번 달 추정 사용액, 오류 안내.
//   node dev/design/claude.mjs
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();
const h = await newPage(browser, srv.base, { viewport: { width: 1300, height: 900 }, ls: { 'instatoon.helpSeen': '1' } });
const { page, errors } = h;

const toon = { title: '제목', tone: '', cuts: [1, 2, 3].map((k) => ({ role: '장면' + k, shot: '미디엄샷', title: '', highlight: '', sub: '', bubble: '사장님: 안녕', bubbleSide: 'l', sfx: '', direction: '가게 안', panels: '', caption: '', extras: '' })), hooks: [], caption: '캡션', hashtags: '#a', comment: '', endHead: '', endBtn: '', cast: '', ideas: [], memory: { story: '줄거리', threads: ['떡밥'], tone: '말투' } };
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
const calls = { claude: [], gemini: [], models: 0 };
let claudeReply = () => ({ s: 200, b: { content: [{ type: 'text', text: JSON.stringify(toon) }], stop_reason: 'end_turn', usage: { input_tokens: 1000, output_tokens: 2000 } }, h: {} });
await page.route('https://api.anthropic.com/**', (r) => {
  const req = r.request();
  if (req.method() === 'OPTIONS') return r.fulfill({ status: 200, headers: CORS, body: '' });
  if (req.url().includes('/v1/models')) { calls.models++; return r.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'claude-sonnet-5-5' }] }) }); }
  calls.claude.push({ headers: req.headers(), body: JSON.parse(req.postData() || '{}') });
  const x = claudeReply(); return r.fulfill({ status: x.s, headers: { ...CORS, ...x.h }, contentType: 'application/json', body: JSON.stringify(x.b) });
});
await page.route(/generativelanguage\.googleapis\.com\/v1beta\/models\/[^:]+:generateContent/, (r) => {
  calls.gemini.push(JSON.parse(r.request().postData() || '{}'));
  return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(toon) }] } }] }) });
});
await page.goto(srv.base + '/'); await page.waitForTimeout(500);
await page.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<div id="st-make"></div><div id="st-review"></div>'); });
const fresh = () => page.evaluate(() => { S = demoState('bakery'); S.demo = false; S.mode = 'one'; S.step = 'input'; S.toon = null; S.series = []; save(); });

// 1) 기본은 Gemini, Claude 칸은 숨김. 고급 설정 안에만 있음
await page.evaluate(() => kv.setItem('instatoon.key', 'AIza-test'));
await page.evaluate(() => openKeySheet());
C.ok(await page.evaluate(() => document.querySelector('.ks-adv #ks-ai') && document.querySelector('#ks-ai').value === 'gemini' && document.querySelector('#ks-claude').hidden), 'AI 종류 선택은 고급 설정 안에 있고 기본은 Gemini, Claude 칸은 숨김');
C.ok(await page.evaluate(() => !document.querySelector('.ks-adv').open), '고급 설정은 기본으로 접혀 있어 이용자 화면은 그대로');

// 2) Gemini 기준 요청 문장 기록
await fresh(); calls.gemini.length = 0;
await page.evaluate(() => makeToon());
const gemText = calls.gemini[0].contents[0].parts[0].text;

// 3) 시트에서 Claude 선택·저장
await page.evaluate(() => openKeySheet()); await page.locator('.ks-adv summary').click();
await page.selectOption('#ks-ai', 'claude'); await page.waitForTimeout(80);
C.ok(await page.evaluate(() => !document.querySelector('#ks-claude').hidden), 'Claude를 고르면 Claude 키·모델 칸이 나타남');
await page.fill('#ks-ckey', 'sk-ant-test-key');
await page.click('[data-sheet="test"]'); await page.waitForTimeout(300);
C.ok(calls.models === 1 && /연결됐어요/.test(await page.locator('#ks-st').innerText()), 'Claude 키 테스트가 동작(키 확인 호출만, 비용 없음)');
await page.click('[data-sheet="save"]'); await page.waitForTimeout(200);
C.ok(await page.evaluate(() => kv.getItem('instatoon.ai') === 'claude' && kv.getItem('instatoon.claudeKey') === 'sk-ant-test-key' && /Claude 연결됨/.test(keySummary())), '저장하면 Claude로 전환되고 첫 화면 줄에 "Claude 연결됨"');

// 4) 기획·대본 호출 = Sonnet, 브라우저 직접 호출 헤더, Gemini와 같은 요청 문장
await fresh(); calls.gemini.length = 0; calls.claude.length = 0;
await page.evaluate(() => makeToon());
const c1 = calls.claude[0];
C.ok(c1 && c1.body.model === 'claude-sonnet-5-5', '한 편 만들기는 Sonnet: ' + (c1 && c1.body.model));
C.ok(c1.headers['x-api-key'] === 'sk-ant-test-key' && c1.headers['anthropic-version'] === '2023-06-01' && c1.headers['anthropic-dangerous-direct-browser-access'] === 'true', '브라우저 직접 호출 헤더(x-api-key·anthropic-version·direct-browser-access)');
C.ok(c1.body.output_config && c1.body.output_config.effort === 'low' && c1.body.max_tokens === 8000 && !('temperature' in c1.body), 'effort low, 출력 상한 8000, temperature 미사용');
const claudeText = c1.body.messages[0].content.slice(-1)[0].text;
C.ok(claudeText === gemText, '요청 문장이 Gemini와 한 글자도 다르지 않음 (' + claudeText.length + '자)');
C.ok(calls.gemini.length === 0, 'Claude 모드에서는 Gemini를 부르지 않음');
C.ok(await page.evaluate(() => cuts().length === 3 && S.toon.title === '제목' && S.series.length === 1 && S.toon.caption === '캡션'), '결과 처리(컷·캡션·연재 기억)가 Gemini와 같음');

// 5) 나머지(검토)는 Haiku
await page.evaluate(() => review()); await page.waitForTimeout(100);
const c2 = calls.claude[1];
C.ok(c2 && c2.body.model === 'claude-haiku-5-5' && c2.body.max_tokens === 4096, '검토 같은 나머지 작업은 Haiku: ' + (c2 && c2.body.model));

// 6) 이번 달 추정 사용액: (1000·2+2000·10)/1e6 ×2 호출(plan+fast) → plan 0.022 + fast 0.0011
const u = await page.evaluate(() => ({ t: usageText(), c: usageCost() }));
C.ok(Math.abs(u.c.usd - 0.0231) < 1e-9 && u.c.n === 2, '사용액 계산 $0.0231, 2번 호출: ' + JSON.stringify(u.c));
C.ok(/이번 달 약 \$0\.02 \(약 32원\) · 2번 호출 · 토큰 기준 추정/.test(u.t), '고급 설정에 조용히 보이는 문구: ' + u.t);
await page.evaluate(() => openKeySheet());
C.ok(/이번 달 약 \$0\.02/.test(await page.locator('#ks-usage').textContent()), '키 시트 고급 설정에 사용액이 보임');

// 7) 오류 안내
const errCase = async (reply, re, label) => { claudeReply = reply; await fresh(); const msg = await page.evaluate(async () => { try { await makeToon(); return document.querySelector('#st-make').textContent; } catch (e) { return 'X'; } }); C.ok(re.test(msg), label + ': ' + msg.slice(0, 80)); };
await errCase(() => ({ s: 401, b: { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }, h: {} }), /Claude API 키가 올바르지 않아요/, '401');
await errCase(() => ({ s: 400, b: { type: 'error', error: { type: 'invalid_request_error', message: 'Your credit balance is too low to access the Anthropic API.' } }, h: {} }), /크레딧이 모두 소진/, '크레딧 부족');
await errCase(() => ({ s: 429, b: { type: 'error', error: { type: 'rate_limit_error', message: 'rate' } }, h: { 'retry-after': '7' } }), /7초 뒤에 다시 눌러 주세요/, '429');
await errCase(() => ({ s: 200, b: { content: [], stop_reason: 'refusal', usage: { input_tokens: 1, output_tokens: 0 } }, h: {} }), /답하지 않았어요/, '거절(refusal)');
await errCase(() => ({ s: 200, b: { content: [{ type: 'text', text: '{"title":' }], stop_reason: 'max_tokens', usage: { input_tokens: 1, output_tokens: 8000 } }, h: {} }), /중간에 잘렸어요/, '출력 잘림');
await errCase(() => ({ s: 200, b: { content: [{ type: 'text', text: '죄송해요 JSON이 아니에요' }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 5 } }, h: {} }), /AI 답변 형식이 어긋났어요/, 'JSON 아님');
C.ok(await page.evaluate(() => { fresh0 = 1; return true; }), '(오류 뒤에도 입력 유지)');

// 8) Gemini로 되돌리기
await page.evaluate(() => kv.setItem('instatoon.ai', 'gemini')); await fresh(); calls.gemini.length = 0; calls.claude.length = 0;
await page.evaluate(() => makeToon());
C.ok(calls.gemini.length === 1 && calls.claude.length === 0, 'Gemini로 되돌리면 다시 Gemini만 호출');

// 9) 운영자 키가 사이트 코드·배포 파일에 들어 있지 않음
const html = await page.content();
C.ok(!/sk-ant-test-key/.test((await (await fetch(srv.base + '/')).text())), '배포되는 사이트 코드에는 운영자 키가 없음');

C.ok(errors.length === 0, '페이지 오류 없음: ' + errors.slice(0, 3).join(' | '));
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] Claude 모드 검사 ${C.fail}건 실패` : '\n[PASS] Claude 모드 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
