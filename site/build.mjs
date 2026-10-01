// index.html(아티팩트 원본) → instatoon.html(파일 버전) + ../deploy/index.html(Cloudflare Pages용)
// 사용: node site/build.mjs   (build.sh와 같은 결과, bash/python 불필요)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, 'index.html'), 'utf8');
const head = '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n';
const out = head + src + '\n</body>\n</html>\n';

const js = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
new vm.Script(js); // 문법 오류면 여기서 예외
console.log('JS 문법 OK');

fs.writeFileSync(path.join(here, 'instatoon.html'), out);
const dep = path.join(here, '..', 'deploy');
fs.mkdirSync(dep, { recursive: true });
fs.writeFileSync(path.join(dep, 'index.html'), out);
fs.copyFileSync(path.join(here, 'favicon.svg'), path.join(dep, 'favicon.svg'));
console.log('instatoon.html, deploy/index.html, deploy/favicon.svg 생성 완료');
