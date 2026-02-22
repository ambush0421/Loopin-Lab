import axios from 'axios';
import { NearbyTransaction } from '@/types/transaction';

const SERVICE_KEY = process.env.NEXT_PUBLIC_VITE_DATA_GO_KR_API_KEY;

const api = axios.create({
  baseURL: 'http://apis.data.go.kr/1613000',
  params: {
    serviceKey: SERVICE_KEY,
    _type: 'json',
    numOfRows: 100,
  },
});

/**
 * 상업업무용 매매 실거래가 조회
 */
export const fetchCommercialSaleTransactions = async (
  regionCode: string,
  dealYearMonth: string
): Promise<NearbyTransaction[]> => {
  try {
    const response = await api.get('/RTMSDataSvcNrgTrade/getRTMSDataSvcNrgTrade', {
      params: { LAWD_CD: regionCode, DEAL_YMD: dealYearMonth },
    });

    const items = response.data?.response?.body?.items?.item;
    if (!items) return [];

    const itemList = Array.isArray(items) ? items : [items];

    return itemList.map((item: any) => ({
      dealDate: `${item.dealYear}.${item.dealMonth}`,
      dealAmount: parseInt(item.dealAmount.replace(/,/g, ''), 10),
      areaForExclUse: Number(item.areaForExclUse),
      floor: item.floor,
      buildingName: item.buildingName,
      dealType: 'sale',
      pricePerSqm: Math.round(parseInt(item.dealAmount.replace(/,/g, ''), 10) / Number(item.areaForExclUse)),
    }));
  } catch (error) {
    return [];
  }
};

/**
 * 상업업무용 전월세 실거래가 조회
 */
export const fetchCommercialRentTransactions = async (
  regionCode: string,
  dealYearMonth: string
): Promise<NearbyTransaction[]> => {
  try {
    const response = await api.get('/RTMSDataSvcNrgRent/getRTMSDataSvcNrgRent', {
      params: { LAWD_CD: regionCode, DEAL_YMD: dealYearMonth },
    });

    const items = response.data?.response?.body?.items?.item;
    if (!items) return [];

    const itemList = Array.isArray(items) ? items : [items];

    return itemList.map((item: any) => ({
      dealDate: `${item.dealYear}.${item.dealMonth}`,
      dealAmount: 0, // 임대는 보증금/월세 위주
      deposit: parseInt(item.deposit.replace(/,/g, ''), 10),
      monthlyRent: parseInt(item.monthlyRent.replace(/,/g, ''), 10),
      areaForExclUse: Number(item.areaForExclUse),
      floor: item.floor,
      buildingName: item.buildingName,
      dealType: 'rent',
    }));
  } catch (error) {
    return [];
  }
};

/**
 * 최근 n개월 실거래가 종합 조회
 */
export const fetchRecentTransactions = async (
  regionCode: string,
  months: number = 3
): Promise<NearbyTransaction[]> => {
  const transactions: NearbyTransaction[] = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;

    const [sales, rents] = await Promise.all([
      fetchCommercialSaleTransactions(regionCode, yyyymm),
      fetchCommercialRentTransactions(regionCode, yyyymm),
    ]);

    transactions.push(...sales, ...rents);

    // API 호출 지연 (Rate limit 방지)
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return transactions.sort((a, b) => b.dealDate.localeCompare(a.dealDate));
};
