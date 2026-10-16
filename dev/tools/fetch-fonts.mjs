// 웹폰트를 사이트 안(site/assets/fonts/)에 내려받아 직접 호스팅하는 도구. 글꼴을 바꾸거나 버전을 올릴 때만 사람이 돌린다(빌드에는 들어가지 않음).
//   node dev/tools/fetch-fonts.mjs
// - Pretendard Variable(화면 글꼴): jsDelivr의 dynamic-subset(글자 구간별 woff2 92개)을 그대로 받아 pretendard.css + pretendard/*.woff2
// - 그림 글자용 Google Fonts: Gothic A1(800만 — 캔버스 글씨에서 쓰는 굵기), Black Han Sans, Gaegu(700) → toon.css + toon/*.woff2
// 두 CSS 모두 font-display: swap, 글꼴 주소는 /assets/fonts/… (같은 사이트). 이미 받은 파일은 건너뛴다.
import fs from 'node:fs';
import path from 'node:path';
import { root } from '../lib/harness.mjs';

const OUT = path.join(root, 'site', 'assets', 'fonts');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const PRETENDARD = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const GOOGLE = 'https://fonts.googleapis.com/css2?family=Gothic+A1:wght@800&family=Black+Han+Sans&family=Gaegu:wght@700&display=swap';
fs.mkdirSync(path.join(OUT, 'pretendard'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'toon'), { recursive: true });

const text = async (u, ua) => { const r = await fetch(u, ua ? { headers: { 'user-agent': ua } } : {}); if (!r.ok) throw new Error(u + ' ' + r.status); return r.text(); };
const bin = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(u + ' ' + r.status); return Buffer.from(await r.arrayBuffer()); };
const pool = async (items, n, fn) => { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k]); } })); };

async function build(cssUrl, ua, dir, resolve) {
  let css = (await text(cssUrl, ua)).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\} /g, '}\n').trim();
  const urls = [...new Set([...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1].replace(/['"]/g, '')))];
  let n = 0, bytes = 0;
  await pool(urls, 12, async (u) => {
    const abs = resolve(u), name = path.basename(abs.split('?')[0]), file = path.join(OUT, dir, name);
    if (!fs.existsSync(file)) fs.writeFileSync(file, await bin(abs));
    bytes += fs.statSync(file).size; n++;
    css = css.split(u).join(`/assets/fonts/${dir}/${name}`);
  });
  if (!/font-display:\s*swap/.test(css)) throw new Error(dir + ': font-display: swap 이 없어요');
  return { css: css + '\n', n, bytes };
}
const p = await build(PRETENDARD, null, 'pretendard', (u) => new URL(u, PRETENDARD).href);
fs.writeFileSync(path.join(OUT, 'pretendard.css'), p.css);
const g = await build(GOOGLE, UA, 'toon', (u) => u);
fs.writeFileSync(path.join(OUT, 'toon.css'), g.css);
console.log(`pretendard: 파일 ${p.n}개 ${(p.bytes / 1024 / 1024).toFixed(1)}MB, css ${(p.css.length / 1024).toFixed(0)}KB`);
console.log(`toon(Gothic A1 800 · Black Han Sans · Gaegu 700): 파일 ${g.n}개 ${(g.bytes / 1024 / 1024).toFixed(1)}MB, css ${(g.css.length / 1024).toFixed(0)}KB`);
