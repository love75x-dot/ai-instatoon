// 기존 데이터 호환 검사: 옛 형식 localStorage·백업 파일이 지금 코드에서도 그대로 불러와지는지 확인한다.
// 새 필드가 "추가"되는 것은 허용하고, 기존 값이 사라지거나 바뀌면 실패한다.
//   node dev/compat/check.mjs
import fs from 'node:fs';
import path from 'node:path';
import { root, serve, launch, newPage, checker } from '../lib/harness.mjs';

const fx = (n) => JSON.parse(fs.readFileSync(path.join(root, 'dev', 'compat', 'fixtures', n), 'utf8'));
const ls = fx('ls-full.json'), v3 = fx('ls-legacy-v3.json'), v4 = fx('ls-legacy-v4.json'), backup = fx('backup-v1.json'), exp = fx('expected.json');
const C = checker();
// 첫 방문 둘러보기(helpSeen 없을 때 1단계로 되돌림)가 검사를 흔들지 않게, 기존 이용자처럼 '안내 확인함'을 깔아 둔다.
const SEEN = { 'instatoon.helpSeen': '1' };

/** expected 의 모든 값이 actual 에 같게 들어 있는지(추가 필드는 허용). 어긋난 첫 경로를 돌려준다. */
function missing(e, a, p = '') {
  if (e === null || typeof e !== 'object') return e === a ? null : `${p}: ${JSON.stringify(e)?.slice(0, 60)} → ${JSON.stringify(a)?.slice(0, 60)}`;
  if (a === null || typeof a !== 'object') return `${p}: 객체/배열이 사라짐`;
  if (Array.isArray(e)) { if (!Array.isArray(a) || a.length !== e.length) return `${p}: 배열 길이 ${e.length} → ${a?.length}`; for (let i = 0; i < e.length; i++) { const m = missing(e[i], a[i], `${p}[${i}]`); if (m) return m; } return null; }
  for (const k of Object.keys(e)) { const m = missing(e[k], a[k], p ? `${p}.${k}` : k); if (m) return m; }
  return null;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const srv = await serve(); const browser = await launch();

async function loaded(seed, opts = {}) {
  const h = await newPage(browser, srv.base, { ...opts, ls: { ...SEEN, ...seed } });
  await h.page.goto(srv.base + '/'); await h.page.waitForTimeout(500);
  return h;
}
const snapshot = (page) => page.evaluate(() => ({ S: JSON.parse(JSON.stringify(S)), prompts: { setup: setupPrompt(), cuts: cuts().map((c, i) => cutPrompt(c, i)), end: endPrompt(), sheets: peopleIdx().map((k) => sheetPrompt(k)) } }));
const lsDump = (page) => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])));

// 저장소 이전 단계가 생기면 "확인 완료" 표시(instatoon.storage.verified)가 생기기 전까지 원본 localStorage 값을 지우면 안 된다.
const idbRows = (page) => page.evaluate(() => new Promise((res) => { const r = indexedDB.open('instatoonStore', 1); r.onsuccess = () => { const q = r.result.transaction('kv').objectStore('kv').getAll(); q.onsuccess = () => res(q.result.map((x) => [x.k, x.v])); q.onerror = () => res(null); }; r.onerror = () => res(null); }));
async function legacyKept(page, seed, label) {
  const now = await lsDump(page);
  const idbOn = await page.evaluate(() => kv.mode === 'idb');
  // 새 저장소로 옮겼더라도, 옮긴 첫 실행에서는 원래 localStorage 값이 하나도 사라지면 안 된다(원본 정리는 확인한 다음 실행에서만)
  const lost = Object.keys(seed).filter((k) => k !== 'instatoonRoom.v4' && now[k] !== seed[k]);
  const s4 = seed['instatoonRoom.v4'] ? missing(JSON.parse(seed['instatoonRoom.v4']), JSON.parse(now['instatoonRoom.v4'] || 'null')) : null;
  C.ok(!lost.length && !s4, `${label}: 이전 확인 전(옮긴 첫 실행)에는 원본 데이터 보존${lost.length ? ' (사라진 키: ' + lost.join(', ') + ')' : ''}${s4 ? ' (' + s4 + ')' : ''}`);
  if (!idbOn) return C.ok(now['instatoon.storage.verified'] !== '1', `${label}: 새 저장소를 못 쓰는 환경 → 기존 저장소 그대로 사용(이전 확인 표시 없음)`);
  const rows = new Map(((await idbRows(page)) || []).filter((r) => r[0] !== '__meta'));
  const diff = Object.keys(seed).filter((k) => k !== 'instatoonRoom.v4' && rows.get(k) !== seed[k]);
  const s5 = seed['instatoonRoom.v4'] ? missing(JSON.parse(seed['instatoonRoom.v4']), JSON.parse(rows.get('instatoonRoom.v4') || 'null')) : null;
  return C.ok(!diff.length && !s5 && now['instatoon.storage.verified'] === '1', `${label}: 새 저장소(IndexedDB)에 모든 항목이 똑같이 복사되고 이전 확인 표시가 남${diff.length ? ' (다른 키: ' + diff.join(', ') + ')' : ''}${s5 ? ' (' + s5 + ')' : ''}`);
}

for (const noIDB of [false, true]) {
  const tag = noIDB ? '[IndexedDB 없음] ' : '';
  // A) 현재 형식 전체 저장 내용
  {
    const { page, errors } = await loaded(ls, { noIDB });
    const r = await snapshot(page);
    C.ok(!missing(exp.full.S, r.S), `${tag}현재 형식: 작업 상태(S) 그대로 복원` + (missing(exp.full.S, r.S) ? ' ← ' + missing(exp.full.S, r.S) : ''));
    C.ok(same(exp.full.prompts, r.prompts), `${tag}현재 형식: 불러온 작업의 프롬프트 동일`);
    const extra = await page.evaluate(() => ({ key: API.key, photo0: getPhoto(0), ref0: refOf(0), ref1: refOf(1), copied: [...COPIED], tm: kv.getItem('instatoon.textModel') }));
    C.ok(extra.tm === ls['instatoon.textModel'] && (await page.evaluate(() => API.text)) === ls['instatoon.textModel'] && (await page.evaluate(() => API.image)) === ls['instatoon.imageModel'], `${tag}현재 형식: 저장된 모델 선택값(대본·그림)이 그대로 쓰임`);
    C.ok(extra.key === ls['instatoon.key'] && extra.photo0 === ls['instatoon.photo.0'] && extra.ref0 === ls['instatoon.charRef'] && extra.ref1 === ls['instatoon.charRef2'], `${tag}현재 형식: API 키·사진·기준 이미지`);
    C.ok(same(extra.copied, JSON.parse(ls['instatoon.copied'])), `${tag}현재 형식: 복사 ✓ 표시`);
    // 모든 앱 단계·탭이 오류 없이 그려지는지
    const modes = await page.evaluate(() => { const bad = []; for (const mode of ['one', 'month', 'reels', 'stats']) for (const step of ['input', 'edit', 'post']) { try { S.mode = mode; S.step = step; render(); } catch (e) { bad.push(mode + '/' + step + ': ' + e.message); } } return bad; });
    C.ok(!modes.length && !errors.length, `${tag}현재 형식: 모든 모드·3단계 화면 오류 없음(옛 reels·stats는 홈으로)` + (modes[0] ? ' ← ' + modes[0] : '') + (errors[0] ? ' ← ' + errors[0] : ''));
    await legacyKept(page, ls, `${tag}현재 형식`);
  }
  // B) 옛 v3
  {
    const { page, errors } = await loaded(v3, { noIDB });
    const r = await snapshot(page);
    C.ok(!missing(exp.v3.S, r.S) && !errors.length, `${tag}옛 v3 형식: 이어받기` + (missing(exp.v3.S, r.S) ? ' ← ' + missing(exp.v3.S, r.S) : ''));
  }
  // C) 잔재 필드가 남은 v4
  {
    const { page, errors } = await loaded(v4, { noIDB });
    const r = await snapshot(page);
    C.ok(!missing(exp.v4legacy.S, r.S) && !errors.length, `${tag}잔재 필드 v4: 값 유지` + (missing(exp.v4legacy.S, r.S) ? ' ← ' + missing(exp.v4legacy.S, r.S) : ''));
    C.ok(same(exp.v4legacy.prompts, r.prompts), `${tag}잔재 필드 v4: 프롬프트 동일`);
  }
  // D) 백업 파일 불러오기 → 다시 내보내기
  {
    const { page, errors } = await loaded({}, { noIDB });
    await page.evaluate(() => { registerFont = async () => {}; }); // 가짜 폰트 바이트라 글꼴 등록만 건너뜀(저장소 왕복은 그대로 검사)
    await page.evaluate(async (txt) => { await restoreBackup(new File([txt], 'b.json', { type: 'application/json' })); }, JSON.stringify(backup));
    const r = await snapshot(page);
    C.ok(!missing(exp.full.S, r.S), `${tag}백업 불러오기: 작업 상태(S) 복원` + (missing(exp.full.S, r.S) ? ' ← ' + missing(exp.full.S, r.S) : ''));
    const got = await page.evaluate(() => ({ p0: getPhoto(0), p1: getPhoto(1), r0: refOf(0), r1: refOf(1), s: kv.getItem('instatoon.sample.chibi'), s2: kv.getItem('instatoon.sample.mono') }));
    C.ok(got.p0 === backup.photos[0] && got.p1 === backup.photos[1] && got.r0 === backup.refs[0] && got.r1 === backup.refs[1] && got.s === backup.samples.chibi && got.s2 === backup.samples.mono, `${tag}백업 불러오기: 사진·기준 이미지·샘플 복원`);
    const fonts = await page.evaluate(async () => (await idbAll()).length);
    C.ok(noIDB ? fonts === 0 : fonts === backup.fonts.length, `${tag}백업 불러오기: 폰트 ${noIDB ? '(IndexedDB 없어도 오류 없이 넘어감)' : '복원'}`);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => makeBackup())]);
    const out = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
    C.ok(out.app === 'instatoon' && out.v === 1 && same(Object.keys(out).sort(), Object.keys(backup).sort()), `${tag}백업 내보내기: 파일 형식(app·v·항목) 동일`);
    C.ok(!missing(backup.state, out.state) && same(out.photos, backup.photos) && same(out.refs, backup.refs) && same(out.samples, backup.samples) && (noIDB || same(out.fonts, backup.fonts)), `${tag}백업 내보내기: 불러온 내용이 그대로 다시 나감` + (missing(backup.state, out.state) ? ' ← ' + missing(backup.state, out.state) : ''));
    C.ok(!errors.length, `${tag}백업 왕복: 페이지 오류 없음` + (errors[0] ? ' ← ' + errors[0] : ''));
  }
}
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 호환 검사 ${C.fail}건 실패` : '\n[PASS] 호환 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
