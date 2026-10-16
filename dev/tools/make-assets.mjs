// 5단계 이미지 만들기(사람이 가끔 돌리는 도구, 빌드에는 들어가지 않음):
//   node dev/tools/make-assets.mjs
// - site/assets/og/og-default.png  공유 이미지 1200×630 (흑백 심플: 사이트 이름 + 한 줄 소개). 예시 그림 6장을 받으면 마지막 그림으로 바꾼다.
// - site/assets/icons/icon-192.png · icon-512.png  홈 화면 추가용 아이콘(로고 마크: 2×2 칸, 흑백)
import fs from 'node:fs';
import path from 'node:path';
import { launch, root } from '../lib/harness.mjs';

const out = (p) => path.join(root, 'site', 'assets', p);
fs.mkdirSync(out('og'), { recursive: true }); fs.mkdirSync(out('icons'), { recursive: true });
const FONT = `font-family:"Pretendard","Noto Sans KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif`;
const mark = (s, g, r, fills) => `<div style="width:${s}px;height:${s}px;display:grid;grid-template-columns:1fr 1fr;gap:${g}px">${fills.map((f) => `<i style="background:${f};border-radius:${r}px;${f === '#fff' ? 'border:6px solid #111;box-sizing:border-box' : ''}"></i>`).join('')}</div>`;
const og = `<body style="margin:0;width:1200px;height:630px;background:#fff;color:#111;${FONT};position:relative;overflow:hidden">
  <div style="position:absolute;left:84px;top:96px">
    <div style="font-size:100px;font-weight:900;letter-spacing:-3px;line-height:1.1">인스타툰 연재실</div>
    <div style="margin-top:34px;font-size:46px;font-weight:600;line-height:1.5;color:#333">분야와 이야기만 적으면<br>인스타툰 대본이 나와요</div>
  </div>
  <div style="position:absolute;left:84px;bottom:64px;font-size:30px;font-weight:700;color:#555;letter-spacing:.5px">www.ai-instatoon.com</div>
  <div style="position:absolute;right:84px;top:110px">${mark(210, 18, 22, ['#111', '#fff', '#fff', '#111'])}</div>
  <div style="position:absolute;right:84px;bottom:64px;font-size:26px;font-weight:600;color:#555">무료로 먼저 만들어 보세요</div>
</body>`;
const icon = (size) => `<body style="margin:0;width:${size}px;height:${size}px;background:#fff;display:flex;align-items:center;justify-content:center">${mark(Math.round(size * 0.58), Math.round(size * 0.045), Math.round(size * 0.05), ['#111', '#111', '#111', '#111'])}</body>`;

const browser = await launch();
const shot = async (html, w, h, file) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }); const page = await ctx.newPage();
  await page.setContent(html); await page.waitForTimeout(300);
  await page.screenshot({ path: out(file), clip: { x: 0, y: 0, width: w, height: h } }); await ctx.close();
  console.log(file, fs.statSync(out(file)).size + 'B');
};
await shot(og, 1200, 630, 'og/og-default.png');
await shot(icon(192), 192, 192, 'icons/icon-192.png');
await shot(icon(512), 512, 512, 'icons/icon-512.png');
await browser.close();
