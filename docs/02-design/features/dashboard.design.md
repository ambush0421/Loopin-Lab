# Dashboard Design Document

> Version: 1.0.0 | Created: 2026-02-10 | Status: Draft

## 1. Overview
사용자가 저장한 보고서 목록을 효율적으로 관리하고 열람할 수 있는 대시보드 페이지(`src/app/dashboard/page.tsx`)를 설계합니다.

## 2. Architecture
### Page Structure
`src/app/page.tsx` (Home/Search)
      |
      +-> `src/app/dashboard/page.tsx` (Dashboard/List)
               |
               +-> `src/app/report/[id]/page.tsx` (Detail View - *Future*)

### Supabase Query
- **Table:** `reports`
- **Columns:** `id`, `address`, `created_at`, `building_data` (JSONB)
- **Filter:** `user_id` = Current User
- **Sort:** `created_at` DESC

## 3. UI Design
### Layout
- 상단: 헤더 (로고, 사용자 프로필, '새 보고서 만들기' 버튼)
- 중단: 검색 필터 (주소 검색)
- 하단: 보고서 카드 그리드 또는 테이블 리스트

### Report Card Component
- 건물명 / 주소 (Bold)
- 생성일 (Relative Time: "2 hours ago")
- 요약 태그 (대지면적, 연면적)
- 액션 버튼: [보기], [삭제], [PDF 인쇄]

## 4. Implementation Steps
1. **Route 생성:** `src/app/dashboard/page.tsx`
2. **Data Fetching:** `useEffect` + `supabase.from('reports').select('*')`
3. **UI 구현:** Tailwind CSS 기반의 반응형 리스트
4. **Navigation:** 메인 페이지 헤더에 '내 대시보드' 링크 추가

## 5. Security
- RLS(Row Level Security) 정책 확인: 사용자는 자신의 데이터(`user_id` match)만 조회 가능해야 함.
