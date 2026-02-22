export const toSafeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * 만원 단위 숫자를 정규화해 문자열로 렌더링합니다.
 * 규칙: 10,000만원 이상은 'X억'로 표기, 미만은 '만원' 단위로 표기.
 */
export const formatManwon = (value: unknown): string => {
  const n = Math.abs(toSafeNumber(value));
  if (n >= 10000) return `${(n / 10000).toFixed(1)}억`;
  return `${n.toLocaleString()}만원`;
};

/**
 * 만원 단위 금액에 부호(+/-)를 붙여 표시합니다.
 * 출력 예: +1.2억, -500만원, 0만원
 */
export const formatSignedManwon = (value: unknown): string => {
  const n = toSafeNumber(value);
  const prefix = n > 0 ? '+' : n < 0 ? '-' : '';
  return `${prefix}${formatManwon(n)}`;
};

/**
 * 절감/증가 표시를 위해 방향 화살표(▼/▲)와 함께 표시합니다.
 * 양수는 ▼, 음수는 ▲로 렌더링됩니다.
 */
export const formatSignedDelta = (value: unknown): string => {
  const n = toSafeNumber(value);
  if (n === 0) return formatManwon(0);
  return `${n > 0 ? '▼ ' : '▲ '}${formatManwon(Math.abs(n))}`;
};

/**
 * 만원 단위를 억으로 변환해 'X억'으로 표시합니다.
 */
export const formatBillionFromManwon = (value: unknown): string => {
  const n = toSafeNumber(value) / 10000;
  return `${n.toLocaleString()}억`;
};

/**
 * 만원 단위 금액에 부호(+/-)를 붙인 억 단위 문자열을 반환합니다.
 * 출력 예: +1.2억, -2억, 0억
 */
export const formatSignedBillionFromManwon = (value: unknown): string => {
  const n = toSafeNumber(value) / 10000;
  const prefix = n > 0 ? '+' : n < 0 ? '-' : '';
  return `${prefix}${formatBillionFromManwon(Math.abs(n))}`;
};
