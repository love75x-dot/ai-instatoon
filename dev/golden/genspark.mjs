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
  base(); S.info.cast = '단골 할머니(흰 파마머리)'; S.toon.cuts[4].chars = ['p0', 'cast']; out['조연설정_장별'] = { 첫묶음: gsPrompt(gsBundles()[0]) };
  base();
  return out;
});
await browser.close(); srv.close();
if (errors.length) { console.log('[FAIL] 페이지 오류:', errors.slice(0, 3)); process.exit(1); }
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
const must = [[/비율: 3:4 세로/.test(w) && !/4:5/.test(w), '4:5를 골라도 젠스파크 프롬프트는 3:4'], [/\n- 등장: \[사장님_A\], \[알바생_B\]/.test(w), '장별 등장인물이 [대괄호]'], [/카드: 얼굴형 .* \/ 대표 색 /.test(w), '카드가 있으면 등장인물에 카드 칸'], [!/카드:/.test(nc), '카드가 없으면 카드 줄 없이 외모 한 줄'], [/_00_기준/.test(result['캐릭터준비_보관함없음'].기준) === false, '프롬프트 본문에는 파일 이름을 넣지 않음']];
for (const [ok, m] of must) if (!ok) { diffs++; console.log('[DIFF] 규칙 위반:', m); }
if (diffs) { console.log(`\n[FAIL] 젠스파크 프롬프트 ${diffs}곳이 골든과 달라요. 의도한 변경이면 이유를 먼저 보고하고 승인받으세요.`); process.exit(1); }
console.log('[PASS] 젠스파크 프롬프트 골든 일치 (시나리오 ' + Object.keys(gold).length + '개)');
