// 지금 화면 캡처 저장: 리뉴얼 전/후를 눈으로 비교하기 위한 기준 사진.
//   node dev/snapshots/capture.mjs [폴더이름]     (기본: before → dev/snapshots/before/)
import fs from 'node:fs';
import path from 'node:path';
import { root, serve, launch, newPage } from '../lib/harness.mjs';

const name = process.argv[2] || 'before';
const out = path.join(root, 'dev', 'snapshots', name); fs.mkdirSync(out, { recursive: true });
const srv = await serve(); const browser = await launch();
const VP = { m: { width: 390, height: 844 }, t: { width: 768, height: 1000 }, pc: { width: 1300, height: 900 } };
const TASTE_ON = JSON.stringify({ ok: true, taste: true, sitekey: 'S', perDay: { make: 1, month: 1 } });
const shots = [
  ['01-시작', () => { S = blank(); S.step = 'input'; S.mode = 'one'; }],
  ['02-1단계-입력(보리당)', () => { S = demoState('bakery'); S.step = 'input'; S.mode = 'one'; }],
  ['03-2단계-컷편집(보리당)', () => { S = demoState('bakery'); S.step = 'edit'; S.mode = 'one'; }],
  ['04-3단계-그림저장(보리당)', () => { S = demoState('bakery'); S.step = 'post'; S.mode = 'one'; }],
  ['05-한달기획', () => { S = demoState('bakery'); S.mode = 'month'; }],
];
for (const [vk, vp] of Object.entries(VP)) {
  const { page } = await newPage(browser, srv.base, { viewport: vp, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
  await page.route('**/api/ai/config', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: TASTE_ON }));
  await page.goto(srv.base + '/'); await page.waitForTimeout(600);
  for (const [n, fn] of shots) {
    await page.evaluate(`(${fn.toString()})(); save(); render();`); await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(out, `${vk}-${n}.jpg`), fullPage: true, type: 'jpeg', quality: 70 });
  }
  for (const [n, u] of [['08-콘텐츠가이드목록', '/guide/'], ['09-가이드글', '/guide/how-to-make-instatoon/']]) {
    await page.goto(srv.base + u); await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(out, `${vk}-${n}.jpg`), fullPage: true, type: 'jpeg', quality: 70 });
  }
}
await browser.close(); srv.close();
console.log(fs.readdirSync(out).length + '장 저장:', path.relative(root, out));
