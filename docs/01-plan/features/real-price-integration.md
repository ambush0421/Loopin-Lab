# Plan: 실거래가 데이터 실시간 연동 (Real Price Integration)

## 1. 개요 (Overview)
- **목표:** 현재 Mock Data로 동작 중인 시세 차트와 지도 마커를 **국토교통부 실거래가 API**와 연동하여 실제 시장 데이터를 제공함.
- **핵심 가치:** 
  - **데이터 신뢰성:** "카더라" 통신이 아닌 정부 공인 실거래가 기반의 분석.
  - **비교 분석:** 대상 건물과 인근 유사 사례의 평단가를 즉시 비교.
  - **의사결정 지원:** 매매가/임대료 책정의 객관적 근거 마련.

## 2. 핵심 기능 (Core Features)

### 2.1 실거래가 데이터 수집 (Data Aggregation)
- **API 연동:** 국토교통부 상업업무용 부동산 매매 신고가 자료 API 활용.
- **범위 설정:** 대상지 법정동 코드(`bjdongCd`) 기준 최근 1~2년치 거래 내역 조회.
- **데이터 필터링:** 
  - 대상 건물과 유사한 용도(업무시설, 근린생활시설 등)만 필터링.
  - 비정상적인 저가/고가 거래(특수관계인 거래 추정) 제외 옵션.

### 2.2 시세 시각화 (Visualization)
- **지도 마커(Map):** 거래된 위치에 마커를 찍고, 클릭 시 [거래연월 / 층수 / 평당가] 표시.
- **추이 차트(Chart):** `MarketChart` 컴포넌트를 업데이트하여 월별/분기별 평균 평단가 추세선 그리기.

### 2.3 비교 분석 지표 (Comparative Metrics)
- **대상지 vs 평균:** 현재 보고 있는 건물의 평당 호가와 주변 실거래 평균가를 비교하여 **"적정가 / 고평가 / 저평가"** 상태 진단.

## 3. 기술 스택 및 데이터 모델

### 3.1 신규 API Route
- `GET /api/market-price`: 법정동코드를 받아 해당 지역의 실거래가 리스트 반환.

### 3.2 Data Schema
```typescript
interface TransactionItem {
  dealYear: string;   // 계약년도
  dealMonth: string;  // 계약월
  dealDay: string;    // 계약일
  price: string;      // 거래금액 (만원)
  buildYear: string;  // 건축년도
  area: number;       // 건물면적
  floor: number;      // 층
  type: string;       // 건물용도
}
```

## 4. 단계별 이행 계획
1.  **Phase 1 (API):** 실거래가 API 연동 및 데이터 파싱 로직 구현.
2.  **Phase 2 (Integration):** 프론트엔드(`InvestmentMap`, `MarketChart`)에 실제 데이터 연결.
3.  **Phase 3 (Analysis):** 평단가 계산 및 비교 로직 적용.
