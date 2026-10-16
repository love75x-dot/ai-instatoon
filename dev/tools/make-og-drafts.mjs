// 공유 이미지 시안(캐릭터 느낌) 2개를 docs/drafts/ 에 만든다. 고르면 site/assets/og/og-default.png 로 바꾼다.
//   node dev/tools/make-og-drafts.mjs
import fs from 'node:fs';
import path from 'node:path';
import { launch, root } from '../lib/harness.mjs';

const OUT = path.join(root, 'docs', 'drafts');
fs.mkdirSync(OUT, { recursive: true });
const FONT = `font-family:"Pretendard","Noto Sans KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif`;
const INK = '#111', YEL = '#FFD53D', BLUSH = '#FFC9B8';

/* 2~3등신 치비 캐릭터(200×200). mood: smile | wow | love | wink, hair: bob | spike | bun */
const chibi = ({ mood = 'smile', hair = 'bob', body = true, shirt = INK } = {}) => {
  const eyes = {
    smile: `<circle cx="78" cy="96" r="7" fill="${INK}"/><circle cx="122" cy="96" r="7" fill="${INK}"/><circle cx="80" cy="93" r="2.4" fill="#fff"/><circle cx="124" cy="93" r="2.4" fill="#fff"/>`,
    wow: `<circle cx="78" cy="94" r="10" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="122" cy="94" r="10" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="78" cy="95" r="4" fill="${INK}"/><circle cx="122" cy="95" r="4" fill="${INK}"/>`,
    love: `<path d="M78 104 C62 92 66 82 74 82 C78 82 78 86 78 86 C78 86 78 82 82 82 C90 82 94 92 78 104Z" fill="${INK}"/><path d="M122 104 C106 92 110 82 118 82 C122 82 122 86 122 86 C122 86 122 82 126 82 C134 82 138 92 122 104Z" fill="${INK}"/>`,
    wink: `<path d="M68 98 Q78 88 88 98" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><circle cx="122" cy="96" r="7" fill="${INK}"/><circle cx="124" cy="93" r="2.4" fill="#fff"/>`,
  }[mood];
  const mouth = {
    smile: `<path d="M88 118 Q100 130 112 118" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
    wow: `<ellipse cx="100" cy="122" rx="8" ry="10" fill="${INK}"/>`,
    love: `<path d="M86 116 Q100 134 114 116 Z" fill="${INK}"/>`,
    wink: `<path d="M86 118 Q100 134 114 118" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
  }[mood];
  const hairSvg = {
    bob: `<path d="M36 96 C30 40 70 22 100 22 C130 22 170 40 164 96 C160 70 140 56 100 56 C60 56 40 70 36 96Z" fill="${INK}"/><path d="M36 96 C34 118 40 132 46 138 L50 100Z M164 96 C166 118 160 132 154 138 L150 100Z" fill="${INK}"/>`,
    spike: `<path d="M38 92 L30 52 L58 66 L66 26 L90 54 L108 20 L124 54 L152 30 L152 70 L172 66 L162 92 C150 66 128 58 100 58 C72 58 50 66 38 92Z" fill="${INK}"/>`,
    bun: `<circle cx="100" cy="22" r="20" fill="${INK}"/><path d="M38 94 C34 48 70 30 100 30 C130 30 166 48 162 94 C150 66 130 56 100 56 C70 56 50 66 38 94Z" fill="${INK}"/>`,
  }[hair];
  return `<svg viewBox="0 0 200 ${body ? 250 : 200}" xmlns="http://www.w3.org/2000/svg">
    ${body ? `<path d="M64 188 Q100 176 136 188 L146 246 L54 246Z" fill="${shirt}"/><rect x="88" y="168" width="24" height="22" rx="8" fill="#fff" stroke="${INK}" stroke-width="5"/>` : ''}
    <circle cx="100" cy="98" r="64" fill="#fff" stroke="${INK}" stroke-width="6"/>
    ${hairSvg}
    <circle cx="62" cy="116" r="11" fill="${BLUSH}" opacity=".9"/><circle cx="138" cy="116" r="11" fill="${BLUSH}" opacity=".9"/>
    ${eyes}${mouth}
  </svg>`;
};
const spark = (x, y, s = 1) => `<svg style="position:absolute;left:${x}px;top:${y}px;width:${40 * s}px;height:${40 * s}px" viewBox="0 0 40 40"><path d="M20 0 L25 15 L40 20 L25 25 L20 40 L15 25 L0 20 L15 15Z" fill="${YEL}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></svg>`;
const heart = (x, y, s = 1) => `<svg style="position:absolute;left:${x}px;top:${y}px;width:${36 * s}px;height:${32 * s}px" viewBox="0 0 36 32"><path d="M18 30 C2 18 2 4 11 4 C15 4 18 8 18 8 C18 8 21 4 25 4 C34 4 34 18 18 30Z" fill="${INK}"/></svg>`;

/* 시안 A — 흰 바탕 + 2×2 칸 만화: 칸마다 표정이 다른 캐릭터, 왼쪽에 문구 */
const panel = (inner, bg = '#fff') => `<div style="position:relative;width:236px;height:236px;border:6px solid ${INK};border-radius:22px;background:${bg};overflow:hidden">${inner}</div>`;
const cA = (svg, w, left, top) => `<div style="position:absolute;left:${left}px;top:${top}px;width:${w}px">${svg}</div>`;
const htmlA = `<body style="margin:0;width:1200px;height:630px;background:#fff;color:${INK};${FONT};position:relative;overflow:hidden">
  <div style="position:absolute;left:80px;top:118px;width:560px">
    <div style="display:inline-block;padding:8px 18px;border:3px solid ${INK};border-radius:99px;background:${YEL};font-size:26px;font-weight:800">인스타툰 연재실</div>
    <div style="margin-top:26px;font-size:70px;font-weight:900;letter-spacing:-2.5px;line-height:1.18">팔로워 터지는<br>인스타툰</div>
    <div style="margin-top:26px;font-size:34px;font-weight:600;line-height:1.5;color:#333">복잡한 툴 없이<br>웹에서 바로 제작하세요.</div>
  </div>
  <div style="position:absolute;left:80px;bottom:48px;font-size:26px;font-weight:700;color:#555">www.ai-instatoon.com</div>
  <div style="position:absolute;right:70px;top:62px;display:grid;grid-template-columns:236px 236px;gap:18px">
    ${panel(cA(chibi({ mood: 'smile', hair: 'bob' }), 188, 20, 22) + spark(168, 14, .9))}
    ${panel(cA(chibi({ mood: 'wow', hair: 'spike', shirt: '#444' }), 188, 20, 22) + `<div style="position:absolute;right:14px;top:6px;font-size:62px;font-weight:900;color:${INK}">!</div>`, YEL)}
    ${panel(cA(chibi({ mood: 'love', hair: 'bun' }), 188, 20, 22) + heart(168, 20) + heart(24, 30, .7))}
    ${panel(cA(chibi({ mood: 'wink', hair: 'bob', shirt: '#444' }), 188, 20, 22) + spark(20, 20, .8) + spark(172, 84, .6))}
  </div>
</body>`;

/* 시안 B — 노란 바탕 + 큰 캐릭터가 말풍선으로 말하는 구성 */
const htmlB = `<body style="margin:0;width:1200px;height:630px;background:${YEL};color:${INK};${FONT};position:relative;overflow:hidden">
  <div style="position:absolute;left:0;right:0;bottom:0;height:96px;background:${INK}"></div>
  <div style="position:absolute;left:70px;bottom:28px;font-size:30px;font-weight:800;color:#fff;letter-spacing:.3px">인스타툰 연재실 · www.ai-instatoon.com</div>
  <div style="position:absolute;left:64px;top:56px;width:690px;padding:40px 48px 44px;background:#fff;border:7px solid ${INK};border-radius:44px">
    <div style="font-size:72px;font-weight:900;letter-spacing:-2.5px;line-height:1.18">팔로워 터지는<br>인스타툰</div>
    <div style="margin-top:22px;font-size:36px;font-weight:700;line-height:1.5;color:#2a2a2a">복잡한 툴 없이<br>웹에서 바로 제작하세요.</div>
  </div>
  <svg style="position:absolute;left:856px;top:236px;width:64px;height:80px" viewBox="0 0 64 80"><polygon points="0,6 58,40 0,74" fill="#fff"/><polyline points="0,6 58,40 0,74" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/></svg>
  <div style="position:absolute;left:900px;top:209px;width:260px">${chibi({ mood: 'smile', hair: 'bob', shirt: INK })}</div>
  ${spark(1000, 92, 1.1)}${spark(1118, 150, .8)}${heart(1112, 380, 1)}${heart(930, 150, .8)}
</body>`;

const browser = await launch();
for (const [name, html] of [['og-시안A-흰바탕-네칸만화.png', htmlA], ['og-시안B-노랑바탕-말풍선.png', htmlB]]) {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 }); const page = await ctx.newPage();
  await page.setContent(html); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, name), clip: { x: 0, y: 0, width: 1200, height: 630 } }); await ctx.close();
  console.log(name, fs.statSync(path.join(OUT, name)).size + 'B');
}
await browser.close();
