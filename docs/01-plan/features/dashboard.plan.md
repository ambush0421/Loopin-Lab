# Dashboard Plan Document

> Version: 1.0.0 | Created: 2026-02-10 | Status: Draft

## 1. Executive Summary
사용자가 과거에 생성하고 Supabase 클라우드에 저장한 부동산 분석 보고서들을 한눈에 확인하고 관리할 수 있는 대시보드 기능을 개발합니다.

## 2. Goals and Objectives
- 저장된 보고서 목록 조회 기능 구현.
- 특정 보고서 재열람 및 PDF 출력 기능 연동.
- 주소/건물명 기반 검색 및 정렬 기능 제공.
- 보고서 삭제 및 관리 기능 추가.

## 3. Scope
### In Scope
- Supabase `reports` 테이블 데이터 페칭 로직.
- 보고서 리스트 UI (카드형 또는 리스트형).
- 검색바 및 정렬 필터.
- 상세 보기 페이지 연동.

### Out of Scope
- 보고서 공유 기능 (v4 이후 검토).
- 대시보드 통계 시각화 (v4 이후 검토).

## 4. Success Criteria
| Criterion | Metric | Target |
|-----------|--------|--------|
| 조회 속도 | 목록 로딩 시간 | < 1초 |
| 사용성 | 검색 정확도 | 100% |
| 일치성 | 데이터 정합성 | DB 데이터와 UI 일치 |

## 5. Timeline
| Milestone | Date | Description |
|-----------|------|-------------|
| Plan | 오늘 | 요구사항 정의 |
| Design | 오늘 | DB 쿼리 및 UI 설계 |
| Implementation| 이번 주 | 대시보드 페이지 구현 |

## 6. Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| 데이터 과부하 | 중간 | 페이지네이션(Pagination) 도입 |
| 권한 에러 | 높음 | Supabase RLS 정책 철저 적용 |
