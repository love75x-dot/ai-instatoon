// 예시 그림 변환(사람이 가끔 돌리는 도구, 빌드에는 들어가지 않음):
//   node dev/tools/make-examples.mjs
// site/assets/examples/src/ 의 원본(ex1-01.jpg ~ ex1-06.jpg, png·jpeg·webp도 받음)을 웹용 WebP 두 크기(폭 360·720, 세로는 원본 비율 그대로)로 줄여
// site/assets/examples/ex1-01-360.webp · ex1-01-720.webp … 로 저장한다. 원본(src/)은 용량이 커서 git에 올리지 않는다.
// 용량 한도: 360폭 한 장 40KB 이하, 720폭 한 장 120KB 이하(넘으면 품질을 낮춰 다시 만든다).
import fs from 'node:fs';
import path from 'node:path';
import { launch, root } from '../lib/harness.mjs';

const dir = path.join(root, 'site', 'assets', 'examples'), src = path.join(dir, 'src');
const files = fs.existsSync(src) ? fs.readdirSync(src).filter((f) => /^ex\d+-\d+\.(jpe?g|png|webp)$/i.test(f)).sort() : [];
if (!files.length) { console.log('site/assets/examples/src/ 에 ex1-01.jpg … 가 없어요.'); process.exit(1); }
const LIMIT = { 360: 40 * 1024, 720: 120 * 1024 };
const browser = await launch(); const page = await (await browser.newContext()).newPage(); await page.setContent('<canvas id="c"></canvas>');
const mime = (f) => /\.png$/i.test(f) ? 'image/png' : /\.webp$/i.test(f) ? 'image/webp' : 'image/jpeg';
let total = 0;
for (const f of files) {
  const b64 = fs.readFileSync(path.join(src, f)).toString('base64'), base = f.replace(/\.[a-z]+$/i, '');
  for (const w of [360, 720]) {
    let q = 0.82, out;
    for (let i = 0; i < 6; i++) {
      const r = await page.evaluate(async ({ b64, m, w, q }) => {
        const img = new Image(); img.src = `data:${m};base64,${b64}`; await img.decode();
        const h = Math.round(img.naturalHeight * w / img.naturalWidth); let cur = img, cw = img.naturalWidth, ch = img.naturalHeight;
        while (cw / 2 > w) { const c = document.createElement('canvas'); c.width = Math.round(cw / 2); c.height = Math.round(ch / 2); const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, c.width, c.height); cur = c; cw = c.width; ch = c.height; }
        const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, w, h);
        return { url: c.toDataURL('image/webp', q), w, h, sw: img.naturalWidth, sh: img.naturalHeight };
      }, { b64, m: mime(f), w, q });
      out = { ...r, buf: Buffer.from(r.url.split(',')[1], 'base64') };
      if (out.buf.length <= LIMIT[w]) break; q -= 0.1;
    }
    fs.writeFileSync(path.join(dir, `${base}-${w}.webp`), out.buf); total += out.buf.length;
    console.log(`${base}-${w}.webp ${out.w}×${out.h} ${(out.buf.length / 1024).toFixed(0)}KB (원본 ${out.sw}×${out.sh}, 품질 ${q.toFixed(2)})`);
  }
}
console.log(`합계 ${(total / 1024).toFixed(0)}KB`);
await browser.close();
