import type {
  ReportType,
  WeightInput,
  WeightMeta,
} from '@/lib/constants/building-report';

export type Recommendation = {
  bestBuildingIndex: number;
  reason: string;
  totalScore: number;
};

export type RiskLevel = 'SAFE' | 'CAUTION' | 'DANGER';

export type BuildingMetricValues = {
  cost: number;
  area: number;
  parking: number;
  year: number;
  violation: boolean;
  marketAvgPyung: number;
};

export type BuildingTagValues = {
  isBest?: boolean;
  riskLevel: RiskLevel;
};

export type ComparisonBuilding = {
  id: string;
  name: string;
  address: string;
  analysis: {
    score: number;
    monthlySaving?: number;
    cumulativeEffect3Y?: number;
    breakdown?: {
      costScore: number;
      areaScore: number;
      parkingScore: number;
      modernityScore: number;
    };
  };
  tags: BuildingTagValues;
  metrics: BuildingMetricValues;
  reportType?: ReportType;
  raw?: Record<string, unknown>;
};

export type CompareResponse = {
  meta: WeightMeta;
  recommendation: Recommendation;
  buildings: ComparisonBuilding[];
};

export type CompareWeightInput = {
  requestedWeights?: WeightInput;
  normalizedWeights?: WeightInput;
  weights?: WeightInput;
};
