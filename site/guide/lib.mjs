// 가이드 콘텐츠 작성용 헬퍼 + 페이지 렌더러. 콘텐츠는 articles-*.mjs, 실행은 build-guide.mjs.
export const ORIGIN = 'https://www.ai-instatoon.com';
export const SITE = '인스타툰 연재실';
export const cfg = { ga: '' }; // build-guide.mjs가 설정 (GA4 측정 ID, 없으면 빈 문자열)
export const DATE = '2026-10-01'; // 글에 published/modified가 없을 때의 기본값 (글별로 articles-*.mjs에서 지정)

import { gaSnippet } from '../analytics.mjs';

export const CATS = {
  toon: { name: '인스타툰 가이드', desc: '인스타툰의 개념, 구성, 스토리 만드는 법' },
  insta: { name: 'Instagram 콘텐츠', desc: '게시물 구성, 캡션, 릴스와 피드의 차이' },
  biz: { name: '소상공인 SNS 마케팅', desc: '업종별 콘텐츠 아이디어와 운영 순서' },
  ai: { name: 'AI 콘텐츠 제작', desc: 'AI로 만들 때 일관성, 검토, 저작권' },
  meta: { name: 'Instagram · Facebook', desc: '두 채널과 Meta Business Suite 기초' },
};

// ---- 블록 빌더 ----
export const h3 = (t) => ({ t: 'h3', v: t });
export const p = (t) => ({ t: 'p', v: t });
export const ul = (...a) => ({ t: 'ul', v: a });
export const ol = (...a) => ({ t: 'ol', v: a });
export const check = (...a) => ({ t: 'check', v: a });
export const tip = (t) => ({ t: 'tip', v: t });
export const warn = (t) => ({ t: 'warn', v: t });
export const ex = (title, ...lines) => ({ t: 'ex', title, v: lines });
export const table = (head, ...rows) => ({ t: 'table', head, rows });
export const sec = (h, ...blocks) => ({ h, blocks });

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// 본문 인라인: **굵게**, [[slug|텍스트]] 내부 링크
export const inline = (s) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\[\[(\/[a-z0-9/-]*)\|(.+?)\]\]/g, (_, href, t) => `<a href="${href}">${t}</a>`)
  .replace(/\[\[([a-z0-9-]+)\|(.+?)\]\]/g, (_, slug, t) => `<a href="/guide/${slug}/">${t}</a>`);

export const url = (slug) => `${ORIGIN}/guide/${slug}/`;

function block(b) {
  switch (b.t) {
    case 'h3': return `<h3>${inline(b.v)}</h3>`;
    case 'p': return `<p>${inline(b.v)}</p>`;
    case 'ul': return `<ul>${b.v.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`;
    case 'ol': return `<ol>${b.v.map((x) => `<li>${inline(x)}</li>`).join('')}</ol>`;
    case 'check': return `<ul class="chk">${b.v.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`;
    case 'tip': return `<aside class="callout tip"><b>실전 팁</b><p>${inline(b.v)}</p></aside>`;
    case 'warn': return `<aside class="callout warn"><b>주의</b><p>${inline(b.v)}</p></aside>`;
    case 'ex': return `<div class="example"><b>예시 · ${inline(b.title)}</b>${b.v.map((l) => `<p>${inline(l)}</p>`).join('')}</div>`;
    case 'table': return `<div class="tbl"><table><thead><tr>${b.head.map((x) => `<th scope="col">${inline(x)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((x) => `<td>${inline(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    default: throw new Error('unknown block ' + b.t);
  }
}

const CSS = `
:root{--bg:#F4F4F2;--surface:#fff;--sunken:#F0F0EE;--ink:#121214;--ink-2:#3A3A3F;--muted:#6B6B72;--line:#E3E3E0;--line-2:#CFCFCB;--accent:#FFD53D;--accent-ink:#121214;--accent-soft:#FFF6CF;--warn:#9A5B00;--warn-bg:#FFF1D2;--ok:#17804A;--ok-bg:#E3F4EA;--sans:"Gothic A1","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;--r:14px}
@media (prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#0E0E10;--surface:#18181B;--sunken:#1F1F23;--ink:#F2F2F3;--ink-2:#CFCFD4;--muted:#A0A0A8;--line:#2A2A2F;--line-2:#3A3A40;--accent-soft:#3A3212;--warn:#F2B75A;--warn-bg:#35280F;--ok:#5CCB8C;--ok-bg:#15301F}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.8;-webkit-font-smoothing:antialiased;overflow-wrap:anywhere;word-break:keep-all}
a{color:inherit}
:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.skip{position:absolute;left:-999px}.skip:focus{left:8px;top:8px;background:var(--surface);padding:8px 12px;z-index:9}
.wrap{max-width:1100px;margin:0 auto;padding-inline:16px}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-block:16px}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none}
.mark{width:28px;height:28px;display:grid;grid-template-columns:1fr 1fr;gap:3px}
.mark i{background:var(--ink);border-radius:3px}.mark i:nth-child(2){background:var(--accent)}
.brand b{font-weight:900;font-size:19px;letter-spacing:-.02em;white-space:nowrap}
.nav{display:flex;flex-wrap:wrap;gap:8px}
.btn{border:1px solid var(--line-2);background:var(--surface);border-radius:999px;padding:8px 16px;min-height:40px;font-weight:700;font-size:14px;display:inline-flex;align-items:center;text-decoration:none;white-space:nowrap}
.btn:hover{border-color:var(--ink)}
.btn.pri{background:var(--ink);border-color:var(--ink);color:var(--surface)}
.btn.acc{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.btn.big{padding:13px 26px;font-size:16px;font-weight:800;min-height:48px}
.btn[aria-current="page"]{border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}
main{padding-bottom:56px}
.crumb{font-size:13.5px;color:var(--muted);margin:8px 0 18px;line-height:1.5}
.crumb ol{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:4px}
.crumb li+li::before{content:"›";margin-right:4px}
.crumb a{color:var(--muted)}
.article{max-width:820px;margin:0 auto;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:36px 40px}
@media (max-width:640px){.article{padding:22px 18px}}
.cat{display:inline-block;font-size:13px;font-weight:800;background:var(--accent-soft);border-radius:999px;padding:3px 12px;text-decoration:none;line-height:1.7}
.article h1{font-size:clamp(26px,4vw,34px);line-height:1.35;letter-spacing:-.03em;font-weight:900;margin:14px 0 12px;text-wrap:balance}
.lead{font-size:17.5px;color:var(--ink-2);margin:0 0 12px}
.meta{font-size:13px;color:var(--muted);margin:0 0 24px;padding-bottom:20px;border-bottom:1px solid var(--line)}
.toc{background:var(--sunken);border-radius:12px;padding:14px 20px;margin:0 0 28px;font-size:14.5px;line-height:1.7}
.toc b{display:block;margin-bottom:4px}.toc ol{margin:0;padding-left:20px}
.toc a{text-decoration:none}.toc a:hover{text-decoration:underline}
.article h2{font-size:clamp(21px,3vw,25px);line-height:1.4;letter-spacing:-.02em;font-weight:900;margin:44px 0 12px;scroll-margin-top:16px}
.article h3{font-size:18px;font-weight:800;margin:26px 0 6px}
.article p{margin:0 0 16px}
.article ul,.article ol{margin:0 0 18px;padding-left:22px}.article li{margin:4px 0}
.article ul.chk{list-style:none;padding-left:0}
.article ul.chk li{position:relative;padding-left:30px}
.article ul.chk li::before{content:"";position:absolute;left:2px;top:.55em;width:15px;height:15px;border:2px solid var(--ink);border-radius:4px}
.article a{text-decoration-thickness:1px;text-underline-offset:3px}
.callout{border-radius:12px;padding:12px 18px;margin:0 0 20px;font-size:15.5px;line-height:1.7}
.callout b{display:block;font-size:13.5px;margin-bottom:2px}.callout p{margin:0}
.callout.tip{background:var(--ok-bg)}.callout.warn{background:var(--warn-bg)}
.example{border:1px dashed var(--line-2);border-radius:12px;padding:14px 18px 4px;margin:0 0 20px;font-size:15.5px;line-height:1.75}
.example>b{display:block;font-size:13.5px;color:var(--muted);margin-bottom:6px}
.tbl{overflow-x:auto;margin:0 0 20px;-webkit-overflow-scrolling:touch}
.tbl table{border-collapse:collapse;width:100%;min-width:480px;font-size:14.5px;line-height:1.6}
.tbl th,.tbl td{border:1px solid var(--line-2);padding:8px 10px;text-align:left;vertical-align:top}.tbl th{background:var(--sunken)}
.summary{background:var(--accent-soft);border-radius:var(--r);padding:20px 24px;margin:44px 0 0}
.summary h2{margin:0 0 8px!important;font-size:19px!important}.summary ul{margin:0}
.cta{margin:32px 0 0;background:var(--ink);color:var(--surface);border-radius:var(--r);padding:26px 28px}
.cta h2{margin:0 0 6px!important;font-size:21px!important;color:inherit}
.cta p{margin:0 0 16px!important;opacity:.88}
.cta .btn{background:var(--accent);border-color:var(--accent);color:#121214}
.related{max-width:820px;margin:32px auto 0}
.related h2,.hubsec h2{font-size:20px;font-weight:900;margin:0 0 12px}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;list-style:none;margin:0;padding:0}
.card{display:block;height:100%;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px 18px;text-decoration:none;line-height:1.5}
.card:hover{border-color:var(--ink)}
.card small{display:block;color:var(--muted);font-size:12.5px;font-weight:700;margin-bottom:4px}
.card b{display:block;font-size:16px;line-height:1.45}
.pn{max-width:820px;margin:28px auto 0;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pn a{display:block;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px 18px;text-decoration:none;line-height:1.5;min-height:64px}
.pn a:hover{border-color:var(--ink)}.pn small{display:block;color:var(--muted);font-size:12.5px;font-weight:700}.pn .nx{text-align:right}
@media (max-width:560px){.pn{grid-template-columns:1fr}.pn .nx{text-align:left}}
.hero{padding:28px 0 8px}.hero h1{font-size:clamp(28px,4.6vw,40px);line-height:1.3;letter-spacing:-.03em;font-weight:900;margin:0 0 12px;text-wrap:balance}
.hero p{color:var(--ink-2);max-width:60ch;margin:0 0 20px;font-size:17px}
.hubsec{margin:36px 0 0}.hubsec>p{margin:-6px 0 12px;color:var(--muted);font-size:14.5px}
.note{max-width:820px;margin:20px auto 0;font-size:13.5px;color:var(--muted);line-height:1.7}
footer{border-top:1px solid var(--line);padding:26px 0 40px;font-size:14px;color:var(--muted)}
footer .nav a{color:var(--ink-2);text-decoration:none;padding:6px 4px;min-height:40px;display:inline-flex;align-items:center}
footer .nav a:hover{text-decoration:underline}
footer p{margin:10px 0 0;font-size:13px}
`;

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;700;900&display=swap" rel="stylesheet">';

export const header = (cur) => `<a class="skip" href="#main">본문 바로가기</a>
<div class="wrap"><header class="topbar">
<a class="brand" href="/" aria-label="${SITE} 메인으로"><span class="mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>${SITE}</b></a>
<nav class="nav" aria-label="주요 메뉴"><a class="btn" href="/">메인으로</a><a class="btn acc" href="/" data-track="cta" data-loc="header">인스타툰 만들기</a><a class="btn"${cur === 'guide' ? ' aria-current="page"' : ''} href="/guide/">콘텐츠 가이드</a></nav>
</header></div>`;

export const footer = `<footer><div class="wrap"><nav class="nav" aria-label="푸터 메뉴"><a href="/guide/">콘텐츠 가이드</a><a href="/" data-track="cta" data-loc="footer">인스타툰 만들기</a><a href="/about/">소개</a><a href="/privacy/">개인정보처리방침</a><a href="/terms/">이용안내</a><a href="/sitemap.xml">사이트맵</a></nav>
<p>© ${SITE} · 이 사이트의 가이드는 일반적인 정보 제공을 위한 것이며, 서비스 기능과 정책은 각 서비스의 공식 안내에서 확인해 주세요.</p></div></footer>`;

export function head({ title, desc, canonical, type, extra = '', body = '', ga = {} }) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${canonical}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta property="og:site_name" content="${SITE}">
<meta property="og:locale" content="ko_KR">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
${FONTS}
<style>${CSS}</style>
${extra}
${gaSnippet(cfg.ga, ga)}
</head>
<body${body}>`;
}

export const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

export const trackJs = '<script src="/guide-track.js" defer></script>';
export const bodyAttr = (type, slug, cat) => ` data-page-type="${type}"${slug ? ` data-slug="${slug}"` : ''}${cat ? ` data-category="${cat}"` : ''}`;

export function renderArticle(a, all, i) {
  const pub = a.published || DATE, mod = a.modified || pub;
  const u = url(a.slug);
  const cat = CATS[a.cat].name;
  const title = `${a.metaTitle} | ${SITE}`;
  const prev = all[i - 1], next = all[i + 1];
  const rel = a.related.map((s) => all.find((x) => x.slug === s));
  const article = {
    '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.desc, inLanguage: 'ko',
    datePublished: pub, dateModified: mod, mainEntityOfPage: { '@type': 'WebPage', '@id': u }, url: u,
    author: { '@type': 'Organization', name: SITE, url: ORIGIN + '/' },
    publisher: { '@type': 'Organization', name: SITE, url: ORIGIN + '/' },
  };
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: ORIGIN + '/' },
      { '@type': 'ListItem', position: 2, name: '콘텐츠 가이드', item: ORIGIN + '/guide/' },
      { '@type': 'ListItem', position: 3, name: a.title, item: u }] };
  const toc = a.sections.map((s, k) => `<li><a href="#s${k + 1}">${esc(s.h)}</a></li>`).join('');
  const body = a.sections.map((s, k) => `<section><h2 id="s${k + 1}">${esc(s.h)}</h2>${s.blocks.map(block).join('')}</section>`).join('\n');
  const card = (x, k) => `<li><a class="card" href="/guide/${x.slug}/" data-track="related" data-pos="${k + 1}"><small>${CATS[x.cat].name}</small><b>${esc(x.title)}</b></a></li>`;
  // 같은 카테고리의 다른 글(이미 위에 나온 글 제외, 최신순 최대 3개): 새 글이 추가되면 자동으로 연결된다
  const shown = new Set([a.slug, ...a.related]);
  const extra = all.filter((x) => x.cat === a.cat && !shown.has(x.slug)).sort((x, y) => (y.published || '').localeCompare(x.published || '')).slice(0, 3);
  const more = extra.length ? `<h3 style="font-size:15px;margin:22px 0 10px">${cat} 더 보기</h3><ul class="cards">${extra.map((x, k) => card(x, rel.length + k)).join('')}</ul>` : '';
  const prevHtml = prev
    ? `<a href="/guide/${prev.slug}/" rel="prev" data-track="prevnext" data-loc="prev"><small>← 이전 글</small>${esc(prev.title)}</a>`
    : `<a href="/guide/" rel="up" data-track="prevnext" data-loc="prev"><small>← 콘텐츠 가이드</small>가이드 전체 글 보기</a>`;
  const nextHtml = next
    ? `<a class="nx" href="/guide/${next.slug}/" rel="next" data-track="prevnext" data-loc="next"><small>다음 글 →</small>${esc(next.title)}</a>`
    : `<a class="nx" href="/guide/" rel="up" data-track="prevnext" data-loc="next"><small>콘텐츠 가이드 →</small>가이드 전체 글 보기</a>`;
  return head({ title, desc: a.desc, canonical: u, type: 'article', body: bodyAttr('article', a.slug, a.cat), ga: { content_group: cat, content_id: a.slug },
      extra: `<meta property="article:published_time" content="${pub}"><meta property="article:modified_time" content="${mod}">${ld(article)}${ld(crumbs)}` })
    + header('guide') + `
<main id="main" class="wrap">
<nav class="crumb" aria-label="현재 위치"><ol><li><a href="/">홈</a></li><li><a href="/guide/">콘텐츠 가이드</a></li><li aria-current="page">${esc(a.title)}</li></ol></nav>
<article class="article">
<a class="cat" href="/guide/#${a.cat}">${cat}</a>
<h1>${esc(a.title)}</h1>
<p class="lead">${inline(a.lead)}</p>
<p class="meta">작성일 <time datetime="${pub}">${pub}</time> · 최종 업데이트 <time datetime="${mod}">${mod}</time></p>
<nav class="toc" aria-label="목차"><b>이 글의 순서</b><ol>${toc}</ol></nav>
${body}
<section class="summary"><h2>이 글에서 기억할 내용</h2><ul>${a.summary.map((x) => `<li>${inline(x)}</li>`).join('')}</ul></section>
<section class="cta"><h2>인스타툰을 직접 만들어보고 싶다면?</h2><p>인스타툰 연재실에서 실제 매장 이야기를 인스타툰 콘텐츠로 만들어보세요.</p><a class="btn big" href="/" data-track="cta" data-loc="article_bottom">인스타툰 만들기</a></section>
</article>
<p class="note">편집 안내: 이 글은 AI 도구의 도움을 받아 작성한 초안을 바탕으로 합니다. 서비스 기능과 정책은 바뀔 수 있으니 공식 안내를 함께 확인해 주세요. <a href="/about/#editorial">편집 방침 보기</a></p>
<section class="related" aria-labelledby="rel"><h2 id="rel">함께 읽으면 좋은 글</h2><ul class="cards">${rel.map(card).join('')}</ul>${more}</section>
<nav class="pn" aria-label="이전 글과 다음 글">${prevHtml}${nextHtml}</nav>
</main>
` + footer + `
${trackJs}
</body>
</html>
`;
}

export function renderHub(all) {
  const u = `${ORIGIN}/guide/`;
  const title = `인스타툰 · SNS 콘텐츠 가이드 | ${SITE}`;
  const desc = '인스타툰 제작부터 Instagram 콘텐츠 구성, 소상공인 SNS 활용 방법까지 실제 콘텐츠를 만들 때 도움이 되는 가이드 20편을 모았습니다.';
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: '홈', item: ORIGIN + '/' },
    { '@type': 'ListItem', position: 2, name: '콘텐츠 가이드', item: u }] };
  const list = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: u, description: desc, inLanguage: 'ko' };
  const sections = Object.entries(CATS).map(([k, c]) => {
    const items = all.filter((x) => x.cat === k);
    return `<section class="hubsec" id="${k}" aria-labelledby="h-${k}"><h2 id="h-${k}">${c.name}</h2><p>${c.desc}</p><ul class="cards">${items.map((x) => `<li><a class="card" href="/guide/${x.slug}/" data-track="guide_card" data-loc="hub_${k}"><small>${c.name}</small><b>${esc(x.title)}</b><span style="display:block;color:var(--muted);font-size:13.5px;margin-top:6px">${esc(x.card)}</span></a></li>`).join('')}</ul></section>`;
  }).join('\n');
  return head({ title, desc, canonical: u, type: 'website', body: bodyAttr('hub'), ga: { content_group: '콘텐츠 가이드 허브' }, extra: ld(list) + ld(crumbs) }) + header('guide') + `
<main id="main" class="wrap">
<nav class="crumb" aria-label="현재 위치"><ol><li><a href="/">홈</a></li><li aria-current="page">콘텐츠 가이드</li></ol></nav>
<section class="hero"><h1>인스타툰과 SNS 콘텐츠를 쉽게 시작하는 방법</h1>
<p>인스타툰 제작부터 Instagram 콘텐츠 구성, 소상공인 SNS 활용 방법까지 실제 콘텐츠를 만들 때 도움이 되는 정보를 정리했습니다.</p>
<a class="btn pri big" href="/" data-track="cta" data-loc="hub_hero">인스타툰 만들어보기</a></section>
${sections}
</main>
` + footer + `
${trackJs}
</body>
</html>
`;
}

export function render404() {
  return head({ title: `페이지를 찾을 수 없습니다 | ${SITE}`, desc: '요청하신 페이지를 찾을 수 없습니다.', canonical: ORIGIN + '/', type: 'website' })
    .replace('<meta name="robots" content="index,follow">', '<meta name="robots" content="noindex">')
    .replace(/<link rel="canonical"[^>]*>\n/, '')
    + header('') + `
<main id="main" class="wrap"><section class="hero"><h1>페이지를 찾을 수 없어요</h1><p>주소가 바뀌었거나 없는 페이지예요. 아래에서 원하는 곳으로 이동해 주세요.</p>
<div class="nav"><a class="btn pri big" href="/guide/">콘텐츠 가이드로 돌아가기</a><a class="btn big" href="/">인스타툰 만들기</a></div></section></main>
` + footer + `
${trackJs}
</body>
</html>
`;
}
