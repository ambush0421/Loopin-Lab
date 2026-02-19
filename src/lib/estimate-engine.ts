export interface UnitData {
  _uid: string;
  hoNm?: string;
  dongNm?: string;
  flrNo?: string;
  area?: number;
  exposArea?: number;
  pubuseArea?: number;
  etcPurps?: string;
  mainPurpsCdNm?: string;
}

export interface BuildingData {
  bldNm?: string;
  mainPurpsCdNm?: string;
  totArea?: number;
  grndFlrCnt?: number;
  ugrndFlrCnt?: number;
  useAprDay?: string;
  bcRat?: number;
  vlRat?: number;
  strctCdNm?: string;
  indrAutoUtcnt?: number;
  indrMechUtcnt?: number;
}

export interface UnitEstimate {
  unitNo: string;
  floor: string;
  exclusiveArea: number;
  supplyArea: number;
  pyeong: number;
  usage: string;
  buy: {
    pricePerArea: number;
    totalPrice: number;
    acquisitionTax: number;
    registrationFee: number;
    brokerageFee: number;
    totalCost: number;
    pricePerPyeong: number;
  };
  rent: {
    deposit: number;
    monthly: number;
    depositPerPyeong: number;
    monthlyPerPyeong: number;
    interiorCost: number;
    movingCost: number;
    totalInitial: number;
    managementFee: number;
    annualRent: number;
    annualTotal: number;
  };
}

export interface EstimateSummary {
  totalUnits: number;
  totalExclusiveArea: number;
  totalSupplyArea: number;
  totalPyeong: number;
  buy: {
    totalPrice: number;
    totalTax: number;
    totalFees: number;
    grandTotal: number;
  };
  rent: {
    totalDeposit: number;
    totalMonthly: number;
    totalInitial: number;
    totalAnnual: number;
  };
}

export interface PDCAItem {
  label: string;
  value: string;
}

export interface PDCAPhase {
  title: string;
  items: PDCAItem[];
}

export interface PDCAAnalysis {
  plan: PDCAPhase;
  do_phase: PDCAPhase;
  check: PDCAPhase;
  act: PDCAPhase;
}

export interface EstimateResult {
  estimateId: string;
  createdAt: string;
  building: {
    name: string;
    address: string;
    type: string;
    yearBuilt: string;
    totalFloors: number;
  };
  estimateType: 'buy' | 'rent' | 'both';
  units: UnitEstimate[];
  summary: EstimateSummary;
  pdca: PDCAAnalysis;
  bepYears: number;
  bepData: { year: number; buyCumulative: number; rentCumulative: number }[];
  costBreakdown: { name: string; value: number; color: string }[];
}

const MARKET_RATES: Record<string, { buy: number; rent_deposit: number; rent_monthly: number }> = {
  '지식산업센터': { buy: 850, rent_deposit: 30000, rent_monthly: 45 },
  '오피스텔': { buy: 1200, rent_deposit: 50000, rent_monthly: 65 },
  '업무시설': { buy: 1000, rent_deposit: 40000, rent_monthly: 55 },
  '근린생활시설': { buy: 900, rent_deposit: 25000, rent_monthly: 40 },
};

const SHARED_FACILITY_KEYWORDS = [
  '계단실',
  '기계실',
  '전기실',
  '층별공용',
  '공용부분',
  '공유면적',
  '복도',
  '홀',
  '로비',
  '화장실',
  '승강기',
  '엘리베이터',
  'eps',
  'ps',
  '덕트',
  '주차램프',
  '램프',
  '공용',
];

function isSharedFacilityPurpose(value?: string): boolean {
  const normalized = String(value ?? '').trim().replace(/[\s()\-_/.,]/g, '').toLowerCase();
  if (!normalized) return false;
  return SHARED_FACILITY_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function resolveUsageLabel(etcPurps?: string, mainPurpsCdNm?: string, fallback = '-'): string {
  const etc = String(etcPurps ?? '').trim();
  const main = String(mainPurpsCdNm ?? '').trim();
  if (!etc) return main || fallback;
  if (isSharedFacilityPurpose(etc) && main && !isSharedFacilityPurpose(main)) {
    return main;
  }
  return etc || main || fallback;
}

function detectBuildingType(data: BuildingData): string {
  const purpose = data.mainPurpsCdNm || '';
  for (const key of Object.keys(MARKET_RATES)) {
    if (purpose.includes(key)) return key;
  }
  return '업무시설';
}

function getYearBuilt(data: BuildingData): string {
  const raw = data.useAprDay || '';
  return raw.length >= 4 ? raw.substring(0, 4) : '-';
}

function formatMoney(val: number): string {
  if (val >= 10000) return `${(val / 10000).toFixed(1)}억`;
  return `${val.toLocaleString()}만`;
}

interface CustomRates {
  buy?: number;
  rent_deposit?: number;
  rent_monthly?: number;
  management?: number;
}

export function generateEstimate(
  buildingData: BuildingData,
  selectedUnits: UnitData[],
  address: string,
  estimateType: 'buy' | 'rent' | 'both' = 'both',
  customRates?: CustomRates
): EstimateResult {
  const buildingType = detectBuildingType(buildingData);
  const marketRates = MARKET_RATES[buildingType] || MARKET_RATES['업무시설'];

  const rates = {
    buy: customRates?.buy ?? marketRates.buy,
    rent_deposit: customRates?.rent_deposit ?? marketRates.rent_deposit,
    rent_monthly: customRates?.rent_monthly ?? marketRates.rent_monthly,
    management: customRates?.management ?? 12,
  };

  const unitEstimates: UnitEstimate[] = selectedUnits.map((unit) => {
    const exclusiveArea = unit.exposArea || unit.area || 30;
    const commonArea = unit.pubuseArea || exclusiveArea * 0.4;
    const supplyArea = exclusiveArea + commonArea;
    const pyeong = supplyArea / 3.3058;

    const buyPrice = Math.round(rates.buy * (customRates ? pyeong : supplyArea));
    const acquisitionTax = Math.round(buyPrice * 0.046);
    const registrationFee = Math.round(buyPrice * 0.002);
    const brokerageFee = Math.round(buyPrice * 0.005);
    const totalBuyCost = buyPrice + acquisitionTax + registrationFee + brokerageFee;

    const rentDeposit = Math.round(rates.rent_deposit * pyeong);
    const rentMonthly = Math.round(rates.rent_monthly * (customRates ? pyeong : supplyArea));
    const interiorCost = Math.round(pyeong * 350);
    const movingCost = 500;
    const totalRentInitial = rentDeposit + interiorCost + movingCost;
    const managementFee = Math.round(rates.management * pyeong);
    const annualRent = rentMonthly * 12;
    const annualTotal = annualRent + managementFee * 12;

    return {
      unitNo: unit.hoNm || unit._uid,
      floor: unit.flrNo || '-',
      exclusiveArea: Math.round(exclusiveArea * 10) / 10,
      supplyArea: Math.round(supplyArea * 10) / 10,
      pyeong: Math.round(pyeong * 10) / 10,
      usage: resolveUsageLabel(unit.etcPurps, unit.mainPurpsCdNm, buildingType),
      buy: {
        pricePerArea: rates.buy,
        totalPrice: buyPrice,
        acquisitionTax,
        registrationFee,
        brokerageFee,
        totalCost: totalBuyCost,
        pricePerPyeong: Math.round(buyPrice / Math.max(pyeong, 1)),
      },
      rent: {
        deposit: rentDeposit,
        monthly: rentMonthly,
        depositPerPyeong: Math.round(rentDeposit / Math.max(pyeong, 1)),
        monthlyPerPyeong: Math.round(rentMonthly / Math.max(pyeong, 1)),
        interiorCost,
        movingCost,
        totalInitial: totalRentInitial,
        managementFee,
        annualRent,
        annualTotal,
      },
    };
  });

  const summary: EstimateSummary = {
    totalUnits: unitEstimates.length,
    totalExclusiveArea: unitEstimates.reduce((s, u) => s + u.exclusiveArea, 0),
    totalSupplyArea: unitEstimates.reduce((s, u) => s + u.supplyArea, 0),
    totalPyeong: unitEstimates.reduce((s, u) => s + u.pyeong, 0),
    buy: {
      totalPrice: unitEstimates.reduce((s, u) => s + u.buy.totalPrice, 0),
      totalTax: unitEstimates.reduce((s, u) => s + u.buy.acquisitionTax, 0),
      totalFees: unitEstimates.reduce((s, u) => s + u.buy.registrationFee + u.buy.brokerageFee, 0),
      grandTotal: unitEstimates.reduce((s, u) => s + u.buy.totalCost, 0),
    },
    rent: {
      totalDeposit: unitEstimates.reduce((s, u) => s + u.rent.deposit, 0),
      totalMonthly: unitEstimates.reduce((s, u) => s + u.rent.monthly, 0),
      totalInitial: unitEstimates.reduce((s, u) => s + u.rent.totalInitial, 0),
      totalAnnual: unitEstimates.reduce((s, u) => s + u.rent.annualTotal, 0),
    },
  };

  const bepYears = Math.max(
    1,
    Math.ceil(summary.buy.grandTotal / Math.max(summary.rent.totalAnnual, 1))
  );

  const bepData = Array.from({ length: Math.min(bepYears + 5, 30) }, (_, i) => {
    const year = i + 1;
    return {
      year,
      buyCumulative: Math.round((summary.buy.grandTotal * year) / 10000),
      rentCumulative: Math.round((summary.rent.totalInitial + summary.rent.totalAnnual * year) / 10000),
    };
  });

  const costBreakdown = [
    { name: '매입가', value: summary.buy.totalPrice, color: '#3B82F6' },
    { name: '취득세', value: summary.buy.totalTax, color: '#EF4444' },
    { name: '등기/중개비', value: summary.buy.totalFees, color: '#F59E0B' },
  ];

  const pdca: PDCAAnalysis = {
    plan: {
      title: 'Plan - 계획',
      items: [
        { label: '대상 건물', value: buildingData.bldNm || address.split(' ').slice(0, 3).join(' ') },
        { label: '건물 유형', value: buildingType },
      ],
    },
    do_phase: {
      title: 'Do - 실행',
      items: [
        { label: '매입 총액', value: formatMoney(summary.buy.grandTotal) },
        { label: '임차 보증금', value: formatMoney(summary.rent.totalDeposit) },
      ],
    },
    check: {
      title: 'Check - 점검',
      items: [{ label: 'BEP', value: `약 ${bepYears}년` }],
    },
    act: {
      title: 'Act - 개선',
      items: [
        { label: '권장 전략', value: bepYears > 15 ? '임차 우선 검토' : '매입 우선 검토' },
      ],
    },
  };

  return {
    estimateId: `EST-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    building: {
      name: buildingData.bldNm || '건물',
      address,
      type: buildingType,
      yearBuilt: getYearBuilt(buildingData),
      totalFloors: (buildingData.grndFlrCnt || 0) + (buildingData.ugrndFlrCnt || 0),
    },
    estimateType,
    units: unitEstimates,
    summary,
    pdca,
    bepYears,
    bepData,
    costBreakdown,
  };
}
