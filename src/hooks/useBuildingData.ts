import { useState, useMemo, useRef, useEffect, useCallback } from 'react';

// === 타입 정의 ===
export interface SearchParamsState {
    sigunguCd: string;
    bjdongCd: string;
    bun: string;
    ji: string;
}

export interface DaumPostcodeData {
    address: string;
    roadAddress: string;
    jibunAddress: string;
    bjdongCode?: string;
    bcode: string;
    buildingCode: string;
    autoJibunAddress?: string;
    sigunguCode?: string;
}

export interface BuildingData {
    bldNm?: string;
    [key: string]: any;
}

export interface UnitRow {
    _uid: string;
    dongNm?: string;
    flrNo: string | number;
    flrGbCd?: string;
    hoNm: string;
    area: string | number;
    commonArea?: string | number;
    contractArea?: string | number;
    exposPubuseGbCd?: string;
    etcPurps?: string;
    mainPurpsCdNm?: string;
    [key: string]: any;
}

export interface FloorAreaRow {
    _uid: string;
    flrNo: number;
    flrGbCd?: string;
    flrGbCdNm?: string;
    area: string | number;
    etcPurps?: string;
    mainPurpsCdNm?: string;
}

export interface FloorAreaMeta {
    source: 'api' | 'unit_aggregate' | 'none';
    note: string;
}

export interface TransactionMarker {
    lat: number;
    lng: number;
    price: string;
    date: string;
}

export interface MarketTrend {
    month: string;
    price: number;
}

export interface MarketComparison {
    avgPricePerSqm?: number;
    recentTradeCount?: number;
    trendLabel?: string;
}

export interface MarketPriceData {
    transactions?: TransactionMarker[];
    trends?: MarketTrend[];
    comparison?: MarketComparison;
    totalCount?: number;
}

export interface CommercialData {
    grade: number;
    footTraffic: number;
    storeDensity: string;
    primaryAgeGroup: string;
    description: string;
    estimatedRent?: number;
}

interface FetchErrorResult {
    _error: string;
    _status: number;
}

function isFetchErrorResult(value: unknown): value is FetchErrorResult {
    if (value && typeof value === 'object' && '_error' in value) {
        return true;
    }
    return false;
}

export function useBuildingData() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<BuildingData | null>(null);
    const [units, setUnits] = useState<UnitRow[]>([]);
    const [floorAreas, setFloorAreas] = useState<FloorAreaRow[]>([]);
    const [floorAreaMeta, setFloorAreaMeta] = useState<FloorAreaMeta>({
        source: 'none',
        note: '층별 면적 데이터가 없습니다.',
    });
    const [marketPrice, setMarketPrice] = useState<MarketPriceData | null>(null);
    const [commercialData, setCommercialData] = useState<CommercialData | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [address, setAddress] = useState('');
    const [coords, setCoords] = useState<{ lat: number, lng: number } | undefined>(undefined);
    const [isQuotationOpen, setIsQuotationOpen] = useState(false);
    const [addressInput, setAddressInput] = useState('');
    const [showPostcode, setShowPostcode] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [daumReady, setDaumReady] = useState(false);

    const postcodeRef = useRef<HTMLDivElement>(null);
    const searchWrapperRef = useRef<HTMLDivElement>(null);

    const [pendingSearch, setPendingSearch] = useState<{
        params: SearchParamsState;
        address: string;
    } | null>(null);

    const toApiUrl = useCallback((path: string) => {
        if (typeof window === 'undefined') return path;
        return new URL(path, window.location.origin).toString();
    }, []);

    const updateCoordsByAddress = useCallback(async (rawAddress: string): Promise<boolean> => {
        const targetAddress = rawAddress.trim();
        if (!targetAddress) return false;
        try {
            const geocodeRes = await fetch(
                toApiUrl(`/api/geocode?address=${encodeURIComponent(targetAddress)}`),
                {
                    headers: { 'Accept': 'application/json' },
                    cache: 'no-store',
                    redirect: 'error',
                }
            );
            if (!geocodeRes.ok) return false;
            const geocodeData = await geocodeRes.json();
            if (geocodeData.lat && geocodeData.lng) {
                setCoords({ lat: geocodeData.lat, lng: geocodeData.lng });
                return true;
            }
        } catch {
            // 좌표 조회 실패 시 기존 좌표 유지
        }
        return false;
    }, [toApiUrl]);

    // fetchAllData
    const fetchAllData = useCallback(async (searchParams: SearchParamsState, fullAddress: string) => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const query = new URLSearchParams(searchParams as any).toString();

            const safeFetch = async (path: string, name: string): Promise<unknown> => {
                const url = toApiUrl(path);
                for (let attempt = 0; attempt < 3; attempt++) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 30000);
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
                        return { _error: `서버가 잘못된 응답 반환 (status=${res.status})`, _status: res.status };
                    } catch (error: unknown) {
                        const message = error instanceof Error ? error.message : String(error);
                        const isRedirectError = message.toLowerCase().includes('redirect');
                        if (isRedirectError) {
                            return { _error: `${name} redirect loop detected. Please refresh and try again.`, _status: 310 };
                        }
                        if (attempt < 2) {
                            await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
                            continue;
                        }
                    }
                }
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
                        resolve({ _error: `${name} network error. Please refresh and try again.`, _status: 0 });
                    };
                    xhr.ontimeout = () => {
                        resolve({ _error: `${name} 응답 시간 초과`, _status: 408 });
                    };
                    xhr.send();
                });
            };

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
            const buildingDataRes = titleItems[0] as BuildingData | undefined;

            if (!buildingDataRes) {
                setErrorMsg('건축물대장 정보가 없습니다.');
                setData(null);
                return;
            }

            setData(buildingDataRes);
            const ledgerAddress = String(buildingDataRes.newPlatPlc || buildingDataRes.platPlc || fullAddress).trim();
            const buildingName = String(buildingDataRes.bldNm || '').trim();
            const ledgerAddressWithName = [ledgerAddress, buildingName].filter(Boolean).join(' ');
            void (async () => {
                const exactMatched = await updateCoordsByAddress(ledgerAddress);
                if (!exactMatched && ledgerAddressWithName !== ledgerAddress) {
                    await updateCoordsByAddress(ledgerAddressWithName);
                }
            })();

            const floorQuery = (() => {
                const dongNmRaw = String(buildingDataRes.dongNm ?? '').trim();
                if (!dongNmRaw) return query;
                return `${query}&dongNm=${encodeURIComponent(dongNmRaw)}`;
            })();

            const [unitsResult, marketResult, floorResult, commResult] = await Promise.all([
                safeFetch(`/api/building-units?${query}`, '호실 정보'),
                safeFetch(`/api/market-price?${query}`, '시세 정보'),
                safeFetch(`/api/building-floors?${floorQuery}`, '층별 면적'),
                safeFetch(`/api/commercial-area?${query}&address=${encodeURIComponent(fullAddress)}`, '상권 분석')
            ]);

            setMarketPrice(isFetchErrorResult(marketResult) ? null : (marketResult as MarketPriceData));

            if (!isFetchErrorResult(commResult) && (commResult as any).data) {
                setCommercialData((commResult as any).data as CommercialData);
            } else {
                setCommercialData(null);
            }

            const normalizeFloorDecimal = (value: unknown): string => {
                const raw = String(value ?? '').replace(/,/g, '').trim();
                if (!raw) return '0';
                if (/^-?\d+(\.\d+)?$/.test(raw)) return raw;
                const parsed = Number(raw);
                return Number.isFinite(parsed) ? parsed.toString() : '0';
            };
            const normalizeFloorText = (value: unknown): string => String(value ?? '').trim();
            const normalizedFloorAreasFromApi = (() => {
                if (isFetchErrorResult(floorResult)) return [];
                const payload = floorResult as { floors?: unknown };
                if (!Array.isArray(payload.floors)) return [];
                return payload.floors
                    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
                    .map((item, index) => {
                        const floorNo = Number(item.flrNo ?? 0) || 0;
                        return {
                            _uid: String(item._uid ?? `${floorNo}-${index}`),
                            flrNo: floorNo,
                            flrGbCd: normalizeFloorText(item.flrGbCd),
                            flrGbCdNm: normalizeFloorText(item.flrGbCdNm),
                            area: normalizeFloorDecimal(item.area),
                            etcPurps: normalizeFloorText(item.etcPurps),
                            mainPurpsCdNm: normalizeFloorText(item.mainPurpsCdNm),
                        };
                    })
                    .filter((item) => item.flrNo !== 0 || item.area !== '0');
            })();

            const unitsPayload = (!isFetchErrorResult(unitsResult) ? unitsResult : null) as
                | { response?: { body?: { items?: { item?: unknown } } } }
                | null;
            const rawUnits = unitsPayload?.response?.body?.items?.item || [];
            const unitList = Array.isArray(rawUnits) ? rawUnits : [rawUnits];

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
            const SHARED_FACILITY_KEYWORDS = [
                '계단실', '기계실', '전기실', '통신실', '전산실', '층별공용', '공용부분', '공유면적',
                '복도', '홀', '로비', '화장실', '관리실', '경비실', '방재실', '휴게실', '용역원휴게실',
                '쓰레기처리장', 'mdf', 'idf', '승강기', '엘리베이터', 'eps', 'ps', '덕트', '주차램프', '램프', '공용',
            ];
            const isSharedFacilityPurpose = (value: unknown): boolean => {
                const normalized = normalizeUnitText(value).replace(/[\s()\-_/.,]/g, '').toLowerCase();
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
            const resolvePurpose = (
                etcRaw: unknown,
                mainRaw: unknown,
                buildingMainRaw?: unknown,
            ): string => {
                const etc = normalizeUnitText(etcRaw);
                const main = normalizeUnitText(mainRaw);
                const buildingMain = normalizeUnitText(buildingMainRaw);
                if (!etc) return main || buildingMain;
                if (isSharedFacilityPurpose(etc) && main && !isSharedFacilityPurpose(main)) {
                    return main;
                }
                if (isSharedFacilityPurpose(etc) && buildingMain && !isSharedFacilityPurpose(buildingMain)) {
                    return buildingMain;
                }
                return etc || main || buildingMain;
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
                    const purpose = resolvePurpose(
                        unit.etcPurps,
                        unit.mainPurpsCdNm,
                        buildingDataRes.mainPurpsCdNm,
                    );
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

            const fallbackFloorAreasFromUnits = (() => {
                const floorMap = new Map<
                    number,
                    {
                        flrNo: number;
                        flrGbCd: string;
                        area: string;
                    }
                >();

                processedUnits.forEach((unit) => {
                    const flrNo = Number(unit.flrNo) || 0;
                    const existing = floorMap.get(flrNo) ?? {
                        flrNo,
                        flrGbCd: normalizeUnitText(unit.flrGbCd),
                        area: '0',
                    };
                    existing.area = addDecimalStrings(
                        existing.area,
                        normalizeUnitDecimal(unit.contractArea ?? unit.area),
                    );
                    floorMap.set(flrNo, existing);
                });

                return Array.from(floorMap.values())
                    .sort((a, b) => b.flrNo - a.flrNo)
                    .map((item, index) => ({
                        _uid: `${item.flrNo}-fallback-${index}`,
                        flrNo: item.flrNo,
                        flrGbCd: item.flrGbCd,
                        area: item.area,
                        etcPurps: '',
                        mainPurpsCdNm: '',
                    }));
            })();

            if (normalizedFloorAreasFromApi.length > 0) {
                setFloorAreas(normalizedFloorAreasFromApi);
                setFloorAreaMeta({
                    source: 'api',
                    note: '건축물대장 층별개요 원본입니다.',
                });
            } else if (fallbackFloorAreasFromUnits.length > 0) {
                setFloorAreas(fallbackFloorAreasFromUnits);
                setFloorAreaMeta({
                    source: 'unit_aggregate',
                    note: '층별개요 미제공으로 호실 계약면적 합산값을 표기합니다.',
                });
            } else {
                setFloorAreas([]);
                setFloorAreaMeta({
                    source: 'none',
                    note: '공공데이터에서 층별개요와 호실면적이 모두 제공되지 않아 자동 산출이 불가합니다.',
                });
            }

            type HistoryItem = {
                id: string;
                title: string;
                date: string;
                address: string;
                params: SearchParamsState;
            };
            const historyItem = {
                id: Date.now().toString(),
                title: buildingDataRes.bldNm || fullAddress.split(' ').slice(0, 3).join(' '),
                date: new Date().toLocaleDateString(),
                address: fullAddress,
                params: searchParams,
            };
            const saved = localStorage.getItem('building_report_history');
            const history: HistoryItem[] = saved ? (JSON.parse(saved) as HistoryItem[]) : [];
            const updated = [historyItem, ...history.filter((h) => h.title !== historyItem.title)].slice(0, 10);
            localStorage.setItem('building_report_history', JSON.stringify(updated));
            window.dispatchEvent(new Event('historyUpdated'));

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setErrorMsg(`데이터 조회 오류: ${message}`);
        } finally {
            setLoading(false);
        }
    }, [toApiUrl, updateCoordsByAddress]);

    useEffect(() => {
        if (!pendingSearch) return;
        const { params: p, address: a } = pendingSearch;
        setPendingSearch(null);
        fetchAllData(p, a);
    }, [pendingSearch, fetchAllData]);

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
        setSelectedIds(new Set());
        setErrorMsg(null);
        setCoords(undefined);
        setFloorAreas([]);
        setFloorAreaMeta({
            source: 'none',
            note: '층별 면적 데이터가 없습니다.',
        });

        void updateCoordsByAddress(fullAddress);
        setPendingSearch({ params: newParams, address: fullAddress });
    }, [updateCoordsByAddress]);

    const openPostcodeEmbed = useCallback((query?: string) => {
        if (!daumReady || !(window as any).daum?.Postcode) {
            setErrorMsg('주소 검색 서비스를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        const DaumPostcode = (window as any).daum?.Postcode;
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

    const resolveSearchAddress = useCallback(async (rawQuery: string): Promise<string> => {
        const query = rawQuery.trim();
        if (!query) return '';
        try {
            const res = await fetch(toApiUrl(`/api/geocode?address=${encodeURIComponent(query)}`), {
                headers: { 'Accept': 'application/json' },
                cache: 'no-store',
                redirect: 'error',
            });
            if (!res.ok) return query;
            const data = await res.json();
            const resolvedAddress = typeof data?.resolvedAddress === 'string' ? data.resolvedAddress.trim() : '';
            return resolvedAddress || query;
        } catch {
            return query;
        }
    }, [toApiUrl]);

    const handleSearchSubmit = useCallback(async (inputQuery?: string) => {
        const raw = typeof inputQuery === 'string' ? inputQuery : addressInput;
        const query = raw.trim();
        if (!query) return;

        setErrorMsg(null);
        const resolvedQuery = await resolveSearchAddress(query);
        if (resolvedQuery && resolvedQuery !== addressInput) {
            setAddressInput(resolvedQuery);
        }
        openPostcodeEmbed(resolvedQuery || query);
    }, [addressInput, openPostcodeEmbed, resolveSearchAddress]);

    const clearData = useCallback(() => {
        setData(null);
        setUnits([]);
        setFloorAreas([]);
        setFloorAreaMeta({
            source: 'none',
            note: '층별 면적 데이터가 없습니다.',
        });
        setAddress('');
        setSelectedIds(new Set());
        setIsQuotationOpen(false);
        setShowPostcode(false);
        setErrorMsg(null);
    }, []);

    return {
        loading,
        data,
        units,
        floorAreas,
        floorAreaMeta,
        address,
        coords,
        marketPrice,
        commercialData,
        selectedIds,
        setSelectedIds,
        addressInput,
        setAddressInput,
        showPostcode,
        setShowPostcode,
        errorMsg,
        setErrorMsg,
        daumReady,
        setDaumReady,
        isQuotationOpen,
        setIsQuotationOpen,
        postcodeRef,
        searchWrapperRef,
        handleSearchSubmit,
        clearData,
        selectedUnits: useMemo(() => units.filter(u => selectedIds.has(u._uid)), [units, selectedIds])
    };
}
