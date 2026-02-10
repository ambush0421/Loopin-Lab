# Design: 부동산 견적서 자동 생성 시스템 (Building Report)

> 버전: 1.1.0 | 작성일: 2026-02-10 | 상태: 수정됨(Updated)

## 1. 개요 (Overview)
사용자가 입력한 주소를 기반으로 공공데이터 API에서 건축 정보를 추출하고, 이를 시각화하여 고품질의 A4 규격 부동산 보고서를 생성하는 시스템의 상세 설계입니다.

## 2. 시스템 아키텍처 (Architecture)
### 기술 스택
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS (A4 Print Layout 최적화)
- **Icons:** Lucide React
- **API Client:** Axios
- **State Management:** React Hooks (useState, useEffect)

### 데이터 흐름
1. **주소 입력:** 사용자 주소 입력 (Kakao Postcode API 연동).
2. **코드 추출:** 주소에서 시군구코드(5자리) 및 법정동코드(5자리) 추출.
3. **API 요청:** Next.js Route Handler(Proxy)를 통해 국토교통부 API 호출.
4. **데이터 정규화:** API 응답(XML/JSON)을 `ReportData` 모델로 변환.
5. **렌더링:** Tailwind CSS를 활용한 A4 레이아웃 리포트 출력.

## 3. 데이터 모델 (Schema)
### BuildingReport Interface
```typescript
interface BuildingReport {
  // 기본 정보
  bldNm: string;                // 건물명
  platAddr: string;             // 대지위치
  
  // 핵심 지표 (Plan 명세 반영)
  vlrtBldRgstYn: 'Y' | 'N';    // 위반건축물여부
  platArea: number;             // 대지면적 (m2)
  totArea: number;              // 연면적 (m2)
  bcRat: number;                // 건폐율 (%)
  vlrat: number;                // 용적률 (%)
  
  // 건축 상세
  mainPurpsCdNm: string;        // 주용도
  strctCdNm: string;            // 구조
  indrMechUtcnt: number;        // 주차장 정보 (기계식/자주식 합계)
  
  // 추가 정보
  useAprvDay: string;           // 사용승인일
  grndFlrCnt: number;           // 지상층수
  ugndFlrCnt: number;           // 지하층수
}
```

## 4. 상세 설계 (Detailed Design)
### 4.1. API 연동 (Route Handler)
- `app/api/building/route.ts`: 공공데이터포털 API Key 보안을 위해 서버 사이드에서 호출 처리.
- 캐싱 전략: 동일 주소에 대한 요청은 24시간 동안 캐싱 (Next.js fetch cache 활용).

### 4.2. UI 레이아웃 (Tailwind)
- **A4 규격:** `w-[210mm] min-h-[297mm]` 클래스를 사용하여 인쇄 시 레이아웃 유지.
- **위반건축물 강조:** `vlrtBldRgstYn === 'Y'`일 경우 상단에 붉은색 경고 배지 및 테두리 강조.
- **데이터 시각화:** 건폐율/용적률을 Progress Bar 또는 원형 차트(CSS)로 표현.

## 5. 테스트 계획 (Test Plan)
| 항목 | 테스트 내용 | 기대 결과 |
|------|------------|----------|
| 주소 검색 | 주소 입력 시 시군구코드 추출 확인 | 5자리 행정구역코드 반환 |
| API 파싱 | 위반건축물 필드(`vlrtBldRgstYn`) 매핑 확인 | 'Y' 또는 'N'으로 정확히 파싱됨 |
| 출력 레이아웃 | 브라우저 인쇄(Ctrl+P) 미리보기 확인 | A4 한 페이지에 내용이 정갈하게 들어옴 |