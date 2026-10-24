# 애드센스 신청 준비 작업 기록 (2026-10-24)

비공개 문서예요(`docs/`는 배포되지 않음). 승인 여부는 Google이 판단하며, 이 기록은 승인을 보장하지 않아요.

## 진단 요약
- 사이트 유형: 무료 웹 도구(인스타툰 대본·그림 프롬프트 정리) + 정보 글 24편("인스타툰 노트").
- AdSense 상태: **아직 신청 안 함**(운영자 확인). 게시자 ID 없음, 광고 스크립트 없음(소스에서 `adsbygoogle`·`pagead` 0건).
- 방문자 지역: 미확인(GA4 미설정). 한국어 사이트.
- 조건부 작업
  - A. 사이트 연결·ads.txt: **보류** — 게시자 ID가 없음. `site/site-info.json`의 `adsensePublisherId`가 비어 있어 아무것도 넣지 않음.
  - B. 광고 미운영: **적용** — 광고를 켜지 않았고, 새 글은 광고 없이 공개.
  - C. 광고 운영 사이트: **해당 없음**.
  - D. 지역별 동의(CMP): **미확인** — 방문자 지역을 모름. 광고를 켜기 전에 결정 필요(아래 운영자 조치).

## 이번에 고친 것
| 파일 | 내용 | 이유 |
|---|---|---|
| `site/guide/pages.mjs` | 개인정보처리방침에 Claude(Anthropic) 전송 경로 추가, 광고 항목에 Google 필수 고지(제3자 쿠키, 광고 설정·aboutads 해제 링크, EEA·영국·스위스 동의) 보강, 이용안내의 "Gemini 키 필요" 문장을 무료 1회·Gemini/Claude 키로 수정, 소개의 "문의 수단 없음" 문장을 이메일이 있을 때 맞는 문장으로 | 실제 데이터 흐름과 문서가 달랐음 |
| `site/guide/lib.mjs` | 본문에서 외부 링크 `[글자](https://…)` 지원, 테마 샘플 묶음 블록 `themes()` 추가 | 고지 링크·새 글 |
| `site/guide/posts/how-to-use-instatoon-room.mjs`, `gemini-api-key-setup-guide.mjs` | "키가 꼭 필요" → 하루 1회 무료 + 내 키(Gemini/Claude), 버튼 이름 "내 키 설정"으로 | 화면과 글이 달랐음 |
| `site/guide/articles-4.mjs` (캐릭터 일관성) | "연재 중에 새 인물을 추가할 때" 절 추가 | 2026-10-18 반영 기능을 설명 |
| `site/guide/posts/instatoon-art-style-guide.mjs` | 새 글: 그림체 13가지 비교 | 아래 |
| `dev/snapshots/seo-baseline.json` | 새 글 주소 1개 추가(기존 28개 주소·canonical·robots는 그대로임을 비교 확인) | 검사 기준 갱신 |

## 콘텐츠
| 제목 | 경로 | 해결하는 질문 | 더한 가치 |
|---|---|---|---|
| 인스타툰 그림체 13가지 비교 | `/guide/instatoon-art-style-guide/` | 13가지 테마 중 무엇을 고르고, 바꾸면 무엇을 다시 해야 하나? | 같은 장면을 13가지 테마로 그린 실제 샘플 비교, 테마가 바꾸는 범위(그림체 문장+글자 규칙)를 사이트 코드 그대로 정리, 연재 중 변경 시 주의 |
| 인스타툰 캐릭터를 일관되게 유지하는 방법(보강) | `/guide/instatoon-character-consistency/` | 나중에 인물을 추가하면 그림체가 달라지는데 어떻게 맞추나? | 실제 기능(자동 문장, 주인공 시트 내려받기, 테마 알림)과 수동 방법 |

## 검사 결과
- PASS: `site/guide/verify.mjs`(가이드 전체), `track.test.mjs`, `scan-secrets.mjs`, `worker/test.mjs`, `dev/snapshots/seo.mjs`(29개 주소), `gallery`, `fonts`, `logo`, `naver`, `ga`.
- PASS: 새 글 390px에서 가로 넘침 없음, 그림 13장 모두 불러옴, 내부 링크 200.
- UNKNOWN: 실제 Googlebot·Mediapartners-Google 접근(이 작업 공간에서 운영 사이트에 직접 접속 불가). robots.txt는 전체 허용, 홈 소스 HTML에 소개 본문이 들어 있음.
- 참고: 이 작업 공간의 브라우저에서는 `dev/design/check.mjs`(이모지 판정), `size.mjs`(320px 한 달 기획), `vault2`·`consistency`(내려받기 파일 이름)가 main에서도 똑같이 실패함. 이번 변경과 무관한 환경 차이.

## 사람 검토 체크리스트 (게시 전 운영자가 직접)
새 글 `instatoon-art-style-guide`
- [ ] 13가지 테마 설명과 상황별 추천이 실제로 써 본 느낌과 맞는가
- [ ] 샘플 그림 13장은 운영자가 만든 그림이고 다른 사람의 캐릭터·상표가 없는가
- [ ] "테마는 1단계 아래쪽에서 고른다", "주인공과 테마가 다르면 알림" 등 화면 설명이 지금 화면과 같은가
보강 글 `instatoon-character-consistency`
- [ ] 새 인물 추가 절차를 실제로 한 번 따라 해 봤는가
개인정보처리방침·이용안내
- [ ] 문의 이메일 insta.toon13@gmail.com을 실제로 확인하고 있는가
- [ ] 무료 체험의 처리 방식(IP 일방향 값, 하루 보관) 설명이 지금 Worker 동작과 같은가

## 남은 운영자 조치
1. **AdSense 신청 후 게시자 ID 받기** → `site/site-info.json`의 `adsensePublisherId`에 `pub-…` 형식으로 넣고, 사이트 연결 코드와 `ads.txt`를 같은 작업에서 추가(영향: A).
2. **광고를 켜기 전 방문자 지역 확인과 동의 방식 결정** → EEA·영국·스위스 방문자가 있으면 Google 인증 CMP(AdSense의 개인정보 보호 및 메시지) 설정 필요(영향: D).
3. **광고 게재 시작일을 개인정보처리방침 7번 항목에 기록**하고 `UPDATED` 날짜 갱신.
4. **새 글과 보강 글 사람 검토**(위 체크리스트).
5. `store-photos` 브랜치(우리 가게 사진)를 병합하면 개인정보처리방침 1번 표에 "가게 사진" 행을 추가.
