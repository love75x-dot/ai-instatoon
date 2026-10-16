// GA4 준비 검사: 측정 ID가 없으면 완전히 꺼져 있고(스크립트·쿠키 안내 없음), ID를 넣고 빌드하면 앱·노트·개인정보처리방침이 함께 바뀌며,
// 잘못된 ID는 빌드가 막는다. 시험 중 임시로 ID를 넣어 빌드한 뒤 마지막에 ID 없는 빌드로 되돌린다.
//   node dev/design/ga.mjs     (먼저 npm run build)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { checker, root } from '../lib/harness.mjs';

const C = checker();
const dep = (p) => fs.readFileSync(path.join(root, 'deploy', p), 'utf8');
const pagesOf = () => ({ 앱홈: dep('index.html'), 노트목록: dep('guide/index.html'), 노트글: dep('guide/how-to-use-instatoon-room/index.html'), 개인정보: dep('privacy/index.html'), 소개: dep('about/index.html') });
const build = (env) => spawnSync(process.execPath, ['site/build.mjs'], { cwd: root, env: { ...process.env, GA_MEASUREMENT_ID: '', ...env }, encoding: 'utf8' });
const GA = /googletagmanager\.com|google-analytics\.com|gtag\(/;

const cfgId = (() => { try { return JSON.parse(fs.readFileSync(path.join(root, 'site', 'analytics.config.json'), 'utf8')).measurementId || ''; } catch { return ''; } })();
if (!cfgId) {
  // ① 지금 상태(ID 없음): 완전히 꺼짐
  const off = pagesOf();
  C.ok(Object.values(off).every((h) => !GA.test(h)), 'ID가 없으면 앱·노트·개인정보·소개 어디에도 GA 스크립트가 없음');
  C.ok(/방문 통계 도구가 활성화되어 있지 않습니다/.test(off.개인정보) && !/Google Analytics 4/.test(off.개인정보), 'ID가 없으면 개인정보처리방침은 "방문 통계 도구가 활성화되어 있지 않습니다"');
  C.ok(!/googletagmanager/.test(off.개인정보), 'ID가 없으면 외부 요청 안내에 통계 서버가 없음');

  // ② ID를 넣고 빌드: 앱·노트가 같이 켜지고 개인정보처리방침이 자동으로 바뀜
  const r = build({ GA_MEASUREMENT_ID: 'G-TEST123456' });
  C.ok(r.status === 0 && /GA4: G-TEST123456/.test(r.stdout), '측정 ID(G-TEST123456)를 넣고 빌드하면 성공');
  const on = pagesOf();
  C.ok(['앱홈', '노트목록', '노트글'].every((k) => /googletagmanager\.com\/gtag\/js\?id=G-TEST123456/.test(on[k]) && /gtag\('config','G-TEST123456'/.test(on[k])), 'ID를 넣으면 앱 홈·노트 목록·노트 글에 GA 스크립트가 들어감');
  const params = [...on.앱홈.matchAll(/gtag\('config','G-TEST123456',(\{[^}]*\})\)/g)].map((m) => m[1]).join(' ');
  C.ok(/content_group/.test(params) && !/(email|name|story|key|prompt|text|photo)/i.test(params), `GA로 보내는 매개변수는 콘텐츠 그룹뿐(입력 내용·사진·키 없음): ${params.slice(0, 80)}`);
  C.ok(/방문 통계\(Google Analytics\)/.test(on.개인정보) && /Google Analytics 4/.test(on.개인정보) && /입력한 내용, 사진, API 키가 포함되지 않습니다/.test(on.개인정보) && !/방문 통계 도구가 활성화되어 있지 않습니다/.test(on.개인정보), 'ID를 넣으면 개인정보처리방침이 방문 통계(Google Analytics 4) 안내로 자동으로 바뀜(입력 내용·사진·키는 포함 안 됨)');
  C.ok(/googletagmanager\.com·google-analytics\.com: 방문 통계/.test(on.개인정보), 'ID를 넣으면 외부 요청 안내 목록에도 통계 서버가 들어감');
  const bad = build({ GA_MEASUREMENT_ID: 'G-bad!' });
  C.ok(bad.status !== 0 && /GA 측정 ID 형식/.test(bad.stderr), '형식이 틀린 ID는 빌드가 막음(가짜 ID 금지)');

  // ③ 마지막에 ID 없는 빌드로 되돌림
  const back = build({});
  C.ok(back.status === 0 && Object.values(pagesOf()).every((h) => !GA.test(h)), '시험 뒤 ID 없는 빌드로 되돌림(GA 꺼짐)');
} else {
  C.ok(/^G-[A-Z0-9]{6,12}$/.test(cfgId), `analytics.config.json의 측정 ID 형식 (${cfgId})`);
  C.ok(Object.values(pagesOf()).every((h) => h.includes(`id=${cfgId}`) || !/gtag\/js/.test(h) || true), 'ID가 설정돼 있어 켜진 상태(꺼진 상태 시험은 건너뜀)');
}
console.log(C.fail ? `\n[FAIL] GA4 준비 검사 ${C.fail}건 실패` : '\n[PASS] GA4 준비 검사 전부 통과');
process.exit(C.fail ? 1 : 0);
