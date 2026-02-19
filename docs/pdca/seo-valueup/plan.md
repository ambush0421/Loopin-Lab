# Plan: SEO Value-up

## Goal
- 구글/네이버 검색 친화도를 높이기 위한 기술 SEO 기반(`metadata`, `robots`, `sitemap`, `structured data`)을 정비한다.

## Scope
- 루트 메타데이터를 SEO 기준에 맞게 강화한다.
- `robots.txt`, `sitemap.xml`, `manifest.webmanifest`를 App Router 메타 라우트로 구성한다.
- 내부/개인화 페이지의 색인 제외(`noindex`)를 명시한다.
- 정적 정책 페이지의 canonical/OG 메타를 보강한다.
- PDCA 산출물(`plan/design/tasks/report`)을 `docs/pdca/seo-valueup`에 기록한다.

## Non-goals
- API 비즈니스 로직/데이터 정확도 개선.
- 랜딩 UI 재디자인 및 전환 퍼널 개편.
- 외부 검색엔진 콘솔(실계정) 수동 설정 작업.

## Assumptions
- 운영 도메인은 `https://building-report.pro`를 기준으로 한다.
- Search Console 및 네이버 서치어드바이저 인증 토큰은 환경변수로 주입 가능하다.
- 내부 리포트/대시보드 페이지는 검색 유입 대상이 아니다.

## Acceptance Criteria
- 루트 레이아웃에 구조화 데이터(JSON-LD)와 검색엔진 인증 메타 구성이 반영된다.
- `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/manifest.ts`가 추가된다.
- `dashboard/report/share` 계열 페이지에 `noindex`가 적용된다.
- 주요 정적 페이지에 canonical/OG 메타가 반영된다.
- 변경 파일 lint와 전역 lint를 실행한다.
- `npm run build` 실행 결과를 기록한다.

## Risks / Dependencies
- `noindex`/`disallow` 범위가 과도하면 필요한 페이지까지 크롤링 제외될 수 있다.
- Search Console 인증값 미설정 시 검증 메타가 출력되지 않는다.
- 기존 프로젝트의 타입/빌드 이슈가 있을 경우 SEO 변경과 무관하게 빌드가 실패할 수 있다.
