import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'edge';

type BuildingReportRawItem = Record<string, unknown>;
type BuildingReportItem = {
  pk: string;
  name: string;
  address: string;
  violation: boolean;
  platArea: number;
  totArea: number;
  bcRat: number;
  vlRat: number;
  mainPurps: string;
  structure: string;
  parking: {
    indoor: number;
    outdoor: number;
  };
  raw: BuildingReportRawItem;
};

function toText(value: unknown): string {
  return String(value ?? '');
}

function toNumber(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sigunguCd = searchParams.get('sigunguCd');
  const bjdongCd = searchParams.get('bjdongCd');
  const bun = searchParams.get('bun') || '0000';
  const ji = searchParams.get('ji') || '0000';

  logger.info({
    event: 'building_report.request',
    params: { sigunguCd, bjdongCd, bun, ji }
  });

  if (!sigunguCd || !bjdongCd) {
    logger.warn({
      event: 'building_report.invalid_params',
      message: 'Missing required parameters'
    });
    return NextResponse.json({ error: '시군구코드와 법정동코드는 필수입니다.' }, { status: 400 });
  }

  const serviceKey = process.env.BUILDING_API_KEY;
  // [15134735] 국토교통부_건축HUB_건축물대장정보 서비스
  const url = `https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo`;

  try {
    const queryParams = [
      `serviceKey=${serviceKey}`, 
      `sigunguCd=${sigunguCd}`,
      `bjdongCd=${bjdongCd}`,
      `bun=${bun.padStart(4, '0')}`,
      `ji=${ji.padStart(4, '0')}`,
      `numOfRows=10`,
      `pageNo=1`,
      `_type=json`
    ].join('&');

    const finalUrl = `${url}?${queryParams}`;

    logger.debug({
      event: 'building_report.api_call',
      url: url,
      params: { sigunguCd, bjdongCd, bun, ji }
    });

    const response = await fetch(finalUrl);
    const rawData = await response.text();

    if (!response.ok) {
      logger.error({
        event: 'building_report.api_error',
        status: response.status,
        details: rawData.substring(0, 500)
      });
      return NextResponse.json({ error: '공공데이터 API 서버 응답 오류', details: rawData.substring(0, 500) }, { status: response.status });
    }

    if (rawData.trim().startsWith('<')) {
      logger.error({
        event: 'building_report.xml_response',
        details: rawData.substring(0, 500)
      });
      return NextResponse.json({ error: '인증 오류 또는 잘못된 요청입니다. (XML 응답)', details: rawData.substring(0, 200) }, { status: 401 });
    }

    const data: unknown = JSON.parse(rawData);
    const parsed = (data && typeof data === 'object')
      ? (data as { response?: { body?: { totalCount?: number | string; items?: { item?: unknown[] | unknown } } } })
      : {};
    const items = parsed.response?.body?.items?.item;
    const itemList: BuildingReportRawItem[] = Array.isArray(items)
      ? items.filter((item): item is BuildingReportRawItem => !!item && typeof item === 'object')
      : (items && typeof items === 'object' ? [items as BuildingReportRawItem] : []);

    logger.info({
      event: 'building_report.success',
      itemCount: parsed.response?.body?.totalCount || 0,
      fetchedCount: itemList.length
    });

    // Transform Data
    const reportItems: BuildingReportItem[] = itemList.map((item) => {
      // Log missing critical fields
      if (!item.vlrtBldRgstYn && item.vlrtBldRgstYn !== '0') {
         // Some APIs omit this if 'N' or empty. We'll treat as clean but log debug.
         // logger.debug({ event: 'building_report.field_missing', field: 'vlrtBldRgstYn', pk: item.mgmBldrgstPk });
      }

      return {
        pk: toText(item.mgmBldrgstPk),
        name: toText(item.bldNm) || toText(item.dongNm) || '건물명 없음',
        address: toText(item.newPlatPlc) || toText(item.platPlc),
        violation: toText(item.vlrtBldRgstYn) === 'Y' || toText(item.vlrtBldRgstYn) === '1',
        platArea: toNumber(item.platArea),
        totArea: toNumber(item.totArea),
        bcRat: toNumber(item.bcRat), // 건폐율
        vlRat: toNumber(item.vlRat), // 용적률
        mainPurps: toText(item.mainPurpsCdNm),
        structure: toText(item.strctCdNm),
        parking: {
          indoor: toNumber(item.indrMechUtcnt) + toNumber(item.indrAutoUtcnt),
          outdoor: toNumber(item.oudrMechUtcnt) + toNumber(item.oudrAutoUtcnt),
        },
        raw: item // Keep raw for detail view
      };
    });

    const summary = {
      totalBuildings: reportItems.length,
      violationCount: reportItems.filter((i) => i.violation).length,
      avgAge: 0 // Placeholder for now
    };

    return NextResponse.json({
      meta: {
        request: { sigunguCd, bjdongCd, bun, ji },
        timestamp: new Date().toISOString()
      },
      summary,
      items: reportItems
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'UNKNOWN';
    logger.error({
      event: 'building_report.fatal_error',
      message
    });
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.', message }, { status: 500 });
  }
}
