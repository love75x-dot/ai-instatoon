// UI 정리(renewal-ui-cleanup) 검사: 1단계 순서·이름·설명 삭제, 캐릭터 칸(고르기/새로 만들기)·고급, 내 가게 설정, 도움말 합치기, 옛 작업 호환
//   node dev/design/ui.mjs
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();
const LS = { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' };

for (const [vk, vp] of [['PC 1300', { width: 1300, height: 900 }], ['휴대폰 390', { width: 390, height: 844 }]]) {
  const { page, errors } = await newPage(browser, srv.base, { viewport: vp, ls: LS });
  await page.goto(srv.base + '/'); await page.waitForTimeout(500);
  // 1) 순서: 제목 → 캐릭터 → 어떤 가게예요? → 있었던 일 → 웹툰 테마 → 대본 만들기 → 더 자세히
  const o = await page.evaluate(() => {
    const top = (sel) => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().top + scrollY) : -1; };
    return { h1: document.querySelector('#main h1').textContent.trim(), t: [top('#main h1'), top('.cast'), top('#ind-lb'), top('#i-story'), top('#artsBox'), top('#makeBtn'), top('#moreAll')], make: document.querySelector('#makeBtn').textContent.trim(), ind: document.querySelector('#ind-lb').textContent.replace(/\s+/g, ''), name: document.querySelector('label[for="i-name"]').textContent.trim(), story: document.querySelector('label[for="i-story"]').textContent.trim() };
  });
  C.ok(o.h1 === '웹툰 만들기' && o.t.every((n, i) => n > 0 && (i === 0 || n > o.t[i - 1])), `${vk} 1단계 순서: 제목 → 캐릭터 → 어떤 가게예요? → 있었던 일 → 웹툰 테마 → 대본 만들기 → 더 자세히 (${o.t.join(',')})`);
  C.ok(o.make === '대본 만들기' && o.ind === '어떤가게예요?*' && o.story === '있었던 일', `${vk} 이름: "${o.make}" / "${o.ind}" / "${o.story}"`);
  // 2) 메인에서 빠진 것들
  const gone = await page.evaluate(() => ({ cast: !!document.querySelector('#i-cast'), target: !!document.querySelector('#i-target, #i-action'), looks: !!document.querySelector('#i-looks'), prof: !!document.querySelector('.prof, #pf-voice'), who: !!document.querySelector('[data-who]'), lock: !!document.querySelector('[data-lock]'), photo: !!document.querySelector('[data-photo]'), newDev: !!document.querySelector('#newDev'), kindOutside: !!document.querySelector('#main .fform .kindrow'), kindDesc: !!document.querySelector('#kindDesc'), dsc: !!document.querySelector('#artsBox .dsc') }));
  C.ok(!Object.values(gone).some(Boolean), `${vk} 메인에서 빠짐: 조력자·읽는 사람·행동·외모·브랜드 프로필·역할/성별/나이·고정 이미지·사진·새 기기 줄·유형 설명·테마 설명 (${JSON.stringify(gone)})`);
  // 3) 더 자세히 안: 대본 유형·컷 수·비율·분위기·이야기 방식·한 장 구성·디테일
  await page.evaluate(() => { document.querySelector('#moreAll').open = true; });
  C.ok(await page.evaluate(() => ['#kind-lb', '[data-cuts]', '[data-ratio]', '[data-tone]', '[data-mode]', '[data-layout]', '[data-detail]'].every((s) => !!document.querySelector('#moreAll ' + s))), `${vk} "더 자세히 설정하기" 안에 대본 유형·컷 수·비율·분위기·이야기 방식·한 장 구성·디테일`);
  // 4) 캐릭터 칸: 주인공·조연 각각 두 버튼
  C.ok(await page.evaluate(() => document.querySelectorAll('.cast [data-v="pick"]').length === 2 && document.querySelectorAll('.cast [data-v="newslot"]').length === 2 && [...document.querySelectorAll('.cast .slotbar .btn')].map((b) => b.textContent.trim()).join('|') === '새로 만들기|보관함에서 고르기|새로 만들기|보관함에서 고르기'), `${vk} 캐릭터 칸: 주인공·조연 각각 "새로 만들기 / 보관함에서 고르기"(보관함은 뒤쪽)`);
  // 5) 알리고 싶은 것: 평소 숨김, 광고형에서만 ③ 아래에 보임
  const off = async () => page.evaluate(() => { const e = document.querySelector('[data-kfield="offer"]'); return !e.hidden && e.getClientRects().length > 0; });
  const offerBefore = await off();
  await page.evaluate(() => { S.info.kind = 'ad'; save(); applyKind(false); });
  const offerAd = await off();
  C.ok(!offerBefore && offerAd && await page.evaluate(() => { const o = document.querySelector('[data-kfield="offer"]').getBoundingClientRect().top, s = document.querySelector('#i-story').getBoundingClientRect().top, a = document.querySelector('#artsBox').getBoundingClientRect().top; return o > s && o < a; }), `${vk} "이번에 알리고 싶은 것": 공감·일상형에서는 숨김, 광고·홍보형이면 있었던 일 아래에 보임`);
  // 6) 단계 표시
  const st = await page.evaluate(() => ({ t: [...document.querySelectorAll('#steps .st')].map((b) => b.textContent.replace(/\s+/g, '').trim()).join('|'), d: document.querySelectorAll('#steps .d').length, h: Math.round(document.querySelector('#steps').getBoundingClientRect().height) }));
  C.ok(st.t === '1이야기|2대본|3그림' && st.d === 0 && st.h <= 60, `${vk} 단계 표시: 한 줄 "${st.t}" (높이 ${st.h}px)`);
  // 7) 홈 아래: 내 가게 설정 한 줄
  C.ok(await page.evaluate(() => { const b = document.querySelector('#main [data-shop="settings"]'); return !!b && b.textContent.trim() === '내 가게 설정 ›'; }), `${vk} 홈에 "내 가게 설정 ›" 한 줄`);
  C.ok(!errors.length, `${vk} 1단계: 페이지 오류 없음${errors[0] ? ' ← ' + errors[0] : ''}`);
  await page.close();
}

// 내 가게 설정: 브랜드 프로필이 여기로 옮겨졌고 값이 프롬프트에 그대로 쓰임
{
  const { page, errors } = await newPage(browser, srv.base, { viewport: { width: 390, height: 844 }, ls: LS });
  await page.goto(srv.base + '/'); await page.waitForTimeout(400);
  await page.click('#main [data-shop="settings"]'); await page.waitForTimeout(250);
  const s = await page.evaluate(() => { const w = document.getElementById('shopSheet'); return { open: !!w && !w.hidden, title: w && w.querySelector('h2').textContent, ids: ['pf-bio', 'pf-voice', 'pf-banned', 'pf-tags', 'pf-cta', 'pf-loc', 'pf-collab'].every((i) => !!document.getElementById(i)), logo: !!w.querySelector('[data-act="logoUp"]'), ov: document.documentElement.scrollWidth - innerWidth }; });
  C.ok(s.open && s.title === '내 가게 설정' && s.ids && s.logo && s.ov <= 1, '내 가게 설정: 로고·소개·말투·쓰면 안 되는 말·해시태그·예약 안내·위치·함께 태그할 계정이 그대로 있음');
  await page.fill('#pf-voice', '다정한 존댓말'); await page.fill('#pf-banned', '최고, 1등'); await page.waitForTimeout(100);
  C.ok(await page.evaluate(() => S.profile.voice === '다정한 존댓말' && /브랜드 말투\(캡션·내레이션·고정 댓글에 적용\): 다정한 존댓말/.test(infoBlock()) && /절대 쓰지 말 것\(대본·캡션·해시태그 모두\): 최고, 1등/.test(infoBlock())), '내 가게 설정에 적은 말투·금지어가 대본 요청(프롬프트)에 그대로 들어감');
  await page.click('#shopSheet [data-shop="listback"]'); await page.waitForTimeout(150);
  C.ok(await page.evaluate(() => document.querySelector('#shopSheet h2').textContent === '가게' && !!document.querySelector('#shopSheet [data-shop="settings"]')), '가게 목록에서 "내 가게 설정 ›"으로 갈 수 있고 목록으로 돌아올 수 있음');
  C.ok(!errors.length, '내 가게 설정: 페이지 오류 없음');
  await page.close();
}

// 보관함 편집(새로 만들기)의 접힌 "고급" 안에 사진·고정 캐릭터 이미지·고정 문구
{
  const { page, errors } = await newPage(browser, srv.base, { viewport: { width: 1300, height: 900 }, ls: LS });
  await page.goto(srv.base + '/'); await page.waitForTimeout(400);
  await page.click('.cast [data-v="newslot"][data-ref="m0"]'); await page.waitForTimeout(250);
  const a = await page.evaluate(() => { const d = document.getElementById('vAdv'); return { has: !!d, open: d && d.open, photo: !!(d && d.querySelector('[data-photo]')), ref: !!(d && d.querySelector('[data-refup]')), lock: !!(d && d.querySelector('[data-lock]')), sum: d && d.querySelector('summary').textContent.trim() }; });
  C.ok(a.has && !a.open && a.sum === '고급' && a.photo && a.ref && a.lock, '"새로 만들기" 편집 화면: 접힌 "고급" 안에 사진으로 캐릭터 만들기·고정 캐릭터 이미지·고정 문구');
  await page.fill('#v-id', '사장님_A'); await page.fill('#v-role', '사장님'); await page.fill('#v-looks', '짧은 단발'); await page.click('#vaultSheet [data-v="save"]'); await page.waitForTimeout(400);
  C.ok(await page.evaluate(() => linkId(0) === '사장님_A' && S.info.role === '사장님' && S.info.looks === '짧은 단발' && !!document.querySelector('.cast .lk')), '새로 만들어 저장하면 주인공 자리에 바로 연결되고 역할·외모가 작업에 채워짐');
  C.ok(await page.evaluate(() => { openVault({}); const w = document.getElementById('vaultSheet'); const ok = !w.querySelector('#vAdv') && w.querySelector('h2').textContent === '내 캐릭터'; closeVault(); return ok; }), '☰ "내 캐릭터"(목록)에서는 "고급"이 없고 제목이 "내 캐릭터"');
  C.ok(!errors.length, '새로 만들기: 페이지 오류 없음');
  await page.close();
}

// 옛 작업: 직접 입력했던 캐릭터·조력자·읽는 사람은 지워지지 않고 프롬프트에도 그대로 쓰임
{
  const old = { step: 'input', info: { type: '빵집', name: '옛 가게', role: '사장님', gender: '여성', age: '40대', looks: '짧은 단발, 동그란 안경', cast: '단골 할머니(흰 파마머리)', target: '퇴근길 직장인', action: '프로필 링크에서 예약', kind: 'ad', story: '있었던 일' }, toon: null };
  const { page, errors } = await newPage(browser, srv.base, { viewport: { width: 390, height: 844 }, ls: { ...LS, 'instatoonRoom.v4': JSON.stringify(old) } });
  await page.goto(srv.base + '/'); await page.waitForTimeout(500);
  const r = await page.evaluate(() => ({ legacy: (document.querySelector('.cast .lk-legacy') || {}).textContent, oldCast: [...document.querySelectorAll('.cast .lk-legacy')].map((e) => e.textContent).join('|'), info: infoBlock(), kept: S.info.cast === '단골 할머니(흰 파마머리)' && S.info.target === '퇴근길 직장인' && S.info.action === '프로필 링크에서 예약' }));
  C.ok(/이 작업의 캐릭터 · 40대 여성 사장님/.test(r.oldCast) && /옛 조연 메모 · 단골 할머니/.test(r.oldCast), '옛 작업: 직접 입력한 주인공은 "이 작업의 캐릭터" 한 줄, 조력자 메모는 "옛 조연 메모" 한 줄로 보임');
  C.ok(r.kept && /읽었으면 하는 사람\(고객\): 퇴근길 직장인/.test(r.info) && /독자가 할 행동: 프로필 링크에서 예약/.test(r.info) && /외모: 짧은 단발, 동그란 안경/.test(r.info), '옛 작업: 읽는 사람·할 행동·외모 값이 지워지지 않고 대본 요청에 그대로 들어감');
  await page.click('.cast [data-v="saveslot"][data-ref="m0"]'); await page.waitForTimeout(250);
  C.ok(await page.evaluate(() => document.getElementById('v-role').value === '사장님' && document.getElementById('v-looks').value === '짧은 단발, 동그란 안경' && !!document.getElementById('vAdv')), '"수정"을 누르면 보관함 편집 화면에 옛 값이 채워져 열림(고급 포함)');
  await page.click('#vaultSheet button[data-v="close"]');
  await page.click('.cast [data-v="clearcast"]'); await page.waitForTimeout(150);
  C.ok(await page.evaluate(() => S.info.cast === '' && !document.querySelector('.cast [data-v="clearcast"]')), '"옛 조연 메모 지우기"를 누르면 값이 비워짐');
  C.ok(!errors.length, '옛 작업: 페이지 오류 없음');
  await page.close();
}

// ☰ 도움말(사용 방법+문제 해결 합침)
{
  const { page, errors } = await newPage(browser, srv.base, { viewport: { width: 1300, height: 900 }, ls: LS });
  await page.goto(srv.base + '/'); await page.waitForTimeout(400);
  await page.evaluate(() => toggleHelp(true)); await page.waitForTimeout(200);
  C.ok(await page.evaluate(() => { const h = document.getElementById('help'); return h.querySelector('h2').textContent === '도움말' && !!h.querySelector('a[href="/guide/instatoon-troubleshooting/"]') && /막힐 때/.test(h.textContent) && /내 가게 설정/.test(h.textContent) && !/브랜드 프로필/.test(h.textContent) && !/인스타툰 만들기/.test(h.textContent); }), '도움말: 제목 "도움말", 막힐 때 링크, "내 가게 설정" 안내가 들어 있고 옛 이름(브랜드 프로필·인스타툰 만들기)은 없음');
  // 2·3단계: 단계 이름 줄과 회색 설명이 줄어듦
  const t2 = await page.evaluate(() => { S = demoState('bakery'); S.demo = false; S.step = 'edit'; S.mode = 'one'; render(); return { stepno: document.querySelectorAll('.stepno').length, remake: document.querySelector('[data-act="remake"]').textContent.trim(), sub: document.querySelector('#main .ph p').textContent.trim() }; });
  C.ok(t2.stepno === 0 && t2.remake === '다시 만들기' && /^.*\d+컷$/.test(t2.sub), `2단계: 단계 이름 줄 없음, "${t2.remake}", 부제 "${t2.sub}"`);
  const t3 = await page.evaluate(() => { S.step = 'post'; render(); return { stepno: document.querySelectorAll('.stepno').length, h1: document.querySelector('#main h1').textContent.trim() }; });
  C.ok(t3.stepno === 0 && t3.h1 === '그림 그리고 올리기', `3단계: 단계 이름 줄 없음, 제목 "${t3.h1}"`);
  C.ok(!errors.length, '도움말·2·3단계: 페이지 오류 없음');
  await page.close();
}

await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] UI 정리 검사 ${C.fail}건 실패` : '\n[PASS] UI 정리 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
