// 노란 "툰" 로고 아이콘 만들기(사람이 가끔 돌리는 도구, 빌드에는 들어가지 않음):
//   node dev/tools/make-logo-icons.mjs
// site/favicon.svg · favicon-32x32.png · favicon.ico · apple-touch-icon.png · assets/icons/icon-192.png · icon-512.png 를 만들고,
// site/index.html 의 머리 안 인라인 파비콘(data:image/svg+xml)도 같은 그림으로 바꾼다.
// "툰" 글자는 IntroSquare 800(나눔스퀘어 네오 OFL 수정본)의 윤곽선을 그대로 따서 경로로 넣었다(기기에 글꼴이 없어도 모양이 같다).
//   글자 윤곽선(글꼴 단위 1000, 글자 경계 34,-158 ~ 914,758). 노랑 #FFD60A 바탕, 글자 #111.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { root } from '../lib/harness.mjs';

const GLYPH = 'M274 433L822 433L822 329L146 329L146 758L803 758L803 653L274 653L274 597L803 597L803 494L274 494L274 433ZM34 146L34 255L914 255L914 146L538 146L538 22L410 22L410 146L34 146ZM141 77L269 77L269 -42L827 -42L827 -158L141 -158L141 77Z', BB = [34, -158, 914, 758];
const YEL = '#FFD60A', INK = '#111111';
/** 100×100 칸에 노란 바탕과 가운데 "툰". r: 모서리 둥글기(0이면 꽉 찬 사각형 = 홈 화면·maskable용), h: 글자 높이(칸의 %) */
function svg({ r, h }) {
  const s = h / (BB[3] - BB[1]), w = (BB[2] - BB[0]) * s, x0 = 50 - w / 2 - BB[0] * s, y0 = 50 + (BB[3] + BB[1]) / 2 * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100"${r ? ` rx="${r}"` : ''} fill="${YEL}"/><path transform="translate(${x0.toFixed(2)} ${y0.toFixed(2)}) scale(${s.toFixed(5)} -${s.toFixed(5)})" fill="${INK}" d="${GLYPH}"/></svg>`;
}
const png = (s, size) => sharp(Buffer.from(s), { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
const tab = svg({ r: 24, h: 60 }), full = svg({ r: 0, h: 46 });
const w = (rel, buf) => { fs.writeFileSync(path.join(root, 'site', rel), buf); console.log(rel, buf.length + 'B'); };
w('favicon.svg', tab);
w('favicon-32x32.png', await png(tab, 32));
// ico: 16·32·48 PNG 담기
const sizes = [16, 32, 48], imgs = await Promise.all(sizes.map((n) => png(tab, n)));
const head = Buffer.alloc(6); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let off = 6 + 16 * sizes.length; const dir = sizes.map((n, i) => { const e = Buffer.alloc(16); e[0] = n; e[1] = n; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(imgs[i].length, 8); e.writeUInt32LE(off, 12); off += imgs[i].length; return e; });
w('favicon.ico', Buffer.concat([head, ...dir, ...imgs]));
w('apple-touch-icon.png', await png(full, 180));
w('assets/icons/icon-192.png', await png(full, 192));
w('assets/icons/icon-512.png', await png(full, 512));
// 머리 안 인라인 파비콘
const f = path.join(root, 'site', 'index.html'); let t = fs.readFileSync(f, 'utf8');
const re = /(<link rel="icon" type="image\/svg\+xml" href=")data:image\/svg\+xml,[^"]*(")/;
if (!re.test(t)) throw new Error('index.html 에서 인라인 파비콘을 못 찾았어요');
t = t.replace(re, (m, a, b) => a + 'data:image/svg+xml,' + encodeURIComponent(tab) + b); fs.writeFileSync(f, t); console.log('index.html 인라인 파비콘 갱신');
