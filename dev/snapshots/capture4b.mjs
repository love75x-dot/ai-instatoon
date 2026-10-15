// 4b 전후 비교용 추가 캡처: ☰ 메뉴 열림, 백업 창, 노트 페이지 ☰, 3단계 백업 안내, 새 기기 홈. dev/snapshots/4b-after/ 에 저장한다.
//   node dev/snapshots/capture.mjs 4b-after   (기본 화면)  →  node dev/snapshots/capture4b.mjs   (추가 화면)  →  node dev/snapshots/compare4b.mjs (비교 HTML)
import fs from 'node:fs';
import path from 'node:path';
import { root, serve, launch, newPage } from '../lib/harness.mjs';

const out = path.join(root, 'dev', 'snapshots', '4b-after'); fs.mkdirSync(out, { recursive: true });
const srv = await serve(); const browser = await launch();
const VP = { m: { width: 390, height: 844 }, pc: { width: 1300, height: 900 } };
const shot = (page, name, o = {}) => page.screenshot({ path: path.join(out, name), type: 'jpeg', quality: 72, ...o });
for (const [vk, vp] of Object.entries(VP)) {
  const mk = async (ls = { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' }) => { const h = await newPage(browser, srv.base, { viewport: vp, ls }); await h.page.goto(srv.base + '/'); await h.page.waitForTimeout(500); return h.page; };
  let page = await mk();
  await page.evaluate(() => { S = demoState('bakery'); S.demo = false; S.mode = 'one'; S.step = 'input'; save(); render(); }); await page.waitForTimeout(300);
  await shot(page, `${vk}-10-홈-맨위.jpg`);
  await page.click('#menuBtn'); await page.waitForTimeout(450); await shot(page, `${vk}-11-메뉴열림.jpg`);
  await page.click('#menuPanel [data-menu="month"]'); await page.waitForTimeout(500); await page.click('#menuBtn'); await page.waitForTimeout(450); await shot(page, `${vk}-12-메뉴-한달기획표시.jpg`);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.evaluate(() => { S.mode = 'one'; render(); openBackupWin(); }); await page.waitForTimeout(350); await shot(page, `${vk}-13-백업창.jpg`);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.evaluate(() => { S.step = 'post'; S.toon.pics = []; delete S.toon.bkAsk; render(); }); await page.waitForTimeout(250);
  await page.evaluate(async () => { const c = document.createElement('canvas'); c.width = c.height = 8; c.getContext('2d').fillStyle = '#999'; c.getContext('2d').fillRect(0, 0, 8, 8); const b = await new Promise((r) => c.toBlob(r, 'image/png')); const fs = []; for (let i = 0; i < cuts().length; i++) fs.push(new File([b], `${i + 1}.png`, { type: 'image/png' })); await addPics(fs, 'toon'); window.scrollTo(0, 0); });
  await page.waitForTimeout(400); await shot(page, `${vk}-14-3단계-백업안내.jpg`);
  await page.close();
  page = await mk({ 'instatoon.helpSeen': '1' }); await shot(page, `${vk}-15-새기기-홈.jpg`, { fullPage: true }); await page.close();
  for (const [n, u] of [['16-노트목록', '/guide/'], ['17-노트글', '/guide/how-to-make-instatoon/']]) {
    const h = await newPage(browser, srv.base, { viewport: vp, ls: { 'instatoon.helpSeen': '1' } }); await h.page.goto(srv.base + u); await h.page.waitForTimeout(400);
    await shot(h.page, `${vk}-${n}-맨위.jpg`, { clip: { x: 0, y: 0, width: vp.width, height: 260 } });
    await h.page.click('#menuBtn'); await h.page.waitForTimeout(450); await shot(h.page, `${vk}-${n}-메뉴열림.jpg`); await h.page.close();
  }
}
await browser.close(); srv.close(); console.log('추가 캡처 저장:', path.relative(root, out));
