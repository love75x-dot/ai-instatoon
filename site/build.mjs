// index.html(아티팩트 원본) → instatoon.html(파일 버전) + ../deploy/index.html(배포용)
// + /guide/ 정적 페이지, sitemap.xml, robots.txt, 404.html (guide/build-guide.mjs)
// 사용: node site/build.mjs   (build.sh와 같은 결과, bash/python 불필요)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { gaId, gaSnippet } from './analytics.mjs';
import { appFontHead, FONT_CSS_LINK } from './fonts.mjs';
import { exampleGalleryLine } from './examples.mjs';
import { OG_IMAGE, ogImageUrl, THEME_COLOR, NAVER_VERIFY, ORIGIN, SITE_NAME, footerMetaHtml, appSiteInfoLine } from './site-meta.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
// 운영자·문의·마지막 업데이트(푸터)와 앱 안(사용 방법)의 SITE_INFO를 site-info.json 값으로 채운다. 값이 비면 그 항목은 보이지 않는다.
const src = fs.readFileSync(path.join(here, 'index.html'), 'utf8')
  .replace(/const SITE_INFO=\{[^\n]*\};/, () => appSiteInfoLine())
  .replace(/const EXAMPLES=\{[^\n]*\};/, () => exampleGalleryLine()) // 예시 갤러리 그림·글(site/assets/examples/examples.json)
  .replace(FONT_CSS_LINK, () => appFontHead()) // 글꼴: 첫 화면 글자 조각 미리 불러오기 + CSS를 페이지 안에(직접 호스팅)
  .replace('<p class="fmeta" id="fmeta"></p>', () => `<p class="fmeta" id="fmeta">${footerMetaHtml()}</p>`);
const NL = '\n';
const head = [
  '<!doctype html>', '<html lang="ko">', '<head>', '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<meta name="description" content="분야와 내 이야기만 입력하면 인스타툰 기획·대본·컷 구성까지 정리해 주는 도구. 인스타툰 제작 가이드도 함께 제공합니다.">',
  '<meta name="robots" content="index,follow">',
  `<meta name="theme-color" content="${THEME_COLOR}">${NAVER_VERIFY}<link rel="manifest" href="/manifest.webmanifest">`,
  '<link rel="canonical" href="https://www.ai-instatoon.com/">',
  '<meta property="og:type" content="website"><meta property="og:site_name" content="인스타툰 연재실"><meta property="og:locale" content="ko_KR">',
  '<meta property="og:title" content="인스타툰 연재실"><meta property="og:description" content="분야와 내 이야기만 입력하면 인스타툰 기획·대본·컷 구성까지 정리해 주는 도구."><meta property="og:url" content="https://www.ai-instatoon.com/">',
  `<meta property="og:image" content="${ogImageUrl}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="${OG_IMAGE.width}"><meta property="og:image:height" content="${OG_IMAGE.height}"><meta property="og:image:alt" content="${OG_IMAGE.alt}"><meta property="og:image:secure_url" content="${ogImageUrl}"><link rel="image_src" href="${ogImageUrl}">`,
  `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${SITE_NAME}"><meta name="twitter:description" content="분야와 내 이야기만 입력하면 인스타툰 기획·대본·컷 구성까지 정리해 주는 도구."><meta name="twitter:image" content="${ogImageUrl}"><meta name="twitter:image:alt" content="${OG_IMAGE.alt}">`,
  gaSnippet(gaId(), { content_group: '인스타툰 제작 도구' }), // 측정 ID가 설정돼 있을 때만 삽입
].filter(Boolean).join(NL) + NL;
// 머리(<head>)와 본문(<body>)을 명시적으로 나눈다: 브라우저는 알아서 처리하지만, 미리보기를 만드는 프로그램(카카오톡 등)이 머리 끝을 못 찾지 않게
const out = head + src.replace('<a class="skip" href="#main">', () => '</head>\n<body>\n<a class="skip" href="#main">') + '\n</body>\n</html>\n';

const js = [...src.matchAll(/<script(?: type="text\/plain" id="appjs")?>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
new vm.Script(js); // 문법 오류면 여기서 예외
console.log('JS 문법 OK');

// 파일 버전(site/instatoon.html)은 디스크에서 열어도 그림·글꼴이 보이게 /assets/ 주소를 상대 주소(assets/…)로 바꾼다. site/assets/ 폴더와 같은 곳에 두면 된다.
fs.writeFileSync(path.join(here, 'instatoon.html'), out.replace(/(["'(])\/assets\//g, '$1assets/'));
const dep = path.join(here, '..', 'deploy');
fs.mkdirSync(dep, { recursive: true });
fs.writeFileSync(path.join(dep, 'index.html'), out);
for (const f of ['favicon.svg', 'favicon.ico', 'favicon-32x32.png', 'apple-touch-icon.png']) fs.copyFileSync(path.join(here, f), path.join(dep, f));
// 이미지(샘플 그림·공유 이미지·아이콘)와 홈 화면 추가용 manifest
fs.cpSync(path.join(here, 'assets'), path.join(dep, 'assets'), { recursive: true, filter: (p) => !p.split(path.sep).join("/").includes("/examples/src") }); // 예시 그림 원본(examples/src)은 배포에 넣지 않는다. 샘플 그림·공유 이미지·아이콘·글꼴(assets/fonts)
fs.copyFileSync(path.join(here, 'manifest.webmanifest'), path.join(dep, 'manifest.webmanifest'));
// 보안 헤더(Cloudflare 에셋 헤더 파일): 손으로 관리하는 원본은 site/_headers, 배포 폴더로는 여기서 복사한다(deploy/는 git에 두지 않는다)
fs.copyFileSync(path.join(here, '_headers'), path.join(dep, '_headers'));
console.log('instatoon.html, deploy/index.html, deploy/favicon.* · apple-touch-icon.png · assets/ · manifest · _headers 생성 완료');

await import('./guide/build-guide.mjs');
