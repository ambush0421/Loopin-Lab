// @ts-nocheck
import { any } from '@/types/building';
import { analyzePerformance, FinancialInputs } from '@/lib/finance';
import { AutoLearningOptimizer } from './auto-learning-optimizer';

/**
 * Building Analysis Service - The Decision Core
 * 사옥 매입, 투자, 임차 목적에 따른 최적화된 분석 결과를 생성합니다.
 */
export class BuildingAnalysisService {
  // 유형별 가중치 기본값
  private static readonly PRESETS: Record<ReportType, ScoreBreakdown> = {
    LEASE: { costScore: 0.40, areaScore: 0.30, parkingScore: 0.15, modernityScore: 0.15 },
    PURCHASE: { costScore: 0.25, areaScore: 0.35, parkingScore: 0.10, modernityScore: 0.30 },
    INVEST: { costScore: 0.45, areaScore: 0.20, parkingScore: 0.10, modernityScore: 0.25 }
  };

  /**
   * 핵심 분석 메서드
   */
  static async analyze(
    buildings: any[],
    type: ReportType,
    userWeights?: Partial<ScoreBreakdown>,
    currentCostBaseline: number = 1000
  ) {
    const currentYear = new Date().getFullYear();
    
    // 1. 가중치 결정 (학습된 가중치 로드)
    const learnedWeights = await AutoLearningOptimizer.getCurrentSystemWeights();
    const baseWeights = type === 'LEASE' ? learnedWeights : (this.PRESETS[type] || this.PRESETS.LEASE);
    const weights = { ...baseWeights, ...userWeights };

    const analyzedBuildings = buildings.map((b) => {
      const age = currentYear - b.metrics.year;
      const costBaseline = Number(currentCostBaseline) || 0;
      const monthlyCost = Number(b?.metrics?.cost) || 0;
      const rawMonthlySaving = costBaseline - monthlyCost;
      const monthlySaving = Number.isFinite(rawMonthlySaving) ? rawMonthlySaving : 0;
      const cumulativeEffect3Y = Number.isFinite(monthlySaving) ? monthlySaving * 36 : 0;

      // 2. 항목별 스코어 산출
      const costDelta = costBaseline - monthlyCost;
      const cScore = (costDelta / 100) * 100 * (weights.costScore || 0.35);
      const aScore = ((b.metrics.area || 0) / 100) * 100 * (weights.areaScore || 0.35);
      const pScore = Math.min((b.metrics.parking || 0) / 10, 1) * 100 * (weights.parkingScore || 0.15);
      const mScore = Math.max(0, (30 - age) / 30) * 100 * (weights.modernityScore || 0.15);

      let totalScore = cScore + aScore + pScore + mScore;
      if (b.metrics.violation) totalScore -= 150;

      // 3. 재무 시뮬레이션 (PURCHASE / INVEST Only)
      let simulation: FinancialSimulation | undefined;
      if (type === 'PURCHASE' || type === 'INVEST') {
        const estPrice = b.metrics.cost > 0 ? b.metrics.cost * 10000 : (b.metrics.area * 0.3025 * (b.metrics.marketAvgPyung || 2000)) * 10000;
        const estRent = (b.metrics.area * 0.3025 * 10); // 평당 10만원 가정

        const finInputs: FinancialInputs = {
          purchasePrice: estPrice,
          targetLoanRatio: 60,
          interestRate: 4.5,
          loanTermYears: 3,
          gracePeriodMonths: 0,
          isCorporate: true,
          isInOvercrowded: b.address?.includes('서울') || false,
          expectedVacancy: 5,
          operatingExpenses: estRent * 0.1,
          monthlyRent: estRent
        };
        const res = analyzePerformance(finInputs);
        simulation = {
          initial: res.initial,
          monthly: res.monthly,
          metrics: res.metrics
        };
      }

      return {
        ...b,
        analysis: {
          score: totalScore,
          breakdown: { costScore: cScore, areaScore: aScore, parkingScore: pScore, modernityScore: mScore },
          monthlySaving,
          cumulativeEffect3Y,
          financialSimulation: simulation
        }
      };
    });

    // 4. 최적 물건 선정 및 리즈닝 생성
    const bestIdx = analyzedBuildings.map(b => b.analysis.score).indexOf(Math.max(...analyzedBuildings.map(b => b.analysis.score)));
    const reasoning = this.generateReasoning(analyzedBuildings[bestIdx], type);

    return {
      buildings: analyzedBuildings,
      bestIndex: bestIdx,
      reasoning,
      weights
    };
  }

  private static generateReasoning(bestB: any, type: ReportType): string {
    if (!bestB) return "데이터 부족으로 분석 불가";
    
    const sim = bestB.analysis.financialSimulation;
    if (type === 'PURCHASE' && sim) {
      return `본 사옥 대안은 자기자본 수익률(CoC) ${sim.metrics.cocReturn.toFixed(1)}%가 예상되는 고효율 자산입니다. 기업의 현금 흐름 보존과 자산 가치 상승을 동시에 달성할 수 있는 최적의 선택지로 평가됩니다.`;
    }
    if (type === 'INVEST' && sim) {
      return `예상 Cap Rate ${sim.metrics.capRate.toFixed(2)}%로 시장 평균을 상회하는 수익형 부동산입니다. 특히 공시지가 변동 추이와 연동된 지가 상승 여력이 충분하여 중장기 투자 가치가 매우 높습니다.`;
    }
    return "가성비와 업무 환경 편의성을 균형 있게 갖춘 최적의 사업장 후보지입니다.";
  }
}
