# Report: SEO Value-up

## What changed
- 소셜 미리보기 품질 개선을 위해 동적 OG/Twitter 이미지 라우트를 추가했다.
  - `src/app/opengraph-image.tsx`
  - `src/app/twitter-image.tsx`
- 루트 metadata에서 OG/Twitter 이미지 참조를 연결했다.
  - `src/app/layout.tsx`
- 운영 문서에 SEO 설정(검증 토큰/확인 URL) 안내를 추가했다.
  - `README.md`
- PDCA 산출물을 생성했다.
  - `docs/pdca/seo-valueup/plan.md`
  - `docs/pdca/seo-valueup/design.md`
  - `docs/pdca/seo-valueup/tasks.md`
  - `docs/pdca/seo-valueup/report.md`

## How verified (commands + results)
- Command:
  - `set SystemRoot=C:\Windows&& set windir=C:\Windows&& set TEMP=C:\Windows\Temp&& set TMP=C:\Windows\Temp&& npx eslint src/app/layout.tsx src/app/opengraph-image.tsx src/app/twitter-image.tsx`
- Result:
  - 성공 (exit code 0)
  - 변경 파일 scoped lint 통과

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
  - 위치: `/share/[id]` page data 수집 단계
  - 에러: `TypeError: (0 , ai.createContext) is not a function`
  - 판단: `/share/[id]`의 기존 런타임 의존성 이슈로 보이며, 이번 SEO 변경과 직접 연관 없음

## Risks / rollback notes
- OG/Twitter 이미지가 동적 렌더링이므로 추후 브랜딩 변경 시 텍스트/컬러를 일관되게 관리해야 한다.
- 소셜 크롤러 캐시가 남아 초기 반영 지연이 있을 수 있다.
- 롤백은 `layout.tsx`의 `images` 참조 제거와 이미지 라우트 파일 삭제로 즉시 가능하다.

## Next actions
1. `/share/[id]` 빌드 blocker(`ai.createContext`) 원인 패키지/런타임 경계를 분리해 해결한다.
2. `.bkit-codex/**` 포함 여부를 lint 스코프에서 재정의해 전역 lint 기준을 안정화한다.
3. 배포 후 Search Console/네이버에서 `robots/sitemap/미리보기 이미지` 실제 반영 상태를 점검한다.
