# 관리자 프롬프트 서버 저장 설정 (Vercel)

관리자가 고친 프롬프트 틀을 모든 방문자에게 자동 반영하려면 서버 저장소가 필요하다.
코드는 `api/prompts.js` 하나이고, 저장소는 Upstash Redis(무료 플랜 충분)를 쓴다.

## 설정 순서
1. Vercel 대시보드 → 프로젝트 → **Storage** → **Upstash Redis(Marketplace)** 생성 후 이 프로젝트에 연결.
   연결하면 `KV_REST_API_URL`, `KV_REST_API_TOKEN` 환경변수가 자동으로 들어간다.
2. 프로젝트 **Settings → Environment Variables**에 `ADMIN_PASSWORD` 추가 (처음 로그인용 비밀번호, 4자 이상).
3. **Redeploy** (환경변수는 새 배포부터 적용).
4. 관리자 주소(`/#room-…`)로 들어가 `ADMIN_PASSWORD`로 로그인. 이후 화면의 "비밀번호 변경"으로 바꿀 수 있고,
   바꾼 비밀번호는 해시로 Redis(`instatoon:adminpw`)에 저장된다.

## 동작
- 방문자: 페이지를 열 때 `GET /api/prompts`로 수정된 틀을 받아 AI 요청에 쓴다(없으면 코드의 기본 틀).
  엣지 캐시 때문에 저장 후 반영까지 최대 10초 안팎 걸릴 수 있다.
- 관리자: 로그인 후 "저장"/"기본값으로 되돌리기"가 서버에 기록된다. 서버 쓰기는 매 요청마다 비밀번호를 검사한다.
- 서버가 없거나 환경변수가 비어 있으면(`configured:false`) 예전처럼 이 브라우저에만 저장된다.

## 비밀번호를 잊었다면
Upstash 콘솔에서 `instatoon:adminpw` 키를 삭제하면 `ADMIN_PASSWORD` 환경변수 값으로 돌아간다.
