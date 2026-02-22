/**
 * 상업용 부동산 재무 및 세무 시뮬레이션 코어 유틸리티
 * (빅4 컨설팅급 의사결정 패키지용)
 */

interface ProFormaParams {
    purchasePrice: number;    // 매매가 (만원)
    deposit: number;          // 보증금 (만원)
    monthlyRent: number;      // 월세 (만원)
    loanAmount: number;       // 대출금 (만원)
    interestRate: number;     // 연 이자율 (%)
}

/**
 * 상업용 부동산 취득세 계산 (기본 4.6%)
 * - 취득세 4.0%
 * - 농어촌특별세 0.2%
 * - 지방교육세 0.4%
 */
export const calculateAcquisitionTax = (purchasePrice: number): number => {
    // 4.6% = 0.046
    return purchasePrice * 0.046;
};

/**
 * 상업용 부동산 법정 최대 중개보수료 계산 (0.9% + 부가세 10%)
 */
export const calculateBrokerageFee = (purchasePrice: number): number => {
    // 0.9% = 0.009, 부가세 포함 시 0.0099
    return purchasePrice * 0.0099;
};

/**
 * 프로젝트 부대비용 및 실투자금(Total Equity) 타당성 계산
 */
export const calculateInvestmentFeasibility = (params: ProFormaParams) => {
    const { purchasePrice, deposit, loanAmount } = params;

    const acquisitionTax = calculateAcquisitionTax(purchasePrice);
    const brokerageFee = calculateBrokerageFee(purchasePrice);
    const legalAndOtherFees = purchasePrice * 0.002; // 법무사 등 기타 부대비용 (약 0.2% 추산)

    const totalIncidentalCosts = acquisitionTax + brokerageFee + legalAndOtherFees;

    // 실투자금(Equity) = 매매가 + 부대비용 - 보증금(승계) - 대출금
    // QA Agent Self-Correction: Handle NaN, null, and fallback properly
    const safePurchasePrice = Number(purchasePrice) || 0;
    const safeDeposit = Number(deposit) || 0;
    const safeLoanAmount = Number(loanAmount) || 0;

    const netEquity = safePurchasePrice + totalIncidentalCosts - safeDeposit - safeLoanAmount;

    return {
        acquisitionTax,
        brokerageFee,
        legalAndOtherFees,
        totalIncidentalCosts,
        netEquity
    };
};

/**
 * 세전현금흐름(BTCF, Before-Tax Cash Flow) 및 자본환원율(Cap Rate) 계산
 */
export const calculateProFormaCashflow = (params: ProFormaParams) => {
    const { purchasePrice, monthlyRent, loanAmount, interestRate } = params;

    // 1. 연간 잠재총소득 (PGI: Potential Gross Income) - 공실률 0% 가정
    const annualPGI = monthlyRent * 12;

    // 2. 순영업소득 (NOI: Net Operating Income)
    // 현재는 유지보수비, 재산세 등 경비를 5%로 러프하게 가정
    const operatingExpenses = annualPGI * 0.05;
    const annualNOI = annualPGI - operatingExpenses;

    // 3. 자본환원율 (Cap Rate = NOI / 매매가)
    const capRate = purchasePrice > 0 ? (annualNOI / purchasePrice) * 100 : 0;

    // 4. 연간 부채서비스액 (ADS: Annual Debt Service) - 이자만 납부 가정
    const annualDebtService = loanAmount * (interestRate / 100);

    // 5. 세전현금흐름 (BTCF = NOI - ADS)
    const annualBTCF = annualNOI - annualDebtService;
    const monthlyBTCF = annualBTCF / 12;

    // 6. 자기자본수익률 (Cash-on-Cash Return / ROI)
    const feasibility = calculateInvestmentFeasibility(params);
    const equityROI = feasibility.netEquity > 0 ? (annualBTCF / feasibility.netEquity) * 100 : 0;

    return {
        annualPGI,
        operatingExpenses,
        annualNOI,
        capRate,
        annualDebtService,
        annualBTCF,
        monthlyBTCF,
        equityROI
    };
};
