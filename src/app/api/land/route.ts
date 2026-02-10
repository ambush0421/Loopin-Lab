import { NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = 'http://apis.data.go.kr/1613000/LndpSvc/getLndpInfo';

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
      data: {
        lndpclAr: 500.5,
        lndMsclCdNm: "대",
        pannPrc: 4500000
      }
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
      },
    });

    const item = response.data?.response?.body?.items?.item;
    if (!item) return NextResponse.json({ success: false, error: '토지 정보를 찾을 수 없습니다.' }, { status: 404 });

    const data = Array.isArray(item) ? item[0] : item;

    return NextResponse.json({
      success: true,
      data: {
        lndpclAr: Number(data.lndpclAr),
        lndMsclCdNm: data.lndMsclCdNm,
        pannPrc: Number(data.pannPrc),
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: '토지 API 호출 오류' }, { status: 500 });
  }
}
