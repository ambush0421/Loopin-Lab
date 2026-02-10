import { NextResponse } from 'next/server';
import axios from 'axios';

// 건축HUB 건축물대장 서비스 엔드포인트
const API_URL = 'https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sigunguCd = searchParams.get('sigunguCd');
  const bjdongCd = searchParams.get('bjdongCd');
  const bun = searchParams.get('bun');
  const ji = searchParams.get('ji');

  // 환경변수에서 Decoding된 API 키를 가져옵니다.
  const apiKey = process.env.DATA_API_KEY;

  if (!apiKey) {
    // API 키가 없는 경우 테스트를 위한 목업 데이터 반환
    return NextResponse.json({
      success: true,
      data: {
        bldNm: "테스트 빌딩",
        platAddr: "서울특별시 강남구 역삼동 123-45",
        vlrtBldRgstYn: "N",
        platArea: 500.5,
        totArea: 1200.8,
        bcRat: 59.8,
        vlrat: 240.5,
        mainPurpsCdNm: "제2종근생",
        strctCdNm: "철근콘크리트구조",
        indrMechUtcnt: 12,
        useAprvDay: "20150520",
        grndFlrCnt: 5,
        ugndFlrCnt: 1
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
        numOfRows: 1,
        pageNo: 1,
      },
    });

    const item = response.data?.response?.body?.items?.item;
    
    if (!item) {
      return NextResponse.json({ success: false, error: '데이터를 찾을 수 없습니다.' }, { status: 404 });
    }

    // API 응답 데이터를 내부 모델로 변환 (필요한 경우 배열 처리)
    const data = Array.isArray(item) ? item[0] : item;

    return NextResponse.json({
      success: true,
      data: {
        bldNm: data.bldNm,
        platAddr: data.platAddr,
        vlrtBldRgstYn: data.vlrtBldRgstYn,
        platArea: Number(data.platArea),
        totArea: Number(data.totArea),
        bcRat: Number(data.bcRat),
        vlrat: Number(data.vlrat),
        mainPurpsCdNm: data.mainPurpsCdNm,
        strctCdNm: data.strctCdNm,
        indrMechUtcnt: Number(data.indrMechUtcnt || 0) + Number(data.indrAutoUtcnt || 0) + Number(data.oudrMechUtcnt || 0) + Number(data.oudrAutoUtcnt || 0),
        useAprvDay: data.useAprvDay,
        grndFlrCnt: Number(data.grndFlrCnt),
        ugndFlrCnt: Number(data.ugndFlrCnt),
      }
    });
  } catch (error) {
    console.error('API Fetch Error:', error);
    return NextResponse.json({ success: false, error: 'API 호출 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
