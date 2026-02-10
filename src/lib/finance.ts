/**
 * 전문가용 금융 시뮬레이션 엔진
 */

export interface FinancialInputs {
  purchasePrice: number;      // 매매가 (원)
  targetLoanRatio: number;    // 목표 LTV (%)
  interestRate: number;       // 연 이자율 (%)
  loanTermYears: number;      // 대출 기간 (년)
  gracePeriodMonths: number;  // 거치 기간 (개월)
  isCorporate: boolean;       // 법인 여부
  isInOvercrowded: boolean;   // 과밀억제권역 여부
  expectedVacancy: number;    // 예상 공실률 (%)
  operatingExpenses: number;  // 월 운영 비용 (관리비 등)
  monthlyRent: number;        // 월 임대료 수입 (만원)
}

export interface AmortizationSchedule {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  remainingBalance: number;
}

/**
 * 취득세 계산 (한국 세법 기준 간소화 모델)
 */
export function calculateAcquisitionTax(price: number, isCorporate: boolean, isInOvercrowded: boolean): number {
  // 기본 취득세율 4.6% (취득세 4% + 농어촌특별세 0.2% + 지방교육세 0.4%)
  let rate = 0.046;

  // 법인이 과밀억제권역 내 부동산 취득 시 중과세 (약 9.4%로 상승하는 케이스 반영)
  if (isCorporate && isInOvercrowded) {
    rate = 0.094;
  }

  return Math.floor(price * rate);
}

/**
 * 대출 상환 스케줄 생성 (원리금균등상환)
 */
export function generateAmortizationSchedule(
  loanAmount: number,
  annualRate: number,
  termYears: number,
  graceMonths: number
): AmortizationSchedule[] {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = termYears * 12;
  const repaymentMonths = totalMonths - graceMonths;
  
  let remainingBalance = loanAmount;
  const schedule: AmortizationSchedule[] = [];

  // PMT (원리금 균등 상환액) 계산
  const pmt = repaymentMonths > 0 
    ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, repaymentMonths)) / (Math.pow(1 + monthlyRate, repaymentMonths) - 1)
    : 0;

  for (let m = 1; m <= totalMonths; m++) {
    const interest = remainingBalance * monthlyRate;
    let principal = 0;
    let payment = interest;

    if (m > graceMonths) {
      payment = pmt;
      principal = pmt - interest;
    }

    remainingBalance -= principal;
    
    schedule.push({
      month: m,
      payment: Math.floor(payment),
      interest: Math.floor(interest),
      principal: Math.floor(principal),
      remainingBalance: Math.max(0, Math.floor(remainingBalance))
    });
  }

  return schedule;
}

/**
 * 종합 수익률 분석 (Net ROI)
 */
export function analyzePerformance(inputs: FinancialInputs) {
  const acqTax = calculateAcquisitionTax(inputs.purchasePrice, inputs.isCorporate, inputs.isInOvercrowded);
  const totalInitialCost = inputs.purchasePrice + acqTax; // 중개수수료 등 생략
  
  const loanAmount = inputs.purchasePrice * (inputs.targetLoanRatio / 100);
  const equity = totalInitialCost - loanAmount; // 자기자본
  
  const schedule = generateAmortizationSchedule(loanAmount, inputs.interestRate, inputs.loanTermYears, inputs.gracePeriodMonths);
  const firstYearInterest = schedule.slice(0, 12).reduce((sum, s) => sum + s.interest, 0);
  
  const grossAnnualIncome = (inputs.monthlyRent * 10000) * 12 * (1 - inputs.expectedVacancy / 100);
  const annualOpEx = (inputs.operatingExpenses * 10000) * 12;
  const netOperatingIncome = grossAnnualIncome - annualOpEx;
  const NOI = netOperatingIncome;
  
  const cashFlowBeforeTax = NOI - firstYearInterest;
  const cashOnCashReturn = (cashFlowBeforeTax / equity) * 100;

  return {
    initial: {
      acquisitionTax: acqTax,
      loanAmount,
      equity,
      totalCost: totalInitialCost
    },
    monthly: {
      grossIncome: inputs.monthlyRent * 10000,
      interest: Math.floor(firstYearInterest / 12),
      noi: Math.floor(NOI / 12),
      cashFlow: Math.floor(cashFlowBeforeTax / 12)
    },
    metrics: {
      capRate: (NOI / inputs.purchasePrice) * 100,
      cocReturn: cashOnCashReturn
    }
  };
}
