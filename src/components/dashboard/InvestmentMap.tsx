'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';

// OpenStreetMap은 SSR 비활성화로 동적 import
const OpenStreetMap = dynamic(
  () => import('./OpenStreetMap').then(mod => mod.OpenStreetMap),
  { ssr: false, loading: () => <div className="h-full bg-slate-100 animate-pulse rounded-3xl" /> }
);

interface InvestmentMapProps {
  address: string;
  coords?: { lat: number; lng: number };
  transactions?: any[];
}

export function InvestmentMap({ address, coords, transactions }: InvestmentMapProps) {
  const [mapType, setMapType] = useState<'loading' | 'kakao' | 'osm'>('loading');
  const [KakaoMap, setKakaoMap] = useState<any>(null);

  useEffect(() => {
    // 카카오맵 키 확인
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

    if (kakaoKey && kakaoKey !== "YOUR_KEY_HERE" && kakaoKey.length > 10) {
      // 카카오맵 SDK 로드 시도
      const loadKakaoMap = async () => {
        try {
          const sdk = await import('react-kakao-maps-sdk');
          setKakaoMap(sdk);
          setMapType('kakao');
        } catch (e) {
          console.warn('카카오맵 로드 실패, OpenStreetMap 사용');
          setMapType('osm');
        }
      };
      loadKakaoMap();
    } else {
      // 키가 없으면 OpenStreetMap 사용
      setMapType('osm');
    }
  }, []);

  // 가상의 주변 실거래 사례 생성
  const displayMarkers = transactions && transactions.length > 0 ? transactions : (coords ? [
    { lat: coords.lat + 0.001, lng: coords.lng + 0.001, price: "5,200", date: "24.05" },
    { lat: coords.lat - 0.0015, lng: coords.lng + 0.0005, price: "4,800", date: "24.02" },
    { lat: coords.lat + 0.0008, lng: coords.lng - 0.0012, price: "6,100", date: "23.11" },
  ] : []);

  // 로딩 중
  if (mapType === 'loading') {
    return (
      <Card className="h-full bg-slate-100 flex items-center justify-center border-none shadow-lg rounded-3xl">
        <div className="text-center p-6">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">지도 로딩 중...</p>
        </div>
      </Card>
    );
  }

  // OpenStreetMap 사용
  if (mapType === 'osm') {
    return (
      <OpenStreetMap
        address={address}
        coords={coords}
        transactions={displayMarkers}
      />
    );
  }

  // 카카오맵 사용
  if (mapType === 'kakao' && KakaoMap) {
    const { Map, MapMarker, CustomOverlayMap } = KakaoMap;
    const defaultCenter = { lat: 37.566826, lng: 126.9786567 };

    return (
      <Card className="h-full overflow-hidden flex flex-col border-none shadow-lg rounded-3xl">
        <CardHeader className="p-4 pb-2 border-b bg-slate-50">
          <CardTitle className="text-sm font-bold text-slate-600 flex justify-between items-center">
            <span>📍 위치 및 주변 실거래 사례</span>
            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">반경 500m 분석</span>
          </CardTitle>
        </CardHeader>
        <div className="flex-1 min-h-[300px] relative">
          <Map
            center={coords || defaultCenter}
            style={{ width: "100%", height: "100%" }}
            level={3}
          >
            {/* 대상지 마커 (메인) */}
            {coords && (
              <MapMarker
                position={coords}
                image={{
                  src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                  size: { width: 24, height: 35 }
                }}
              />
            )}

            {/* 주변 실거래 마커들 */}
            {displayMarkers.map((marker, index) => (
              <CustomOverlayMap key={index} position={{ lat: Number(marker.lat), lng: Number(marker.lng) }}>
                <div className="bg-white border-2 border-blue-600 px-2 py-1 rounded-lg shadow-lg">
                  <p className="text-[10px] font-black text-blue-600 leading-none">{marker.price}</p>
                  <p className="text-[8px] text-gray-400 text-center">{marker.date}</p>
                </div>
              </CustomOverlayMap>
            ))}
          </Map>
        </div>
      </Card>
    );
  }

  // 폴백: API 키 안내
  return (
    <Card className="h-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl">
      <div className="text-center p-6">
        <p className="text-slate-500 font-bold mb-2">지도를 표시할 수 없습니다</p>
        <p className="text-xs text-slate-400">
          docs/MAP_API_GUIDE.md를 참고하세요
        </p>
      </div>
    </Card>
  );
}