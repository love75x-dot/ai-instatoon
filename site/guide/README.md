# 콘텐츠 가이드 운영 안내

## 새 글 추가
1. `npm run guide:new -- <slug> <카테고리>` (카테고리: toon, insta, biz, ai, meta)
2. 생성된 `site/guide/posts/<slug>.mjs`의 `TODO`를 실제 내용으로 교체
3. `npm run build` → `npm run check`

자동으로 처리되는 것: 허브 카드, sitemap.xml(+lastmod), 이전/다음 링크, 같은 카테고리 "더 보기" 링크,
canonical/OG/Article·BreadcrumbList JSON-LD, GA4 태그와 클릭·스크롤 추적.

빌드가 막는 것: slug·title·description 중복, 주제가 거의 같은 글, 섹션 4개 미만, 요약 3~5개 아님,
related 3~4개 아님, 본문이 지나치게 짧음, TODO가 남은 글, 성과 수치 보장·승인/노출 보장 표현.

## 쓰기 전에 (분량 채우기용 글 금지)
- 이 글이 답하는 독자의 질문이 한 문장으로 말해지는가? 기존 글과 다른 질문인가?
- 직접 겪었거나 확인한 내용·실제 매장 사례가 들어 있는가? (가상 사례는 "가상"이라고 표시)
- 통계·검색량·매출 효과는 근거 없이 쓰지 않았는가? Meta/Instagram/Google 기능은 공식 문서로 확인했는가?
- 내용을 고치면 `modified: 'YYYY-MM-DD'`를 갱신, 실제 공개일은 `published`.

## Google Analytics 4
- 측정 ID(`G-XXXXXXXXXX`)는 Vercel 환경변수 `GA_MEASUREMENT_ID` 또는 `site/analytics.config.json`의 `measurementId`.
  비어 있으면 GA 스크립트가 아예 들어가지 않는다. (측정 ID는 공개돼도 되는 값이며 API 키가 아니다.)
- 자동 수집: 페이지뷰, 활성 사용자, 참여 시간(GA4 기본). 글별 성과는 페이지 경로(`/guide/<slug>/`)와
  `content_group`(카테고리) 매개변수로 구분.
- 직접 보내는 이벤트(`site/guide/track.js`): `article_scroll`(percent 50/75/90), `related_click`, `cta_click`,
  `prevnext_click`, `guide_card_click`. 공통 매개변수 `article_slug`, `content_category`, `page_type`.
- GA 관리 화면에서 할 일(코드로 못 함): 위 매개변수를 맞춤 측정기준으로 등록, 핵심 이벤트로 `cta_click` 지정,
  데이터 스트림의 향상된 측정에서 "양식 상호작용"·"파일 다운로드"는 끄는 것을 권장(제작 도구 화면 보호).
- 쿠키/동의: GA는 쿠키를 사용한다. 개인정보처리방침과 필요 시 동의 절차는 운영자가 별도로 준비해야 한다.
