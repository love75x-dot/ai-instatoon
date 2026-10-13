// 머리말 비교용 캡처: 홈·노트 목록·노트 글의 맨 위 100px을 모바일·PC로 저장한다. dev/snapshots/header/*.png
import fs from 'node:fs';
import path from 'node:path';
import { root, serve, launch, newPage } from '../lib/harness.mjs';

const out = path.join(root, 'dev', 'snapshots', 'header'); fs.mkdirSync(out, { recursive: true });
const srv = await serve(); const browser = await launch();
for (const [vk, vp] of [['m', { width: 390, height: 844 }], ['pc', { width: 1300, height: 900 }]]) {
  for (const [n, u] of [['1-홈', '/'], ['2-노트목록', '/guide/'], ['3-노트글', '/guide/how-to-make-instatoon/']]) {
    const { page } = await newPage(browser, srv.base, { viewport: vp, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
    await page.goto(srv.base + u); await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(out, `${vk}-${n}.png`), clip: { x: 0, y: 0, width: vp.width, height: 96 } }); await page.close();
  }
}
await browser.close(); srv.close(); console.log('머리말 캡처 6장:', path.relative(root, out));
