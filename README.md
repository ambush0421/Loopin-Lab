# Building Report Pro

건축물 분석 및 견적 관리 시스템 (Building Report Pro)

- **Repository**: [https://github.com/ambush0421/Building-Report-Pro](https://github.com/ambush0421/Building-Report-Pro)
- **Deployment**: [https://building-report-pro.pages.dev](https://building-report-pro.pages.dev)

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Cloudflare Pages Deploy

### Node.js Version

Deployment scripts assume Node.js 20.x.
For environments that crash with `ncrypto::CSPRNG(nullptr, 0)` (Node 24), switch to Node 20 before running:

```bash
nvm use 20.13.1
npm install
npm run pages:build
```

### Build check

```bash
npm run lint
npm run build
```

### Build for Pages (Windows-safe)

```bash
npm run pages:build
```

`pages:build` now runs:

1. `vercel build`
2. `@cloudflare/next-on-pages --skip-build`

and avoids the Windows `spawn npx ENOENT` issue by resolving `npx.cmd` from the current Node installation.

### Node 22 세션에서 바로 재개(옵션 1 고정 경로)

현재 터미널 PATH가 꼬여 있어 `node/npm`를 직접 지정해야 할 때 아래 스크립트로 1회성 재개가 가능합니다.

```powershell
Set-Location C:\projects\week4
.\scripts\pages-deploy-fixed.ps1
```

필요 시 Node 경로만 바꿔서 사용:

```powershell
.\scripts\pages-deploy-fixed.ps1 -NodeExe "C:\Program Files\nodejs\node.exe" -SkipDeploy
```

원하면 더블클릭 한 번으로 실행:

```powershell
scripts\run-pages-deploy.cmd
```

또는 배포 단계만 생략:

```powershell
scripts\run-pages-deploy.cmd -SkipDeploy
```

### 자동화 권장 실행 (한 번만)

로컬에서 더이상 명령을 직접 조합할 필요 없이 아래 순서만 유지하세요.

```powershell
# 1) 현재 환경에서 동작 가능한 Node 경로로 고정 실행
.\scripts\pages-deploy-fixed.ps1

# 2) 빌드/배포를 모두 한 번에 수행
.\scripts\pages-deploy-fixed.ps1

# 3) 빌드만 확인하고 배포는 나중에:
.\scripts\pages-deploy-fixed.ps1 -SkipDeploy
```

로컬 세션이 `node`/`npm` 실행을 막는 상태이면 위 스크립트는 즉시 아래 메시지를 출력하고 종료됩니다.

```text
[deploy] Suggest using CI path: npm run pages:deploy:ci (GitHub Actions)
```

이 경우 다음만 수행하면 됩니다.

```bash
npm run pages:deploy:ci
```

스크립트 동작:

1. 지정한 Node 경로로 `node`/`npm` 실행 여부 확인
2. 세션 PATH에 Node 디렉터리, npm 글로벌 경로를 선행 삽입
3. `NEXT_DISABLE_TURBOPACK=1` 고정, `TURBOPACK` 삭제
4. `npm install` → `npm run pages:build` 순차 실행
5. 기본적으로 이어서 `npm run pages:deploy`까지 실행 (`-SkipDeploy` 가능)

### Deploy

```bash
npm run pages:deploy
```

or directly:

```bash
npx --yes wrangler pages deploy .vercel/output/static --project-name building-report-pro
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## CI 자동 배포 (권장)

로컬 제약 없이 main 브랜치 푸시만으로 배포하려면 GitHub Actions를 사용하세요.

1. 저장소 Settings > Secrets and variables > Actions에서 아래 시크릿 등록
   - CF_API_TOKEN : Cloudflare API Token
2. main 브랜치에 push
3. .github/workflows/pages-deploy.yml가 자동 실행

수동 실행:

- GitHub Actions > Pages Deploy > Run workflow
wjd
CI에서 로컬 PATH 문제는 완전히 회피됩니다.

```bash
npm run pages:deploy:ci
```

`npm run pages:deploy:ci`는 로컬에서도 동일한 명령 조합으로 동작하며 배포 시 `--branch main`을 강제해
CI와 동일한 동작을 재현합니다.
