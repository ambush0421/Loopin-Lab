export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// 단순 메모리 캐시 (서버 재시작 전까지 유지)
const geoCache = new Map<string, { lat: number; lng: number; source: string }>();

const KAKAO_REST_KEY = process.env.KAKAO_REST_API_KEY;
// 브이월드 키 (환경변수 권장, 없으면 기존 하드코딩 키 사용)
const VWORLD_KEY = process.env.VWORLD_API_KEY || '9E8E6CEB-3D63-3761-B9B8-9E52D4F0DC89';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const address = (searchParams.get('address') || '').trim();

    if (!address) {
        return NextResponse.json({ error: '주소가 필요합니다.' }, { status: 400 });
    }

    // 1. 캐시 확인
    if (geoCache.has(address)) {
        logger.info({ event: 'api.geocode.cache_hit', address });
        return NextResponse.json({ success: true, ...geoCache.get(address) });
    }

    try {
        logger.info({ event: 'api.geocode.request', address });

        // 2. 카카오 로컬 API (가장 정확)
        if (KAKAO_REST_KEY) {
            const kakaoRes = await fetch(
                `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
                { headers: { 'Authorization': `KakaoAK ${KAKAO_REST_KEY}` } }
            );

            if (kakaoRes.ok) {
                const data = await kakaoRes.json();
                if (data.documents && data.documents.length > 0) {
                    const result = {
                        lat: parseFloat(data.documents[0].y),
                        lng: parseFloat(data.documents[0].x),
                        source: 'kakao'
                    };
                    geoCache.set(address, result);
                    return NextResponse.json({ success: true, ...result });
                }
            }
        }

        // 3. 브이월드 (국가 공간정보 오픈플랫폼)
        const vworldRes = await fetch(
            `https://api.vworld.kr/req/address?service=address&request=getcoord&version=2.0&crs=epsg:4326&address=${encodeURIComponent(address)}&format=json&type=ROAD&key=${VWORLD_KEY}`
        );

        if (vworldRes.ok) {
            const data = await vworldRes.json();
            if (data.response?.status === 'OK' && data.response?.result?.point) {
                const result = {
                    lat: parseFloat(data.response.result.point.y),
                    lng: parseFloat(data.response.result.point.x),
                    source: 'vworld'
                };
                geoCache.set(address, result);
                return NextResponse.json({ success: true, ...result });
            }
        }

        // 4. Nominatim (OpenStreetMap 기반 - 최후의 수단)
        const osmRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=kr&limit=1`,
            { headers: { 'User-Agent': 'BuildingReportPro/1.0' } }
        );

        if (osmRes.ok) {
            const data = await osmRes.json();
            if (data && data.length > 0) {
                const result = {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    source: 'osm'
                };
                geoCache.set(address, result);
                return NextResponse.json({ success: true, ...result });
            }
        }

        // 5. 모두 실패 시 기본값 (서울시청)
        return NextResponse.json({
            success: false,
            lat: 37.566826,
            lng: 126.9786567,
            source: 'fallback',
            message: '주소를 찾을 수 없어 기본 위치를 반환합니다.'
        });

    } catch (error: any) {
        logger.error({ event: 'api.geocode.error', message: error.message });
        return NextResponse.json({
            success: false,
            lat: 37.566826,
            lng: 126.9786567,
            error: '좌표 변환 중 오류 발생'
        }, { status: 500 });
    }
}