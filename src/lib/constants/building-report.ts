export type ApiErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_JSON'
  | 'INVALID_TYPE'
  | 'INVALID_ITEMS'
  | 'NO_VALID_BUILDINGS'
  | 'INTERNAL_ERROR';

export type ReportType = 'LEASE' | 'PURCHASE' | 'INVEST';

export type WeightInput = Partial<{
  costScore: number;
  areaScore: number;
  parkingScore: number;
  modernityScore: number;
}>;

export type WeightKey = keyof WeightInput;

export type WeightSource = 'request' | 'fallback';

export type WeightMeta = {
  type: ReportType;
  timestamp: string;
  requestedWeights?: WeightInput;
  normalizedWeights?: WeightInput;
  weights: WeightInput;
  weightSource: WeightSource;
  weightNotice?: string;
  weightRuleSummary?: string;
  latency?: string;
  weightAppliedAsExpected?: boolean;
};

export type ApiErrorPayload = {
  code: ApiErrorCode;
  message: string;
  field?: string;
  details?: string;
};

export type ApiErrorResponse = {
  error: ApiErrorPayload;
};

export const API_ERROR_CODE_MESSAGES: Record<ApiErrorCode, string> = {
  INVALID_REQUEST: '요청 본문 형식이 올바르지 않습니다.',
  INVALID_JSON: '요청 본문이 올바른 JSON 형식이 아닙니다.',
  INVALID_TYPE: '요청 type은 LEASE, PURCHASE, INVEST 중 하나여야 합니다.',
  INVALID_ITEMS: '후보 물건 목록 형식이 올바르지 않습니다.',
  NO_VALID_BUILDINGS: '입력한 후보 물건 중 유효한 건물 데이터를 불러오지 못했습니다.',
  INTERNAL_ERROR: '현재 서버 처리 중 일시적인 오류가 발생했습니다.',
};

export const API_ERROR_FIELD_LABELS: Record<string, string> = {
  type: '분석 유형(type)',
  items: '후보 물건 목록(items)',
  currentCost: '현재 비용(currentCost)',
};

export const WEIGHT_KEY_LABELS: Record<WeightKey, string> = {
  costScore: '비용',
  areaScore: '면적',
  parkingScore: '주차',
  modernityScore: '연식',
};

export const WEIGHT_SOURCE_LABELS: Record<WeightSource, string> = {
  request: '요청 가중치 반영',
  fallback: '기본 가중치 기반 계산',
};

export const WEIGHT_KEY_ORDER: WeightKey[] = [
  'costScore',
  'areaScore',
  'parkingScore',
  'modernityScore',
];

export const WEIGHT_RULE_SUMMARIES: Record<WeightSource, string> = {
  request: '요청 가중치의 각 항목(미입력/0/음수 제외)은 합계 100% 기준으로 정규화되어 최종 반영됩니다.',
  fallback: '요청 가중치가 유효하지 않아 기본 가중치 기반으로 계산했습니다.',
};

export const buildWeightRuleSummary = (source: WeightSource, notice?: string): string => {
  if (source === 'request' && notice && notice.includes('일부')) {
    return '요청 가중치 일부만 반영하고, 누락/0/무효 항목은 기본 값으로 보완되어 정규화했습니다.';
  }
  return WEIGHT_RULE_SUMMARIES[source];
};
