# Plan: 부동산 견적서 자동 생성 시스템 (Building Report)

## 1. 개요 (Overview)
- **목표:** 건축물대장 API를 연동하여 실무자가 즉시 의사결정을 내릴 수 있는 고품질의 부동산 견적서/보고서 자동 생성.
- **타겟 유저:** 부동산 중개인, 투자 자문가, 건축 실무자.
- **핵심 가치:** 신속성(자동화), 신뢰성(공공데이터 기반), 가독성(시각화된 리포트).

## 2. 주요 기능 (Core Features)
1.  **주소 검색 및 파싱:** 
    - 사용자가 지번/도로명 주소 입력 시 관할구역코드(시군구코드) 및 법정동코드 자동 추출.
    - 카카오 주소 검색 API 또는 유사 서비스 활용 예정.
2.  **건축물대장 데이터 연동:**
    - 공공데이터포털 국토교통부 건축물대장 정보 API 활용.
    - 표제부(기본 개요), 전유부(호수별 정보), 층별개요 등 조회.
3.  **데이터 시각화 및 분석:**
    - 건폐율/용적률 시각화.
    - 위반건축물 여부 하이라이팅 (의사결정 핵심 요소).
    - 용도지역 및 주용도 분석.
4.  **견적서/보고서 생성 (Output):**
    - 웹 뷰어 제공.
    - 인쇄 및 PDF 저장을 고려한 전문적인 CSS 레이아웃 (A4 규격 최적화).

## 3. 기술 스택 (Tech Stack)
- **Frontend:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **API Handling:** Axios (Server Side Proxy)
- **External API:** 국토교통부 건축물대장 조회 서비스 (OpenAPI)

## 4. 데이터 모델 (Schema)
- **Input:** 주소 (도로명/지번)
- **Output:**
    - `vlrtBldRgstYn`: 위반건축물여부
    - `platArea`: 대지면적
    - `totArea`: 연면적
    - `bcRat`: 건폐율
    - `vlrat`: 용적률
    - `mainPurpsCdNm`: 주용도
    - `strctCdNm`: 구조
    - `indrMechUtcnt`: 주차장 정보

## 5. 성공 기준 (Success Metrics)
- 정확한 건축물 대장 정보 조회 성공.
- A4 출력 시 레이아웃 깨짐 없는 보고서 생성.
- 위반건축물 여부 등 핵심 정보의 시각적 강조.
