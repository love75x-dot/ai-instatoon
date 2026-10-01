// 가이드 정적 페이지 생성: deploy/guide/**, deploy/sitemap.xml, deploy/robots.txt, deploy/404.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORIGIN, DATE, url, renderArticle, renderHub, render404 } from './lib.mjs';
import a1 from './articles-1.mjs';
import a2 from './articles-2.mjs';
import a3 from './articles-3.mjs';
import a4 from './articles-4.mjs';

export const articles = [...a1, ...a2, ...a3, ...a4];
const here = path.dirname(fileURLToPath(import.meta.url));
const dep = path.join(here, '..', '..', 'deploy');

const slugs = new Set(articles.map((a) => a.slug));
if (articles.length !== 20 || slugs.size !== 20) throw new Error('글은 20개, slug는 중복 없어야 함: ' + articles.length);
for (const a of articles) for (const r of a.related) if (!slugs.has(r) || r === a.slug) throw new Error(`${a.slug}: 잘못된 related ${r}`);

const write = (rel, s) => { const f = path.join(dep, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
fs.rmSync(path.join(dep, 'guide'), { recursive: true, force: true });
write('guide/index.html', renderHub(articles));
articles.forEach((a, i) => write(`guide/${a.slug}/index.html`, renderArticle(a, articles, i)));
write('404.html', render404());
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
const urls = [ORIGIN + '/', ORIGIN + '/guide/', ...articles.map((a) => url(a.slug))];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${DATE}</lastmod></url>`).join('\n')}\n</urlset>\n`);
console.log(`가이드 생성 완료: 허브 1 + 글 ${articles.length} + sitemap(${urls.length}) + robots + 404`);
