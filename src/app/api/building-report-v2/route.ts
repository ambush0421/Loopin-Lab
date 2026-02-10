export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// 보안: API 키는 환경 변수에서만 로드 (절대 클라이언트에 노출되지 않음)
const API_KEY = process.env.BUILDING_API_KEY;
const BASE_URL = 'https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo';

// 입력값 검증 유틸리티
function validateParam(value: string | null, maxLength: number = 10): string {
  if (!value) return '';
  // XSS/Injection 방지: 숫자만 허용
  return value.replace(/[^0-9]/g, '').substring(0, maxLength);
}

export async function GET(request: NextRequest) {
  // 보안: API 키 존재 확인
  if (!API_KEY) {
    logger.error({ event: 'api.building.config_error', message: 'API key not configured' });
    return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);

  // 입력값 검증 및 sanitization
  const sigunguCd = validateParam(searchParams.get('sigunguCd'), 5);
  const bjdongCd = validateParam(searchParams.get('bjdongCd'), 5);
  const bun = validateParam(searchParams.get('bun'), 4).padStart(4, '0');
  const ji = validateParam(searchParams.get('ji'), 4).padStart(4, '0');

  if (!sigunguCd || !bjdongCd) {
    return NextResponse.json({ error: '시군구/법정동 코드 누락' }, { status: 400 });
  }

  try {
    const serviceKey = encodeURIComponent(API_KEY);
    const queryParams = [
      `serviceKey=${serviceKey}`,
      `sigunguCd=${sigunguCd}`,
      `bjdongCd=${bjdongCd}`,
      `bun=${bun}`,
      `ji=${ji}`,
      `numOfRows=10`,
      `pageNo=1`,
      `_type=json`
    ].join('&');

    const finalUrl = `${BASE_URL}?${queryParams}`;

    // 보안 로깅: API 키 제외
    logger.info({ event: 'api.building.request', params: { sigunguCd, bjdongCd, bun, ji } });

    const response = await fetch(finalUrl, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      }
    });
    const rawData = await response.text();

    if (!response.ok || rawData.includes('Unexpected errors') || rawData.includes('<RETURN_REASON>')) {
      logger.error({ event: 'api.building.error', status: response.status, raw: rawData.substring(0, 100) });
      return NextResponse.json({
        error: '공공데이터 서버 오류',
        details: rawData.includes('Unexpected errors') ? '인증 오류' : '서버 응답 오류'
      }, { status: response.ok ? 401 : response.status });
    }

    const data = JSON.parse(rawData);

    // 데이터 검증: items가 없거나, 빈 배열이거나, totalCount가 0인 경우 처리
    const items = data.response?.body?.items;
    const totalCount = data.response?.body?.totalCount;

    if (!items || (Array.isArray(items) && items.length === 0) || totalCount === 0) {
      return NextResponse.json({ error: '건축물대장 정보가 없습니다.' }, { status: 404 });
    }

    logger.info({ event: 'api.building.success', count: totalCount });

    // 보안 헤더 추가
    return NextResponse.json(data, {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      }
    });

  } catch (error: any) {
    logger.error({ event: 'api.building.fatal_error', message: error.message });
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}
