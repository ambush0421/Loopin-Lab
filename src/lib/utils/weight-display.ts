import { toSafeNumber } from '@/lib/utils/finance-format';
import {
  WEIGHT_KEY_LABELS,
  WEIGHT_KEY_ORDER,
  WEIGHT_SOURCE_LABELS,
  type WeightInput,
  type WeightKey,
  type WeightSource,
} from '@/lib/constants/building-report';

export type WeightDisplayRow = {
  key: WeightKey;
  label: string;
  detail: string;
  missingInput: boolean;
};

export const formatWeightSummary = (weights?: WeightInput): string => {
  return WEIGHT_KEY_ORDER.map((key) => {
    const label = WEIGHT_KEY_LABELS[key];
    const value = toSafeNumber(weights?.[key]) * 100;
    return `${label} ${value.toFixed(1)}%`;
  }).join(' / ');
};

export const formatWeightDetail = (
  key: WeightKey,
  requested?: WeightInput,
  normalized?: WeightInput,
  final?: WeightInput,
) => {
  const req = toSafeNumber(requested?.[key]) * 100;
  const normalizedVal = toSafeNumber(normalized?.[key]) * 100;
  const finalVal = toSafeNumber(final?.[key]) * 100;
  if (req <= 0 && normalizedVal > 0 && finalVal > 0) {
    return `요청: ${req.toFixed(1)}% / 정규화: ${normalizedVal.toFixed(1)}% / 최종: ${finalVal.toFixed(1)}% (요청 미입력/보완됨)`;
  }
  return `요청: ${req.toFixed(1)}% / 정규화: ${normalizedVal.toFixed(1)}% / 최종: ${finalVal.toFixed(1)}%`;
};

export const buildWeightDisplayRows = (
  requested?: WeightInput,
  normalized?: WeightInput,
  final?: WeightInput,
): WeightDisplayRow[] => {
  return WEIGHT_KEY_ORDER.map((key) => {
    const requestedVal = requested?.[key];
    return {
      key,
      label: WEIGHT_KEY_LABELS[key],
      detail: formatWeightDetail(key, requested, normalized, final),
      missingInput: toSafeNumber(requestedVal) <= 0,
    };
  });
};

export const getWeightSourceLabel = (source?: WeightSource): string => {
  if (source === 'request' || source === 'fallback') {
    return WEIGHT_SOURCE_LABELS[source];
  }
  return WEIGHT_SOURCE_LABELS.fallback;
};
