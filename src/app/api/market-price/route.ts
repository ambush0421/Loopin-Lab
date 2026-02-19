export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

type MonthInfo = {
  ymd: string;
  display: string;
};

type RawTradeItem = Record<string, unknown>;

type TransactionItem = {
  addr: string;
  price: string;
  rawPrice: number;
  pyung: string;
  pricePerPyung: number;
  floor: string;
  date: string;
  lat: number;
  lng: number;
};

function toText(value: unknown): string {
  return String(value ?? '').trim();
}

function toNumber(value: unknown): number {
  const normalized = String(value ?? '').replace(/,/g, '').trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toTradeItems(value: unknown): RawTradeItem[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is RawTradeItem => !!item && typeof item === 'object');
  }
  if (value && typeof value === 'object') {
    return [value as RawTradeItem];
  }
  return [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sigunguCd = (searchParams.get('sigunguCd') || '').trim();
  const bjdongCd = (searchParams.get('bjdongCd') || '').trim();

  if (!sigunguCd || !bjdongCd) {
    return NextResponse.json({ error: '필수 파라미터(sigunguCd, bjdongCd) 누락' }, { status: 400 });
  }

  const serviceKey = 'OjpqanOc0ZOlfUfzfWWFeZle0K%2FsCsE6VZm8C%2FFxzLJlbVT2NjhgEpC%2FKn0DeZShHh%2FvddaJwRAzj0MMYSuYUA%3D%3D';
  const baseUrl = `http://apis.data.go.kr/1613000/RTMSDataSvcNrg/getRTMSDataSvcNrgTrade`;
  const KAKAO_REST_KEY = process.env.KAKAO_REST_API_KEY;

  try {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        ymd: `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}`,
        display: `${String(d.getFullYear()).substring(2, 4)}.${(d.getMonth() + 1).toString().padStart(2, '0')}`
      } satisfies MonthInfo;
    }).reverse();

    // 병렬 데이터 조회 (Performance Optimization)
    const responses = await Promise.all<{ month: MonthInfo; items: RawTradeItem[] }>(
      months.map(async (month) => {
        const queryParams = `serviceKey=${serviceKey}&LAWD_CD=${sigunguCd}&DEAL_YMD=${month.ymd}&_type=json`;
        try {
          const res = await fetch(`${baseUrl}?${queryParams}`, { cache: 'no-store' });
          const raw = await res.text();
          if (raw.includes('<RETURN_REASON>')) return { month, items: [] };
          const data = JSON.parse(raw) as { response?: { body?: { items?: { item?: unknown } } } };
          const items = toTradeItems(data.response?.body?.items?.item);
          const filtered = items.filter((item) => {
            const bjdongMainCode = toText(item.법정동본번코드);
            const legalDong = toText(item.법정동);
            return bjdongMainCode === bjdongCd || legalDong.includes(bjdongCd);
          });
          return { month, items: filtered };
        } catch {
          return { month, items: [] };
        }
      })
    );

    const allTransactions: TransactionItem[] = [];
    const trends: { month: string; price: number }[] = [];

    responses.forEach(({ month, items }) => {
      let monthTotalPrice = 0;
      let monthTotalPyung = 0;

      items.forEach((item) => {
        const price = toNumber(item.거래금액);
        const area = toNumber(item.전용면적);
        if (price > 0 && area > 0) {
          const pyung = area * 0.3025;
          monthTotalPrice += price;
          monthTotalPyung += pyung;

          allTransactions.push({
            addr: `${toText(item.법정동)} ${toText(item.지번)}`.trim(),
            price: price >= 10000 ? `${(price / 10000).toFixed(1)}억` : `${price}만`,
            rawPrice: price,
            pyung: pyung.toFixed(1),
            pricePerPyung: Math.round(price / pyung),
            floor: toText(item.층),
            date: month.display,
            lat: 0, lng: 0
          });
        }
      });

      // 데이터 보간: 거래가 없는 달은 0으로 처리하거나 추후 프론트에서 핸들링
      trends.push({
        month: month.display,
        price: monthTotalPyung > 0 ? Math.round(monthTotalPrice / monthTotalPyung) : 0
      });
    });

    // 지오코딩 (상위 10건, 폴백 로직 포함)
    const topTransactions = allTransactions
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);

    await Promise.all(topTransactions.map(async (tx) => {
      try {
        // 1. 카카오 시도
        if (KAKAO_REST_KEY) {
          const res = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(tx.addr)}`, {
            headers: { 'Authorization': `KakaoAK ${KAKAO_REST_KEY}` }
          });
          const geo = await res.json() as { documents?: Array<{ y?: string; x?: string }> };
          if (geo.documents?.[0]) {
            tx.lat = toNumber(geo.documents[0].y);
            tx.lng = toNumber(geo.documents[0].x);
            return;
          }
        }
        // 2. 브이월드 폴백
        const vworldRes = await fetch(`https://api.vworld.kr/req/address?service=address&request=getcoord&version=2.0&crs=epsg:4326&address=${encodeURIComponent(tx.addr)}&format=json&type=ROAD&key=9E8E6CEB-3D63-3761-B9B8-9E52D4F0DC89`);
        const vworld = await vworldRes.json() as { response?: { result?: { point?: { y?: string; x?: string } } } };
        if (vworld.response?.result?.point) {
          tx.lat = toNumber(vworld.response.result.point.y);
          tx.lng = toNumber(vworld.response.result.point.x);
        }
      } catch {}
    }));

    const validTrends = trends.filter(t => t.price > 0);
    const avgPrice = validTrends.length > 0
      ? Math.round(validTrends.reduce((sum, t) => sum + t.price, 0) / validTrends.length)
      : 0;

    return NextResponse.json({
      averagePrice: avgPrice,
      trends: trends, // 0을 포함하여 차트 축 유지
      transactions: topTransactions.filter(tx => tx.lat !== 0)
    });

  } catch {
    return NextResponse.json({ error: '최적화 조회 실패' }, { status: 500 });
  }
}
