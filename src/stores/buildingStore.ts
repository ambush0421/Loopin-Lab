import { create } from 'zustand';
import { BuildingInfo, BuildingSummary } from '@/types/building';
import { LocationInfo } from '@/types/location';
import { Room } from '@/types/room';
import { NearbyTransaction } from '@/types/transaction';
import { fetchAllBuildingData } from '@/services/buildingLedger';
import { addressToCoords, searchNearestSubway, searchNearestBusStop, searchNearbyFacilities } from '@/services/kakaoLocal';
import { fetchLandInfo } from '@/services/vworld';
import { fetchRecentTransactions } from '@/services/realTransaction';
import { parseBuildingCode, generatePNU } from '@/utils/address';
import { calcBuildingAge } from '@/utils/calculate';

interface BuildingStoreState {
  buildingInfo: BuildingInfo | null;
  locationInfo: LocationInfo | null;
  nearbyTransactions: NearbyTransaction[];
  isLoading: boolean;
  loadingStep: string;
  error: string | null;
  address: string;
  buildingCode: string;
  bcode: string;

  fetchBuildingData: (address: string, buildingCode: string, bcode: string, jibunAddress: string) => Promise<Room[]>;
  setBuildingInfo: (summary: BuildingSummary) => void;
  reset: () => void;
}

export const useBuildingStore = create<BuildingStoreState>((set) => ({
  buildingInfo: null,
  locationInfo: null,
  nearbyTransactions: [],
  isLoading: false,
  loadingStep: "",
  error: null,
  address: "",
  buildingCode: "",
  bcode: "",

  fetchBuildingData: async (address, buildingCode, bcode, jibunAddress) => {
    set({ isLoading: true, error: null, address, buildingCode, bcode });

    try {
      // 1단계: 주소 파싱
      const { sigunguCd, bjdongCd, bun, ji } = parseBuildingCode(buildingCode);

      // 2단계: 건축물대장 조회
      set({ loadingStep: "건축물대장 조회 중..." });
      const { summary, rooms } = await fetchAllBuildingData(sigunguCd, bjdongCd, bun, ji);

      const buildingAge = calcBuildingAge(summary.useAprDay);
      const buildingInfo: BuildingInfo = {
        ...summary,
        buildingAge,
        totalElevatorCnt: summary.rideUseElvtCnt + summary.emgenUseElvtCnt,
      };

      set({ buildingInfo, loadingStep: "위치정보 분석 중..." });

      // 3단계: 좌표 변환 + 주변정보 (병렬)
      const coords = await addressToCoords(address);
      let locationInfo: LocationInfo | null = null;

      if (coords) {
        const [subway, busStop, facilities] = await Promise.all([
          searchNearestSubway(coords.lat, coords.lng),
          searchNearestBusStop(coords.lat, coords.lng),
          searchNearbyFacilities(coords.lat, coords.lng),
        ]);

        // 4단계: 토지정보
        set({ loadingStep: "토지정보 조회 중..." });
        const pnu = generatePNU(bcode, false, bun, ji);
        const landInfo = await fetchLandInfo(pnu);

        locationInfo = {
          coordinates: coords,
          nearestStation: subway,
          nearestBusStop: busStop,
          nearbyFacilities: facilities,
          landInfo,
        };
      }

      // 5단계: 주변 실거래가
      set({ loadingStep: "주변 실거래가 조회 중..." });
      const transactions = await fetchRecentTransactions(sigunguCd, 3);

      set({
        locationInfo,
        nearbyTransactions: transactions,
        isLoading: false,
        loadingStep: ""
      });

      return rooms; // RoomSelector에서 초기화 시 사용하도록 반환
    } catch (error: any) {
      console.error('Error in fetchBuildingData:', error);
      set({ error: error.message || "데이터를 불러오는 중 오류가 발생했습니다.", isLoading: false, loadingStep: "" });
      throw error;
    }
  },

  setBuildingInfo: (summary: BuildingSummary) => {
    const buildingAge = calcBuildingAge(summary.useAprDay);
    const buildingInfo: BuildingInfo = {
      ...summary,
      buildingAge,
      totalElevatorCnt: summary.rideUseElvtCnt + summary.emgenUseElvtCnt,
    };
    set({ buildingInfo, isLoading: false, loadingStep: '' });
  },

  reset: () => set({
    buildingInfo: null,
    locationInfo: null,
    nearbyTransactions: [],
    isLoading: false,
    loadingStep: "",
    error: null,
    address: "",
    buildingCode: "",
    bcode: "",
  }),
}));
