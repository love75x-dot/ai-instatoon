// 무료 맛보기 Worker 검사 (Node만으로 실행, 실제 키·네트워크 없음)
//   node worker/test.mjs
import { handle, QuotaStore, publicConfig, kstDay, originAllowed, extractJson, config } from './core.js';

let fail = 0, pass = 0;
const ok = (c, m) => { if (c) { pass++; console.log('[PASS] ' + m); } else { fail++; console.log('[FAIL] ' + m); } };

const MAKE = '너는 브랜드·콘텐츠 홍보용 인스타툰 작가야. 아래 정보로 6컷 인스타툰 한 편을 완성해.\n[사업·브랜드 정보]\n업종: 빵집\nJSON 하나로만 답해: {"title":""}';
const MONTH = '너는 인스타툰 연재 기획자야. 2026년 11월 한 달 동안 올릴 인스타툰 8편을 기획해.\nJSON 하나로만 답해: {"items":[]}';
const GOOD_MAKE = JSON.stringify({ title: 'x', cuts: [{ role: 'a' }] });
const GOOD_MONTH = JSON.stringify({ concept: 'c', items: [{ title: 't' }] });
const SECRETS = { GEMINI_KEY: 'SECRET-GEM-123', GROQ_KEY: 'SECRET-GROQ-456', OPENROUTER_KEY: 'SECRET-OR-789', TURNSTILE_SECRET: 'SECRET-TS-000' };
const ENV = { ...SECRETS, TURNSTILE_SITEKEY: 'sitekey', ALLOWED_ORIGINS: 'https://www.ai-instatoon.com,*-ai-instatoon.love75x.workers.dev', GROQ_DAILY_CAP: '3', GEMINI_DAILY_CAP: '3', OPENROUTER_DAILY_CAP: '3' };

function memStorage() { const m = new Map(); return { m, get: async (k) => m.get(k), put: async (k, v) => { m.set(k, v); }, delete: async (k) => { m.delete(k); }, list: async ({ prefix }) => new Map([...m].filter(([k]) => k.startsWith(prefix))) }; }
const jsonRes = (status, body, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

/** 가짜 바깥 세상: Turnstile + 3개 공급자. plan으로 공급자별 응답을 정한다. */
function world(plan = {}) {
  const calls = [];
  const fetchFn = async (url, init) => {
    const u = String(url); calls.push({ url: u, init });
    if (u.includes('turnstile')) return jsonRes(200, { success: plan.turnstile !== false });
    const name = u.includes('generativelanguage') ? 'gemini' : u.includes('groq.com') ? 'groq' : 'openrouter';
    const p = plan[name] || { kind: 'ok' };
    if (p.kind === 'rate') return jsonRes(429, { error: { status: 'RESOURCE_EXHAUSTED', message: 'quota', details: [{ retryDelay: '30s' }] } });
    if (p.kind === 'err') return jsonRes(500, { error: { message: 'boom SECRET-GEM-123' } });
    const text = p.text ?? (plan.task === 'month' ? GOOD_MONTH : GOOD_MAKE);
    if (name === 'gemini') return jsonRes(200, { candidates: [{ content: { parts: [{ text }] } }] });
    return jsonRes(200, { choices: [{ message: { content: text } }] });
  };
  return { calls, fetchFn };
}
const req = (body, { method = 'POST', origin = 'https://www.ai-instatoon.com', ip = '1.2.3.4' } = {}) => new Request('https://www.ai-instatoon.com/api/ai', { method, headers: { 'content-type': 'application/json', origin, 'cf-connecting-ip': ip }, body: method === 'GET' ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
const NOW = Date.parse('2026-10-15T03:00:00Z');
const run = async (body, o = {}, plan = {}, env = ENV, store = null, now = NOW) => {
  const st = store || new QuotaStore(memStorage()); const w = world({ task: body && body.task, ...plan });
  const res = await handle(req(body, o), env, { fetch: w.fetchFn, now: () => now, quota: st });
  return { res, j: await res.json(), w, st };
};
const good = { task: 'make', prompt: MAKE, ts: 'tok' };

// ── 입구 검사
let r = await run(good, { method: 'GET' }); ok(r.res.status === 405, 'POST가 아니면 거절');
r = await run(good, { origin: 'https://evil.example' }); ok(r.res.status === 403 && r.j.code === 'forbidden', '허용되지 않은 출처는 거절');
r = await run(good, { origin: 'https://renewal-4c-ai-ai-instatoon.love75x.workers.dev' }); ok(r.res.status === 200, '브랜치 미리보기 주소는 허용');
r = await run(good, { origin: 'http://www.ai-instatoon.com' }); ok(r.res.status === 403, 'http 출처는 거절');
r = await run('not json'); ok(r.res.status === 400, 'JSON이 아니면 거절');
r = await run({ task: 'rewrite', prompt: MAKE, ts: 't' }); ok(r.res.status === 400, '정해지지 않은 작업(rewrite)은 거절');
r = await run({ task: '__proto__', prompt: MAKE, ts: 't' }); ok(r.res.status === 400, '이상한 작업 이름(__proto__)도 거절');
r = await run({ task: 'make', prompt: '이 문장을 영어로 번역해 줘.\nJSON 하나로만 답해: {}', ts: 't' }); ok(r.res.status === 400 && r.w.calls.length === 0, '아무 문장이나 보낼 수 없음(첫 줄 고정 문장 검사)');
r = await run({ task: 'make', prompt: MAKE.replace('JSON 하나로만 답해:', ''), ts: 't' }); ok(r.res.status === 400, '출력 형식 표지가 없으면 거절');
r = await run({ task: 'make', prompt: MAKE + 'ㄱ'.repeat(9000), ts: 't' }); ok(r.res.status === 400, '길이 상한(9000자)을 넘으면 거절');
r = await run({ task: 'month', prompt: MAKE, ts: 't' }); ok(r.res.status === 400, '작업과 요청 문장이 안 맞으면 거절(month에 make 문장)');
r = await run({ ...good, ts: '' }); ok(r.res.status === 403 && r.j.code === 'turnstile', 'Turnstile 토큰이 없으면 거절');
r = await run(good, {}, { turnstile: false }); ok(r.res.status === 403 && r.w.calls.every((c) => c.url.includes('turnstile')), 'Turnstile 확인 실패면 AI를 부르지 않음');

// ── 정상 + 비밀값 노출 없음
r = await run(good);
ok(r.res.status === 200 && r.j.ok && r.j.provider === 'gemini' && r.j.text === GOOD_MAKE, '정상: Gemini 결과를 그대로 돌려줌');
{ // 로그에는 응답한 서비스 이름과 작업 이름만 남는다(입력·결과·키·IP 없음)
  const logs = []; const orig = console.log; console.log = (...x) => logs.push(x.join(' ')); let q; try { q = await run(good); } finally { console.log = orig; }
  const mine = logs.filter((l) => l.includes('"ai"'));
  ok(q.res.status === 200 && mine.length === 1 && mine[0] === JSON.stringify({ ai: { provider: 'gemini', task: good.task } }), '로그에 응답한 서비스 이름(gemini)과 작업 이름만 남음');
  ok(!logs.join('|').includes(good.prompt.slice(10, 40)) && !logs.join('|').includes('1.2.3.4'), '로그에 입력 내용이 없음');
}
const gcall = r.w.calls.find((c) => c.url.includes('generativelanguage'));
ok(gcall.init.headers['x-goog-api-key'] === SECRETS.GEMINI_KEY && !gcall.url.includes('SECRET'), '키는 서버에서 헤더로만 보냄(주소에 안 들어감)');
const gb = JSON.parse(gcall.init.body);
ok(gb.contents[0].parts[0].text === MAKE && gb.generationConfig.responseMimeType === 'application/json', '요청 문장을 그대로 전달, JSON 출력 지정');
ok(!JSON.stringify(r.j).includes('SECRET'), '응답에 어떤 키도 들어 있지 않음');
r = await run({ task: 'month', prompt: MONTH, ts: 't' }); ok(r.res.status === 200 && r.j.text === GOOD_MONTH, 'month도 처리');

// ── 하루 한도 (1인 하루 1편)
{
  const st = new QuotaStore(memStorage());
  let a = await run(good, {}, {}, ENV, st); ok(a.res.status === 200, '첫 번째 make는 성공');
  a = await run(good, {}, {}, ENV, st); ok(a.res.status === 429 && a.j.code === 'daily' && a.w.calls.filter((c) => !c.url.includes('turnstile')).length === 0, '같은 사람의 두 번째 make는 거절(AI 호출 없음)');
  a = await run({ task: 'month', prompt: MONTH, ts: 't' }, {}, {}, ENV, st); ok(a.res.status === 200, 'month는 따로 세어 1번 가능');
  a = await run(good, { ip: '9.9.9.9' }, {}, ENV, st); ok(a.res.status === 200, '다른 IP는 따로 셈');
  a = await run(good, {}, {}, ENV, st, NOW + 86400e3); ok(a.res.status === 200, '한국 시간으로 다음 날이 되면 다시 가능');
  ok(kstDay(Date.parse('2026-10-15T14:59:59Z')) === '2026-10-15' && kstDay(Date.parse('2026-10-15T15:00:00Z')) === '2026-10-16', '하루는 한국 자정에 바뀜');
  ok([...st.s.m.keys()].every((k) => /^(u|p|b|meta):/.test(k)) && ![...st.s.m.keys()].some((k) => k.includes('1.2.3.4')), '저장된 것은 해시·날짜별 횟수뿐(IP 원문 없음)');
  ok(![...st.s.m.values()].some((v) => String(v).includes('빵집')), '입력 내용은 저장하지 않음');
  // 날짜가 바뀌면 지난 기록 삭제
  const keys = [...st.s.m.keys()].filter((k) => k.startsWith('u:2026-10-15')); ok(keys.length === 0, '하루가 지나면 지난 날 기록이 지워짐');
}
// 한도 설정값 변경
{
  const a = await run(good, {}, {}, { ...ENV, TASTE_MAKE_PER_DAY: '2' }, new QuotaStore(memStorage()));
  const st = new QuotaStore(memStorage()); const e2 = { ...ENV, TASTE_MAKE_PER_DAY: '2' };
  const x = await run(good, {}, {}, e2, st), y = await run(good, {}, {}, e2, st), z = await run(good, {}, {}, e2, st);
  ok(x.res.status === 200 && y.res.status === 200 && z.res.status === 429, '1인 하루 한도는 설정값(2로 바꾸면 2번)');
}

// ── 공급자 순서와 건너뛰기
{
  const st = new QuotaStore(memStorage());
  let a = await run(good, {}, { gemini: { kind: 'rate' } }, ENV, st);
  ok(a.res.status === 200 && a.j.provider === 'groq', 'Gemini가 429면 Groq로');
  const names = a.w.calls.filter((c) => !c.url.includes('turnstile')).map((c) => (c.url.includes('generativelanguage') ? 'gemini' : c.url.includes('groq') ? 'groq' : 'or'));
  ok(names.join() === 'gemini,groq', '순서대로 시도: ' + names.join());
  a = await run(good, { ip: '5.5.5.5' }, { gemini: { kind: 'ok' } }, ENV, st);
  ok(a.j.provider === 'groq' && !a.w.calls.some((c) => c.url.includes('generativelanguage')), '429를 받은 공급자는 잠시 건너뜀(다시 두드리지 않음)');
  const gq = await run(good, { ip: '6.6.6.6' }, { gemini: { kind: 'rate' }, groq: { kind: 'rate' } }, ENV, new QuotaStore(memStorage()));
  ok(gq.res.status === 200 && gq.j.provider === 'openrouter', 'Gemini·Groq가 막히면 OpenRouter로');
  const all = await run(good, {}, { gemini: { kind: 'err' }, groq: { kind: 'err' }, openrouter: { kind: 'rate' } }, ENV, new QuotaStore(memStorage()));
  ok(all.res.status === 503 && all.j.code === 'exhausted' && !JSON.stringify(all.j).includes('SECRET'), '모두 막히면 503 exhausted, 오류 내용(키 포함 가능)은 숨김');
  const st2 = new QuotaStore(memStorage());
  await run(good, {}, { gemini: { kind: 'err' }, groq: { kind: 'err' }, openrouter: { kind: 'err' } }, ENV, st2);
  const again = await run(good, {}, {}, ENV, st2);
  ok(again.res.status === 200, '모두 실패한 경우엔 오늘의 1편을 쓴 것으로 세지 않음(환불)');
  const bad = await run(good, {}, { gemini: { kind: 'ok', text: '{"title":"cuts 없음"}' } }, ENV, new QuotaStore(memStorage()));
  ok(bad.res.status === 200 && bad.j.provider === 'groq', '형식이 어긋난 답(cuts 없음)은 다음 공급자로');
  const junk = await run(good, {}, { gemini: { kind: 'ok', text: '죄송해요 안 할래요' } }, ENV, new QuotaStore(memStorage()));
  ok(junk.j.provider === 'groq', 'JSON이 아닌 답도 다음 공급자로');
  const fenced = await run(good, {}, { gemini: { kind: 'ok', text: '```json\n' + GOOD_MAKE + '\n```' } }, ENV, new QuotaStore(memStorage()));
  ok(fenced.j.provider === 'gemini', '코드 블록으로 감싼 JSON은 그대로 인정');
}
// 공급자 하루 상한
{
  const st = new QuotaStore(memStorage()); const e = { ...ENV, GEMINI_DAILY_CAP: '1', TASTE_MAKE_PER_DAY: '9' };
  const a = await run(good, {}, {}, e, st), b = await run(good, {}, {}, e, st);
  ok(a.j.provider === 'gemini' && b.j.provider === 'groq', '공급자별 하루 상한(1)에 닿으면 다음 공급자로');
}
// Groq 요청 형태
{
  const a = await run(good, {}, { gemini: { kind: 'rate' } });
  const g = a.w.calls.find((c) => c.url.includes('groq')), gb2 = JSON.parse(g.init.body);
  ok(g.init.headers.authorization === 'Bearer ' + SECRETS.GROQ_KEY && gb2.response_format.type === 'json_object' && gb2.max_tokens === 3500 && gb2.reasoning_effort === 'low', 'Groq: 키는 헤더, JSON 모드, 출력 3500토큰 상한, gpt-oss는 reasoning low');
  const o = await run(good, {}, { gemini: { kind: 'rate' }, groq: { kind: 'rate' } });
  const oc = o.w.calls.find((c) => c.url.includes('openrouter')); ok(oc.init.headers.authorization === 'Bearer ' + SECRETS.OPENROUTER_KEY && JSON.parse(oc.init.body).model === 'openrouter/free', 'OpenRouter: 키는 헤더, 설정한 모델');
}
// 분당 제한
{
  const st = new QuotaStore(memStorage());
  const a = await run(good, {}, {}, { ...ENV, RL: { limit: async () => ({ success: false }) } }, st);
  ok(a.res.status === 429 && a.j.code === 'rate', '분당 제한에 걸리면 429 rate');
  const b = await run(good, {}, {}, ENV, st); ok(b.res.status === 200, '분당 제한에 걸린 요청은 하루 횟수를 쓰지 않음');
}
// 공개 설정
{
  ok(publicConfig(ENV, true).taste === true && publicConfig(ENV, true).sitekey === 'sitekey', '키·사이트 키·저장소가 다 있으면 맛보기 켜짐');
  ok(publicConfig({ ...ENV, TURNSTILE_SITEKEY: '' }, true).taste === false, 'Turnstile 사이트 키가 없으면 꺼짐');
  ok(publicConfig(ENV, false).taste === false, '저장소가 없으면 꺼짐');
  ok(publicConfig({ TURNSTILE_SITEKEY: 'k', TURNSTILE_SECRET: 's' }, true).taste === false, 'AI 키가 하나도 없으면 꺼짐');
  ok(!JSON.stringify(publicConfig(ENV, true)).includes('SECRET'), '공개 설정에 비밀값 없음');
  ok((await run(good, {}, {}, { ...ENV, TASTE_ENABLED: '0' })).res.status === 503, 'TASTE_ENABLED=0이면 전체 중지');
}
ok(originAllowed('https://a-ai-instatoon.love75x.workers.dev', config(ENV).origins) && !originAllowed('https://ai-instatoon.love75x.workers.dev.evil.com', config(ENV).origins), '출처 패턴은 끝 일치만 인정');
ok(extractJson('앞말 {"a":1} 뒷말').a === 1 && extractJson('쓰레기') === null, 'JSON 꺼내기');

console.log(fail ? `\n[FAIL] Worker 검사 ${fail}건 실패 (통과 ${pass})` : `\n[PASS] Worker 검사 전부 통과 (${pass}개)`);
process.exit(fail ? 1 : 0);
