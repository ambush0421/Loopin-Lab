export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const DEFAULT_VWORLD_KEY = '9E8E6CEB-3D63-3761-B9B8-9E52D4F0DC89';

function isPlaceholderKey(key: string | undefined): boolean {
  if (!key) return true;
  const k = key.trim().toLowerCase();
  return !k || k.startsWith('your_') || k.includes('placeholder') || k.length < 10;
}

const rawKakaoKey = process.env.KAKAO_REST_API_KEY;
const KAKAO_REST_KEY = isPlaceholderKey(rawKakaoKey) ? '' : rawKakaoKey!.trim();

const rawVWorldKey = process.env.VWORLD_API_KEY;
const VWORLD_API_KEY = isPlaceholderKey(rawVWorldKey) ? DEFAULT_VWORLD_KEY : rawVWorldKey!.trim();

type KakaoKeywordDocument = {
  place_name?: string;
  road_address_name?: string;
  address_name?: string;
  x?: string;
  y?: string;
};
type KakaoAddressDocument = {
  address_name?: string;
  address?: {
    b_code?: string;
    main_address_no?: string;
    sub_address_no?: string;
    region_2depth_name?: string;
    region_3depth_name?: string;
    region_3depth_h_name?: string;
  };
  road_address?: {
    address_name?: string;
  };
  x?: string;
  y?: string;
};

// 역지오코딩 결과 타입
interface ReverseGeocodeResult {
  address: string;          // 전체 지번 주소
  roadAddress: string;      // 도로명 주소
  buildingName: string;     // 건물명
  sigunguCd: string;        // 시군구코드 (5자리)
  bjdongCd: string;         // 법정동코드 (5자리)
  bun: string;              // 본번 (4자리)
  ji: string;               // 부번 (4자리)
  bcode: string;            // 법정동코드 (10자리)
}

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

function pickBestAddressDoc(docs: KakaoAddressDocument[], query: string): KakaoAddressDocument | null {
  if (!docs.length) return null;
  const q = normalizeForMatch(query);
  const scored = docs.map((doc) => {
    const road = normalizeForMatch(doc.road_address?.address_name || '');
    const land = normalizeForMatch(doc.address_name || '');
    let score = 0;
    if (road === q || land === q) score += 150;
    if (road.startsWith(q) || land.startsWith(q)) score += 90;
    if (road.includes(q) || land.includes(q)) score += 60;
    if (q.startsWith(road) || q.startsWith(land)) score += 40;
    return { doc, score };
  }).sort((a, b) => b.score - a.score);
  return scored[0]?.doc || null;
}

/**
 * VWorld 역지오코딩 — 행정구역코드를 직접 반환
 */
async function reverseGeocodeVWorld(lng: string, lat: string): Promise<ReverseGeocodeResult | null> {
  try {
    const response = await fetch(
      `https://api.vworld.kr/req/address?service=address&request=getAddress&version=2.0&crs=epsg:4326&point=${lng},${lat}&type=BOTH&format=json&key=${VWORLD_API_KEY}`
    );
    if (!response.ok) return null;
    const data = await response.json();

    if (data.response?.status !== 'OK' || !data.response?.result?.length) return null;

    const results = data.response.result;
    // parcel(지번) 결과를 우선 사용
    const parcel = results.find((r: any) => r.type === 'parcel') || results[0];
    const road = results.find((r: any) => r.type === 'road');

    const structure = parcel.structure || {};
    // level1: 시/도, level2: 시군구, level4L: 법정동, level5: 리
    // 코드화를 위해 text로 구성된 값을 사용 — VWorld는 코드를 직접 주지 않으므로
    // 별도 행정코드 API를 호출

    return {
      address: parcel.text || '',
      roadAddress: road?.text || '',
      buildingName: '',
      sigunguCd: '',
      bjdongCd: '',
      bun: structure.detail?.split('-')?.[0]?.padStart(4, '0') || '0000',
      ji: structure.detail?.split('-')?.[1]?.padStart(4, '0') || '0000',
      bcode: '',
    };
  } catch {
    return null;
  }
}

/**
 * 카카오 역지오코딩 — coord2address API
 * b_code(법정동코드 10자리)를 포함하여 반환
 */
async function reverseGeocodeKakao(lng: string, lat: string): Promise<ReverseGeocodeResult | null> {
  if (!KAKAO_REST_KEY) return null;

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}&input_coord=WGS84`,
      { headers: { 'Authorization': `KakaoAK ${KAKAO_REST_KEY}` } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.documents?.length) return null;

    const doc = data.documents[0];
    const land = doc.address;
    const road = doc.road_address;

    if (!land) return null;

    // b_code: 10자리 법정동코드 (카카오 address 객체에 포함됨)
    const bcode = land.b_code || '';
    const sigunguCd = bcode.substring(0, 5);   // 앞 5자리 = 시군구코드
    const bjdongCd = bcode.substring(5, 10);    // 뒤 5자리 = 법정동코드

    const bun = (land.main_address_no || '0').padStart(4, '0');
    const ji = (land.sub_address_no || '0').padStart(4, '0');

    const fullAddress = land.address_name || '';
    const roadAddress = road?.address_name || '';
    const buildingName = road?.building_name || '';

    return {
      address: fullAddress,
      roadAddress,
      buildingName,
      sigunguCd,
      bjdongCd,
      bun,
      ji,
      bcode,
    };
  } catch {
    return null;
  }
}

/**
 * 카카오 주소 검색 결과에서 행정코드 추출
 */
function extractCodesFromKakaoAddress(doc: KakaoAddressDocument): {
  sigunguCd: string;
  bjdongCd: string;
  bun: string;
  ji: string;
  bcode: string;
} {
  const addr = doc.address;
  if (!addr?.b_code) {
    return { sigunguCd: '', bjdongCd: '', bun: '', ji: '', bcode: '' };
  }

  const bcode = addr.b_code;
  return {
    sigunguCd: bcode.substring(0, 5),
    bjdongCd: bcode.substring(5, 10),
    bun: (addr.main_address_no || '0').padStart(4, '0'),
    ji: (addr.sub_address_no || '0').padStart(4, '0'),
    bcode,
  };
}

// ────────── GET 핸들러 ──────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  // ─── 역지오코딩 (좌표 → 주소 + 행정코드) ───
  if (lat && lng) {
    try {
      // 1차: 카카오 역지오코딩 (b_code 포함)
      const kakaoResult = await reverseGeocodeKakao(lng, lat);

      if (kakaoResult && kakaoResult.sigunguCd && kakaoResult.bjdongCd) {
        return NextResponse.json({
          success: true,
          data: kakaoResult,
        });
      }

      // 2차: VWorld 역지오코딩 (코드 없이 주소만)
      const vworldResult = await reverseGeocodeVWorld(lng, lat);
      if (vworldResult) {
        return NextResponse.json({
          success: true,
          data: vworldResult,
          warning: 'VWorld fallback — 행정코드가 불완전할 수 있습니다',
        });
      }

      return NextResponse.json(
        { success: false, error: '주소 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'UNKNOWN';
      logger.error({ event: 'api.geocode.reverse.error', message });
      return NextResponse.json(
        { success: false, error: '좌표를 주소로 변환하는 중 오류 발생' },
        { status: 500 }
      );
    }
  }

  // ─── 주소 검색 (주소 → 좌표 + 행정코드) ───
  const address = (searchParams.get('address') || '').trim();

  if (!address) {
    return NextResponse.json({ error: '주소 또는 좌표가 필요합니다.' }, { status: 400 });
  }

  try {
    logger.info({ event: 'api.geocode.request', address });

    if (KAKAO_REST_KEY) {
      // 카카오 주소 검색
      const kakaoRes = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
        { headers: { 'Authorization': `KakaoAK ${KAKAO_REST_KEY}` } }
      );

      if (kakaoRes.ok) {
        const data = await kakaoRes.json();
        const docs = (data.documents || []) as KakaoAddressDocument[];
        const best = pickBestAddressDoc(docs, address);
        if (best && best.y && best.x) {
          const codes = extractCodesFromKakaoAddress(best);
          const resolvedAddress =
            best.road_address?.address_name
            || best.address_name
            || address;
          return NextResponse.json({
            success: true,
            lat: parseFloat(best.y),
            lng: parseFloat(best.x),
            resolvedAddress,
            source: 'kakao',
            codes,       // ← 행정코드 추가!
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
            source: 'kakao_keyword',
            // keyword 검색은 b_code를 제공하지 않으므로 좌표로 역지오코딩 필요
            codes: null,
          });
        }
      }
    }

    // VWorld fallback
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
          source: 'vworld',
          codes: null,
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
