// 빌드 결과(deploy/) 검증: 로컬 정적 서버로 실제 HTTP 응답을 확인한다. 사용: node site/guide/verify.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { articles } from './build-guide.mjs';
const dep = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'deploy');
const ORIGIN = 'https://www.ai-instatoon.com';
const types = { '.html': 'text/html', '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(dep, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) { if (!p.endsWith('/')) { res.writeHead(308, { Location: p + '/' }); return res.end(); } f = path.join(f, 'index.html'); }
  if (!fs.existsSync(f)) { res.writeHead(404, { 'Content-Type': 'text/html' }); return res.end(fs.readFileSync(path.join(dep, '404.html'))); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(0);
await new Promise((r) => srv.on('listening', r));
const base = `http://localhost:${srv.address().port}`;
const get = async (u) => { const r = await fetch(base + u, { redirect: 'manual' }); return { status: r.status, text: await r.text() }; };
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('[FAIL]', m); } };
const pages = ['/guide/', ...articles.map((a) => `/guide/${a.slug}/`)];
const titles = new Set(), descs = new Set();
const m1 = (h, re) => (h.match(re) || [])[1];
for (const [i, u] of pages.entries()) {
  const { status, text: h } = await get(u);
  ok(status === 200, `${u} HTTP ${status}`);
  const title = m1(h, /<title>(.*?)<\/title>/), desc = m1(h, /<meta name="description" content="(.*?)"/), canon = m1(h, /<link rel="canonical" href="(.*?)"/);
  ok(title && !titles.has(title), `${u} title 없음/중복`); titles.add(title);
  ok(desc && !descs.has(desc), `${u} description 없음/중복`); descs.add(desc);
  ok(canon === ORIGIN + u, `${u} canonical=${canon}`);
  ok(h.includes('content="index,follow"'), `${u} robots`);
  ok((h.match(/<h1[ >]/g) || []).length === 1, `${u} H1 개수`);
  ok(h.includes('property="og:url"') && h.includes('property="og:title"') && h.includes('property="og:description"'), `${u} OG`);
  ok(h.includes('href="/"') && h.includes('href="/guide/"'), `${u} 홈//guide/ 링크`);
  for (const [, j] of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) { try { JSON.parse(j); } catch { ok(false, `${u} JSON-LD 파싱`); } }
  if (i > 0) {
    ok(/<article/.test(h) && (h.match(/<h2/g) || []).length >= 6, `${u} 본문/H2`);
    ok(h.includes('"@type":"Article"') && h.includes('"datePublished"') && h.includes('"dateModified"') && h.includes('"mainEntityOfPage"') && h.includes('"headline"') && h.includes('"@type":"BreadcrumbList"'), `${u} 구조화 데이터`);
    ok((h.match(/class="card"/g) || []).length >= 3, `${u} 관련 글 <3`);
    ok(/rel="prev"|<small>← 인스타툰 노트/.test(h) && /rel="next"|<small>인스타툰 노트 →/.test(h), `${u} 이전/다음`);
    ok(h.includes('class="cta"') && h.includes('인스타툰 만들기'), `${u} CTA`);
    ok((h.replace(/<[^>]+>/g, '').length) > 3000, `${u} 본문 분량 짧음`);
  }
  console.log(`[${status === 200 ? 'PASS' : 'FAIL'}] ${u}  (${title?.length}자 title, ${h.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<[^>]+>/g, '').length}자)`);
}
// 소개/개인정보/이용안내 페이지
for (const u of ['/about/', '/privacy/', '/terms/']) {
  const { status, text: h } = await get(u);
  ok(status === 200, `${u} HTTP ${status}`);
  ok(h.includes(`<link rel="canonical" href="${ORIGIN}${u}">`) && (h.match(/<h1[ >]/g) || []).length === 1, `${u} canonical/H1`);
  ok(h.includes('content="index,follow"') && h.includes('<title>'), `${u} robots/title`);
  ok(h.includes('href="/privacy/"') && h.includes('href="/terms/"') && h.includes('href="/about/"'), `${u} 푸터 링크`);
  console.log(`[PASS] ${u}`);
}
// 허브 → 모든 글 링크
const hub = (await get('/guide/')).text;
for (const a of articles) ok(hub.includes(`href="/guide/${a.slug}/"`), `허브에 ${a.slug} 링크 없음`);
// 인스타툰 노트(게시판) 허브: 이름·카테고리·대표 이미지·최신순, 옛 이름이 화면에 안 남았는지
ok(/<h1>인스타툰 노트<\/h1>/.test(hub), '허브 H1 인스타툰 노트');
ok(hub.includes('<title>인스타툰 노트'), '허브 title 인스타툰 노트');
ok((hub.match(/<nav class="chips"[\s\S]*?<\/nav>/) || [''])[0].split('<a ').length - 1 === 6, '허브 카테고리 칩 6개(전체+5)');
ok((hub.match(/<li class="post/g) || []).length === articles.length, '허브 글 카드 수 = 글 수');
const dts = [...hub.matchAll(/<time datetime="([\d-]+)"/g)].map((m) => m[1]);
ok(dts.every((d, i) => i === 0 || dts[i - 1] >= d), '허브 글 목록 최신순');
// 10개씩 나누기는 화면에서만: HTML에는 글 링크가 전부 있고, 페이지 번호 자리는 hidden(JS가 꺼져 있으면 전체 목록이 보임), canonical은 /guide/ 그대로
const postLinks = [...hub.matchAll(/<li class="post"[^>]*><a href="\/guide\/([a-z0-9-]+)\/"/g)].map((m) => m[1]);
ok(postLinks.length === articles.length && new Set(postLinks).size === articles.length && articles.every((a) => postLinks.includes(a.slug)), `허브 HTML 안에 글 링크 ${articles.length}개가 모두 있음(${postLinks.length}개 발견)`);
ok(!/<li class="post"[^>]* hidden/.test(hub), '허브 HTML에서 글 항목이 숨겨져 있지 않음(숨김은 자바스크립트가 화면에서만)');
ok(/<nav class="pager" id="pager"[^>]* hidden>/.test(hub), '허브 페이지 번호 자리는 기본 hidden');
ok(hub.includes('<link rel="canonical" href="' + ORIGIN + '/guide/">'), '허브 canonical은 /guide/ 그대로(?page= 주소는 canonical로 /guide/를 가리킴)');
ok(articles.some((a) => a.image) || !hub.includes('<img '), '허브 목록에 그림 없음(image 지정 글이 없을 때)');
ok(!/<img /.test((await get('/guide/how-to-make-instatoon/')).text), '글 페이지 상단에 그림 없음(image 지정 글 제외)');
for (const u of ['/', ...pages]) { const t = (await get(u)).text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ''); ok(!t.includes('콘텐츠 가이드'), `${u} 화면에 옛 이름(콘텐츠 가이드) 남음`); }
// 공통 머리말: "메인으로" 버튼 없음, 로고는 첫 화면(/)으로, 검정 "인스타툰 만들기" 버튼 하나
// 공통 머리말: "메인으로" 버튼 없음, 로고는 첫 화면(/)으로, 노트 목록은 검정 "인스타툰 만들기"만, 나머지는 보조 "인스타툰 노트" + 검정 "인스타툰 만들기"
const MAKE = '<a class="hb pri" href="/" data-track="cta" data-loc="header" aria-label="인스타툰 만들기"><span class="hp">인스타툰&nbsp;</span>만들기</a>', NOTE = '<a class="hb" href="/guide/" aria-label="인스타툰 노트"><span class="hp">인스타툰&nbsp;</span>노트</a>';
for (const u of ['/guide/', `/guide/${articles[0].slug}/`, '/about/', '/privacy/', '/terms/']) { const t = (await get(u)).text; ok(!/>메인으로</.test(t), `${u} 머리말에 메인으로 버튼 남음`); ok(t.includes('<a class="brand" href="/"'), `${u} 로고가 첫 화면(/)으로 연결`); ok(t.includes(MAKE), `${u} 검정 인스타툰 만들기 버튼`); ok(u === '/guide/' ? !t.includes(NOTE) : t.includes(NOTE + MAKE), `${u} 머리말 버튼 구성(${u === '/guide/' ? '만들기만' : '노트 → 만들기'})`); }
const nf = fs.readFileSync(path.join(dep, '404.html'), 'utf8'); ok(!/>메인으로</.test(nf) && nf.includes('<a class="brand" href="/"') && nf.includes(NOTE + MAKE), '404 머리말');
// 메인 → /guide/
ok((await get('/')).text.includes('href="/guide/"'), '메인에 /guide/ 링크 없음');
// sitemap
const sm = (await get('/sitemap.xml')).text; const locs = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
for (const u of ['/', ...pages, '/about/', '/privacy/', '/terms/']) ok(locs.includes(ORIGIN + u), `sitemap 누락 ${u}`);
for (const l of locs) ok((await get(l.replace(ORIGIN, ''))).status === 200, `sitemap URL 응답 이상 ${l}`);
console.log(`sitemap: ${locs.length}개 URL`);
// robots
const rb = (await get('/robots.txt')).text; ok(/Allow: \//.test(rb) && !/Disallow: \//.test(rb) && rb.includes(`Sitemap: ${ORIGIN}/sitemap.xml`), 'robots.txt'); console.log(rb);
// 모든 내부 링크
const seen = new Set(); let n = 0;
for (const u of ['/', '/404.html', ...pages, '/about/', '/privacy/', '/terms/']) { const h = u === '/404.html' ? fs.readFileSync(path.join(dep, '404.html'), 'utf8') : (await get(u)).text;
  for (const [, href] of h.matchAll(/<a [^>]*href="(\/[^"#]*)(?:#[^"]*)?"/g)) { if (seen.has(href)) continue; seen.add(href); n++; const r = await get(href); ok(r.status === 200, `깨진 내부 링크 ${href} (${r.status}) in ${u}`); } }
console.log(`내부 링크 ${n}종 검사`);
ok((await get('/guide/없는-글/')).status === 404, '404 응답'); ok((await get('/guide/없는-글/')).text.includes('href="/guide/"'), '404에서 /guide/ 링크');
console.log(fail ? `\n실패 ${fail}건` : '\n전부 PASS'); srv.close(); process.exit(fail ? 1 : 0);
