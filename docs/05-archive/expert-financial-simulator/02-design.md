# Design: 전문가용 금융 시뮬레이터 (Expert Financial Simulator)

> **요약**: 기업 의사결정을 위한 고정밀 세무/대출/수익률 분석 엔진 및 시뮬레이션 UI 설계
>
> **프로젝트**: building-report-pro
> **버전**: 1.0.0
> **작성자**: Gemini Agent
> **날짜**: 2026-02-10
> **상태**: Draft
> **계획 문서**: [expert-financial-simulator.plan.md](../../01-plan/features/expert-financial-simulator.plan.md)

---

## 1. 개요 (Overview)

### 1.1 설계 목표
- **Financial Accuracy**: 한국 세법 및 금융권 대출 산정 방식을 반영한 고정밀 수식 구축.
- **Scenario Analysis**: '최악의 경우(공실률 상승, 금리 인상)'를 가정한 스트레스 테스트 기능 제공.
- **Decision Clarity**: 복잡한 금융 데이터를 직관적인 차트와 요약 지표로 시각화.

---

## 2. 금융 로직 및 수식 (Financial Logic)

### 2.1 세금 산출 엔진 (Tax Engine)
- **취득세**: `매매가 * 요율 (법인/개인, 과밀억제권역 여부에 따라 4.6% ~ 9.4% 차등)`
- **보유세**: `공시지가 * 공정시장가액비율 * 세율` (재산세 + 종부세 추정)

### 2.2 대출 상환 스케줄 (Amortization)
- **PMT 수식**: 원리금 균등 상환액 계산 $PMT = P 	imes \frac{r(1+r)^n}{(1+r)^n - 1}$
- **거치 기간**: 설정된 기간 동안 이자만 납입하는 로직 반영.

---

## 3. 데이터 모델 (Data Model)

### 3.1 시뮬레이션 입력 인터페이스
```typescript
interface FinancialInputs {
  purchasePrice: number;      // 매매가
  targetLoanRatio: number;    // 목표 LTV
  interestRate: number;       // 연 이자율
  isCorporate: boolean;       // 법인 여부
  isInOvercrowded: boolean;   // 과밀억제권역 여부
  expectedVacancy: number;    // 예상 공실률 (%)
  operatingExpenses: number;  // 운영 비용 (관리비 등)
}
```

---

## 4. UI/UX 상세 설계

### 4.1 시뮬레이터 대시보드 구조
- **Top**: 주요 변수 입력 슬라이더 및 토글 (법인 여부 등).
- **Middle**: 
  - **Left**: 초기 필요 자금 분석 (매매가 + 취득세 + 수수료 - 대출).
  - **Right**: 월간 수지 분석 (임대료 - 이자 - 운영비).
- **Bottom**: 5개년 누적 Cash Flow 추이 차트.

### 4.2 시각화 요소
- **Donut Chart**: 초기 투입 자금 구성 (자기자본 vs 대출 vs 세금).
- **Waterfall Chart**: 총 매출에서 세후 순수익까지의 차감 항목 시각화.

---

## 5. 구현 단계 (Implementation Plan)

1. **Step 1**: 금융 계산 라이브러리(`lib/finance.ts`) 구축 및 단위 테스트.
2. **Step 2**: `ExpertCalculator` UI 컴포넌트 개발 (Shadcn UI).
3. **Step 3**: Recharts를 활용한 5개년 수익 시뮬레이션 차트 구현.
4. **Step 4**: 비교 보고서 V3 엔진과 연동하여 '세후 실질 수익률' 항목 추가.
