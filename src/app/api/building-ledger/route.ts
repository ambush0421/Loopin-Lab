export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BASE_URL = 'https://apis.data.go.kr/1613000/BldRgstHubService';

function getApiKey() {
    return process.env.BUILDING_API_KEY || '';
}

async function fetchFromApi(endpoint: string, params: Record<string, string>) {
    const key = getApiKey();
    if (!key) throw new Error('API Key is missing');

    const searchParams = new URLSearchParams({
        serviceKey: key,
        _type: 'json',
        numOfRows: '9999',
        ...params
    });

    const url = `${BASE_URL}${endpoint}?${searchParams.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`API fetch failed: ${res.statusText}`);
    }
    return res.json();
}

/** 총괄표제부 조회 */
async function fetchBuildingGeneral(sigunguCd: string, bjdongCd: string, bun: string, ji: string) {
    try {
        const data = await fetchFromApi('/getBrRecapTitleInfo', { sigunguCd, bjdongCd, bun: bun.padStart(4, '0'), ji: ji.padStart(4, '0') });
        const items = data?.response?.body?.items?.item;
        if (!items) return null;
        const item = Array.isArray(items) ? items[0] : items;

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
    } catch { return null; }
}

/** 표제부 조회 */
async function fetchBuildingTitle(sigunguCd: string, bjdongCd: string, bun: string, ji: string) {
    try {
        const data = await fetchFromApi('/getBrTitleInfo', { sigunguCd, bjdongCd, bun: bun.padStart(4, '0'), ji: ji.padStart(4, '0') });
        const items = data?.response?.body?.items?.item;
        if (!items) return null;
        const item = Array.isArray(items) ? items[0] : items;

        return {
            bldNm: item.bldNm,
            mainPurpsCdNm: item.mainPurpsCdNm,
            strctCdNm: item.strctCdNm,
            grndFlrCnt: Number(item.grndFlrCnt || 0),
            ugrndFlrCnt: Number(item.ugrndFlrCnt || 0),
            platArea: Number(item.platArea || 0),
            archArea: Number(item.archArea || 0),
        };
    } catch { return null; }
}

/** 전유부 조회 */
async function fetchBuildingExposArea(sigunguCd: string, bjdongCd: string, bun: string, ji: string) {
    try {
        const data = await fetchFromApi('/getBrExposPubuseAreaInfo', { sigunguCd, bjdongCd, bun: bun.padStart(4, '0'), ji: ji.padStart(4, '0') });
        const items = data?.response?.body?.items?.item;
        if (!items) return [];

        const itemList = Array.isArray(items) ? items : [items];

        return itemList
            .filter((item: any) => item.exposPubuseGbCd === '1') // 1: 전유
            .map((item: any) => ({
                id: `${item.flrNo}_${item.hoNm}`,
                floor: Number(item.flrNo || 0),
                hoNm: item.hoNm || '호실명 없음',
                area: Number(item.area || 0),
                commonArea: 0,
                totalArea: Number(item.area || 0),
                mainPurpsCdNm: item.mainPurpsCdNm || "",
                salePrice: 0,
                deposit: 0,
                monthlyRent: 0,
                occupancyStatus: 'unknown',
            }));
    } catch { return []; }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sigunguCd = searchParams.get('sigunguCd');
    const bjdongCd = searchParams.get('bjdongCd');
    const bun = searchParams.get('bun') || '0000';
    const ji = searchParams.get('ji') || '0000';

    if (!sigunguCd || !bjdongCd) {
        return NextResponse.json({ success: false, error: '시군구코드와 법정동코드는 필수입니다.' }, { status: 400 });
    }

    try {
        const [summary, title, rooms] = await Promise.all([
            fetchBuildingGeneral(sigunguCd, bjdongCd, bun, ji),
            fetchBuildingTitle(sigunguCd, bjdongCd, bun, ji),
            fetchBuildingExposArea(sigunguCd, bjdongCd, bun, ji)
        ]);

        if (!summary && !title) {
            return NextResponse.json({ success: false, error: '건축물대장 정보를 찾을 수 없습니다.' });
        }

        const mergedSummary = { ...title, ...summary };

        return NextResponse.json({
            success: true,
            data: {
                summary: mergedSummary,
                rooms: rooms
            }
        });
    } catch (error: any) {
        logger.error({ event: 'building_ledger.error', message: error.message });
        return NextResponse.json({ success: false, error: '서버 내부 오류 발생' }, { status: 500 });
    }
}
