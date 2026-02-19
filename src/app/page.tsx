'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Script from 'next/script';
import { SelectionPage } from '@/components/dashboard/SelectionPage';
import { type TopMetricsData } from '@/components/dashboard/TopMetrics';
import { QuotationModal } from '@/components/dashboard/QuotationModal';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingStats } from '@/components/landing/LandingStats';
import { LandingValueUp } from '@/components/landing/LandingValueUp';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';
import { LandingTestimonials } from '@/components/landing/LandingTestimonials';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingCTA } from '@/components/landing/LandingCTA';
import { StepIndicator } from '@/components/landing/StepIndicator';
import { Search, Building2, X, AlertTriangle } from 'lucide-react';

type SearchParamsState = {
  sigunguCd: string;
  bjdongCd: string;
  bun: string;
  ji: string;
};

interface DaumPostcodeData {
  address: string;
  roadAddress: string;
  jibunAddress: string;
  bjdongCode?: string;
  bcode: string;
  buildingCode: string;
  autoJibunAddress?: string;
  sigunguCode?: string;
}

interface DaumPostcodeInstance {
  embed: (container: HTMLElement, options?: { q?: string; autoClose?: boolean }) => void;
  open: () => void;
}

interface DaumPostcodeOptions {
  oncomplete: (data: DaumPostcodeData) => void;
  onclose?: () => void;
  width?: string;
  height?: string;
}

interface DaumNamespace {
  Postcode: new (options: DaumPostcodeOptions) => DaumPostcodeInstance;
}

type BuildingData = TopMetricsData & Record<string, unknown> & { bldNm?: string };
type UnitRow = Record<string, unknown> & {
  _uid: string;
  dongNm?: string;
  flrNo: string | number;
  flrGbCd?: string;          // 층구분코드 (10=지하, 20=지상)
  hoNm: string;
  area: string | number;
  commonArea?: string | number; // 공용면적 합산
  contractArea?: string | number; // 계약면적 (전용+공용)
  exposPubuseGbCd?: string;  // 전유/공용 구분코드 (1=전유, 2=공용)
  etcPurps?: string;
  mainPurpsCdNm?: string;
};
type TransactionMarker = {
  lat: number;
  lng: number;
  price: string;
  date: string;
};
type MarketTrend = { month: string; price: number };
type MarketComparison = {
  avgPricePerSqm?: number;
  recentTradeCount?: number;
  trendLabel?: string;
  [key: string]: unknown;
};
type MarketPriceData = {
  transactions?: TransactionMarker[];
  trends?: MarketTrend[];
  comparison?: MarketComparison;
  totalCount?: number;
};

interface FetchErrorResult {
  _error: string;
  _status: number;
}

function isFetchErrorResult(value: unknown): value is FetchErrorResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_error' in value &&
    typeof (value as { _error?: unknown })._error === 'string'
  );
}

declare global {
  interface Window {
    daum?: DaumNamespace;
  }
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BuildingData | null>(null);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [marketPrice, setMarketPrice] = useState<MarketPriceData | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number, lng: number } | undefined>(undefined);
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const [params, setParams] = useState<SearchParamsState>({
    sigunguCd: '',
    bjdongCd: '',
    bun: '',
    ji: ''
  });
  const [addressInput, setAddressInput] = useState('');
  const [showPostcode, setShowPostcode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [daumReady, setDaumReady] = useState(false);
  const toApiUrl = useCallback((path: string) => {
    if (typeof window === 'undefined') return path;
    return new URL(path, window.location.origin).toString();
  }, []);

  // 주소 선택 후 fetch를 트리거하기 위한 상태
  const [pendingSearch, setPendingSearch] = useState<{
    params: SearchParamsState;
    address: string;
  } | null>(null);

  const postcodeRef = useRef<HTMLDivElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // 선택된 호실 객체 리스트 계산
  const selectedUnits = useMemo(() => {
    return units.filter(u => selectedIds.has(u._uid));
  }, [units, selectedIds]);

  // ====================================================
  // pendingSearch가 설정되면 useEffect에서 fetch 실행
  // (iframe oncomplete 콜백 컨텍스트가 아닌, 
  //  React 렌더 사이클의 메인 window 컨텍스트에서 실행)
  // ====================================================
  useEffect(() => {
    if (!pendingSearch) return;
    const { params: p, address: a } = pendingSearch;
    setPendingSearch(null);  // 한 번만 실행
    fetchAllData(p, a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSearch]);

  // Daum Postcode oncomplete 핸들러
  const handlePostcodeComplete = useCallback(async (postcodeData: DaumPostcodeData) => {
    setShowPostcode(false);

    const fullAddress = postcodeData.address;
    const fullBjdongCode = postcodeData.bjdongCode || postcodeData.bcode || '';
    const bjdongCd = fullBjdongCode.length >= 10 ? fullBjdongCode.substring(5) : '';

    const jibun = postcodeData.jibunAddress || postcodeData.autoJibunAddress || postcodeData.address;
    let bun = '';
    let ji = '0000';

    const match = jibun.match(/(\d+)(?:-?(\d+))?(?:\s*번지?)?\s*$/);
    if (match) {
      bun = match[1].padStart(4, '0');
      ji = match[2] ? match[2].padStart(4, '0') : '0000';
    }

    const newParams = {
      sigunguCd: postcodeData.sigunguCode || '',
      bjdongCd,
      bun,
      ji
    };

    setAddress(fullAddress);
    setAddressInput(fullAddress);
    setParams(newParams);
    setSelectedIds(new Set());
    setErrorMsg(null);
    setCoords(undefined);

    // 좌표는 조회와 병렬 처리해 지도 표시를 지연시키지 않도록 즉시 지도 데이터 조회를 시작
    void (async () => {
      try {
        const geocodeRes = await fetch(
          toApiUrl(`/api/geocode?address=${encodeURIComponent(fullAddress)}`),
          {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
            redirect: 'error',
          }
        );
        if (!geocodeRes.ok) return;

        const geocodeData = await geocodeRes.json();
        if (geocodeData.lat && geocodeData.lng) {
          setCoords({ lat: geocodeData.lat, lng: geocodeData.lng });
        }
      } catch {
        // 좌표 조회 실패 시 지도는 기본 좌표로 렌더링되며, 검색 결과는 계속 진행됩니다.
      }
    })();

    // fetch를 직접 호출하지 않고, 상태를 설정하여 useEffect에서 트리거
    setPendingSearch({ params: newParams, address: fullAddress });
  }, [toApiUrl]);

  // embed 모드로 Daum Postcode 열기
  const openPostcodeEmbed = useCallback((query?: string) => {
    if (!daumReady || !window.daum?.Postcode) {
      setErrorMsg('주소 검색 서비스를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    const DaumPostcode = window.daum?.Postcode;
    if (!DaumPostcode) {
      setErrorMsg('주소 검색 서비스를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setShowPostcode(true);
    setTimeout(() => {
      if (postcodeRef.current) {
        postcodeRef.current.innerHTML = '';
        new DaumPostcode({
          oncomplete: handlePostcodeComplete,
          onclose: () => setShowPostcode(false),
          width: '100%',
          height: '100%',
        }).embed(postcodeRef.current, { q: query || '', autoClose: false });
      }
    }, 50);
  }, [daumReady, handlePostcodeComplete]);

  // 외부 클릭 시 postcode 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setShowPostcode(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ====================================================
  // fetchAllData - XMLHttpRequest 폴백 포함
  // ====================================================
  const fetchAllData = async (searchParams: SearchParamsState, fullAddress: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const query = new URLSearchParams(searchParams).toString();

      // 안전한 fetch (재시도 + XHR 폴백)
      const safeFetch = async (path: string, name: string): Promise<unknown> => {
        const url = toApiUrl(path);

        // 시도 1: 일반 fetch (타임아웃 + 재시도)
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            console.log(`[API] ${name} fetch 시도 ${attempt + 1}/3: ${url}`);

            const res = await fetch(url, {
              signal: controller.signal,
              headers: { 'Accept': 'application/json' },
              cache: 'no-store',
              redirect: 'error',
            });
            clearTimeout(timeoutId);

            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const json = await res.json();
              if (!res.ok) {
                return { _error: json.error || `${name} 조회 실패 (${res.status})`, _status: res.status };
              }
              return json;
            }
            const text = await res.text();
            console.warn(`[API] ${name}: non-JSON (status=${res.status})`, text.substring(0, 200));
            return { _error: `서버가 잘못된 응답 반환 (status=${res.status})`, _status: res.status };
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            const isRedirectError = message.toLowerCase().includes('redirect');
            if (isRedirectError) {
              return { _error: `${name} redirect loop detected. Please refresh and try again.`, _status: 310 };
            }
            console.warn(`[API] ${name} fetch 실패 (시도 ${attempt + 1}):`, message);
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
              continue;
            }
          }
        }

        // 시도 2: XMLHttpRequest 폴백 (fetch가 완전히 실패한 경우)
        console.log(`[API] ${name} XHR 폴백 시도: ${url}`);
        return new Promise((resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.timeout = 30000;
          xhr.onload = () => {
            try {
              const json = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(json);
              } else {
                resolve({ _error: json.error || `${name} 조회 실패 (${xhr.status})`, _status: xhr.status });
              }
            } catch {
              resolve({ _error: `${name} 응답 파싱 실패`, _status: xhr.status });
            }
          };
          xhr.onerror = () => {
            console.error(`[API] ${name} XHR도 실패`);
            resolve({ _error: `${name} network error. Please refresh and try again.`, _status: 0 });
          };
          xhr.ontimeout = () => {
            resolve({ _error: `${name} 응답 시간 초과`, _status: 408 });
          };
          xhr.send();
        });
      };

      // 1단계: 건물 표제부 (필수)
      const titleResult = await safeFetch(`/api/building-report?${query}`, '건물 표제부');

      if (isFetchErrorResult(titleResult)) {
        setErrorMsg(titleResult._error);
        setData(null);
        return;
      }

      const titlePayload = titleResult as {
        items?: Array<{ raw?: unknown }>;
        response?: { body?: { items?: { item?: unknown } } };
      };

      const normalizedTitleItems = Array.isArray(titlePayload.items)
        ? titlePayload.items.map((item) => item?.raw ?? item)
        : [];

      const rawTitleItems =
        titlePayload.response?.body?.items?.item
        ?? normalizedTitleItems
        ?? [];

      const titleItems = Array.isArray(rawTitleItems) ? rawTitleItems : [rawTitleItems];
      const buildingData = titleItems[0] as BuildingData | undefined;

      if (!buildingData) {
        setErrorMsg('건축물대장 정보가 없습니다.');
        setData(null);
        return;
      }

      setData(buildingData);

      // 2단계: 호실/시세 정보 (선택) - 병렬 호출
      const [unitsResult, marketResult] = await Promise.all([
        safeFetch(`/api/building-units?${query}`, '호실 정보'),
        safeFetch(`/api/market-price?${query}`, '시세 정보')
      ]);

      setMarketPrice(isFetchErrorResult(marketResult) ? null : (marketResult as MarketPriceData));

      const unitsPayload = (!isFetchErrorResult(unitsResult) ? unitsResult : null) as
        | { response?: { body?: { items?: { item?: unknown } } } }
        | null;
      const rawUnits = unitsPayload?.response?.body?.items?.item || [];
      const unitList = Array.isArray(rawUnits) ? rawUnits : [rawUnits];

      // ── 전유/공용 면적 그룹핑 ──
      // API는 동/호별로 전유(코드 1) + 공용(코드 2) 행을 별도로 제공하는 구조
      // key를 동+호로 통일해서 전용/공용 합산값을 하나의 호실로 재조합
      type RawUnit = Record<string, unknown>;
      type GroupedUnit = {
        raw: RawUnit;
        dongNm: string;
        hoNm: string;
        flrNo: number;
        flrGbCd: string;
        hasExclusive: boolean;
        exclusiveArea: string;
        commonArea: string;
        etcPurps?: string;
        mainPurpsCdNm?: string;
      };

      const rawUnitsTyped: RawUnit[] = unitList.map(
        u => (typeof u === 'object' && u !== null ? u : {}) as RawUnit
      );

      const normalizeUnitText = (value: unknown): string => String(value ?? '').trim();
      const normalizeUnitNumber = (value: unknown): number => Number(value ?? 0) || 0;
      const SHARED_FACILITY_KEYWORDS = ['계단실', '기계실', '전기실'];
      const isSharedFacilityPurpose = (value: unknown): boolean => {
        const normalized = normalizeUnitText(value).replace(/\s+/g, '');
        if (!normalized) return false;
        return SHARED_FACILITY_KEYWORDS.some((keyword) => normalized.includes(keyword));
      };
      const pickPreferredPurpose = (currentRaw: unknown, candidateRaw: unknown): string => {
        const current = normalizeUnitText(currentRaw);
        const candidate = normalizeUnitText(candidateRaw);
        if (!candidate) return current;
        if (!current) return candidate;
        const currentShared = isSharedFacilityPurpose(current);
        const candidateShared = isSharedFacilityPurpose(candidate);
        if (currentShared && !candidateShared) return candidate;
        if (!currentShared && candidateShared) return current;
        return current.length >= candidate.length ? current : candidate;
      };
      const resolvePurpose = (etcRaw: unknown, mainRaw: unknown): string => {
        const etc = normalizeUnitText(etcRaw);
        const main = normalizeUnitText(mainRaw);
        if (!etc) return main;
        if (isSharedFacilityPurpose(etc) && main && !isSharedFacilityPurpose(main)) {
          return main;
        }
        return etc || main;
      };
      const getHoFloorCandidate = (hoNm: string): number | null => {
        const normalized = hoNm.replace(/\s+/g, '').replace(/호$/u, '');
        if (!normalized) return null;
        if (/^(B|지하)/iu.test(normalized)) return null;

        const baseToken = normalized.split('-')[0] ?? normalized;
        const digits = baseToken.replace(/\D/g, '');
        if (digits.length < 3) return null;

        const floorDigits = digits.slice(0, -2);
        const floor = Number(floorDigits);
        if (!Number.isFinite(floor) || floor <= 0) return null;
        return floor;
      };
      const normalizeUnitDecimal = (value: unknown): string => {
        const raw = String(value ?? '').replace(/,/g, '').trim();
        if (!raw) return '0';
        if (/^-?\d+(\.\d+)?$/.test(raw)) return raw;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed.toString() : '0';
      };
      const addDecimalStrings = (a: string, b: string): string => {
        const [aIntRaw, aFracRaw = ''] = a.split('.');
        const [bIntRaw, bFracRaw = ''] = b.split('.');
        const scale = Math.max(aFracRaw.length, bFracRaw.length);
        const base = BigInt(`1${'0'.repeat(scale)}`);
        const toScaled = (intRaw: string, fracRaw: string): bigint => {
          const isNegative = intRaw.startsWith('-');
          const unsignedInt = isNegative ? intRaw.slice(1) : intRaw;
          const scaledStr = `${unsignedInt || '0'}${fracRaw.padEnd(scale, '0')}`;
          const scaled = BigInt(scaledStr);
          return isNegative ? -scaled : scaled;
        };
        const sum = toScaled(aIntRaw, aFracRaw) + toScaled(bIntRaw, bFracRaw);
        if (scale === 0) return sum.toString();
        const zero = BigInt(0);
        const sign = sum < zero ? '-' : '';
        const abs = sum < zero ? -sum : sum;
        const intPart = (abs / base).toString();
        const fracPart = (abs % base).toString().padStart(scale, '0').replace(/0+$/, '');
        return fracPart ? `${sign}${intPart}.${fracPart}` : `${sign}${intPart}`;
      };
      const getGroupKey = (unit: RawUnit) => `${normalizeUnitText(unit.dongNm)}_${normalizeUnitText(unit.hoNm)}`;

      const groupedUnits = new Map<string, GroupedUnit>();

      rawUnitsTyped.forEach((unit) => {
        const key = getGroupKey(unit);
        const existing = groupedUnits.get(key) ?? {
          raw: unit,
          dongNm: normalizeUnitText(unit.dongNm),
          hoNm: normalizeUnitText(unit.hoNm) || '-',
          flrNo: normalizeUnitNumber(unit.flrNo),
          flrGbCd: normalizeUnitText(unit.flrGbCd),
          hasExclusive: false,
          exclusiveArea: '0',
          commonArea: '0',
          etcPurps: normalizeUnitText(unit.etcPurps),
          mainPurpsCdNm: normalizeUnitText(unit.mainPurpsCdNm),
        };

        const area = normalizeUnitDecimal(unit.area);
        const typeCode = normalizeUnitText(unit.exposPubuseGbCd);

        if (typeCode === '1') {
          existing.hasExclusive = true;
          existing.exclusiveArea = addDecimalStrings(existing.exclusiveArea, area);
        }
        if (typeCode === '2') {
          existing.commonArea = addDecimalStrings(existing.commonArea, area);
        }

        if (!existing.flrNo && unit.flrNo) {
          existing.flrNo = normalizeUnitNumber(unit.flrNo);
        }
        if (!existing.flrGbCd && unit.flrGbCd) {
          existing.flrGbCd = normalizeUnitText(unit.flrGbCd);
        }
        existing.etcPurps = pickPreferredPurpose(existing.etcPurps, unit.etcPurps);
        existing.mainPurpsCdNm = pickPreferredPurpose(existing.mainPurpsCdNm, unit.mainPurpsCdNm);

        groupedUnits.set(key, existing);
      });

      const processedUnits: UnitRow[] = Array.from(groupedUnits.values())
        .filter((unit) => unit.hasExclusive)
        .map((unit, idx) => {
          const rawFlrNo = unit.flrNo || 0;
          const flrGbCd = unit.flrGbCd;
          const hoFloorCandidate = getHoFloorCandidate(unit.hoNm);
          const shouldTreatAsGroundFloor =
            flrGbCd === '10'
            && rawFlrNo > 0
            && hoFloorCandidate !== null
            && hoFloorCandidate === rawFlrNo;
          const normalizedFlrGbCd = shouldTreatAsGroundFloor ? '20' : flrGbCd;
          const flrNo = normalizedFlrGbCd === '10' ? -rawFlrNo : rawFlrNo;
          const contractArea = addDecimalStrings(unit.exclusiveArea, unit.commonArea);
          const purpose = resolvePurpose(unit.etcPurps, unit.mainPurpsCdNm);
          return {
            ...unit.raw,
            flrNo,
            flrGbCd: normalizedFlrGbCd,
            hoNm: unit.hoNm,
            area: unit.exclusiveArea,
            commonArea: unit.commonArea,
            contractArea,
            etcPurps: purpose,
            mainPurpsCdNm: unit.mainPurpsCdNm,
            exposPubuseGbCd: '1',
            _uid: `${unit.dongNm}-${flrNo}-${unit.hoNm}-${String(unit.exclusiveArea)}-${String(purpose || unit.mainPurpsCdNm || '')}-${idx}`,
          };
        });

      setUnits(processedUnits);

      // 히스토리 저장 (params/address 포함 - 검색목록에서 재조회 가능하도록)
      type HistoryItem = {
        id: string;
        title: string;
        date: string;
        address: string;
        params: SearchParamsState;
      };
      const historyItem = {
        id: Date.now().toString(),
        title: buildingData.bldNm || fullAddress.split(' ').slice(0, 3).join(' '),
        date: new Date().toLocaleDateString(),
        address: fullAddress,
        params: searchParams,
      };
      const saved = localStorage.getItem('building_report_history');
      const history: HistoryItem[] = saved ? (JSON.parse(saved) as HistoryItem[]) : [];
      const updated = [historyItem, ...history.filter((h) => h.title !== historyItem.title)].slice(0, 10);
      localStorage.setItem('building_report_history', JSON.stringify(updated));
      // 사이드바에 변경 알림
      window.dispatchEvent(new Event('historyUpdated'));

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[fetchAllData] 오류:', error);
      setErrorMsg(`데이터 조회 오류: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // 랜딩 페이지 (데이터 없을 때)
  if (!data && !loading) {
    return (
      <>
        <Script
          src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log('[Daum] Postcode SDK 로드 완료');
            setDaumReady(true);
          }}
          onError={(e) => {
            console.error('[Daum] Postcode SDK 로드 실패:', e);
          }}
        />

        <div className="min-h-screen bg-slate-50 flex flex-col">
          {/* 내비게이션 바 */}
          <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-sm shadow-blue-500/20">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 leading-tight">
                    BuildingReportPro
                  </h1>
                  <p className="text-xs text-slate-500 -mt-0.5">매입 · 임차 견적 자동화</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Search className="w-4 h-4 text-blue-700" />
              </div>
            </div>
          </nav>

          {/* 스텝 인디케이터 */}
          <StepIndicator currentStep={1} />

          {/* 에러 배너 */}
          {errorMsg && (
            <div className="max-w-3xl mx-auto mt-4 px-4">
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium flex-1">{errorMsg}</p>
                <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 히어로 섹션 */}
          <div ref={searchWrapperRef}>
            <LandingHero
              addressInput={addressInput}
              setAddressInput={setAddressInput}
              onSearch={(query) => openPostcodeEmbed(query)}
              showPostcode={showPostcode}
              postcodeRef={postcodeRef}
              onClosePostcode={() => setShowPostcode(false)}
            />
          </div>

          {/* 주요 기능 */}
          <LandingFeatures />

          {/* 가치 강화 포인트 */}
          <LandingValueUp />

          {/* 실적 수치 */}
          <LandingStats />

          {/* 이용 방법 */}
          <LandingHowItWorks />

          {/* 고객 리뷰 */}
          <LandingTestimonials />

          {/* FAQ */}
          <LandingFAQ />

          {/* 최종 행동 유도 */}
          <LandingCTA onStartClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
              const input = document.querySelector('input[placeholder*="건물명"]') as HTMLInputElement;
              input?.focus();
            }, 500);
          }} />
        </div>
      </>
    );
  }

  // 대시보드 (데이터 있을 때) - SelectionPage UI
  return (
    <>
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[Daum] Postcode SDK 로드 완료');
          setDaumReady(true);
        }}
        onError={(e) => {
          console.error('[Daum] Postcode SDK 로드 실패:', e);
        }}
      />

      {loading ? (
        <div className="flex h-screen items-center justify-center bg-[#F7F9FC]">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xl font-black text-zinc-400 tracking-tight">공식 데이터를 분석하고 있습니다...</p>
          </div>
        </div>
      ) : (
        <SelectionPage
          buildingData={data}
          units={units}
          address={address}
          coords={coords}
          transactions={marketPrice?.transactions}
          trends={marketPrice?.trends}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onBack={() => {
            setData(null);
            setUnits([]);
            setAddress('');
            setSelectedIds(new Set());
            setIsQuotationOpen(false);
            setShowPostcode(false);
            setErrorMsg(null);
          }}
          onGenerateQuote={() => setIsQuotationOpen(true)}
          onSearch={() => openPostcodeEmbed(addressInput.trim() || undefined)}
          addressInput={addressInput}
          setAddressInput={setAddressInput}
          showPostcode={showPostcode}
          postcodeRef={postcodeRef}
          onClosePostcode={() => setShowPostcode(false)}
          searchWrapperRef={searchWrapperRef}
          daumReady={daumReady}
        />
      )}

      {isQuotationOpen && (
        <QuotationModal
          selectedUnits={selectedUnits}
          allUnits={units}
          buildingData={data ?? {}}
          address={address}
          onClose={() => setIsQuotationOpen(false)}
        />
      )}
    </>
  );
}
