// 글꼴 직접 호스팅: 외부(jsDelivr·Google Fonts) 대신 site/assets/fonts/ 의 woff2를 쓴다.
// - 화면 글꼴 IntroSquare(400·700·800): 네이버 나눔스퀘어 네오(OFL)를 한글 2,350자·호환 자모·사이트에 실제 쓰인 글자로 줄인 수정본. 앱·노트·개인정보·404·소개 화면 모두 이것을 먼저 쓴다.
//   (예약 글꼴 이름 때문에 이름을 IntroSquare 로 바꿨다. 라이선스 전문: assets/fonts/licenses/NanumSquareNeo-OFL.txt)
// - 조각에 없는 글자(드문 한글·한자 등)는 Pretendard Variable 이 대신 그린다: 글자 구간별(dynamic-subset) woff2, 필요한 조각만 받음.
// - 그림 글자용(Gothic A1 800 · Black Han Sans · Gaegu 700): toon.css, 화면을 막지 않게 늦게 불러옴.
// 파일을 새로 받으려면 node dev/tools/fetch-fonts.mjs (Pretendard·그림 글자용). IntroSquare 는 원본 나눔스퀘어 네오 woff2 에서 글자 조각으로 만든다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, 'assets', 'fonts');
export const pretendardCssFile = () => fs.readFileSync(path.join(dir, 'pretendard.css'), 'utf8').trim();
export const introSquareCssFile = () => fs.readFileSync(path.join(dir, 'introsquare.css'), 'utf8').trim();
export const FONT_CSS_LINK = '<link rel="stylesheet" href="/assets/fonts/pretendard.css">';
export const INTRO_FONTS = ['IntroSquare-400.woff2', 'IntroSquare-700.woff2', 'IntroSquare-800.woff2'];
for (const n of INTRO_FONTS) if (!fs.existsSync(path.join(dir, 'introsquare', n))) throw new Error(`assets/fonts/introsquare/${n} 파일이 없어요`);
export const preloadTags = () => INTRO_FONTS.map((n) => `<link rel="preload" href="/assets/fonts/introsquare/${n}" as="font" type="font/woff2" crossorigin>`).join('');
/* 앱 홈: 미리 불러오기 + 글꼴 CSS를 페이지 안에(요청 한 번 줄임). Pretendard 는 조각에 없는 글자용이라 미리 불러오지 않는다 */
export const appFontHead = () => `${preloadTags()}<style>${introSquareCssFile()}${pretendardCssFile()}</style>`;
/* 노트 페이지: 미리 불러오기 + IntroSquare CSS는 페이지 안에, Pretendard(대체)는 같은 사이트의 CSS 파일 */
export const guideFontHead = () => `${preloadTags()}<style>${introSquareCssFile()}</style>${FONT_CSS_LINK}`;
