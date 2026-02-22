"use client";

import React from 'react';
import { useBuildingStore } from '@/stores/buildingStore';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Loader2, MapPin } from 'lucide-react';
import type { Coordinates } from '@/types/location';
import { parseBuildingCode } from '@/utils/address';

type ViewMode = 'map' | 'roadview';

type KakaoSdk = {
  Map: React.ComponentType<any>;
  MapMarker: React.ComponentType<any>;
  CustomOverlayMap: React.ComponentType<any>;
  MapTypeId: React.ComponentType<any>;
  ZoomControl: React.ComponentType<any>;
  Loader: new (options: { appkey: string; libraries?: string[] }) => { load: () => Promise<unknown> };
};

type MarketPriceTransaction = {
  addr: string;
  price: string;
  rawPrice: number;
  pyung: string;
  pricePerPyung: number;
  floor: string;
  date: string;
  lat: number;
  lng: number;
};

type MarketPriceResponse = {
  transactions?: MarketPriceTransaction[];
};

const SEOUL_CITY_HALL: Coordinates = { lat: 37.566826, lng: 126.9786567 };
const ROADVIEW_PIN_RADIUS = 35;
const ROADVIEW_INITIAL_RADIUS = 120;

function isPlaceholderKakaoKey(rawKey: string): boolean {
  const key = rawKey.trim().toLowerCase();
  if (!key) return true;
  if (key === 'your_key_here') return true;
  if (key === 'your_kakao_javascript_key') return true;
  if (key === 'your_javascript_key_here') return true;
  if (key.startsWith('your_')) return true;
  if (key.includes('placeholder')) return true;
  if (key.includes('발급')) return true;
  return false;
}

function canUseKakaoMap(rawKey: string): boolean {
  const key = rawKey.trim();
  if (isPlaceholderKakaoKey(key)) return false;
  return key.length >= 20;
}

function getMarkerCoordinates(target: unknown): Coordinates | null {
  const position = (target as { getPosition?: () => { getLat?: () => number; getLng?: () => number } })
    ?.getPosition?.();
  if (!position) return null;

  const lat = Number(position.getLat?.());
  const lng = Number(position.getLng?.());

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function getClickCoordinates(mouseEvent: unknown): Coordinates | null {
  const latLng = (mouseEvent as { latLng?: { getLat?: () => number; getLng?: () => number } })?.latLng;
  if (!latLng) return null;

  const lat = Number(latLng.getLat?.());
  const lng = Number(latLng.getLng?.());

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function getNearestRoadviewPanoId(position: Coordinates, radius: number): Promise<number | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);

  const kakaoGlobal = (window as Window & { kakao?: any }).kakao;
  const roadviewClientCtor = kakaoGlobal?.maps?.RoadviewClient;
  const latLngCtor = kakaoGlobal?.maps?.LatLng;

  if (!roadviewClientCtor || !latLngCtor) return Promise.resolve(null);

  return new Promise<number | null>((resolve) => {
    try {
      const roadviewClient = new roadviewClientCtor();
      const latLng = new latLngCtor(position.lat, position.lng);
      roadviewClient.getNearestPanoId(latLng, radius, (panoId: number | null) => {
        resolve(typeof panoId === 'number' ? panoId : null);
      });
    } catch {
      resolve(null);
    }
  });
}

const KakaoMap: React.FC = () => {
  const { locationInfo, buildingInfo, buildingCode } = useBuildingStore();
  const [kakaoSdk, setKakaoSdk] = React.useState<KakaoSdk | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>('map');
  const [showTransactionPanel, setShowTransactionPanel] = React.useState(true);
  const [marketTransactions, setMarketTransactions] = React.useState<MarketPriceTransaction[]>([]);
  const [selectedTransactionIndex, setSelectedTransactionIndex] = React.useState<number | null>(null);
  const [marketTransactionsLoading, setMarketTransactionsLoading] = React.useState(false);
  const [marketTransactionsError, setMarketTransactionsError] = React.useState<string | null>(null);
  const [roadviewPanoId, setRoadviewPanoId] = React.useState<number | null>(null);
  const [pinGuideMessage, setPinGuideMessage] = React.useState('파란색 로드뷰 라인 위에 핀을 놓아주세요.');
  const [pinPosition, setPinPosition] = React.useState<Coordinates | null>(locationInfo?.coordinates ?? null);

  React.useEffect(() => {
    setPinPosition(locationInfo?.coordinates ?? null);
    setRoadviewPanoId(null);
    setShowTransactionPanel(true);
    setViewMode('map');
    setPinGuideMessage('지도 모드입니다. 로드뷰 탭을 누르면 파란 라인이 표시됩니다.');
  }, [locationInfo?.coordinates?.lat, locationInfo?.coordinates?.lng]);

  React.useEffect(() => {
    let cancelled = false;
    const kakaoKey = String(process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? '').trim();

    if (!canUseKakaoMap(kakaoKey)) {
      setLoadError('카카오 지도 키가 설정되지 않았습니다.');
      return;
    }

    const loadKakaoSdk = async () => {
      try {
        setLoadError(null);
        const sdkModule: any = await import('react-kakao-maps-sdk');

        if (
          !sdkModule ||
          !sdkModule.Loader ||
          !sdkModule.Map ||
          !sdkModule.MapMarker ||
          !sdkModule.MapTypeId ||
          !sdkModule.ZoomControl
        ) {
          throw new Error('KAKAO_SDK_INVALID');
        }

        const loader = new sdkModule.Loader({
          appkey: kakaoKey,
          libraries: ['services'],
        });

        await loader.load();
        if (!cancelled) setKakaoSdk(sdkModule as KakaoSdk);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'KAKAO_SDK_LOAD_FAILED';
        setLoadError(message);
      }
    };

    loadKakaoSdk();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const syncInitialRoadviewPano = async () => {
      if (!kakaoSdk || !pinPosition) return;
      const panoId = await getNearestRoadviewPanoId(pinPosition, ROADVIEW_INITIAL_RADIUS);
      if (cancelled) return;

      setRoadviewPanoId(panoId);
      if (viewMode === 'roadview') {
        if (panoId) {
          setPinGuideMessage('파란색 로드뷰 라인 위에서 핀 이동이 가능합니다.');
        } else {
          setPinGuideMessage('로드뷰 가능한 파란색 라인 위로 핀을 이동해 주세요.');
        }
      }
    };

    void syncInitialRoadviewPano();

    return () => {
      cancelled = true;
    };
  }, [kakaoSdk, pinPosition?.lat, pinPosition?.lng, viewMode]);

  React.useEffect(() => {
    let cancelled = false;

    const loadMarketTransactions = async () => {
      if (!buildingCode) {
        setMarketTransactions([]);
        setSelectedTransactionIndex(null);
        return;
      }

      const { sigunguCd, bjdongCd } = parseBuildingCode(buildingCode);
      if (!sigunguCd || !bjdongCd) {
        setMarketTransactions([]);
        setSelectedTransactionIndex(null);
        return;
      }

      setMarketTransactionsLoading(true);
      setMarketTransactionsError(null);

      try {
        const response = await fetch(
          `/api/market-price?sigunguCd=${encodeURIComponent(sigunguCd)}&bjdongCd=${encodeURIComponent(bjdongCd)}`,
          { cache: 'no-store' }
        );

        if (!response.ok) {
          throw new Error('MARKET_TRANSACTION_FETCH_FAILED');
        }

        const data = (await response.json()) as MarketPriceResponse;
        const normalized = (data.transactions ?? []).filter(
          (tx) => Number.isFinite(tx.lat) && Number.isFinite(tx.lng)
        );

        if (cancelled) return;
        setMarketTransactions(normalized);
        setSelectedTransactionIndex(normalized.length > 0 ? 0 : null);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'UNKNOWN';
        setMarketTransactions([]);
        setSelectedTransactionIndex(null);
        setMarketTransactionsError(message);
      } finally {
        if (!cancelled) setMarketTransactionsLoading(false);
      }
    };

    void loadMarketTransactions();

    return () => {
      cancelled = true;
    };
  }, [buildingCode]);

  if (!locationInfo) return null;

  const center = pinPosition ?? locationInfo.coordinates ?? SEOUL_CITY_HALL;
  const mapTypeId: 'ROADMAP' = 'ROADMAP';
  const showRoadviewOverlay = viewMode === 'roadview';
  const isRoadviewReady = roadviewPanoId !== null;
  const selectedTransaction =
    selectedTransactionIndex !== null ? marketTransactions[selectedTransactionIndex] ?? null : null;

  const trySetPinOnRoadviewLine = async (next: Coordinates, radius: number = ROADVIEW_PIN_RADIUS) => {
    const panoId = await getNearestRoadviewPanoId(next, radius);
    if (panoId === null) {
      setRoadviewPanoId(null);
      setPinGuideMessage('로드뷰 가능한 파란색 라인 위에 핀을 놓아주세요.');
      return false;
    }

    setPinPosition(next);
    setRoadviewPanoId(panoId);
    setPinGuideMessage('로드뷰 가능한 위치입니다.');
    return true;
  };

  const handleMarkerDragEnd = async (target: unknown) => {
    const next = getMarkerCoordinates(target);
    if (!next) return;
    if (viewMode === 'roadview') {
      await trySetPinOnRoadviewLine(next);
      return;
    }
    setPinPosition(next);
    setPinGuideMessage('지도 모드입니다. 로드뷰 탭을 누르면 파란 라인이 표시됩니다.');
  };

  const handleMapClick = async (_map: unknown, mouseEvent: unknown) => {
    const next = getClickCoordinates(mouseEvent);
    if (!next) return;
    if (viewMode === 'roadview') {
      await trySetPinOnRoadviewLine(next);
      return;
    }
    setPinPosition(next);
    setPinGuideMessage('지도 모드입니다. 로드뷰 탭을 누르면 파란 라인이 표시됩니다.');
  };

  if (!kakaoSdk) {
    return (
      <Card className="w-full h-[480px] shadow-lg overflow-hidden border-2 border-primary/10 flex items-center justify-center">
        <div className="text-center px-6">
          {loadError ? (
            <>
              <p className="text-sm font-semibold text-slate-700 mb-1">지도를 불러올 수 없습니다.</p>
              <p className="text-xs text-slate-500 break-all">{loadError}</p>
            </>
          ) : (
            <>
              <div className="h-8 w-8 mx-auto mb-3 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              <p className="text-sm text-slate-600">카카오 지도를 불러오는 중입니다...</p>
            </>
          )}
        </div>
      </Card>
    );
  }

  const { Map, MapMarker, CustomOverlayMap, MapTypeId, ZoomControl } = kakaoSdk;

  return (
    <Card className="w-full h-[480px] shadow-lg overflow-hidden border-2 border-primary/10 relative">
      <div className="absolute left-1/2 top-3 -translate-x-1/2 z-20 flex items-center gap-2">
        <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => {
              setViewMode('map');
              setPinGuideMessage('지도 모드입니다. 로드뷰 탭을 누르면 파란 라인이 표시됩니다.');
            }}
            className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
              viewMode === 'map'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            지도
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('roadview');
              setPinGuideMessage('로드뷰 모드입니다. 파란 라인 위에서 핀을 이동하세요.');
            }}
            className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
              viewMode === 'roadview'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            로드뷰
          </button>
        </div>
      </div>

      {showTransactionPanel ? (
        <div className="absolute left-3 top-3 bottom-3 z-20 w-[320px] rounded-2xl border border-slate-200 bg-white/95 backdrop-blur shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">실거래 지도</p>
              <p className="text-base font-bold text-slate-900">거래내역 {marketTransactions.length}건</p>
            </div>
            <button
              type="button"
              onClick={() => setShowTransactionPanel(false)}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100"
              title="패널 접기"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <div className="h-[calc(100%-68px)] overflow-y-auto p-3 space-y-2">
            {marketTransactionsLoading && (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                실거래 데이터를 불러오는 중...
              </div>
            )}

            {!marketTransactionsLoading && marketTransactionsError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                실거래 조회 실패: {marketTransactionsError}
              </div>
            )}

            {!marketTransactionsLoading && !marketTransactionsError && marketTransactions.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                표시할 실거래 좌표가 없습니다.
              </div>
            )}

            {!marketTransactionsLoading &&
              marketTransactions.map((tx, idx) => (
                <button
                  key={`${tx.addr}-${tx.date}-${idx}`}
                  type="button"
                  onClick={() => setSelectedTransactionIndex(idx)}
                  className={`w-full text-left rounded-xl border px-3 py-2 transition-colors ${
                    selectedTransactionIndex === idx
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs text-slate-500 mb-1">{tx.date} · {tx.floor}층</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{tx.addr}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-lg leading-none font-bold text-blue-700">{tx.price}</p>
                    <p className="text-xs text-slate-500">{tx.pyung}평</p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowTransactionPanel(true)}
          className="absolute left-3 top-3 z-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg hover:bg-slate-50 flex items-center gap-1"
          title="실거래 패널 열기"
        >
          <ChevronRight className="h-4 w-4" />
          실거래
        </button>
      )}

      <Map
        center={center}
        style={{ width: '100%', height: '100%' }}
        level={3}
        mapTypeId={mapTypeId}
        onClick={handleMapClick}
      >
        {showRoadviewOverlay && <MapTypeId type="ROADVIEW" />}
        <ZoomControl position="RIGHT" />

        <MapMarker position={center} draggable onDragEnd={handleMarkerDragEnd} />

        <CustomOverlayMap position={center} yAnchor={2.2}>
          <div className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {buildingInfo?.bldNm || '분석 건물'}
          </div>
        </CustomOverlayMap>

        {marketTransactions.map((tx, idx) => (
          <CustomOverlayMap
            key={`tx-marker-${tx.addr}-${tx.date}-${idx}`}
            position={{ lat: tx.lat, lng: tx.lng }}
            yAnchor={1.2}
            zIndex={selectedTransactionIndex === idx ? 20 : 10}
          >
            <button
              type="button"
              onClick={() => setSelectedTransactionIndex(idx)}
              className={`rounded-full border px-2 py-1 text-xs font-bold shadow-sm transition-transform ${
                selectedTransactionIndex === idx
                  ? 'bg-rose-500 text-white border-rose-500 scale-110'
                  : 'bg-white text-blue-700 border-blue-200 hover:scale-105'
              }`}
              title={`${tx.addr} ${tx.price}`}
            >
              {tx.price}
            </button>
          </CustomOverlayMap>
        ))}
      </Map>

      <div
        className={`absolute left-3 bottom-3 z-20 rounded-lg px-3 py-2 text-xs text-white backdrop-blur-sm ${
          viewMode === 'roadview' && !isRoadviewReady ? 'bg-red-600/80' : 'bg-black/55'
        }`}
      >
        {viewMode === 'roadview'
          ? pinGuideMessage
          : '지도 모드입니다. 로드뷰 탭을 누르면 파란 라인이 표시됩니다.'}
      </div>

      {selectedTransaction && (
        <div className="absolute right-3 bottom-3 z-20 w-[280px] rounded-xl border border-slate-200 bg-white/95 backdrop-blur shadow-xl p-3">
          <p className="text-xs text-slate-500">{selectedTransaction.date} · {selectedTransaction.floor}층</p>
          <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">{selectedTransaction.addr}</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-2xl font-extrabold text-blue-700 leading-none">{selectedTransaction.price}</p>
            <p className="text-[11px] text-slate-500">평당 {selectedTransaction.pricePerPyung.toLocaleString()}만</p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default KakaoMap;
