// 사이트 공통 정보(5단계): 운영자·문의 표시, 마지막 업데이트 날짜(빌드 때 자동), 공유 이미지·테마색.
// 운영자 이름·문의 수단은 site/site-info.json 에 실제 확인된 값이 있을 때만 표시한다(없으면 그 항목은 보이지 않고, 가짜 값은 넣지 않는다).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
// 시험용: SITE_INFO_FILE 로 다른 파일을 가리킬 수 있다(빌드·배포에서는 쓰지 않음)
const info = (() => { try { return JSON.parse(fs.readFileSync(process.env.SITE_INFO_FILE || path.join(here, 'site-info.json'), 'utf8')); } catch { return {}; } })();
export const siteInfo = {
  operatorName: String(info.operatorName || '').trim(),
  contactEmail: String(info.contactEmail || '').trim(),
  contactUrl: String(info.contactUrl || '').trim(),
  adsensePublisherId: String(info.adsensePublisherId || '').trim(),
};
if (siteInfo.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siteInfo.contactEmail)) throw new Error('site-info.json contactEmail 형식 오류');
if (siteInfo.contactUrl && !/^https:\/\/[^\s"'<>]+$/.test(siteInfo.contactUrl)) throw new Error('site-info.json contactUrl은 https:// 로 시작하는 주소여야 해요');
if (siteInfo.adsensePublisherId && !/^pub-\d{10,20}$/.test(siteInfo.adsensePublisherId)) throw new Error('site-info.json adsensePublisherId는 pub-숫자 형식');

export const ORIGIN = 'https://www.ai-instatoon.com';
export const SITE_NAME = '인스타툰 연재실';
export const THEME_COLOR = '#ffffff';
// 네이버 서치어드바이저 사이트 소유 확인 태그(비밀 값이 아님, 모든 페이지 <head>에 들어감)
export const NAVER_VERIFY = '<meta name="naver-site-verification" content="7dc9647f6cf9532cdd20244898cc8b60bdd7f13b" />';
/* 공유 이미지(og:image·트위터 카드): 1200×630. v2(캐릭터 2명 네 칸). 이전 흑백 심플 이미지(og-default.png)는 파일만 남겨 둠. 예시 그림 6장을 받으면 마지막 그림으로 바꾼다(site/assets/examples/) */
export const OG_IMAGE = { path: '/assets/og/og-v2.png', width: 1200, height: 630, alt: `${SITE_NAME} — 팔로워 터지는 인스타툰, 복잡한 툴 없이 웹에서 바로 제작하세요` };
export const ogImageUrl = ORIGIN + OG_IMAGE.path;

/* 마지막 업데이트 날짜: 빌드한 날(한국 시간). 시험·재현용으로 BUILD_DATE=YYYY-MM-DD 로 고정할 수 있다 */
export function buildDate() {
  const env = String(process.env.BUILD_DATE || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(env)) return env;
  return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* 문의 수단(링크가 있으면 링크, 없으면 이메일). 둘 다 비면 null */
export function contactParts() {
  if (siteInfo.contactUrl) return { href: siteInfo.contactUrl, text: '문의하기' };
  if (siteInfo.contactEmail) return { href: 'mailto:' + siteInfo.contactEmail, text: siteInfo.contactEmail };
  return null;
}
/* 푸터 한 줄: "운영: 이름 · 문의: 링크 · 마지막 업데이트 2026-10-16" — 비어 있는 항목은 뺀다 */
export function footerMetaHtml() {
  const c = contactParts(), parts = [];
  if (siteInfo.operatorName) parts.push(`운영: ${esc(siteInfo.operatorName)}`);
  if (c) parts.push(`문의: <a href="${esc(c.href)}"${c.href.startsWith('https') ? ' target="_blank" rel="noopener"' : ''}>${esc(c.text)}</a>`);
  parts.push(`마지막 업데이트 ${buildDate()}`); // <time datetime>은 쓰지 않는다(허브의 글 날짜 목록 검사와 섞이지 않게)
  return parts.join(' · ');
}
/* 앱 안(사용 방법)에서 쓰는 값. 빌드가 index.html의 SITE_INFO 줄을 이 값으로 바꿔 넣는다 */
export function appSiteInfoLine() {
  const c = contactParts();
  return `const SITE_INFO=${JSON.stringify({ operator: siteInfo.operatorName, contactHref: c ? c.href : '', contactText: c ? c.text : '' })};`;
}
