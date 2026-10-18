// 우리 가게 사진(1단계 "가게 이름" 아래): 간판·외관 / 내부 사진을 올리면 보관함 장소('우리가게_외관'·'우리가게_내부')로 저장하고,
// 컷에 장소를 고르지 않았으면 자동으로 연결한다(기본 내부, 장면에 가게 앞·입구·간판 등이 있으면 외관). 컷에서 '사진 안 씀'(placeId '-')을 고를 수 있다.
// 사진이 없으면 프롬프트는 지금과 글자까지 똑같아야 한다(골든이 그대로인지로도 확인).
//   node dev/design/store.mjs     (먼저 npm run build)
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(), browser = await launch();
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const DESC = '실제 매장 사진이에요. 구조·간판·색감은 살리되 사진처럼 그리지 말고 지정한 그림체로 그려 주세요. 사진 속 사람은 그리지 마세요.';

const fresh = async (step = 'post') => {
  const { page, errors } = await newPage(browser, srv.base, { viewport: { width: 1000, height: 900 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
  await page.goto(srv.base + '/#start'); await page.waitForTimeout(700);
  await page.evaluate((step) => { S = demoState('bakery'); S.demo = false; S.mode = 'one'; S.step = step; save(); render(); }, step);
  await page.waitForTimeout(300);
  return { page, errors };
};
const all = (page) => page.evaluate(() => { const cs = cuts(); return { places: cs.map((_, i) => cutPlace(i)), text: [attachLine(), ...cs.map((c, i) => cutPrompt(c, i))].join('\n'), gs: gsPrompt(cs.map((_, i) => i)) }; });
const putStore = (page, kinds) => page.evaluate((kinds) => {
  const im = () => ({ blob: new Blob([new Uint8Array([255, 216, 255])], { type: 'image/jpeg' }), name: 'a.jpg', type: 'image/jpeg', size: 3 });
  for (const k of kinds) VAULT.places[STORE_BASE[k]] = { name: STORE_BASE[k], desc: STORE_DESC, image: im(), savedAt: 1, updatedAt: 1 };
}, kinds);

// 1) 사진이 없을 때: 자동 연결 없음, 프롬프트에 가게 사진 문구 없음
{
  const { page, errors } = await fresh(); const p = await all(page);
  C.ok(p.places.every(x => !x), '사진 없음: 어느 컷도 장소가 자동 연결되지 않음');
  C.ok(!/우리가게|실제 매장 사진/.test(p.text + p.gs), '사진 없음: ChatGPT·젠스파크 프롬프트에 가게 사진 문구 없음');
  C.ok(!errors.length, '오류 없음 ' + (errors[0] || ''));
  await page.context().close();
}
// 2) 외관·내부 둘 다 있을 때: 기본 내부, 가게 앞·입구 장면은 외관, 프롬프트에 장소 문장과 매장 사진 설명
{
  const { page } = await fresh(); await putStore(page, ['out', 'in']);
  await page.evaluate(() => { const cs = cuts(); cs.forEach(c => { c.place = ''; c.placeId = ''; c.sameBg = false; c.direction = '진열대 앞에서 빵을 정리한다'; }); cs[0].place = '가게 앞 입구, 아침'; save(); });
  const p = await all(page);
  C.ok(p.places[0] === '우리가게_외관', `가게 앞·입구 장면은 외관 사진이 자동 연결 (${p.places[0]})`);
  C.ok(p.places.slice(1).every(x => x === '우리가게_내부'), '그 밖의 장면은 내부 사진이 자동 연결');
  C.ok(p.text.includes('첨부한 장소_우리가게_내부 이미지와 같은 공간') && p.text.includes('첨부한 장소_우리가게_외관 이미지와 같은 공간'), 'ChatGPT 컷 프롬프트: "첨부한 장소_… 이미지와 같은 공간" 문장');
  C.ok(p.text.includes(DESC), 'ChatGPT 첨부 목록에 매장 사진 설명(사진처럼 그리지 말고 그림체로, 사람은 그리지 않기)');
  C.ok(/장소_우리가게_내부/.test(p.gs) && p.gs.includes(DESC), '젠스파크 프롬프트에도 장소와 매장 사진 설명');
  // 컷에서 '사진 안 씀'
  await page.evaluate(() => { cuts()[1].placeId = '-'; save(); });
  const q = await all(page);
  C.ok(q.places[1] === '' && q.places[2] === '우리가게_내부', `'사진 안 씀'을 고른 컷만 연결 해제 (${q.places[1] || '없음'})`);
  // 직접 고른 장소가 우선
  await page.evaluate(() => { cuts()[2].placeId = '우리가게_외관'; save(); });
  C.ok((await all(page)).places[2] === '우리가게_외관', '컷에서 직접 고른 장소가 자동 연결보다 우선');
  await page.context().close();
}
// 3) 한쪽만 있을 때: 맞지 않는 장면에는 억지로 붙이지 않음
{
  const { page } = await fresh(); await putStore(page, ['in']);
  await page.evaluate(() => { const cs = cuts(); cs.forEach(c => { c.place = ''; c.placeId = ''; c.sameBg = false; c.direction = '계산대에서 웃는다'; }); cs[0].place = '가게 앞'; save(); });
  let p = await all(page);
  C.ok(p.places[0] === '' && p.places[1] === '우리가게_내부', '내부 사진만 있으면: 가게 앞 장면엔 안 붙고 실내 장면엔 붙음');
  await page.evaluate(() => { delete VAULT.places['우리가게_내부']; VAULT.places['우리가게_외관'] = { name: '우리가게_외관', desc: STORE_DESC, image: { blob: new Blob([new Uint8Array([1])]), name: 'b.jpg', type: 'image/jpeg', size: 1 }, savedAt: 1, updatedAt: 1 }; });
  p = await all(page);
  C.ok(p.places[0] === '우리가게_외관' && p.places[1] === '', '외관 사진만 있으면: 가게 앞 장면엔 붙고 실내 장면엔 안 붙음');
  await page.context().close();
}
// 4) 1단계 화면: 사진 칸 2개와 안내, 올리기·지우기
{
  const { page, errors } = await fresh('input');
  const ui = await page.evaluate(() => ({ slots: document.querySelectorAll('.store .st-slot').length, note: /손님 얼굴이나 차 번호판이 나오지 않게/.test((document.querySelector('.store') || {}).innerText || ''), label: (document.querySelector('.store label.f') || {}).textContent }));
  C.ok(ui.slots === 2 && ui.note, `1단계에 "우리 가게 사진" 칸 2개(간판·외관, 내부)와 안내 한 줄 (칸 ${ui.slots}개)`);
  await page.waitForFunction(() => VAULT.ok, null, { timeout: 5000 }).catch(() => {});
  await page.setInputFiles('input[data-store="in"]', { name: 'shop.png', mimeType: 'image/png', buffer: Buffer.from(PNG.split(',')[1], 'base64') });
  await page.waitForFunction(() => !!(VAULT.places['우리가게_내부'] && VAULT.places['우리가게_내부'].image), null, { timeout: 5000 }).catch(() => {});
  const r = await page.evaluate(() => { const p = VAULT.places['우리가게_내부']; return { ok: !!p, type: p && p.image && p.image.type, desc: p && p.desc, thumb: !!document.querySelector('.store .st-slot img'), btn: !!document.querySelector('[data-storedel="in"]') }; });
  C.ok(r.ok && r.type === 'image/jpeg' && r.desc === DESC, `사진을 올리면 보관함 장소 '우리가게_내부'로 저장(줄인 JPG, 설명 포함)`);
  C.ok(r.thumb && r.btn, '올린 뒤 미리보기 그림과 [지우기] 버튼이 보임');
  await page.click('[data-storedel="in"]'); await page.waitForTimeout(500);
  C.ok(await page.evaluate(() => !VAULT.places['우리가게_내부'] && !document.querySelector('[data-storedel="in"]')), '[지우기] → 장소와 미리보기가 사라짐');
  C.ok(!errors.length, '오류 없음 ' + (errors[0] || ''));
  await page.context().close();
}
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 우리 가게 사진 검사 ${C.fail}건 실패` : '\n[PASS] 우리 가게 사진 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
