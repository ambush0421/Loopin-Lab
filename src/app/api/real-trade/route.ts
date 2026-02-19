export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// 보안: API 키는 환경 변수에서만 로드
const API_KEY = process.env.BUILDING_API_KEY;

// 상업용 부동산 매매 실거래가 API
const COMMERCIAL_TRADE_URL = 'https://apis.data.go.kr/1613000/RTMSDataSvcNrgTrade/getRTMSDataSvcNrgTrade';

// 오피스텔 매매 실거래가 API  
const OFFICETEL_TRADE_URL = 'https://apis.data.go.kr/1613000/RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade';

// 오피스텔 전월세 실거래가 API
const OFFICETEL_RENT_URL = 'https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent';

type ApiResponse = {
    response?: {
        body?: {
            items?: {
                item?: unknown[] | unknown;
            };
        };
    };
};

type TradeItem = Record<string, unknown>;

type TradeStats = {
    count: number;
    avgPricePerPyung: number;
    minPricePerPyung: number;
    maxPricePerPyung: number;
    recentTrades: Array<{
        price: number;
        area: number;
        pyung: number;
        pricePerPyung: number;
        floor: string;
        dealYear: string;
        dealMonth: string;
        dealDay: string;
    }>;
} | null;

type RentStats = {
    count: number;
    avgDepositPerPyung: number;
    avgMonthlyPerPyung: number;
    recentRents: Array<{
        deposit: number;
        monthly: number;
        area: number;
        pyung: number;
        depositPerPyung: number;
        monthlyPerPyung: number;
        floor: string;
        dealYear: string;
        dealMonth: string;
    }>;
} | null;

type StatsResult = TradeStats | RentStats;

// 입력값 검증
function validateParam(value: string | null, maxLength: number = 10): string {
    if (!value) return '';
    return value.replace(/[^0-9]/g, '').substring(0, maxLength);
}

function toItems(value: unknown): TradeItem[] {
    if (Array.isArray(value)) {
        return value.filter((item): item is TradeItem => !!item && typeof item === 'object');
    }
    if (value && typeof value === 'object') {
        return [value as TradeItem];
    }
    return [];
}

function toText(value: unknown): string {
    return String(value ?? '').trim();
}

function toNumber(value: unknown): number {
    const normalized = String(value ?? '').replace(/,/g, '').trim();
    if (!normalized) return 0;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

// API 호출 함수
async function fetchTradeData(url: string, params: Record<string, string>): Promise<ApiResponse> {
    if (!API_KEY) throw new Error('API_CONFIG_ERROR');

    const serviceKey = encodeURIComponent(API_KEY);
    const queryParams = [
        `serviceKey=${serviceKey}`,
        ...Object.entries(params).map(([k, v]) => `${k}=${v}`),
        `numOfRows=100`,
        `pageNo=1`,
        `_type=json`
    ].join('&');

    const response = await fetch(`${url}?${queryParams}`, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
    });

    const rawData = await response.text();

    if (rawData.includes('SERVICE_KEY_IS_NOT_REGISTERED')) {
        throw new Error('API_AUTH_ERROR');
    }

    if (rawData.trim().startsWith('<')) {
        // XML 응답인 경우 - 에러일 가능성 높음
        if (rawData.includes('SERVICE ERROR')) {
            throw new Error('API_SERVICE_ERROR');
        }
        throw new Error('XML_RESPONSE');
    }

    const parsed: unknown = JSON.parse(rawData);
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('INVALID_JSON');
    }

    return parsed as ApiResponse;
}

// 최근 12개월 거래 데이터 조회
async function fetchRecentTrades(
    lawdCd: string,
    apiUrl: string,
    buildingName?: string,
    dong?: string
): Promise<TradeItem[]> {
    const now = new Date();

    // 최근 12개월 날짜 생성
    const months = Array.from({ length: 12 }, (_, i) => {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return `${targetDate.getFullYear()}${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    });

    // 병렬로 데이터 조회 (Promise.all)
    const results = await Promise.all(
        months.map(async (dealYmd) => {
            try {
                const data = await fetchTradeData(apiUrl, { LAWD_CD: lawdCd, DEAL_YMD: dealYmd });
                let items = toItems(data.response?.body?.items?.item);

                // 통합 필터 (상업/오피스텔 공통 키 대응)
                if (buildingName || dong) {
                    items = items.filter((item) => {
                        const itemDong = (toText(item.법정동) || toText(item.umdNm)).replace(/\s/g, '');
                        const itemName = (toText(item.건물명) || toText(item.offiNm)).replace(/\s/g, '');

                        const matchDong = !dong || itemDong.includes(dong.replace(/\s/g, ''));
                        const matchName = !buildingName || itemName.includes(buildingName.replace(/\s/g, ''));

                        // buildingName이 있으면 해당 건물 우선, 없으면 동 전체
                        return buildingName ? (matchName || matchDong) : matchDong;
                    });
                }

                return items;
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'UNKNOWN';
                logger.warn({ event: 'api.real_trade.month_error', dealYmd, error: message });
                return []; // 실패 시 빈 배열 반환 (전체 실패 방지)
            }
        })
    );

    // 결과 병합 (flat)
    return results.flat();
}

export async function GET(request: NextRequest) {
    if (!API_KEY) {
        logger.error({ event: 'api.real_trade.config_error', message: 'API key not configured' });
        return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);

    // 법정동 코드 앞 5자리 (시군구)
    const lawdCd = validateParam(searchParams.get('lawdCd'), 5);
    const buildingType = searchParams.get('type') || 'commercial'; // commercial, officetel
    const buildingName = searchParams.get('buildingName') || '';
    const dong = searchParams.get('dong') || '';

    if (!lawdCd) {
        return NextResponse.json({ error: '법정동 코드 누락' }, { status: 400 });
    }

    logger.info({ event: 'api.real_trade.request', params: { lawdCd, buildingType, buildingName } });

    try {
        let tradeData: TradeItem[] = [];
        let rentData: TradeItem[] = [];

        if (buildingType === 'officetel') {
            // 오피스텔 매매 + 전월세
            [tradeData, rentData] = await Promise.all([
                fetchRecentTrades(lawdCd, OFFICETEL_TRADE_URL, buildingName, dong),
                fetchRecentTrades(lawdCd, OFFICETEL_RENT_URL, buildingName, dong)
            ]);
        } else {
            // 상업용 부동산 매매
            tradeData = await fetchRecentTrades(lawdCd, COMMERCIAL_TRADE_URL, buildingName, dong);
        }

        // 가격 통계 계산
        const tradeStats = calculateStats(tradeData, 'trade');
        const rentStats = calculateStats(rentData, 'rent');

        logger.info({
            event: 'api.real_trade.success',
            tradeCount: tradeData.length,
            rentCount: rentData.length
        });

        return NextResponse.json({
            success: true,
            data: {
                trades: tradeData.slice(0, 20), // 최근 20건
                rents: rentData.slice(0, 20),
                stats: {
                    trade: tradeStats,
                    rent: rentStats
                }
            }
        }, {
            headers: {
                'X-Content-Type-Options': 'nosniff',
                'Cache-Control': 'private, max-age=3600', // 1시간 캐시
            }
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'UNKNOWN';
        logger.error({ event: 'api.real_trade.fatal_error', message });

        if (message === 'API_AUTH_ERROR' || message === 'API_CONFIG_ERROR') {
            return NextResponse.json({ error: '인증 오류' }, { status: 401 });
        }

        return NextResponse.json({ error: '실거래가 조회 실패' }, { status: 500 });
    }
}

// 통계 계산 함수
function calculateStats(items: TradeItem[], type: 'trade' | 'rent'): StatsResult {
    if (!items || items.length === 0) return null;

    if (type === 'trade') {
        const prices = items
            .map((item) => {
                // 한글/영문 키 모두 대응
                const rawPrice = item.거래금액 || item.dealAmount;
                const rawArea = item.전용면적 || item.excluUseAr;
                const floor = item.층 || item.floor;
                const year = item.년 || item.dealYear;
                const month = item.월 || item.dealMonth;
                const day = item.일 || item.dealDay;

                if (!rawPrice || !rawArea) return null;

                const price = toNumber(rawPrice);
                const area = toNumber(rawArea);
                const pyung = area * 0.3025;

                return {
                    price,
                    area,
                    pyung,
                    pricePerPyung: price / pyung,
                    floor: String(floor),
                    dealYear: String(year),
                    dealMonth: String(month),
                    dealDay: String(day)
                };
            })
            .filter((value): value is {
                price: number;
                area: number;
                pyung: number;
                pricePerPyung: number;
                floor: string;
                dealYear: string;
                dealMonth: string;
                dealDay: string;
            } => value !== null);

        if (prices.length === 0) return null;

        const avgPricePerPyung = prices.reduce((sum, p) => sum + p.pricePerPyung, 0) / prices.length;
        return {
            count: prices.length,
            avgPricePerPyung: Math.round(avgPricePerPyung),
            minPricePerPyung: Math.round(Math.min(...prices.map(p => p.pricePerPyung))),
            maxPricePerPyung: Math.round(Math.max(...prices.map(p => p.pricePerPyung))),
            recentTrades: prices.slice(0, 5)
        };
    } else {
        const rents = items
            .map((item) => {
                const deposit = toNumber(item.보증금액 || item.보증금 || item.deposit || 0);
                const monthly = toNumber(item.월세금액 || item.월세 || item.monthlyRent || 0);
                const area = toNumber(item.전용면적 || item.excluUseAr || 0);
                const pyung = area * 0.3025;

                if (pyung <= 0) return null;

                return {
                    deposit,
                    monthly,
                    area,
                    pyung,
                    depositPerPyung: deposit / pyung,
                    monthlyPerPyung: monthly / pyung,
                    floor: String(item.층 || item.floor),
                    dealYear: String(item.년 || item.dealYear),
                    dealMonth: String(item.월 || item.dealMonth)
                };
            })
            .filter((value): value is {
                deposit: number;
                monthly: number;
                area: number;
                pyung: number;
                depositPerPyung: number;
                monthlyPerPyung: number;
                floor: string;
                dealYear: string;
                dealMonth: string;
            } => value !== null);

        if (rents.length === 0) return null;

        return {
            count: rents.length,
            avgDepositPerPyung: Math.round(rents.reduce((sum, r) => sum + r.depositPerPyung, 0) / rents.length),
            avgMonthlyPerPyung: Math.round(rents.reduce((sum, r) => sum + r.monthlyPerPyung, 0) / rents.length),
            recentRents: rents.slice(0, 5)
        };
    }
}
