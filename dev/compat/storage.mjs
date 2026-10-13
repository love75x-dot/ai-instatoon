// 저장소 이전(localStorage → IndexedDB) 검사. 기존 작업이 어떤 상황에서도 사라지지 않는지 확인한다.
//   node dev/compat/storage.mjs
// 확인하는 것: 처음 열 때 자동 이전 · 확인 전 원본 보존 · 다음 실행에서만 원본 정리 · 복사 실패/중간 중단/IndexedDB 없음·열기 실패 · 탭 두 개 동시 · 큰 데이터 · 쓰기 실패 · 옛 버전이 쓴 값 · 백업 파일 호환
import fs from 'node:fs';
import path from 'node:path';
import { root, serve, launch, newPage, checker } from '../lib/harness.mjs';

const fx = (n) => JSON.parse(fs.readFileSync(path.join(root, 'dev', 'compat', 'fixtures', n), 'utf8'));
const ls = { ...fx('ls-full.json'), 'instatoon.helpSeen': '1' }, exp = fx('expected.json'), backup = fx('backup-v1.json');
const C = checker();
const srv = await serve(); const browser = await launch();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function missing(e, a, p = '') {
  if (e === null || typeof e !== 'object') return e === a ? null : `${p}: ${JSON.stringify(e)?.slice(0, 40)} → ${JSON.stringify(a)?.slice(0, 40)}`;
  if (a === null || typeof a !== 'object') return `${p}: 사라짐`;
  if (Array.isArray(e)) { if (!Array.isArray(a) || a.length !== e.length) return `${p}: 배열 길이`; for (let i = 0; i < e.length; i++) { const m = missing(e[i], a[i], `${p}[${i}]`); if (m) return m; } return null; }
  for (const k of Object.keys(e)) { const m = missing(e[k], a[k], p ? `${p}.${k}` : k); if (m) return m; }
  return null;
}
const DATA = (k) => k.startsWith('instatoon') && !k.startsWith('instatoon.storage.');
const info = (page) => page.evaluate(() => ({ mode: kv.mode, state: kv.state, flag: localStorage.getItem('instatoon.storage.verified'), lsData: Object.keys(localStorage).filter((k) => k.startsWith('instatoon') && !k.startsWith('instatoon.storage.')), S: JSON.parse(JSON.stringify(S)) }));
const idbDump = (page) => page.evaluate(() => new Promise((res) => { const r = indexedDB.open('instatoonStore', 1); r.onsuccess = () => { const q = r.result.transaction('kv').objectStore('kv').getAll(); q.onsuccess = () => { const o = {}; q.result.forEach((x) => { o[x.k] = x.v; }); res(o); }; }; r.onerror = () => res(null); }));
const meta = (d) => (d && d.__meta ? JSON.parse(d.__meta) : null);
const boot = async (opts = {}, url = '/') => { const h = await newPage(browser, srv.base, opts); await h.page.goto(srv.base + url); await h.page.waitForTimeout(700); return h; };
const reload = async (page) => { await page.evaluate(() => kv.flush()); await page.waitForTimeout(250); await page.reload(); await page.waitForTimeout(700); };
const prompts = (page) => page.evaluate(() => ({ setup: setupPrompt(), cuts: cuts().map((c, i) => cutPrompt(c, i)), end: endPrompt(), sheets: peopleIdx().map((k) => sheetPrompt(k)) }));
const seedKeys = Object.keys(ls).filter(DATA);

// 1) 처음 열 때: 자동 이전 + 원본 보존 + 똑같은지 확인
{
  const { page, errors } = await boot({ ls });
  const i = await info(page), d = await idbDump(page), m = meta(d);
  C.ok(i.mode === 'idb' && i.state === 'verified' && i.flag === '1' && m && m.state === 'verified', `처음 열면 자동으로 새 저장소로 옮기고 확인함 (모드 ${i.mode}, 상태 ${i.state})`);
  C.ok(seedKeys.filter((k) => k !== 'instatoonRoom.v4').every((k) => d[k] === ls[k]) && !missing(JSON.parse(ls['instatoonRoom.v4']), JSON.parse(d['instatoonRoom.v4'])), `새 저장소에 ${seedKeys.length}개 항목이 글자까지 똑같이 복사됨(작업 상태는 내용 동일)`);
  C.ok(seedKeys.every((k) => i.lsData.includes(k)), '확인 전·옮긴 첫 실행에서는 원본 localStorage 항목이 하나도 지워지지 않음');
  C.ok(!missing(exp.full.S, i.S) && same(await prompts(page), exp.full.prompts), '옮긴 뒤에도 작업 내용과 만들어지는 프롬프트가 그대로');
  C.ok(await page.evaluate(() => /옮겼어요/.test(document.querySelector('#toast').textContent) || kv.notice === 'migrated'), '옮겼다는 안내가 한 번 나옴');
  C.ok(!errors.length, '첫 이전: 페이지 오류 없음' + (errors[0] ? ' ← ' + errors[0] : ''));
  // 2) 다음 실행: 원본 정리
  await reload(page);
  const j = await info(page), d2 = await idbDump(page);
  C.ok(j.mode === 'idb' && j.state === 'cleaned' && meta(d2).state === 'cleaned', `다음에 열면 확인된 원본을 정리함 (상태 ${j.state})`);
  C.ok(j.lsData.length === 0 && j.flag === '1', '정리 뒤 localStorage에는 작업 데이터가 없고 확인 표시만 남음');
  C.ok(!missing(exp.full.S, j.S) && same(await prompts(page), exp.full.prompts), '정리 뒤에도 새 저장소에서 읽은 작업·프롬프트가 그대로');
  const got = await page.evaluate(() => ({ p0: getPhoto(0), r0: refOf(0), key: API.key, copied: [...COPIED], sample: kv.getItem('instatoon.sample.chibi') }));
  C.ok(got.p0 === ls['instatoon.photo.0'] && got.r0 === ls['instatoon.charRef'] && got.key === ls['instatoon.key'] && same(got.copied, JSON.parse(ls['instatoon.copied'])) && got.sample === ls['instatoon.sample.chibi'], '사진·기준 이미지·API 키·복사 표시·샘플도 그대로 읽힘');
  // 3) 정리 뒤 저장
  await page.evaluate(() => { S.info.name = '새이름'; save(); kv.setItem('instatoon.photo.2', 'data:image/png;base64,ZZZ'); });
  await reload(page);
  const k = await info(page);
  C.ok(k.S.info.name === '새이름' && (await page.evaluate(() => getPhoto(2))) === 'data:image/png;base64,ZZZ' && k.lsData.length === 0, '정리 뒤 새로 저장한 값이 새로고침 후에도 남고, localStorage에는 쓰지 않음');
  // 12) 백업 파일: 정리된 상태에서도 같은 형식으로 내보내고 불러옴
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.evaluate(() => makeBackup())]);
  const out = dl ? JSON.parse(fs.readFileSync(await dl.path(), 'utf8')) : null;
  C.ok(out && out.app === 'instatoon' && out.v === 1 && same(Object.keys(out).sort(), Object.keys(backup).sort()) && out.photos[0] === ls['instatoon.photo.0'] && out.refs[0] === ls['instatoon.charRef'] && out.samples.chibi === ls['instatoon.sample.chibi'], '새 저장소 상태에서 내보낸 백업 파일이 기존과 같은 형식·내용');
  await page.evaluate(async (txt) => { registerFont = async () => {}; await restoreBackup(new File([txt], 'b.json', { type: 'application/json' })); }, JSON.stringify(backup));
  await reload(page);
  const r = await info(page);
  C.ok(!missing(exp.full.S, r.S) && (await page.evaluate(() => getPhoto(1))) === backup.photos[1] && r.lsData.length === 0, '기존 백업 파일을 불러오면 새 저장소에 저장되고 새로고침 뒤에도 남음');
  await page.close();
}

// 4) 확인했지만 아직 정리 전: 새로 저장하는 값은 두 곳에 같이 기록 → 다음 실행에 최신 값
{
  const { page } = await boot({ ls });
  await page.evaluate(() => { kv.setItem('instatoon.copied', '["a","b"]'); S.info.name = '이중기록'; save(); kv.flush(); });
  const i = await info(page);
  const lsNow = await page.evaluate(() => localStorage.getItem('instatoon.copied'));
  C.ok(i.state === 'verified' && lsNow === '["a","b"]', '정리 전에는 새 값을 새 저장소와 localStorage에 같이 씀(되돌려야 할 때 안전)');
  await reload(page);
  const j = await info(page), d = await idbDump(page);
  C.ok(j.state === 'cleaned' && j.S.info.name === '이중기록' && d['instatoon.copied'] === '["a","b"]' && j.lsData.length === 0, '다음 실행: 정리되고 최신 값이 새 저장소에 있음');
  await page.close();
}

// 5) 복사 확인 실패(복사본이 달라짐): 원본 유지, 기존 저장소로 계속 동작, 다음에 다시 시도해 성공
{
  const init = () => { const p = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function (v, k) { if (sessionStorage.getItem('__corrupt') && v && v.k === 'instatoonRoom.v4') v = { k: v.k, v: v.v.slice(0, -5) }; return p.call(this, v, k); }; };
  const h = await newPage(browser, srv.base, { ls }); await h.page.addInitScript(init); await h.page.addInitScript(() => { if (!sessionStorage.getItem('__seeded2')) { sessionStorage.setItem('__seeded2', '1'); sessionStorage.setItem('__corrupt', '1'); } });
  await h.page.goto(srv.base + '/'); await h.page.waitForTimeout(800);
  const i = await info(h.page);
  C.ok(i.mode === 'ls' && i.state === 'failed' && i.flag === null, `복사본이 원본과 다르면 이전을 실패 처리하고 기존 저장소로 계속 동작 (모드 ${i.mode}, 상태 ${i.state})`);
  C.ok(seedKeys.every((k) => i.lsData.includes(k)) && !missing(exp.full.S, i.S) && !h.errors.length, '실패해도 원본 데이터와 화면은 그대로이고 오류 없음');
  await h.page.evaluate(() => { S.info.name = '실패중저장'; save(); });
  await h.page.evaluate(() => sessionStorage.removeItem('__corrupt')); await h.page.reload(); await h.page.waitForTimeout(900);
  const j = await info(h.page);
  C.ok(j.mode === 'idb' && j.state === 'verified' && j.flag === '1' && j.S.info.name === '실패중저장', '다음 실행에서 다시 시도해 성공하고, 그 사이 저장한 내용도 이어받음');
  await h.page.close();
}
// 6) 이전 도중 중단(탭 닫힘 등): 새 저장소에는 아무것도 남기지 않고 원본 유지 → 다음에 정상 이전
{
  const init = () => { let n = 0; const p = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function (v, k) { if (sessionStorage.getItem('__abort') && ++n === 2) throw new DOMException('중단', 'DataError'); return p.call(this, v, k); }; };
  const h = await newPage(browser, srv.base, { ls }); await h.page.addInitScript(init); await h.page.addInitScript(() => { if (!sessionStorage.getItem('__seeded3')) { sessionStorage.setItem('__seeded3', '1'); sessionStorage.setItem('__abort', '1'); } });
  await h.page.goto(srv.base + '/'); await h.page.waitForTimeout(800);
  const i = await info(h.page), d = await idbDump(h.page);
  C.ok(i.mode === 'ls' && Object.keys(d || {}).length === 0 && seedKeys.every((k) => i.lsData.includes(k)) && !missing(exp.full.S, i.S), '이전 도중 중단되면 새 저장소에는 반쪽 데이터가 남지 않고(트랜잭션 취소) 원본·화면은 그대로');
  await h.page.evaluate(() => sessionStorage.removeItem('__abort')); await h.page.reload(); await h.page.waitForTimeout(900);
  const j = await info(h.page);
  C.ok(j.mode === 'idb' && j.state === 'verified', '다음 실행에서 처음부터 다시 이전해 성공');
  await h.page.close();
}
// 7) 탭 두 개가 동시에 열릴 때
{
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } }); const errs = [];
  const mkPage = async () => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.route('**/*', (r) => (r.request().url().startsWith(srv.base) ? r.continue() : r.fulfill({ status: 200, body: '' }))); return p; };
  const p0 = await mkPage(); await p0.goto(srv.base + '/guide/'); await p0.evaluate((seed) => { localStorage.clear(); Object.entries(seed).forEach(([k, v]) => localStorage.setItem(k, v)); }, ls);
  const a = await mkPage(), b = await mkPage();
  await Promise.all([a.goto(srv.base + '/'), b.goto(srv.base + '/')]); await a.waitForTimeout(1200);
  const ia = await info(a), ib = await info(b), d = await idbDump(a), m = meta(d);
  C.ok(ia.mode === 'idb' && ib.mode === 'idb' && ['verified', 'cleaned'].includes(m.state) && m.tries === 1, `탭 두 개가 동시에 열려도 한 번만 안전하게 이전됨 (탭A ${ia.state}, 탭B ${ib.state}, 시도 ${m.tries}번)`);
  C.ok(Object.keys(d).filter((k) => k !== '__meta').length === seedKeys.length && !missing(exp.full.S, ia.S) && !missing(exp.full.S, ib.S) && !errs.length, '두 탭 모두 작업이 그대로이고 항목 누락·중복·오류 없음' + (errs[0] ? ' ← ' + errs[0] : ''));
  await ctx.close();
}
// 8) IndexedDB 없음 / 열기 실패 → 기존 저장소 그대로
for (const [label, opts, init] of [['IndexedDB 없음', { noIDB: true }, null], ['IndexedDB 열기 실패', {}, () => { indexedDB.open = () => { const r = {}; setTimeout(() => r.onerror && r.onerror(new Event('error')), 0); return r; }; }]]) {
  const h = await newPage(browser, srv.base, { ls, ...opts }); if (init) await h.page.addInitScript(init);
  await h.page.goto(srv.base + '/'); await h.page.waitForTimeout(800);
  const i = await info(h.page);
  C.ok(i.mode === 'ls' && i.flag === null && seedKeys.every((k) => i.lsData.includes(k)) && !missing(exp.full.S, i.S) && !h.errors.length, `${label}: 기존 저장소(localStorage)로 그대로 동작, 원본 변화·오류 없음`);
  await h.page.evaluate(() => { S.info.name = 'LS저장'; save(); }); await h.page.reload(); await h.page.waitForTimeout(700);
  C.ok((await info(h.page)).S.info.name === 'LS저장', `${label}: 저장·새로고침 뒤에도 값이 남음`);
  const big = await h.page.evaluate(() => { S = demoState('bakery'); const x = 'data:image/jpeg;base64,' + 'A'.repeat(3.2e6); S.toon.pics = [x, x, x]; save(); return document.querySelector('#savedTxt') ? document.querySelector('#savedTxt').textContent : ''; });
  C.ok(/저장하지 못했어요/.test(big), `${label}: 큰 그림(약 10MB)은 예전처럼 저장 공간 부족을 알려 줌`);
  await h.page.close();
}
// 10) 새 저장소에서는 큰 그림도 저장됨 + 11) 처음 쓰는 사용자
{
  const { page, errors } = await boot({ ls: {} });
  const i = await info(page);
  C.ok(i.mode === 'idb' && i.state === 'cleaned' && i.flag === null && i.lsData.length === 0, '처음 쓰는 사용자(옮길 것 없음): 바로 새 저장소를 사용');
  const r = await page.evaluate(() => { S = demoState('bakery'); S.demo = false; const x = 'data:image/jpeg;base64,' + 'A'.repeat(3.2e6); S.toon.pics = [x, x, x]; save(); return document.querySelector('#savedTxt') ? document.querySelector('#savedTxt').textContent : ''; });
  await reload(page);
  const n = await page.evaluate(() => (S.toon && S.toon.pics ? S.toon.pics.map((p) => p.length) : []));
  C.ok(!/저장하지 못했어요/.test(r) && n.length === 3 && n.every((x) => x > 3e6), `새 저장소: 큰 그림(약 10MB)도 저장되고 새로고침 뒤에도 남음 (${r})`);
  C.ok(!errors.length, '새 저장소 사용: 페이지 오류 없음');
  await page.close();
}
// 13) 새 저장소 쓰기 실패 → 알려 줌
{
  const h = await newPage(browser, srv.base, { ls: { 'instatoon.helpSeen': '1' } });
  await h.page.addInitScript(() => { const p = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function (v, k) { if (sessionStorage.getItem('__werr') && v && v.k === 'instatoonRoom.v4') throw new DOMException('quota', 'QuotaExceededError'); return p.call(this, v, k); }; });
  await h.page.goto(srv.base + '/'); await h.page.waitForTimeout(700);
  await h.page.evaluate(() => { sessionStorage.setItem('__werr', '1'); S = demoState('bakery'); S.demo = false; save(); kv.flush(); });
  await h.page.waitForTimeout(400);
  C.ok(await h.page.evaluate(() => /저장하지 못했어요/.test(document.querySelector('#savedTxt').textContent)), '새 저장소 쓰기가 실패하면 "저장하지 못했어요"로 알려 줌');
  await h.page.close();
}
// 14) 정리된 뒤 옛 버전(localStorage만 쓰는 버전)이 값을 쓴 경우: 그 값이 최신이므로 이어받음
{
  const { page } = await boot({ ls }); await reload(page);
  const s = JSON.parse(ls['instatoonRoom.v4']); s.info.name = '옛버전이쓴이름';
  await page.evaluate((v) => localStorage.setItem('instatoonRoom.v4', v), JSON.stringify(s));
  await reload(page);
  const i = await info(page), d = await idbDump(page);
  C.ok(i.S.info.name === '옛버전이쓴이름' && JSON.parse(d['instatoonRoom.v4']).info.name === '옛버전이쓴이름' && i.state === 'verified', '옛 버전이 localStorage에 쓴 값은 최신으로 보고 새 저장소에 반영(정리는 다음 실행으로 미룸)');
  await reload(page); const j = await info(page);
  C.ok(j.state === 'cleaned' && j.S.info.name === '옛버전이쓴이름' && j.lsData.length === 0, '그다음 실행에서 정리');
  await page.close();
}
// 15) 안내 패널의 "저장소 상태"
{
  const { page } = await boot({ ls }); await page.evaluate(() => toggleHelp(true)); await page.waitForTimeout(200);
  const t = await page.evaluate(() => document.querySelector('#kvInfo').textContent);
  C.ok(/새 저장소/.test(t) && /확인했어요/.test(t), `"전체 사용 안내" 맨 아래 저장소 상태 표시: ${t.slice(0, 40)}…`);
  await reload(page); await page.evaluate(() => toggleHelp(true)); await page.waitForTimeout(200);
  C.ok(/정리가 끝났어요/.test(await page.evaluate(() => document.querySelector('#kvInfo').textContent)), '다음 실행에서는 "정리가 끝났어요"로 바뀜');
  await page.close();
}
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 저장소 이전 검사 ${C.fail}건 실패` : '\n[PASS] 저장소 이전 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
