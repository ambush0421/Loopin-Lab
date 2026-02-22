"use client";

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useMapStore, type MapBuilding } from '@/stores/mapStore';
import { useBuildingStore } from '@/stores/buildingStore';
import { useRoomStore } from '@/stores/roomStore';
import MapContainer from '@/components/map/MapContainer';
import BuildingPanel from '@/components/map/BuildingPanel';
import type { Coordinates } from '@/types/location';
import { Search } from 'lucide-react';

import { useSearchParams } from 'next/navigation';

// ─── 클라이언트 카카오 Geocoder를 이용한 역지오코딩 ───
function clientReverseGeocode(coords: Coordinates): Promise<{
    address: string;
    roadAddress: string;
    buildingName: string;
    bcode: string;
    sigunguCd: string;
    bjdongCd: string;
    bun: string;
    ji: string;
} | null> {
    return new Promise((resolve) => {
        const kakao = (window as any).kakao;
        if (!kakao?.maps?.services?.Geocoder) {
            resolve(null);
            return;
        }

        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.coord2Address(coords.lng, coords.lat, (result: any[], status: string) => {
            if (status !== kakao.maps.services.Status.OK || !result?.length) {
                resolve(null);
                return;
            }

            const doc = result[0];
            const land = doc.address;
            const road = doc.road_address;

            if (!land) {
                resolve(null);
                return;
            }

            // coord2Address 결과에 b_code가 없을 수 있으므로 coord2RegionCode를 추가 호출
            let bcode = land.b_code || '';
            const fullAddress = land.address_name || '';
            const roadAddress = road?.address_name || '';
            const buildingName = road?.building_name || '';
            const bun = (land.main_address_no || '0').padStart(4, '0');
            const ji = (land.sub_address_no || '0').padStart(4, '0');

            const finalize = (finalBcode: string) => {
                const sigunguCd = finalBcode.substring(0, 5);
                const bjdongCd = finalBcode.substring(5, 10);
                resolve({
                    address: fullAddress,
                    roadAddress,
                    buildingName,
                    bcode: finalBcode,
                    sigunguCd,
                    bjdongCd,
                    bun,
                    ji,
                });
            };

            if (bcode && bcode.length >= 10) {
                finalize(bcode);
            } else {
                // b_code가 없으면 법정동 코드 조회 (coord2RegionCode)
                geocoder.coord2RegionCode(coords.lng, coords.lat, (regionResult: any[], regionStatus: string) => {
                    if (regionStatus === kakao.maps.services.Status.OK && regionResult?.length) {
                        // region_type === 'B' (법정동)
                        const bRegion = regionResult.find((r: any) => r.region_type === 'B');
                        if (bRegion && bRegion.code) {
                            bcode = bRegion.code;
                        }
                    }
                    // 여전히 없으면 빈 문자열 패딩이라도 생성
                    finalize(bcode.padEnd(10, '0'));
                });
            }
        });
    });
}

// ─── 클라이언트 카카오 Geocoder를 이용한 장소/주소 검색 ───
function clientSearchAddress(query: string): Promise<{ lat: number; lng: number; address: string; placeName: string; bcode: string } | null> {
    return new Promise((resolve) => {
        const kakao = (window as any).kakao;
        if (!kakao?.maps?.services) {
            resolve(null);
            return;
        }

        const ps = new kakao.maps.services.Places();
        const geocoder = new kakao.maps.services.Geocoder();

        ps.keywordSearch(query, (data: any[], status: string) => {
            if (status === kakao.maps.services.Status.OK && data.length > 0) {
                const item = data[0];
                resolve({
                    lat: parseFloat(item.y),
                    lng: parseFloat(item.x),
                    address: item.road_address_name || item.address_name || query,
                    placeName: item.place_name || query,
                    bcode: ''
                });
            } else {
                geocoder.addressSearch(query, (result: any[], status: string) => {
                    if (status === kakao.maps.services.Status.OK && result.length > 0) {
                        const item = result[0];
                        resolve({
                            lat: parseFloat(item.y),
                            lng: parseFloat(item.x),
                            address: item.road_address?.address_name || item.address?.address_name || query,
                            placeName: item.road_address?.building_name || query,
                            bcode: item.address?.b_code || ''
                        });
                    } else {
                        resolve(null);
                    }
                });
            }
        });
    });
}

/** 주소 검색 → 좌표 + 행정코드 (서버 API) */
async function searchAddress(address: string) {
    const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
    if (!res.ok) throw new Error('주소 검색 실패');
    return res.json();
}

/** 건축물대장 API 호출 */
async function fetchBuildingLedger(sigunguCd: string, bjdongCd: string, bun: string, ji: string) {
    const res = await fetch(
        `/api/building-ledger?sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&bun=${bun}&ji=${ji}`
    );
    if (!res.ok) throw new Error('건축물대장 조회 실패');
    return res.json();
}

function ExploreMapContent() {
    const {
        panelOpen,
        selectedBuilding,
        selectBuilding,
        setPanelLoading,
        setPanelError,
        closePanel,
    } = useMapStore();

    const { reset: resetBuilding } = useBuildingStore();
    const { setAllRooms, reset: resetRoom } = useRoomStore();

    const searchParams = useSearchParams();
    const queryParam = searchParams.get('q');

    // 이전에 쿼리로 검색했는지 체크용 ref
    const searchedQuery = React.useRef<string | null>(null);

    const [searchQuery, setSearchQuery] = useState(queryParam || '');
    const [searching, setSearching] = useState(false);

    // ─── 건축물대장 데이터 로드 ───
    const loadBuildingData = useCallback(
        async (sigunguCd: string, bjdongCd: string, bun: string, ji: string) => {
            try {
                const result = await fetchBuildingLedger(sigunguCd, bjdongCd, bun, ji);

                if (!result.success) {
                    setPanelError(result.error || '건축물대장 데이터를 찾을 수 없습니다.');
                    return;
                }

                // buildingStore에 직접 저장
                const { setBuildingInfo } = useBuildingStore.getState();
                if (result.data?.summary) {
                    setBuildingInfo(result.data.summary);
                }

                // 호실 목록 저장
                if (result.data?.rooms?.length > 0) {
                    setAllRooms(result.data.rooms);
                }

                setPanelLoading(false);
            } catch (error: any) {
                setPanelError(error.message || '건물 데이터를 불러올 수 없습니다.');
            }
        },
        [setAllRooms, setPanelLoading, setPanelError],
    );

    // ─── 지도 클릭 핸들러 ───
    const handleMapClick = useCallback(
        async (coords: Coordinates) => {
            setPanelLoading(true);
            resetBuilding();
            resetRoom();

            try {
                // 1. 클라이언트 카카오 Geocoder로 역지오코딩 (b_code 포함)
                const geo = await clientReverseGeocode(coords);

                if (!geo) {
                    setPanelError('이 위치에서 주소를 찾을 수 없습니다.');
                    return;
                }

                // 2. 행정코드 확인
                if (!geo.sigunguCd || !geo.bjdongCd) {
                    const building: MapBuilding = {
                        address: geo.address || '주소 미확인',
                        roadAddress: geo.roadAddress || '',
                        buildingName: geo.buildingName || geo.address || '',
                        bcode: geo.bcode || '',
                        coordinates: coords,
                        sigunguCd: '',
                        bjdongCd: '',
                        bun: '',
                        ji: '',
                    };
                    selectBuilding(building);
                    setPanelError('이 위치의 행정코드를 확인할 수 없습니다.');
                    return;
                }

                // 3. 건물 선택 + 패널 열기
                const building: MapBuilding = {
                    address: geo.address,
                    roadAddress: geo.roadAddress,
                    buildingName: geo.buildingName || geo.address,
                    bcode: geo.bcode,
                    coordinates: coords,
                    sigunguCd: geo.sigunguCd,
                    bjdongCd: geo.bjdongCd,
                    bun: geo.bun,
                    ji: geo.ji,
                };
                selectBuilding(building);

                // 4. 건축물대장 데이터 로드
                await loadBuildingData(geo.sigunguCd, geo.bjdongCd, geo.bun, geo.ji);
            } catch (error: any) {
                setPanelError(error.message || '데이터를 불러오는 중 오류가 발생했습니다.');
            }
        },
        [selectBuilding, setPanelLoading, setPanelError, resetBuilding, resetRoom, loadBuildingData],
    );

    // ─── 주소 검색 핵심 로직 ───
    const executeSearch = useCallback(
        async (query: string) => {
            if (!query.trim()) return;

            setSearching(true);
            resetBuilding();
            resetRoom();

            try {
                // 1. 클라이언트 Geocoder로 먼저 검색 시도
                let clientResult = await clientSearchAddress(query);
                let coords: Coordinates;
                let codes: any = null;
                let buildingData: any = null;

                if (clientResult) {
                    coords = { lat: clientResult.lat, lng: clientResult.lng };
                    codes = { bcode: clientResult.bcode };
                    buildingData = {
                        address: clientResult.address,
                        placeName: clientResult.placeName
                    };
                } else {
                    // 2. 클라이언트 실패시 서버 geocode API로 백업 시도
                    const geoResult = await searchAddress(query);
                    if (!geoResult.success) {
                        setPanelError('주소를 찾을 수 없습니다.');
                        setSearching(false);
                        return;
                    }
                    coords = { lat: geoResult.lat, lng: geoResult.lng };
                    codes = geoResult.codes;
                    buildingData = {
                        address: geoResult.resolvedAddress,
                        placeName: geoResult.placeName || geoResult.resolvedAddress
                    };
                }

                // 3. 서버/클라이언트 API에서 행정코드를 모두 못 가져왔으면 위치 기반으로 역지오코딩 보완
                if (!codes?.sigunguCd) {
                    const clientGeo = await clientReverseGeocode(coords);
                    if (clientGeo?.sigunguCd) {
                        codes = {
                            sigunguCd: clientGeo.sigunguCd,
                            bjdongCd: clientGeo.bjdongCd,
                            bun: clientGeo.bun,
                            ji: clientGeo.ji,
                            bcode: clientGeo.bcode,
                        };
                    }
                }

                // 4. 건물 선택
                const building: MapBuilding = {
                    address: buildingData.address || query,
                    roadAddress: '',
                    buildingName: buildingData.placeName || query,
                    bcode: codes?.bcode || '',
                    coordinates: coords,
                    sigunguCd: codes?.sigunguCd || '',
                    bjdongCd: codes?.bjdongCd || '',
                    bun: codes?.bun || '',
                    ji: codes?.ji || '',
                };
                selectBuilding(building);

                // 4. 건축물대장 로드
                if (codes?.sigunguCd && codes?.bjdongCd) {
                    setPanelLoading(true);
                    await loadBuildingData(codes.sigunguCd, codes.bjdongCd, codes.bun, codes.ji);
                } else {
                    setPanelError('건축물대장 조회에 필요한 행정코드를 확인할 수 없습니다.');
                }
            } catch (error: any) {
                setPanelError(error.message || '검색 중 오류가 발생했습니다.');
            } finally {
                setSearching(false);
            }
        },
        [selectBuilding, setPanelLoading, setPanelError, resetBuilding, resetRoom, loadBuildingData],
    );

    // ─── 서브밋 폼 핸들러 ───
    const handleSearch = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            await executeSearch(searchQuery);
        },
        [searchQuery, executeSearch],
    );

    // ─── 초기 URL 쿼리 파라미터 자동 검색 처리 ───
    React.useEffect(() => {
        if (queryParam && queryParam !== searchedQuery.current) {
            searchedQuery.current = queryParam;
            setSearchQuery(queryParam);
            executeSearch(queryParam);
        }
    }, [queryParam, executeSearch]);
    const handleGenerateQuote = useCallback(() => {
        if (!selectedBuilding) return;
        const { sigunguCd, bjdongCd, bun, ji } = selectedBuilding;
        if (!sigunguCd || !bjdongCd) {
            setPanelError('건물 식별 정보가 부족하여 분석 페이지로 이동할 수 없습니다.');
            return;
        }
        const buildId = `${sigunguCd}-${bjdongCd}-${bun}-${ji}`;
        window.location.href = `/analyze/${buildId}`;
    }, [selectedBuilding, setPanelError]);

    return (
        <div className="h-screen flex flex-col" style={{ background: '#0A0A0A' }}>
            {/* 헤더 */}
            <header
                className="flex items-center shrink-0 gap-4"
                style={{
                    height: 60,
                    background: 'rgba(17, 17, 17, 0.85)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    padding: '0 24px',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)'
                }}
            >
                {/* 로고 */}
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <div
                        className="flex items-center justify-center"
                        style={{
                            width: 32, height: 32,
                            border: '1px solid #C9A962',
                            background: '#0A0A0A',
                        }}
                    >
                        <span className="text-base font-semibold" style={{ color: '#C9A962' }}>B</span>
                    </div>
                    <span
                        className="text-[13px] font-medium text-white hidden sm:inline"
                        style={{ letterSpacing: 2 }}
                    >
                        빌딩 리포트 프로
                    </span>
                </Link>

                {/* 검색창 */}
                <form onSubmit={handleSearch} className="flex-1 max-w-[420px] ml-4 transition-all duration-300 focus-within:max-w-[460px]">
                    <div
                        className="flex items-center gap-2 relative overflow-hidden transition-all duration-300 group"
                        style={{
                            height: 40,
                            background: 'rgba(26, 26, 26, 0.6)',
                            backdropFilter: 'blur(12px)',
                            border: `1px solid ${selectedBuilding ? 'rgba(201, 169, 98, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '8px',
                            padding: '0 16px',
                            boxShadow: selectedBuilding ? '0 0 16px rgba(201, 169, 98, 0.15)' : 'none',
                        }}
                    >
                        <Search
                            className="w-4 h-4 shrink-0 transition-colors duration-300 group-focus-within:text-[#C9A962]"
                            style={{ color: selectedBuilding ? '#C9A962' : '#848484' }}
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={selectedBuilding?.address || '주소 또는 지도에서 건물을 클릭하세요'}
                            className="bg-transparent text-[14px] text-white outline-none w-full placeholder:text-[#6A6A6A] font-medium"
                            disabled={searching}
                        />
                        {searching && (
                            <div className="w-4 h-4 border-2 border-[#C9A962] border-t-transparent animate-spin shrink-0 rounded-full" />
                        )}
                    </div>
                </form>

                {/* 스페이서 */}
                <div className="flex-1" />

                {/* 네비게이션 */}
                <nav className="flex items-center gap-6 shrink-0">
                    <Link href="/about" className="text-[13px] text-[#848484] hover:text-white transition-colors">
                        소개
                    </Link>
                    <Link href="/guide" className="text-[13px] text-[#848484] hover:text-white transition-colors">
                        가이드
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center text-[12px] font-medium"
                        style={{
                            background: '#C9A962',
                            color: '#0A0A0A',
                            padding: '8px 14px',
                        }}
                    >
                        텍스트 검색
                    </Link>
                </nav>
            </header>

            {/* 바디 (헤더가 absolute가 되었으므로 전체화면) */}
            <div className="flex flex-1 min-h-0 pt-[60px] relative z-10">
                {/* 지도 영역 */}
                <div className="flex-1 min-w-0">
                    <MapContainer onBuildingClick={handleMapClick} />
                </div>

                {/* 사이드 패널 */}
                {panelOpen && (
                    <BuildingPanel onGenerateQuote={handleGenerateQuote} />
                )}
            </div>
        </div>
    );
}

export default function MapPage() {
    return (
        <React.Suspense fallback={
            <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#C9A962] border-t-transparent animate-spin mb-4" />
                <p className="text-[#848484] text-sm">탐색 모듈 로딩 중...</p>
            </div>
        }>
            <ExploreMapContent />
        </React.Suspense>
    );
}
