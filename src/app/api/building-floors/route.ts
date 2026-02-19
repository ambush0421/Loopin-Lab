export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const API_KEY = process.env.BUILDING_API_KEY;
const BASE_SERVICE_URL = 'https://apis.data.go.kr/1613000/BldRgstHubService';
const FLOOR_ENDPOINT_PATHS = ['getBrFlrOulnInfo', 'getBrFlrOvrInfo'] as const;

const PAGE_SIZE = 100;
const MAX_PAGES = 150;

type RawFloorItem = Record<string, unknown>;
type PublicFloorApiResponse = {
  response?: {
    body?: {
      totalCount?: number | string;
      items?: {
        item?: unknown[] | unknown;
      };
    };
  };
};

function validateParam(value: string | null, maxLength: number = 10): string {
  if (!value) return '';
  return value.replace(/[^0-9]/g, '').substring(0, maxLength);
}

function validateDongNm(value: string | null, maxLength: number = 40): string {
  if (!value) return '';
  return value.replace(/[^0-9A-Za-z가-힣-]/g, '').substring(0, maxLength);
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim();
}

function hasBasementKeyword(value: string): boolean {
  return /지하|basement|(?:^|[^A-Za-z])B\d+/iu.test(value);
}

function isBasementPurpose(value: string): boolean {
  return /지하/iu.test(value);
}

function normalizeDecimalString(value: unknown): string {
  const raw = String(value ?? '').replace(/,/g, '').trim();
  if (!raw) return '0';
  if (/^-?\d+(\.\d+)?$/.test(raw)) return raw;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed.toString() : '0';
}

function addDecimalStrings(a: string, b: string): string {
  const [aIntRaw, aFracRaw = ''] = a.split('.');
  const [bIntRaw, bFracRaw = ''] = b.split('.');
  const scale = Math.max(aFracRaw.length, bFracRaw.length);
  const base = BigInt(`1${'0'.repeat(scale)}`);

  const toScaled = (intRaw: string, fracRaw: string): bigint => {
    const isNegative = intRaw.startsWith('-');
    const unsignedInt = isNegative ? intRaw.slice(1) : intRaw;
    const scaledStr = `${unsignedInt || '0'}${fracRaw.padEnd(scale, '0')}`;
    const scaled = BigInt(scaledStr);
    return isNegative ? -scaled : scaled;
  };

  const sum = toScaled(aIntRaw, aFracRaw) + toScaled(bIntRaw, bFracRaw);
  if (scale === 0) return sum.toString();

  const zero = BigInt(0);
  const sign = sum < zero ? '-' : '';
  const abs = sum < zero ? -sum : sum;
  const intPart = (abs / base).toString();
  const fracPart = (abs % base).toString().padStart(scale, '0').replace(/0+$/, '');
  return fracPart ? `${sign}${intPart}.${fracPart}` : `${sign}${intPart}`;
}

function pickAreaRaw(item: RawFloorItem): string {
  const areaCandidates: unknown[] = [
    item.area,
    item.flrArea,
    item.flrOvrArea,
    item.flrAr,
    item.dongTotArea,
    item.totArea,
    item.archArea,
  ];

  const dynamicAreaValues = Object.keys(item)
    .filter((key) => key.toLowerCase().includes('area'))
    .map((key) => item[key]);
  areaCandidates.push(...dynamicAreaValues);

  for (const candidate of areaCandidates) {
    const normalized = normalizeDecimalString(candidate);
    if (normalized !== '0') return normalized;
  }
  return normalizeDecimalString(areaCandidates[0]);
}

function parseFloorNo(item: RawFloorItem): number {
  const flrGbCd = normalizeText(item.flrGbCd);
  const flrGbCdNm = normalizeText(item.flrGbCdNm);
  const floorName = normalizeText(item.flrNoNm || item.floorNm);
  const purposeText = `${normalizeText(item.etcPurps)} ${normalizeText(item.mainPurpsCdNm)}`.trim();
  const rawCandidates = [item.flrNo, item.floorNo, item.flrNoNm, item.floorNm];

  const basementHint =
    flrGbCd === '10'
    || hasBasementKeyword(flrGbCdNm)
    || hasBasementKeyword(floorName)
    || isBasementPurpose(purposeText);
  const groundHint = flrGbCd === '20' || /지상/iu.test(flrGbCdNm);

  let floor = 0;
  for (const candidate of rawCandidates) {
    const raw = normalizeText(candidate);
    if (!raw) continue;

    if (/^-?\d+$/.test(raw)) {
      floor = Number(raw);
      break;
    }

    const numericText = raw.replace(/[^\d-]/g, '');
    if (numericText && /^-?\d+$/.test(numericText)) {
      floor = Number(numericText);
      break;
    }
  }

  if (flrGbCd === '10' && floor > 0) {
    return -floor;
  }
  if (basementHint && floor > 0) {
    return -floor;
  }
  if (groundHint && floor < 0) {
    return Math.abs(floor);
  }
  return floor;
}

function pickPurposeByFloor(floorNo: number, currentRaw: string, candidateRaw: string): string {
  const current = currentRaw.trim();
  const candidate = candidateRaw.trim();
  if (!candidate) return current;
  if (!current) return candidate;

  const currentBasement = isBasementPurpose(current);
  const candidateBasement = isBasementPurpose(candidate);

  if (floorNo > 0) {
    if (candidateBasement && !currentBasement) return current;
    if (!candidateBasement && currentBasement) return candidate;
  }
  if (floorNo < 0) {
    if (candidateBasement && !currentBasement) return candidate;
    if (!candidateBasement && currentBasement) return current;
  }

  return candidate.length > current.length ? candidate : current;
}

async function fetchPage(
  endpointPath: string,
  params: Record<string, string>,
  pageNo: number,
): Promise<PublicFloorApiResponse> {
  if (!API_KEY) throw new Error('API_CONFIG_ERROR');

  const serviceKey = encodeURIComponent(API_KEY);
  const queryParams = [
    `serviceKey=${serviceKey}`,
    ...Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`),
    `numOfRows=${PAGE_SIZE}`,
    `pageNo=${pageNo}`,
    '_type=json',
  ].join('&');

  const response = await fetch(`${BASE_SERVICE_URL}/${endpointPath}?${queryParams}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  const rawData = await response.text();

  if (rawData.includes('Unexpected errors')) {
    throw new Error('API_AUTH_ERROR');
  }
  if (rawData.trim().startsWith('<')) {
    throw new Error('XML_RESPONSE');
  }

  const parsed: unknown = JSON.parse(rawData);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('INVALID_JSON');
  }
  return parsed as PublicFloorApiResponse;
}

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    logger.error({ event: 'api.floors.config_error', message: 'API key not configured' });
    return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const sigunguCd = validateParam(searchParams.get('sigunguCd'), 5);
  const bjdongCd = validateParam(searchParams.get('bjdongCd'), 5);
  const bun = validateParam(searchParams.get('bun'), 4).padStart(4, '0');
  const ji = validateParam(searchParams.get('ji'), 4).padStart(4, '0');
  const dongNm = validateDongNm(searchParams.get('dongNm'));

  if (!sigunguCd || !bjdongCd) {
    return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
  }

  const params = {
    sigunguCd,
    bjdongCd,
    bun,
    ji,
    ...(dongNm ? { dongNm } : {}),
  };
  logger.info({ event: 'api.floors.request', params });

  try {
    let selectedEndpointPath = '';
    let totalCount = 0;
    let allItems: unknown[] = [];

    for (const endpointPath of FLOOR_ENDPOINT_PATHS) {
      try {
        const firstPage = await fetchPage(endpointPath, params, 1);
        const candidateTotalCount = Number(firstPage.response?.body?.totalCount || 0);

        const rawCandidateItems = firstPage.response?.body?.items?.item;
        const candidateItems: unknown[] = Array.isArray(rawCandidateItems)
          ? rawCandidateItems
          : rawCandidateItems != null
            ? [rawCandidateItems]
            : [];

        if (candidateTotalCount < 1 && candidateItems.length < 1) {
          logger.info({
            event: 'api.floors.empty_endpoint',
            endpointPath,
            sigunguCd,
            bjdongCd,
            bun,
            ji,
          });
          continue;
        }

        selectedEndpointPath = endpointPath;
        totalCount = candidateTotalCount;
        allItems = candidateItems;

        if (totalCount > PAGE_SIZE) {
          const totalPages = Math.min(Math.ceil(totalCount / PAGE_SIZE), MAX_PAGES);
          const BATCH_SIZE = 10;

          for (let batchStart = 2; batchStart <= totalPages; batchStart += BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalPages);
            const pagePromises = [];

            for (let page = batchStart; page <= batchEnd; page += 1) {
              pagePromises.push(
                fetchPage(endpointPath, params, page).catch((error: Error) => {
                  logger.warn({
                    event: 'api.floors.page_error',
                    endpointPath,
                    page,
                    error: error.message,
                  });
                  return null;
                }),
              );
            }

            const batchResults = await Promise.all(pagePromises);
            for (const pageData of batchResults) {
              if (!pageData) continue;
              const rawItems = pageData.response?.body?.items?.item;
              const items: unknown[] = Array.isArray(rawItems)
                ? rawItems
                : rawItems != null
                  ? [rawItems]
                  : [];
              allItems = allItems.concat(items);
            }
          }
        }
        break;
      } catch (endpointError: unknown) {
        const endpointMessage =
          endpointError instanceof Error ? endpointError.message : 'UNKNOWN';
        logger.warn({
          event: 'api.floors.endpoint_error',
          endpointPath,
          message: endpointMessage,
        });
        if (
          endpointMessage === 'API_AUTH_ERROR'
          || endpointMessage === 'API_CONFIG_ERROR'
        ) {
          throw endpointError;
        }
      }
    }

    if (!selectedEndpointPath) {
      return NextResponse.json(
        {
          response: {
            header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
            body: {
              items: { item: [] },
              totalCount: 0,
              originalTotalCount: 0,
            },
          },
          floors: [],
          sourceEndpoint: null,
        },
        {
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          },
        },
      );
    }

    const floorMap = new Map<
      number,
      {
        flrNo: number;
        flrGbCd: string;
        flrGbCdNm: string;
        area: string;
        etcPurps: string;
        mainPurpsCdNm: string;
      }
    >();

    allItems.forEach((itemRaw: unknown) => {
      if (!itemRaw || typeof itemRaw !== 'object') return;
      const item = itemRaw as RawFloorItem;

      const flrNo = parseFloorNo(item);
      const areaRaw = pickAreaRaw(item);
      const rawFlrGbCd = normalizeText(item.flrGbCd);
      const rawFlrGbCdNm = normalizeText(item.flrGbCdNm);
      const flrGbCd = rawFlrGbCd || (flrNo < 0 ? '10' : (flrNo > 0 ? '20' : ''));
      const flrGbCdNm = rawFlrGbCdNm || (flrNo < 0 ? '지하' : (flrNo > 0 ? '지상' : ''));
      const etcPurps = normalizeText(item.etcPurps);
      const mainPurpsCdNm = normalizeText(item.mainPurpsCdNm);

      if (flrNo === 0 && areaRaw === '0') return;

      const existing = floorMap.get(flrNo);
      if (!existing) {
        floorMap.set(flrNo, {
          flrNo,
          flrGbCd,
          flrGbCdNm,
          area: areaRaw,
          etcPurps,
          mainPurpsCdNm,
        });
        return;
      }

      existing.area = addDecimalStrings(existing.area, areaRaw);
      if (!existing.flrGbCd) existing.flrGbCd = flrGbCd;
      if (!existing.flrGbCdNm) existing.flrGbCdNm = flrGbCdNm;
      existing.etcPurps = pickPurposeByFloor(flrNo, existing.etcPurps, etcPurps);
      existing.mainPurpsCdNm = pickPurposeByFloor(flrNo, existing.mainPurpsCdNm, mainPurpsCdNm);
    });

    const floors = Array.from(floorMap.values())
      .sort((a, b) => b.flrNo - a.flrNo)
      .map((item, index) => ({
        _uid: `${item.flrNo}-${index}`,
        ...item,
      }));

    logger.info({
      event: 'api.floors.success',
      endpointPath: selectedEndpointPath,
      totalCount,
      fetched: allItems.length,
      normalized: floors.length,
    });

    return NextResponse.json(
      {
        response: {
          header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
          body: {
            items: { item: allItems },
            totalCount: allItems.length,
            originalTotalCount: totalCount,
          },
        },
        floors,
        sourceEndpoint: selectedEndpointPath,
      },
      {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'UNKNOWN';
    logger.error({ event: 'api.floors.fatal_error', message });

    if (message === 'API_AUTH_ERROR' || message === 'API_CONFIG_ERROR') {
      return NextResponse.json({ error: '인증 오류' }, { status: 401 });
    }
    if (message === 'XML_RESPONSE') {
      return NextResponse.json({ error: 'API 응답 오류' }, { status: 502 });
    }
    return NextResponse.json({ error: '층별 데이터를 불러올 수 없습니다.' }, { status: 500 });
  }
}
