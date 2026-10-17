// 4c 0원 맛보기(화면 쪽) 검사: 키가 없을 때만 맛보기 시트, Turnstile 확인 뒤 /api/ai 호출, 한 편·한 달 기획만,
// 끝났을 때 "오늘 무료 맛보기가 끝났어요" + 키 발급 3단계, 서버가 꺼져 있으면 지금처럼 키 시트.
//   node dev/design/taste.mjs
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();

const toon = { title: '맛보기 편', tone: '', cuts: [1, 2, 3].map((k) => ({ role: '장면' + k, shot: '미디엄샷', title: '', highlight: '', sub: '', bubble: '사장님: 안녕', bubbleSide: 'l', sfx: '', direction: '가게 안', panels: '', caption: '', extras: '' })), hooks: [], caption: '', hashtags: '', comment: '', endHead: '', endBtn: '', cast: '', ideas: [], memory: { story: '맛보기 줄거리', threads: [], tone: '' } };
const monthRes = { concept: '개념', items: [{ date: '11/3(화)', type: '실화', title: '첫 편', story: '이야기', goal: '공감', cuts: 6 }] };

async function open({ cfg, key, reply }) {
  const h = await newPage(browser, srv.base, { viewport: { width: 1300, height: 900 }, ls: { 'instatoon.helpSeen': '1', ...(key ? { 'instatoon.key': 'AIza-own' } : {}) } });
  const { page } = h; const reqs = { api: [], gem: 0 };
  await page.addInitScript(() => { window.turnstile = { render(el, o) { window.__ts = o; setTimeout(() => o.callback('TS-TOKEN-' + (window.__n = (window.__n || 0) + 1)), 30); return 'w' + window.__n; }, remove() {} }; });
  await page.route('**/api/ai/config', (r) => cfg === 'fail' ? r.abort() : r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cfg) }));
  await page.route('**/api/ai', (r) => {
    reqs.api.push(JSON.parse(r.request().postData() || '{}')); const x = reply(reqs.api.length, reqs.api[reqs.api.length - 1]);
    return r.fulfill({ status: x.s, contentType: 'application/json', body: JSON.stringify(x.b) });
  });
  await page.route(/generativelanguage\.googleapis\.com\/v1beta\/models\/[^:]+:generateContent/, (r) => { reqs.gem++; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(toon) }] } }] }) }); });
  await page.goto(srv.base + '/'); await page.waitForTimeout(600);
  await page.evaluate(() => { S = demoState('bakery'); S.demo = false; S.mode = 'one'; S.step = 'input'; S.toon = null; S.series = []; save(); render(); });
  await page.waitForTimeout(150);
  return { ...h, reqs };
}
const ON = { ok: true, taste: true, sitekey: 'SITE-KEY', perDay: { make: 1, month: 1 } };
const okMake = (n, b) => ({ s: 200, b: { ok: true, provider: 'groq', text: JSON.stringify(b.task === 'month' ? monthRes : toon) } });
const shown = (page, id) => page.evaluate((i) => { const e = document.getElementById(i); return !!e && !e.hidden; }, id);

// 0) API 키 줄 문구: 키가 없어도 맛보기로 만들 수 있다 (4b 수정)
{
  const txt = (page) => page.evaluate(() => document.querySelector('#keyTxt').textContent.trim());
  const on = await open({ cfg: ON, reply: okMake });
  C.ok(await txt(on.page) === '오늘 무료 1회 · 내 키 설정', '키 없음 + 맛보기 켜짐: "오늘 무료 1회 · 내 키 설정"');
  C.ok(!/필요해요/.test(await on.page.locator('#keyBox').innerText()), '키 없음 + 맛보기 켜짐: 키 줄에 "필요해요"가 없음');
  await on.page.evaluate(() => { S.demo = true; refreshKeyLine(); }); C.ok(/둘러보기만/.test(await txt(on.page)), '체험 모드: "둘러보기만 하면 필요 없어요"');
  await on.ctx.close();
  const off = await open({ cfg: { ok: true, taste: false, sitekey: '' }, reply: okMake });
  C.ok(await txt(off.page) === 'API 키가 필요해요', '맛보기가 꺼져 있을 때만: "API 키가 필요해요"');
  await off.ctx.close();
  const fail = await open({ cfg: 'fail', reply: okMake });
  C.ok(await txt(fail.page) === 'API 키가 필요해요', '맛보기 설정을 못 받았을 때도: "API 키가 필요해요"');
  await fail.ctx.close();
  const keyed = await open({ cfg: ON, key: true, reply: okMake });
  C.ok(/API 키 설정 · 연결됨/.test(await txt(keyed.page)), '키가 있을 때: "API 키 설정 · 연결됨 ✓"');
  await keyed.ctx.close();
}
// 1) 맛보기 시트 → 확인 → 호출
{
  const t = await open({ cfg: ON, reply: okMake });
  await t.page.click('#makeBtn'); await t.page.waitForTimeout(250);
  C.ok(await shown(t.page, 'tasteSheet') && !(await shown(t.page, 'keySheet')), '키가 없으면 "대본 만들기"에서 키 시트 대신 무료 맛보기 시트가 열림');
  const txt = await t.page.locator('#tasteSheet').innerText();
  C.ok(/Google Gemini · Groq · OpenRouter/.test(txt) && /서비스 개선·학습/.test(txt) && /개인정보와 비밀 내용은 넣지 마세요/.test(txt) && /저장하지 않아요/.test(txt), '시트에 무료 AI 서비스 안내(학습에 쓰일 수 있음·개인정보 금지·서버 비저장)');
  C.ok(await t.page.evaluate(() => window.__ts && window.__ts.sitekey === 'SITE-KEY'), 'Turnstile 위젯을 사이트 키로 그림');
  await t.page.waitForTimeout(120);
  C.ok(await t.page.locator('#taste-go').isEnabled(), '확인이 끝나면 "무료로 만들기"가 켜짐');
  await t.page.click('#taste-go'); await t.page.waitForTimeout(500);
  const q = t.reqs.api[0];
  C.ok(t.reqs.api.length === 1 && q.task === 'make' && /^너는 브랜드·콘텐츠 홍보용 인스타툰 작가야\./.test(q.prompt) && q.ts === 'TS-TOKEN-1', '/api/ai로 작업 이름·요청 문장·확인 토큰만 보냄');
  C.ok(Object.keys(q).sort().join() === 'prompt,task,ts', '그 밖의 값(키·개인정보)은 보내지 않음');
  C.ok(t.reqs.gem === 0, '브라우저가 Gemini를 직접 부르지 않음');
  C.ok(await t.page.evaluate(() => cuts().length === 3 && S.toon.title === '맛보기 편' && S.series.length === 1), '받은 결과가 그대로 반영되고 연재 기억도 쌓임');
  // 토큰은 한 번만
  await t.page.evaluate(() => { S.toon.postedAt = '10/13'; save(); });
  await t.page.evaluate(() => { S.step = 'input'; render(); }); await t.page.waitForTimeout(150);
  await t.page.click('#makeBtn'); await t.page.waitForTimeout(250);
  C.ok(await shown(t.page, 'tasteSheet'), '두 번째부터는 다시 확인 시트(토큰은 한 번만 사용)');
  await t.page.keyboard.press('Escape'); await t.page.waitForTimeout(100);
  C.ok(!(await shown(t.page, 'tasteSheet')) && t.reqs.api.length === 1, 'Esc로 닫으면 호출하지 않음');
  C.ok(t.errors.length === 0, '페이지 오류 없음: ' + t.errors.slice(0, 2).join('|'));
  await t.ctx.close();
}
// 2) 한 달 기획
{
  const t = await open({ cfg: ON, reply: okMake });
  await t.page.evaluate(() => { S.mode = 'month'; save(); render(); }); await t.page.waitForTimeout(250);
  await t.page.click('[data-act="monthMake"]'); await t.page.waitForTimeout(250);
  C.ok(await shown(t.page, 'tasteSheet'), '한 달 기획도 맛보기 시트');
  await t.page.waitForTimeout(100); await t.page.click('#taste-go'); await t.page.waitForTimeout(500);
  C.ok(t.reqs.api.length === 1 && t.reqs.api[0].task === 'month' && /^너는 인스타툰 연재 기획자야\./.test(t.reqs.api[0].prompt), 'month 요청이 감');
  C.ok(await t.page.evaluate(() => mo().items.length === 1), '한 달 연재표가 만들어짐');
  await t.ctx.close();
}
// 3) 하루 한도/모두 막힘 → 끝났어요 시트 + 3단계 → 내 키 넣기
for (const [label, rep] of [['하루 한도(daily)', { s: 429, b: { ok: false, code: 'daily' } }], ['모든 공급자 막힘(exhausted)', { s: 503, b: { ok: false, code: 'exhausted' } }]]) {
  const t = await open({ cfg: ON, reply: () => rep });
  await t.page.click('#makeBtn'); await t.page.waitForTimeout(250); await t.page.waitForTimeout(100); await t.page.click('#taste-go'); await t.page.waitForTimeout(500);
  C.ok(await shown(t.page, 'tasteEnd'), label + ': "오늘 무료 맛보기가 끝났어요" 시트');
  const et = await t.page.locator('#tasteEnd').innerText();
  C.ok(/내 무료 키를 넣으면 계속할 수 있어요/.test(et) && /API 키 만들기/.test(et), label + ': 계속 안내 문구');
  C.ok(await t.page.locator('#tasteEnd .tsteps li').count() === 3 && /aistudio\.google\.com\/apikey/.test(await t.page.locator('#tasteEnd').innerHTML()), label + ': 키 발급 3단계 안내');
  C.ok(/오늘 무료 맛보기가 끝났어요/.test(await t.page.evaluate(() => [...document.querySelectorAll('.status')].map((e) => e.textContent).join(' '))), label + ': 상태 줄에도 안내');
  C.ok(await t.page.evaluate(() => cuts().length === 0), label + ': 입력은 그대로(결과 없음)');
  await t.page.click('#tasteEnd [data-taste="key"]'); await t.page.waitForTimeout(150);
  C.ok(await shown(t.page, 'keySheet') && !(await shown(t.page, 'tasteEnd')), label + ': "내 키 넣기"를 누르면 키 시트');
  await t.ctx.close();
}
// 4) 서버가 꺼져 있으면(설정 없음·실패) 지금처럼 키 시트
for (const [label, cfg] of [['맛보기 꺼짐', { ok: true, taste: false, sitekey: '' }], ['설정을 못 받음', 'fail']]) {
  const t = await open({ cfg, reply: okMake });
  await t.page.click('#makeBtn'); await t.page.waitForTimeout(300);
  C.ok(await shown(t.page, 'keySheet') && !(await shown(t.page, 'tasteSheet')) && t.reqs.api.length === 0, label + ': 키 시트가 열리고 /api/ai는 부르지 않음');
  await t.ctx.close();
}
// 5) 서버가 도중에 불가(unavailable)
{
  const t = await open({ cfg: ON, reply: () => ({ s: 503, b: { ok: false, code: 'unavailable' } }) });
  await t.page.click('#makeBtn'); await t.page.waitForTimeout(250); await t.page.waitForTimeout(100); await t.page.click('#taste-go'); await t.page.waitForTimeout(500);
  C.ok(await shown(t.page, 'keySheet'), '서버가 맛보기를 쓸 수 없다고 하면 키 시트로 안내');
  await t.ctx.close();
}
// 6) 내 키가 있으면 맛보기를 쓰지 않음
{
  const t = await open({ cfg: ON, key: true, reply: okMake });
  await t.page.click('#makeBtn'); await t.page.waitForTimeout(600);
  C.ok(t.reqs.api.length === 0 && t.reqs.gem === 1 && !(await shown(t.page, 'tasteSheet')), '내 키가 있으면 맛보기 없이 내 키로 Gemini를 부름');
  await t.ctx.close();
}
// 7) 한 편·한 달 기획 말고는 키 시트 (예: 검토)
{
  const t = await open({ cfg: ON, reply: okMake });
  await t.page.evaluate(() => { S.toon = { title: 't', cuts: [{ role: 'a', shot: '미디엄샷', title: '', highlight: '', sub: '', bubble: '', bubbleSide: 'l', sfx: '', direction: '', panels: '', caption: '', extras: '' }], pics: [] }; });
  const r = await t.page.evaluate(async () => { const b = document.createElement('button'); b.dataset.act = 'review'; document.body.appendChild(b); await run(b, review); return { key: !document.getElementById('keySheet')?.hidden, taste: !!document.getElementById('tasteSheet') && !document.getElementById('tasteSheet').hidden }; });
  C.ok(r.key && !r.taste && t.reqs.api.length === 0, '검토 같은 다른 작업은 맛보기가 아니라 키 시트(맛보기는 make·month만)');
  await t.ctx.close();
}
// 8) Claude 모드인데 Claude 키가 없고 맛보기 토큰이 있을 때도 맛보기로 감
{
  const t = await open({ cfg: ON, reply: okMake });
  await t.page.evaluate(() => kv.setItem('instatoon.ai', 'claude'));
  await t.page.click('#makeBtn'); await t.page.waitForTimeout(250); await t.page.waitForTimeout(100); await t.page.click('#taste-go'); await t.page.waitForTimeout(500);
  C.ok(t.reqs.api.length === 1 && await t.page.evaluate(() => cuts().length === 3), 'Claude 키가 없으면 Claude 모드에서도 맛보기를 쓸 수 있음');
  await t.ctx.close();
}
// 9) 휴대폰 가로 넘침 없음
{
  const h = await newPage(browser, srv.base, { viewport: { width: 360, height: 740 }, ls: { 'instatoon.helpSeen': '1' } });
  await h.page.addInitScript(() => { window.turnstile = { render(el, o) { setTimeout(() => o.callback('T'), 30); return 'w'; }, remove() {} }; });
  await h.page.route('**/api/ai/config', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ON) }));
  await h.page.goto(srv.base + '/'); await h.page.waitForTimeout(600);
  await h.page.evaluate(() => { S = demoState('bakery'); S.demo = false; S.mode = 'one'; S.step = 'input'; S.toon = null; save(); render(); });
  await h.page.click('#makeBtn'); await h.page.waitForTimeout(300);
  C.ok(await h.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector('#tasteSheet .sheet-in').scrollWidth <= document.querySelector('#tasteSheet .sheet-in').clientWidth + 1), '휴대폰: 맛보기 시트가 가로로 넘치지 않음');
  await h.page.evaluate(() => openTasteEnd());
  C.ok(await h.page.evaluate(() => document.querySelector('#tasteEnd .sheet-in').scrollWidth <= document.querySelector('#tasteEnd .sheet-in').clientWidth + 1), '휴대폰: "끝났어요" 시트가 가로로 넘치지 않음');
  await h.ctx.close();
}

await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 맛보기 화면 검사 ${C.fail}건 실패` : '\n[PASS] 맛보기 화면 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
