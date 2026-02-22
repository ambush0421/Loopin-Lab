import { BkitTitleRaw, BkitUnitRaw } from '../types/building';

export const mockBkitTitleResponse: BkitTitleRaw[] = [
    {
        bldNm: '에이플러스타워',
        platPlc: '서울특별시 강남구 테헤란로 123',
        newPlatPlc: '서울특별시 강남구 테헤란로 123',
        useAprDay: '20100512',
        mainPurpsCdNm: '업무시설',
        etcPurps: '근린생활시설',
        strctCdNm: '철근콘크리트구조',
        grndFlrCnt: '15',
        ugrndFlrCnt: '5',
        totArea: '15000.5',
        archArea: '1000.2',
        platArea: '2000.0',
        bcRat: '50.01',
        vlRat: '750.02',
        totPkngCnt: '150',
        rideUseElvtCnt: '3',
        emgenUseElvtCnt: '1',
        hhldCnt: '0',
        fmlyCnt: '0',
    }
];

// 예외 케이스: 총괄표제부가 없거나 값이 일부 누락된 경우
export const mockBkitTitleMissingData: BkitTitleRaw[] = [
    {
        bldNm: '오래된 상가',
        platPlc: '서울특별시 종로구 종로 1',
        newPlatPlc: '서울특별시 종로구 종로 1',
        mainPurpsCdNm: '제2종근린생활시설',
        // grndFlrCnt 등 숫자값이 누락되거나 빈 문자열인 경우
        grndFlrCnt: '',
        ugrndFlrCnt: undefined,
    }
];

export const mockBkitUnitResponse: BkitUnitRaw[] = [
    {
        dongNm: 'A동',
        hoNm: '101호',
        flrNo: '1',
        flrNoNm: '지상 1층',
        area: '150.5',
        mainPurpsCdNm: '소매점',
    },
    {
        dongNm: 'A동',
        hoNm: '102호',
        flrNo: '1',
        flrNoNm: '지상 1층',
        area: '120.0',
        mainPurpsCdNm: '소매점',
    },
    {
        dongNm: 'A동',
        hoNm: '201호',
        flrNo: '2',
        flrNoNm: '지상 2층',
        area: '300.0',
        mainPurpsCdNm: '사무소',
    }
];
