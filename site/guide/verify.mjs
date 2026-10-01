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
    ok(/rel="prev"|<small>← 콘텐츠 가이드/.test(h) && /rel="next"|<small>콘텐츠 가이드 →/.test(h), `${u} 이전/다음`);
    ok(h.includes('class="cta"') && h.includes('인스타툰 만들기'), `${u} CTA`);
    ok((h.replace(/<[^>]+>/g, '').length) > 3000, `${u} 본문 분량 짧음`);
  }
  console.log(`[${status === 200 ? 'PASS' : 'FAIL'}] ${u}  (${title?.length}자 title, ${h.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<[^>]+>/g, '').length}자)`);
}
// 허브 → 20개 글 링크
const hub = (await get('/guide/')).text;
for (const a of articles) ok(hub.includes(`href="/guide/${a.slug}/"`), `허브에 ${a.slug} 링크 없음`);
// 메인 → /guide/
ok((await get('/')).text.includes('href="/guide/"'), '메인에 /guide/ 링크 없음');
// sitemap
const sm = (await get('/sitemap.xml')).text; const locs = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
for (const u of ['/', ...pages]) ok(locs.includes(ORIGIN + u), `sitemap 누락 ${u}`);
for (const l of locs) ok((await get(l.replace(ORIGIN, ''))).status === 200, `sitemap URL 응답 이상 ${l}`);
console.log(`sitemap: ${locs.length}개 URL`);
// robots
const rb = (await get('/robots.txt')).text; ok(/Allow: \//.test(rb) && !/Disallow: \//.test(rb) && rb.includes(`Sitemap: ${ORIGIN}/sitemap.xml`), 'robots.txt'); console.log(rb);
// 모든 내부 링크
const seen = new Set(); let n = 0;
for (const u of ['/', '/404.html', ...pages]) { const h = u === '/404.html' ? fs.readFileSync(path.join(dep, '404.html'), 'utf8') : (await get(u)).text;
  for (const [, href] of h.matchAll(/<a [^>]*href="(\/[^"#]*)(?:#[^"]*)?"/g)) { if (seen.has(href)) continue; seen.add(href); n++; const r = await get(href); ok(r.status === 200, `깨진 내부 링크 ${href} (${r.status}) in ${u}`); } }
console.log(`내부 링크 ${n}종 검사`);
ok((await get('/guide/없는-글/')).status === 404, '404 응답'); ok((await get('/guide/없는-글/')).text.includes('href="/guide/"'), '404에서 /guide/ 링크');
console.log(fail ? `\n실패 ${fail}건` : '\n전부 PASS'); srv.close(); process.exit(fail ? 1 : 0);
