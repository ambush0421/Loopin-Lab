import { calculateAcquisitionTax, generateAmortizationSchedule, analyzePerformance } from '../finance';

describe('Finance Library', () => {
  test('calculateAcquisitionTax handles corporate and overcrowded rules', () => {
    const price = 1000000000; // 10억
    
    // 일반 개인 (4.6%)
    expect(calculateAcquisitionTax(price, false, false)).toBe(46000000);
    
    // 법인 + 과밀억제권역 (9.4%)
    expect(calculateAcquisitionTax(price, true, true)).toBe(94000000);
  });

  test('generateAmortizationSchedule calculates PMT correctly', () => {
    const loan = 100000000; // 1억
    const rate = 4.0;
    const term = 10;
    const grace = 0;
    
    const schedule = generateAmortizationSchedule(loan, rate, term, grace);
    expect(schedule.length).toBe(120);
    // 대략적인 월 납입금 (101만원 수준)
    expect(schedule[0].payment).toBeGreaterThan(1000000);
    expect(schedule[119].remainingBalance).toBe(0);
  });

  test('analyzePerformance returns valid ROI metrics', () => {
    const inputs = {
      purchasePrice: 1000000000,
      targetLoanRatio: 50,
      interestRate: 4.0,
      loanTermYears: 20,
      gracePeriodMonths: 0,
      isCorporate: false,
      isInOvercrowded: false,
      expectedVacancy: 0,
      operatingExpenses: 50,
      monthlyRent: 500
    };
    
    const result = analyzePerformance(inputs);
    expect(result.metrics.capRate).toBeGreaterThan(0);
    expect(result.initial.equity).toBe(1000000000 + 46000000 - 500000000);
  });
});
