// 저장소/배포 결과에 비밀값이 섞였는지 검사. 사용: node site/scan-secrets.mjs [--history]
// - 추적 중인 파일과 deploy/ 안의 모든 파일에서 대표적인 키 패턴을 찾는다.
// - .env 류 파일이 추적되고 있으면 실패한다.
// - --history: git 전체 이력의 추가된 줄도 검사한다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PATTERNS = [
  ['Google API 키', /AIza[0-9A-Za-z_-]{35}/],
  ['OpenAI/Anthropic류 키', /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{32,}/],
  ['GitHub 토큰', /\bgh[pousr]_[A-Za-z0-9]{30,}/],
  ['Slack 토큰', /\bxox[abprs]-[A-Za-z0-9-]{20,}/],
  ['AWS 액세스 키', /\bAKIA[0-9A-Z]{16}\b/],
  ['개인 키 블록', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['키 대입', /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"][A-Za-z0-9_\-+/=]{20,}['"]/i],
];
const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
let fail = 0;
const report = (m) => { fail++; console.log('[FAIL]', m); };

let tracked = [];
try { tracked = git('ls-files').split('\n').filter(Boolean); } catch { console.log('[UNKNOWN] git 저장소가 아니라 추적 파일 목록을 얻지 못함'); }
for (const f of tracked) if (/(^|\/)\.env(\.|$)/.test(f) && !/\.env\.example$/.test(f)) report(`.env 파일이 저장소에 추적됨: ${f}`);

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === 'node_modules' || e.name === '.git' ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]));
const files = new Set([...tracked.map((f) => path.join(root, f)), ...(fs.existsSync(path.join(root, 'deploy')) ? walk(path.join(root, 'deploy')) : [])]);
let scanned = 0;
for (const f of files) {
  if (!fs.existsSync(f) || /\.(png|jpe?g|webp|gif|ico|woff2?|ttf|otf|zip)$/i.test(f)) continue;
  const text = fs.readFileSync(f, 'utf8'); scanned++;
  for (const [name, re] of PATTERNS) { const m = text.match(re); if (m) report(`${path.relative(root, f)}: ${name} 의심 (${m[0].slice(0, 6)}…)`); }
}
console.log(`파일 ${scanned}개 검사`);

if (process.argv.includes('--history')) {
  try {
    const log = git('log', '--all', '-p', '--no-color', '--format=commit %h');
    let c = '';
    for (const l of log.split('\n')) {
      if (l.startsWith('commit ')) { c = l.slice(7); continue; }
      if (!l.startsWith('+') || l.startsWith('+++')) continue;
      for (const [name, re] of PATTERNS) if (re.test(l)) report(`커밋 ${c}: ${name} 의심`);
    }
    console.log('git 이력 검사 완료');
  } catch { console.log('[UNKNOWN] git 이력을 읽지 못함'); }
}
console.log(fail ? `\n실패 ${fail}건` : '\n비밀값 의심 항목 없음');
process.exit(fail ? 1 : 0);
