// 새 글 뼈대 생성: node site/guide/new-post.mjs <slug> <카테고리키>
// 만들어진 파일은 TODO가 남아 있으면 빌드가 실패한다. 실제 내용을 채운 뒤 npm run build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATS } from './lib.mjs';

const [slug, cat] = process.argv.slice(2);
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug || '') || !CATS[cat]) {
  console.error(`사용법: node site/guide/new-post.mjs <slug> <${Object.keys(CATS).join('|')}>`);
  process.exit(1);
}
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'posts');
fs.mkdirSync(dir, { recursive: true });
const f = path.join(dir, `${slug}.mjs`);
if (fs.existsSync(f)) { console.error('이미 있는 파일입니다: ' + f); process.exit(1); }
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(f, `import { p, ul, ol, check, tip, warn, ex, table, sec } from '../lib.mjs';

// 작성 전 확인: 이 글이 답하는 독자의 질문은 무엇인가? 기존 글과 다른 질문인가? 직접 겪었거나 확인한 내용인가?
export default {
  slug: '${slug}', cat: '${cat}',
  published: '${today}', // 실제 공개일. 내용을 고치면 modified: 'YYYY-MM-DD'를 추가
  title: 'TODO 독자의 질문에 답하는 제목',
  metaTitle: 'TODO 검색 결과에 보일 제목(60자 이내)',
  desc: 'TODO 이 글이 무엇을 알려주는지 50~170자로 구체적으로 작성',
  card: 'TODO 허브 카드에 보일 한 줄',
  lead: 'TODO 검색자의 질문에 바로 답하는 도입부',
  related: ['what-is-instatoon', 'how-to-make-instatoon', 'store-story-to-instatoon'], // 실제로 관련 있는 글 3~4개로 교체
  summary: ['TODO', 'TODO', 'TODO'],
  sections: [
    sec('TODO 첫 번째 H2', p('TODO')),
  ],
};
`);
console.log('생성: ' + f);
