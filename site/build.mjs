// index.html(아티팩트 원본) → instatoon.html(파일 버전) + ../deploy/index.html(배포용)
// + /guide/ 정적 페이지, sitemap.xml, robots.txt, 404.html (guide/build-guide.mjs)
// 사용: node site/build.mjs   (build.sh와 같은 결과, bash/python 불필요)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, 'index.html'), 'utf8');
const NL = '\n';
const head = [
  '<!doctype html>', '<html lang="ko">', '<head>', '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<meta name="description" content="업종과 가게 이야기만 입력하면 인스타툰 기획·대본·컷 구성까지 정리해 주는 도구. 인스타툰 제작 가이드도 함께 제공합니다.">',
  '<meta name="robots" content="index,follow">',
  '<link rel="canonical" href="https://www.ai-instatoon.com/">',
  '<meta property="og:type" content="website"><meta property="og:site_name" content="인스타툰 연재실"><meta property="og:locale" content="ko_KR">',
  '<meta property="og:title" content="인스타툰 연재실"><meta property="og:description" content="업종과 가게 이야기만 입력하면 인스타툰 기획·대본·컷 구성까지 정리해 주는 도구."><meta property="og:url" content="https://www.ai-instatoon.com/">',
].join(NL) + NL;
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

await import('./guide/build-guide.mjs');
