// 4e 검사: 모든 대본 유형의 "10p 표 만들기" 접기 칸(에피소드 흐름·광고 콘티·정보 구성·스토리 흐름·회차 구성·콘티)을 없앴다.
// 이 칸에 적어 둔 옛 데이터(S.ad)는 지우지 않고 백업에도 그대로 들어가며, 대본 만들기(make) 요청 문장은 바뀌지 않는다.
//   node dev/design/table.mjs
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();
const { page: pg, errors } = await newPage(browser, srv.base, { viewport: { width: 1300, height: 900 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' }, freeze: false });
await pg.goto(srv.base + '/'); await pg.waitForTimeout(600);

// 옛 작업: 에피소드 흐름 칸에 내용을 적어 둔 상태
await pg.evaluate(() => { S = demoState('bakery'); S.demo = false; S.mode = 'one'; S.step = 'input'; S.info.kind = 'daily';
  S.ad = { product: '', point: '', target: '', benefit: '', table: '', byKind: { daily: { product: '마감 전날 수정 요청', point: '당황 → 오기 → 안도', target: '', benefit: '', table: '| 페이지수 | 상황 | 감정 | 대사 |\n|---|---|---|---|\n| 1P | 옛 표 | 당황 | 아 |' } } };
  save(); render(); });
await pg.waitForTimeout(400);

C.ok(await pg.locator('#adBox').count() === 0 && await pg.locator('#adSlot').evaluate((e) => e.hidden), '공감·일상형(기본)에서는 접기 칸이 보이지 않음');
C.ok(!/에피소드 흐름|10p 표 만들기/.test(await pg.locator('#main').innerText()), '화면 어디에도 "에피소드 흐름 10p 표 만들기"가 없음');
C.ok(await pg.locator('[data-act="adMake"], [data-act="adCopy"], [data-act="adToStory"]').count() === 0, '표 만들기·복사·이야기에 넣기 버튼도 없음');

// 다른 모든 대본 유형의 10p 표 칸도 없앴다(광고 콘티·정보 구성·스토리 흐름·회차 구성·콘티)
await pg.evaluate(() => { S.ad.table = '| 광고 | 옛 광고 표 |'; S.ad.product = '옛 제품'; S.ad.byKind.info = { product: '옛 정보 주제', point: '', target: '', benefit: '', table: '| 옛 정보 표 |' }; save(); });
for (const [k, name] of [['ad', '광고 콘티'], ['info', '정보 구성'], ['brand', '스토리 흐름'], ['series', '회차 구성'], ['custom', '콘티']]) {
  await pg.evaluate((kind) => { S.info.kind = kind; save(); applyKind(); }, k); await pg.waitForTimeout(150);
  const ok = await pg.locator('#adBox').count() === 0 && await pg.locator('#adSlot').evaluate((e) => e.hidden) && !(await pg.locator('#main').innerText()).includes('10p 표 만들기') && await pg.evaluate(() => !KINDS[S.info.kind].table);
  C.ok(ok, `${name} 유형에서도 10p 표 칸이 없음`);
  const req = await pg.evaluate(async () => { const real = ask; let got = ''; ask = async (p) => { got = p; throw { code: 'stub' }; }; try { await makeToon(); } catch (_) {} ask = real; return got; });
  C.ok(req.length > 500 && !req.includes('옛 광고 표') && !req.includes('옛 정보 표') && !req.includes('옛 제품'), `${name} 유형의 만들기 요청 문장에 표 칸 내용이 들어가지 않음`);
}
await pg.evaluate(() => { S.info.kind = 'daily'; save(); applyKind(); }); await pg.waitForTimeout(150);
C.ok(await pg.locator('#adBox').count() === 0 && await pg.locator('#adSlot').evaluate((e) => e.hidden), '공감·일상형으로 돌아와도 칸이 없음');
C.ok(await pg.evaluate(() => S.ad.table.includes('옛 광고 표') && S.ad.product === '옛 제품' && S.ad.byKind.info.table.includes('옛 정보 표')), '광고·정보 유형에 적어 둔 옛 내용도 지워지지 않음');
C.ok(await pg.evaluate(() => ['ad', 'info', 'daily', 'brand', 'series', 'custom'].every((k) => KINDS[k] && KINDS[k].name && 'rule' in KINDS[k])), '대본 유형 목록과 유형별 규칙 문장은 그대로');

// 옛 데이터는 그대로
const kept = await pg.evaluate(() => S.ad.byKind.daily);
C.ok(kept && kept.product === '마감 전날 수정 요청' && kept.table.includes('옛 표'), '에피소드 흐름 칸에 적어 둔 옛 내용(S.ad)은 지워지지 않고 그대로');
await pg.reload(); await pg.waitForTimeout(700);
C.ok(await pg.evaluate(() => (S.ad && S.ad.byKind && S.ad.byKind.daily && S.ad.byKind.daily.table.includes('옛 표'))), '새로고침한 뒤에도 그대로');
const bk = await pg.evaluate(async () => { const orig = saveFile; let blob = null; saveFile = async (n, b) => { blob = b; }; await makeBackup({ img: false }); saveFile = orig; return blob ? await blob.text() : ''; });
C.ok(bk.includes('옛 표') && JSON.parse(bk).state.ad.byKind.daily.product === '마감 전날 수정 요청', '백업 파일에도 옛 내용이 그대로 들어감(백업 호환 유지)');
// 만들기 요청 문장은 이 칸과 상관없음
const req = await pg.evaluate(async () => { const real = ask; let got = ''; ask = async (p) => { got = p; throw { code: 'stub' }; }; try { await makeToon(); } catch (_) {} ask = real; return got; });
C.ok(req.length > 500 && !req.includes('옛 표') && !req.includes('에피소드 흐름'), '대본 만들기(make) 요청 문장에는 이 칸의 내용이 들어가지 않음');

if (errors.length) C.ok(false, '콘솔 오류: ' + errors.slice(0, 2).join(' | '));
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 표 칸 검사 ${C.fail}건 실패` : '\n[PASS] 표 칸 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
