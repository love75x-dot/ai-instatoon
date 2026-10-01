// 가이드 정적 페이지 생성: deploy/guide/**, deploy/sitemap.xml, deploy/robots.txt, deploy/404.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ORIGIN, DATE, cfg, url, renderArticle, renderHub, render404 } from './lib.mjs';
import { validate } from './validate.mjs';
import { gaId } from '../analytics.mjs';
import { pages, siteInfo } from './pages.mjs';
import a1 from './articles-1.mjs';
import a2 from './articles-2.mjs';
import a3 from './articles-3.mjs';
import a4 from './articles-4.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
// 새 글은 site/guide/posts/*.mjs 에 파일 하나씩 추가하면 허브·sitemap·이전/다음·같은 카테고리 링크에 자동 반영된다.
const postsDir = path.join(here, 'posts');
const posts = [];
for (const f of fs.existsSync(postsDir) ? fs.readdirSync(postsDir).filter((x) => x.endsWith('.mjs')).sort() : []) {
  const m = (await import(pathToFileURL(path.join(postsDir, f)).href)).default;
  posts.push(...[].concat(m));
}
// 기존 20편은 고정 순서, 새 글은 공개일 순으로 뒤에 붙는다.
posts.sort((x, y) => String(x.published).localeCompare(String(y.published)) || x.slug.localeCompare(y.slug));
export const articles = [...a1, ...a2, ...a3, ...a4, ...posts];
cfg.ga = gaId();
const dep = path.join(here, '..', '..', 'deploy');

// 공개 일정: 5편씩 묶어 2일 간격 (글에 published가 직접 있으면 그것을 우선)
const SCHEDULE = ['2026-09-25', '2026-09-27', '2026-09-29', '2026-10-01'];
articles.forEach((a, i) => { a.published ||= SCHEDULE[Math.floor(i / 5)]; a.modified ||= a.published; });

const { errs, warns } = validate(articles);
warns.forEach((w) => console.warn('경고', w));
if (errs.length) { errs.forEach((e) => console.error('오류', e)); throw new Error(`글 검증 실패 ${errs.length}건`); }

const write = (rel, s) => { const f = path.join(dep, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
fs.rmSync(path.join(dep, 'guide'), { recursive: true, force: true });
write('guide/index.html', renderHub(articles));
articles.forEach((a, i) => write(`guide/${a.slug}/index.html`, renderArticle(a, articles, i)));
for (const pg of pages) write(`${pg.slug}/index.html`, pg.build());
// ads.txt: 실제 게시자 ID(site-info.json)가 있을 때만 생성한다. 없으면 만들지 않는다(가짜 ID 금지).
fs.rmSync(path.join(dep, 'ads.txt'), { force: true });
if (siteInfo.adsensePublisherId) write('ads.txt', `google.com, ${siteInfo.adsensePublisherId}, DIRECT, f08c47fec0942fa0
`);
fs.copyFileSync(path.join(here, 'track.js'), path.join(dep, 'guide-track.js'));
write('404.html', render404());
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
const lastmod = Object.fromEntries(articles.map((a) => [url(a.slug), a.modified || a.published || DATE]));
const newest = articles.map((a) => a.modified || a.published || DATE).sort().pop();
const urls = [ORIGIN + '/', ORIGIN + '/guide/', ...articles.map((a) => url(a.slug)), ...pages.map((pg) => `${ORIGIN}/${pg.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${lastmod[u] || newest}</lastmod></url>`).join('\n')}\n</urlset>\n`);
console.log(`GA4: ${cfg.ga || '미설정(측정 ID 없음 - 스크립트 미삽입)'}`);
console.log(`가이드 생성 완료: 허브 1 + 글 ${articles.length} + sitemap(${urls.length}) + robots + 404`);
