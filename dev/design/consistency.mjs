// 인물을 나중에 추가해도 주인공과 그림체가 달라지지 않게: 주인공 캐릭터 시트가 저장돼 있으면 새 인물의 시트 프롬프트 맨 앞에 "같은 그림체로 그려 달라"는 문장,
// 복사 버튼 근처 안내·내려받기, 주인공과 테마가 다를 때의 알림(맞추기/그대로 두기). ChatGPT용(sheetPrompt)·젠스파크용(gsPrep ref) 같은 규칙.
// 주인공 시트가 없을 때(처음 만들 때)는 지금과 글자까지 똑같아야 한다.
//   node dev/design/consistency.mjs     (먼저 npm run build)
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(), browser = await launch();
const SENT = '첨부한 이미지는 이미 만든 주인공 캐릭터예요. 이 인물은 그리지 말고, 선 굵기·채색·눈 모양·머리와 몸 비율을 똑같은 그림체로 아래의 새 인물만 그려 주세요.';
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const fresh = async () => {
  const { page, errors } = await newPage(browser, srv.base, { viewport: { width: 1000, height: 900 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
  await page.goto(srv.base + '/'); await page.waitForTimeout(500);
  // 보리당 예시: 두 번째 주인공(p2) 켜 둔 상태, 보관함·기준 이미지 없음
  await page.evaluate((PNG) => { S = demoState('bakery'); S.demo = false; S.mode = 'one'; S.step = 'post'; S.info.p2.on = true; S.info.art = 'chibi'; delete S.info.refArt; delete S.info.themeOk; delete S.info.link; setRef(0, null); setRef(1, null); save(); render(); }, PNG);
  await page.waitForTimeout(300);
  return { page, errors };
};
const probe = (page) => page.evaluate(() => ({
  s0: sheetPrompt(0), s1: sheetPrompt(1), g1ref: gsPrep('p1', 'ref'), g1turn: gsPrep('p1', 'turn'), g1expr: gsPrep('p1', 'expr'), g0ref: gsPrep('p0', 'ref'),
  boxes: document.querySelectorAll('#guideBox .samebox, .guide .samebox').length, dl: document.querySelectorAll('[data-act="mainSheetDl"]').length,
  warn: /주인공과 테마가 달라요/.test(document.body.innerText), line: /이 편의 모든 컷 그림체가 바뀌어요/.test(document.body.innerText), art: S.info.art, ms: (mainSheet() || {}).src || null }));

// 1) 주인공 시트가 없을 때: 지금과 똑같고 안내·버튼 없음
{
  const { page, errors } = await fresh(); const p = await probe(page);
  C.ok(!p.s1.includes(SENT) && p.s1.startsWith('인스타툰 두 번째 주인공 캐릭터 시트를 만들어 주세요.'), '주인공 시트 없음: 새 인물 시트 프롬프트는 지금 그대로(문장 없음)');
  C.ok(!p.g1ref.includes(SENT) && p.g1ref.startsWith('[그림체]'), '주인공 시트 없음: 젠스파크 기준 이미지 프롬프트도 그대로');
  C.ok(p.boxes === 0 && p.dl === 0 && !p.warn, '주인공 시트 없음: 안내·내려받기 버튼·테마 알림이 아무것도 안 보임');
  C.ok(!errors.length, '오류 없음 ' + (errors[0] || ''));
  await page.context().close();
}
// 2) 지금 작업에 주인공 기준 이미지가 있을 때
{
  const { page } = await fresh();
  await page.evaluate((PNG) => { setRef(0, PNG); S.info.refArt = 'chibi'; save(); render(); }, PNG); await page.waitForTimeout(300);
  const p = await probe(page);
  C.ok(p.ms === 'work', '지금 작업의 기준 이미지가 주인공 시트로 인식됨');
  C.ok(p.s1.startsWith(SENT + '\n\n인스타툰 두 번째 주인공 캐릭터 시트를 만들어 주세요.'), '새 인물(두 번째 주인공) 시트 프롬프트 맨 앞에 같은 그림체 문장');
  C.ok(!p.s0.includes(SENT) && p.s0.startsWith('인스타툰 주인공 캐릭터 시트를'), '주인공 자신의 시트 프롬프트에는 문장이 없음');
  C.ok(p.g1ref.startsWith(SENT + '\n\n[그림체]'), '젠스파크: 새 인물 기준 이미지(ref) 프롬프트 맨 앞에 같은 문장');
  C.ok(!p.g1turn.includes(SENT) && !p.g1expr.includes(SENT) && !p.g0ref.includes(SENT), '젠스파크: 턴어라운드·표정과 주인공 기준 이미지에는 문장이 없음');
  C.ok(p.boxes === 1 && p.dl === 1, `새 인물 카드에만 안내와 [주인공 시트 내려받기]가 보임 (안내 ${p.boxes}개, 버튼 ${p.dl}개)`);
  C.ok(!p.warn, '같은 테마일 때는 테마 알림 없음');
  // 내려받기
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.click('[data-act="mainSheetDl"]')]);
  C.ok(dl && /^주인공_기준\.png$/.test(dl.suggestedFilename()), '[주인공 시트 내려받기] → 파일이 내려받아짐 (' + (dl && dl.suggestedFilename()) + ')');
  await page.context().close();
}
// 3) 보관함(내 캐릭터)의 주인공 기준 이미지 + 테마가 다를 때 알림·맞추기·그대로 두기
{
  const { page } = await fresh();
  await page.evaluate(() => { VAULT.chars['주인공'] = { id: '주인공', kind: 'main', role: '사장', images: { ref: { blob: new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }), name: 'a.png', type: 'image/png', size: 4 }, outfits: [] }, art: 'mono' }; S.info.link = { 0: { id: '주인공' } }; S.info.art = 'chibi'; save(); render(); });
  await page.waitForTimeout(300);
  let p = await probe(page);
  C.ok(p.ms === 'vault' && p.s1.startsWith(SENT), '내 캐릭터(보관함)에 연결된 주인공 기준 이미지도 주인공 시트로 인식됨');
  C.ok(p.warn && p.line, '테마가 다르면 "주인공과 테마가 달라요" 알림과 "이 편의 모든 컷 그림체가 바뀌어요" 안내가 보임');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.click('[data-act="mainSheetDl"]')]);
  C.ok(dl && /^주인공_00_기준\.png$/.test(dl.suggestedFilename()), '보관함 시트 내려받기 파일 이름 (' + (dl && dl.suggestedFilename()) + ')');
  // 그대로 두기: 알림만 사라지고 테마는 그대로
  await page.click('[data-act="themeKeep"]'); await page.waitForTimeout(300); p = await probe(page);
  C.ok(!p.warn && p.art === 'chibi', '[그대로 두기] → 알림이 사라지고 테마는 그대로(' + p.art + ')');
  // 테마를 바꾸면 다시 알림(다른 조합) → 맞추기
  await page.evaluate(() => { S.info.art = 'doodle'; save(); render(); }); await page.waitForTimeout(250);
  C.ok((await probe(page)).warn, '다른 테마로 바꾸면 다시 알림');
  await page.click('[data-act="themeFix"]'); await page.waitForTimeout(300); p = await probe(page);
  C.ok(p.art === 'mono' && !p.warn, '[주인공 테마로 맞추기] → 이 편의 테마가 주인공 시트의 테마로 바뀌고 알림이 사라짐(' + p.art + ')');
  // 테마 기록이 없는 예전 시트는 알리지 않음
  await page.evaluate(() => { delete VAULT.chars['주인공'].art; S.info.art = 'doodle'; delete S.info.themeOk; save(); render(); }); await page.waitForTimeout(250);
  C.ok(!(await probe(page)).warn, '테마 기록이 없는 예전 시트는 테마 알림을 띄우지 않음');
  await page.context().close();
}
// 4) 보관함 내보내기·가져오기에 테마가 실리고, 없어도 그대로 열림
{
  const { page } = await fresh();
  const r = await page.evaluate(async () => {
    VAULT.chars['주인공'] = { id: '주인공', kind: 'main', role: '사장', images: { ref: { blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }), name: 'a.png', type: 'image/png', size: 3 }, outfits: [] }, art: 'mono' };
    const out = await vaultExport(true); const back = normIncoming(out);
    const old = normIncoming({ chars: [{ id: '옛캐릭터', kind: 'main', images: {} }] }), bad = normIncoming({ chars: [{ id: '엉터리', kind: 'main', art: '없는테마', images: {} }] });
    return { exported: out.chars[0].art, back: back.chars[0].art, old: old.chars[0].art === undefined && old.bad === 0, bad: bad.chars[0].art === undefined };
  });
  C.ok(r.exported === 'mono' && r.back === 'mono', `보관함 내보내기·가져오기에 테마가 같이 감 (${r.exported} → ${r.back})`);
  C.ok(r.old && r.bad, '테마가 없는 예전 보관함 파일은 그대로 열리고, 모르는 테마 값은 버려짐');
  await page.context().close();
}
// 5) 젠스파크 "캐릭터 준비" 목록의 안내, 주인공 기준 이미지를 올릴 때 그 시점의 테마가 기록됨(지우면 기록도 지움)
{
  const { page } = await fresh();
  await page.evaluate(() => { S.info.gsMode = 'gs'; S.info.art = 'sketch'; save(); render(); }); await page.waitForTimeout(300);
  C.ok(await page.evaluate(() => !/samebox/.test(gsPrepHTML())), '젠스파크 준비 목록: 주인공 시트가 없으면 안내 없음');
  await page.evaluate(() => { refPick = 0; }); await page.setInputFiles('#fileIn', { name: 'main.png', mimeType: 'image/png', buffer: Buffer.from(PNG.split(',')[1], 'base64') }); await page.waitForTimeout(700);
  const r = await page.evaluate(() => ({ refArt: S.info.refArt, art: S.info.art, ms: (mainSheet() || {}).src, gs: /samebox/.test(gsPrepHTML()), codes: gsCodesFor(cuts().map((_, i) => i)).join(',') }));
  C.ok(r.ms === 'work' && r.refArt === 'sketch', `주인공 기준 이미지를 올리면 그때의 테마가 기록됨 (기록 ${r.refArt}, 지금 ${r.art})`);
  C.ok(!/p1|s0/.test(r.codes) || r.gs, `젠스파크 준비 목록: 새 인물 기준 이미지 카드에 안내가 보임 (준비할 인물 ${r.codes})`);
  await page.evaluate(() => { document.querySelector('[data-refdel="0"]') ? document.querySelector('[data-refdel="0"]').click() : (setRef(0, null), delete S.info.refArt); }); await page.waitForTimeout(300);
  C.ok(await page.evaluate(() => !refOf(0) && !S.info.refArt), '주인공 기준 이미지를 지우면 테마 기록도 지워짐');
  await page.context().close();
}
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 같은 그림체 유지 검사 ${C.fail}건 실패` : '\n[PASS] 같은 그림체 유지 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
