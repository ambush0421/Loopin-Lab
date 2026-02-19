# Tasks: SEO Value-up

1. [x] `plan.md`에 목표/범위/수용기준/리스크를 정의한다.
2. [x] `design.md`에 아키텍처/SEO 정책/테스트 계획을 설계한다.
3. [x] 루트 metadata를 보강하고 JSON-LD를 추가한다.
4. [x] `robots.ts`, `sitemap.ts`, `manifest.ts`를 추가한다.
5. [x] 내부 페이지(`dashboard/report/share`) 색인 제외를 적용한다.
6. [x] 정적 페이지 canonical/OG 메타를 보강한다.
7. [x] 홈 페이지를 서버 래퍼(`src/app/page.tsx`) + 클라이언트 본문(`src/app/HomePageClient.tsx`)으로 분리한다.
8. [x] 신규 래퍼 파일(`src/app/page.tsx`) scoped lint를 통과한다.
9. [ ] 코드 이동 파일 포함 scoped lint를 통과한다. (기존 `any` lint blocker로 실패)
10. [ ] 전역 `npm run lint`를 통과한다. (기존 레거시 lint 에러로 실패)
11. [ ] `npm run build`를 실행하고 결과를 기록한다. (기존 `/share/[id]` build blocker로 실패)
12. [x] `report.md`에 변경/검증/리스크/다음 액션을 정리한다.
