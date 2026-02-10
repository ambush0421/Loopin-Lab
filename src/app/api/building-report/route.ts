export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sigunguCd = searchParams.get('sigunguCd');
  const bjdongCd = searchParams.get('bjdongCd');
  const bun = searchParams.get('bun') || '0000';
  const ji = searchParams.get('ji') || '0000';

  if (!sigunguCd || !bjdongCd) {
    return NextResponse.json({ error: '시군구코드와 법정동코드는 필수입니다.' }, { status: 400 });
  }

  const serviceKey = process.env.BUILDING_API_KEY;
  // [15134735] 국토교통부_건축HUB_건축물대장정보 서비스
  const url = `https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo`;

  try {
    // 공공데이터 포털 API 키는 이미 인코딩된 상태로 제공되는 경우가 많음
    // URLSearchParams에 넣으면 한 번 더 인코딩되어 오류가 발생할 수 있으므로
    // 직접 쿼리 스트링을 구성하는 것이 가장 안전함

    const queryParams = [
      `serviceKey=${serviceKey}`, // 인코딩하지 않고 그대로 사용 (이미 인코딩된 키일 경우 대비)
      `sigunguCd=${sigunguCd}`,
      `bjdongCd=${bjdongCd}`,
      `bun=${bun.padStart(4, '0')}`,
      `ji=${ji.padStart(4, '0')}`,
      `numOfRows=10`,
      `pageNo=1`,
      `_type=json`
    ].join('&');

    const finalUrl = `${url}?${queryParams}`;

    console.log(`[API Request] ${url}?serviceKey=HIDDEN&${queryParams.split('&').slice(1).join('&')}`);

    const response = await fetch(finalUrl);
    const rawData = await response.text();

    if (!response.ok) {
      console.error(`[API Error] Status: ${response.status}`, rawData.substring(0, 500));
      return NextResponse.json({ error: '공공데이터 API 서버 응답 오류', details: rawData.substring(0, 500) }, { status: response.status });
    }

    // XML 응답(에러)인 경우 처리
    if (rawData.trim().startsWith('<')) {
      console.error(`[API XML Response]`, rawData.substring(0, 500));
      return NextResponse.json({ error: '인증 오류 또는 잘못된 요청입니다. (XML 응답)', details: rawData.substring(0, 200) }, { status: 401 });
    }

    const data = JSON.parse(rawData);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error(`[Fatal Error]`, error.message);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.', message: error.message }, { status: 500 });
  }
}
