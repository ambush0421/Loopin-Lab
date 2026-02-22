'use client';

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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

function isPlaceholderKakaoKey(rawKey: string): boolean {
  const key = rawKey.trim().toLowerCase();
  if (!key) return true;
  if (key === "your_key_here") return true;
  if (key === "your_kakao_javascript_key") return true;
  if (key === "your_javascript_key_here") return true;
  if (key.startsWith("your_")) return true;
  if (key.includes("placeholder")) return true;
  if (key.includes("발급")) return true;
  return false;
}

function canUseKakaoMap(rawKey: string): boolean {
  const key = rawKey.trim();
  if (isPlaceholderKakaoKey(key)) return false;
  // Kakao JavaScript 키는 일반적으로 20자 이상 영숫자 문자열입니다.
  return key.length >= 20;
}

export function InvestmentMap({ address, coords, transactions: _transactions }: InvestmentMapProps) {
  const [mapType, setMapType] = useState<'loading' | 'kakao' | 'osm' | 'error'>('loading');
  const [KakaoMap, setKakaoMap] = useState<any>(null);
  const [kakaoMapReady, setKakaoMapReady] = useState(false);
  const [kakaoLoadError, setKakaoLoadError] = useState<string | null>(null);
  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number } | undefined>(coords);
  const [viewMode, setViewMode] = useState<'map' | 'roadview'>('map');
  const [isExpanded, setIsExpanded] = useState(false);
  const [roadviewFailed, setRoadviewFailed] = useState(false);
  const [mapSkin, setMapSkin] = useState<'ROADMAP' | 'SKYVIEW'>('ROADMAP');

  useEffect(() => {
    // 카카오맵 키 확인
    const kakaoKey = String(process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? '');

    if (canUseKakaoMap(kakaoKey)) {
      // 카카오맵 SDK 로드 시도
      const loadKakaoMap = async () => {
        try {
          setKakaoLoadError(null);
          const sdk = await import('react-kakao-maps-sdk');
          if (!sdk || !('Map' in sdk) || !('Loader' in sdk)) {
            throw new Error('KAKAO_SDK_INVALID');
          }
          // 공식 문서 기준: JavaScript 키로 SDK를 명시 로딩해야 도메인 검증과 초기화가 정상 동작합니다.
          const sdkAny = sdk as any;
          const loader = new sdkAny.Loader({
            appkey: kakaoKey,
            libraries: ['services', 'clusterer'],
          });
          await loader.load();
          setKakaoMap(sdk);
          setMapType('kakao');
          setKakaoMapReady(false);
        } catch (e) {
          const message = e instanceof Error ? e.message : 'KAKAO_SDK_LOAD_FAILED';
          console.warn('카카오맵 로드 실패(키/도메인/SDK)', e);
          setKakaoLoadError(message);
          setMapType('error');
        }
      };
      loadKakaoMap();
    } else {
      // 키가 없으면 OpenStreetMap 사용
      setMapType('osm');
    }
  }, []);

  useEffect(() => {
    if (mapType !== 'kakao') return;
    const timeout = setTimeout(() => {
      if (!kakaoMapReady) {
        console.warn('카카오맵 초기화 실패');
        setKakaoLoadError('KAKAO_MAP_INIT_TIMEOUT');
        setMapType('error');
      }
    }, 4000);
    return () => clearTimeout(timeout);
  }, [mapType, kakaoMapReady]);

  useEffect(() => {
    setResolvedCoords(coords);
  }, [coords?.lat, coords?.lng]);

  useEffect(() => {
    if (coords) return;
    if (mapType !== 'kakao' || !KakaoMap || !address?.trim()) return;
    if (typeof window === 'undefined') return;

    const globalKakao = (window as Window & { kakao?: any }).kakao;
    const geocoderCtor = globalKakao?.maps?.services?.Geocoder;
    const statusEnum = globalKakao?.maps?.services?.Status;
    if (!geocoderCtor || !statusEnum) return;

    const geocoder = new geocoderCtor();
    geocoder.addressSearch(address, (result: Array<{ x: string; y: string }> | null, status: string) => {
      if (status !== statusEnum.OK || !result?.length) return;
      const first = result[0];
      const lat = Number(first.y);
      const lng = Number(first.x);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setResolvedCoords({ lat, lng });
      }
    });
  }, [address, coords, mapType, KakaoMap]);

  const pinCoords = resolvedCoords || coords;

  useEffect(() => {
    setRoadviewFailed(false);
  }, [pinCoords?.lat, pinCoords?.lng, address]);

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
        coords={pinCoords}
        transactions={[]}
      />
    );
  }

  if (mapType === 'error') {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    return (
      <Card className="h-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-amber-200 rounded-3xl">
        <div className="text-center p-6 max-w-[560px]">
          <p className="text-slate-700 font-bold mb-2">카카오 지도 로딩에 실패했습니다</p>
          <p className="text-xs text-slate-500 mb-3 break-words">
            current origin: {currentOrigin || '-'}
          </p>
          <p className="text-xs text-slate-500 mb-4 break-words">
            error: {kakaoLoadError || 'unknown'}
          </p>
          <p className="text-xs text-slate-500">
            카카오 개발자 콘솔에서 JavaScript 키, Web 플랫폼 도메인, 지도 API 활성화를 확인하세요.
          </p>
          <button
            type="button"
            onClick={() => setMapType('osm')}
            className="mt-4 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
          >
            OpenStreetMap으로 계속 보기
          </button>
        </div>
      </Card>
    );
  }

  // 카카오맵 사용
  if (mapType === 'kakao' && KakaoMap) {
    const { Map, MapMarker, Roadview, RoadviewMarker } = KakaoMap;
    const defaultCenter = { lat: 37.566826, lng: 126.9786567 };
    const mapCenter = pinCoords || defaultCenter;
    const mapTypeId: 'ROADMAP' | 'HYBRID' = mapSkin === 'SKYVIEW' ? 'HYBRID' : 'ROADMAP';

    return (
      <Card className={`${isExpanded ? 'fixed inset-4 z-[70]' : 'h-full'} overflow-hidden flex flex-col border-none shadow-lg rounded-3xl`}>
        <CardHeader className="p-4 pb-2 border-b bg-slate-50">
          <CardTitle className="text-sm font-bold text-slate-600 flex items-center justify-between gap-2">
            <span>📍 건물 위치</span>
            <div className="flex items-center gap-2">
              {viewMode === 'roadview' && (
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('map');
                    setRoadviewFailed(false);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full border bg-white text-slate-700 border-slate-200"
                  title="지도로 돌아가기"
                >
                  지도복귀
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${isExpanded
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-slate-700 border-slate-200'
                  }`}
                title={isExpanded ? '기본 크기' : '전체 지도'}
              >
                {isExpanded ? '기본크기' : '전체지도'}
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <div className="flex-1 min-h-[300px] relative">
          {viewMode === 'roadview' ? (
            pinCoords ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('map');
                    setRoadviewFailed(false);
                  }}
                  className="absolute left-3 top-3 z-20 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  title="지도로 돌아가기"
                >
                  지도
                </button>
                <Roadview
                  position={{ lat: mapCenter.lat, lng: mapCenter.lng, radius: 80 }}
                  style={{ width: '100%', height: '100%' }}
                  onCreate={() => setKakaoMapReady(true)}
                  onErrorGetNearestPanoId={() => setRoadviewFailed(true)}
                  onInit={() => setRoadviewFailed(false)}
                >
                  <RoadviewMarker position={pinCoords} />
                </Roadview>
                {roadviewFailed && (
                  <div className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center text-sm font-semibold">
                    로드뷰를 찾을 수 없습니다. 주변 위치로 지도를 확인하세요.
                  </div>
                )}
              </>
            ) : (
              <div className="h-full w-full bg-slate-100 text-slate-500 text-sm flex items-center justify-center">
                좌표가 없어 로드뷰를 표시할 수 없습니다.
              </div>
            )
          ) : (
            <>
              <div className="absolute left-3 top-3 z-20 flex overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setMapSkin('ROADMAP')}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${mapSkin === 'ROADMAP'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  지도
                </button>
                <button
                  type="button"
                  onClick={() => setMapSkin('SKYVIEW')}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${mapSkin === 'SKYVIEW'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  스카이뷰
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewMode('roadview');
                  setRoadviewFailed(false);
                }}
                disabled={!pinCoords}
                className="absolute right-3 top-3 z-20 h-12 w-12 rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm disabled:opacity-40 flex items-center justify-center"
                title="로드뷰 보기"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="7" r="3.5" />
                  <path d="M12 11v7" />
                  <path d="M8 21h8" />
                </svg>
              </button>
              <Map
                center={mapCenter}
                mapTypeId={mapTypeId}
                style={{ width: "100%", height: "100%" }}
                level={3}
                onCreate={() => setKakaoMapReady(true)}
              >
                {pinCoords && (
                  <MapMarker
                    position={pinCoords}
                    onClick={() => {
                      setViewMode('roadview');
                      setRoadviewFailed(false);
                    }}
                  />
                )}
              </Map>
            </>
          )}
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
