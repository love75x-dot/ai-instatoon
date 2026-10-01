# AdSense 승인 준비 작업 기록 (비공개 문서, 배포 폴더 밖)

기준일: 2026-10-01 · 브랜치: `adsense-readiness` · 원격 push/운영 배포: 하지 않음(허용 범위 미입력)

## 진단
- 사이트 유형: AI 도구(사용자 본인의 Gemini API 키로 대본·글 생성, 그림은 외부 도구) + 정보 콘텐츠 가이드.
- 광고 코드: 저장소에 없음(adsbygoogle, ca-pub 검색 결과 없음) → **광고 미운영 확인**(조건부 B 적용, C·D 비적용/보류, A는 ID 없어 보류).
- 확인된 문제:
  1. 소개·개인정보처리방침·이용안내 페이지가 없었음(푸터 링크도 없음).
  2. 가이드 글 다수의 본문이 얇음(보강 전 17편이 약 900~1,450자).
  3. 도구 자체에 대한 설명 콘텐츠(사용법, API 키/오류 해결)가 없었음.
  4. 메인 화면의 텍스트가 JS 렌더링 위주(정적 HTML에 설명 없음).
  5. 모바일에서 메인 화면 가로 넘침(원래부터 있던 문제, 407px/390px).
  6. 브라우저 저장 공간이 가득 차면 저장 실패가 조용히 무시됨(HANDOFF 5-2에 기록된 위험).

## 수정 내용
- 새 페이지: `/about/`, `/privacy/`, `/terms/` (`site/guide/pages.mjs`). 실제 데이터 흐름(브라우저 저장, Gemini 직접 전송, Google Fonts/cdnjs 요청, Vercel 로그, GA4는 설정 시에만 문단 포함, 광고는 "현재 미게재/향후" 구분).
- 새 가이드 글 2편: `how-to-use-instatoon-room`, `gemini-api-key-setup-guide` (화면 문구·오류 메시지는 `site/index.html` 기준).
- 기존 가이드 16편에 사례·점검표·해결 표 추가(분량 채우기용 반복 문구 없음, 가상 사례는 "가상" 표시).
- 글 하단에 "편집 안내(AI 도구의 도움으로 작성한 초안)"와 편집 방침 링크, 모든 페이지 푸터에 소개/개인정보/이용안내.
- 메인 화면: 정적 "이렇게 써요" 설명, 하단 링크, 모바일 가로 넘침 수정(`.shell{grid-template-columns:minmax(0,1fr)}`), 저장 실패 안내 토스트.
- `site-info.json`: 운영자명·문의 이메일·AdSense 게시자 ID를 **있을 때만** 표시/생성. `ads.txt`는 게시자 ID가 있을 때만 생성(테스트로 형식 확인 후 원복).
- sitemap에 신규 페이지 반영, 검증 스크립트(`site/guide/verify.mjs`)와 브라우저 회귀 테스트(`dev/tests/regress.cjs`) 확장.

## 검증 결과 (실제 실행)
| 항목 | 결과 | 근거 |
|---|---|---|
| 빌드 | PASS | `npm run build` |
| URL·메타·canonical·H1·JSON-LD·내부 링크·sitemap | PASS | `node site/guide/verify.mjs` (22개 글+허브+3개 안내 페이지, 내부 링크 28종) |
| 추적 스크립트 | PASS | `node site/guide/track.test.mjs` |
| 비밀값 검사 | PASS | `node site/scan-secrets.mjs --history` |
| 메인 앱 end-to-end(모킹된 Gemini) | PASS | Playwright: 업종 선택→대본→3단계, 사용 방법, 콘솔 오류 없음 |
| 저장 실패 안내 | PASS | Playwright(스토리지 오류 주입) |
| 모바일 가로 넘침 없음(390px) | PASS | 메인, 가이드, 안내 페이지 7곳 |
| 실제 Gemini 호출·그림 생성·zip 저장·릴스 영상 | UNKNOWN | 실제 키/외부 도구 필요, CDN 차단 환경 |
| Googlebot/Mediapartners-Google 실제 접근 | UNKNOWN | robots.txt는 `Allow: /`이나 실제 Google 접근은 미확인 |
| 운영 URL 응답·HTTPS·리디렉션 | UNKNOWN | 배포하지 않음 |
| AdSense 승인 | 판단 불가 | 승인을 보장하지 않음 |

## 운영자 조치 (영향받는 작업)
1. **문의 수단 확정**: `site/site-info.json`의 `contactEmail` 입력(실제로 수신 가능한 주소만). 현재 `/about/`, `/privacy/`, `/terms/`에는 "문의 수단 미게시"로 표시됨. 이게 없으면 개인정보처리방침이 완결되지 않음.
2. **운영자명**: 공개 가능한 운영자/브랜드 명의를 `operatorName`에 입력.
3. **사람 검토**: `docs/adsense-review/review-checklist.md`의 22개 글과 3개 안내 페이지를 읽고 사실·표현을 확인(글은 AI 도움으로 작성된 초안). 검토 전에는 재심사 요청/광고 활성화 금지.
4. **법적 문서 검토**: 개인정보처리방침·이용안내는 실제 동작 기준의 초안이다. 사업자 정보, 개인정보 보호책임자 지정 등 법적 요건은 운영자/전문가가 확인해야 함.
5. **게시일 확인**: 글의 `published` 날짜가 실제 공개일과 맞는지 확인(현재 일정 기반 값이며 신규 2편은 2026-10-01).
6. **AdSense 연결**: 게시자 ID를 받으면 `adsensePublisherId`(pub-숫자) 입력 → ads.txt 자동 생성. 사이트 연결 코드는 계정이 제공하는 방식으로 직접 적용. 광고 활성화 시 개인정보처리방침의 "광고" 문단을 갱신.
7. **지역 동의(D)**: 방문자 지역을 확인하고, EEA/영국/스위스 대상 개인 맞춤 광고를 쓸 경우 Google 인증 CMP를 설정. 현재 광고가 없어 미적용.
8. **GA4 사용 시**: `GA_MEASUREMENT_ID` 설정 후 빌드하면 개인정보처리방침의 통계 문단이 자동 전환됨. 쿠키 동의 필요 여부는 방문자 지역에 따라 확인.
9. **운영 배포**: 이 브랜치를 검토한 뒤 병합·push·배포하고, 운영 URL에서 sitemap, robots, 신규 페이지 응답을 확인.
10. **실제 기능 확인**: 실제 Gemini 키로 대본 생성, 외부 이미지 도구로 만든 그림 업로드, zip 저장, 릴스 영상을 한 번씩 직접 확인(HANDOFF 5-2의 미검증 항목).

## 되돌리는 방법
`git log adsense-readiness` 의 커밋 단위로 `git revert`, 또는 `git checkout main`.
