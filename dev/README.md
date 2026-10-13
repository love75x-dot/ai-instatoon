# 리뉴얼 안전 검사 (dev/)

`npm run check` (내 컴퓨터에서만) = 기존 가이드 검사 + 아래 3가지. Cloudflare 빌드는 `npm run build`만 실행하므로 영향 없음.
처음 한 번: `npm install` (크롬은 PC에 있는 Playwright 크롬을 자동으로 찾음. 못 찾으면 `PW_CHROMIUM=<chrome 경로>`).

| 검사 | 명령 | 지키는 것 |
|---|---|---|
| 프롬프트 골든 | `node dev/golden/golden.mjs` | 앱 3단계 프롬프트(캐릭터 시트·규칙·컷별·안내 카드·다시 그리기 문장) 문장 불변. 의도한 변경이면 **이유를 보고·승인받은 뒤에만** `--update` |
| 데이터 호환 | `node dev/compat/check.mjs` | 옛 localStorage·백업 파일(`dev/compat/fixtures/`, 0단계에서 만든 고정본)이 그대로 불러와짐. 고정본은 다시 만들지 말 것 |
| 주소·SEO | `node dev/snapshots/seo.mjs` | /guide/ 주소, sitemap, canonical, robots 불변 |

화면 캡처: `npm run snapshot [폴더]` → `dev/snapshots/<폴더>/` (기준은 `before/`).
`npm run check:app`은 먼저 빌드한 뒤 위 3가지를 돌린다(빌드 결과 `deploy/`를 검사하므로 `site/index.html`을 고친 뒤엔 반드시 빌드).
