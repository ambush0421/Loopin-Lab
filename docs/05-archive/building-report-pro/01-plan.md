# Plan: 부동산 의사결정 지원 솔루션 (Building Report Pro)

## 1. 개요 (Overview)
- **목표:** 단순 정보 조회를 넘어, 실무자가 의사결정권자(대표)에게 즉시 보고할 수 있는 **원페이지 투자 브리핑 솔루션** 구축.
- **핵심 가치:** 신속한 의사결정(Speed), 데이터 신뢰성(Reliability), 시각적 설득력(Visual Impact).
- **타겟 유저:** 부동산 실무자(중개, 자문, 개발), 투자 검토역.

## 2. 핵심 기능 (Core Features)

### 2.1 주변 시세 및 호가 분석 (Market Analysis)
- **지도 기반 시각화:** 카카오맵/네이버지도 SDK 연동. 대상지 중심 반경 500m 내 실거래 사례 마커 표시.
- **데이터 통합:**
  - 국토부 실거래가 API (아파트, 연립다세대, 단독다가구, 상업업무용 통합).
  - 네이버 부동산 크롤링/API 연동을 통한 인근 매물 호가 파악 (가능 시).
- **비교 분석:** 대상지 vs 주변 평균 평단가 비교 차트 제공.

### 2.2 수익성 시뮬레이터 (Profitability Logic)
- **간이 수지분석기:**
  - 입력: 매입가, 취등록세율, 대출금(LTV), 금리, 보증금, 월 임대료, 관리비.
  - 출력: 실투자금, 연 수익률(ROI), 자본환원율(Cap Rate), 이자비용, 월 순수익.
- **민감도 분석:** 금리 변동에 따른 수익률 변화 시뮬레이션 (옵션).

### 2.3 모던 대시보드 UI (Modern Design)
- **One-Page Report:** 스크롤 없이 핵심 지표를 파악할 수 있는 Grid 레이아웃.
- **Key Metrics:** 상단에 평단가, 수익률, 대지면적, 용도지역 등 핵심 숫자 대형 배치.
- **Visual:** 텍스트 위주가 아닌 지도, 도넛 차트(용도), 바 차트(시세) 중심 구성.

### 2.4 히스토리 관리 (Utility)
- **로컬 아카이빙:** 검토한 리포트를 JSON DB(파일 기반)에 저장 및 불러오기.
- **프로젝트 관리:** '강남권 빌딩 검토', '성수동 꼬마빌딩' 등 폴더/태그별 관리.

## 3. 기술 스택 (Tech Stack)
- **Frontend:** Next.js 14+, Tailwind CSS, Shadcn/UI (세련된 컴포넌트), Recharts (차트).
- **Map:** React-Kakao-Maps-SDK (카카오맵).
- **Data:** 국토교통부 실거래가 공개시스템 API.
- **Storage:** Local JSON DB (초기 MVP), 추후 Supabase/Firebase 확장 고려.

## 4. 데이터 모델 (Schema Draft)
- **ReportHistory:**
  - `id`: UUID
  - `address`: 주소 객체
  - `buildingInfo`: 건축물대장 요약
  - `financials`: 수익성 분석 입력값 (매입가, 대출 등)
  - `marketData`: 조회 시점의 주변 시세 스냅샷
  - `createdAt`: 생성일

## 5. 성공 기준 (Success Metrics)
- **데이터 정확도:** 실거래가 매칭 성공률 80% 이상.
- **사용성:** 주소 검색부터 수익률 계산까지 1분 이내 완료 (Time-to-Value).
- **결과물:** 대표에게 카톡/PDF로 보냈을 때 "깔끔하다"는 피드백을 들을 수 있는 수준의 UI.

## 6. 단계별 이행 계획 (Roadmap)
1.  **Phase 1 (Data & Map):** 지도 연동 및 실거래가 API 매칭 로직 구현.
2.  **Phase 2 (Logic):** 수익성 분석 계산기 컴포넌트 개발.
3.  **Phase 3 (Design):** 대시보드 UI 전면 개편.
4.  **Phase 4 (Utility):** 히스토리 저장 기능 탑재.
