import axios from 'axios';
import { BuildingSummary } from '@/types/building';
import { Room } from '@/types/room';

const BASE_URL = 'http://apis.data.go.kr/1613000/BldRgstHubService';
const SERVICE_KEY = process.env.NEXT_PUBLIC_VITE_DATA_GO_KR_API_KEY;

const api = axios.create({
  baseURL: BASE_URL,
  params: {
    serviceKey: SERVICE_KEY,
    _type: 'json',
    numOfRows: 9999,
  },
});

/**
 * 건축물대장 총괄표제부 조회
 */
export const fetchBuildingGeneral = async (
  sigunguCd: string,
  bjdongCd: string,
  bun: string,
  ji: string
): Promise<BuildingSummary | null> => {
  try {
    const response = await api.get('/getBrRecapTitleInfo', {
      params: { sigunguCd, bjdongCd, bun: bun.padStart(4, '0'), ji: ji.padStart(4, '0') },
    });

    const items = response.data?.response?.body?.items?.item;
    if (!items) return null;

    const item = Array.isArray(items) ? items[0] : items;

    // 필드 매핑 및 보정
    const totPkngCnt = item.totPkngCnt || (
      Number(item.inMechPkngCnt || 0) +
      Number(item.outMechPkngCnt || 0) +
      Number(item.inAutoPkngCnt || 0) +
      Number(item.outAutoPkngCnt || 0)
    );

    return {
      bldNm: item.bldNm || "",
      platPlc: item.platPlc || "",
      newPlatPlc: item.newPlatPlc || "",
      useAprDay: item.useAprDay || "",
      mainPurpsCdNm: item.mainPurpsCdNm || "",
      etcPurps: item.etcPurps || "",
      strctCdNm: item.strctCdNm || "",
      grndFlrCnt: Number(item.grndFlrCnt || 0),
      ugrndFlrCnt: Number(item.ugrndFlrCnt || 0),
      totArea: Number(item.totArea || 0),
      archArea: Number(item.archArea || 0),
      platArea: Number(item.platArea || 0),
      bcRat: Number(item.bcRat || 0),
      vlRat: Number(item.vlRat || 0),
      totPkngCnt: Number(totPkngCnt),
      rideUseElvtCnt: Number(item.rideUseElvtCnt || 0),
      emgenUseElvtCnt: Number(item.emgenUseElvtCnt || 0),
      hhldCnt: Number(item.hhldCnt || 0),
      fmlyCnt: Number(item.fmlyCnt || 0),
      engyEffcGradCd: item.engyEffcGradCd || "",
    };
  } catch (error) {
    console.error('Error fetching building general info:', error);
    return null;
  }
};

/**
 * 건축물대장 표제부 조회 (건물명 등 보완)
 */
export const fetchBuildingTitle = async (
  sigunguCd: string,
  bjdongCd: string,
  bun: string,
  ji: string
): Promise<Partial<BuildingSummary> | null> => {
  try {
    const response = await api.get('/getBrTitleInfo', {
      params: { sigunguCd, bjdongCd, bun: bun.padStart(4, '0'), ji: ji.padStart(4, '0') },
    });
    const items = response.data?.response?.body?.items?.item;
    if (!items) return null;
    const item = Array.isArray(items) ? items[0] : items;

    return {
      bldNm: item.bldNm,
      mainPurpsCdNm: item.mainPurpsCdNm,
      strctCdNm: item.strctCdNm,
      grndFlrCnt: Number(item.grndFlrCnt),
      ugrndFlrCnt: Number(item.ugrndFlrCnt),
      platArea: Number(item.platArea),
      archArea: Number(item.archArea),
    };
  } catch (error) {
    return null;
  }
};

/**
 * 전유공용면적 조회 (호실 목록 추출용)
 */
export const fetchBuildingExposArea = async (
  sigunguCd: string,
  bjdongCd: string,
  bun: string,
  ji: string
): Promise<Room[]> => {
  try {
    const response = await api.get('/getBrExposPubuseAreaInfo', {
      params: { sigunguCd, bjdongCd, bun: bun.padStart(4, '0'), ji: ji.padStart(4, '0') },
    });
    const items = response.data?.response?.body?.items?.item;
    if (!items) return [];

    const itemList = Array.isArray(items) ? items : [items];

    // 전유부만 필터링
    return itemList
      .filter((item: any) => item.exposPubuseGbCd === '1') // 1: 전유
      .map((item: any) => ({
        id: `${item.flrNo}_${item.hoNm}`,
        floor: Number(item.flrNo),
        hoNm: item.hoNm,
        area: Number(item.area || 0),
        commonArea: 0, // 나중에 합산
        totalArea: Number(item.area || 0),
        mainPurpsCdNm: item.mainPurpsCdNm || "",
        salePrice: 0,
        deposit: 0,
        monthlyRent: 0,
        occupancyStatus: 'unknown',
      }));
  } catch (error) {
    return [];
  }
};

/**
 * 모든 건물 데이터 종합 조회
 */
export const fetchAllBuildingData = async (
  sigunguCd: string,
  bjdongCd: string,
  bun: string,
  ji: string
) => {
  const [summary, title, rooms] = await Promise.all([
    fetchBuildingGeneral(sigunguCd, bjdongCd, bun, ji),
    fetchBuildingTitle(sigunguCd, bjdongCd, bun, ji),
    fetchBuildingExposArea(sigunguCd, bjdongCd, bun, ji),
  ]);

  if (!summary && !title) throw new Error("건축물대장 정보를 찾을 수 없습니다.");

  const mergedSummary = { ...title, ...summary } as BuildingSummary;

  return {
    summary: mergedSummary,
    rooms,
  };
};
