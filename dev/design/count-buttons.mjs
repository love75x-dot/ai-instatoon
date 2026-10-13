// 첫 화면(1단계)에서 눈에 보이는 눌러야 할 것(버튼·링크·펼침)의 개수를 센다. main 브랜치의 빌드와 지금 빌드를 비교할 때 쓴다.
//   node dev/design/count-buttons.mjs [비교할 index.html 경로]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { root, serve, launch, newPage } from '../lib/harness.mjs';

const other = process.argv[2];
const dirs = { 지금: path.join(root, 'deploy') };
if (other) { const t = fs.mkdtempSync(path.join(os.tmpdir(), 'cmp-')); fs.copyFileSync(other, path.join(t, 'index.html')); fs.copyFileSync(path.join(root, 'deploy', '404.html'), path.join(t, '404.html')); dirs['이전'] = t; }
const browser = await launch();
for (const [name, dir] of Object.entries(dirs)) {
  const srv = await serve(dir);
  for (const [vk, vp] of [['휴대폰 390', { width: 390, height: 844 }], ['PC 1300', { width: 1300, height: 900 }]]) {
    const { page } = await newPage(browser, srv.base, { viewport: vp, ls: { 'instatoon.helpSeen': '1', 'instatoon.key': 'TEST' } });
    await page.goto(srv.base + '/'); await page.waitForTimeout(500);
    const n = await page.evaluate(() => {
      const root = document.querySelector('.wrap'), skip = '.gfoot,.faq,.galslot,#help,#tour,#keySheet,.dock';
      const els = [...root.querySelectorAll('button, a[href], summary, input:not([type=hidden]), textarea, select')].filter((e) => !e.closest(skip) && !e.closest('[hidden]') && !(() => { let d = e.closest('details'); while (d) { if (!d.open && !(e.tagName === 'SUMMARY' && e.parentElement === d)) return true; d = d.parentElement && d.parentElement.closest('details'); } return false; })() && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden');
      const kinds = { 버튼: 0, 링크: 0, 펼침: 0, 입력: 0 };
      els.forEach((e) => { const t = e.tagName; if (t === 'BUTTON') kinds.버튼++; else if (t === 'A') kinds.링크++; else if (t === 'SUMMARY') kinds.펼침++; else kinds.입력++; });
      return { total: els.length, ...kinds };
    });
    console.log(`${name} · ${vk}: 버튼 ${n.버튼} · 링크 ${n.링크} · 펼침 ${n.펼침} · 입력 ${n.입력} (합계 ${n.total})`);
    await page.close();
  }
  srv.close();
}
await browser.close();
