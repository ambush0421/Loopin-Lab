import { create } from 'zustand';
import type { Coordinates } from '@/types/location';

// 지도 클릭으로 감지된 건물 정보
export interface MapBuilding {
    address: string;        // 지번 주소
    roadAddress: string;    // 도로명 주소
    buildingName: string;   // 건물명
    buildingCode?: string;  // 건물관리번호 (25자리) — 지도 클릭 시 없을 수 있음
    bcode: string;          // 법정동코드 (10자리)
    coordinates: Coordinates;

    // 건축물대장 API 호출에 필요한 행정코드
    sigunguCd: string;      // 시군구코드 (5자리)
    bjdongCd: string;       // 법정동코드 (5자리)
    bun: string;            // 본번 (4자리)
    ji: string;             // 부번 (4자리)
}

interface MapStoreState {
    // 지도 상태
    center: Coordinates;
    zoomLevel: number;

    // 패널 상태
    panelOpen: boolean;
    panelLoading: boolean;
    panelError: string | null;

    // 선택된 건물
    selectedBuilding: MapBuilding | null;

    // 액션
    setCenter: (coords: Coordinates) => void;
    setZoomLevel: (level: number) => void;
    openPanel: () => void;
    closePanel: () => void;
    setPanelLoading: (loading: boolean) => void;
    setPanelError: (error: string | null) => void;
    selectBuilding: (building: MapBuilding) => void;
    clearSelection: () => void;
    reset: () => void;
}

// 서울 시청 기본 좌표
const DEFAULT_CENTER: Coordinates = { lat: 37.566826, lng: 126.9786567 };

export const useMapStore = create<MapStoreState>((set) => ({
    center: DEFAULT_CENTER,
    zoomLevel: 3,
    panelOpen: false,
    panelLoading: false,
    panelError: null,
    selectedBuilding: null,

    setCenter: (coords) => set({ center: coords }),
    setZoomLevel: (level) => set({ zoomLevel: level }),
    openPanel: () => set({ panelOpen: true }),
    closePanel: () => set({ panelOpen: false, panelError: null }),
    setPanelLoading: (loading) => set({ panelLoading: loading }),
    setPanelError: (error) => set({ panelError: error, panelLoading: false, panelOpen: true }),

    selectBuilding: (building) => set({
        selectedBuilding: building,
        panelOpen: true,
        panelError: null,
        center: building.coordinates,
    }),

    clearSelection: () => set({
        selectedBuilding: null,
        panelOpen: false,
        panelLoading: false,
        panelError: null,
    }),

    reset: () => set({
        center: DEFAULT_CENTER,
        zoomLevel: 3,
        panelOpen: false,
        panelLoading: false,
        panelError: null,
        selectedBuilding: null,
    }),
}));
