export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const KAKAO_REST_KEY = process.env.KAKAO_REST_API_KEY;
const VWORLD_API_KEY = process.env.VWORLD_API_KEY || '9E8E6CEB-3D63-3761-B9B8-9E52D4F0DC89';

type KakaoKeywordDocument = {
  place_name?: string;
  road_address_name?: string;
  address_name?: string;
  x?: string;
  y?: string;
};

function normalizeForMatch(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

function pickBestKeywordDoc(docs: KakaoKeywordDocument[], query: string): KakaoKeywordDocument | null {
  if (!docs.length) return null;
  const q = normalizeForMatch(query);
  const scored = docs.map((doc) => {
    const place = normalizeForMatch(doc.place_name || '');
    const road = normalizeForMatch(doc.road_address_name || '');
    const land = normalizeForMatch(doc.address_name || '');
    let score = 0;
    if (place === q) score += 120;
    if (place.startsWith(q)) score += 80;
    if (place.includes(q)) score += 50;
    if (road.includes(q)) score += 40;
    if (land.includes(q)) score += 30;
    return { doc, score };
  }).sort((a, b) => b.score - a.score);
  return scored[0]?.doc || null;
}

async function fetchKakaoAddress(lng: string, lat: string) {
  const response = await fetch(
    `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}&input_coord=WGS84`,
    { headers: { 'Authorization': `KakaoAK ${KAKAO_REST_KEY}` } }
  );
  if (!response.ok) return null;
  const data = await response.json();
  if (data.documents && data.documents.length > 0) {
    const doc = data.documents[0];
    const road = doc.road_address;
    const land = doc.address;

    if (land && land.region_1depth_name && land.region_2depth_name && land.region_3depth_name && land.mountain_yn && land.main_address_no && land.sub_address_no) {
      return {
        sigunguCode: land.region_2depth_name,
        bjdongCode: land.region_3depth_h_name, // 행정동 기준
        bun: land.main_address_no.padStart(4, '0'),
        ji: land.sub_address_no.padStart(4, '0')
      };
    } else if (road && road.region_1depth_name && road.region_2depth_name && road.region_3depth_name && road.main_building_no && road.sub_building_no) {
        return {
            sigunguCode: road.region_2depth_name,
            bjdongCode: road.region_3depth_name, 
            bun: road.main_building_no.padStart(4, '0'),
            ji: road.sub_building_no.padStart(4, '0')
        };
    }
  }
  return null;
}

async function fetchVWorldAddress(lng: string, lat: string) {
  const response = await fetch(
    `https://api.vworld.kr/req/address?service=address&request=getCoord2Address&version=2.0&crs=epsg:4326&x=${lng}&y=${lat}&type=BOTH&format=json&key=${VWORLD_API_KEY}`
  );
  if (!response.ok) return null;
  const data = await response.json();
  if (data.response?.status === 'OK' && data.response.result.length > 0) {
    const item = data.response.result[0].structure;
    return {
        sigunguCode: item.level2,
        bjdongCode: item.level4H, // 행정동 기준
        bun: item.main_address_no.padStart(4, '0'),
        ji: item.sub_address_no.padStart(4, '0')
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (lat && lng) {
        try {
            let addressInfo = null;
            if (KAKAO_REST_KEY) {
                addressInfo = await fetchKakaoAddress(lng, lat);
            }
            if (!addressInfo) {
                addressInfo = await fetchVWorldAddress(lng, lat);
            }

            if (addressInfo) {
                return NextResponse.json({ success: true, address: addressInfo });
            } else {
                return NextResponse.json({ success: false, error: '주소 정보를 찾을 수 없습니다.' }, { status: 404 });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'UNKNOWN';
            logger.error({ event: 'api.geocode.reverse.error', message });
            return NextResponse.json({ success: false, error: '좌표를 주소로 변환하는 중 오류 발생' }, { status: 500 });
        }
    }
    
    const address = (searchParams.get('address') || '').trim();

    if (!address) {
        return NextResponse.json({ error: '주소 또는 좌표가 필요합니다.' }, { status: 400 });
    }

    try {
        logger.info({ event: 'api.geocode.request', address });

        if (KAKAO_REST_KEY) {
            const kakaoRes = await fetch(
                `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
                { headers: { 'Authorization': `KakaoAK ${KAKAO_REST_KEY}` } }
            );

            if (kakaoRes.ok) {
                const data = await kakaoRes.json();
                if (data.documents && data.documents.length > 0) {
                    const first = data.documents[0];
                    const resolvedAddress =
                      first?.road_address?.address_name
                      || first?.address_name
                      || first?.address?.address_name
                      || address;
                    return NextResponse.json({ 
                        success: true, 
                        lat: parseFloat(first.y),
                        lng: parseFloat(first.x),
                        resolvedAddress,
                        source: 'kakao'
                    });
                }
            }

            // 건물명/상호 검색 fallback
            const keywordRes = await fetch(
                `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(address)}&size=10`,
                { headers: { 'Authorization': `KakaoAK ${KAKAO_REST_KEY}` } }
            );

            if (keywordRes.ok) {
                const keywordData = await keywordRes.json();
                const docs = (keywordData.documents || []) as KakaoKeywordDocument[];
                const best = pickBestKeywordDoc(docs, address);
                if (best && best.y && best.x) {
                    const resolvedAddress = best.road_address_name || best.address_name || address;
                    return NextResponse.json({
                        success: true,
                        lat: parseFloat(best.y),
                        lng: parseFloat(best.x),
                        resolvedAddress,
                        placeName: best.place_name || '',
                        source: 'kakao_keyword'
                    });
                }
            }
        }

        const vworldRes = await fetch(
            `https://api.vworld.kr/req/address?service=address&request=getcoord&version=2.0&crs=epsg:4326&address=${encodeURIComponent(address)}&format=json&type=ROAD&key=${VWORLD_API_KEY}`
        );

        if (vworldRes.ok) {
            const data = await vworldRes.json();
            if (data.response?.status === 'OK' && data.response?.result?.point) {
                return NextResponse.json({ 
                    success: true, 
                    lat: parseFloat(data.response.result.point.y),
                    lng: parseFloat(data.response.result.point.x),
                    resolvedAddress: address,
                    source: 'vworld' 
                });
            }
        }

        return NextResponse.json({
            success: false,
            message: '주소를 찾을 수 없어 기본 위치를 반환합니다.'
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'UNKNOWN';
        logger.error({ event: 'api.geocode.error', message });
        return NextResponse.json({
            success: false,
            error: '좌표 변환 중 오류 발생'
        }, { status: 500 });
    }
}
