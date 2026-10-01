// 사람 검토용 체크리스트 생성: node site/guide/review-sheet.mjs  → docs/adsense-review/review-checklist.md (공개되지 않는 폴더)
// 이 파일은 "AI 초안, 사람 검토 미완료" 상태를 기록한다. 검토를 마치면 [x]로 바꾸고 검토자·날짜를 적는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { articles } from './build-guide.mjs';
import { pages } from './pages.mjs';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'adsense-review', 'review-checklist.md');
const rich = (a) => a.sections.filter((s) => s.blocks.some((b) => ['ex', 'table', 'check', 'warn', 'tip'].includes(b.t))).map((s) => s.h);
let md = `# 페이지별 사람 검토 체크리스트\n\n생성: ${new Date().toISOString().slice(0, 10)} · 상태: **AI가 작성한 초안, 사람 검토 미완료** (AI의 재검사는 사람 검토가 아님)\n\n각 페이지에서 확인할 것: ① 본문 정확성 ② 출처·권리(이미지·인용·외부 서비스 기능) ③ 실제 경험·자격 표현(지어낸 사례/후기 없음, 가상 사례는 "가상" 표시) ④ 사이트 적합성 ⑤ 추가 가치의 근거\n\n질문: "누가 어떤 문제를 해결하도록 돕는가? 일반적인 설명에 어떤 실질적 가치를 더했으며 근거는 무엇인가?"\n\n`;
for (const a of articles) {
  md += `## /guide/${a.slug}/\n- 제목: ${a.title}\n- 해결하는 질문: ${a.card}\n- 추가 가치가 있는 본문 위치(예시·표·체크리스트·주의): ${rich(a).join(' / ') || '없음 → 보강 필요'}\n- 외부 서비스 기능을 설명하는가: ${/Instagram|Facebook|Meta|Google|Gemini|ChatGPT/.test(JSON.stringify(a)) ? '예 → 공식 문서로 확인 필요' : '아니오'}\n- [ ] 본문 정확성  [ ] 출처·권리  [ ] 경험·자격 표현  [ ] 사이트 적합성  [ ] 추가 가치 근거  — 검토자/날짜: ________\n\n`;
}
for (const p of pages) md += `## /${p.slug}/ (${p.title})\n- [ ] 실제 동작과 일치(저장·전송·외부 요청)  [ ] 운영자·문의 정보 확정  [ ] 법무/전문가 검토 필요 여부 판단  — 검토자/날짜: ________\n\n`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, md);
console.log('작성: ' + out);
