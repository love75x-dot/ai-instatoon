// 무료 맛보기 API (/api/ai) 핵심 로직. Cloudflare 전용 코드가 없어서 Node에서도 그대로 시험할 수 있다(worker/test.mjs).
//
// 지키는 것
//  - 키(GEMINI_KEY·GROQ_KEY·OPENROUTER_KEY·TURNSTILE_SECRET)는 환경의 비밀값에서만 읽고, 응답·로그에 절대 싣지 않는다.
//  - 입력(요청 문장)과 결과는 저장하지 않는다. 저장하는 것은 "IP 해시 + 날짜별 사용 횟수"뿐이고 하루가 지나면 지운다.
//  - 정해진 작업(make·month)만 받는다. 아무 문장이나 대신 보내 주는 통로가 되지 않도록 요청 문장의 첫 줄·길이·출력 형식을 검사한다.
//  - 이용자 키가 없을 때만 쓰이는 길이다(클라이언트가 키가 있으면 이 경로를 부르지 않는다).
//  - 한도는 모두 설정값(wrangler.jsonc vars)이다.

export const TASKS = {
  // 요청 문장의 첫 줄 고정 문장(앱의 make·month 틀) + 출력 형식 표지 + 결과에 꼭 있어야 하는 필드
  make: { head: '너는 브랜드·콘텐츠 홍보용 인스타툰 작가야.', need: 'cuts' },
  month: { head: '너는 인스타툰 연재 기획자야.', need: 'items' },
};
const JSON_MARK = 'JSON 하나로만 답해:';

export function config(env) {
  const n = (k, d) => { const v = parseInt(env[k], 10); return Number.isFinite(v) && v >= 0 ? v : d; };
  return {
    enabled: String(env.TASTE_ENABLED ?? '1') !== '0',
    perDay: { make: n('TASTE_MAKE_PER_DAY', 1), month: n('TASTE_MONTH_PER_DAY', 1) },
    caps: { gemini: n('GEMINI_DAILY_CAP', 400), groq: n('GROQ_DAILY_CAP', 18), openrouter: n('OPENROUTER_DAILY_CAP', 45) },
    maxPromptChars: n('MAX_PROMPT_CHARS', 9000),
    maxBodyBytes: n('MAX_BODY_BYTES', 40000),
    maxOutTokens: n('MAX_OUT_TOKENS', 6000),
    groqMaxOut: n('GROQ_MAX_OUT_TOKENS', 3500),
    budgetMs: n('TOTAL_BUDGET_MS', 85000),
    providerMs: { gemini: n('GEMINI_TIMEOUT_MS', 40000), groq: n('GROQ_TIMEOUT_MS', 30000), openrouter: n('OPENROUTER_TIMEOUT_MS', 40000) },
    order: String(env.PROVIDER_ORDER || 'gemini,groq,openrouter').split(',').map((s) => s.trim()).filter(Boolean),
    models: {
      gemini: env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      groq: env.GROQ_MODEL || 'openai/gpt-oss-120b',
      openrouter: env.OPENROUTER_MODEL || 'openrouter/free',
    },
    origins: String(env.ALLOWED_ORIGINS || 'https://www.ai-instatoon.com,*-ai-instatoon.love75x.workers.dev').split(',').map((s) => s.trim()).filter(Boolean),
  };
}

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const fail = (status, code, message) => json(status, { ok: false, code, message });

export function originAllowed(origin, list) {
  if (!origin) return false;
  let host; try { host = new URL(origin).host; } catch { return false; }
  return list.some((p) => (p.startsWith('*') ? host.endsWith(p.slice(1)) && /^https:/.test(origin) : (p.includes('://') ? origin === p : host === p)));
}

/** 한국 시간 날짜(YYYY-MM-DD). 하루 한도는 한국 자정에 풀린다. */
export function kstDay(ms) { return new Date(ms + 9 * 3600e3).toISOString().slice(0, 10); }

async function hashIp(ip, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('ip:' + (secret || 'dev')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip || 'unknown')));
  return [...sig.slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** AI가 돌려준 글에서 JSON을 꺼낸다(앱의 parseAIJson과 같은 방식). */
export function extractJson(raw) {
  const t = String(raw || '').replace(/```json|```/g, '').trim();
  try { return JSON.parse(t); } catch { /* 아래에서 다시 */ }
  const a = t.search(/[[{]/), b = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch { /* 실패 */ } }
  return null;
}

/* ───────── 공급자 호출: 성공하면 {ok:true,text}, 한도면 {ok:false,rate:true,retryMs}, 그 밖의 실패면 {ok:false} ───────── */
async function post(fetchFn, url, headers, body, ms) {
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), Math.max(1000, ms));
  try { return await fetchFn(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal: ctl.signal }); }
  finally { clearTimeout(to); }
}
function retryMsOf(res, j) {
  const h = parseFloat(res.headers.get('retry-after')); if (h > 0) return h * 1000;
  const m = JSON.stringify(j || {}).match(/"retryDelay":"([\d.]+)s"|retry in ([\d.]+)s/i); const s = m && parseFloat(m[1] || m[2]); return s > 0 ? s * 1000 : 60000;
}
export const PROVIDERS = {
  async gemini(env, cfg, prompt, fetchFn, ms) {
    if (!env.GEMINI_KEY) return { ok: false };
    const res = await post(fetchFn, `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.models.gemini)}:generateContent`, { 'x-goog-api-key': env.GEMINI_KEY },
      { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.9, maxOutputTokens: cfg.maxOutTokens } }, ms);
    const j = await res.json().catch(() => ({}));
    if (res.status === 429 || /RESOURCE_EXHAUSTED/.test(j?.error?.status || '')) return { ok: false, rate: true, retryMs: retryMsOf(res, j) };
    if (!res.ok) return { ok: false };
    const text = (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
    return text ? { ok: true, text } : { ok: false };
  },
  async groq(env, cfg, prompt, fetchFn, ms) {
    if (!env.GROQ_KEY) return { ok: false };
    const body = { model: cfg.models.groq, messages: [{ role: 'user', content: prompt }], temperature: 0.9, max_tokens: cfg.groqMaxOut, response_format: { type: 'json_object' } };
    if (/^openai\/gpt-oss/.test(cfg.models.groq)) body.reasoning_effort = env.GROQ_REASONING || 'low';
    const res = await post(fetchFn, 'https://api.groq.com/openai/v1/chat/completions', { authorization: 'Bearer ' + env.GROQ_KEY }, body, ms);
    const j = await res.json().catch(() => ({}));
    if (res.status === 429) return { ok: false, rate: true, retryMs: retryMsOf(res, j) };
    if (!res.ok) return { ok: false };
    const text = j.choices?.[0]?.message?.content || '';
    return text ? { ok: true, text } : { ok: false };
  },
  async openrouter(env, cfg, prompt, fetchFn, ms) {
    if (!env.OPENROUTER_KEY) return { ok: false };
    const res = await post(fetchFn, 'https://openrouter.ai/api/v1/chat/completions', { authorization: 'Bearer ' + env.OPENROUTER_KEY, 'http-referer': 'https://www.ai-instatoon.com', 'x-title': 'ai-instatoon' },
      { model: cfg.models.openrouter, messages: [{ role: 'user', content: prompt }], temperature: 0.9, max_tokens: cfg.maxOutTokens }, ms);
    const j = await res.json().catch(() => ({}));
    if (res.status === 429) return { ok: false, rate: true, retryMs: retryMsOf(res, j) };
    if (!res.ok) return { ok: false };
    const text = j.choices?.[0]?.message?.content || '';
    return text ? { ok: true, text } : { ok: false };
  },
};

/** 요청 한 건 처리. deps: { fetch, now(), quota } — quota는 Quota 저장소(하루 횟수 세기). */
export async function handle(request, env, deps = {}) {
  const fetchFn = deps.fetch || fetch, clock = deps.now || (() => Date.now()), now = clock();
  const cfg = config(env);
  if (request.method !== 'POST') return fail(405, 'bad_request', 'POST로만 쓸 수 있어요.');
  if (!cfg.enabled) return fail(503, 'unavailable', '무료 맛보기를 지금은 쓸 수 없어요.');
  if (!originAllowed(request.headers.get('origin'), cfg.origins)) return fail(403, 'forbidden', '허용되지 않은 주소에서 보낸 요청이에요.');

  const len = parseInt(request.headers.get('content-length') || '0', 10);
  if (len > cfg.maxBodyBytes) return fail(413, 'bad_request', '입력이 너무 길어요.');
  let raw; try { raw = await request.text(); } catch { return fail(400, 'bad_request', '요청을 읽지 못했어요.'); }
  if (raw.length > cfg.maxBodyBytes) return fail(413, 'bad_request', '입력이 너무 길어요.');
  let body; try { body = JSON.parse(raw); } catch { return fail(400, 'bad_request', '요청 형식이 달라요.'); }
  const { task, prompt, ts } = body || {};

  // 정해진 작업만: 작업 이름 + 요청 문장 첫 줄 + 출력 형식 표지 + 길이
  const T = Object.prototype.hasOwnProperty.call(TASKS, task) ? TASKS[task] : null;
  if (!T || typeof prompt !== 'string' || !prompt.startsWith(T.head) || !prompt.includes(JSON_MARK) || prompt.length > cfg.maxPromptChars)
    return fail(400, 'bad_request', '맛보기로는 인스타툰 한 편 만들기와 한 달 기획만 쓸 수 있어요.');

  const ip = request.headers.get('cf-connecting-ip') || '';
  // 봇 차단(Turnstile)
  if (typeof ts !== 'string' || !ts || ts.length > 2048) return fail(403, 'turnstile', '사람인지 확인이 필요해요.');
  const vr = await fetchFn('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret: env.TURNSTILE_SECRET || '', response: ts, remoteip: ip }) }).then((r) => r.json()).catch(() => ({}));
  if (!vr.success) return fail(403, 'turnstile', '사람인지 확인하지 못했어요. 다시 해 주세요.');

  const uh = await hashIp(ip, env.TURNSTILE_SECRET);
  // IP별 분당 제한(Cloudflare Rate Limiting 바인딩, 없으면 건너뜀)
  if (env.RL && typeof env.RL.limit === 'function') { const r = await env.RL.limit({ key: uh }); if (!r.success) return fail(429, 'rate', '잠깐 뒤에 다시 눌러 주세요.'); }

  const quota = deps.quota; if (!quota) return fail(503, 'unavailable', '무료 맛보기를 지금은 쓸 수 없어요.');
  const day = kstDay(now);
  const lim = cfg.perDay[task];
  const b = await quota.begin(day, uh, task, lim);
  if (!b.ok) return fail(429, 'daily', '오늘 무료 맛보기를 이미 썼어요.');

  const deadline = now + cfg.budgetMs; let tried = 0;
  for (const name of cfg.order) {
    const fn = PROVIDERS[name]; if (!fn) continue;
    const left = deadline - clock(); if (left < 8000) break;
    const st = await quota.canUse(day, name, cfg.caps[name] ?? 0, clock()); if (!st) continue;
    tried++;
    let r; try { r = await fn(env, cfg, prompt, fetchFn, Math.min(cfg.providerMs[name] || 30000, left - 1000)); } catch { r = { ok: false }; }
    if (r.rate) { await quota.block(name, clock() + Math.min(r.retryMs || 60000, 3600e3)); continue; }
    if (!r.ok) continue;
    const parsed = extractJson(r.text);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed[T.need])) continue; // 형식이 어긋난 답은 다음 공급자로
    await quota.used(day, name);
    return json(200, { ok: true, provider: name, text: r.text });
  }
  await quota.refund(day, uh, task);
  return fail(503, 'exhausted', '오늘 무료 맛보기가 끝났어요.');
}

/** 하루 횟수 저장소. storage는 {get,put,delete,list}만 쓴다(Durable Object 저장소 또는 시험용 메모리). */
export class QuotaStore {
  constructor(storage) { this.s = storage; }
  async purge(day) {
    const cur = await this.s.get('meta:day');
    if (cur === day) return;
    for (const prefix of ['u:', 'p:']) for (const k of (await this.s.list({ prefix })).keys()) if (!k.startsWith(`${prefix}${day}:`)) await this.s.delete(k);
    await this.s.put('meta:day', day);
  }
  async begin(day, uh, task, limit) {
    await this.purge(day);
    const k = `u:${day}:${uh}:${task}`, n = (await this.s.get(k)) || 0;
    if (n >= limit) return { ok: false };
    await this.s.put(k, n + 1); return { ok: true };
  }
  async refund(day, uh, task) { const k = `u:${day}:${uh}:${task}`, n = (await this.s.get(k)) || 0; if (n > 0) await this.s.put(k, n - 1); }
  async canUse(day, name, cap, nowMs) {
    const until = (await this.s.get('b:' + name)) || 0; if (until > nowMs) return false;
    return ((await this.s.get(`p:${day}:${name}`)) || 0) < cap;
  }
  async block(name, untilMs) { await this.s.put('b:' + name, untilMs); }
  async used(day, name) { const k = `p:${day}:${name}`; await this.s.put(k, ((await this.s.get(k)) || 0) + 1); }
}

/** 화면이 맛보기를 보여 줄지 정하는 공개 설정(비밀값은 절대 싣지 않는다). */
export function publicConfig(env, hasQuota) {
  const cfg = config(env);
  const hasProvider = ['GEMINI_KEY', 'GROQ_KEY', 'OPENROUTER_KEY'].some((k) => !!env[k]);
  const on = cfg.enabled && hasQuota && hasProvider && !!env.TURNSTILE_SITEKEY && !!env.TURNSTILE_SECRET;
  return { ok: true, taste: on, sitekey: on ? String(env.TURNSTILE_SITEKEY) : '', perDay: cfg.perDay };
}
