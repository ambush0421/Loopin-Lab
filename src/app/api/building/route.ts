import { NextRequest, NextResponse } from 'next/server';
import { BuildingAnalysisService } from '@/lib/services/building-analysis';

export const runtime = 'edge';

const API_URL = 'https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo';
type ReportType = 'LEASE' | 'PURCHASE' | 'INVEST';

function parseReportType(value: string | null): ReportType {
  if (value === 'PURCHASE' || value === 'INVEST') return value;
  return 'LEASE';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sigunguCd = searchParams.get('sigunguCd');
  const bjdongCd = searchParams.get('bjdongCd');
  const bun = searchParams.get('bun');
  const ji = searchParams.get('ji');
  const type = parseReportType(searchParams.get('type'));
  const property = searchParams.get('property') || 'OFFICE';
  
  // 사용자 입력 금융 데이터
  const inputCost = Number(searchParams.get('cost') || 0);
  const inputDeposit = Number(searchParams.get('deposit') || 0);
  const inputRent = Number(searchParams.get('rent') || 0);

  const apiKey = process.env.BUILDING_API_KEY || process.env.DATA_API_KEY || 'OjpqanOc0ZOlfUfzfWWFeZle0K%2FsCsE6VZm8C%2FKn0DeZShHh%2FvddaJwRAzj0MMYSuYUA%3D%3D';

  try {
    const queryParams = new URLSearchParams({
      serviceKey: decodeURIComponent(apiKey),
      sigunguCd: sigunguCd || '',
      bjdongCd: bjdongCd || '',
      bun: (bun || '0').padStart(4, '0'),
      ji: (ji || '0').padStart(4, '0'),
      _type: 'json',
      numOfRows: '1',
      pageNo: '1',
    }).toString();

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const [bResponse, mResponse] = await Promise.all([
      fetch(`${API_URL}?${queryParams}`),
      fetch(`${apiBase}/api/real-trade?lawdCd=${sigunguCd}&dong=${bjdongCd}`)
    ]);

    const rawData = await bResponse.text();
    let marketData = { data: { stats: { trade: { avgPricePerPyung: 0 } } } };
    try { marketData = await mResponse.json(); } catch {}

    if (rawData.includes('<CM700001>')) return NextResponse.json({ success: false, error: '인증 오류' }, { status: 401 });

    const data = JSON.parse(rawData);
    const item = data.response?.body?.items?.item;
    const b = Array.isArray(item) ? item[0] : item;

    if (!b) return NextResponse.json({ success: false, error: '데이터 없음' }, { status: 404 });

    const normalizedBuilding = {
      id: b.mgmBldrgstPk,
      name: b.bldNm || b.dongNm || '건물명 없음',
      address: b.newPlatPlc || b.platPlc,
      metrics: {
        cost: type === 'LEASE' ? inputRent : inputCost, // 입력값 우선
        deposit: inputDeposit,
        area: parseFloat(b.totArea || '0'),
        parking: (parseInt(b.indrMechUtcnt || '0') + parseInt(b.indrAutoUtcnt || '0') +
                  parseInt(b.oudrMechUtcnt || '0') + parseInt(b.oudrAutoUtcnt || '0')),
        year: parseInt((b.useAprDay || '0000').substring(0, 4)),
        violation: b.vlrtBldRgstYn === 'Y' || b.vlrtBldRgstYn === '1',
        marketAvgPyung: marketData.data?.stats?.trade?.avgPricePerPyung || 0
      }
    };

    // 전문가 엔진 호출
    const analysisResult = await BuildingAnalysisService.analyze([normalizedBuilding], type);
    const scoreData = analysisResult.buildings[0].analysis;

    return NextResponse.json({
      success: true,
      data: {
        bldNm: b.bldNm,
        platAddr: b.platAddr,
        vlrtBldRgstYn: b.vlrtBldRgstYn,
        platArea: Number(b.platArea || 0),
        totArea: Number(b.totArea || 0),
        bcRat: Number(b.bcRat || 0),
        vlrat: Number(b.vlrat || 0),
        mainPurpsCdNm: b.mainPurpsCdNm,
        strctCdNm: b.strctCdNm,
        indrMechUtcnt: normalizedBuilding.metrics.parking,
        useAprvDay: b.useAprDay,
        grndFlrCnt: Number(b.grndFlrCnt || 0),
        ugndFlrCnt: Number(b.ugndFlrCnt || 0),
        reportType: type,
        propertyType: property,
        analysis: {
          score: scoreData.score,
          reasoning: analysisResult.reasoning,
          breakdown: scoreData.breakdown,
          financialSimulation: scoreData.financialSimulation
        }
      }
    });

  } catch {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
}
