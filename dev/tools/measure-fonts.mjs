// 첫 화면에서 실제로 내려받는 Pretendard 글자 조각(woff2)을 재서 site/font-preload.json 을 만든다(사람이 가끔 돌리는 도구).
//   node dev/tools/measure-fonts.mjs        (먼저 npm run build)
// app: 앱 홈을 휴대폰·PC 폭으로 연 뒤 받은 조각의 합집합, guide: 노트 목록·글을 열 때 받은 조각 중 둘 다 쓴 것(공통).
// 너무 많이 미리 불러오면 오히려 느려지므로 조각당 크기와 개수를 함께 보여 준다.
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, newPage, root } from '../lib/harness.mjs';

const srv = await serve(); const browser = await launch();
const fontsOf = async (url, vp, ls) => {
  const { page } = await newPage(browser, srv.base, { viewport: vp, ls, freeze: false });
  const got = new Set();
  page.on('response', (r) => { const m = r.url().match(/\/assets\/fonts\/pretendard\/([^/?]+\.woff2)/); if (m) got.add(m[1]); });
  await page.goto(srv.base + url); await page.waitForTimeout(2500);
  return got;
};
const ls = { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' };
const appM = await fontsOf('/', { width: 390, height: 800 }, ls), appP = await fontsOf('/', { width: 1300, height: 900 }, ls);
const g1 = await fontsOf('/guide/', { width: 390, height: 800 }), g2 = await fontsOf('/guide/instatoon-troubleshooting/', { width: 390, height: 800 }), g3 = await fontsOf('/guide/what-is-instatoon/', { width: 1300, height: 900 });
const app = [...new Set([...appM, ...appP])].sort((a, b) => parseInt(a.match(/subset\.(\d+)/)[1]) - parseInt(b.match(/subset\.(\d+)/)[1]));
const guide = [...g1].filter((n) => g2.has(n) && g3.has(n)).sort((a, b) => parseInt(a.match(/subset\.(\d+)/)[1]) - parseInt(b.match(/subset\.(\d+)/)[1]));
const size = (n) => fs.statSync(path.join(root, 'site', 'assets', 'fonts', 'pretendard', n)).size;
const kb = (l) => (l.reduce((a, n) => a + size(n), 0) / 1024).toFixed(0) + 'KB';
console.log(`앱 홈: 휴대폰 ${appM.size}개, PC ${appP.size}개 → 미리 불러올 ${app.length}개 (${kb(app)})`, app.join(' '));
console.log(`노트: 목록 ${g1.size}개 / 글 ${g2.size}·${g3.size}개 → 공통 ${guide.length}개 (${kb(guide)})`, guide.join(' '));
fs.writeFileSync(path.join(root, 'site', 'font-preload.json'), JSON.stringify({ _설명: '첫 화면에서 실제로 받는 Pretendard 글자 조각. node dev/tools/measure-fonts.mjs 로 다시 만든다.', app, guide }, null, 2) + '\n');
await browser.close(); srv.close();
