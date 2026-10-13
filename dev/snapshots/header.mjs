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
// 홈의 휴대폰 ⋯ 메뉴를 연 모습, 태블릿 한 줄 모습
{
  const { page } = await newPage(browser, srv.base, { viewport: { width: 390, height: 844 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
  await page.goto(srv.base + '/'); await page.waitForTimeout(400); await page.click('#hmoreBtn'); await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(out, 'm-1b-홈-메뉴열림.png'), clip: { x: 0, y: 0, width: 390, height: 330 } }); await page.close();
  const t = await newPage(browser, srv.base, { viewport: { width: 768, height: 900 }, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
  await t.page.goto(srv.base + '/'); await t.page.waitForTimeout(400);
  await t.page.screenshot({ path: path.join(out, 'tablet-1-홈.png'), clip: { x: 0, y: 0, width: 768, height: 96 } });
}
await browser.close(); srv.close(); console.log('머리말 캡처:', path.relative(root, out));
