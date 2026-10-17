// 4a단계(캐릭터 보관함) 검사: 보관함 열기·인물/장소 저장(원본 이미지 그대로)·새로고침 뒤 유지·ID 중복·1단계 불러오기·이번 편만 수정(원본 불변)·
// AI 카드 채우기(빈 칸만)·컷 장소 고르기·옛 작업(주인공 3명 구조)이 열고 닫아도 그대로·모바일 가로 넘침 없음.
//   node dev/design/vault.mjs
import crypto from 'node:crypto';
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();
const PC = { width: 1300, height: 900 }, MOB = { width: 390, height: 844 };
const withKey = { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' };
const open = async (vp, ls = withKey) => { const h = await newPage(browser, srv.base, { viewport: vp, ls }); await h.page.goto(srv.base + '/'); await h.page.waitForTimeout(500); return h; };
const png = (n, seed) => { const b = crypto.randomBytes(n); b[0] = 0x89; b[1] = 0x50; b[2] = 0x4e; b[3] = 0x47; return b; };

for (const [vk, vp] of [['PC 1300', PC], ['휴대폰 390', MOB]]) {
  const { page, errors } = await open(vp);
  await page.evaluate(() => { S = demoState('bakery'); S.demo = false; S.step = 'input'; S.mode = 'one'; save(); render(); });

  // 1) 열기: ☰ 메뉴(휴대폰) 또는 1단계의 "캐릭터 보관함 열기"
  { await page.locator('#menuBtn').click(); await page.waitForTimeout(300); await page.locator('#menuPanel [data-v="open"]').click(); }

  await page.waitForTimeout(250);
  C.ok(await page.locator('#vaultSheet:not([hidden]) .sheet-in').count() === 1, `${vk}: 보관함 창이 열림`);
  C.ok(await page.locator('#vaultSheet').innerText().then((t) => /인물 0명 · 장소 0개/.test(t)), `${vk}: 비어 있을 때 개수와 용량이 보임`);

  // 2) 새 인물 저장 (이미지는 올린 파일 그대로)
  await page.locator('#vaultSheet [data-v="new"]').click();
  await page.fill('#v-id', '사장님 A!'); await page.locator('#vaultSheet [data-v="save"]').click();
  C.ok(await page.locator('#vaultSheet .status.err').innerText().then((t) => /ID는/.test(t)), `${vk}: 허용되지 않는 ID는 안내와 함께 막힘`);
  await page.fill('#v-id', '사장님_A'); await page.fill('#v-role', '사장님'); await page.fill('#v-age', '40대'); await page.fill('#v-gender', '여성');
  await page.fill('#v-looks', '짧은 단발, 동그란 안경'); await page.fill('#v-hex', '머스타드 옐로(#D4A017)').catch(() => {});
  await page.fill('[data-vc="keep"]', '안경은 항상 동그란 테');
  const big = png(300 * 1024);
  await page.locator('#vaultSheet [data-v="pickimg"][data-slot="ref"]').click().catch(() => {});
  await page.locator('#vFile').setInputFiles({ name: 'ref.png', mimeType: 'image/png', buffer: big });
  await page.waitForTimeout(150);
  C.ok(await page.locator('#vaultSheet .vimg').first().innerText().then((t) => /ref\.png|사장님_A_00_기준\.png/.test(t) && /KB|MB/.test(t)), `${vk}: 올린 기준 이미지의 파일 이름 규칙(사장님_A_00_기준.png)과 용량이 보임`);
  await page.fill('#v-outname', '유니폼'); await page.locator('#vaultSheet [data-v="pickimg"][data-slot="outfit"]').click().catch(() => {}); await page.locator('#vFile').setInputFiles({ name: 'u.png', mimeType: 'image/png', buffer: png(5000) });
  await page.waitForTimeout(100);
  await page.locator('#vaultSheet [data-v="save"]').click(); await page.waitForTimeout(300);
  const rec = await page.evaluate(async () => { const c = VAULT.chars['사장님_A']; if (!c) return null; const ab = new Uint8Array(await c.images.ref.blob.arrayBuffer()); let h = 0; for (const x of ab) h = (h * 31 + x) >>> 0; return { n: ab.length, h, ready: charReady(c), outfits: c.images.outfits.map((o) => o.name), card: c.card, kind: c.kind }; });
  const hh = (() => { let h = 0; for (const x of big) h = (h * 31 + x) >>> 0; return h; })();
  C.ok(rec && rec.n === big.length && rec.h === hh, `${vk}: 이미지가 올린 파일과 바이트까지 똑같이 저장됨 (${rec && rec.n}바이트)`);
  C.ok(rec && rec.ready && rec.outfits.join() === '유니폼' && rec.card.keep === '안경은 항상 동그란 테', `${vk}: 준비 완료·의상 시트·카드 칸 저장`);
  C.ok(await page.locator('#vaultSheet').innerText().then((t) => /사장님_A/.test(t) && /준비 완료 ✓/.test(t) && /인물 1명/.test(t)), `${vk}: 목록에 ID·준비 완료 ✓·개수가 보임`);

  // 3) ID 중복은 막힘, 새로고침해도 남음
  await page.locator('#vaultSheet [data-v="new"]').click(); await page.fill('#v-id', '사장님_A'); await page.locator('#vaultSheet [data-v="save"]').click();
  C.ok(await page.locator('#vaultSheet .status.err').innerText().then((t) => /이미 있어요/.test(t)), `${vk}: 같은 ID는 새로 만들 수 없음`);
  await page.reload(); await page.waitForTimeout(700);
  C.ok(await page.evaluate(() => !!VAULT.chars['사장님_A'] && VAULT.ok), `${vk}: 새로고침 뒤에도 보관함 인물이 남아 있음`);

  // 4) 장소 저장
  await page.evaluate(() => openVault({ tab: 'places' })); await page.waitForTimeout(150);
  await page.locator('#vaultSheet [data-v="new"]').click(); await page.fill('#v-pname', '빵집'); await page.fill('#v-pdesc', '나무 진열대가 있는 동네 빵집');
  await page.locator('#vaultSheet [data-v="pickimg"][data-slot="place"]').click().catch(() => {}); await page.locator('#vFile').setInputFiles({ name: 'shop.jpg', mimeType: 'image/jpeg', buffer: png(8000) }); await page.waitForTimeout(100);
  C.ok(await page.locator('#vaultSheet .vimg').first().innerText().then((t) => /장소_빵집_00\.jpg/.test(t)), `${vk}: 장소 파일 이름 규칙(장소_빵집_00.jpg, 확장자 원본)`);
  await page.locator('#vaultSheet [data-v="save"]').click(); await page.waitForTimeout(250);
  C.ok(await page.evaluate(() => !!VAULT.places['빵집'] && !!VAULT.places['빵집'].image), `${vk}: 장소 이름·설명·이미지 저장`);
  await page.evaluate(() => closeVault());

  // 5) 1단계에서 보관함 인물 불러오기
  await page.evaluate(() => { S.info.looks = '손으로 쓴 외모'; S.info.role = '직접입력'; save(); vInput(); });
  await page.locator('[data-v="pick"][data-ref="m0"]').click(); await page.waitForTimeout(150);
  await page.locator('#vaultSheet [data-v="choose"][data-id="사장님_A"]').click(); await page.waitForTimeout(250);
  const lk = await page.evaluate(() => ({ id: linkId(0), role: S.info.role, looks: S.info.looks, card: document.querySelector('.lk') && document.querySelector('.lk').innerText, hasLooksInput: !!document.querySelector('#i-looks') }));
  C.ok(lk.id === '사장님_A' && lk.role === '사장님' && lk.looks === '짧은 단발, 동그란 안경', `${vk}: 불러오면 ID가 연결되고 역할·외모가 보관함 값으로 채워짐`);
  C.ok(/사장님_A/.test(lk.card) && /준비 완료 ✓/.test(lk.card) && !lk.hasLooksInput, `${vk}: 연결된 인물은 썸네일·ID·역할 한 줄 카드로 보임`);
  const sheetP = await page.evaluate(() => sheetPrompt(0));
  C.ok(/캐릭터 카드 \[사장님_A\]\n- 대표 색: 머스타드 옐로\(#D4A017\)\n- 절대 유지: 안경은 항상 동그란 테\n그림체:/.test(sheetP), `${vk}: 캐릭터 시트 문장에 카드가 채운 칸만 들어감`);

  // 6) 이번 편만 수정: 원본 불변
  await page.locator('[data-v="ovtoggle"][data-ref="m0"]').click(); await page.waitForTimeout(100);
  await page.fill('#ov-m0-looks', '이번 편: 머리를 묶음');
  await page.fill('#ov-m0-c-hair', '하나로 묶은 머리');
  const ovr = await page.evaluate(() => ({ orig: VAULT.chars['사장님_A'].looks, origHair: VAULT.chars['사장님_A'].card.hair || '', flat: S.info.looks, pr: sheetPrompt(0).includes('- 헤어: 하나로 묶은 머리'), tag: (vInput(), document.querySelector('.lk').innerText.includes('이번 편만 수정됨')) }));
  C.ok(ovr.orig === '짧은 단발, 동그란 안경' && ovr.origHair === '', `${vk}: "이번 편만 수정"은 보관함 원본을 바꾸지 않음`);
  C.ok(ovr.flat === '이번 편: 머리를 묶음' && ovr.pr && ovr.tag, `${vk}: 이번 편에는 수정한 값이 프롬프트에 반영되고 "수정됨" 표시가 붙음`);
  await page.locator('[data-v="ovreset"][data-ref="m0"]').click(); await page.waitForTimeout(100);
  C.ok(await page.evaluate(() => S.info.looks === '짧은 단발, 동그란 안경' && !sheetPrompt(0).includes('하나로 묶은 머리')), `${vk}: 원본으로 되돌리기`);

  // 7) 의상 선택이 컷 프롬프트 등장인물 줄에 들어감
  await page.evaluate(() => { S.toon.cuts[0].chars = ['p0']; });
  await page.locator('select[data-outfit="m0"]').selectOption('유니폼');
  C.ok(await page.evaluate(() => cutPrompt(S.toon.cuts[0], 0).includes('등장인물: [사장님_A](주인공, 이 컷 의상: 유니폼 — 기본 의상 대신) — 캐릭터 시트 인물 중 이 컷에는 이들만 등장')), `${vk}: 의상을 고르면 [ID](주인공, 이 컷 의상: … — 기본 의상 대신)로 들어감`);

  // 8) AI 카드 채우기: 빈 칸만, 요청 문장 확인
  const fill = await page.evaluate(async () => {
    const asked = []; const old = ask; window.ask = async (p) => { asked.push(p); return { face: '새 얼굴형', eyes: '새 눈', hair: '새 헤어', body: '새 체형', feature: '새 특징', outfit: '새 의상', hex: '새 색(#000000)', keep: '새 유지' }; };
    S.info.link[0].ov = {}; const r = slotResolved('m0');
    const out = await aiFillCard({ ...r, card: r.card }, null); window.ask = old;
    return { asked: asked[0] || '', keys: out ? Object.keys(out) : [] }; });
  C.ok(fill.keys.length === 6 && !fill.keys.includes('keep') && !fill.keys.includes('hex'), `${vk}: 카드 채우기는 이미 채운 칸(대표 색·절대 유지)을 빼고 빈 칸 ${fill.keys.length}개만 채움`);
  C.ok(/실제 인물이나 연예인을 닮게 묘사하지 마세요\./.test(fill.asked) && /"색 이름\(#RRGGBB\)" 형식/.test(fill.asked) && /이미 채워진 칸\(바꾸지 마세요\): 대표 색: 머스타드 옐로\(#D4A017\) \/ 절대 유지: 안경은 항상 동그란 테/.test(fill.asked) && /채울 칸: 얼굴형, 눈, 헤어, 체형\(키·등신\), 고유 특징, 의상\n/.test(fill.asked), `${vk}: 카드 채우기 요청 문장이 승인한 내용(연예인 금지·색 이름+HEX·빈 칸만)`);

  // 9) 컷에서 장소 고르기 → 첨부 이미지 줄 + 컷 문장
  await page.evaluate(() => { S = demoState('bakery'); S.demo = false; S.step = 'edit'; S.mode = 'one'; openCut = 0; save(); render(); });
  await page.waitForTimeout(200);
  await page.locator('.cut[data-cut="0"] [data-cadd="0|place"]').click(); await page.waitForTimeout(150);
  await page.locator('.cut[data-cut="0"] [data-cplace="0|빵집"]').click(); await page.waitForTimeout(150);
  const pl = await page.evaluate(() => ({ id: S.toon.cuts[0].placeId, cut: cutPrompt(S.toon.cuts[0], 0).includes('배경·시간대: 첨부한 장소_빵집 이미지와 같은 공간'), setup: /\d번 장소_빵집\(배경 기준 이미지: 나무 진열대가 있는 동네 빵집\)의 이미지예요\./.test(setupPrompt()) }));
  C.ok(pl.id === '빵집' && pl.cut && pl.setup, `${vk}: 장소를 고르면 컷 문장과 규칙의 첨부 이미지 줄(번호)에 들어감`);
  await page.locator('.cut[data-cut="0"] [data-cplace="0|빵집"]').click(); await page.waitForTimeout(100);
  C.ok(await page.evaluate(() => !cutPrompt(S.toon.cuts[0], 0).includes('장소_빵집') && !setupPrompt().includes('장소_빵집')), `${vk}: 장소를 다시 누르면 해제되어 문장이 사라짐`);
  C.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${vk}: 가로로 넘치지 않음`);
  C.ok(errors.length === 0, `${vk}: 페이지 오류 없음 ${errors.slice(0, 2)}`);
  await page.context().close();
}

// 옛 작업(주인공 3명 구조)이 보관함이 없어도 그대로 열리고, 1단계 화면을 그려도 한 글자도 바뀌지 않는다
{
  const { page, errors } = await open(MOB);
  const r = await page.evaluate(() => {
    S = demoState('bakery'); S.demo = false; S.step = 'input'; S.mode = 'one'; S.info.p2 = { role: '알바생', gender: '남성', age: '20대', looks: '까치머리', on: true }; S.info.p3 = { role: '손님', gender: '여성', age: '70대', looks: '보라색 카디건', on: true };
    S.info.cast = '단골 할머니(흰 파마머리)'; delete S.info.link; delete S.info.subs; S.toon.cast = ''; save(); render();
    const before = JSON.stringify(S); render(); vInput(); render();
    const after = JSON.stringify(S); const sheets = peopleIdx().map((k) => sheetPrompt(k)).join('|'); const setup = setupPrompt();
    return { same: before === after, n: peopleIdx().length, noLink: !('link' in S.info) && !('subs' in S.info), noVaultTxt: !/캐릭터 카드|\[[^\]]+_[A-Z]\]/.test(sheets + setup), attach: setup.split('\n')[1], rule7: setup.includes('7. 조연: 단골 할머니(흰 파마머리).') };
  });
  if (!(r.same && r.n === 3 && r.noLink && r.noVaultTxt && r.rule7)) console.log('   디버그', JSON.stringify(r).slice(0, 700));
  C.ok(r.same && r.n === 3 && r.noLink, '옛 작업(주인공 3명 + 조연 글): 열어서 1단계를 그려도 데이터가 한 글자도 안 바뀌고 새 필드가 생기지 않음');
  C.ok(r.noVaultTxt && /^첨부한 이미지는 순서대로 1번 주인공\(/.test(r.attach) && r.rule7, '옛 작업: 보관함 문장이 하나도 끼어들지 않음(첨부 줄·조연 7번 규칙 그대로)');
  // 저장소를 못 쓰는 브라우저(IndexedDB 없음)에서도 앱이 멀쩡하고 보관함은 안내만
  const h = await newPage(browser, srv.base, { viewport: MOB, ls: withKey, noIDB: true }); await h.page.goto(srv.base + '/'); await h.page.waitForTimeout(500);
  await h.page.evaluate(() => openVault({})); await h.page.waitForTimeout(150);
  C.ok(await h.page.locator('#vaultSheet').innerText().then((t) => /보관함을 쓸 수 없어요/.test(t)) && h.errors.length === 0, 'IndexedDB가 없으면 보관함은 안내만 하고 앱은 정상 동작');
  C.ok(errors.length === 0, `옛 작업: 페이지 오류 없음 ${errors.slice(0, 2)}`);
}

await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 보관함 검사 ${C.fail}건 실패` : '\n[PASS] 보관함 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
