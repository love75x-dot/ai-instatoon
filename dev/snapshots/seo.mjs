// 검색 노출 보호 검사: 주소 목록(sitemap), canonical, og:url, robots 가 기준(seo-baseline.json)과 같은지 본다.
// 제목·설명·본문·구조화 데이터의 "이름" 변경은 허용(예: 1b단계 '인스타툰 노트')하되 주소 관련 항목은 한 글자도 바뀌면 안 된다.
//   node dev/snapshots/seo.mjs            비교        node dev/snapshots/seo.mjs --update   기준 갱신(주소를 바꿔야 할 때만, 301 리디렉트와 함께)
import fs from 'node:fs';
import path from 'node:path';
import { root, serve } from '../lib/harness.mjs';

const dep = path.join(root, 'deploy'), file = path.join(root, 'dev', 'snapshots', 'seo-baseline.json');
const sm = fs.readFileSync(path.join(dep, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
const robots = fs.readFileSync(path.join(dep, 'robots.txt'), 'utf8');
const srv = await serve();
const pages = {};
for (const loc of locs) {
  const u = new URL(loc).pathname; const r = await fetch(srv.base + u); const h = await r.text();
  const m = (re) => (h.match(re) || [])[1] || null;
  pages[u] = { status: r.status, canonical: m(/<link rel="canonical" href="(.*?)"/), ogUrl: m(/property="og:url" content="(.*?)"/), robots: m(/<meta name="robots" content="(.*?)"/), title: m(/<title>(.*?)<\/title>/) };
}
// 지금 있는 가이드 폴더가 전부 sitemap 에 있는지도 기록
const dirs = fs.readdirSync(path.join(dep, 'guide')).filter((d) => fs.existsSync(path.join(dep, 'guide', d, 'index.html'))).sort();
srv.close();
const now = { sitemapLocs: locs, robotsTxt: robots, guideDirs: dirs, pages };
if (process.argv.includes('--update')) { fs.writeFileSync(file, JSON.stringify(now, null, 2) + '\n'); console.log('기준 갱신:', locs.length + '개 주소'); process.exit(0); }
const base = JSON.parse(fs.readFileSync(file, 'utf8'));
let fail = 0; const bad = (m) => { fail++; console.log('[FAIL]', m); };
if (JSON.stringify(base.sitemapLocs) !== JSON.stringify(locs)) bad('sitemap 주소 목록이 달라졌어요 (추가/삭제/순서)');
if (base.robotsTxt !== robots) bad('robots.txt 가 달라졌어요');
if (JSON.stringify(base.guideDirs) !== JSON.stringify(dirs)) bad('/guide/ 글 폴더 목록이 달라졌어요');
for (const [u, b] of Object.entries(base.pages)) {
  const p = now.pages[u]; if (!p) { bad(`${u} 없음`); continue; }
  for (const k of ['status', 'canonical', 'ogUrl', 'robots']) if (b[k] !== p[k]) bad(`${u} ${k}: ${b[k]} → ${p[k]}`);
}
console.log(fail ? `\n[FAIL] 주소·canonical 검사 ${fail}건 실패` : `[PASS] 주소·sitemap·canonical·robots 동일 (${locs.length}개 주소)`);
process.exit(fail ? 1 : 0);
