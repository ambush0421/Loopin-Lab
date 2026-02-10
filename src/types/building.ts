export interface BuildingReport {
  // 기본 정보
  bldNm: string;                // 건물명
  platAddr: string;             // 대지위치
  
  // 핵심 지표
  vlrtBldRgstYn: 'Y' | 'N';     // 위반건축물여부
  platArea: number;             // 대지면적 (m2)
  totArea: number;              // 연면적 (m2)
  bcRat: number;                // 건폐율 (%)
  vlrat: number;                // 용적률 (%)
  
  // 건축 상세
  mainPurpsCdNm: string;        // 주용도
  strctCdNm: string;            // 구조
  indrMechUtcnt: number;        // 주차장 정보
  
  // 추가 정보
  useAprvDay: string;           // 사용승인일
  grndFlrCnt: number;           // 지상층수
  ugndFlrCnt: number;           // 지하층수

  // v2 확장 데이터
  landInfo?: LandInfo;
  priceHistory?: PriceHistory[];
}

export interface LandInfo {
  lndpclAr: number;             // 대지면적
  lndMsclCdNm: string;          // 지목
  pannPrc: number;              // 공시지가
}

export interface PriceHistory {
  year: string;
  price: number;
}

export interface AddressInfo {
  sigunguCd: string;
  bjdongCd: string;
  platGbCd: string;
  bun: string;
  ji: string;
  address: string;
}