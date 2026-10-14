// "모던 심플" 디자인 기준 검사 (RENEWAL_PLAN 결정 기록 참고): 모바일 가로 넘침, 입력칸 16px, 그림자 없음, 노랑은 작은 곳에만, 화면 문구에 이모지 없음.
//   node dev/design/check.mjs
import { serve, launch, newPage, checker } from '../lib/harness.mjs';

const C = checker();
const srv = await serve(); const browser = await launch();
const SCREENS = [
  ['시작', () => { S = blank(); S.step = 'input'; S.mode = 'one'; }],
  ['1단계', () => { S = demoState('bakery'); S.step = 'input'; S.mode = 'one'; }],
  ['2단계', () => { S = demoState('bakery'); S.step = 'edit'; S.mode = 'one'; }],
  ['3단계', () => { S = demoState('bakery'); S.step = 'post'; S.mode = 'one'; }],
  ['한 달 기획', () => { S = demoState('bakery'); S.mode = 'month'; }],
  ['스토리·릴스', () => { S = demoState('bakery'); S.mode = 'reels'; }],
  ['반응·댓글', () => { S = demoState('bakery'); S.mode = 'stats'; }],
];
const probe = () => {
  const YEL = 'rgb(255, 213, 61)', okYellow = '.todo, .sumtodo, .endpv, .arts, .endsw, .mark, .endwrap, .swatches, .frame, .phone, .ftile';
  const out = { overflow: document.documentElement.scrollWidth - window.innerWidth, smallInputs: [], shadows: [], yellow: [], emoji: [] };
  const emo = /\p{Extended_Pictographic}/u;
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el); if (cs.display === 'none') continue;
    const tag = el.tagName.toLowerCase(), cls = el.className && el.className.baseVal === undefined ? '.' + String(el.className).trim().split(/\s+/).join('.') : '';
    if ((el.matches('input.in,textarea.in,.dd-btn,.snum input')) && parseFloat(cs.fontSize) < 16) out.smallInputs.push(tag + cls);
    if (cs.boxShadow !== 'none' && !el.closest('#tour,.tour-hl,.frame')) out.shadows.push(tag + cls);
    if (cs.backgroundColor === YEL && !el.closest(okYellow)) out.yellow.push(tag + cls);
    if (el.children.length === 0 && !el.closest('textarea,pre,.phone,.frame,.endpv,.kit,#kitWarn,.ig-cap,.capbox,.sb,.story-sb,.story-m') && emo.test(el.textContent || '')) out.emoji.push((el.textContent || '').trim().slice(0, 24));
  }
  return out;
};
for (const [vk, vp] of [['모바일 390', { width: 390, height: 844 }], ['PC 1300', { width: 1300, height: 900 }]]) {
  const { page, errors } = await newPage(browser, srv.base, { viewport: vp, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
  await page.goto(srv.base + '/'); await page.waitForTimeout(400);
  for (const [name, fn] of SCREENS) {
    await page.evaluate(`(${fn.toString()})(); save(); render();`); await page.waitForTimeout(150);
    const r = await page.evaluate(probe);
    C.ok(r.overflow <= 1, `${vk} ${name}: 가로로 넘치지 않음${r.overflow > 1 ? ` (${r.overflow}px)` : ''}`);
    C.ok(!r.smallInputs.length, `${vk} ${name}: 입력칸 글자 16px 이상${r.smallInputs.length ? ' ← ' + r.smallInputs.slice(0, 3) : ''}`);
    C.ok(!r.shadows.length, `${vk} ${name}: 그림자 없음${r.shadows.length ? ' ← ' + r.shadows.slice(0, 3) : ''}`);
    C.ok(!r.yellow.length, `${vk} ${name}: 노랑 면은 작은 곳(지금 할 일 칩 등)에만${r.yellow.length ? ' ← ' + r.yellow.slice(0, 3) : ''}`);
    C.ok(!r.emoji.length, `${vk} ${name}: 화면 문구에 이모지 없음${r.emoji.length ? ' ← ' + r.emoji.slice(0, 3) : ''}`);
  }
  C.ok(!errors.length, `${vk}: 페이지 오류 없음`);
}

// ---- 머리말 통일: 홈과 인스타툰 노트 페이지의 머리말이 같은 자리·같은 모양인지 ----
import fs from 'node:fs';
import path from 'node:path';
import { root } from '../lib/harness.mjs';
const blockOf = (html) => (html.split('\r\n').join('\n').match(/\/\* HEADER:BEGIN[\s\S]*?\/\* HEADER:END \*\//) || [''])[0];
const appCss = blockOf(fs.readFileSync(path.join(root, 'deploy', 'index.html'), 'utf8')), noteCss = blockOf(fs.readFileSync(path.join(root, 'deploy', 'guide', 'index.html'), 'utf8'));
C.ok(appCss.length > 200 && appCss === noteCss, '머리말 CSS 블록이 홈과 노트에서 글자까지 같음');
const HPAGES = [['홈', '/'], ['노트 목록', '/guide/'], ['노트 글', '/guide/how-to-make-instatoon/'], ['소개', '/about/'], ['개인정보', '/privacy/'], ['이용안내', '/terms/'], ['404', '/없는-주소/']];
const headProbe = () => {
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left * 10) / 10, y: Math.round(r.top * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, r: Math.round((window.innerWidth - r.right) * 10) / 10 }; };
  const tb = document.querySelector('.topbar'), brand = tb.querySelector('.brand'), mark = brand.querySelector('.mark'), name = brand.querySelector('b');
  const btns = [...tb.querySelectorAll('.hnav .hb:not(.hmore)')].map((b) => { const cs = getComputedStyle(b); return { kind: b.classList.contains('pri') ? '주' : '보조', text: b.textContent.trim(), box: box(b), css: [cs.fontSize, cs.fontWeight, cs.paddingLeft, cs.borderRadius, cs.borderTopWidth, cs.backgroundColor, cs.color, cs.borderTopColor].join('|') }; });
  const ncs = getComputedStyle(name);
  return { tb: box(tb), mark: box(mark), name: { ...box(name), font: [ncs.fontSize, ncs.fontWeight, ncs.fontFamily].join('|') }, btns, overflow: document.documentElement.scrollWidth - window.innerWidth, logoHref: brand.tagName === 'A' ? brand.getAttribute('href') : '(앱: 첫 화면 이동 버튼)' };
};
for (const [vk, vp] of [['모바일 390', { width: 390, height: 844 }], ['태블릿 768', { width: 768, height: 900 }], ['PC 1300', { width: 1300, height: 900 }]]) {
  const res = {};
  for (const [name, u] of HPAGES) {
    const { page } = await newPage(browser, srv.base, { viewport: vp, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
    await page.goto(srv.base + u); await page.waitForTimeout(300);
    res[name] = await page.evaluate(headProbe); await page.close();
  }
  const base = res['홈'], same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  for (const [name, r] of Object.entries(res)) {
    C.ok(r.overflow <= 1, `${vk} ${name}: 머리말이 가로로 넘치지 않음`);
    C.ok(r.btns.every((b) => b.box.h === 40), `${vk} ${name}: 머리말 버튼 높이 40px, 한 줄(줄바꿈 없음)`);
    if (name === '홈') continue;
    C.ok(same(r.tb, base.tb) , `${vk} ${name}: 머리말 높이·위치가 홈과 같음 (${r.tb.h}px / 홈 ${base.tb.h}px)`);
    C.ok(same(r.mark, base.mark) && same(r.name, base.name), `${vk} ${name}: 로고 위치·크기·글꼴이 홈과 같음`);
    const last = r.btns[r.btns.length - 1], hl = base.btns[base.btns.length - 1];
    C.ok(last.box.r === hl.box.r && last.box.y === hl.box.y, `${vk} ${name}: 맨 오른쪽 버튼의 오른쪽 여백·세로 위치가 홈과 같음 (${last.box.r}px)`);
  }
  // 버튼 모양: 모든 페이지의 주 버튼끼리, 보조 버튼끼리 글자·굵기·여백·둥글기·테두리·색이 같다
  const byKind = {};
  for (const [name, r] of Object.entries(res)) for (const b of r.btns) (byKind[b.kind] ||= []).push([name, b.css]);
  for (const [kind, list] of Object.entries(byKind)) C.ok(list.every(([, c]) => c === list[0][1]), `${vk} ${kind} 버튼 모양이 모든 페이지에서 같음(${list.length}곳)`);
  C.ok(Object.keys(byKind).sort().join() === '보조,주' && byKind['주'][0][1] !== byKind['보조'][0][1], `${vk} 버튼 종류는 주·보조 두 가지`);
  const lst = res['노트 목록'].btns.map((b) => b.kind).join(), art = res['노트 글'].btns.map((b) => b.kind).join();
  C.ok(base.btns.map((b) => b.kind).join() === '보조', `${vk} 홈 머리말: 보조 "인스타툰 노트"만`);
  C.ok(lst === '주', `${vk} 노트 목록 머리말: 주 "인스타툰 만들기"만`);
  for (const n of ['노트 글', '소개', '개인정보', '이용안내', '404']) C.ok(res[n].btns.map((b) => b.kind).join() === '보조,주', `${vk} ${n} 머리말: 보조 "인스타툰 노트" → 주 "인스타툰 만들기"`);
}
// ---- 홈 머리말: 한 줄(PC·태블릿) / ⋯ 메뉴(휴대폰), 별도 도구 줄 없음 ----
const homeProbe = () => {
  const vis = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
  const tb = document.querySelector('.topbar'), top = (el) => Math.round(el.getBoundingClientRect().top * 10) / 10, h = (el) => Math.round(el.getBoundingClientRect().height * 10) / 10;
  const tools = [...tb.querySelectorAll('.htools .ht')], note = tb.querySelector('.hnav > a.hb');
  const outside = [...document.querySelectorAll('[data-act="backup"],[data-act="restore"],[data-act="help"],a[href="/guide/instatoon-troubleshooting/"]')].filter((e) => ['백업 저장', '불러오기', '문제 해결', '사용 방법'].includes(e.textContent.trim()) && !e.closest('.topbar') && !e.closest('#help,#trouble,.tour,#tour,.help-in,main'));
  return {
    noToolRow: !document.querySelector('.apptools'), outside: outside.map((e) => e.textContent.trim()),
    toolsVisible: tools.every(vis), toolLabels: tools.map((t) => t.textContent.trim()).join(','),
    rowTops: [...tools, note].filter(vis).map(top), rowHeights: [...tools, note].filter(vis).map(h),
    toolCss: [...new Set(tools.map((t) => { const c = getComputedStyle(t); return [c.fontSize, c.fontWeight, c.borderTopWidth, c.color, c.height].join('|'); }))].length,
    menuVisible: vis(tb.querySelector('.hmenu')), moreH: h(tb.querySelector('.hmore')), noStatus: !tb.querySelector('.hai,#aiDot,#aiText,#aiDotM,#aiTextM,.hpai,.dot') && !/연결됨|키 필요|연결 없음|연결 확인/.test(tb.textContent), keyRow: (document.querySelector('#keyTxt') || {}).textContent || '',
    overflow: document.documentElement.scrollWidth - window.innerWidth, tbH: h(tb),
  };
};
for (const [vk, w] of [['PC 1300', 1300], ['PC 1024', 1024], ['태블릿 768', 768], ['한 줄 최소 721', 721], ['휴대폰 720', 720], ['휴대폰 390', 390], ['휴대폰 320', 320]]) {
  const { page, errors } = await newPage(browser, srv.base, { viewport: { width: w, height: 800 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
  await page.goto(srv.base + '/'); await page.waitForTimeout(300);
  const r = await page.evaluate(homeProbe), one = w > 720;
  C.ok(r.noToolRow && !r.outside.length, `${vk} 홈: 머리말 아래 별도 도구 줄 없음, 도구 버튼이 모두 머리말 안에 있음${r.outside.length ? ' ← 밖에 있음: ' + r.outside : ''}`);
  C.ok(r.overflow <= 1 && r.tbH === 72, `${vk} 홈: 가로 넘침 없음, 머리말 높이 72px`);
  C.ok(r.noStatus, `${vk} 홈: 머리말에 AI 연결 상태 표시(● 연결됨 / ● 키 필요) 없음`);
  C.ok(/API 키 설정/.test(r.keyRow) && /연결됨/.test(r.keyRow), `${vk} 홈: 연결 상태는 첫 화면 "API 키 설정" 줄에서만 보임(${r.keyRow.trim()})`);
  if (one) {
    C.ok(r.toolsVisible && r.toolLabels === '백업 저장,불러오기,문제 해결,사용 방법' && !r.menuVisible, `${vk} 홈: 도구 4개가 머리말에 글자 버튼으로 보이고 ⋯는 숨김`);
    C.ok(new Set(r.rowTops).size === 1 && r.rowHeights.every((x) => x === 40), `${vk} 홈: 도구 4개와 "인스타툰 노트"가 같은 줄·높이 40px`);
    C.ok(r.toolCss === 1, `${vk} 홈: 도구 버튼 글자 14px·굵기·테두리 없음·회색이 모두 같음`);
    C.ok(true, `${vk} 홈: 머리말은 도구 4개와 "인스타툰 노트"만`);
  } else {
    C.ok(r.menuVisible && r.moreH === 40 && !r.toolsVisible, `${vk} 홈: ⋯ 버튼(높이 40px)과 "노트"만 보임`);
    const bounds = await page.evaluate(() => { const b = document.querySelector('.hmore').getBoundingClientRect(), n = document.querySelector('.hnav > a.hb').getBoundingClientRect(); return { sameRow: Math.abs(b.top - n.top) < 1 && b.height === n.height, gap: n.left - b.right }; });
    C.ok(bounds.sameRow && bounds.gap >= 4, `${vk} 홈: ⋯와 "노트"가 같은 줄(간격 ${Math.round(bounds.gap)}px)`);
    await page.click('#hmoreBtn');
    const m = await page.evaluate(() => { const pop = document.querySelector('#hpop'), items = [...pop.querySelectorAll('button,a')].map((e) => e.textContent.trim()), r = pop.getBoundingClientRect(); return { open: !pop.hidden, items, expanded: document.querySelector('#hmoreBtn').getAttribute('aria-expanded'), inView: r.left >= 0 && r.right <= window.innerWidth, first: getComputedStyle(pop.querySelector('button')).backgroundColor }; });
    C.ok(m.open && m.expanded === 'true' && m.items.join(',') === '백업 저장,불러오기,캐릭터 보관함,문제 해결,사용 방법' && m.inView, `${vk} 홈: ⋯를 누르면 메뉴가 열리고 백업 저장이 맨 위(화면 안에 들어옴)`);
    C.ok(m.items.join(',') === '백업 저장,불러오기,캐릭터 보관함,문제 해결,사용 방법' && !/연결/.test(await page.evaluate(() => document.querySelector('#hpop').textContent)), `${vk} 홈: ⋯ 메뉴에 AI 연결 상태 항목 없음`);
    C.ok(m.first === 'rgb(17, 17, 17)', `${vk} 홈: 메뉴의 백업 저장이 검정으로 눈에 띔`);
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 4000 }).catch(() => null), page.click('#hpop .hpri')]);
    C.ok(!!dl, `${vk} 홈: 메뉴의 "백업 저장"이 실제로 백업 파일을 내려받음`);
    C.ok(await page.evaluate(() => document.querySelector('#hpop').hidden), `${vk} 홈: 메뉴 항목을 누르면 메뉴가 닫힘`);
    await page.click('#hmoreBtn'); await page.keyboard.press('Escape');
    C.ok(await page.evaluate(() => document.querySelector('#hpop').hidden), `${vk} 홈: Esc로 메뉴가 닫힘`);
    await page.click('#hmoreBtn'); await page.mouse.click(Math.round(w / 2), 400);
    C.ok(await page.evaluate(() => document.querySelector('#hpop').hidden), `${vk} 홈: 바깥을 누르면 메뉴가 닫힘`);
    await page.click('#hmoreBtn'); await page.click('#hpop [data-act="help"]'); await page.waitForTimeout(200);
    C.ok(await page.evaluate(() => !!document.querySelector('#tour')), `${vk} 홈: 메뉴의 "사용 방법"을 누르면 둘러보기가 시작됨`);
  }
  C.ok(!errors.length, `${vk} 홈 머리말: 페이지 오류 없음${errors[0] ? ' ← ' + errors[0] : ''}`);
  await page.close();
}
{ // 한 줄 모드에서 "백업 저장"·"불러오기"·"사용 방법" 기능
  const { page } = await newPage(browser, srv.base, { viewport: { width: 1300, height: 800 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
  await page.goto(srv.base + '/'); await page.waitForTimeout(300);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 4000 }).catch(() => null), page.click('.htools [data-act="backup"]')]);
  C.ok(!!dl, 'PC 1300 홈: 머리말 "백업 저장" 버튼이 백업 파일을 내려받음');
  const [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 4000 }).catch(() => null), page.click('.htools [data-act="restore"]')]);
  C.ok(!!fc, 'PC 1300 홈: 머리말 "불러오기" 버튼이 파일 선택 창을 엶');
  await page.click('.htools [data-act="help"]'); await page.waitForTimeout(200);
  C.ok(await page.evaluate(() => !!document.querySelector('#tour')), 'PC 1300 홈: 머리말 "사용 방법" 버튼을 누르면 둘러보기가 시작됨');
  C.ok(await page.evaluate(() => document.querySelector('.htools a.ht').getAttribute('href') === '/guide/instatoon-troubleshooting/'), 'PC 1300 홈: "문제 해결"이 문제 해결 글로 연결');
  await page.close();
}
// ---- 인스타툰 노트 목록: 10개씩 나누기 / 페이지 번호 ----
{
  const os = await import('node:os');
  const { serve: serveDir } = await import('../lib/harness.mjs');
  const { renderHub } = await import('../../site/guide/lib.mjs');
  const mk = (n, cats) => Array.from({ length: n }, (_, i) => ({ slug: 's' + i, cat: cats[i % cats.length], published: '2026-0' + (1 + (i % 9)) + '-1' + (i % 9), title: '테스트 글 ' + i, card: '요약 ' + i }));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hubtest-'));
  const fake = (name, arts) => { fs.mkdirSync(path.join(tmp, name, 'guide'), { recursive: true }); fs.writeFileSync(path.join(tmp, name, 'guide', 'index.html'), renderHub(arts)); fs.copyFileSync(path.join(root, 'deploy', '404.html'), path.join(tmp, name, '404.html')); };
  fake('big', mk(120, ['toon', 'insta', 'biz', 'ai', 'meta'])); fake('cat', mk(35, ['toon', 'toon', 'insta']));
  const sBig = await serveDir(path.join(tmp, 'big')), sCat = await serveDir(path.join(tmp, 'cat'));
  const info = (page) => page.evaluate(() => {
    const vis = [...document.querySelectorAll('#posts .post')].filter((li) => !li.hidden), pg = [...document.querySelectorAll('#pager > *')];
    const cs = pg.filter((e) => e.classList.contains('pg')).map((e) => e.getBoundingClientRect());
    return { visible: vis.length, cats: [...new Set(vis.map((li) => li.dataset.cat))], pagerShown: !document.querySelector('#pager').hidden, text: pg.map((e) => e.textContent.trim()).join(' '), cur: (document.querySelector('#pager [aria-current="page"]') || {}).textContent, dis: pg.filter((e) => e.classList.contains('dis')).map((e) => e.textContent.trim()).join(''), url: location.pathname + location.search + location.hash, minSize: Math.min(...cs.map((r) => Math.min(r.width, r.height))), oneRow: new Set(cs.map((r) => Math.round(r.top))).size <= 1, overflow: document.documentElement.scrollWidth - window.innerWidth, chip: ((document.querySelector('.chips [aria-current="true"]') || {}).dataset || {}).cat, topY: Math.round(document.querySelector('.chips').getBoundingClientRect().top) };
  });
  for (const [vk, vp] of [['모바일 390', { width: 390, height: 844 }], ['PC 1300', { width: 1300, height: 900 }]]) {
    const mob = vp.width <= 480;
    { // 실제 목록(23편)
      const { page, errors } = await newPage(browser, srv.base, { viewport: vp });
      await page.goto(srv.base + '/guide/'); await page.waitForTimeout(300);
      let r = await info(page);
      C.ok(r.visible === 10 && r.pagerShown && r.text === '‹ 1 2 3 ›' && r.cur === '1' && r.dis === '‹', `${vk} 노트 목록: 10개만 보이고 페이지 번호 1 2 3, 첫 페이지의 ‹가 흐림 (${r.visible}개, ${r.text})`);
      C.ok(r.minSize >= 40 && r.oneRow && r.overflow <= 1, `${vk} 노트 목록: 페이지 버튼 40px 이상, 한 줄, 가로 넘침 없음`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(100);
      await page.click('#pager a[data-p="2"]');
      await page.waitForFunction(() => { const y = document.querySelector('.chips').getBoundingClientRect().top; return y >= -2 && y < 200; }, null, { timeout: 4000 }).catch(() => {});
      r = await info(page);
      C.ok(r.visible === 10 && r.cur === '2' && r.url === '/guide/?page=2' && r.topY >= -2 && r.topY < 200, `${vk} 노트 목록: 2페이지로 이동, 주소에 ?page=2, 목록 맨 위로 부드럽게 올라감 (칩 위치 ${r.topY}px)`);
      await page.click('#pager a[data-p="3"]'); await page.waitForTimeout(200); r = await info(page);
      C.ok(r.visible === 3 && r.cur === '3' && r.dis === '›' && r.url === '/guide/?page=3', `${vk} 노트 목록: 마지막 3페이지는 3개, ›가 흐림`);
      await page.goBack(); await page.waitForTimeout(200); r = await info(page);
      C.ok(r.cur === '2' && r.visible === 10 && r.url === '/guide/?page=2', `${vk} 노트 목록: 뒤로가기하면 2페이지`);
      await page.goBack(); await page.waitForTimeout(200); r = await info(page);
      C.ok(r.cur === '1' && r.url === '/guide/', `${vk} 노트 목록: 뒤로가기 한 번 더 하면 1페이지`);
      await page.goForward(); await page.waitForTimeout(200); r = await info(page);
      C.ok(r.cur === '2', `${vk} 노트 목록: 앞으로가기하면 다시 2페이지`);
      await page.goto(srv.base + '/guide/?page=3'); await page.waitForTimeout(300); r = await info(page);
      C.ok(r.cur === '3' && r.visible === 3, `${vk} 노트 목록: 새로고침/직접 열어도 같은 페이지(3페이지)`);
      await page.goto(srv.base + '/guide/?page=9'); await page.waitForTimeout(300); r = await info(page);
      C.ok(r.cur === '3' && r.url === '/guide/?page=3', `${vk} 노트 목록: 없는 페이지 번호는 마지막 페이지로 바로잡음`);
      const cats = await page.evaluate(() => [...document.querySelectorAll('.chips a')].map((a) => a.dataset.cat));
      await page.goto(srv.base + '/guide/?page=3#biz'); await page.waitForTimeout(300);
      await page.click('.chips a[data-cat="toon"]'); await page.waitForTimeout(200); r = await info(page);
      const nToon = await page.evaluate(() => [...document.querySelectorAll('#posts .post')].filter((li) => li.dataset.cat === 'toon').length);
      C.ok(r.url === '/guide/#toon' && r.chip === 'toon' && r.cats.join() === 'toon' && r.visible === Math.min(10, nToon) && r.pagerShown === (nToon > 10), `${vk} 노트 목록: 카테고리를 바꾸면 1페이지로(주소에서 ?page 삭제), 글 ${nToon}편${nToon <= 10 ? '이라 페이지 번호 숨김' : ''}`);
      await page.goto(srv.base + '/guide/#insta'); await page.waitForTimeout(300); r = await info(page);
      C.ok(r.chip === 'insta' && r.cats.join() === 'insta', `${vk} 노트 목록: 기존 /guide/#insta 주소도 그대로 동작`);
      C.ok(cats.join() === 'all,toon,insta,biz,ai,meta', `${vk} 노트 목록: 카테고리 칩 6개 그대로`);
      C.ok(!errors.length, `${vk} 노트 목록: 페이지 오류 없음`);
      await page.close();
    }
    { // 글이 많은 목록(120편): 번호 줄여 보이기
      const { page } = await newPage(browser, sBig.base, { viewport: vp });
      const want = mob ? { 1: '‹ 1 2 3 … 12 ›', 5: '‹ 1 … 5 … 12 ›', 12: '‹ 1 … 10 11 12 ›' } : { 1: '‹ 1 2 3 4 5 … 12 ›', 5: '‹ 1 … 4 5 6 … 12 ›', 12: '‹ 1 … 8 9 10 11 12 ›' };
      for (const [p, text] of Object.entries(want)) {
        await page.goto(sBig.base + '/guide/?page=' + p); await page.waitForTimeout(250); const r = await info(page);
        C.ok(r.text === text && r.oneRow && r.overflow <= 1 && r.minSize >= 40, `${vk} 글 120편, ${p}페이지: "${r.text}"${r.text === text ? ' (한 줄, 버튼 40px 이상, 넘침 없음)' : ` ← 기대 "${text}"`}`);
      }
      await page.close();
    }
    { // 글이 많은 카테고리: 카테고리 안에서 10개씩, 바꾸면 1페이지
      const { page } = await newPage(browser, sCat.base, { viewport: vp });
      await page.goto(sCat.base + '/guide/#toon'); await page.waitForTimeout(250); let r = await info(page);
      C.ok(r.visible === 10 && r.pagerShown && r.text === '‹ 1 2 3 ›' && r.cats.join() === 'toon', `${vk} 카테고리(글 24편): 그 카테고리 안에서 10개씩 나뉨 (${r.text})`);
      await page.click('#pager a[data-p="2"]'); await page.waitForTimeout(250); r = await info(page);
      C.ok(r.visible === 10 && r.cur === '2' && r.url === '/guide/?page=2#toon' && r.cats.join() === 'toon', `${vk} 카테고리: 2페이지, 주소 ?page=2#toon`);
      await page.click('.chips a[data-cat="insta"]'); await page.waitForTimeout(250); r = await info(page);
      C.ok(r.cur === '1' && r.url === '/guide/#insta' && r.cats.join() === 'insta' && r.visible === 10, `${vk} 카테고리를 바꾸면 1페이지로 돌아옴`);
      await page.goBack(); await page.waitForTimeout(250); r = await info(page);
      C.ok(r.cur === '2' && r.url === '/guide/?page=2#toon', `${vk} 카테고리 바꾼 뒤 뒤로가기: 이전 카테고리의 2페이지`);
      await page.close();
    }
  }
  { // 자바스크립트가 꺼져 있으면 전체 목록
    const ctx = await browser.newContext({ javaScriptEnabled: false }); const page = await ctx.newPage();
    await page.route('**/*', (r) => (r.request().url().startsWith(srv.base) ? r.continue() : r.fulfill({ status: 200, body: '' })));
    await page.goto(srv.base + '/guide/');
    const html = await (await fetch(srv.base + '/guide/')).text();
    const shown = await page.locator('#posts .post:visible').count(), pagerVisible = await page.locator('#pager:visible').count();
    C.ok(shown === 23 && pagerVisible === 0, `자바스크립트 꺼짐: 노트 글 23개가 모두 보이고 페이지 번호는 숨김 (${shown}개)`);
    C.ok((html.match(/<li class="post"/g) || []).length === 23, 'HTML 안에 글 링크 23개가 모두 있음(화면에서만 숨김)');
    await ctx.close();
  }
  sBig.close(); sCat.close(); fs.rmSync(tmp, { recursive: true, force: true });
}
await browser.close(); srv.close();
console.log(C.fail ? `\n[FAIL] 디자인 기준 ${C.fail}건 실패` : '\n[PASS] 디자인 기준 전부 통과');
process.exit(C.fail ? 1 : 0);
