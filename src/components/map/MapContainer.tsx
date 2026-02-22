"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { useBuildingStore } from '@/stores/buildingStore';
import { useRoomStore } from '@/stores/roomStore';
import type { Coordinates } from '@/types/location';

// react-kakao-maps-sdk 타입
type KakaoSdk = {
    Map: React.ComponentType<any>;
    MapMarker: React.ComponentType<any>;
    CustomOverlayMap: React.ComponentType<any>;
    MapTypeId: React.ComponentType<any>;
    ZoomControl: React.ComponentType<any>;
    Loader: new (options: { appkey: string; libraries?: string[] }) => { load: () => Promise<unknown> };
};

function isPlaceholderKakaoKey(rawKey: string): boolean {
    const key = rawKey.trim().toLowerCase();
    if (!key) return true;
    if (key.startsWith('your_')) return true;
    if (key.includes('placeholder')) return true;
    return key.length < 20;
}

interface MapContainerProps {
    onBuildingClick?: (coords: Coordinates) => void;
}

const MapContainer: React.FC<MapContainerProps> = ({ onBuildingClick }) => {
    const { center, zoomLevel, selectedBuilding, setCenter, panelOpen } = useMapStore();
    const [kakaoSdk, setKakaoSdk] = useState<KakaoSdk | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    // SDK 로드
    useEffect(() => {
        let cancelled = false;
        const kakaoKey = String(process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? '').trim();

        if (isPlaceholderKakaoKey(kakaoKey)) {
            setLoadError('카카오 지도 키가 설정되지 않았습니다.');
            return;
        }

        const loadSdk = async () => {
            try {
                setLoadError(null);
                const sdkModule: any = await import('react-kakao-maps-sdk');
                if (!sdkModule?.Loader || !sdkModule?.Map || !sdkModule?.MapMarker) {
                    throw new Error('KAKAO_SDK_INVALID');
                }
                const loader = new sdkModule.Loader({ appkey: kakaoKey, libraries: ['services'] });
                await loader.load();
                if (!cancelled) setKakaoSdk(sdkModule as KakaoSdk);
            } catch (error) {
                if (cancelled) return;
                setLoadError(error instanceof Error ? error.message : '카카오 지도 로드 실패');
            }
        };

        loadSdk();
        return () => { cancelled = true; };
    }, []);

    // 지도 클릭 핸들러
    const handleMapClick = useCallback((_map: unknown, mouseEvent: unknown) => {
        const latLng = (mouseEvent as any)?.latLng;
        if (!latLng) return;

        const lat = Number(latLng.getLat?.());
        const lng = Number(latLng.getLng?.());
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        onBuildingClick?.({ lat, lng });
    }, [onBuildingClick]);

    // 로딩 상태
    if (!kakaoSdk) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#1A2035]">
                <div className="text-center">
                    {loadError ? (
                        <>
                            <p className="text-sm font-semibold text-[#848484] mb-1">지도를 불러올 수 없습니다.</p>
                            <p className="text-xs text-[#6A6A6A] break-all max-w-[300px]">{loadError}</p>
                        </>
                    ) : (
                        <>
                            <div className="h-8 w-8 mx-auto mb-3 border-4 border-[#C9A962] border-t-transparent animate-spin" style={{ borderRadius: 0 }} />
                            <p className="text-sm text-[#848484]">카카오 지도를 불러오는 중입니다...</p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    const { Map, MapMarker, CustomOverlayMap, ZoomControl } = kakaoSdk;

    return (
        <div className="w-full h-full relative">
            <Map
                center={center}
                style={{ width: '100%', height: '100%' }}
                level={zoomLevel}
                onClick={handleMapClick}
                onCenterChanged={(map: any) => {
                    const lat = map.getCenter().getLat();
                    const lng = map.getCenter().getLng();
                    if (Number.isFinite(lat) && Number.isFinite(lng)) {
                        setCenter({ lat, lng });
                    }
                }}
            >
                <ZoomControl position="LEFT" />

                {/* 선택된 건물 마커 */}
                {selectedBuilding && (
                    <>
                        <MapMarker
                            position={selectedBuilding.coordinates}
                            image={{
                                src: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#C9A962"/><text x="20" y="24" text-anchor="middle" fill="#0A0A0A" font-size="14" font-weight="bold" font-family="sans-serif">B</text></svg>`),
                                size: { width: 40, height: 40 },
                            }}
                        />
                        <CustomOverlayMap
                            position={selectedBuilding.coordinates}
                            yAnchor={2.5}
                            zIndex={30}
                        >
                            <div
                                style={{
                                    background: '#C9A962',
                                    color: '#0A0A0A',
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                }}
                            >
                                {selectedBuilding.buildingName || selectedBuilding.address}
                            </div>
                        </CustomOverlayMap>
                    </>
                )}
            </Map>

            {/* 힌트 카드 (패널 닫힌 상태에서만) */}
            {!panelOpen && !selectedBuilding && (
                <div
                    className="absolute bottom-6 right-6 z-10 flex items-center gap-2.5"
                    style={{
                        background: '#111111',
                        border: '1px solid #2A2A2A',
                        padding: '12px 16px',
                    }}
                >
                    <span className="material-symbols-rounded text-[#C9A962]" style={{ fontSize: 16 }}>ads_click</span>
                    <span className="text-xs text-[#848484]">지도에서 건물을 클릭하면 호실별 견적서가 생성됩니다</span>
                </div>
            )}
        </div>
    );
};

export default MapContainer;
