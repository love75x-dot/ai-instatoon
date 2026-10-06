// 관리자가 고친 프롬프트 틀을 모든 방문자에게 전달하는 Vercel 서버 함수.
// GET  /api/prompts                → 공개. { configured, prompts:{id:text}, arts:{over,custom,hidden}|null }
// POST /api/prompts {action,...}   → 관리자 비밀번호 필요: login | save | reset | changePw | saveArts | resetArts
// 그림체 설정(arts): 기본 그림체 수정(over)·숨김(hidden)·관리자가 추가한 그림체(custom)를 JSON 하나로 저장.
// 저장소: Upstash Redis(REST). 환경변수는 docs/ADMIN_SERVER_SETUP.md 참고.
import crypto from 'node:crypto';

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const ENV_PW = process.env.ADMIN_PASSWORD || '';
const CONFIGURED = !!(KV_URL && KV_TOKEN && ENV_PW);
const IDS = ['make', 'rewrite', 'review', 'rules', 'flow', 'month', 'reelText', 'stats', 'reply'];
const MAX_LEN = 30000;
const K_PROMPTS = 'instatoon:prompts', K_PW = 'instatoon:adminpw', K_ARTS = 'instatoon:arts';

async function kv(cmd) {
  const r = await fetch(KV_URL, { method: 'POST', headers: { Authorization: 'Bearer ' + KV_TOKEN }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
async function checkPw(pw) {
  if (typeof pw !== 'string' || !pw) return false;
  const raw = await kv(['GET', K_PW]);
  if (raw) { const { salt, hash } = JSON.parse(raw); return same(hashPw(pw, salt), hash); }
  return same(pw, ENV_PW); // 아직 바꾼 적 없으면 환경변수 ADMIN_PASSWORD가 비밀번호
}
async function readPrompts() {
  const arr = (await kv(['HGETALL', K_PROMPTS])) || [], o = {};
  for (let i = 0; i < arr.length; i += 2) if (IDS.includes(arr[i])) o[arr[i]] = arr[i + 1];
  return o;
}

// ----- 그림체 설정 검증: 알려진 칸만, 길이 제한, '<' '>' 제거 -----
const KEY_RE = /^[a-z0-9_]{1,24}$/, COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const LIM = { name: 40, desc: 200, prompt: 1500, bg: 500 }, LET_LIM = 300, MAX_CUSTOM = 30;
const clean = (v, n) => (typeof v === 'string' ? v.replace(/[<>]/g, '').trim().slice(0, n) : '');
function cleanArt(a) {
  if (!a || typeof a !== 'object') return null;
  const o = {};
  for (const f of Object.keys(LIM)) { const t = clean(a[f], LIM[f]); if (t) o[f] = t; }
  const L = {};
  for (const f of ['title', 'bubble', 'sfx', 'hl']) { const t = clean(a.letter && a.letter[f], LET_LIM); if (t) L[f] = t; }
  if (Object.keys(L).length) o.letter = L;
  for (const f of ['c1', 'c2']) if (typeof a[f] === 'string' && COLOR_RE.test(a[f])) o[f] = a[f];
  return o;
}
function cleanArts(x) {
  if (!x || typeof x !== 'object') return null;
  const out = { over: {}, custom: {}, hidden: [] };
  for (const k of Object.keys(x.over || {})) { if (!KEY_RE.test(k)) continue; const a = cleanArt(x.over[k]); if (a) out.over[k] = a; }
  const ck = Object.keys(x.custom || {}).filter((k) => KEY_RE.test(k));
  if (ck.length > MAX_CUSTOM) return null;
  for (const k of ck) { const a = cleanArt(x.custom[k]); if (!a || !a.name || !a.prompt) return null; out.custom[k] = a; }
  if (Array.isArray(x.hidden)) out.hidden = [...new Set(x.hidden.filter((k) => typeof k === 'string' && KEY_RE.test(k)))].slice(0, 100);
  return out;
}
async function readArts() {
  const raw = await kv(['GET', K_ARTS]);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const send = (code, obj) => res.status(code).send(JSON.stringify(obj));
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=10, stale-while-revalidate=30');
      return send(200, { configured: CONFIGURED, prompts: CONFIGURED ? await readPrompts() : {}, arts: CONFIGURED ? await readArts() : null });
    }
    if (req.method !== 'POST') return send(405, { error: 'method' });
    res.setHeader('Cache-Control', 'no-store');
    if (!CONFIGURED) return send(503, { error: 'not_configured' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!(await checkPw(b.password))) { await new Promise((r) => setTimeout(r, 800)); return send(401, { error: 'bad_password' }); }
    switch (b.action) {
      case 'login': return send(200, { ok: true });
      case 'save':
        if (!IDS.includes(b.id) || typeof b.text !== 'string' || !b.text.trim() || b.text.length > MAX_LEN) return send(400, { error: 'bad_input' });
        await kv(['HSET', K_PROMPTS, b.id, b.text]); return send(200, { ok: true });
      case 'reset':
        if (!IDS.includes(b.id)) return send(400, { error: 'bad_input' });
        await kv(['HDEL', K_PROMPTS, b.id]); return send(200, { ok: true });
      case 'saveArts': {
        const arts = cleanArts(b.arts);
        if (!arts) return send(400, { error: 'bad_input' });
        await kv(['SET', K_ARTS, JSON.stringify(arts)]); return send(200, { ok: true, arts });
      }
      case 'resetArts': await kv(['DEL', K_ARTS]); return send(200, { ok: true });
      case 'changePw': {
        if (typeof b.newPassword !== 'string' || b.newPassword.length < 4 || b.newPassword.length > 200) return send(400, { error: 'bad_input' });
        const salt = crypto.randomBytes(16).toString('hex');
        await kv(['SET', K_PW, JSON.stringify({ salt, hash: hashPw(b.newPassword, salt) })]); return send(200, { ok: true });
      }
      default: return send(400, { error: 'bad_action' });
    }
  } catch (e) {
    return send(500, { error: 'server' });
  }
}
