import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = 'http://apis.data.go.kr/1613000/IndvdlPannPrcService/getIndvdlPannPrcInfo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sigunguCd = searchParams.get('sigunguCd');
  const bjdongCd = searchParams.get('bjdongCd');
  const bun = searchParams.get('bun');
  const ji = searchParams.get('ji');

  const apiKey = process.env.DATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      success: true,
      data: [
        { year: '2020', price: 4100000 },
        { year: '2021', price: 4300000 },
        { year: '2022', price: 4500000 },
        { year: '2023', price: 4450000 },
        { year: '2024', price: 4500000 },
      ]
    });
  }

  try {
    const response = await axios.get(API_URL, {
      params: {
        serviceKey: apiKey,
        sigunguCd,
        bjdongCd,
        bun,
        ji,
        _type: 'json',
        numOfRows: 10,
      },
    });

    const items = response.data?.response?.body?.items?.item;
    if (!items) return NextResponse.json({ success: false, error: '공시지가 정보를 찾을 수 없습니다.' }, { status: 404 });

    const list = Array.isArray(items) ? items : [items];
    const data = list.map((item: any) => ({
      year: item.pblntfYear,
      price: Number(item.pannPrc),
    })).sort((a, b) => Number(a.year) - Number(b.year));

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: '공시지가 API 호출 오류' }, { status: 500 });
  }
}
