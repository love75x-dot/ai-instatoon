// 젠스파크 프롬프트 골든(4e). 기존 골든(dev/golden/prompts.json)과 따로 지킨다.
//   node dev/golden/genspark.mjs            비교
//   node dev/golden/genspark.mjs --update   갱신 (문장이 바뀐 이유를 사장님께 먼저 보고·승인받은 뒤에만!)
import fs from 'node:fs';
import path from 'node:path';
import { root, serve, launch, newPage } from '../lib/harness.mjs';

const file = path.join(root, 'dev', 'golden', 'genspark.json');
const update = process.argv.includes('--update');
const srv = await serve(); const browser = await launch();
const { page, errors } = await newPage(browser, srv.base);
await page.goto(srv.base + '/'); await page.waitForTimeout(600);

const result = await page.evaluate(() => {
  const out = {};
  const img = (n) => ({ blob: new Blob(['x']), name: n, type: 'image/png', size: 1 });
  const mkc = (id, kind, role, age, gender, looks, card, im) => ({ id, kind, role, age, gender, looks, card, images: { ref: img(id + '.png'), turn: im.turn ? img(id + '_t.png') : null, expr: im.expr ? img(id + '_e.png') : null, outfits: [] }, savedAt: 1, updatedAt: 1, ready: true });
  const base = (ratio) => { S = demoState('bakery'); S.demo = false; S.info.ratio = ratio || '4:5'; S.info.cast = ''; S.toon.cast = ''; S.info.gsText = 'with'; VAULT.chars = {}; VAULT.places = {}; S.info.link = {}; S.info.subs = []; return S; };
  const vault = (cards) => {
    VAULT.chars = {
      '사장님_A': mkc('사장님_A', 'main', '사장님', '40대', '여성', '짧은 단발', cards ? { face: '동글동글한 달걀형', eyes: '처진 큰 눈, 갈색', hair: '짧은 단발, 짙은 갈색', body: '작은 키, 2.5등신', feature: '동그란 안경', hex: '베이지(#D9C3A0)', keep: '안경은 항상 동그란 테' } : {}, { turn: true, expr: true }),
      '알바생_B': mkc('알바생_B', 'main', '알바생', '20대', '남성', '까치머리', {}, { turn: true, expr: false }),
    };
    VAULT.places = { '빵집': { name: '빵집', desc: '나무 진열대가 있는 동네 빵집', image: img('p.png') } };
    linkSlot('m0', '사장님_A'); linkSlot('m1', '알바생_B'); S.toon.cuts.forEach((c) => { c.placeId = '빵집'; });
  };
  const bundle = () => ({ 묶음수: gsBundles().length, 첫묶음: gsPrompt(gsBundles()[0]), 마지막묶음: gsPrompt(gsBundles()[gsBundles().length - 1]) });
  base(); vault(true); out['글자같이_카드있음_4:5→3:4'] = bundle();
  base(); vault(true); S.info.gsText = 'only'; out['그림만_카드있음'] = bundle();
  base(); vault(false); out['글자같이_카드없음'] = bundle();
  base('1:1'); vault(true); out['비율_1:1은_그대로'] = { 첫묶음: gsPrompt(gsBundles()[0]).split('\n').slice(0, 8).join('\n') };
  base('3:4'); vault(true); out['비율_3:4'] = { 첫묶음: gsPrompt(gsBundles()[0]).split('\n').slice(0, 8).join('\n') };
  base(); out['보관함없음_외모한줄'] = bundle();
  base(); vault(true); { const c = S.toon.cuts; while (c.length < 8) c.push({ ...c[c.length % 6], role: '추가' + (c.length + 1) }); } out['8장_2묶음'] = bundle();
  base(); vault(true); out['전체한번에'] = gsPrompt(S.toon.cuts.map((_, i) => i));
  base(); vault(true); out['컷별_2장'] = gsPrompt([1]);
  base(); vault(true); out['캐릭터준비'] = { 필요: ['p0', 'p1'].map((c) => gsNeed(c).join('+') || '없음'), 기준: gsPrep('p1', 'ref'), 턴어라운드: gsPrep('p0', 'turn'), 표정: gsPrep('p1', 'expr') };
  base(); out['캐릭터준비_보관함없음'] = { 필요: gsNeed('p0').join('+'), 기준: gsPrep('p0', 'ref') };
  base(); S.info.p2.on = false; S.toon.cuts.forEach((c) => { c.chars = ['p0']; }); vault(true); out['주인공1명'] = { 첫묶음: gsPrompt(gsBundles()[0]).split('[장별 내용]')[0] };
  base(); vault(true); S.toon.cuts[0].chars = ['p0']; S.toon.cuts[3].chars = ['p1']; S.toon.cuts[2].direction = '계산대 모니터 앞에서 얼굴을 바짝 대고 있다.'; S.toon.cuts[2].bubble = ''; out['등장_고른인물과_짐작'] = { 첫묶음: gsPrompt(gsBundles()[0]) };
  base(); vault(true); S.toon.cuts.forEach((c) => { c.direction = '텅 빈 진열대 풍경'; c.bubble = ''; }); out['등장_짐작불가'] = { 첫묶음: gsPrompt(gsBundles()[0]) };
  base(); vault(true); S.toon.cuts[2].panels = '위 큰 칸 전신, 아래 작은 칸 놀란 얼굴'; out['칸나누기_고른장'] = { 첫묶음: gsPrompt(gsBundles()[0]) };
  base(); S.info.cast = '단골 할머니(흰 파마머리)'; S.toon.cuts[4].chars = ['p0', 'cast']; out['조연설정_장별'] = { 첫묶음: gsPrompt(gsBundles()[0]) };
  base(); vault(true); S.info.art = 'shonen'; { const t = gsPrompt(gsBundles()[0]); out['테마_열혈소년'] = { 공통설정: t.split('[장별 내용]')[0], 첫장: t.split('[장별 내용]')[1].split('\n\n')[0], 마무리: t.split('[마무리]')[1] }; }
  base();
  out.__styles = Object.entries(ARTS_DEF).map(([k, v]) => [k, v.gsStyle || '']);
  return out;
});
await browser.close(); srv.close();
if (errors.length) { console.log('[FAIL] 페이지 오류:', errors.slice(0, 3)); process.exit(1); }
const styles = result.__styles; delete result.__styles;
const json = JSON.stringify(result, null, 2) + '\n';
if (update) { fs.writeFileSync(file, json); console.log('젠스파크 골든 갱신:', path.relative(root, file), `(${(json.length / 1024).toFixed(0)}KB)`); process.exit(0); }
if (!fs.existsSync(file)) { console.log('[FAIL] 젠스파크 골든 파일이 없어요. --update 로 처음 만드세요.'); process.exit(1); }
const gold = JSON.parse(fs.readFileSync(file, 'utf8')); let diffs = 0;
const walk = (a, b, p) => {
  if (typeof a === 'string' || typeof b === 'string' || a == null || b == null) { if (a === b) return; diffs++; console.log(`[DIFF] ${p}`);
    const al = String(a ?? '(없음)').split('\n'), bl = String(b ?? '(없음)').split('\n'); let shown = 0;
    for (let i = 0; i < Math.max(al.length, bl.length) && shown < 4; i++) if (al[i] !== bl[i]) { shown++; console.log(`   골든  : ${al[i] ?? '(줄 없음)'}\n   지금  : ${bl[i] ?? '(줄 없음)'}`); }
    return; }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[k], b[k], p ? p + ' › ' + k : k);
};
walk(gold, result, '');
// 규칙: 인물 이름은 대괄호, 카드가 있으면 카드 칸, 없으면 외모 한 줄, 4:5도 3:4로
const w = result['글자같이_카드있음_4:5→3:4'].첫묶음, nc = result['글자같이_카드없음'].첫묶음;
const must = [[/비율: 3:4 세로/.test(w) && !/4:5/.test(w), '4:5를 골라도 젠스파크 프롬프트는 3:4'], [/\n- 등장: \[사장님_A\], \[알바생_B\]/.test(w), '장별 등장인물이 [대괄호]'], [/카드: 얼굴형 .* \/ 대표 색 /.test(w), '카드가 있으면 등장인물에 카드 칸'], [!/카드:/.test(nc), '카드가 없으면 카드 줄 없이 외모 한 줄'], [(w.match(/한 장에 한 장면만\(칸 나누기 없이\)/g) || []).length === 6 && /같은 대사·효과음을 한 장 안에서 두 번 쓰지 마세요/.test(w), '칸 나누기를 안 고른 장마다 "한 장에 한 장면만", 마무리에 같은 대사·효과음 중복 금지'], [(result['칸나누기_고른장'].첫묶음.match(/한 장에 한 장면만/g) || []).length === 5 && /3장[\s\S]*- 칸 나누기: 위 큰 칸 전신/.test(result['칸나누기_고른장'].첫묶음), '칸 나누기를 고른 장은 그 문장 그대로, 한 장면만 줄은 넣지 않음'], [/_00_기준/.test(result['캐릭터준비_보관함없음'].기준) === false, '프롬프트 본문에는 파일 이름을 넣지 않음']];
// 테마별 gsStyle: 선/색/비율/배경/그림자/쓰지 말 것 6줄, 300자 이내 (13개 전부)
const GS_KEYS = ['선', '색', '비율', '배경', '그림자', '쓰지 말 것'];
for (const [k, v] of styles) {
  const ls = v.split('\n'); const okLines = ls.length === 6 && ls.every((l, i) => l.startsWith(GS_KEYS[i] + ': ') && l.length > GS_KEYS[i].length + 3);
  if (!okLines) { diffs++; console.log(`[DIFF] 규칙 위반: ${k} gsStyle은 선/색/비율/배경/그림자/쓰지 말 것 6줄이어야 해요`); }
  if (v.length > 300) { diffs++; console.log(`[DIFF] 규칙 위반: ${k} gsStyle ${v.length}자 (300자 이내)`); }
}
if (styles.length < 13) { diffs++; console.log(`[DIFF] 규칙 위반: 기본 테마 ${styles.length}개 (13개여야 해요)`); }
const two = result['8장_2묶음'];
const more = [
  [(w.match(/\[테마: 귀여운 2~3등신 그림체 유지\]/g) || []).length === 6, '컷마다 끝에 [테마: OO 그림체 유지] 한 줄'],
  [/- 그림체\(테마: 귀여운 2~3등신\): /.test(w) && /\n  선: .*\n  색: .*\n  비율: .*\n  배경: .*\n  그림자: .*\n  쓰지 말 것: /.test(w), '그림체 줄에 테마 이름과 gsStyle 6줄'],
  [/첨부 이미지는 얼굴·머리·옷·체형을 참고하는 용도예요\. 그림체\(선·색·비율\)는 \[공통 설정\]의 테마\(귀여운 2~3등신\)를 따르고, 첨부 이미지와 다르면 테마를 우선/.test(w), '마무리: 첨부는 외형 참고용, 그림체는 테마 우선'],
  [/앞 묶음에서 그린 그림이 아니라 아래 \[공통 설정\]의 그림체를 기준으로/.test(two.마지막묶음) && !/앞 묶음에서 그린 그림이 아니라/.test(two.첫묶음), '두 번째 묶음부터 앞 묶음 그림이 아니라 공통 설정 그림체 기준'],
  [!/선화 스타일/.test(result['캐릭터준비'].턴어라운드), '턴어라운드 프롬프트에 선화 스타일을 넣지 않음'],
  [!/한 장에 한 장면만[^\n]*테마/.test(w), '테마 줄이 "한 장에 한 장면만" 줄과 겹치지 않음'],
];
for (const [ok, m] of more) if (!ok) { diffs++; console.log('[DIFF] 규칙 위반:', m); }
for (const [ok, m] of must) if (!ok) { diffs++; console.log('[DIFF] 규칙 위반:', m); }
if (diffs) { console.log(`\n[FAIL] 젠스파크 프롬프트 ${diffs}곳이 골든과 달라요. 의도한 변경이면 이유를 먼저 보고하고 승인받으세요.`); process.exit(1); }
console.log('[PASS] 젠스파크 프롬프트 골든 일치 (시나리오 ' + Object.keys(gold).length + '개)');
