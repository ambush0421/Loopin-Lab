# Design: 보고서 UI 고도화 (UI Refinement)

## 1. 비각 디자인 시스템 (Visual Identity)
- **컨셉:** "The Black Table" - 최고급 비즈니스 실무 문서 테마.
- **색상:** 
  - Main: Black (#000000)
  - Sub: White (#FFFFFF), Neutral Gray (#F5F5F5, #A3A3A3)
- **타이포그래피:** 
  - 영문: Inter (Bold/Black)
  - 한글: Pretendard (Variable)
  - 감성: 고대비(High Contrast)와 넓은 자간(Tracking)을 활용한 전문성 강조.

## 2. 주요 컴포넌트 설계
- **Header:** 두꺼운 블랙 보더(border-b-4)와 대문자 타이포그래피. 결재란(Approval)을 격자 구조로 배치.
- **Metrics Grid:** 4열 그리드에 배경색 반전(Invert)을 활용하여 핵심 수치 강조.
- **Info Table:** 정보 구분을 위해 얇은 neutral-200 선 사용. 레이블은 [11px] 굵은 서체 권장.
- **Recommendation Card:** 등급(A/B/C)을 블랙 박스에 표기하여 시각적 결론 도출.

## 3. 용어 매핑 (Terminology Mapping)
- `Deposit` → `보증금`
- `Monthly Rent` → `월 임대료`
- `CAP RATE` → `예상 수익률 (연)`
- `ROE` → `내 돈 대비 수익률`
- `Investment Analysis` → `수익성 분석`
