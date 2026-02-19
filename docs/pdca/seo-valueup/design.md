# Design: SEO Value-up

## Architecture overview
- `src/app/layout.tsx`
  - 전역 metadata(robots/googleBot/verification/themeColor/keywords) 보강
  - 전역 JSON-LD(`Organization`, `WebSite`) 삽입
  - 잘못된 전역 canonical 수동 태그 제거
- `src/app/robots.ts`
  - 검색엔진 크롤러 규칙 정의
  - 내부/개인화 경로(`dashboard/report/share/api`) 크롤링 제외
- `src/app/sitemap.ts`
  - 공개 정적 경로만 사이트맵에 포함
- `src/app/manifest.ts`
  - 앱 메타(이름/아이콘/테마색) 정의
- `src/app/dashboard/**/head.tsx`, `src/app/report/**/head.tsx`
  - noindex 메타 명시
- `src/app/share/[id]/page.tsx`
  - 동적 metadata에 noindex 및 OG URL 반영
- `src/app/{about,guide,privacy,terms}/page.tsx`
  - canonical/OG 메타 보강

## Data model / schema
- DB 스키마 변경 없음.
- 환경변수 기반 인증 메타만 추가:
  - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
  - `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`

## SEO policy decisions
1. 공개 페이지만 index 대상:
   - `/`, `/about`, `/guide`, `/privacy`, `/terms`
2. 비공개/개인화 페이지는 noindex:
   - `/dashboard/**`, `/report/**`, `/share/**`
3. robots에서도 동일 경로를 disallow로 방어해 이중 안전장치 구성.

## Test plan
- Command:
  - `npx eslint src/app/layout.tsx src/app/robots.ts src/app/sitemap.ts src/app/manifest.ts src/app/share/[id]/page.tsx src/app/about/page.tsx src/app/guide/page.tsx src/app/privacy/page.tsx src/app/terms/page.tsx src/app/dashboard/head.tsx src/app/dashboard/compare/head.tsx src/app/report/head.tsx src/app/report/[id]/head.tsx`
- Expected:
  - 변경 파일 scoped lint 통과

- Command:
  - `npm run lint`
- Expected:
  - 전역 lint 통과

- Command:
  - `npm run build`
- Expected:
  - 빌드 성공 또는 기존 blocker를 식별하여 보고서에 기록
