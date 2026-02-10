export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// 보안: API 키는 환경 변수에서만 로드 (절대 클라이언트에 노출되지 않음)
const API_KEY = process.env.BUILDING_API_KEY;
const BASE_URL = 'https://apis.data.go.kr/1613000/BldRgstHubService/getBrExposPubuseAreaInfo';

const PAGE_SIZE = 100;
const MAX_PAGES = 150;

// 입력값 검증 유틸리티
function validateParam(value: string | null, maxLength: number = 10): string {
  if (!value) return '';
  return value.replace(/[^0-9]/g, '').substring(0, maxLength);
}

async function fetchPage(params: Record<string, string>, pageNo: number): Promise<any> {
  if (!API_KEY) throw new Error('API_CONFIG_ERROR');

  const serviceKey = encodeURIComponent(API_KEY);
  const queryParams = [
    `serviceKey=${serviceKey}`,
    ...Object.entries(params).map(([k, v]) => `${k}=${v}`),
    `numOfRows=${PAGE_SIZE}`,
    `pageNo=${pageNo}`,
    `_type=json`
  ].join('&');

  const response = await fetch(`${BASE_URL}?${queryParams}`, {
    cache: 'no-store',
    headers: { 'Accept': 'application/json' }
  });
  const rawData = await response.text();

  if (rawData.includes('Unexpected errors')) {
    throw new Error('API_AUTH_ERROR');
  }

  if (rawData.trim().startsWith('<')) {
    throw new Error('XML_RESPONSE');
  }

  return JSON.parse(rawData);
}

export async function GET(request: NextRequest) {
  // 보안: API 키 존재 확인
  if (!API_KEY) {
    logger.error({ event: 'api.units.config_error', message: 'API key not configured' });
    return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);

  // 입력값 검증 및 sanitization
  const sigunguCd = validateParam(searchParams.get('sigunguCd'), 5);
  const bjdongCd = validateParam(searchParams.get('bjdongCd'), 5);
  const bun = validateParam(searchParams.get('bun'), 4).padStart(4, '0');
  const ji = validateParam(searchParams.get('ji'), 4).padStart(4, '0');

  if (!sigunguCd || !bjdongCd) {
    return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
  }

  const params = { sigunguCd, bjdongCd, bun, ji };
  logger.info({ event: 'api.units.request', params });

  try {
    const firstPage = await fetchPage(params, 1);
    const totalCount = Number(firstPage.response?.body?.totalCount || 0);

    let allItems = firstPage.response?.body?.items?.item || [];
    if (!Array.isArray(allItems)) {
      allItems = allItems ? [allItems] : [];
    }

    logger.info({ event: 'api.units.first_page', totalCount, firstPageItems: allItems.length });

    if (totalCount > PAGE_SIZE) {
      const totalPages = Math.min(Math.ceil(totalCount / PAGE_SIZE), MAX_PAGES);
      const BATCH_SIZE = 10;

      for (let batchStart = 2; batchStart <= totalPages; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalPages);
        const pagePromises = [];

        for (let page = batchStart; page <= batchEnd; page++) {
          pagePromises.push(
            fetchPage(params, page).catch(e => {
              logger.warn({ event: 'api.units.page_error', page, error: e.message });
              return null;
            })
          );
        }

        const batchResults = await Promise.all(pagePromises);

        for (const pageData of batchResults) {
          if (pageData) {
            let items = pageData.response?.body?.items?.item || [];
            if (!Array.isArray(items)) {
              items = items ? [items] : [];
            }
            allItems = allItems.concat(items);
          }
        }
      }
    }

    logger.info({ event: 'api.units.success', totalCount, fetched: allItems.length });

    // 보안 헤더 추가
    return NextResponse.json({
      response: {
        header: { resultCode: '00', resultMsg: 'NORMAL SERVICE' },
        body: {
          items: { item: allItems },
          totalCount: allItems.length,
          originalTotalCount: totalCount
        }
      }
    }, {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      }
    });

  } catch (error: any) {
    logger.error({ event: 'api.units.fatal_error', message: error.message });

    if (error.message === 'API_AUTH_ERROR' || error.message === 'API_CONFIG_ERROR') {
      return NextResponse.json({ error: '인증 오류' }, { status: 401 });
    }

    if (error.message === 'XML_RESPONSE') {
      return NextResponse.json({ error: 'API 응답 오류' }, { status: 502 });
    }

    return NextResponse.json({ error: '데이터를 불러올 수 없습니다.' }, { status: 500 });
  }
}
