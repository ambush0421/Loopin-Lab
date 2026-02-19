# Report: SEO Value-up

## What changed
- 코드베이스 SEO 상태를 재점검한 결과, 계획된 기술 SEO 항목(홈 전용 metadata 분리, OG/Twitter 이미지, robots/sitemap/manifest, noindex 정책)이 이미 반영되어 있음을 확인했다.
- robots host 값을 URL 형식에서 도메인 형식으로 보정했다.
  - `src/app/robots.ts` (`host: "building-report.pro"`)
- 실행 검증 결과와 blocker를 `report.md`에 반영했다.
  - `docs/pdca/seo-valueup/report.md`

## How verified (commands + results)
- Command:
  - `set SystemRoot=C:\Windows&& set windir=C:\Windows&& set TEMP=C:\Windows\Temp&& set TMP=C:\Windows\Temp&& npx eslint src/app/robots.ts`
- Result:
  - 성공 (exit code 0)
  - `robots.ts` 변경 lint 통과

- Command:
  - `set SystemRoot=C:\Windows&& set windir=C:\Windows&& set TEMP=C:\Windows\Temp&& set TMP=C:\Windows\Temp&& npm run lint`
- Result:
  - 실패 (exit code 1)
  - 전역 다수 레거시 lint 이슈(주로 `@typescript-eslint/no-explicit-any`, `.bkit-codex/**`의 `no-require-imports`)로 실패
  - 이번 변경 파일(`layout/opengraph-image/twitter-image`)과 직접 연관 없는 기존 blocker

- Command:
  - `set SystemRoot=C:\Windows&& set windir=C:\Windows&& set TEMP=C:\Windows\Temp&& set TMP=C:\Windows\Temp&& npm run build`
- Result:
  - 실패 (exit code 1)
  - `next build && npx @cloudflare/next-on-pages` 파이프라인에서 `next build` 단계 실패
  - 위치: `/share/[id]` page data 수집 단계
  - 에러: `TypeError: (0 , ai.createContext) is not a function`
  - 판단: `/share/[id]`의 기존 런타임 의존성 이슈로 보이며, 이번 SEO 변경과 직접 연관 없음

## Risks / rollback notes
- 코드 변경 범위가 `robots.ts` 1라인이라 롤백 리스크는 낮다.
- 롤백은 `src/app/robots.ts`의 `host` 값을 이전 URL 형식으로 복원하면 된다.

## Next actions
1. `/share/[id]` 빌드 blocker(`ai.createContext`) 원인 패키지/런타임 경계를 분리해 해결한다.
2. `.bkit-codex/**` 포함 여부를 lint 스코프에서 재정의해 전역 lint 기준을 안정화한다.
3. Search Console/네이버 서치어드바이저에서 `robots.txt` 재수집을 요청해 host 반영 상태를 확인한다.
