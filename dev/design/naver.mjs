// 네이버 사이트 소유 확인 태그가 만들어진 모든 HTML 페이지의 <head> 안에 정확히 한 번씩 있는지 검사.
//   node dev/design/naver.mjs   (먼저 npm run build)
import fs from 'node:fs';
import path from 'node:path';
import { root, checker } from '../lib/harness.mjs';

const C = checker();
const TAG = '<meta name="naver-site-verification" content="7dc9647f6cf9532cdd20244898cc8b60bdd7f13b" />';
const files = []; const walk = (d) => { for (const n of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, n.name); if (n.isDirectory()) { if (n.name !== 'assets') walk(p); } else if (n.name.endsWith('.html')) files.push(p); } };
walk(path.join(root, 'deploy'));
const bad = [];
for (const f of files) { const h = fs.readFileSync(f, 'utf8'); const head = (h.match(/<head>[\s\S]*?<\/head>/) || [''])[0]; if (head.split(TAG).length !== 2) bad.push(path.relative(root, f)); }
C.ok(files.length >= 6, `HTML 페이지 ${files.length}개를 검사`);
C.ok(!bad.length, '모든 페이지 <head> 안에 네이버 확인 태그가 정확히 한 번씩 있음' + (bad.length ? ' ← 없는 곳: ' + bad.slice(0, 5).join(', ') : ''));
const file = fs.readFileSync(path.join(root, 'site', 'instatoon.html'), 'utf8');
C.ok(file.split(TAG).length === 2, '파일 버전(instatoon.html)에도 한 번 있음');
console.log(C.fail ? `\n[FAIL] 네이버 태그 검사 ${C.fail}건 실패` : '\n[PASS] 네이버 태그 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
