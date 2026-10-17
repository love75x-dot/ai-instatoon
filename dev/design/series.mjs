// 4c 연재 기억 검사: 한 편을 만들 때 memory가 쌓이는지(끝난 편은 보존·안 끝난 편은 새 기억으로 교체·최대 20편),
// 다음 편·한 달 기획 요청에 최근 3편만 들어가는지, 기억 보기·고치기·지우기(기본 접힘), 기억 없는 옛 작업·옛 백업 호환.
//   node dev/design/series.mjs
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();
const withKey = { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' };
const h = await newPage(browser, srv.base, { viewport: { width: 1300, height: 900 }, ls: withKey });
const { page, errors } = h;
await page.goto(srv.base + '/'); await page.waitForTimeout(500);

// 가짜 AI: 매번 컷 6개와 memory를 돌려준다(n번째마다 줄거리가 다름). null이면 memory 없이.
await page.evaluate(() => {
  window.__n = 0; window.__sent = []; window.__noMem = false;
  ask = async (p) => {
    window.__sent.push(p); const n = ++window.__n;
    const cut = (k) => ({ role: '장면' + k, shot: '미디엄샷', title: '', highlight: '', sub: '', bubble: '사장님: 안녕', bubbleSide: 'l', sfx: '', direction: '가게 안', panels: '', caption: '', extras: '' });
    const r = { title: '제' + n + '편', tone: '', cuts: [1, 2, 3, 4, 5, 6].map(cut), hooks: ['', '', ''], caption: '', hashtags: '', comment: '', endHead: '', endBtn: '', cast: '', ideas: [] };
    if (!window.__noMem) r.memory = { story: n + '번째 편 줄거리 ' + 'ㄱ'.repeat(200), threads: ['떡밥' + n + 'a', '떡밥' + n + 'b', '떡밥' + n + 'c'], tone: '말투' + n };
    return r;
  };
  S = demoState('bakery'); S.demo = false; S.mode = 'one'; S.step = 'input'; S.toon = null; delete S.series; save();
});
const mk = () => page.evaluate(async () => { await makeToon(); return S.series.length; });

C.ok(await page.evaluate(() => seriesBlock('make') === '' && seriesBlock('month') === ''), '기억이 없으면 연재 기억 입력 덩어리가 비어 있음');
C.ok(await page.evaluate(() => seriesHTML() === ''), '기억이 없으면 연재 기억 줄이 보이지 않음');

// 1편: 요청에 memory 출력 요구는 들어 있고 [연재 기억] 입력은 없음
await mk();
const first = await page.evaluate(() => window.__sent[0]);
C.ok(/- memory: 이번 편 연재 기억\./.test(first) && /"memory":\{"story":"","threads":\[\],"tone":""\}/.test(first), '첫 편부터 memory 출력 요청이 항상 들어감');
C.ok(!/\[연재 기억 -/.test(first), '첫 편에는 [연재 기억] 입력 덩어리가 없음');
let st = await page.evaluate(() => ({ n: S.series.length, e: S.series[0], sid: S.toon.sid }));
C.ok(st.n === 1 && st.e.sid === st.sid, '1편 만들면 기억 1개가 쌓임');
C.ok(st.e.story.length <= 120 && st.e.threads.length === 2 && st.e.tone === '말투1' && st.e.cast.length >= 1, '줄거리 120자·떡밥 2개·말투 저장, 등장인물 함께 저장: ' + JSON.stringify(st.e.cast));

// 안 끝난 편을 다시 만들면 교체, 요청에는 그 편의 기억이 빠짐
await mk();
const second = await page.evaluate(() => window.__sent[1]);
C.ok(await page.evaluate(() => S.series.length) === 1, '끝나지 않은 편을 다시 만들면 기억은 새것으로 교체(1개 유지)');
C.ok(!/\[연재 기억 -/.test(second), '끝나지 않은 편의 기억은 다시 만들 때 요청에 들어가지 않음');

// 끝난 편(게시 표시)은 보존되고 다음 편 요청에 들어감
await page.evaluate(() => { S.toon.postedAt = '10/13'; save(); });
await mk();
const third = await page.evaluate(() => window.__sent[2]);
C.ok(await page.evaluate(() => S.series.length) === 2, '끝난 편 다음 편을 만들면 기억이 2개');
C.ok(/\[연재 기억 - 지난 편과 이어지게 쓰고, 아래 설정을 어기지 말 것\]\n최근 줄거리: 1\) 2번째 편 줄거리/.test(third) && /말투·관계: 말투2/.test(third), '다음 편 요청에 최근 줄거리·등장인물·말투가 들어감');
C.ok(third.indexOf('[연재 기억') > third.indexOf('[사업·브랜드 정보]') && third.indexOf('[연재 기억') < third.indexOf('[인스타툰 원칙]'), '연재 기억 덩어리는 입력 정보 바로 뒤, 원칙 앞');

// 그림을 다 올린 편도 끝난 편
await page.evaluate(() => { S.toon.pics = S.toon.cuts.map(() => 'data:image/png;base64,AAAA'); save(); });
await mk();
C.ok(await page.evaluate(() => S.series.length) === 3, '그림을 다 올린 편도 끝난 편으로 보존');

// 최근 3편만, 최대 20편
for (let i = 0; i < 25; i++) { await page.evaluate(() => { S.toon.postedAt = '10/13'; }); await mk(); }
C.ok(await page.evaluate(() => S.series.length) === 20, '기억은 최대 20편까지만 보관');
const many = await page.evaluate(() => { const b = seriesBlock('make'); return { b, lines: (b.match(/\d\) /g) || []).length, month: seriesBlock('month') }; });
C.ok(many.lines === 3, '요청에는 최근 3편만: ' + many.lines);
C.ok(!/남은 떡밥:.*\/.*\/.*\/ /.test(many.b) && (many.b.match(/ \/ /g) || []).length <= 2, '남은 떡밥은 최대 3개');
C.ok(/^\n\[연재 기억 - 이어지는 이야기로 기획하고, 남은 떡밥은 편에 나눠 풀 것\]\n최근 줄거리: /.test(many.month) && !/등장인물/.test(many.month), '한 달 기획용 덩어리는 줄거리·떡밥만');

// memory가 안 오면(옛 모델 응답·직접 쓰기) 기억을 만들지 않고 오류도 없음
await page.evaluate(() => { window.__noMem = true; S.toon.postedAt = '10/13'; });
const before = await page.evaluate(() => S.series.length); await mk();
C.ok(await page.evaluate(() => S.series.length) === before, 'memory가 없으면 기억이 늘지 않음');
await page.evaluate(() => { window.__noMem = false; });

// 화면: 기본 접힘 → 열기 → 수정 → 지우기
await page.evaluate(() => { S.step = 'input'; save(); render(); });
await page.waitForTimeout(200);
await page.evaluate(() => { document.querySelector('#moreAll').open = true; }); await page.waitForTimeout(100);
C.ok(await page.locator('#serBox').count() === 1 && await page.locator('#serBox').evaluate((d) => !d.open), '연재 기억 목록이 있고 기본은 접혀 있음');
C.ok(/20편 저장/.test(await page.locator('#serBox summary').innerText()), '접힌 줄에 저장된 편 수가 보임');
await page.locator('#serBox summary').click(); await page.waitForTimeout(100);
C.ok(await page.locator('#serBox li').count() === 20, '열면 편별 한 줄 목록 20개');
const sid0 = await page.evaluate(() => S.series[S.series.length - 1].sid);
await page.locator('#serBox li').first().locator('[data-ser="edit"]').click(); await page.waitForTimeout(100);
C.ok(await page.locator('#serBox').evaluate((d) => d.open), '수정을 눌러도 목록이 열려 있음');
await page.locator('[data-serf="story"]').fill('고친 줄거리입니다');
await page.locator('[data-serf="threads"]').fill('새 떡밥1, 새 떡밥2, 새 떡밥3');
await page.locator('[data-serf="tone"]').fill('고친 말투');
const ed = await page.evaluate((sid) => S.series.find((x) => x.sid === sid), sid0);
C.ok(ed.story === '고친 줄거리입니다' && ed.threads.length === 2 && ed.tone === '고친 말투', '줄거리·떡밥(최대 2개)·말투를 고칠 수 있음');
C.ok(/고친 줄거리입니다/.test(await page.evaluate(() => seriesBlock('make'))), '고친 내용이 다음 요청에 반영됨');
await page.locator('[data-ser="done"]').click();
page.once('dialog', (d) => d.accept());
await page.locator('#serBox li').first().locator('[data-ser="del"]').click(); await page.waitForTimeout(100);
C.ok(await page.evaluate(() => S.series.length) === 19 && await page.locator('#serBox li').count() === 19, '지우기를 누르면 확인 후 그 편의 기억이 빠짐');

// 저장·복원(백업은 S 전체라 series가 따라감) + 기억이 없는 옛 작업
const roundtrip = await page.evaluate(() => { const snap = JSON.parse(JSON.stringify(S)); const b = blank(); const R = { ...b, ...snap, info: { ...b.info, ...snap.info } }; return Array.isArray(R.series) && R.series.length === 19; });
C.ok(roundtrip, '백업(S 전체)을 불러와도 연재 기억이 그대로');
await page.evaluate(() => { const o = JSON.parse(JSON.stringify(S)); delete o.series; kv.setItem(KEY, JSON.stringify(o)); });
await page.reload(); await page.waitForTimeout(600);
C.ok(await page.evaluate(() => { try { return seriesBlock('make') === '' && seriesHTML() === '' && (render(), true); } catch (e) { return false; } }), '연재 기억이 없는 옛 작업을 열어도 오류 없이 동작');

C.ok(errors.length === 0, '페이지 오류 없음: ' + errors.slice(0, 3).join(' | '));
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 연재 기억 검사 ${C.fail}건 실패` : '\n[PASS] 연재 기억 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
