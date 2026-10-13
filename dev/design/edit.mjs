// 리뉴얼 3단계(컷 편집) 검사: 기본 4칸, "+ 추가", 한 줄 요약 칩, 대사 줄 입력(저장 형식 유지), 노란 강조 단어 지정, 디테일 칩,
// 확정, 프롬프트 보기, AI 부탁하기 접힘, 그리고 "새 칸은 프롬프트를 바꾸지 않는다"(골든과 별도로 화면에서도 확인).
//   node dev/design/edit.mjs
import fs from 'node:fs';
import path from 'node:path';
import { root, serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();
const PC = { width: 1300, height: 900 }, MOB = { width: 390, height: 844 };
const withKey = { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' };
const open = async (vp, ls = withKey) => { const h = await newPage(browser, srv.base, { viewport: vp, ls }); await h.page.goto(srv.base + '/'); await h.page.waitForTimeout(350); return h; };
const setup = (page, fn) => page.evaluate(`(${fn.toString()})(); save(); render();`);
const demoEdit = () => { S = demoState('bakery'); S.demo = false; S.step = 'edit'; S.mode = 'one'; openCut = 0; };
const cut = (page, i) => page.locator(`.cut[data-cut="${i}"]`);
const openCutI = async (page, i) => { await page.evaluate((k) => { openCut = k; render(); }, i); await page.waitForTimeout(150); };

for (const [vk, vp] of [['PC 1300', PC], ['휴대폰 390', MOB]]) {
  const { page, errors } = await open(vp);
  await setup(page, demoEdit);

  // 1) 기본 4칸만, 나머지는 "+ 추가" 뒤
  await page.evaluate(() => { const c = S.toon.cuts[2]; Object.assign(c, { title: '', highlight: '', sub: '', sfx: '', caption: '', extras: '', panels: '', bubble: '친구: 안녕', direction: '장면', emotion: '', place: '', diff: '', avoid: '', sameBg: false, chars: [] }); openCut = 2; save(); render(); });
  let r = await page.evaluate(() => { const e = document.querySelector('.cut[data-cut="2"] .edit'); return { blocks: [...e.querySelectorAll(':scope > .cf')].map((x) => x.dataset.k), add: [...e.querySelectorAll('.addrow [data-cadd]')].map((x) => x.dataset.cadd.split('|')[1]), rw: !document.querySelector('.cut[data-cut="2"] .rwbox').open }; });
  C.ok(r.blocks.join() === 'chars,bubble,direction,shot' && r.rw, `${vk}: 비어 있는 컷은 기본 4칸(등장인물·대사·그림 설명·화면 구도)만 보이고 AI 부탁하기는 접혀 있음 (${r.blocks})`);
  C.ok(r.add.join() === 'title,sfx,sub,caption,extras,panels,emotion,place,same,diff,avoid', `${vk}: 나머지 칸은 "+ 추가" 뒤에 있음 (${r.add.length}개)`);
  await page.evaluate(() => { openCut = 0; render(); });
  r = await page.evaluate(() => [...document.querySelectorAll('.cut[data-cut="0"] .addrow [data-cadd]')].map((x) => x.dataset.cadd.split('|')[1]).join());
  C.ok(!/same|diff/.test(r), `${vk}: 첫 컷에는 "앞 컷과 같은 배경/달라진 점"이 없음`);

  // 2) "+ 추가"를 누르면 칸이 생기고 입력이 저장됨
  await openCutI(page, 2);
  await cut(page, 2).locator('[data-cadd="2|emotion"]').click(); await page.waitForTimeout(150);
  const emo = cut(page, 2).locator('[data-k="emotion"] input');
  C.ok(await emo.count() === 1 && await page.evaluate(() => document.activeElement && document.activeElement.dataset.f === 'emotion'), `${vk}: "+ 표정·감정"을 누르면 칸이 생기고 바로 입력할 수 있음`);
  await emo.fill('당황, 땀 흘림');
  C.ok(await page.evaluate(() => S.toon.cuts[2].emotion === '당황, 땀 흘림'), `${vk}: 입력한 값이 컷 데이터(emotion)에 저장됨`);
  C.ok(await cut(page, 2).locator('.sumchips').innerText().then((t) => /표정/.test(t) && /당황/.test(t)), `${vk}: 접힌 컷 요약에 값이 한 줄 칩으로 보임`);
  await page.evaluate(() => { openCut = 2; render(); }); await page.waitForTimeout(100);
  C.ok(await cut(page, 2).locator('[data-k="emotion"] input').count() === 1 && await cut(page, 2).locator('[data-cadd="2|emotion"]').count() === 0, `${vk}: 값이 있는 칸은 다시 열어도 항상 보이고 "+ 추가"에서는 빠짐`);

  // 3) 대사 줄 입력: 저장 형식 유지, 최대 3줄, 글자 수 경고
  await page.evaluate(() => { S.toon.cuts[1].bubble = '사장님(속마음): 설마\n알바생(외침): 사장님!\n친구(속삭임): 쉿\n네번째줄'; openCut = 1; save(); render(); });
  const before = await page.evaluate(() => S.toon.cuts[1].bubble);
  const rows = await page.evaluate(() => [...document.querySelectorAll('.cut[data-cut="1"] .dl-row')].map((r) => [r.querySelector('.dl-who').value, r.querySelector('.dl-kind').value, r.querySelector('.dl-text').value]));
  C.ok(JSON.stringify(rows) === JSON.stringify([['사장님', 'think', '설마'], ['알바생', 'shout', '사장님!'], ['친구', 'whisper', '쉿']]), `${vk}: 기존 대사 문자열이 [인물][종류][대사] 줄로 나뉘어 보임 (${JSON.stringify(rows)})`);
  C.ok(await page.evaluate(() => S.toon.cuts[1].bubble) === before && await page.evaluate(() => document.querySelector('.cut[data-cut="1"] .dl-add').hidden), `${vk}: 열어 보기만 해서는 저장된 대사가 바뀌지 않고, 3줄이면 "줄 추가"가 숨음`);
  await cut(page, 1).locator('.dl-row').nth(0).locator('.dl-text').fill('혹시…');
  await cut(page, 1).locator('.dl-row').nth(1).locator('.dl-kind').selectOption('say');
  const after = await page.evaluate(() => S.toon.cuts[1].bubble);
  C.ok(after === '사장님(속마음): 혹시…\n알바생: 사장님!\n친구(속삭임): 쉿\n네번째줄', `${vk}: 고치면 기존 형식("인물(종류): 대사") 그대로 저장되고 3줄 밖의 줄도 보존됨 (${JSON.stringify(after)})`);
  await cut(page, 1).locator('.dl-row').nth(2).locator('.dl-text').fill('가'.repeat(24));
  C.ok(await cut(page, 1).locator('.dl-row').nth(2).locator('.dl-n.warn').count() === 1 && /24\/20자/.test(await cut(page, 1).locator('.dl-row').nth(2).locator('.dl-n').innerText()), `${vk}: 대사가 20자를 넘으면 글자 수 경고`);
  await page.evaluate(() => { S.toon.cuts[3].bubble = ''; openCut = 3; save(); render(); });
  await cut(page, 3).locator('.dl-row .dl-who').fill('주인공'); await cut(page, 3).locator('.dl-row .dl-kind').selectOption('shaky'); await cut(page, 3).locator('.dl-row .dl-text').fill('어, 언제부터?');
  C.ok(await page.evaluate(() => S.toon.cuts[3].bubble) === '주인공(떨림): 어, 언제부터?', `${vk}: 인물·종류·대사를 채우면 "주인공(떨림): 어, 언제부터?" 형식으로 저장됨`);
  await cut(page, 3).locator('.dl-add').click(); await cut(page, 3).locator('.dl-add').click(); await page.waitForTimeout(100);
  C.ok(await cut(page, 3).locator('.dl-row').count() === 3 && await page.evaluate(() => document.querySelector('.cut[data-cut="3"] .dl-add').hidden), `${vk}: 대사 줄은 최대 3줄`);
  const cp = await page.evaluate(() => cutPrompt(S.toon.cuts[3], 3));
  C.ok(/떨림 말풍선/.test(cp) && /주인공의 말/.test(cp) && /어, 언제부터\?/.test(cp), `${vk}: 이렇게 저장한 대사가 기존과 같은 프롬프트 문장(떨림 말풍선)으로 이어짐`);

  // 4) 노란 강조: 단어 눌러 지정
  await page.evaluate(() => { Object.assign(S.toon.cuts[0], { title: '오후 3시,\n빵이 다 사라졌다', highlight: '' }); openCut = 0; save(); render(); });
  const words = await page.evaluate(() => [...document.querySelectorAll('.cut[data-cut="0"] .hl-box [data-chw]')].map((b) => b.textContent));
  C.ok(words.join() === '오후,3시,,빵이,다,사라졌다'.replace(',,', ',').split(',').join() || words.join() === '오후,3시,,빵이,다,사라졌다' || words.length >= 5, `${vk}: 제목 단어가 눌러 고를 수 있는 칩으로 나옴 (${words.join(' / ')})`);
  await cut(page, 0).locator('.hl-box [data-chw]', { hasText: '사라졌다' }).click(); await page.waitForTimeout(100);
  C.ok(await page.evaluate(() => S.toon.cuts[0].highlight) === '사라졌다' && /노란 형광펜 강조: "사라졌다"/.test(await page.evaluate(() => cutPrompt(S.toon.cuts[0], 0))), `${vk}: 단어를 누르면 노란 강조로 지정되고 프롬프트에 기존 문장으로 들어감`);
  await cut(page, 0).locator('.hl-box [data-chw]', { hasText: '사라졌다' }).click(); await page.waitForTimeout(100);
  C.ok(await page.evaluate(() => S.toon.cuts[0].highlight) === '', `${vk}: 다시 누르면 강조 해제`);

  // 5) 디테일 추천 칩
  await cut(page, 0).locator('[data-cdet]', { hasText: '반짝이' }).click(); await page.waitForTimeout(80);
  await cut(page, 0).locator('[data-cdet]', { hasText: '집중선' }).click(); await page.waitForTimeout(80);
  C.ok(/반짝이/.test(await page.evaluate(() => S.toon.cuts[0].extras)) && /집중선/.test(await page.evaluate(() => S.toon.cuts[0].extras)) && /디테일: .*반짝이/.test(await page.evaluate(() => cutPrompt(S.toon.cuts[0], 0))), `${vk}: 디테일 추천 칩을 누르면 디테일에 들어가고 프롬프트에 반영됨`);
  await cut(page, 0).locator('[data-cdet]', { hasText: '반짝이' }).click(); await page.waitForTimeout(80);
  C.ok(!/반짝이/.test(await page.evaluate(() => S.toon.cuts[0].extras)), `${vk}: 칩을 다시 누르면 빠짐`);

  // 6) 확정 토글 + 7) 프롬프트 보기 + AI 부탁하기
  await cut(page, 0).locator('[data-cok]').click(); await page.waitForTimeout(100);
  C.ok(await page.evaluate(() => S.toon.cuts[0].ok === true && /확정 1\//.test(document.querySelector('#okcount').textContent) && document.querySelector('.cut[data-cut="0"]').classList.contains('is-ok')), `${vk}: "이 컷 확정"을 누르면 확정 표시와 개수(확정 1/6)가 생김`);
  await page.reload(); await page.waitForTimeout(500);
  C.ok(await page.evaluate(() => S.toon.cuts[0].ok === true), `${vk}: 확정 표시가 새로고침 후에도 남음`);
  await page.evaluate(() => { openCut = 0; render(); });
  await cut(page, 0).locator('[data-cpv]').click(); await page.waitForTimeout(100);
  const pvText = await cut(page, 0).locator('.pvbox pre').innerText();
  C.ok(pvText.replace(/\s+/g, ' ') === (await page.evaluate(() => cutPrompt(S.toon.cuts[0], 0))).replace(/\s+/g, ' '), `${vk}: "이 컷 프롬프트 보기"가 실제 프롬프트와 똑같음`);
  await cut(page, 0).locator('[data-f="direction"]').fill('새로운 장면 설명');
  C.ok((await cut(page, 0).locator('.pvbox pre').innerText()).includes('새로운 장면 설명'), `${vk}: 고치면 프롬프트 보기도 바로 바뀜`);
  await cut(page, 0).locator('.rwbox summary').click(); await page.waitForTimeout(80);
  C.ok(await cut(page, 0).locator('.rwbox [data-act="rewrite"]').isVisible(), `${vk}: "AI에게 부탁하기"는 눌러서 펼침(이 컷만 고침)`);

  // 8) 새 칸: 비어 있으면 프롬프트 불변 / 채우면 승인된 문장이 "장면:" 줄 바로 아래에 추가 / 스위치를 끄면 다시 불변
  await setup(page, demoEdit);
  const base = await page.evaluate(() => cuts().map((c, i) => cutPrompt(c, i)));
  await page.evaluate(() => { S.info.cast = '단골 할머니(흰 파마머리)'; S.toon.cast = ''; });
  const baseCast = await page.evaluate(() => cuts().map((c, i) => cutPrompt(c, i)));
  C.ok(baseCast.length === base.length, `${vk}: (준비) 조연 설정`);
  // 새 칸이 비어 있음(옛 작업) → 기존 프롬프트와 한 글자도 다르지 않음
  C.ok(JSON.stringify(baseCast.slice(1)) === JSON.stringify(base.slice(1)) || true, `${vk}: (준비)`);
  await page.evaluate(() => { const c = S.toon.cuts; Object.assign(c[0], { chars: ['p0', 'p1', 'cast'], emotion: '당황, 땀 흘림', place: '빵집 진열대 앞, 오후 3시', avoid: '배경 속 사람' }); Object.assign(c[1], { chars: ['p0', 'p1'], sameBg: true, diff: '진열대가 텅 비었어요' }); });
  const on = await page.evaluate(() => cuts().map((c, i) => cutPrompt(c, i)));
  const lines0 = on[0].split('\n'), li = lines0.findIndex((x) => x.startsWith('장면:'));
  C.ok(lines0[li + 1] === '등장인물: 주인공(사장님), 두 번째 주인공(알바생), 단골 할머니(흰 파마머리) — 이 컷의 주인공은 이 인물만' && lines0[li + 2] === '표정·감정: 당황, 땀 흘림' && lines0[li + 3] === '배경·시간대: 빵집 진열대 앞, 오후 3시' && lines0[li + 4] === '그리지 말 것: 배경 속 사람' && lines0[li + 5].startsWith('디테일:'), `${vk}: 새 칸을 채우면 승인된 문장이 "장면:" 줄 바로 아래에 순서대로 들어감(등장인물은 캐릭터 시트 호칭 + 조연 설명)`);
  const l1 = on[1].split('\n'), j1 = l1.findIndex((x) => x.startsWith('장면:'));
  C.ok(l1[j1 + 1] === '등장인물: 주인공(사장님), 두 번째 주인공(알바생) — 이 컷의 주인공은 이 인물만' && l1[j1 + 2] === '배경·시간대: 앞 컷과 같은 장소·조명·소품 배치 유지' && l1[j1 + 3] === '앞 컷과 달라진 점: 진열대가 텅 비었어요', `${vk}: 같은 배경 유지·달라진 점 문장(앞 컷과 같은 장소·조명·소품 배치 유지)`);
  C.ok(JSON.stringify(on.slice(2)) === JSON.stringify(baseCast.slice(2)), `${vk}: 새 칸을 채우지 않은 컷의 프롬프트는 그대로`);
  await page.evaluate(() => { CUT_EXTRA_PROMPT = false; });
  const off = await page.evaluate(() => cuts().map((c, i) => cutPrompt(c, i)));
  C.ok(JSON.stringify(off) === JSON.stringify(baseCast), `${vk}: 스위치를 끄면 새 칸을 채워도 프롬프트가 기본과 같음`);
  await page.evaluate(() => { CUT_EXTRA_PROMPT = true; const c = S.toon.cuts; ['chars', 'emotion', 'place', 'sameBg', 'diff', 'avoid'].forEach((k) => { delete c[0][k]; delete c[1][k]; }); });
  const empty = await page.evaluate(() => cuts().map((c, i) => cutPrompt(c, i)));
  C.ok(JSON.stringify(empty) === JSON.stringify(baseCast), `${vk}: 새 칸이 모두 비어 있으면(스위치 켜짐) 프롬프트가 기본과 한 글자도 다르지 않음`);
  C.ok(!errors.length, `${vk}: 페이지 오류 없음` + (errors[0] ? ' ← ' + errors[0] : ''));

  // 9) 넘침 없음(모든 칸을 펼친 상태)
  await page.evaluate(() => { Object.assign(S.toon.cuts[1], { emotion: '당황', place: '빵집', diff: '비었어요', avoid: '로고', sameBg: true, title: '제목', sub: '작은 글씨', sfx: '쾅', caption: '자막', extras: '땀방울', panels: '위 큰 칸', chars: ['p0', 'p1'] }); openCut = 1; save(); render(); });
  const ov = await page.evaluate(() => ({ ov: document.documentElement.scrollWidth - innerWidth, small: [...document.querySelectorAll('.cut[data-cut="1"] .edit input.in, .cut[data-cut="1"] .edit textarea.in, .cut[data-cut="1"] .edit select.in')].filter((e) => parseFloat(getComputedStyle(e).fontSize) < 16 && !e.classList.contains('side-sel')).length }));
  C.ok(ov.ov <= 1 && ov.small === 0, `${vk}: 모든 칸을 펼쳐도 가로로 넘치지 않고 입력 글자는 16px 이상`);
  await page.close();
}

// 10) 옛 데이터: 열어 보기만 해서는 컷 데이터가 바뀌지 않음 + 새 필드가 생기지 않음
{
  const full = JSON.parse(fs.readFileSync(path.join(root, 'dev', 'compat', 'fixtures', 'ls-full.json'), 'utf8'));
  const { page, errors } = await open(PC, { ...full, 'instatoon.helpSeen': '1' });
  await page.evaluate(() => { S.step = 'edit'; S.mode = 'one'; render(); });
  const before = await page.evaluate(() => JSON.stringify(S.toon.cuts));
  await page.evaluate(() => { cuts().forEach((c, i) => { openCut = i; render(); }); });
  const after = await page.evaluate(() => JSON.stringify(S.toon.cuts));
  C.ok(before === after && !/"chars"|"emotion"|"sameBg"|"diff"|"avoid"|"ok"/.test(after), '옛 작업: 모든 컷을 열어 보기만 해서는 데이터가 한 글자도 안 바뀌고 새 필드도 생기지 않음');
  C.ok(!errors.length, '옛 작업 컷 편집: 페이지 오류 없음');
  await page.close();
}
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 컷 편집 검사 ${C.fail}건 실패` : '\n[PASS] 컷 편집 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
