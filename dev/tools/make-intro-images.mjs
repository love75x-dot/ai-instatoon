// 소개 화면 그림 변환(사람이 가끔 돌리는 도구, 빌드에는 들어가지 않음):
//   node dev/tools/make-intro-images.mjs
// docs/drafts/first-screen-draft/img/ 의 줄인 그림(JPG·PNG)을 site/assets/intro/ 의 WebP로 바꾼다. 하위 폴더의 PNG 원본은 읽지 않는다.
//   예시 18장(cvs·banchan·burger 1~6) → ex-cvs1-400.webp · ex-cvs1-800.webp …
//   그림체 13장 → th-00-320.webp · th-00-640.webp …
//   (연재 캐릭터 series-main.webp 는 색을 바꾼 그림이라 이 도구가 만들지 않는다)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { root } from '../lib/harness.mjs';

const draft = path.join(root, 'docs', 'drafts', 'first-screen-draft', 'img'), out = path.join(root, 'site', 'assets', 'intro');
fs.mkdirSync(out, { recursive: true });
let total = 0;
async function conv(src, name, w, q = 78) {
  const buf = await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: q }).toBuffer();
  fs.writeFileSync(path.join(out, name), buf); total += buf.length; return buf.length;
}
for (const shop of ['cvs', 'banchan', 'burger']) for (let n = 1; n <= 6; n++) {
  const src = path.join(draft, 'examples', `${shop}${n}.jpg`);
  for (const w of [400, 800]) await conv(src, `ex-${shop}${n}-${w}.webp`, w);
}
const themes = fs.readdirSync(path.join(draft, 'themes')).filter((f) => /^\d\d_[a-z0-9]+\.jpg$/.test(f)).sort();
if (themes.length !== 13) throw new Error(`그림체 그림이 13장이어야 해요 (${themes.length}장)`);
for (const f of themes) for (const w of [320, 640]) await conv(path.join(draft, 'themes', f), `th-${f.slice(0, 2)}-${w}.webp`, w);
// 연재 캐릭터(series-main.webp)는 유니폼 색을 바꾼 그림이라 여기서 만들지 않는다(원본 main_web.png 를 다시 변환하면 초록·주황 유니폼으로 돌아감)
console.log(`${fs.readdirSync(out).length}개 파일, 합계 ${(total / 1024).toFixed(0)}KB → site/assets/intro/`);
