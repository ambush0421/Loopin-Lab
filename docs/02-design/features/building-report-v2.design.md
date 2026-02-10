# Design: Building Report Pro v2 (Supabase & Multi-API Integration)

> 버전: 2.0.0 | 작성일: 2026-02-10 | 상태: 초안(Draft)

## 1. 개요 (Overview)
v2 시스템은 클라우드 기반의 데이터 저장소(Supabase)를 도입하고, 공시지가 및 토지 정보를 추가하여 실무자에게 더 깊이 있는 분석을 제공하는 것을 목표로 합니다.

## 2. 시스템 아키텍처 (Architecture)
### 확장된 기술 스택
- **Backend-as-a-Service:** Supabase (Auth, PostgreSQL)
- **Data Fetching:** TanStack Query (v5) - 캐싱 및 실동기화 관리
- **Visualization:** Recharts (공시지가 추이 그래프)
- **Additional APIs:** 
  - 국토교통부_공시지가 조회 서비스
  - 국토교통부_토지임야대장 조회 서비스

### 시스템 흐름도
[Client] <-> [Next.js Route Handlers] <-> [External APIs (건축/토지/가격)]
   ^               |
   |               v
   +------> [Supabase Auth/DB]

## 3. 데이터 모델 (Data Model)
### Supabase 스키마 (Reports Table)
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  address TEXT NOT NULL,
  building_data JSONB,      -- 건축물대장 API 원본
  land_data JSONB,          -- 토지대장 API 원본
  price_data JSONB,         -- 공시지가 API 원본
  analysis_comment TEXT,    -- 실무자 의견
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. 상세 설계 (Detailed Design)
### 4.1. 공시지가 시각화
- 최근 5개년 데이터를 추출하여 선 그래프(Line Chart)로 렌더링.
- `src/components/PriceChart.tsx` 신규 생성.

### 4.2. 토지 정보 통합
- 지목(용도), 면적, 토지이용계획 요약 정보를 보고서 상단에 추가.
- `src/components/LandInfoSection.tsx` 신규 생성.

### 4.3. 모바일 반응형 UI
- Tailwind의 `grid-cols-1 md:grid-cols-2` 패턴을 강화.
- 모바일에서 'PDF 생성' 버튼을 플로팅 액션 버튼(FAB)으로 구현.

## 5. 테스트 계획 (Test Plan)
| 항목 | 테스트 내용 | 기대 결과 |
|------|------------|----------|
| Supabase Auth | 회원가입 및 로그인 연동 | 세션 유지 및 사용자별 데이터 분리 |
| DB 저장 | 보고서 저장 버튼 클릭 시 Supabase 적재 | `reports` 테이블에 JSON 데이터 정상 저장 |
| 데이터 병합 | 3개 API(건축/토지/가격) 데이터 병합 | 하나의 보고서에 모든 정보가 누락 없이 표시됨 |
