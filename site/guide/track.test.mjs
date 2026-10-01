// track.js 동작 시험(브라우저 없이 가짜 DOM으로). 사용: node site/guide/track.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'track.js'), 'utf8');
const events = [];
const listeners = {};
let rect = { top: 0, height: 4000 };
const attrs = { 'data-page-type': 'article', 'data-slug': 'demo-post', 'data-category': 'toon' };
const body = { getAttribute: (k) => attrs[k] || null };
const art = { getBoundingClientRect: () => rect };
const win = { innerHeight: 800, gtag: (...a) => events.push(a), addEventListener: (t, f) => { listeners['w:' + t] = f; } };
const doc = { body, querySelector: (s) => (s === 'article' ? art : null), addEventListener: (t, f) => { listeners['d:' + t] = f; } };
vm.runInNewContext(src, { window: win, document: doc, requestAnimationFrame: (f) => f() });

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('[FAIL]', m); } else console.log('[PASS]', m); };
const scrollTo = (y) => { rect = { top: -y, height: 4000 }; listeners['w:scroll'](); };

scrollTo(1000);  // (800+(-1000)... 보이는 비율 = (800-(-1000))/4000 = 45%
ok(!events.some((e) => e[1] === 'article_scroll'), '45%에서는 이벤트 없음');
scrollTo(2300);  // 77.5%
let pcts = events.filter((e) => e[1] === 'article_scroll').map((e) => e[2].percent);
ok(JSON.stringify(pcts) === '[50,75]', `77%에서 50,75 발생(${pcts})`);
scrollTo(2300);
ok(events.filter((e) => e[1] === 'article_scroll').length === 2, '같은 구간 중복 전송 없음');
scrollTo(3400);  // 105% → 100
pcts = events.filter((e) => e[1] === 'article_scroll').map((e) => e[2].percent);
ok(JSON.stringify(pcts) === '[50,75,90]', `끝까지 내리면 90 추가(${pcts})`);
ok(events[0][2].article_slug === 'demo-post' && events[0][2].content_category === 'toon', '글 slug/카테고리 포함');

const click = (track, href, text, extra = {}) => {
  const a = { getAttribute: (k) => ({ 'data-track': track, href, ...extra })[k] || null, textContent: text };
  listeners['d:click']({ target: { closest: () => a } });
};
click('related', '/guide/4-panel-instatoon/', '인스타툰 4컷 구성법', { 'data-pos': '2' });
let e = events.at(-1);
ok(e[1] === 'related_click' && e[2].target_slug === '4-panel-instatoon' && e[2].position === 2, '관련 글 클릭 이벤트');
click('cta', '/', '인스타툰 만들기', { 'data-loc': 'article_bottom' });
e = events.at(-1);
ok(e[1] === 'cta_click' && e[2].location === 'article_bottom', 'CTA 클릭 이벤트');
click('prevnext', '/guide/', '가이드', { 'data-loc': 'next' });
ok(events.at(-1)[1] === 'prevnext_click', '이전/다음 클릭 이벤트');
const before = events.length;
listeners['d:click']({ target: { closest: () => null } });
ok(events.length === before, 'data-track 없는 클릭은 무시');
ok(events.every((x) => !JSON.stringify(x).match(/AIza|key/i)), '이벤트에 키 관련 값 없음');
win.gtag = undefined; // GA 없을 때 에러 없이 무시
scrollTo(0); click('cta', '/', 'x');
ok(true, 'gtag 없을 때 예외 없음');
process.exit(fail ? 1 : 0);
