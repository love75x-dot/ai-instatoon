// 가이드 콘텐츠 작성용 헬퍼 + 페이지 렌더러. 콘텐츠는 articles-*.mjs, 실행은 build-guide.mjs.
export const ORIGIN = 'https://www.ai-instatoon.com';
export const SITE = '인스타툰 연재실';
export const cfg = { ga: '' }; // build-guide.mjs가 설정 (GA4 측정 ID, 없으면 빈 문자열)
export const DATE = '2026-10-01'; // 글에 published/modified가 없을 때의 기본값 (글별로 articles-*.mjs에서 지정)

import { gaSnippet } from '../analytics.mjs';
import { OG_IMAGE, ogImageUrl, THEME_COLOR, NAVER_VERIFY, footerMetaHtml } from '../site-meta.mjs';
import { guideFontHead } from '../fonts.mjs';
import { exampleData } from '../examples.mjs';

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
/* 예시 갤러리(반찬가게 사장님의 하루): site/assets/examples/examples.json 한 곳의 그림·글을 그대로 쓴다 */
export const gallery = () => ({ t: 'gallery' });

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
    case 'gallery': {
      const E = exampleData(); if (!E) return '';
      return `<figure class="gal"><div class="gal-g">${E.cuts.map((c) => `<figure class="gal-f"><img src="/assets/examples/${c.file}-360.webp" srcset="/assets/examples/${c.file}-360.webp 360w, /assets/examples/${c.file}-720.webp 720w" sizes="(min-width:721px) 220px, 46vw" width="${E.w}" height="${E.h}" loading="lazy" decoding="async" alt="${esc(c.alt)}"><figcaption><b>${c.n}컷 · ${esc(c.role)}</b>${esc(c.cap)}</figcaption></figure>`).join('')}</div><figcaption class="gal-n"><b>${esc(E.title)}</b> · ${esc(E.sub)}. ${esc(E.note)}</figcaption></figure>`;
    }
    default: throw new Error('unknown block ' + b.t);
  }
}

const CSS = `
:root{--bg:#fff;--surface:#fff;--sunken:#F5F5F5;--ink:#111;--ink-2:#3A3A3A;--muted:#6B6B6B;--line:#E6E6E6;--line-2:#CFCFCF;--accent:#FFD53D;--accent-ink:#121214;--accent-soft:#F5F5F5;--warn:#111;--warn-bg:#F5F5F5;--ok:#3A3A3A;--ok-bg:#F5F5F5;--sans:"IntroSquare","Pretendard Variable",Pretendard,"Gothic A1","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;--r:16px}
@media (prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#0E0E10;--surface:#18181B;--sunken:#1F1F23;--ink:#F2F2F3;--ink-2:#CFCFD4;--muted:#A0A0A8;--line:#2A2A2F;--line-2:#3A3A40;--accent-soft:#1A1A1D;--warn:#F2F2F3;--warn-bg:#1A1A1D;--ok:#CFCFD4;--ok-bg:#1A1A1D}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.8;-webkit-font-smoothing:antialiased;overflow-wrap:anywhere;word-break:keep-all}
a{color:inherit}
:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.skip{position:absolute;left:-999px}.skip:focus{left:8px;top:8px;background:var(--surface);padding:8px 12px;z-index:9}
.wrap{max-width:1100px;margin:0 auto;padding-inline:16px}
/* HEADER:BEGIN 홈·인스타툰 노트 공통 머리말. 앱(site/index.html)과 노트(site/guide/lib.mjs)의 이 블록은 글자까지 같아야 해요. dev/design/check.mjs가 비교해요. */
body{margin:0}
.hwrap{max-width:1200px;margin:0 auto;padding-inline:16px}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;height:72px;padding:0}
.brand{display:flex;align-items:center;gap:10px;height:40px;padding:0 8px;margin:0 -8px;border:0;border-radius:10px;background:none;color:var(--ink);font:inherit;text-align:left;text-decoration:none;cursor:pointer}
.brand:hover b{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px}
.brand .mark{width:28px;height:28px;border-radius:7px;background:#FFD60A;color:#111;display:grid;place-items:center;flex:none;font-weight:800;font-size:15px;line-height:1;letter-spacing:0}
.brand b{font-weight:900;font-size:19px;line-height:1;letter-spacing:-.02em;white-space:nowrap}
.hnav{display:flex;align-items:center;gap:8px;flex:none}
.hb{display:inline-flex;align-items:center;justify-content:center;height:40px;padding:0 16px;border:1px solid var(--line-2);border-radius:999px;background:var(--surface);color:var(--ink);font:700 15px/1 var(--sans);text-decoration:none;white-space:nowrap;cursor:pointer}
.hb:hover{border-color:var(--ink)}
.hb.pri{background:var(--ink);border-color:var(--ink);color:var(--surface)}
.hb.pri:hover{opacity:.86}
@media (max-width:480px){.hp{display:none}.hb{padding:0 14px}.topbar{gap:8px}}
.hleft{display:flex;align-items:center;gap:10px;min-width:0}
.menubtn{width:40px;height:40px;flex:none;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line-2);border-radius:12px;background:var(--surface);color:var(--ink);font:400 20px/1 var(--sans);cursor:pointer}
.menubtn:hover{border-color:var(--ink)}
.mwrap{position:fixed;inset:0;z-index:80;visibility:hidden}
.mwrap.on{visibility:visible}
.mwrap[hidden]{display:none}
.mbg{position:absolute;inset:0;background:rgba(0,0,0,.4);opacity:0;transition:opacity .18s}
.mwrap.on .mbg{opacity:1}
.mpanel{position:absolute;left:0;top:0;bottom:0;width:min(300px,86vw);display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 12px) 12px 24px;overflow:auto;background:var(--surface);border-right:1px solid var(--ink);transform:translateX(-100%);transition:transform .18s}
.mwrap.on .mpanel{transform:none}
.mpanel ul{list-style:none;margin:0;padding:0}
.mpanel hr{border:0;border-top:1px solid var(--line);margin:10px 0}
.mi{display:flex;align-items:center;width:100%;min-height:48px;padding:0 14px;border:0;border-left:2px solid transparent;border-radius:0 10px 10px 0;background:none;color:var(--muted);font:600 18px/1 var(--sans);text-align:left;text-decoration:none;cursor:pointer}
.mi:hover{background:var(--sunken);color:var(--ink)}
.mi[aria-current="page"]{color:var(--ink);font-weight:800;border-left-color:var(--ink)}
#shopSlot[hidden]{display:none}
body.menu-open{overflow:hidden}
@media (prefers-reduced-motion:reduce){.mbg,.mpanel{transition:none}}
/* HEADER:END */
.nav{display:flex;flex-wrap:wrap;gap:8px}
.btn{border:1px solid var(--line-2);background:var(--surface);border-radius:999px;padding:8px 16px;min-height:40px;font-weight:700;font-size:15px;display:inline-flex;align-items:center;text-decoration:none;white-space:nowrap}
.btn:hover{border-color:var(--ink)}
.btn.pri{background:var(--ink);border-color:var(--ink);color:var(--surface)}
.btn.acc{background:var(--ink);border-color:var(--ink);color:var(--surface)}
.btn.big{padding:13px 26px;font-size:16px;font-weight:800;min-height:48px}
.btn[aria-current="page"]{border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}
main{padding-bottom:56px}
.crumb{font-size:15px;color:var(--muted);margin:8px 0 18px;line-height:1.5}
.crumb ol{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:4px}
.crumb li+li::before{content:"›";margin-right:4px}
.crumb a{color:var(--muted)}
.article{max-width:820px;margin:0 auto;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:36px 40px}
@media (max-width:640px){.article{padding:22px 18px}}
.cat{display:inline-block;font-size:15px;font-weight:700;color:var(--muted);text-decoration:none;line-height:1.7}
.article h1{font-size:clamp(26px,4vw,34px);line-height:1.35;letter-spacing:-.03em;font-weight:900;margin:14px 0 12px;text-wrap:balance}
.lead{font-size:17.5px;color:var(--ink-2);margin:0 0 12px}
.meta{font-size:15px;color:var(--muted);margin:0 0 24px;padding-bottom:20px;border-bottom:1px solid var(--line)}
.toc{background:var(--sunken);border-radius:12px;padding:14px 20px;margin:0 0 28px;font-size:15px;line-height:1.7}
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
.callout b{display:block;font-size:15px;margin-bottom:2px}.callout p{margin:0}
.callout.tip,.callout.warn{background:var(--sunken)}.callout.warn{border-left:3px solid var(--ink);border-radius:0 12px 12px 0}
.gal{margin:0 0 22px}.gal-g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.gal-f{margin:0}.gal-f img{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover;border:1px solid var(--line);border-radius:12px;background:var(--sunken)}
.gal-f figcaption{margin-top:6px;font-size:15px;line-height:1.45;color:var(--muted)}.gal-f figcaption b{display:block;color:var(--ink);font-size:15px}.gal-n{margin-top:12px;font-size:15px;line-height:1.6;color:var(--muted)}.gal-n b{color:var(--ink)}
@media (max-width:720px){.gal-g{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}}
.example{border:1px dashed var(--line-2);border-radius:12px;padding:14px 18px 4px;margin:0 0 20px;font-size:15.5px;line-height:1.75}
.example>b{display:block;font-size:15px;color:var(--muted);margin-bottom:6px}
.tbl{overflow-x:auto;margin:0 0 20px;-webkit-overflow-scrolling:touch}
.tbl table{border-collapse:collapse;width:100%;min-width:480px;font-size:15px;line-height:1.6}
.tbl th,.tbl td{border:1px solid var(--line-2);padding:8px 10px;text-align:left;vertical-align:top}.tbl th{background:var(--sunken)}
.summary{background:var(--accent-soft);border-radius:var(--r);padding:20px 24px;margin:44px 0 0}
.summary h2{margin:0 0 8px!important;font-size:19px!important}.summary ul{margin:0}
.cta{margin:32px 0 0;background:var(--ink);color:var(--surface);border-radius:var(--r);padding:26px 28px}
.cta h2{margin:0 0 6px!important;font-size:21px!important;color:inherit}
.cta p{margin:0 0 16px!important;opacity:.88}
.cta .btn{background:var(--surface);border-color:var(--surface);color:var(--ink)}
.related{max-width:820px;margin:32px auto 0}
.related h2,.hubsec h2{font-size:20px;font-weight:900;margin:0 0 12px}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;list-style:none;margin:0;padding:0}
.card{display:block;height:100%;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px 18px;text-decoration:none;line-height:1.5}
.card:hover{border-color:var(--ink)}
.card small{display:block;color:var(--muted);font-size:15px;font-weight:700;margin-bottom:4px}
.card b{display:block;font-size:16px;line-height:1.45}
.pn{max-width:820px;margin:28px auto 0;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pn a{display:block;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px 18px;text-decoration:none;line-height:1.5;min-height:64px}
.pn a:hover{border-color:var(--ink)}.pn small{display:block;color:var(--muted);font-size:15px;font-weight:700}.pn .nx{text-align:right}
@media (max-width:560px){.pn{grid-template-columns:1fr}.pn .nx{text-align:left}}
.hero{padding:28px 0 8px}.hero h1{font-size:clamp(28px,4.6vw,40px);line-height:1.3;letter-spacing:-.03em;font-weight:900;margin:0 0 12px;text-wrap:balance}
.hero p{color:var(--ink-2);max-width:60ch;margin:0 0 20px;font-size:17px}
.hubsec{margin:36px 0 0}.hubsec>p{margin:-6px 0 12px;color:var(--muted);font-size:15px}
.note{max-width:820px;margin:20px auto 0;font-size:15px;color:var(--muted);line-height:1.7}
body[data-page-type="hub"]{background:var(--surface)}
.bhead{padding:12px 0 4px}.bhead h1{font-size:clamp(30px,5vw,40px);line-height:1.2;letter-spacing:-.035em;font-weight:900;margin:0 0 8px}
.bhead p{color:var(--muted);margin:0;font-size:16px}
.chips{display:flex;gap:4px;overflow-x:auto;padding:20px 0 14px;margin:0 -16px;padding-inline:16px;scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chips a{flex:none;border:0;background:none;color:var(--muted);border-radius:999px;padding:7px 14px;min-height:40px;font-size:15px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;white-space:nowrap}
.chips a:hover{color:var(--ink)}
.chips a[aria-current="true"]{background:var(--ink);color:var(--surface)}
.cnt{margin:0 0 4px;font-size:15px;color:var(--muted)}
.anc{display:block;height:0;scroll-margin-top:90px}
.posts{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.post[hidden]{display:none}
.post{border-bottom:1px solid var(--line)}
.post a{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:22px 0;text-decoration:none}
.pb{display:flex;flex-direction:column;gap:4px;min-width:0}
.pm{font-size:15px;color:var(--muted);line-height:1.5}
.post b{font-size:19px;line-height:1.45;letter-spacing:-.015em;font-weight:800}
.post a:hover b{text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1px}
.ps{font-size:15px;line-height:1.6;color:var(--muted)}
.post img{flex:none;width:120px;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:6px}
@media (max-width:640px){.post a{padding:18px 0}.post b{font-size:17px}.post img{width:88px}}
.pager{display:flex;justify-content:center;align-items:center;gap:4px;margin:28px 0 0}
.pager[hidden]{display:none}
.pg{display:inline-flex;align-items:center;justify-content:center;min-width:40px;height:40px;padding:0 4px;border-radius:999px;color:var(--muted);font:700 15px/1 var(--sans);text-decoration:none}
.pg:hover{color:var(--ink)}
.pg[aria-current="page"]{background:var(--ink);color:var(--surface)}
.pg.pgn{font-size:20px}
.pg.dis{opacity:.3;pointer-events:none}
.pe{display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:40px;color:var(--muted)}
@media (max-width:480px){.pager{gap:2px}.pe{min-width:24px}}
.bcta{margin:40px 0 0;border-top:1px solid var(--ink);padding:24px 0 0;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.bcta b{display:block;font-size:17px}.bcta span{color:var(--muted);font-size:15px}
.cover{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:6px;margin:0 0 22px}
footer{border-top:1px solid var(--line);padding:26px 0 40px;font-size:15px;color:var(--muted)}
footer .nav a{color:var(--ink-2);text-decoration:none;padding:6px 4px;min-height:40px;display:inline-flex;align-items:center}
footer .nav a:hover{text-decoration:underline}
footer p{margin:10px 0 0;font-size:15px}
footer .fmeta a{color:var(--ink-2)}
`;

/* 글꼴은 이 사이트에서 직접 제공한다(site/assets/fonts). 자주 쓰는 글자 조각은 미리 불러온다 */
const FONTS = guideFontHead();

const MENU_JS = `(function(){var b=document.getElementById('menuBtn'),w=document.getElementById('menuWrap');if(!b||!w)return;var t,on=function(){return !w.hidden&&w.classList.contains('on')};
function op(){clearTimeout(t);w.hidden=false;document.body.classList.add('menu-open');b.setAttribute('aria-expanded','true');requestAnimationFrame(function(){requestAnimationFrame(function(){w.classList.add('on')})});setTimeout(function(){var f=w.querySelector('.mi');if(f&&on())f.focus({preventScroll:true})},40)}
function cl(r){w.classList.remove('on');document.body.classList.remove('menu-open');b.setAttribute('aria-expanded','false');clearTimeout(t);t=setTimeout(function(){w.hidden=true},190);if(r!==false)b.focus({preventScroll:true})}
b.addEventListener('click',function(){on()?cl():op()});
w.addEventListener('click',function(e){if(e.target.closest('.mbg'))cl();else if(e.target.closest('.mi'))cl(false)});
document.addEventListener('keydown',function(e){if(!on())return;if(e.key==='Escape'){e.preventDefault();cl();return}
if(e.key==='Tab'){var a=[].slice.call(w.querySelectorAll('.mi'));if(!a.length)return;var f=a[0],l=a[a.length-1];if(e.shiftKey&&document.activeElement===f){e.preventDefault();l.focus()}else if(!e.shiftKey&&document.activeElement===l){e.preventDefault();f.focus()}}});
})();`;

/* ☰ 메뉴: 홈(site/index.html)과 항목·순서가 같다. #shopSlot은 4d(가게 전환)가 채울 빈 자리. */
const menuHtml = (cur) => `<div class="mwrap" id="menuWrap" hidden><div class="mbg"></div><nav class="mpanel" id="menuPanel" role="dialog" aria-modal="true" aria-label="메뉴"><div id="shopSlot" hidden></div>
<ul><li><a class="mi" href="/">웹툰 만들기</a></li><li><a class="mi" href="/#month">한 달 기획</a></li><li><a class="mi" href="/#vault">내 캐릭터</a></li><li><a class="mi" href="/guide/"${cur === 'hub' || cur === 'guide' ? ' aria-current="page"' : ''}>인스타툰 노트</a></li><li><a class="mi" href="/#intro">소개</a></li></ul><hr>
<ul><li><a class="mi" href="/#backup">내 작업 저장 · 불러오기</a></li><li><a class="mi" href="/#help">도움말</a></li></ul></nav></div>`;

export const header = (cur) => `<a class="skip" href="#main">본문 바로가기</a>
<div class="hwrap"><header class="topbar">
<div class="hleft"><button type="button" class="menubtn" id="menuBtn" aria-label="메뉴 열기" aria-haspopup="dialog" aria-expanded="false" aria-controls="menuPanel"><span aria-hidden="true">☰</span></button>
<a class="brand" href="/" aria-label="${SITE} 첫 화면으로"><span class="mark" aria-hidden="true">툰</span><b>${SITE}</b></a></div>
<nav class="hnav" aria-label="주요 메뉴">${cur === 'hub' ? '' : '<a class="hb" href="/guide/" aria-label="인스타툰 노트"><span class="hp">인스타툰&nbsp;</span>노트</a>'}<a class="hb pri" href="/" data-track="cta" data-loc="header" aria-label="인스타툰 만들기"><span class="hp">인스타</span>툰 만들기</a></nav>
</header></div>${menuHtml(cur)}<script>${MENU_JS}</script>`;

export const footer = `<footer><div class="wrap"><nav class="nav" aria-label="푸터 메뉴"><a href="/guide/">인스타툰 노트</a><a href="/" data-track="cta" data-loc="footer">인스타툰 만들기</a><a href="/about/">소개</a><a href="/privacy/">개인정보처리방침</a><a href="/terms/">이용안내</a><a href="/sitemap.xml">사이트맵</a></nav>
<p>© ${SITE} · 이 사이트의 가이드는 일반적인 정보 제공을 위한 것이며, 서비스 기능과 정책은 각 서비스의 공식 안내에서 확인해 주세요.</p>
<p class="fmeta">${footerMetaHtml()}</p></div></footer>`;

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
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="/favicon.svg" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<meta property="og:site_name" content="${SITE}">
<meta property="og:locale" content="ko_KR">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImageUrl}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="${OG_IMAGE.width}">
<meta property="og:image:height" content="${OG_IMAGE.height}">
<meta property="og:image:alt" content="${esc(OG_IMAGE.alt)}">
<meta property="og:image:secure_url" content="${ogImageUrl}">
<link rel="image_src" href="${ogImageUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ogImageUrl}">
<meta name="twitter:image:alt" content="${esc(OG_IMAGE.alt)}">
<meta name="theme-color" content="${THEME_COLOR}">
${NAVER_VERIFY}
<link rel="manifest" href="/manifest.webmanifest">
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
      { '@type': 'ListItem', position: 2, name: '인스타툰 노트', item: ORIGIN + '/guide/' },
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
    : `<a href="/guide/" rel="up" data-track="prevnext" data-loc="prev"><small>← 인스타툰 노트</small>노트 전체 글 보기</a>`;
  const nextHtml = next
    ? `<a class="nx" href="/guide/${next.slug}/" rel="next" data-track="prevnext" data-loc="next"><small>다음 글 →</small>${esc(next.title)}</a>`
    : `<a class="nx" href="/guide/" rel="up" data-track="prevnext" data-loc="next"><small>인스타툰 노트 →</small>노트 전체 글 보기</a>`;
  return head({ title, desc: a.desc, canonical: u, type: 'article', body: bodyAttr('article', a.slug, a.cat), ga: { content_group: cat, content_id: a.slug },
      extra: `<meta property="article:published_time" content="${pub}"><meta property="article:modified_time" content="${mod}">${ld(article)}${ld(crumbs)}` })
    + header('guide') + `
<main id="main" class="wrap">
<nav class="crumb" aria-label="현재 위치"><ol><li><a href="/">홈</a></li><li><a href="/guide/">인스타툰 노트</a></li><li aria-current="page">${esc(a.title)}</li></ol></nav>
<article class="article">
${a.image ? `<img class="cover" src="${coverOf(a)}" width="800" height="450" alt="">` : ''}
<a class="cat" href="/guide/#${a.cat}">${cat}</a>
<h1>${esc(a.title)}</h1>
<p class="lead">${inline(a.lead)}</p>
<p class="meta">작성일 <time datetime="${pub}">${pub}</time> · 최종 업데이트 <time datetime="${mod}">${mod}</time></p>
<nav class="toc" aria-label="목차"><b>이 글의 순서</b><ol>${toc}</ol></nav>
${body}
<section class="summary"><h2>이 글에서 기억할 내용</h2><ul>${a.summary.map((x) => `<li>${inline(x)}</li>`).join('')}</ul></section>
<section class="cta"><h2>인스타툰을 직접 만들어보고 싶다면?</h2><p>인스타툰 연재실에서 내가 겪은 이야기를 인스타툰 콘텐츠로 만들어보세요.</p><a class="btn big" href="/" data-track="cta" data-loc="article_bottom">인스타툰 만들기</a></section>
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

// 대표 이미지는 글에 image: '파일명'(site/guide/img/ 안)을 적은 글에만 보인다. 지금은 쓰는 글이 없다.
export const IMG_DIR = '/note-img/';
export const coverOf = (a) => (a.image ? IMG_DIR + a.image : '');
const fmtDate = (d) => String(d || '').replace(/-/g, '.');
// 최신순: 공개일 → 같은 날짜 안에서는 글의 order 값(클수록 위, 없으면 0) → 같으면 목록에서 뒤에 있는 글이 먼저
const newestFirst = (all) => all.map((a, i) => ({ a, i })).sort((x, y) => String(y.a.published || '').localeCompare(String(x.a.published || '')) || (y.a.order || 0) - (x.a.order || 0) || y.i - x.i).map((x) => x.a);

const HUB_JS = `<script>(function(){
var PER=10,L=document.getElementById('posts');if(!L)return;
var items=[].slice.call(L.children),chips=[].slice.call(document.querySelectorAll('.chips a')),pager=document.getElementById('pager'),count=document.getElementById('count'),top=document.querySelector('.chips');
var CATS=/^(toon|insta|biz|ai|meta)$/;
function state(){var c=(location.hash||'').slice(1);if(!CATS.test(c))c='all';var m=/[?&]page=(\\\d+)/.exec(location.search);return {c:c,p:m?Math.max(1,parseInt(m[1],10)):1};}
function url(c,p){return location.pathname+(p>1?'?page='+p:'')+(c!=='all'?'#'+c:'');}
function slots(){return window.innerWidth<=480?5:7;}
function nums(p,t){var S=slots(),o=[],i;if(t<=S){for(i=1;i<=t;i++)o.push(i);return o;}
if(p<=S-3){for(i=1;i<=S-2;i++)o.push(i);o.push(0,t);}
else if(p>=t-(S-4)){o.push(1,0);for(i=t-(S-3);i<=t;i++)o.push(i);}
else{o.push(1,0);var k=(S-5)/2;for(i=p-k;i<=p+k;i++)o.push(i);o.push(0,t);}
return o;}
function render(c,p,t){
if(t<=1){pager.hidden=true;pager.innerHTML='';return;}
var h='<a class="pg pgn'+(p<=1?' dis':'')+'" href="'+(p>1?url(c,p-1):'#')+'" data-p="'+(p-1)+'" aria-label="이전 페이지"'+(p<=1?' aria-disabled="true" tabindex="-1"':'')+'>‹</a>';
nums(p,t).forEach(function(n){h+=n?'<a class="pg" href="'+url(c,n)+'" data-p="'+n+'" aria-label="'+n+'페이지"'+(n===p?' aria-current="page"':'')+'>'+n+'</a>':'<span class="pe" aria-hidden="true">…</span>';});
h+='<a class="pg pgn'+(p>=t?' dis':'')+'" href="'+(p<t?url(c,p+1):'#')+'" data-p="'+(p+1)+'" aria-label="다음 페이지"'+(p>=t?' aria-disabled="true" tabindex="-1"':'')+'>›</a>';
pager.innerHTML=h;pager.hidden=false;}
function apply(){var s=state(),c=s.c,sel=items.filter(function(li){return c==='all'||li.getAttribute('data-cat')===c;}),t=Math.max(1,Math.ceil(sel.length/PER)),p=Math.min(s.p,t);
items.forEach(function(li){li.hidden=true;});
sel.slice((p-1)*PER,p*PER).forEach(function(li){li.hidden=false;});
chips.forEach(function(a){a.setAttribute('aria-current',a.getAttribute('data-cat')===c?'true':'false');});
if(count)count.textContent='글 '+sel.length+'편'+(t>1?' · '+p+'/'+t+'쪽':'');
render(c,p,t);
if(p!==s.p)history.replaceState(null,'',url(c,p));}
function go(u,scroll){history.pushState(null,'',u);apply();if(scroll&&top)top.scrollIntoView({behavior:'smooth',block:'start'});}
chips.forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var c=a.getAttribute('data-cat');go(url(c==='all'?'all':c,1),false);});});
pager.addEventListener('click',function(e){var a=e.target.closest('a.pg');if(!a)return;e.preventDefault();if(a.classList.contains('dis')||a.getAttribute('aria-current'))return;var s=state();go(url(s.c,parseInt(a.getAttribute('data-p'),10)),true);});
window.addEventListener('popstate',apply);
var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(apply,120);});
apply();})();</script>`;

export function renderHub(all) {
  const u = `${ORIGIN}/guide/`;
  const title = `인스타툰 노트: 인스타툰·SNS 콘텐츠 만드는 법 | ${SITE}`;
  const desc = '인스타툰 제작부터 Instagram 콘텐츠 구성, 소상공인 SNS 활용까지 콘텐츠를 만들 때 도움이 되는 글을 최신순으로 모았습니다.';
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: '홈', item: ORIGIN + '/' },
    { '@type': 'ListItem', position: 2, name: '인스타툰 노트', item: u }] };
  const list = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: u, description: desc, inLanguage: 'ko' };
  const posts = newestFirst(all);
  const chips = [['all', '전체'], ...Object.entries(CATS).map(([k, c]) => [k, c.name])]
    .map(([k, n]) => `<a href="#${k}" data-cat="${k}" aria-current="${k === 'all' ? 'true' : 'false'}">${n}</a>`).join('');
  const anchors = Object.keys(CATS).map((k) => `<i id="${k}" class="anc"></i>`).join('');
  const item = (x) => `<li class="post" data-cat="${x.cat}"><a href="/guide/${x.slug}/" data-track="guide_card" data-loc="hub_${x.cat}">
<span class="pb"><span class="pm">${CATS[x.cat].name} · <time datetime="${x.published}">${fmtDate(x.published)}</time></span>
<b>${esc(x.title)}</b><span class="ps">${esc(x.card)}</span></span>${x.image ? `<img src="${coverOf(x)}" width="800" height="450" alt="" loading="lazy" decoding="async">` : ''}</a></li>`;
  return head({ title, desc, canonical: u, type: 'website', body: bodyAttr('hub'), ga: { content_group: '콘텐츠 가이드 허브' }, extra: ld(list) + ld(crumbs) }) + header('hub') + `
<main id="main" class="wrap">
<nav class="crumb" aria-label="현재 위치"><ol><li><a href="/">홈</a></li><li aria-current="page">인스타툰 노트</li></ol></nav>
<section class="bhead"><h1>인스타툰 노트</h1>
<p>인스타툰 만드는 법과 SNS 콘텐츠 이야기를 최신순으로 모았어요.</p></section>
<nav class="chips" aria-label="카테고리">${chips}</nav>
<p class="cnt" id="count" aria-live="polite">글 ${posts.length}편</p>
${anchors}
<ul class="posts" id="posts">
${posts.map(item).join('\n')}
</ul>
<nav class="pager" id="pager" aria-label="페이지 이동" hidden></nav>
<section class="bcta"><div><b>직접 만들어 보고 싶다면</b><span>내 이야기를 입력하면 대본과 컷 구성까지 정리해 드려요.</span></div><a class="btn pri big" href="/" data-track="cta" data-loc="hub_hero">인스타툰 만들어보기</a></section>
</main>
` + footer + `
${trackJs}
${HUB_JS}
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
<div class="nav"><a class="btn pri big" href="/guide/">인스타툰 노트로 돌아가기</a><a class="btn big" href="/">인스타툰 만들기</a></div></section></main>
` + footer + `
${trackJs}
</body>
</html>
`;
}
