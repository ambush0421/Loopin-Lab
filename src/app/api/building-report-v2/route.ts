import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { BuildingAnalysisService } from '@/lib/services/building-analysis';

export const runtime = 'edge';

interface RequestItem {
  sigunguCd: string;
  bjdongCd: string;
  bun: string;
  ji: string;
  cost?: number;
}

type ReportType = 'LEASE' | 'PURCHASE' | 'INVEST';
type WeightInput = Partial<{
  costScore: number;
  areaScore: number;
  parkingScore: number;
  modernityScore: number;
}>;

type BuildingFetchResult =
  | { error: true }
  | {
      id: string;
      name: string;
      address: string;
      metrics: {
        cost: number;
        area: number;
        parking: number;
        year: number;
        violation: boolean;
        marketAvgPyung: number;
      };
      raw: Record<string, unknown>;
    };

type AnalysisBuilding = Record<string, unknown> & {
  metrics: {
    violation?: boolean;
    year?: number;
  };
  analysis: {
    score: number;
  };
};

type AnalysisResult = {
  weights: WeightInput;
  bestIndex: number;
  reasoning: string;
  buildings: AnalysisBuilding[];
};

function toNumber(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  try {
    const body = (await request.json()) as {
      type?: ReportType;
      items?: RequestItem[];
      weights?: WeightInput;
      currentCost?: number;
    };
    const type: ReportType =
      body.type === 'PURCHASE' || body.type === 'INVEST' ? body.type : 'LEASE';
    const items = Array.isArray(body.items) ? body.items : [];
    const weights = body.weights;
    const currentCost = typeof body.currentCost === 'number' ? body.currentCost : 1000;

    if (!items || items.length < 1) {
      return NextResponse.json({ error: '최소 하나 이상의 물건 정보가 필요합니다.' }, { status: 400 });
    }

    const serviceKey = process.env.BUILDING_API_KEY;
    const baseUrl = `https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo`;

    const buildingPromises = items.map(async (item): Promise<BuildingFetchResult> => {
      const queryParams = new URLSearchParams({
        serviceKey: serviceKey || '',
        sigunguCd: item.sigunguCd,
        bjdongCd: item.bjdongCd,
        bun: (item.bun || '0000').padStart(4, '0'),
        ji: (item.ji || '0000').padStart(4, '0'),
        numOfRows: '1',
        pageNo: '1',
        _type: 'json'
      }).toString();

      try {
        const [bResponse, mResponse] = await Promise.all([
          fetch(`${baseUrl}?${queryParams}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/real-trade?lawdCd=${item.sigunguCd}&dong=${item.bjdongCd}`)
        ]);

        const rawData = await bResponse.text();
        const marketData = (await mResponse.json().catch(() => null)) as
          | { data?: { stats?: { trade?: { avgPricePerPyung?: number } } } }
          | null;
        
        if (!bResponse.ok || rawData.trim().startsWith('<')) return { error: true };

        const data: unknown = JSON.parse(rawData);
        const parsed = data as { response?: { body?: { items?: { item?: unknown[] | unknown } } } };
        const b = parsed.response?.body?.items?.item;
        const itemData = Array.isArray(b) ? b[0] : b;

        if (!itemData || typeof itemData !== 'object') return { error: true };
        const rawItem = itemData as Record<string, unknown>;

        return {
          id: String(rawItem.mgmBldrgstPk ?? ''),
          name: String(rawItem.bldNm ?? rawItem.dongNm ?? '건물명 없음'),
          address: String(rawItem.newPlatPlc ?? rawItem.platPlc ?? ''),
          metrics: {
            cost: item.cost || 0,
            area: toNumber(rawItem.totArea),
            parking: (
              toNumber(rawItem.indrMechUtcnt) + toNumber(rawItem.indrAutoUtcnt) +
              toNumber(rawItem.oudrMechUtcnt) + toNumber(rawItem.oudrAutoUtcnt)
            ),
            year: Number(String(rawItem.useAprDay ?? '0000').substring(0, 4)) || 0,
            violation: rawItem.vlrtBldRgstYn === 'Y' || rawItem.vlrtBldRgstYn === '1',
            marketAvgPyung: marketData?.data?.stats?.trade?.avgPricePerPyung || 0
          },
          raw: rawItem 
        };
      } catch {
        return { error: true };
      }
    });

    const validBuildings = (await Promise.all(buildingPromises)).filter(
      (building): building is Exclude<BuildingFetchResult, { error: true }> => !('error' in building),
    );

    if (validBuildings.length === 0) {
      return NextResponse.json({ error: '유효한 데이터를 불러오지 못했습니다.' }, { status: 500 });
    }

    // ★ 핵심: await 추가 ★
    const analysis = await BuildingAnalysisService.analyze(
      validBuildings,
      type,
      weights,
      currentCost,
    ) as AnalysisResult;
    const bestBuilding = analysis.buildings[analysis.bestIndex] ?? analysis.buildings[0];

    const responseData = {
      meta: {
        type,
        timestamp: new Date().toISOString(),
        weights: analysis.weights,
        latency: `${(performance.now() - startTime).toFixed(2)}ms`
      },
      recommendation: {
        bestBuildingIndex: analysis.bestIndex,
        reason: analysis.reasoning,
        totalScore: bestBuilding?.analysis?.score ?? 0
      },
      buildings: analysis.buildings.map((b, idx: number) => ({
        ...b,
        reportType: type,
        tags: {
          isBest: idx === analysis.bestIndex,
          riskLevel: b.metrics.violation
            ? 'DANGER'
            : (new Date().getFullYear() - Number(b.metrics.year ?? 0) > 25 ? 'CAUTION' : 'SAFE')
        }
      }))
    };

    return NextResponse.json(responseData);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'UNKNOWN';
    logger.error({ event: 'api.v2.error', message });
    return NextResponse.json({ error: '서버 내부 오류' }, { status: 500 });
  }
}
