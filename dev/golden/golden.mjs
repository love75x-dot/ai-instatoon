// 프롬프트 골든 검사. 보리당 예시로 앱 3단계 프롬프트(캐릭터 시트·규칙·컷별·안내 카드·다시 그리기 문장)를 뽑아
// dev/golden/prompts.json 과 비교한다.
//   node dev/golden/golden.mjs            비교(다르면 어느 줄이 바뀌었는지 보여 주고 실패)
//   node dev/golden/golden.mjs --update   골든 갱신 (문장이 바뀐 이유를 사장님께 먼저 보고·승인받은 뒤에만!)
import fs from 'node:fs';
import path from 'node:path';
import { root, serve, launch, newPage } from '../lib/harness.mjs';

const file = path.join(root, 'dev', 'golden', 'prompts.json');
const update = process.argv.includes('--update');

const srv = await serve(); const browser = await launch();
const { page, errors } = await newPage(browser, srv.base);
await page.goto(srv.base + '/'); await page.waitForTimeout(600);

const result = await page.evaluate(() => {
  const out = {};
  const base = () => { kv.removeItem('instatoon.photo.0'); kv.removeItem('instatoon.photo.1'); S = demoState('bakery'); S.info.ratio = '4:5'; return S; };
  const grab = () => {
    const r = { sheets: peopleIdx().map((k) => sheetPrompt(k)), setup: setupPrompt(), cuts: cuts().map((c, i) => cutPrompt(c, i)), end: endPrompt(),
      fix: { char: FIX_CHAR, text: FIX_TEXT, ratio: FIX_RATIO(), typo: FIX_TYPO, style: FIX_STYLE, label: FIX_LABEL, draw: FIX_DRAW() } };
    return r;
  };
  const SC = {
    '기본_4:5': () => {},
    '비율_1:1': () => { S.info.ratio = '1:1'; },
    '비율_3:4': () => { S.info.ratio = '3:4'; },
    '주인공1명': () => { S.info.p2.on = false; },
    '주인공3명': () => { S.info.p3 = { role: '손님', gender: '여성', age: '70대', looks: '보라색 카디건', on: true }; },
    '디테일없음': () => { S.info.details = []; },
    '디테일전부': () => { S.info.details = DETAILS.map((d) => d[0]); },
    '조연+캐릭터메모': () => { S.info.cast = '단골 할머니(흰 파마머리, 보라 카디건)'; S.info.locks = { 0: '안경은 항상 동그란 테', 1: '초록 앞치마' }; },
    '사진첨부+로고': () => { kv.setItem('instatoon.photo.0', 'data:image/png;base64,AAAA'); prof().logo = 'data:image/png;base64,BBBB'; },
    '컷변형': () => {
      const m = { role: '', shot: '미디엄샷', title: '', highlight: '', sub: '', bubble: '', bubbleSide: 'l', sfx: '', direction: '', panels: '', caption: '', extras: '' };
      S.toon.cuts = [
        { ...m, role: '도입', title: '손님이\n사라졌다', highlight: '사라졌다', sub: '보리당 이야기', bubble: '사장님: 어? 빵이 없네', direction: '텅 빈 진열대 앞에 선 사장님', sfx: '쿵', caption: '오후 3시', extras: "땀방울, '헉'", panels: '위아래 2칸' },
        { ...m, role: '대사만', shot: '클로즈업', bubble: '사장님(속마음): 설마\n알바생(외침): 사장님!\n사장님(속삭임): 쉿', direction: '두 사람 얼굴' },
        { ...m, role: '떨림', shot: '풀샷', bubble: '알바생(떨림): 저, 저기\n할머니: 한 판 더 주세요', direction: '가게 문 앞' },
        { ...m, role: '제목만', title: '그래서 오늘도\n한 판 더', direction: '갓 구운 빵' },
        { ...m, role: '빈컷' },
      ];
    },
    '안내카드_일부비움': () => { Object.assign(ec(), { on: true, style: 'light', name: '', head: '내일도\n문 열어요', lines: '', btn: '', foot: '저장해 두세요' }); },
    '안내카드_전부비움': () => { Object.assign(ec(), { on: true, name: '', head: '', lines: '', btn: '', foot: '' }); },
    '컷수_최소4': () => { S.toon.cuts = S.toon.cuts.slice(0, 4); S.info.cuts = 4; },
    '컷수_최대10': () => { const c = S.toon.cuts; let i = 0; while (c.length < 10) { const o = { ...c[i % 6] }; o.role = '추가' + (c.length + 1); o.title = o.title ? o.title + ' ' + (c.length + 1) : ''; c.push(o); i++; } S.info.cuts = 10; },
    '안내카드_스타일별': () => {},
  };
  for (const [name, fn] of Object.entries(SC)) {
    if (name === '안내카드_스타일별') {
      out[name] = {};
      for (const st of Object.keys(END_STYLES)) { base(); ec().on = true; ec().style = st; out[name][st] = endPrompt(); }
      continue;
    }
    base(); fn(); out[name] = grab();
  }
  out['글자테마별_규칙'] = {};
  for (const a of Object.keys(ARTS)) { base(); S.info.art = a; out['글자테마별_규칙'][a] = { setup: setupPrompt(), sheet: sheetPrompt(0) }; }
  base();
  // ── 3단계(컷 편집) 새 칸: 비어 있으면 기본과 같고(승인된 문장은 새 칸을 채웠을 때만 추가), 스위치를 끄면 채워도 기본과 같다
  const fillNew = () => {
    const c = S.toon.cuts;
    Object.assign(c[0], { chars: ['p0'], emotion: '당황, 땀 흘림', place: '빵집 진열대 앞, 오후 3시', avoid: '배경 속 사람', ok: true });
    Object.assign(c[1], { chars: ['p0', 'p1'], sameBg: true, diff: '진열대가 텅 비었어요' });
    Object.assign(c[2], { sameBg: true, place: '주방', emotion: '' });
    Object.assign(c[3], { chars: ['cast'], diff: '할머니가 들어왔어요', avoid: '간판·글씨, 로고' });
  };
  const withCast = () => { base(); S.info.cast = '단골 할머니(흰 파마머리)'; };
  withCast(); out['조연설정_기본'] = grab();
  withCast(); fillNew(); out['새칸_채움'] = grab();
  withCast(); fillNew(); CUT_EXTRA_PROMPT = false; out['새칸_채움_스위치꺼짐'] = grab(); CUT_EXTRA_PROMPT = true;
  base(); S.info.p2.on = false; S.toon.cuts[0].chars = ['p0']; S.toon.cuts[1].sameBg = true; out['주인공1명_새칸'] = { cut1: cutPrompt(S.toon.cuts[0], 0), cut2: cutPrompt(S.toon.cuts[1], 1) };
  VAULT_PROMPT2 = false; /* 4a 보관함_* 시나리오는 승인 전 문장(스위치 끔)으로 고정해 두는 회귀용. 승인 문장은 보관함v2_*(스위치 켬) */
  // ── 4a단계(캐릭터 보관함): 보관함 인물 4·5·6명, 장소 첨부 있음/없음, 이번 편만 수정, 연결 없이 카드만 채움
  const img = (n) => ({ blob: new Blob(['x']), name: n, type: 'image/png', size: 1 });
  const mkc = (id, kind, role, age, gender, looks, card, ready) => ({ id, kind, role, age, gender, looks, card, images: { ref: ready ? img(id + '.png') : null, turn: null, expr: null, outfits: id === '사장님_A' ? [{ ...img('u.png'), name: '유니폼' }] : [] }, savedAt: 1, updatedAt: 1 });
  const vaultBase = (nSub, place) => {
    base(); S.info.cast = ''; S.toon.cast = '';
    VAULT.chars = {
      '사장님_A': mkc('사장님_A', 'main', '사장님', '40대', '여성', '짧은 단발, 동그란 안경, 밀가루 묻은 베이지 앞치마', { face: '동글동글한 달걀형', eyes: '처진 큰 눈, 갈색', hair: '짧은 단발, 짙은 갈색', body: '작은 키, 2.5등신', feature: '동그란 안경', outfit: '베이지 앞치마', hex: '베이지(#E8D5B0), 머스타드 옐로(#D4A017)', keep: '안경은 항상 동그란 테' }, true),
      '알바생_B': mkc('알바생_B', 'main', '알바생', '20대', '남성', '까치머리, 초록 앞치마', { hair: '까치머리', keep: '초록 앞치마' }, true),
      '손님_C': mkc('손님_C', 'main', '손님', '30대', '여성', '긴 생머리, 노란 우비', {}, false),
      '단골할머니_D': mkc('단골할머니_D', 'sub', '단골 할머니', '70대', '여성', '흰 단발 파마, 보라색 카디건, 장바구니', { keep: '보라색 카디건' }, true),
      '택배기사_E': mkc('택배기사_E', 'sub', '택배기사', '30대', '남성', '파란 조끼, 야구 모자', {}, true),
      '꼬마_F': mkc('꼬마_F', 'sub', '꼬마', '8세', '남성', '노란 모자, 큰 가방', {}, false),
    };
    VAULT.places = place ? { '빵집': { name: '빵집', desc: '나무 진열대가 있는 동네 빵집', image: place === 'img' ? img('p.png') : null } } : {};
    linkSlot('m0', '사장님_A'); linkSlot('m1', '알바생_B'); linkSlot('m2', '손님_C');
    S.info.link[0].outfit = '유니폼';
    ['단골할머니_D', '택배기사_E', '꼬마_F'].slice(0, nSub).forEach((id, j) => linkSlot('s' + j, id));
    const all = ['p0', 'p1', 'p2', ...['s0', 's1', 's2'].slice(0, nSub)];
    S.toon.cuts[0].chars = all; S.toon.cuts[1].chars = ['p0', ...(nSub ? ['s0'] : [])];
    if (place) { S.toon.cuts[0].placeId = '빵집'; S.toon.cuts[1].sameBg = true; }
    return S;
  };
  const gv = () => ({ sheet0: sheetPrompt(0), sheet1: sheetPrompt(1), setup: setupPrompt(), cut1: cutPrompt(S.toon.cuts[0], 0), cut2: cutPrompt(S.toon.cuts[1], 1) });
  vaultBase(1, null); out['보관함_4명'] = gv();
  vaultBase(2, null); out['보관함_5명'] = gv();
  vaultBase(3, null); out['보관함_6명'] = gv();
  vaultBase(3, 'img'); out['보관함_6명_장소첨부있음'] = gv();
  vaultBase(3, 'noimg'); out['보관함_6명_장소이미지없음'] = gv();
  vaultBase(1, null); S.info.link[0].ov = { looks: '이번 편만: 머리를 하나로 묶음', card: { hair: '하나로 묶은 머리' } }; syncLinked(); out['보관함_이번편만수정'] = { ...gv(), vaultOriginal: VAULT.chars['사장님_A'].card.hair };
  base(); S.info.cast = ''; S.toon.cast = ''; VAULT.chars = {}; VAULT.places = {}; S.info.card = { face: '동글동글한 달걀형', hex: '머스타드 옐로(#D4A017)', keep: '안경은 항상 동그란 테' }; S.toon.cuts[0].chars = ['p0']; out['카드만_연결없음'] = gv();
  VAULT.chars = {}; VAULT.places = {};
  // ── 4a 후속(승인 대기 문장, VAULT_PROMPT2): 규칙 1번=첨부한 인물 전체, 컷별 "이 컷 의상 — 기본 의상 대신", 첨부 줄의 의상 시트, 장소+시간대 글 유지
  VAULT_PROMPT2 = true;
  vaultBase(3, 'img'); S.toon.cuts[0].place = '빵집 진열대 앞, 오후 3시'; S.toon.cuts[1].outfit = { p0: '-' }; S.toon.cuts[2].chars = ['p0', 's0']; S.toon.cuts[2].outfit = { p0: '유니폼' }; out['보관함v2_6명_의상_장소시간대'] = { ...gv(), cut3: cutPrompt(S.toon.cuts[2], 2) };
  vaultBase(1, null); out['보관함v2_4명'] = gv();
  const refimgs = () => { const A = VAULT.chars['사장님_A'].images, B = VAULT.chars['알바생_B'].images; A.turn = img('t.png'); A.expr = img('e.png'); B.turn = img('t2.png'); B.expr = img('e2.png'); };
  vaultBase(2, 'img'); refimgs(); S.toon.cuts[0].place = '빵집 진열대 앞, 오후 3시'; out['보관함v2_5명_참고이미지번호'] = gv();
  vaultBase(0, 'img'); refimgs(); delete S.info.link[2]; S.info.p3.on = false; S.toon.cuts[0].chars = ['p0', 'p1']; S.toon.cuts[1].chars = ['p0', 'p1']; out['보관함v2_2명_참고이미지번호'] = gv();
  base(); S.info.cast = '단골 할머니(흰 파마머리)'; VAULT.chars = {}; VAULT.places = {}; out['보관함v2_옛작업_스위치켜도불변'] = grab();
  VAULT_PROMPT2 = false; VAULT.chars = {}; VAULT.places = {};
  base(); S.info.cast = '단골 할머니(흰 파마머리)'; out['보관함v2_옛작업_기준'] = grab();
  VAULT_PROMPT2 = true; VAULT.chars = {}; VAULT.places = {};
  base();
  return out;
});
await browser.close(); srv.close();
if (errors.length) { console.log('[FAIL] 페이지 오류:', errors.slice(0, 3)); process.exit(1); }

const json = JSON.stringify(result, null, 2) + '\n';
if (update) { fs.writeFileSync(file, json); console.log('골든 갱신:', path.relative(root, file), `(${(json.length / 1024).toFixed(0)}KB)`); process.exit(0); }
if (!fs.existsSync(file)) { console.log('[FAIL] 골든 파일이 없어요. --update 로 처음 만드세요.'); process.exit(1); }
const gold = JSON.parse(fs.readFileSync(file, 'utf8'));
let diffs = 0;
const walk = (a, b, p) => {
  if (typeof a === 'string' || typeof b === 'string' || a == null || b == null) {
    if (a === b) return; diffs++;
    const al = String(a ?? '(없음)').split('\n'), bl = String(b ?? '(없음)').split('\n');
    console.log(`[DIFF] ${p}`);
    let shown = 0; for (let i = 0; i < Math.max(al.length, bl.length) && shown < 4; i++) if (al[i] !== bl[i]) { shown++; console.log(`   골든  : ${al[i] ?? '(줄 없음)'}\n   지금  : ${bl[i] ?? '(줄 없음)'}`); }
    return;
  }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[k], b[k], p ? p + ' › ' + k : k);
};
walk(gold, result, '');
// 새 칸을 비웠을 때 반영을 켜도 기본과 같고, 새 칸을 채워도 반영이 꺼져 있으면 기본과 같아야 한다
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
if (!eq(result['보관함v2_옛작업_스위치켜도불변'], result['보관함v2_옛작업_기준'])) { diffs++; console.log('[DIFF] 보관함을 안 쓰는 옛 작업은 승인 대기 문장을 켜도 프롬프트가 같아야 해요'); }
if (!eq(result['새칸_채움_스위치꺼짐'], result['조연설정_기본'])) { diffs++; console.log('[DIFF] 스위치를 끄면 새 칸을 채워도 프롬프트가 기본과 같아야 해요'); }
// 새 칸이 모두 비어 있으면 프롬프트가 기본(조연설정_기본)과 같아야 한다 → 아래 '새칸_채움'과 비교하는 대신, 비어 있는 상태의 기본 시나리오들이 승인 전 골든과 그대로인지로 보장한다(위 walk)
if (diffs) { console.log(`\n[FAIL] 프롬프트 ${diffs}곳이 골든과 달라요. 의도한 변경이면 이유를 먼저 보고하고 승인받으세요.`); process.exit(1); }
console.log('[PASS] 프롬프트 골든 일치 (시나리오 ' + Object.keys(gold).length + '개)');
