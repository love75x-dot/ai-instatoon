// 4a 후속 검사: 백업(보관함 포함·이미지 빼고·용량 표시)→다른 브라우저(새 저장소)에서 불러오기, 같은 ID 처리(새 ID로 추가·덮어쓰기·건너뛰기),
// 캐릭터만 내보내기/불러오기, 7일 알림에 보관함 변경 포함, 첨부 이미지 목록(번호·파일 이름·한 번에 내려받기·14장 배분·나누기),
// 컷별 의상 선택, 한 컷 4명 초과 경고.
//   node dev/design/vault2.mjs
import fs from 'node:fs';
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();
const PC = { width: 1300, height: 900 }, MOB = { width: 390, height: 844 };
const withKey = { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' };
const open = async (vp = PC, freeze = true) => { const h = await newPage(browser, srv.base, { viewport: vp, ls: withKey, freeze }); await h.page.goto(srv.base + '/'); await h.page.waitForTimeout(500); return h; };
const helpers = `
  window.mk = (n, seed) => { const u = new Uint8Array(n); let x = seed; for (let i = 0; i < n; i++) { x = (x * 1103515245 + 12345) & 0x7fffffff; u[i] = x >> 16; } u[0] = 0x89; return new Blob([u], { type: 'image/png' }); };
  window.fnv = async (blob) => { const u = new Uint8Array(await blob.arrayBuffer()); let h = 2166136261; for (const x of u) { h ^= x; h = Math.imul(h, 16777619) >>> 0; } return h + ':' + u.length; };
  window.seedVault = async () => {
    const im = (n, seed, size) => ({ blob: mk(size, seed), name: n, type: 'image/png', size });
    await vaultPut('characters', { id: '사장님_A', kind: 'main', role: '사장님', age: '40대', gender: '여성', looks: '짧은 단발', card: { keep: '안경은 항상 동그란 테' }, images: { ref: im('a.png', 1, 200000), turn: im('b.png', 2, 100000), expr: im('c.png', 3, 80000), outfits: [{ ...im('u.png', 4, 50000), name: '유니폼', file: 'u.png' }] }, savedAt: 1000, updatedAt: 1000 });
    await vaultPut('characters', { id: '알바생_B', kind: 'main', role: '알바생', age: '20대', gender: '남성', looks: '까치머리', card: {}, images: { ref: im('d.jpg', 5, 60000), turn: null, expr: null, outfits: [] }, savedAt: 2000, updatedAt: 2000 });
    await vaultPut('places', { name: '빵집', desc: '나무 진열대가 있는 동네 빵집', image: im('shop.webp', 6, 30000), savedAt: 3000, updatedAt: 3000 });
    return { a: await fnv(VAULT.chars['사장님_A'].images.ref.blob), u: await fnv(VAULT.chars['사장님_A'].images.outfits[0].blob), p: await fnv(VAULT.places['빵집'].image.blob) };
  };`;

// ─── A 브라우저: 저장 → 알림 → 백업 ───
const A = await open(PC, false); await A.page.evaluate(helpers);
await A.page.evaluate(() => { S = demoState('bakery'); S.demo = false; S.step = 'input'; S.mode = 'one'; save(); render(); });
const hashes = await A.page.evaluate(() => seedVault());
await A.page.waitForTimeout(200);
C.ok(await A.page.evaluate(() => { const d = backupDue(); return !!(d && d.vault); }) && await A.page.locator('#bkNote').innerText().then((t) => /새로 저장한 캐릭터가 있어요/.test(t)), '캐릭터를 새로 저장하면 백업 알림이 바로 뜸(7일을 기다리지 않음)');
await A.page.locator('.ht[data-act="backup"]').click(); await A.page.waitForTimeout(250);
const dlg = await A.page.locator('#bkSheet').innerText();
C.ok(/작업 약 .+ \+ 보관함 이미지 약 .+ = 약 .+/.test(dlg) && /인물 2명 · 장소 1개/.test(dlg) && /이미지 빼고 저장/.test(dlg), `저장 전에 용량(작업+보관함 이미지)과 "이미지 빼고 저장" 선택지가 보임 (${dlg.split('\n').find((x) => /작업 약/.test(x))})`);
const [dlFull] = await Promise.all([A.page.waitForEvent('download'), A.page.locator('[data-bk="full"]').click()]);
const fullPath = await dlFull.path(); const full = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
C.ok(full.app === 'instatoon' && full.v === 1 && full.state && full.vault && full.vault.chars.length === 2 && full.vault.places.length === 1, '백업 파일은 기존 형식(v1)에 보관함(vault)만 추가됨');
C.ok(full.vault.chars[0].images.ref.data.startsWith('data:image/png;base64,') && full.vault.withImages === true, '보관함 이미지가 백업 파일에 들어감');
await A.page.waitForTimeout(300);
C.ok(await A.page.evaluate(() => !backupDue()), '이미지 포함 백업을 하면 캐릭터 백업 알림이 사라짐');
await A.page.waitForTimeout(30); await A.page.evaluate(() => { vaultMarkChanged(); }); await A.page.waitForTimeout(100);
C.ok(await A.page.evaluate(() => !!(backupDue() || {}).vault), '그 뒤 보관함을 또 바꾸면 알림이 다시 뜸');
await A.page.locator('.ht[data-act="backup"]').click(); await A.page.waitForTimeout(200);
const [dlLight] = await Promise.all([A.page.waitForEvent('download'), A.page.locator('[data-bk="light"]').click()]);
const light = JSON.parse(fs.readFileSync(await dlLight.path(), 'utf8'));
C.ok(light.vault.withImages === false && !JSON.stringify(light.vault).includes('"data"') && light.vault.chars[0].card.keep === '안경은 항상 동그란 테', '"이미지 빼고 저장"은 이미지 없이 인물 정보·카드만 담김');
C.ok(fs.statSync(await dlLight.path()).size < fs.statSync(fullPath).size / 5, '이미지를 빼면 파일이 훨씬 작음');
C.ok(await A.page.evaluate(() => !!(backupDue() || {}).vault), '이미지를 뺀 백업은 보관함 백업으로 치지 않아 알림이 계속 남음');

// 캐릭터만 내보내기
await A.page.evaluate(() => openVault({})); await A.page.waitForTimeout(150);
await A.page.locator('#vaultSheet [data-v="exp"]').click(); await A.page.waitForTimeout(100);
C.ok(await A.page.locator('#vaultSheet').innerText().then((t) => /이미지 포함\s*\(약 .+\)/.test(t)), '캐릭터만 내보내기에도 용량이 보임');
const [dlChars] = await Promise.all([A.page.waitForEvent('download'), A.page.locator('#vaultSheet [data-v="expgo"]').click()]);
const charsPath = await dlChars.path(); const chars = JSON.parse(fs.readFileSync(charsPath, 'utf8'));
C.ok(chars.app === 'instatoon-characters' && chars.chars.length === 2 && chars.places.length === 1 && chars.chars[0].images.ref.data, '캐릭터만 내보내기 파일(instatoon-characters)에 인물·장소·이미지가 담김');
C.ok(await A.page.evaluate(() => !backupDue()), '캐릭터만 내보내면 보관함 백업으로 침');

// ─── B 브라우저(새 저장소): 백업 파일 불러오기 ───
const B = await open(); await B.page.evaluate(helpers);
C.ok(await B.page.evaluate(() => Object.keys(VAULT.chars).length === 0), '다른 브라우저(새 저장소)의 보관함은 비어 있음');
await B.page.setInputFiles('#backupIn', fullPath); await B.page.waitForTimeout(900);
const rb = await B.page.evaluate(async () => ({ n: Object.keys(VAULT.chars).length, p: Object.keys(VAULT.places).length, a: await fnv(VAULT.chars['사장님_A'].images.ref.blob), u: await fnv(VAULT.chars['사장님_A'].images.outfits[0].blob), pl: await fnv(VAULT.places['빵집'].image.blob), ready: charReady(VAULT.chars['사장님_A']), name: S.info.name }));
C.ok(rb.n === 2 && rb.p === 1 && rb.ready, '백업 파일을 불러오면 인물 2명·장소 1개가 새 브라우저의 보관함에 들어감');
C.ok(rb.a === hashes.a && rb.u === hashes.u && rb.pl === hashes.p, '이미지가 바이트까지 똑같이 복원됨(기준 이미지·의상 시트·장소)');
await B.page.reload(); await B.page.waitForTimeout(700);
C.ok(await B.page.evaluate(() => Object.keys(VAULT.chars).length === 2), '불러온 보관함이 새로고침 뒤에도 남음');
// 같은 내용을 또 불러오면 자동으로 건너뜀(중복 없음)
await B.page.setInputFiles('#backupIn', fullPath); await B.page.waitForTimeout(700);
C.ok(await B.page.evaluate(() => Object.keys(VAULT.chars).join() === '사장님_A,알바생_B' || Object.keys(VAULT.chars).sort().join() === '사장님_A,알바생_B') && await B.page.locator('#vaultSheet:not([hidden])').count() === 0, '똑같은 내용을 다시 불러오면 묻지 않고 건너뜀(중복 안 생김)');
// 내용이 다른 같은 ID: 묻는다 → 새 ID로 추가
await B.page.evaluate(async () => { const c = VAULT.chars['사장님_A']; await vaultPut('characters', { ...c, role: '수정한 역할', updatedAt: 9999 }); });
await B.page.setInputFiles('#backupIn', fullPath); await B.page.waitForTimeout(700);
C.ok(await B.page.locator('#vaultSheet .vrow.imp').count() === 1 && await B.page.locator('#vaultSheet').innerText().then((t) => /사장님_A/.test(t) && /새 ID로 추가/.test(t) && /덮어쓰기/.test(t) && /건너뛰기/.test(t)), '내용이 다른 같은 ID는 덮어쓰기/새 ID로 추가/건너뛰기를 물어봄');
await B.page.locator('#vaultSheet [data-v="impgo"]').click(); await B.page.waitForTimeout(500);
const ad = await B.page.evaluate(() => ({ keys: Object.keys(VAULT.chars).sort(), orig: VAULT.chars['사장님_A'].role, add: VAULT.chars['사장님_A_2'] && VAULT.chars['사장님_A_2'].role }));
C.ok(ad.keys.join() === '사장님_A,사장님_A_2,알바생_B' && ad.orig === '수정한 역할' && ad.add === '사장님', '"새 ID로 추가"는 사장님_A_2로 따로 들어가고 기존 것은 그대로');
// 덮어쓰기(이미지 없는 가벼운 백업으로 덮어도 기존 이미지는 유지)
await B.page.evaluate(async () => { const c = VAULT.chars['알바생_B']; await vaultPut('characters', { ...c, role: '또 수정', updatedAt: 9999 }); });
await B.page.setInputFiles('#backupIn', await dlLight.path()); await B.page.waitForTimeout(700);
C.ok(await B.page.locator('#vaultSheet .vrow.imp').count() >= 1, '이미지 없는 백업의 같은 ID도 묻는다');
await B.page.evaluate(() => { VS.imp.conf.forEach((x) => { x.choice = x.key === '알바생_B' ? 'overwrite' : 'skip'; }); });
await B.page.locator('#vaultSheet [data-v="impgo"]').click(); await B.page.waitForTimeout(500);
const ow = await B.page.evaluate(async () => ({ role: VAULT.chars['알바생_B'].role, img: !!VAULT.chars['알바생_B'].images.ref, keep: VAULT.chars['사장님_A'].role }));
C.ok(ow.role === '알바생' && ow.img && ow.keep === '수정한 역할', '덮어쓰기는 이미지가 없는 칸은 기존 이미지를 유지하고, 건너뛰기는 그대로 둠');
// 이미지 뺀 백업을 빈 저장소에 불러오면 인물 정보만 들어감
const Cc = await open(); await Cc.page.evaluate(helpers);
await Cc.page.setInputFiles('#backupIn', await dlLight.path()); await Cc.page.waitForTimeout(800);
C.ok(await Cc.page.evaluate(() => Object.keys(VAULT.chars).length === 2 && !charReady(VAULT.chars['사장님_A']) && VAULT.chars['사장님_A'].card.keep === '안경은 항상 동그란 테'), '이미지를 뺀 백업은 인물 정보·카드만 복원되고 "기준 이미지 필요"로 표시됨');
// 캐릭터 파일 불러오기(다른 기기용)
const D = await open(); await D.page.evaluate(helpers);
await D.page.evaluate(() => openVault({})); await D.page.waitForTimeout(150);
await D.page.setInputFiles('#vImportIn', charsPath); await D.page.waitForTimeout(800);
C.ok(await D.page.evaluate(async () => Object.keys(VAULT.chars).length === 2 && await fnv(VAULT.chars['사장님_A'].images.ref.blob)) === hashes.a, '"캐릭터 불러오기"로 캐릭터 파일을 열면 이미지까지 들어감');
await D.page.setInputFiles('#vImportIn', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') }); await D.page.waitForTimeout(200);
C.ok(await D.page.locator('#toast').innerText().then((t) => /캐릭터 파일이 아니에요/.test(t)), '엉뚱한 파일은 안내만 하고 아무것도 바꾸지 않음');
// 보관함이 없는 옛 백업을 불러와도 보관함은 건드리지 않음
const oldBk = { app: 'instatoon', v: 1, savedAt: '2026-01-01', state: { ...(await D.page.evaluate(() => blank())), info: { ...(await D.page.evaluate(() => blank().info)), name: '옛 백업' } }, photos: {}, refs: {}, samples: {}, fonts: [] };
await D.page.setInputFiles('#backupIn', { name: 'old.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(oldBk)) }); await D.page.waitForTimeout(600);
C.ok(await D.page.evaluate(() => S.info.name === '옛 백업' && Object.keys(VAULT.chars).length === 2), '보관함이 없는 옛 백업(v1)도 그대로 열리고 보관함은 그대로 남음');

// ─── 첨부 이미지 목록 ───
const E = await open(); await E.page.evaluate(helpers);
await E.page.evaluate(async () => { await seedVault(); S = demoState('bakery'); S.demo = false; S.step = 'post'; S.mode = 'one'; linkSlot('m0', '사장님_A'); linkSlot('m1', '알바생_B'); S.toon.cuts[0].placeId = '빵집'; VAULT_PROMPT2 = true; save(); render(); });
await E.page.waitForTimeout(300);
const att = await E.page.evaluate(() => { const b = document.querySelector('.attbox'); return b ? b.innerText : ''; });
C.ok(/첨부할 이미지 \d+장/.test(att) && /1번 · 사장님_A_00_기준\.png/.test(att) && /2번 · 알바생_B_00_기준\.jpg/.test(att) && /장소_빵집_00\.webp/.test(att), `3단계 규칙 칸에 첨부할 이미지 목록(번호·파일 이름 규칙·원본 확장자)이 보임`);
C.ok(/사장님_A_01_턴어라운드\.png/.test(att) && /번호 없음, 맨 뒤에 붙이세요/.test(att), '번호 없는 참고 이미지(턴어라운드)는 맨 뒤에 붙이라고 안내');
const names = await E.page.evaluate(() => { const P = planFor(attachItems()); return { nums: P.files.map((f) => f.n + ':' + f.file), line: attachLine() }; });
C.ok(names.line.includes('의상 시트') === false && names.nums[0].startsWith('1:사장님_A_00_기준'), '목록 번호가 규칙 문장의 "첨부한 이미지는 순서대로"와 같은 순서');
const dls = []; E.page.on('download', (d) => dls.push(d.suggestedFilename()));
await E.page.locator('[data-v="dlatt"]').first().click(); await E.page.waitForTimeout(2500);
C.ok(dls.length >= 4 && dls.includes('사장님_A_00_기준.png') && dls.includes('장소_빵집_00.webp'), `한 번에 내려받기: 파일 이름 규칙대로 ${dls.length}개 내려받음`);
// 14장 배분 · 나누기 · 4명 초과 경고
const plan = await E.page.evaluate(async () => {
  VAULT_PROMPT2 = true; const im = (n, seed) => ({ blob: mk(100, seed), name: n, type: 'image/png', size: 100 });
  for (let j = 0; j < 6; j++) await vaultPut('characters', { id: 'P' + j, kind: j < 3 ? 'main' : 'sub', role: 'r' + j, card: {}, images: { ref: im('r.png', j), turn: im('t.png', j + 10), expr: im('e.png', j + 20), outfits: [{ ...im('o.png', j + 30), name: 'A' }, { ...im('o.png', j + 40), name: 'B' }] }, savedAt: 1, updatedAt: 1 });
  S = demoState('bakery'); S.demo = false; S.info.link = {}; S.info.subs = [];
  linkSlot('m0', 'P0'); linkSlot('m1', 'P1'); linkSlot('m2', 'P2'); linkSlot('s0', 'P3'); linkSlot('s1', 'P4'); linkSlot('s2', 'P5');
  const all = ['p0', 'p1', 'p2', 's0', 's1', 's2']; const cs = S.toon.cuts; cs.forEach((c) => { c.chars = all.slice(); c.outfit = {}; });
  const r = {};
  r.n6 = planFor(attachItems()).total; ['p0', 'p1', 'p2'].forEach((code) => { cs[0].outfit[code] = 'A'; }); r.p6 = planFor(attachItems()); cs[0].outfit = {};
  all.forEach((code) => { cs[0].outfit[code] = 'A'; cs[1].outfit[code] = 'B'; });
  const big = planFor(attachItems()); r.big = { total: big.total, need: big.need, files: big.files.length, extras: big.extras.length };
  r.bundles = splitBundles().map((b) => b.length); r.warn = cs.length;
  S.info.subs = [S.info.subs[0]]; return r; });
C.ok(plan.p6.files.filter((f) => f.kind === '기준 이미지').length === 6 && plan.p6.total <= 14 && plan.p6.dropped.length === 1 && plan.p6.dropped[0].k === 'turn', `인물 6명: 기준 이미지 6장은 모두 넣고 합계 ${plan.p6.total}장(14장 이하)으로 표정 → 턴어라운드 순으로 ${plan.p6.dropped.length}장 줄임`);
C.ok(plan.big.need && plan.big.extras === 0 && plan.bundles.length >= 2, `기준·의상 이미지만으로 14장을 넘으면(${plan.big.total}장) 묶음을 나눠 안내(${plan.bundles.length}묶음)`);
const two = await E.page.evaluate(() => { S.info.link = {}; S.info.subs = []; if (S.info.p3) S.info.p3.on = false; linkSlot('m0', 'P0'); linkSlot('m1', 'P1'); const cs = S.toon.cuts; cs.forEach((c) => { c.chars = ['p0', 'p1']; c.outfit = {}; c.placeId = ''; delete c.sameBg; }); const p = planFor(attachItems()); const one = (() => { S.info.link = {}; linkSlot('m0', 'P0'); S.info.p2.on = false; cs.forEach((c) => { c.chars = ['p0']; }); return planFor(attachItems()); })(); return { two: p.files.length + ':' + p.extras.length, one: one.files.length + ':' + one.extras.length }; });
C.ok(two.one === '1:2', `${JSON.stringify(two)} 1명이면 기준+턴어라운드+표정 3장(배분표)`);
C.ok(two.two === '2:4', '2명이면 인물당 기준+턴어라운드+표정(최대 3장)');
// 컷별 의상 선택 · 4명 초과 경고
await E.page.evaluate(() => { S = demoState('bakery'); S.demo = false; S.step = 'edit'; S.mode = 'one'; S.info.link = {}; S.info.subs = []; linkSlot('m0', '사장님_A'); linkSlot('m1', '알바생_B'); linkSlot('m2', 'P2'); linkSlot('s0', 'P3'); linkSlot('s1', 'P4'); linkSlot('s2', 'P5'); S.toon.cuts[0].chars = ['p0']; VAULT_PROMPT2 = false; openCut = 0; save(); render(); });
await E.page.waitForTimeout(250);
await E.page.locator('.cut[data-cut="0"] select[data-coutfit="0|p0"]').selectOption('유니폼'); await E.page.waitForTimeout(100);
C.ok(await E.page.evaluate(() => S.toon.cuts[0].outfit.p0 === '유니폼' && cutPrompt(S.toon.cuts[0], 0).includes('등장인물: [사장님_A](주인공, 의상: 유니폼)')), '컷 편집에서 이 컷의 의상을 고르면 데이터(outfit)와 프롬프트에 반영됨');
await E.page.evaluate(() => { VAULT_PROMPT2 = true; });
C.ok(await E.page.evaluate(() => cutPrompt(S.toon.cuts[0], 0).includes('[사장님_A](주인공, 이 컷 의상: 유니폼 — 기본 의상 대신)')), '승인 대기 문장을 켜면 "이 컷 의상: … — 기본 의상 대신"으로 나옴');
await E.page.evaluate(() => { VAULT_PROMPT2 = false; });
for (const code of ['p1', 'p2', 's0', 's1']) await E.page.locator(`.cut[data-cut="0"] [data-cchar="0|${code}"]`).click();
await E.page.waitForTimeout(100);
C.ok(await E.page.locator('.cut[data-cut="0"] .cwarn').innerText().then((t) => /5명이에요\. 컷을 나누는 걸 추천해요/.test(t)), '한 컷에 인물이 4명을 넘으면 "컷을 나누는 걸 추천해요" 경고');
C.ok(E.errors.length === 0 && A.errors.length === 0 && B.errors.length === 0, `페이지 오류 없음 ${[...A.errors, ...B.errors, ...E.errors].slice(0, 3)}`);

// 모바일에서도 가로로 넘치지 않음
const M = await open(MOB); await M.page.evaluate(helpers);
await M.page.evaluate(async () => { await seedVault(); S = demoState('bakery'); S.demo = false; S.step = 'post'; S.mode = 'one'; linkSlot('m0', '사장님_A'); save(); render(); openVault({}); });
await M.page.waitForTimeout(250);
await M.page.locator('#vaultSheet [data-v="exp"]').click(); await M.page.waitForTimeout(100);
C.ok(await M.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector('#vaultSheet .sheet-in').scrollWidth <= document.querySelector('#vaultSheet .sheet-in').clientWidth + 1), '휴대폰: 내보내기 화면이 가로로 넘치지 않음');
await M.page.evaluate(() => closeVault()); await M.page.waitForTimeout(150);
C.ok(await M.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '휴대폰: 3단계 첨부 목록이 가로로 넘치지 않음');

await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 보관함 후속 검사 ${C.fail}건 실패` : '\n[PASS] 보관함 후속 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
