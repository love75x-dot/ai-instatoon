// 글 프롬프트 골든(4c 추가): 한 편 만들기(make)·한 달 기획(month) 요청 문장을 보리당 예시로 뽑아 dev/golden/text.json 과 비교한다.
// 3단계 그림 프롬프트 골든(golden.mjs)과 따로 둔다. ask()를 가짜로 바꿔 실제 요청 문장만 가로채므로 AI 호출은 일어나지 않는다.
//   node dev/golden/text.mjs            비교(다르면 어느 줄이 바뀌었는지 보여 주고 실패)
//   node dev/golden/text.mjs --update   골든 갱신 (문장이 바뀐 이유를 사장님께 먼저 보고·승인받은 뒤에만!)
import fs from 'node:fs';
import path from 'node:path';
import { root, serve, launch, newPage } from '../lib/harness.mjs';

const file = path.join(root, 'dev', 'golden', 'text.json');
const update = process.argv.includes('--update');
const srv = await serve(); const browser = await launch();
const { page, errors } = await newPage(browser, srv.base);
await page.goto(srv.base + '/'); await page.waitForTimeout(600);

const result = await page.evaluate(async () => {
  const out = {}; let got = null;
  const real = ask; ask = async (p) => { got = p; throw { code: 'golden_stub' }; };
  const grabMake = async (theme) => { got = null; await makeToon(theme); return got; };
  const grabMonth = async () => { got = null; await makeMonth(); return got; };
  const base = () => { S = demoState('bakery'); S.mode = 'one'; return S; };
  const SC = {
    '만들기_기본6컷': async () => { base(); return { make: await grabMake() }; },
    '만들기_주제있음': async () => { base(); return { make: await grabMake('겨울 신메뉴 소금빵') }; },
    '만들기_프로필': async () => { base(); Object.assign(prof(), { voice: '다정한 존댓말', banned: '최고, 1등', tags: '#보리당 #망원동빵집', cta: '예약은 프로필 링크' }); return { make: await grabMake() }; },
    '만들기_컷수_4와_10': async () => { base(); S.info.cuts = 4; const a = await grabMake(); S.info.cuts = 10; return { c4: a, c10: await grabMake() }; },
    '만들기_둘이대화': async () => { base(); S.info.mode = 'duo'; return { make: await grabMake() }; },
    '연재기억_있음': async () => { base(); S.series = [
      { sid: 'a0', title: '맨 처음 편', story: '가장 오래된 편이라 요청에서 빠져야 한다(최근 3편만 보낸다).', threads: ['빠져야 할 떡밥'], tone: '', cast: [], at: 1759900000000 },
      { sid: 'a1', title: '첫 손님', story: '사장님이 소금빵 품절로 당황하지만 단골 할머니가 웃으며 기다려 준다.', threads: ['할머니의 비밀 레시피'], tone: '사장님은 존댓말, 알바생과는 반말 티키타카', cast: ['사장님_A', '알바생_B'], at: 1760000000000 },
      { sid: 'a2', title: '새벽 반죽', story: '알바생이 새벽 반죽에 처음 도전하다 실수를 하고 사장님이 말없이 같이 다시 한다.', threads: ['알바생이 숨긴 사연', '옆 가게 사장님의 제안'], tone: '사장님이 알바생을 믿기 시작함', cast: ['사장님_A', '알바생_B'], at: 1760100000000 },
      { sid: 'a3', title: '비 오는 날', story: '비 오는 날 손님이 없어 둘이 빵을 나눠 먹으며 속마음을 털어놓는다.', threads: ['옆 가게 사장님의 제안'], tone: '둘 사이가 한결 편해짐', cast: ['사장님_A', '알바생_B'], at: 1760200000000 }];
      return { make: await grabMake(), month: await grabMonth() }; },
    '연재기억_끝나지않은편_제외': async () => { base(); S.toon.sid = 'cur'; S.toon.pics = []; S.series = [
      { sid: 'a1', title: '지난 편', story: '지난 편 줄거리', threads: ['떡밥 하나'], tone: '', cast: ['사장님_A'], at: 1760000000000 },
      { sid: 'cur', title: '지금 만들던 편', story: '이 편은 다시 만드는 중이라 요청에서 빠져야 한다', threads: ['빠져야 할 떡밥'], tone: '', cast: [], at: 1760100000000 }]; return { make: await grabMake() }; },
    '짧은판_만들기': async () => { base(); PACK_FORCE = true; try { return { make: await grabMake() }; } finally { PACK_FORCE = null; } },
    '짧은판_대본유형_광고': async () => { base(); S.info.kind = 'ad'; const a = await grabMake(); PACK_FORCE = true; try { return { 원래판: a, 짧은판: await grabMake() }; } finally { PACK_FORCE = null; } },
    '한달기획_기본': async () => { base(); return { month: await grabMonth() }; },
    '한달기획_메모': async () => { base(); mo().memo = '단골 할머니가 매주 오심. 소금빵이 품절된 날 생긴 일.'; return { month: await grabMonth() }; },
  };
  for (const [k, fn] of Object.entries(SC)) out[k] = await fn();
  ask = real;
  return out;
});

let ok = true;
if (update) { fs.writeFileSync(file, JSON.stringify(result, null, 2) + '\n'); console.log('[UPDATE] text.json 저장 (시나리오 ' + Object.keys(result).length + '개)'); }
else {
  const gold = JSON.parse(fs.readFileSync(file, 'utf8'));
  const norm = (o) => JSON.parse(JSON.stringify(o));
  for (const k of new Set([...Object.keys(gold), ...Object.keys(result)])) {
    for (const f of new Set([...Object.keys(gold[k] || {}), ...Object.keys(result[k] || {})])) {
      const a = (gold[k] || {})[f], b = (result[k] || {})[f];
      if (a === b) continue; ok = false;
      console.log(`[FAIL] ${k} / ${f}`);
      const A = String(a ?? '').split('\n'), B = String(b ?? '').split('\n');
      for (let i = 0; i < Math.max(A.length, B.length); i++) if (A[i] !== B[i]) console.log(`  줄 ${i + 1}\n  - ${A[i] ?? '(없음)'}\n  + ${B[i] ?? '(없음)'}`);
    }
  }
  if (ok) console.log(`[PASS] 글 프롬프트 골든 일치 (시나리오 ${Object.keys(gold).length}개)`);
}
if (errors.length) { console.log('페이지 오류:', errors.slice(0, 3)); ok = false; }
await browser.close(); srv.close(); process.exit(ok ? 0 : 1);
