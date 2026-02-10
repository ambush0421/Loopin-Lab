# Plan: 대량 호실 견적 및 건물 제원 분석 시스템 (Bulk Unit Quotation & Spec)

## 1. 개요 (Overview)
- **목표:** 집합건물의 모든 개별 호실을 조회하여 견적을 산출함과 동시에, **주차/승강기/층수/연면적/준공연차** 등 건물의 핵심 물리적 스펙을 입체적으로 분석함.
- **핵심 가치:** 
  - **호실 조합 견적:** 최대 100개 호실을 묶어 즉시 매매/임대 견적서 생성.
  - **건물 가치 정밀 진단:** 층수, 연면적, 노후도 등을 통해 건물의 물리적 상태 즉시 파악.
  - **실무자 브리핑 최적화:** "지하 5층~지상 20층의 랜드마크급 규모", "준공 3년 차 신축급" 등 구체적 근거 제공.

## 2. 핵심 기능 (Core Features)

### 2.1 건물 제원 마스터 (Comprehensive Building Specs)
- **규모 분석:** 
  - 지하/지상 층수 (`ugndFlrCnt`, `grndFlrCnt`).
  - 총 연면적 (`totArea`).
- **노후도 및 타임라인:** 
  - 사용승인일 (`useAprvDay`) 기준 준공 연차 계산 및 표시.
- **운용 효율성:** 
  - 총 주차대수 및 호실당 주차대수.
  - 승용/비상용 승강기 대수.
  - 총 호수 (`hoCnt`).

### 2.2 대량 호실 조회 및 선택 (Unit Selection)
- 전유부 API 연동을 통한 실시간 호실 리스트 로딩 및 최대 100개 선택 기능.

### 2.3 통합 견적 및 NOC 분석 (Quotation)
- 선택된 호실들의 면적 합계 및 NOC(실질 임대비용) 자동 산출.

## 3. 데이터 모델 확장

### 3.1 BuildingMaster (상세 제원 필드)
```typescript
interface BuildingMaster {
  grndFlrCnt: number;    // 지상 층수
  ugndFlrCnt: number;    // 지하 층수
  totArea: number;       // 연면적 (㎡)
  useAprvDay: string;    // 사용승인일 (YYYYMMDD)
  totPkngCnt: number;    // 총 주차대수
  elevCnt: number;       // 승강기 총수
  hoCnt: number;         // 총 호수
}
```

## 4. 단계별 이행 계획
1.  **Phase 1:** 표제부 API에서 층수, 연면적, 사용승인일 등 상세 제원 추출 및 인포그래픽 UI 구현.
2.  **Phase 2:** 전유부 API 연동 및 대량 호실 선택 그리드 개발.
3.  **Phase 3:** 통합 견적 산출 로직 및 히스토리 저장 기능 강화.