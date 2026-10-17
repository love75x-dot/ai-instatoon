// 4d 가게(작업 공간) 검사: 가게 1개일 때 지금과 같음(키 이름 그대로) / 추가·전환·이름 바꾸기·지우기 /
// 가게끼리 작업·사진·보관함·프롬프트가 섞이지 않음(A→B→A 복귀 시 처음과 같음) / 가게 백업(v1·v2·전체) 왕복 / 다른 가게에서 가져오기(복사) / ID 겹침.
//   node dev/design/shops.mjs
import fs from 'node:fs';
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();
const PC = { width: 1300, height: 900 };
const withKey = { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' };
const open = async (vp = PC) => { const h = await newPage(browser, srv.base, { viewport: vp, ls: withKey, freeze: false }); await h.page.goto(srv.base + '/'); await h.page.waitForTimeout(500); return h; };
const helpers = `
  window.mk = (n, seed) => { const u = new Uint8Array(n); let x = seed; for (let i = 0; i < n; i++) { x = (x * 1103515245 + 12345) & 0x7fffffff; u[i] = x >> 16; } u[0] = 0x89; return new Blob([u], { type: 'image/png' }); };
  window.im = (n, seed, size) => ({ blob: mk(size, seed), name: n, type: 'image/png', size });
  window.seed = async (tag, charId, placeName) => {
    S = demoState('bakery'); S.demo = false; S.step = 'input'; S.mode = 'one'; S.info.cast = tag + '단골(' + tag + '색 모자)';
    await vaultPut('characters', { id: charId, kind: 'main', role: tag + '사장', age: '40대', gender: '여성', looks: tag + ' 단발', card: {}, images: { ref: im(charId + '.png', 3, 20000), turn: null, expr: null, outfits: [] }, savedAt: 1000, updatedAt: 1000, ready: true });
    await vaultPut('places', { name: placeName, desc: tag + ' 장소', image: im('p.png', 4, 8000), savedAt: 2000, updatedAt: 2000 });
    linkSlot('m0', charId); kv.setItem('instatoon.photo.0', 'data:image/png;base64,' + tag); save();
  };
  window.promptOf = () => setupPrompt() + '\\n' + sheetPrompt(0) + '\\n' + cutPrompt(cuts()[0], 0);`;
const keysOf = (pg) => pg.evaluate(() => { const o = []; for (let i = 0; i < localStorage.length; i++) o.push(localStorage.key(i)); return o; });
const menuShop = async (pg) => { await pg.locator('#menuBtn').click(); await pg.waitForTimeout(250); await pg.locator('#shopSlot [data-shop="open"]').click(); await pg.waitForTimeout(250); };
const gone = async (pg) => { await pg.waitForLoadState('domcontentloaded'); await pg.waitForTimeout(700); };

// ─── 1. 가게 1개: 지금과 같다 ───
const A = await open(); const pg = A.page; await pg.evaluate(helpers);
const slot0 = await pg.evaluate(() => { const s = document.querySelector('#shopSlot'); return { hidden: s.hidden, text: s.textContent.trim() }; });
C.ok(!slot0.hidden && /^내 가게\s*▾$/.test(slot0.text), `가게가 1개면 ☰ 메뉴 맨 위에 작은 "내 가게 ▾"만 보임 (${slot0.text})`);
await pg.evaluate(() => seed('아침', '빵순이', '아침빵집'));
await pg.waitForTimeout(300);
const keys1 = await pg.evaluate(() => ({ plain: kvRaw.get('instatoonRoom.v4') !== null, photo: kvRaw.get('instatoon.photo.0') !== null, mapped: shopKey('instatoonRoom.v4') }));
C.ok(keys1.plain && keys1.photo && keys1.mapped === 'instatoonRoom.v4', '기본 가게(내 가게)는 기존 키 이름 그대로 저장되고 꼬리표(@)가 없음');
C.ok(await pg.evaluate(() => !/가게:|·/.test(document.querySelector('#savedTxt')?.textContent || '') ), '가게가 1개면 저장 줄에 가게 이름이 붙지 않음');
const promptA0 = await pg.evaluate(() => promptOf());
C.ok(promptA0.includes('아침단골') && promptA0.includes('빵순이'), 'A 가게 프롬프트에 A의 표식(조연 메모·보관함 인물 ID)이 들어감');

// ─── 2. 가게 추가 · 이름 바꾸기 ───
await menuShop(pg);
C.ok(await pg.locator('#shopSheet').innerText().then((t) => /가게마다 작업·사진·내 캐릭터가 따로/.test(t) && /\+ 가게 추가/.test(t) && /저장 공간|편 /.test(t)), '가게 시트: 목록·"+ 가게 추가"');
C.ok(await pg.locator('#shopSheet [data-shop="add"]').count() === 1, '새 버튼은 "+ 가게 추가" 하나뿐');
await pg.locator('#shopSheet [data-shop="add"]').click(); await pg.waitForTimeout(120);
await pg.locator('#shopAddIn').fill('저녁식당'); await pg.locator('#shopSheet [data-shop="addok"]').click(); await pg.waitForTimeout(200);
const shops2 = await pg.evaluate(() => SHOPS.map((s) => s.name));
C.ok(shops2.length === 2 && shops2[1] === '저녁식당', '가게 추가: 목록에 2개');
// 이름 바꾸기
await pg.locator('#shopSheet [data-shop="menu"]').nth(1).click(); await pg.waitForTimeout(100);
await pg.locator('#shopSheet [data-shop="ren"]').click(); await pg.waitForTimeout(100);
await pg.locator('#shopRenIn').fill('저녁식당 본점'); await pg.locator('#shopSheet [data-shop="renok"]').click(); await pg.waitForTimeout(150);
C.ok(await pg.evaluate(() => SHOPS[1].name === '저녁식당 본점'), '이름 바꾸기');
C.ok(await pg.evaluate(() => /지금 가게:\s*내 가게/.test(document.querySelector('#shopSlot').textContent)), '가게가 2개 이상이면 "지금 가게: 이름 ▾"');
C.ok(await pg.evaluate(() => /내 가게 · /.test(document.querySelector('#savedTxt')?.textContent || '') || !document.querySelector('#savedTxt')), '2개 이상이면 저장 줄 앞에 가게 이름');

// ─── 3. 전환(새로고침) → B는 비어 있음 ───
const idB = await pg.evaluate(() => SHOPS[1].id);
await pg.locator(`#shopSheet [data-shop="sw"][data-id="${idB}"]`).click(); await gone(pg);
await pg.evaluate(helpers);
const inB = await pg.evaluate(() => ({ cur: CUR, name: S.info.cast, chars: Object.keys(VAULT.chars), places: Object.keys(VAULT.places), photo: kv.getItem('instatoon.photo.0') }));
C.ok(inB.cur === idB && !inB.name && inB.chars.length === 0 && inB.places.length === 0 && !inB.photo, '가게 B로 바꾸면 작업·사진·보관함이 모두 비어 있음(A 것이 안 보임)');
await pg.evaluate(() => seed('저녁', '식당이', '저녁식당홀')); await pg.waitForTimeout(300);
const keysB = await pg.evaluate((id) => ({ b: kvRaw.get('instatoonRoom.v4@' + id) !== null, bp: kvRaw.get('instatoon.photo.0@' + id) !== null, a: kvRaw.get('instatoonRoom.v4') !== null }), idB);
C.ok(keysB.b && keysB.bp && keysB.a, 'B의 작업·사진은 @꼬리표 키에 저장되고, A의 키는 그대로 남음');
const promptB = await pg.evaluate(() => promptOf());
C.ok(promptB.includes('저녁단골') && promptB.includes('식당이') && !promptB.includes('아침') && !promptB.includes('빵순이'), 'B 프롬프트에 A의 표식(아침·빵순이)이 섞이지 않음');
const rawA = await pg.evaluate(() => JSON.parse(localStorage.getItem('instatoonRoom.v4') || kvRaw.get('instatoonRoom.v4') || 'null'));
C.ok(rawA && String(rawA.info.cast).includes('아침') && !JSON.stringify(rawA).includes('저녁'), 'A의 저장본에는 B의 내용이 없음');

// 새 탭처럼: 마지막 가게 기억 / 이 탭의 가게 유지
C.ok(await pg.evaluate(() => kvRaw.get('instatoon.lastShop')) === idB, '마지막 가게가 기억됨');

// ─── 4. A로 복귀: 처음과 똑같다 ───
await menuShop(pg);
await pg.locator('#shopSheet [data-shop="sw"]').first().click(); await gone(pg);
await pg.evaluate(helpers);
const promptA1 = await pg.evaluate(() => promptOf());
C.ok(promptA1 === promptA0, 'A로 돌아오면 프롬프트가 처음과 글자까지 같음');
C.ok(await pg.evaluate(() => Object.keys(VAULT.chars).join() === '빵순이' && Object.keys(VAULT.places).join() === '아침빵집'), 'A의 보관함은 A 것만 보임(식당이·저녁식당홀 안 보임)');
C.ok(await pg.evaluate(() => Object.keys(ALLV.chars).length === 2), '(내부) 모든 가게 보관함은 따로 보관됨');

// ─── 5. ID 겹침 / 다른 가게에서 가져오기(복사) ───
C.ok(await pg.evaluate(async () => (await vaultPut('characters', { id: '식당이', kind: 'main', images: {}, savedAt: 1, updatedAt: 1 })) === false), '다른 가게가 쓰는 인물 ID로는 저장되지 않음(덮어쓰기 방지)');
await pg.evaluate(() => openVault({})); await pg.waitForTimeout(150);
C.ok(await pg.locator('#vaultSheet [data-v="cp"]').count() === 1, '보관함에 글자 링크 "다른 가게에서 가져오기"(가게가 2개 이상일 때)');
await pg.locator('#vaultSheet [data-v="cp"]').click(); await pg.waitForTimeout(150);
await pg.locator('#vaultSheet [data-vcp="c:식당이"]').check(); await pg.locator('#vaultSheet [data-vcp="p:저녁식당홀"]').check();
await pg.locator('#vaultSheet [data-v="cpgo"]').click(); await pg.waitForTimeout(400);
const cp = await pg.evaluate(() => ({ a: Object.keys(VAULT.chars), ap: Object.keys(VAULT.places), all: Object.keys(ALLV.chars), srcStill: shopVaultCount(SHOPS[1].id) }));
C.ok(cp.a.includes('식당이_2') && cp.ap.includes('저녁식당홀_2') && cp.srcStill === 2, `가져오기는 복사(원래 가게에 그대로), ID가 겹치면 새 ID로 (${cp.a.join(',')})`);
await pg.evaluate(() => closeVault()); await pg.waitForTimeout(100);

// ─── 6. 백업: 가게 1개→2개 ───
const dl = async (fn) => { const [d] = await Promise.all([pg.waitForEvent('download'), pg.evaluate(fn)]); return JSON.parse(fs.readFileSync(await d.path(), 'utf8')); };
const shopBk = await dl(() => makeBackup({ img: false, scope: 'shop' }));
C.ok(shopBk.app === 'instatoon' && shopBk.v === 2 && shopBk.kind === 'shop' && shopBk.shop.name === '내 가게' && shopBk.state && !JSON.stringify(shopBk).includes('TEST'), '가게가 여러 개일 때 "이 가게만" 백업은 v2(kind:shop)이고 API 키가 없음');
const allBk = await dl(() => makeBackup({ img: true, scope: 'all' }));
C.ok(allBk.v === 2 && allBk.kind === 'all' && allBk.shops.length === 2 && !allBk.state && allBk.shops.every((s) => s.state) && !JSON.stringify(allBk).includes('TEST'), '"전체 가게" 백업: 가게 2개가 파일 하나에, API 키 없음');
C.ok(allBk.shops[1].vault && allBk.shops[1].vault.chars.some((c) => c.id === '식당이') && !allBk.shops[0].vault.chars.some((c) => c.id === '식당이'), '전체 백업의 보관함은 가게별로 나뉘어 들어감');
const stamps = await pg.evaluate(() => SHOPS.map((s) => +rawGet('instatoon.lastBackup', s.id) || 0));
C.ok(stamps.every((t) => t > 0), '전체 백업을 하면 모든 가게의 백업 시각이 갱신됨');
// 백업 창의 범위 선택
await pg.evaluate(() => openBackupWin()); await pg.waitForTimeout(150);
C.ok(await pg.locator('#bkWin input[name="bkScope"]').count() === 2, '백업 창에 "이 가게만 / 전체 가게" 선택(2개 이상일 때만)');
await pg.evaluate(() => closeBackupWin());

// ─── 7. 새 브라우저에서 전체 백업 불러오기 ───
const allPath = '__shops_all.json'; fs.writeFileSync(allPath, JSON.stringify(allBk));
const B = await open(); const pb = B.page; await pb.evaluate(helpers);
await pb.locator('#backupIn').setInputFiles(allPath); await pb.waitForTimeout(300);
C.ok(await pb.locator('#askSheet').innerText().then((t) => /가게 2개/.test(t) && /비어 있어서/.test(t)), '전체 백업 불러오기: 비어 있는 브라우저면 그대로 옮긴다고 안내');
await pb.locator('#askSheet [data-ask="go"]').click(); await pb.waitForTimeout(900);
const ra = await pb.evaluate(() => ({ n: SHOPS.length, names: SHOPS.map((s) => s.name), cur: S.info.cast, chars: Object.keys(VAULT.chars) }));
C.ok(ra.n === 2 && ra.names[0] === '내 가게' && ra.cur.includes('아침') && ra.chars.includes('빵순이'), `비어 있는 브라우저: 첫 가게는 지금 가게 자리에 들어옴 (${ra.names.join(',')})`);
await menuShop(pb); await pb.locator('#shopSheet [data-shop="sw"]').nth(1).click(); await gone(pb); await pb.evaluate(helpers);
const rb = await pb.evaluate(() => ({ cast: S.info.cast, chars: Object.keys(VAULT.chars), photo: kv.getItem('instatoon.photo.0') }));
C.ok(rb.cast.includes('저녁') && rb.chars.includes('식당이') && !rb.chars.includes('빵순이') && String(rb.photo).includes('저녁'), '두 번째 가게로 바꾸면 저녁 가게 내용(작업·사진·보관함)이 그대로 있음');

// ─── 8. 옛 단일 백업(v1)을 가게 여러 개인 브라우저에 불러오기 → 새 가게로 추가(기본) ───
const oldV1 = { app: 'instatoon', v: 1, savedAt: new Date().toISOString(), state: shopBk.state, photos: shopBk.photos, refs: shopBk.refs || {}, samples: {}, fonts: [] };
oldV1.state = JSON.parse(JSON.stringify(oldV1.state)); oldV1.state.info.cast = '옛백업단골';
fs.writeFileSync('__shops_v1.json', JSON.stringify(oldV1));
await pb.locator('#backupIn').setInputFiles('__shops_v1.json'); await pb.waitForTimeout(300);
C.ok(await pb.locator('#askSheet [data-ask="new"]').count() === 1 && await pb.locator('#askSheet [data-ask="over"]').count() === 1, '가게가 여러 개일 때 옛 백업: "새 가게로 추가 / 덮어쓰기" 선택');
await pb.locator('#askSheet [data-ask="new"]').click(); await pb.waitForTimeout(500);
const r3 = await pb.evaluate(() => ({ n: SHOPS.length, cur: S.info.cast, newCast: JSON.parse(rawGet('instatoonRoom.v4', SHOPS[2].id)).info.cast }));
C.ok(r3.n === 3 && r3.newCast === '옛백업단골' && r3.cur.includes('저녁'), '새 가게로 추가: 지금 가게는 그대로, 새 가게에 옛 백업 내용이 들어감');

// ─── 9. 지우기 2단계 · 마지막 1개는 못 지움 ───
await pb.evaluate(() => openShopSheet()); await pb.waitForTimeout(150);
const delId = await pb.evaluate(() => SHOPS[2].id);
await pb.locator(`#shopSheet [data-shop="menu"][data-id="${delId}"]`).click(); await pb.waitForTimeout(100);
await pb.locator(`#shopSheet [data-shop="del"][data-id="${delId}"]`).click(); await pb.waitForTimeout(100);
C.ok(await pb.locator('#shopSheet').innerText().then((t) => /백업 파일을 받아 둘까요/.test(t)), '지우기 1단계: 백업 권유');
await pb.locator('#shopSheet [data-shop="delnext"]').click(); await pb.waitForTimeout(100);
C.ok(await pb.locator('#shopSheet').innerText().then((t) => /정말 지울까요/.test(t)), '지우기 2단계: 정말 지울까요');
await pb.locator('#shopSheet [data-shop="delgo"]').click(); await pb.waitForTimeout(400);
const dl3 = await pb.evaluate((id) => ({ n: SHOPS.length, key: kvRaw.get('instatoonRoom.v4@' + id) }), delId);
C.ok(dl3.n === 2 && dl3.key === null, '지운 가게의 작업 키가 사라짐');
await pb.evaluate(() => { SHOPS = SHOPS.slice(0, 1); }); await pb.evaluate(() => { SH.menu = SHOPS[0].id; shopRender(); }); await pb.waitForTimeout(100);
C.ok(await pb.locator('#shopSheet [data-shop="del"]').count() === 0, '가게가 1개만 남으면 지우기 버튼이 없음(마지막 1개는 삭제 불가)');

// ─── 10. 휴대폰 ───
const M = await open({ width: 390, height: 844 }); await M.page.evaluate(helpers);
await menuShop(M.page);
const ov = await M.page.evaluate(() => { const w = document.querySelector('#shopSheet .sheet-in'); return w.scrollWidth <= w.clientWidth + 1; });
C.ok(ov, '휴대폰: 가게 시트가 가로로 넘치지 않음');

for (const f of ['__shops_all.json', '__shops_v1.json']) try { fs.unlinkSync(f); } catch (_) {}
for (const h of [A, B, M]) if (h.errors.length) { C.ok(false, '콘솔 오류: ' + h.errors.slice(0, 2).join(' | ')); }
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 가게 검사 ${C.fail}건 실패` : '\n[PASS] 가게 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
