# 보안 체크리스트 및 프론트엔드/백엔드 구분

## 📋 아키텍처 구분

### 🖥️ 프론트엔드 (클라이언트 사이드)
클라이언트 브라우저에서 실행되는 코드입니다. **절대로 민감한 정보를 포함해서는 안 됩니다.**

| 파일 | 설명 | 보안 주의사항 |
|------|------|---------------|
| `src/app/page.tsx` | 메인 페이지 | API 호출만 수행, 키 노출 없음 ✅ |
| `src/app/about/page.tsx` | 서비스 소개 | 정적 콘텐츠만 ✅ |
| `src/app/privacy/page.tsx` | 개인정보처리방침 | 정적 콘텐츠만 ✅ |
| `src/app/terms/page.tsx` | 이용약관 | 정적 콘텐츠만 ✅ |
| `src/app/guide/page.tsx` | 이용 가이드 | 정적 콘텐츠만 ✅ |
| `src/components/**` | UI 컴포넌트 | API 호출만, 민감 정보 없음 ✅ |

### ⚙️ 백엔드 (서버 사이드)
서버에서만 실행되는 코드입니다. API 키와 민감한 로직을 안전하게 처리합니다.

| 파일 | 설명 | 보안 상태 |
|------|------|-----------|
| `src/app/api/building-report-v2/route.ts` | 건축물대장 API | ✅ 환경변수 사용 |
| `src/app/api/building-units/route.ts` | 호실 정보 API | ✅ 환경변수 사용 |
| `src/lib/logger.ts` | 로깅 유틸리티 | ✅ 서버 전용 |

---

## 🔒 보안 점검 항목

### ✅ 완료된 보안 조치

1. **API 키 환경변수 이동**
   - `BUILDING_API_KEY`를 `.env.local`에서 관리
   - `NEXT_PUBLIC_` 접두사 없음 → 클라이언트 노출 방지
   - 코드에서 하드코딩된 키 제거

2. **입력값 검증 (Input Validation)**
   ```typescript
   function validateParam(value: string | null, maxLength: number = 10): string {
     if (!value) return '';
     return value.replace(/[^0-9]/g, '').substring(0, maxLength);
   }
   ```
   - 숫자만 허용 (XSS/Injection 방지)
   - 최대 길이 제한

3. **보안 헤더 설정**
   ```typescript
   headers: {
     'X-Content-Type-Options': 'nosniff',
     'X-Frame-Options': 'DENY',
     'Cache-Control': 'private, no-cache, no-store, must-revalidate',
   }
   ```

4. **에러 메시지 최소화**
   - 상세 오류 정보를 클라이언트에 노출하지 않음
   - 로깅은 서버 측에서만 수행

5. **환경변수 파일 보호**
   - `.env.local`은 `.gitignore`에 포함됨

---

## 📂 환경변수 설정

### `.env.local` (예시)
```env
# 공공데이터포털 API 키 (서버 전용)
BUILDING_API_KEY=your-api-key-here

# Rate Limiting (선택적)
API_RATE_LIMIT_REQUESTS=100
API_RATE_LIMIT_WINDOW_MS=60000
```

### 주의사항
- `NEXT_PUBLIC_` 접두사가 **없는** 환경변수는 서버에서만 접근 가능
- 프로덕션 배포 시 환경변수를 호스팅 서비스에 별도 설정 필요

---

## 🚀 추가 권장 보안 조치

### 1. Rate Limiting (권장)
```typescript
// 추후 구현: 과도한 API 요청 방지
const rateLimit = require('express-rate-limit');
```

### 2. HTTPS 강제 (프로덕션)
- Vercel, Railway 등 대부분의 호스팅 서비스에서 자동 지원

### 3. CSP (Content Security Policy)
```typescript
// next.config.ts에 추가 가능
headers: [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline';"
  }
]
```

### 4. 정기적인 의존성 업데이트
```bash
npm audit
npm update
```

---

## ✅ 체크리스트

- [x] API 키가 환경변수로 관리되는가?
- [x] 환경변수에 `NEXT_PUBLIC_` 접두사가 없는가?
- [x] `.env.local`이 `.gitignore`에 포함되어 있는가?
- [x] 사용자 입력이 검증되고 있는가?
- [x] 에러 메시지가 민감 정보를 노출하지 않는가?
- [x] 보안 헤더가 API 응답에 포함되어 있는가?
- [ ] Rate Limiting이 구현되어 있는가? (권장)
- [ ] CSP 헤더가 설정되어 있는가? (권장)

---

*최종 업데이트: 2024년*
