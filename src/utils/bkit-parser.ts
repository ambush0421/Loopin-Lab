import { BkitTitleRaw, BkitUnitRaw } from '../types/building';

/**
 * bkit 에이전트 유틸리티
 * 
 * 공공데이터포털(건축물대장 등)에서 내려오는 String 형태의 숫자값들을
 * Number로 안전하게 파싱하고 예외 상황을 처리합니다.
 */

export const parseNumber = (value: string | number | undefined | null): number => {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
};

export const bkitTitleParser = (raw: BkitTitleRaw) => {
    return {
        ...raw,
        grndFlrCnt: parseNumber(raw.grndFlrCnt),
        ugrndFlrCnt: parseNumber(raw.ugrndFlrCnt),
        totArea: parseNumber(raw.totArea),
        archArea: parseNumber(raw.archArea),
        platArea: parseNumber(raw.platArea),
        bcRat: parseNumber(raw.bcRat),
        vlRat: parseNumber(raw.vlRat),
        totPkngCnt: parseNumber(raw.totPkngCnt),
        rideUseElvtCnt: parseNumber(raw.rideUseElvtCnt),
        emgenUseElvtCnt: parseNumber(raw.emgenUseElvtCnt),
        hhldCnt: parseNumber(raw.hhldCnt),
        fmlyCnt: parseNumber(raw.fmlyCnt),
    };
};

export const bkitUnitParser = (raw: BkitUnitRaw) => {
    return {
        ...raw,
        flrNo: parseNumber(raw.flrNo),
        area: parseNumber(raw.area),
    };
};
