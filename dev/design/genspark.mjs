// 4e 검사: 3단계 "다음 항목 복사"(진행 줄·복사하고 다음으로·새로고침 뒤에도 ✓) / 젠스파크 탭(시작 전 체크·캐릭터 준비 상태·글자 선택·6장씩 묶음·보조 복사) /
// 폭별 배치(PC 고정 줄·휴대폰 하단 바·가로 넘침 없음) / 기존 ChatGPT·Gemini 화면 그대로.
//   node dev/design/genspark.mjs
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();
const PC = { width: 1300, height: 900 }, TAB = { width: 820, height: 900 }, MOB = { width: 390, height: 844 };
const withKey = { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' };
const seed = `(async () => {
  const mk = (n, seed) => { const u = new Uint8Array(n); let x = seed; for (let i = 0; i < n; i++) { x = (x * 1103515245 + 12345) & 0x7fffffff; u[i] = x >> 16; } u[0] = 0x89; return new Blob([u], { type: 'image/png' }); };
  const im = (n, s) => ({ blob: mk(3000, s), name: n, type: 'image/png', size: 3000 });
  S = demoState('bakery'); S.demo = false; S.mode = 'one'; S.step = 'post'; S.info.ratio = '4:5';
  await vaultPut('characters', { id: '사장님_A', kind: 'main', role: '사장님', age: '40대', gender: '여성', looks: '짧은 단발', card: { face: '동글동글한 달걀형', keep: '동그란 안경' }, images: { ref: im('a.png', 1), turn: im('t.png', 2), expr: im('e.png', 3), outfits: [] }, savedAt: 1, updatedAt: 1, ready: true });
  await vaultPut('characters', { id: '알바생_B', kind: 'main', role: '알바생', age: '20대', gender: '남성', looks: '까치머리', card: {}, images: { ref: im('b.png', 4), turn: null, expr: null, outfits: [] }, savedAt: 1, updatedAt: 1, ready: true });
  linkSlot('m0', '사장님_A'); linkSlot('m1', '알바생_B'); save(); render();
})()`;
const open = async (vp = PC) => {
  const h = await newPage(browser, srv.base, { viewport: vp, ls: withKey, freeze: false });
  await h.ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: srv.base });
  await h.page.goto(srv.base + '/'); await h.page.waitForTimeout(500); await h.page.evaluate(seed); await h.page.waitForTimeout(400); return h;
};
// Windows 크롬은 클립보드에서 줄바꿈을 CRLF로 돌려주므로 LF로 맞춰 비교한다
const clip = (pg) => pg.evaluate(async () => (await navigator.clipboard.readText()).replace(/\r\n/g, '\n'));

// ─── ChatGPT·Gemini 화면(기본): 탭·진행 줄 ───
const A = await open(); const pg = A.page;
C.ok(await pg.locator('.gtab').count() === 2 && await pg.locator('.gtab[aria-selected="true"]').innerText().then((t) => /ChatGPT·Gemini/.test(t)), '그림 그리기 위에 탭 "ChatGPT·Gemini | 젠스파크"(기본은 ChatGPT·Gemini)');
const stdTotal = await pg.locator('#guideBox [data-seq]').count();
C.ok(stdTotal === 2 + 1 + 6 && await pg.locator('#seqN').innerText() === `0 / ${stdTotal}`, `진행 줄: 0 / ${stdTotal} (캐릭터 2 + 규칙 1 + 컷 6)`);
C.ok(await pg.locator('#guideBox .guide li').first().evaluate((l) => l.classList.contains('now')), '지금 할 항목이 표시됨');
const first = await pg.evaluate(() => sheetPrompt(0));
await pg.locator('#seqGo').click(); await pg.waitForTimeout(250);
C.ok(await clip(pg) === first && await pg.locator('#seqN').innerText() === `1 / ${stdTotal}`, '"복사하고 다음으로": 지금 항목을 복사하고 1 / N으로 올라감');
C.ok(await pg.locator('#guideBox [data-copy="sheet-0"]').evaluate((b) => b.classList.contains('copied')), '복사한 항목에 ✓ 복사함 표시(기존 표시 그대로)');
await pg.locator('#seqGo').click(); await pg.waitForTimeout(150); await pg.locator('#seqGo').click(); await pg.waitForTimeout(150);
C.ok(await clip(pg) === await pg.evaluate(() => setupPrompt()) && await pg.locator('#seqN').innerText() === `3 / ${stdTotal}`, '세 번째는 "규칙 알려주기"를 복사(기존 순서 그대로)');
await pg.reload(); await pg.waitForTimeout(700); await pg.evaluate(seed); await pg.waitForTimeout(400);
C.ok(await pg.locator('#seqN').innerText() === `3 / ${stdTotal}`, '새로고침 뒤에도 ✓와 진행 줄이 그대로');
await pg.locator('[data-act="copyReset"]').click(); await pg.waitForTimeout(150);
C.ok(await pg.locator('#seqN').innerText() === `0 / ${stdTotal}`, '"표시 지우기"를 누르면 진행 줄도 0으로');

// ─── 젠스파크 탭 ───
await pg.locator('.gtab[data-v="gs"]').click(); await pg.waitForTimeout(300);
const tx = await pg.locator('#guideBox').innerText();
C.ok(/Nano Banana Pro/.test(tx) && /3:4 세로/.test(tx) && /최대 14장/.test(tx), '젠스파크 탭: 시작 전 체크(모델·비율·참조 14장)');
C.ok(/4:5로 골랐지만 젠스파크에는 4:5가 없어서 3:4/.test(tx), '앱에서 4:5를 골랐으면 3:4로 만든다는 안내');
// 젠스파크는 프롬프트의 비율이 아니라 화면의 비율 설정을 따른다: 눈에 띄는 안내가 맨 위와 복사 버튼 바로 옆에 있어야 함
const rn = await pg.locator('.gs-ratio').count();
C.ok(rn === 2 && /젠스파크 화면에서 비율을 3:4로 바꿨나요\?/.test(tx) && /화면의 비율 설정/.test(tx) && /기준 1:1 · 턴어라운드 16:9 · 표정 1:1/.test(tx), `비율 안내: 맨 위 큰 안내 + 묶음마다 복사 버튼 옆 한 줄 (${rn}곳), 기준 1:1·턴어라운드 16:9·컷 3:4가 다르다는 설명`);
C.ok(await pg.locator('.gs-ratio:not(.sm)').evaluate((e) => parseFloat(getComputedStyle(e).borderTopWidth) >= 2) && await pg.locator('li:has([data-copy="gs-b0"]) .gs-ratio.sm').count() === 1, '큰 안내는 굵은 테두리로 눈에 띄고, 6장씩 복사 버튼과 같은 묶음 안에 안내가 있음');
C.ok(/그림 크기: 기준 이미지 1:1 · 턴어라운드 16:9 · 표정 시트 1:1/.test(tx), '캐릭터 준비 제목 아래에도 그림 크기 한 줄');
const gp = await pg.evaluate(() => gsPrompt(gsBundles()[0]));
C.ok(/한 장에 한 장면만\(칸 나누기 없이\)/.test(gp) && /같은 대사·효과음을 한 장 안에서 두 번 쓰지 마세요/.test(gp), '칸 나누기를 안 고른 장에는 "한 장에 한 장면만", 마무리에 중복 금지');
C.ok(await pg.locator('input[name="gsText"][value="with"]').isChecked() && /이 사이트에는 올린 그림 위에 글자를 얹는 기능이 없어요/.test(tx), '글자 기본은 "글자도 같이", "그림만"에는 사이트에 글자 얹기 기능이 없다는 안내');
C.ok(/사장님_A[\s\S]*준비됨 ✓/.test(tx) && /알바생_B[\s\S]*기준 이미지만 있어요[\s\S]*턴어라운드 시트·표정 시트/.test(tx), '캐릭터 준비 상태: 사장님_A 준비됨 ✓, 알바생_B는 기준만 있어 턴어라운드·표정 시트를 안내');
C.ok(await pg.locator('[data-copy^="gsprep-"]').count() === 2 && !/사장님_A 턴어라운드 시트 만들기/.test(tx), '준비된 인물은 건너뛰고, 없는 시트 프롬프트(알바생_B 2개)만 보여 줌');
C.ok(/알바생_B_01_턴어라운드\.png/.test(tx), '저장 이름은 대괄호 없이 기존 규칙(알바생_B_01_턴어라운드.png)');
C.ok(await pg.locator('#guideBox [data-copy^="gs-b"]').count() === 1 && /1~6장 보내기/.test(tx), '6장이면 묶음 1개(1~6장)');
C.ok(/이 묶음에 첨부할 이미지 \d+장/.test(tx), '묶음마다 첨부할 이미지 목록');
const attl = await pg.locator('#guideBox .attl li b').allInnerTexts();
C.ok(attl.length === 4 && attl.slice(0, 3).every((t) => /^[123]번 · 사장님_A_0[012]_/.test(t)) && /^4번 · 알바생_B_00_기준/.test(attl[3]), `첨부 목록은 인물별로 묶음: 1~3번 사장님_A(기준·턴어라운드·표정), 4번 알바생_B 기준 (${attl.join(' / ')})`);
C.ok(/첨부: 1번 기준 이미지, 2번 턴어라운드, 3번 표정 시트/.test(await pg.evaluate(() => gsPrompt(gsBundles()[0]))), '프롬프트의 첨부 번호도 같은 순서');
const seqGs = await pg.locator('#guideBox [data-seq]').count();
C.ok(seqGs === 3, `젠스파크 진행 줄은 준비 프롬프트 2개 + 묶음 1개 = ${seqGs}`);
await pg.locator('#seqGo').click(); await pg.waitForTimeout(200); await pg.locator('#seqGo').click(); await pg.waitForTimeout(200); await pg.locator('#seqGo').click(); await pg.waitForTimeout(250);
const bundleTxt = await pg.evaluate(() => gsPrompt(gsBundles()[0]));
C.ok(await clip(pg) === bundleTxt && /\[사장님_A\], \[알바생_B\]/.test(bundleTxt) && /카드: 얼굴형 동글동글한 달걀형/.test(bundleTxt), '"복사하고 다음으로"로 6장 묶음 복사: 인물 [대괄호], 카드가 있으면 카드 칸');
C.ok(await pg.locator('#seqN').innerText() === '3 / 3' && await pg.locator('#seqGo').isDisabled(), '다 보내면 "다 보냈어요 ✓"');
// 글자 선택
await pg.locator('input[name="gsText"][value="only"]').check(); await pg.waitForTimeout(250);
const onlyTxt = await pg.locator('#guideBox pre').last().innerText();
C.ok(/글자는 넣지 마세요/.test(onlyTxt) && !/글자\(정확히 이대로\)/.test(onlyTxt) && /여백:/.test(onlyTxt), '"그림만": 글자 줄 대신 여백 안내, 글자 금지');
await pg.locator('input[name="gsText"][value="with"]').check(); await pg.waitForTimeout(250);
C.ok(/글자\(정확히 이대로\)/.test(await pg.locator('#guideBox pre').last().innerText()), '"글자도 같이"로 돌아오면 글자 문구가 다시 들어감');
// 보조 복사
await pg.locator('[data-copy="gs-all"]').click(); await pg.waitForTimeout(200);
C.ok(await clip(pg) === await pg.evaluate(() => gsPrompt(cuts().map((_, i) => i))), '보조: 전체 한 번에 복사');
await pg.locator('details:has([data-copy="gs-cut-1"]) summary').click(); await pg.locator('[data-copy="gs-cut-1"]').click(); await pg.waitForTimeout(200);
C.ok(await clip(pg) === await pg.evaluate(() => gsPrompt([1])), '보조: 컷별 젠스파크용 복사');
C.ok(await pg.evaluate(() => S.info.gsMode === 'gs' && S.info.gsText === 'with'), '탭과 글자 선택은 작업에 저장됨');
await pg.locator('.gtab[data-v="std"]').click(); await pg.waitForTimeout(250);
C.ok(await pg.locator('#guideBox [data-copy="cut-0"]').count() === 1, '탭을 되돌리면 기존 ChatGPT·Gemini 순서가 그대로');
// 8장 → 2묶음
await pg.evaluate(() => { while (cuts().length < 8) cuts().push({ ...cuts()[0], role: '추가' + (cuts().length + 1) }); S.info.gsMode = 'gs'; save(); vPost(); });
await pg.waitForTimeout(300);
C.ok(await pg.locator('#guideBox [data-copy^="gs-b"]').count() === 2 && /7~8장 보내기/.test(await pg.locator('#guideBox').innerText()), '8장이면 6장 + 2장 두 묶음');

// ─── 폭별 배치 ───
const posPC = await pg.evaluate(() => getComputedStyle(document.querySelector('#seqBar')).position);
C.ok(posPC === 'sticky', `PC: 진행 줄이 위에 붙어 따라옴 (${posPC})`);
const T = await open(TAB); await T.page.evaluate(() => { S.info.gsMode = 'gs'; save(); vPost(); }); await T.page.waitForTimeout(300);
C.ok(await T.page.evaluate(() => getComputedStyle(document.querySelector('#seqBar')).position) === 'sticky' && await T.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '태블릿: 진행 줄 위 고정, 가로 넘침 없음');
for (const mode of ['std', 'gs']) {
  const M = await open(MOB); await M.page.evaluate((m) => { S.info.gsMode = m; save(); vPost(); }, mode); await M.page.waitForTimeout(300);
  const r = await M.page.evaluate(() => { const b = document.querySelector('#seqBar'), cs = getComputedStyle(b), rc = b.getBoundingClientRect(); return { pos: cs.position, bottom: Math.round(innerHeight - rc.bottom), ov: document.documentElement.scrollWidth > innerWidth + 1, btn: [...b.querySelectorAll('.btn')].map((x) => Math.round(x.getBoundingClientRect().height)) }; });
  C.ok(r.pos === 'fixed' && r.bottom <= 1 && !r.ov && r.btn.every((h) => h >= 44), `휴대폰(${mode === 'gs' ? '젠스파크' : 'ChatGPT'}): 하단 고정 바 [이전][복사하고 다음 →], 버튼 44px 이상, 가로 넘침 없음 (${JSON.stringify(r)})`);
  await M.ctx.close();
}
for (const h of [A, T]) if (h.errors.length) C.ok(false, '콘솔 오류: ' + h.errors.slice(0, 2).join(' | '));
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 젠스파크 검사 ${C.fail}건 실패` : '\n[PASS] 젠스파크 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
