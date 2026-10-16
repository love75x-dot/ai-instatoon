// 예시 갤러리(7단계): site/assets/examples/examples.json 의 그림·글을 앱(const EXAMPLES=…)에 넣는다.
// 그림(WebP 두 크기)이 하나라도 없으면 빌드를 멈춘다. 파일을 비워 두면(그림 없음) 갤러리는 보이지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets', 'examples');
export function exampleGalleryLine() {
  let data;
  try { data = JSON.parse(fs.readFileSync(path.join(dir, 'examples.json'), 'utf8')); } catch { return 'const EXAMPLES={};'; }
  const { _설명, ...E } = data;
  for (const c of E.cuts || []) for (const w of [360, 720]) if (!fs.existsSync(path.join(dir, `${c.file}-${w}.webp`))) throw new Error(`예시 그림이 없어요: ${c.file}-${w}.webp (node dev/tools/make-examples.mjs)`);
  for (const c of E.cuts || []) if (!c.alt || !c.cap || !c.role) throw new Error(`예시 ${c.n}컷에 role·cap·alt가 모두 있어야 해요`);
  return `const EXAMPLES=${JSON.stringify(E).replace(/</g, '\\u003c')};`;
}
