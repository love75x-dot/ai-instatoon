// GA4 설정. 측정 ID는 비밀값이 아니지만 코드에 박지 않고 설정으로 받는다.
// 우선순위: 환경변수 GA_MEASUREMENT_ID(Vercel 프로젝트 설정) > site/analytics.config.json
// ID가 없거나 형식이 틀리면 GA 스크립트를 아예 넣지 않는다(가짜 ID 금지).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export function gaId() {
  let id = process.env.GA_MEASUREMENT_ID || '';
  if (!id) {
    try { id = JSON.parse(fs.readFileSync(path.join(here, 'analytics.config.json'), 'utf8')).measurementId || ''; } catch { /* 설정 파일 없음 */ }
  }
  id = String(id).trim();
  if (!id) return '';
  if (!/^G-[A-Z0-9]{6,12}$/.test(id)) throw new Error(`GA 측정 ID 형식이 올바르지 않습니다: ${id}`);
  return id;
}

// params: 페이지 단위로 GA에 같이 보낼 값(콘텐츠 그룹 등). 사용자 입력/개인정보/API 키는 절대 넣지 않는다.
export function gaSnippet(id, params = {}) {
  if (!id) return '';
  const cfg = JSON.stringify({ ...params }).replace(/</g, '\u003c');
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}',${cfg});</script>`;
}
