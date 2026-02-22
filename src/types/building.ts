/**
 * 건축물대장 총괄표제부에서 가져오는 데이터
 */
export interface BuildingSummary {
  bldNm: string; // 건물명
  platPlc: string; // 대지위치 (지번주소)
  newPlatPlc: string; // 새주소 (도로명주소)
  useAprDay: string; // 사용승인일 (YYYYMMDD)
  mainPurpsCdNm: string; // 주용도명
  etcPurps: string; // 기타용도
  strctCdNm: string; // 구조명
  grndFlrCnt: number; // 지상층수
  ugrndFlrCnt: number; // 지하층수
  totArea: number; // 연면적 (㎡)
  archArea: number; // 건축면적 (㎡)
  platArea: number; // 대지면적 (㎡)
  bcRat: number; // 건폐율 (%)
  vlRat: number; // 용적률 (%)
  totPkngCnt: number; // 총주차대수
  rideUseElvtCnt: number; // 승객용 승강기 수
  emgenUseElvtCnt: number; // 비상용 승강기 수
  hhldCnt: number; // 세대수
  fmlyCnt: number; // 가구수
  engyEffcGradCd: string; // 에너지효율등급
}

/**
 * 공공데이터포털 건축물대장 표제부 (Title) Raw API Type
 */
export interface BkitTitleRaw {
  bldNm?: string;
  platPlc?: string;
  newPlatPlc?: string;
  useAprDay?: string;
  mainPurpsCdNm?: string;
  etcPurps?: string;
  strctCdNm?: string;
  grndFlrCnt?: number | string;
  ugrndFlrCnt?: number | string;
  totArea?: number | string;
  archArea?: number | string;
  platArea?: number | string;
  bcRat?: number | string;
  vlRat?: number | string;
  totPkngCnt?: number | string;
  rideUseElvtCnt?: number | string;
  emgenUseElvtCnt?: number | string;
  hhldCnt?: number | string;
  fmlyCnt?: number | string;
}

/**
 * 공공데이터포털 건축물대장 전유부 (Exclusive Unit) Raw API Type
 */
export interface BkitUnitRaw {
  dongNm?: string;     // 동명칭
  hoNm?: string;       // 호명칭
  flrNo?: number | string; // 층번호
  flrNoNm?: string;    // 층명칭
  area?: number | string;  // 전유면적
  mainPurpsCdNm?: string; // 용도명
}

/**
 * 건물 나이 분석
 */
export interface BuildingAge {
  years: number; // 경과 년수
  condition: 'new' | 'good' | 'aging' | 'old'; // 상태 분류
  conditionLabel: string; // "신축", "양호" 등
}

/**
 * 통합 건물 정보
 */
export interface BuildingInfo extends BuildingSummary {
  buildingAge: BuildingAge;
  totalElevatorCnt: number; // rideUseElvtCnt + emgenUseElvtCnt
}
