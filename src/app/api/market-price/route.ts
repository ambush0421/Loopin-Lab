export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

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
      };
    }).reverse();

    // 병렬 데이터 조회 (Performance Optimization)
    const responses = await Promise.all(
      months.map(async (month) => {
        const queryParams = `serviceKey=${serviceKey}&LAWD_CD=${sigunguCd}&DEAL_YMD=${month.ymd}&_type=json`;
        try {
          const res = await fetch(`${baseUrl}?${queryParams}`, { cache: 'no-store' });
          const raw = await res.text();
          if (raw.includes('<RETURN_REASON>')) return { month, items: [] };
          const data = JSON.parse(raw);
          const items = data.response?.body?.items?.item || [];
          const filtered = (Array.isArray(items) ? items : [items]).filter((item: any) =>
            item && (String(item.법정동본번코드) === bjdongCd || item.법정동?.includes(bjdongCd))
          );
          return { month, items: filtered };
        } catch (e) {
          return { month, items: [] };
        }
      })
    );

    let allTransactions: any[] = [];
    const trends: { month: string; price: number }[] = [];

    responses.forEach(({ month, items }) => {
      let monthTotalPrice = 0;
      let monthTotalPyung = 0;

      items.forEach((item: any) => {
        const price = parseInt(String(item.거래금액).replace(/,/g, '')) || 0;
        const area = parseFloat(item.전용면적) || 0;
        if (price > 0 && area > 0) {
          const pyung = area * 0.3025;
          monthTotalPrice += price;
          monthTotalPyung += pyung;

          allTransactions.push({
            addr: `${item.법정동} ${item.지번}`,
            price: price >= 10000 ? `${(price / 10000).toFixed(1)}억` : `${price}만`,
            rawPrice: price,
            pyung: pyung.toFixed(1),
            pricePerPyung: Math.round(price / pyung),
            floor: item.층,
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
          const geo = await res.json();
          if (geo.documents?.[0]) {
            tx.lat = parseFloat(geo.documents[0].y);
            tx.lng = parseFloat(geo.documents[0].x);
            return;
          }
        }
        // 2. 브이월드 폴백
        const vworldRes = await fetch(`https://api.vworld.kr/req/address?service=address&request=getcoord&version=2.0&crs=epsg:4326&address=${encodeURIComponent(tx.addr)}&format=json&type=ROAD&key=9E8E6CEB-3D63-3761-B9B8-9E52D4F0DC89`);
        const vworld = await vworldRes.json();
        if (vworld.response?.result?.point) {
          tx.lat = parseFloat(vworld.response.result.point.y);
          tx.lng = parseFloat(vworld.response.result.point.x);
        }
      } catch (err) { }
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

  } catch (error: any) {
    return NextResponse.json({ error: '최적화 조회 실패' }, { status: 500 });
  }
}