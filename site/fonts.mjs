// 글꼴 직접 호스팅(6단계): 외부(jsDelivr·Google Fonts) 대신 site/assets/fonts/ 의 woff2를 쓴다.
// - 화면 글꼴 Pretendard Variable: 글자 구간별(dynamic-subset) woff2. 첫 화면에 쓰는 구간만 <link rel="preload">(site/font-preload.json).
// - 그림 글자용(Gothic A1 800 · Black Han Sans · Gaegu 700): toon.css, 화면을 막지 않게 늦게 불러옴.
// 파일을 새로 받으려면 node dev/tools/fetch-fonts.mjs, 미리 불러올 구간을 다시 정하려면 node dev/tools/measure-fonts.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, 'assets', 'fonts');
export const pretendardCssFile = () => fs.readFileSync(path.join(dir, 'pretendard.css'), 'utf8').trim();
export const FONT_CSS_LINK = '<link rel="stylesheet" href="/assets/fonts/pretendard.css">';
const pre = (() => { try { return JSON.parse(fs.readFileSync(path.join(here, 'font-preload.json'), 'utf8')); } catch { return { app: [], guide: [] }; } })();
for (const k of ['app', 'guide']) for (const n of pre[k] || []) if (!fs.existsSync(path.join(dir, 'pretendard', n))) throw new Error(`font-preload.json의 ${n} 파일이 assets/fonts/pretendard/ 에 없어요`);
export const preloadTags = (kind) => (pre[kind] || []).map((n) => `<link rel="preload" href="/assets/fonts/pretendard/${n}" as="font" type="font/woff2" crossorigin>`).join('');
/* 앱 홈: 미리 불러오기 + 글꼴 CSS를 페이지 안에(요청 한 번 줄임) */
export const appFontHead = () => `${preloadTags('app')}<style>${pretendardCssFile()}</style>`;
/* 노트 페이지: 미리 불러오기 + 같은 사이트의 CSS 파일 */
export const guideFontHead = () => `${preloadTags('guide')}${FONT_CSS_LINK}`;
