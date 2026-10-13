// 리뉴얼 검사용 공통 도구: deploy/ 폴더를 로컬 서버로 띄우고 playwright-core로 크롬을 연다.
// 외부 요청(폰트·CDN·구글 API)은 모두 가짜 응답이라 인터넷 없이 같은 결과가 나온다.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const types = { '.html': 'text/html; charset=utf-8', '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };

export async function serve(dir = path.join(root, 'deploy')) {
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    let f = path.join(dir, p);
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(fs.readFileSync(path.join(dir, '404.html'))); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
    res.end(fs.readFileSync(f));
  }).listen(0);
  await new Promise((r) => srv.on('listening', r));
  return { base: `http://localhost:${srv.address().port}`, close: () => srv.close() };
}

function findChromium() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM;
  const dirs = [process.env.PLAYWRIGHT_BROWSERS_PATH, path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright'), path.join(os.homedir(), '.cache', 'ms-playwright'), path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright')].filter(Boolean);
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    for (const n of fs.readdirSync(d).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
      for (const rel of ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe', 'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
        const f = path.join(d, n, rel); if (fs.existsSync(f)) return f;
      }
    }
  }
  return null;
}

export async function launch() {
  try { return await chromium.launch(); } catch (e) {
    const exe = findChromium();
    if (!exe) throw new Error('크롬을 찾지 못했어요. PW_CHROMIUM=<chrome 실행 파일 경로> 로 알려 주세요. (' + e.message.split('\n')[0] + ')');
    return await chromium.launch({ executablePath: exe });
  }
}

// 시각·난수를 고정해 프롬프트가 매번 똑같이 나오게 한다.
const FREEZE = `(() => {
  const D = Date; let shift = 0; try { shift = (Number(sessionStorage.getItem('__shift')) || 0) * 86400000; } catch (_) {} const T = new Date('2026-10-13T12:00:00+09:00').getTime() + shift;
  class FD extends D { constructor(...a) { if (a.length) super(...a); else super(T); } static now() { return T; } }
  window.Date = FD;
  let s = 12345; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
})();`;

/** opts: { viewport, freeze=true, noIDB=false, ls: {key:value} (처음 한 번만 채움), keepLs } */
export async function newPage(browser, base, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1300, height: 1000 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::/.test(m.text())) errors.push(m.text()); });
  await page.route('**/*', (r) => {
    const u = r.request().url();
    if (u.startsWith(base)) return r.continue();
    if (/googletagmanager|google-analytics/.test(u)) return r.abort();
    if (/generativelanguage\.googleapis\.com/.test(u)) return r.fulfill({ json: { candidates: [{ content: { parts: [{ text: '{}' }] } }] } });
    const ct = /\.js(\?|$)|cdnjs/.test(u) ? 'text/javascript' : 'text/css';
    return r.fulfill({ status: 200, contentType: ct, body: '' });
  });
  if (opts.freeze !== false) await page.addInitScript(FREEZE);
  if (opts.noIDB) await page.addInitScript(() => { try { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); } catch (_) {} });
  if (opts.ls) {
    await page.addInitScript(({ ls }) => {
      if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded', '1');
      localStorage.clear(); for (const [k, v] of Object.entries(ls)) localStorage.setItem(k, v);
    }, { ls: opts.ls });
  }
  return { page, ctx, errors };
}

export const log = { pass: (m) => console.log('[PASS]', m), fail: (m) => console.log('[FAIL]', m) };
export function checker() {
  let fail = 0;
  return { ok: (c, m) => { if (c) log.pass(m); else { fail++; log.fail(m); } return !!c; }, get fail() { return fail; } };
}
