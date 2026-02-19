'use client';

import React, { useState, useMemo } from 'react';
import {
    Building, TrendingUp, AlertCircle,
    ChevronDown, X, Search, Check, Car, Calendar, Maximize,
    Layers, LayoutGrid, List, Star, ArrowRightLeft, ArrowUpCircle,
    FileText, History, Trash2, Building2
} from 'lucide-react';
import { TopMetricsData } from '@/components/dashboard/TopMetrics';
import { InvestmentMap } from '@/components/dashboard/InvestmentMap';
import { MarketChart } from '@/components/dashboard/MarketChart';

// ==========================================
// 타입 정의
// ==========================================

type UnitRow = Record<string, unknown> & {
    _uid: string;
    dongNm?: string;
    flrNo: string | number;
    flrGbCd?: string;          // 층구분코드 (10=지하, 20=지상)
    hoNm: string;
    area: string | number;
    commonArea?: string | number; // 공용면적 합산
    contractArea?: string | number; // 계약면적 (전용+공용)
    exposPubuseGbCd?: string;  // 전유/공용 구분코드
    etcPurps?: string;
    mainPurpsCdNm?: string;
};

type FloorAreaRow = {
    _uid: string;
    flrNo: number;
    flrGbCd?: string;
    flrGbCdNm?: string;
    area: string | number;
    etcPurps?: string;
    mainPurpsCdNm?: string;
};

type FloorAreaMeta = {
    source: 'api' | 'unit_aggregate' | 'none';
    note: string;
};

type TransactionMarker = {
    lat: number;
    lng: number;
    price: string;
    date: string;
};

type MarketTrend = { month: string; price: number };

interface FloorGroup {
    floorLevel: number;
    units: UnitRow[];
}

// SavedQuote - 향후 견적 비교 기능에서 사용 예정

interface SelectionPageProps {
    buildingData: (TopMetricsData & Record<string, unknown> & { bldNm?: string }) | null;
    units: UnitRow[];
    floorAreas?: FloorAreaRow[];
    floorAreaMeta?: FloorAreaMeta;
    address: string;
    coords?: { lat: number; lng: number };
    transactions?: TransactionMarker[];
    trends?: MarketTrend[];
    selectedIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
    onBack: () => void;
    onGenerateQuote: () => void;
    onSearch: () => void;
    addressInput: string;
    setAddressInput: (v: string) => void;
    showPostcode: boolean;
    postcodeRef: React.RefObject<HTMLDivElement | null>;
    onClosePostcode: () => void;
    searchWrapperRef: React.RefObject<HTMLDivElement | null>;
    daumReady: boolean;
}

// ==========================================
// 유틸 함수
// ==========================================

const formatNumber = (num: number) => num.toLocaleString();

type HoToken = { type: 'num' | 'text'; value: string; num?: number };

const tokenizeHo = (raw: string): HoToken[] => {
    const normalized = raw
        .trim()
        .replace(/\s+/g, '')
        .replace(/호$/u, '');
    const matches = normalized.match(/(\d+|[A-Za-z가-힣]+)/gu);
    if (!matches) {
        return [{ type: 'text', value: normalized }];
    }
    return matches.map((part) => {
        if (/^\d+$/u.test(part)) {
            return { type: 'num', value: part, num: Number(part) };
        }
        return { type: 'text', value: part.toUpperCase() };
    });
};

const compareHoName = (a: string, b: string): number => {
    const ta = tokenizeHo(a);
    const tb = tokenizeHo(b);
    const maxLen = Math.max(ta.length, tb.length);

    for (let i = 0; i < maxLen; i += 1) {
        const pa = ta[i];
        const pb = tb[i];
        if (!pa && pb) return -1;
        if (pa && !pb) return 1;
        if (!pa || !pb) continue;

        if (pa.type === 'num' && pb.type === 'num') {
            if ((pa.num ?? 0) !== (pb.num ?? 0)) {
                return (pa.num ?? 0) - (pb.num ?? 0);
            }
            if (pa.value.length !== pb.value.length) {
                return pa.value.length - pb.value.length;
            }
            continue;
        }
        if (pa.type === 'text' && pb.type === 'text') {
            const compared = pa.value.localeCompare(pb.value, 'ko');
            if (compared !== 0) return compared;
            continue;
        }
        if (pa.type === 'text') return -1;
        return 1;
    }

    return a.localeCompare(b, 'ko');
};

const getM2RawText = (value: unknown): string => {
    const raw = String(value ?? '').replace(/,/g, '').trim();
    if (!raw) return '0';
    if (/^-?\d+(\.\d+)?$/.test(raw)) return raw;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed.toString() : '0';
};

const formatM2Fixed2 = (value: unknown): string => {
    const m2 = Number(getM2RawText(value));
    if (!Number.isFinite(m2)) return '0.00';
    return m2.toFixed(2);
};

const SHARED_FACILITY_KEYWORDS = [
    '계단실',
    '기계실',
    '전기실',
    '층별공용',
    '공용부분',
    '공유면적',
    '복도',
    '홀',
    '로비',
    '화장실',
    '승강기',
    '엘리베이터',
    'eps',
    'ps',
    '덕트',
    '주차램프',
    '램프',
    '공용',
];

const isSharedFacilityPurpose = (value: unknown): boolean => {
    const normalized = String(value ?? '').trim().replace(/[\s()\-_/.,]/g, '').toLowerCase();
    if (!normalized) return false;
    return SHARED_FACILITY_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const getUnitUsageLabel = (unit: UnitRow): string => {
    const etc = String(unit.etcPurps ?? '').trim();
    const main = String(unit.mainPurpsCdNm ?? '').trim();
    if (!etc) return main || '-';
    if (isSharedFacilityPurpose(etc) && main && !isSharedFacilityPurpose(main)) {
        return main;
    }
    return etc || main || '-';
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

const getFloorLabel = (flrNo: string | number): string => {
    const n = Number(flrNo) || 0;
    if (n < 0) return `B${Math.abs(n)}F`;
    return `${n}F`;
};

// ==========================================
// InfoCard 컴포넌트
// ==========================================

interface InfoCardProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    subtext: string;
    color: string;
}

const InfoCard = ({ icon, label, value, subtext, color }: InfoCardProps) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-36 relative overflow-hidden group">
        <div className="flex items-center space-x-3 mb-2 z-10">
            <div className={`p-2 rounded-lg shadow-sm ${color}`}>
                {icon}
            </div>
            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">{label}</span>
        </div>
        <div className="z-10 mt-auto">
            <div className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight truncate">{value}</div>
            <div className="text-xs text-slate-400 font-medium mt-1 truncate">{subtext}</div>
        </div>
    </div>
);

// ==========================================
// SelectionPage 메인 컴포넌트
// ==========================================

export function SelectionPage({
    buildingData,
    units,
    floorAreas = [],
    floorAreaMeta = { source: 'none', note: '층별 면적 데이터가 없습니다.' },
    address,
    coords,
    transactions,
    trends,
    selectedIds,
    onSelectionChange,
    onBack,
    onGenerateQuote,
    onSearch,
    addressInput,
    setAddressInput,
    showPostcode,
    postcodeRef,
    onClosePostcode,
    searchWrapperRef,
}: SelectionPageProps) {
    const [activeFloorFilter, setActiveFloorFilter] = useState<string | number>('all');
    const [activeDongFilter, setActiveDongFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sidebarTab, setSidebarTab] = useState<'review' | 'quote'>('quote');

    // 건물 스펙 계산
    const buildingInfo = useMemo(() => {
        if (!buildingData) return null;
        const formatDate = (dateStr?: string) => {
            if (!dateStr || dateStr.trim() === '' || dateStr.length < 8) return "-";
            return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
        };
        const getYears = (dateStr?: string) => {
            if (!dateStr || dateStr.trim() === '' || dateStr.length < 4) return "-";
            const year = parseInt(dateStr.substring(0, 4), 10);
            if (isNaN(year)) return "-";
            const diff = new Date().getFullYear() - year;
            return diff <= 0 ? "신축" : `${diff}년차`;
        };
        const toPyung = (m2: number | string | undefined) => {
            if (!m2) return "0";
            return (Number(m2) * 0.3025).toLocaleString(undefined, { maximumFractionDigits: 0 });
        };

        const totalParking =
            Number(buildingData.indrMechUtcnt || 0) +
            Number(buildingData.indrAutoUtcnt || 0) +
            Number(buildingData.oudrMechUtcnt || 0) +
            Number(buildingData.oudrAutoUtcnt || 0);
        const totalElev =
            Number(buildingData.rideUseElvtCnt || 0) + Number(buildingData.emgenUseElvtCnt || 0);
        const hoCnt = Number(buildingData.hhldCnt || buildingData.hoCnt || 0);

        return {
            name: (buildingData.bldNm as string) || address.split(' ').slice(0, 3).join(' '),
            address,
            scale: `B${buildingData.ugrndFlrCnt || 0} / ${buildingData.grndFlrCnt || 0}F`,
            totalUnits: hoCnt,
            grossFloorArea: Number(buildingData.totArea || 0),
            grossFloorAreaPy: toPyung(buildingData.totArea),
            approvalDate: formatDate(buildingData.useAprDay),
            age: getYears(buildingData.useAprDay),
            parkingCount: totalParking,
            elevatorCount: totalElev,
            rideElev: Number(buildingData.rideUseElvtCnt || 0),
            emgenElev: Number(buildingData.emgenUseElvtCnt || 0),
            coverageRatio: buildingData.bcRat || 0,
            floorAreaRatio: buildingData.vlRat || 0,
            usage: (buildingData.mainPurpsCdNm as string) || '-',
            structure: (buildingData.strctCdNm as string) || '-',
            violation: buildingData.vlrtBldRgstYn === '1' ? '위반건축물' : '정상',
            vlrtBldRgstYn: buildingData.vlrtBldRgstYn,
        };
    }, [buildingData, address]);

    // 유니크 동 목록 (dongNm 기반 또는 hoNm 접두사 기반)
    const dongSource = useMemo<'dongNm' | 'hoPrefix'>(() => {
        // dongNm이 2개 이상이면 dongNm 사용
        const dongs = new Set<string>();
        units.forEach(u => {
            const d = String(u.dongNm ?? '').trim();
            if (d) dongs.add(d);
        });
        if (dongs.size > 1) return 'dongNm';
        // dongNm이 1개뿐이면 hoNm 접두사 패턴 감지 ("A-1003", "B-1014")
        const prefixes = new Set<string>();
        units.forEach(u => {
            const ho = String(u.hoNm ?? '').trim();
            const match = ho.match(/^([A-Za-z가-힣]+)-/);
            if (match) prefixes.add(match[1]);
        });
        if (prefixes.size > 1) return 'hoPrefix';
        return 'dongNm';
    }, [units]);

    const uniqueDongs = useMemo(() => {
        const items = new Set<string>();
        if (dongSource === 'hoPrefix') {
            units.forEach(u => {
                const ho = String(u.hoNm ?? '').trim();
                const match = ho.match(/^([A-Za-z가-힣]+)-/);
                if (match) items.add(match[1]);
            });
        } else {
            units.forEach(u => {
                const d = String(u.dongNm ?? '').trim();
                if (d) items.add(d);
            });
        }
        return Array.from(items).sort((a, b) => {
            const na = parseInt(a), nb = parseInt(b);
            if (!isNaN(na) && !isNaN(nb)) return na - nb;
            return a.localeCompare(b);
        });
    }, [units, dongSource]);

    // 유닛을 층별로 그룹핑 (동 필터 적용)
    const floorsData: FloorGroup[] = useMemo(() => {
        let filtered = units;
        if (activeDongFilter !== 'all') {
            if (dongSource === 'hoPrefix') {
                filtered = units.filter(u => {
                    const ho = String(u.hoNm ?? '').trim();
                    const match = ho.match(/^([A-Za-z가-힣]+)-/);
                    return match && match[1] === activeDongFilter;
                });
            } else {
                filtered = units.filter(u => String(u.dongNm ?? '').trim() === activeDongFilter);
            }
        }
        const floorMap = new Map<number, UnitRow[]>();
        filtered.forEach((u) => {
            const flr = Number(u.flrNo) || 0;
            if (!floorMap.has(flr)) floorMap.set(flr, []);
            floorMap.get(flr)!.push(u);
        });
        return Array.from(floorMap.entries())
            .sort((a, b) => b[0] - a[0])
            .map(([floorLevel, floorUnits]) => ({
                floorLevel,
                units: [...floorUnits].sort((a, b) => compareHoName(a.hoNm, b.hoNm)),
            }));
    }, [units, activeDongFilter, dongSource]);

    // 필터링
    const filteredFloors = floorsData.filter(
        (floor) => activeFloorFilter === 'all' || floor.floorLevel === activeFloorFilter
    );
    const allFilteredUnits = filteredFloors
        .flatMap((f) => f.units)
        .filter((u) => u.hoNm.includes(searchTerm));

    // 선택된 유닛 목록
    const selectedUnits = useMemo(() => units.filter((u) => selectedIds.has(u._uid)), [units, selectedIds]);

    const selectedAreaSummary = useMemo(() => {
        const exclusiveM2Raw = selectedUnits.reduce(
            (sum, unit) => addDecimalStrings(sum, getM2RawText(unit.area)),
            '0',
        );
        const contractM2Raw = selectedUnits.reduce(
            (sum, unit) => addDecimalStrings(sum, getM2RawText(unit.contractArea ?? unit.area)),
            '0',
        );
        const toPyFixed2 = (m2Value: string): string => {
            const m2 = Number(m2Value);
            if (!Number.isFinite(m2)) return '0.00';
            return (m2 * 0.3025).toFixed(2);
        };
        return {
            exclusiveM2: formatM2Fixed2(exclusiveM2Raw),
            contractM2: formatM2Fixed2(contractM2Raw),
            exclusivePy: toPyFixed2(exclusiveM2Raw),
            contractPy: toPyFixed2(contractM2Raw),
        };
    }, [selectedUnits]);

    const floorSummaryRows = useMemo(() => {
        const pickPreferredPurpose = (currentRaw: string, candidateRaw: string): string => {
            const current = currentRaw.trim();
            const candidate = candidateRaw.trim();
            if (!candidate) return current;
            if (!current) return candidate;
            const currentShared = isSharedFacilityPurpose(current);
            const candidateShared = isSharedFacilityPurpose(candidate);
            if (currentShared && !candidateShared) return candidate;
            if (!currentShared && candidateShared) return current;
            return current.length >= candidate.length ? current : candidate;
        };

        const ledgerMap = new Map<
            number,
            {
                ledgerM2Raw: string;
                ledgerPurpose: string;
                flrGbCd: string;
                flrGbCdNm: string;
            }
        >();

        floorAreas.forEach((item) => {
            const floorLevel = Number(item.flrNo) || 0;
            const areaRaw = getM2RawText(item.area);
            const purposeCandidate = String(item.etcPurps || item.mainPurpsCdNm || '').trim();
            const existing = ledgerMap.get(floorLevel) ?? {
                ledgerM2Raw: '0',
                ledgerPurpose: '',
                flrGbCd: String(item.flrGbCd ?? '').trim(),
                flrGbCdNm: String(item.flrGbCdNm ?? '').trim(),
            };

            existing.ledgerM2Raw = addDecimalStrings(existing.ledgerM2Raw, areaRaw);
            existing.ledgerPurpose = pickPreferredPurpose(existing.ledgerPurpose, purposeCandidate);
            if (!existing.flrGbCd) existing.flrGbCd = String(item.flrGbCd ?? '').trim();
            if (!existing.flrGbCdNm) existing.flrGbCdNm = String(item.flrGbCdNm ?? '').trim();
            ledgerMap.set(floorLevel, existing);
        });

        const unitMap = new Map<
            number,
            {
                unitCount: number;
                exclusiveM2Raw: string;
                contractM2Raw: string;
            }
        >();

        floorsData.forEach((floor) => {
            const summary = unitMap.get(floor.floorLevel) ?? {
                unitCount: 0,
                exclusiveM2Raw: '0',
                contractM2Raw: '0',
            };

            summary.unitCount += floor.units.length;
            floor.units.forEach((unit) => {
                summary.exclusiveM2Raw = addDecimalStrings(summary.exclusiveM2Raw, getM2RawText(unit.area));
                summary.contractM2Raw = addDecimalStrings(
                    summary.contractM2Raw,
                    getM2RawText(unit.contractArea ?? unit.area),
                );
            });
            unitMap.set(floor.floorLevel, summary);
        });

        const floorLevels = new Set<number>([
            ...Array.from(ledgerMap.keys()),
            ...Array.from(unitMap.keys()),
        ]);

        const toPyText = (m2Raw: string): string => {
            const m2 = Number(m2Raw);
            if (!Number.isFinite(m2)) return '0.00';
            return (m2 * 0.3025).toFixed(2);
        };

        return Array.from(floorLevels)
            .sort((a, b) => b - a)
            .map((floorLevel, index) => {
                const ledger = ledgerMap.get(floorLevel);
                const unit = unitMap.get(floorLevel);
                return {
                    _uid: `${floorLevel}-${index}`,
                    floorLevel,
                    floorLabel: getFloorLabel(floorLevel),
                    ledgerM2Raw: ledger?.ledgerM2Raw ?? '0',
                    ledgerPy: toPyText(ledger?.ledgerM2Raw ?? '0'),
                    exclusiveM2Raw: unit?.exclusiveM2Raw ?? '0',
                    exclusivePy: toPyText(unit?.exclusiveM2Raw ?? '0'),
                    contractM2Raw: unit?.contractM2Raw ?? '0',
                    contractPy: toPyText(unit?.contractM2Raw ?? '0'),
                    unitCount: unit?.unitCount ?? 0,
                    purpose: ledger?.ledgerPurpose ?? '',
                };
            });
    }, [floorAreas, floorsData]);

    // 호실 토글
    const toggleUnit = (unit: UnitRow) => {
        const next = new Set(selectedIds);
        if (next.has(unit._uid)) {
            next.delete(unit._uid);
        } else {
            next.add(unit._uid);
        }
        onSelectionChange(next);
    };

    // 전체 선택/해제
    const handleSelectAll = (filtered: UnitRow[]) => {
        const allSelected = filtered.length > 0 && filtered.every((u) => selectedIds.has(u._uid));
        const next = new Set(selectedIds);
        if (allSelected) {
            filtered.forEach((u) => next.delete(u._uid));
        } else {
            filtered.forEach((u) => next.add(u._uid));
        }
        onSelectionChange(next);
    };

    // 면적 계산 (전용면적) - 건축물대장 원본 소수점 유지
    const getAreaPy = (unit: UnitRow): string => {
        const val = Number(unit.area) || 0;
        const py = val * 0.3025;
        return py.toFixed(2);
    };

    const getAreaM2 = (unit: UnitRow): string => {
        return formatM2Fixed2(unit.area);
    };

    // 계약면적 (전용+공용) - 건축물대장 원본 소수점 유지
    const getContractAreaPy = (unit: UnitRow): string => {
        const val = Number(unit.contractArea) || Number(unit.area) || 0;
        const py = val * 0.3025;
        return py.toFixed(2);
    };

    const getContractAreaM2 = (unit: UnitRow): string => {
        return formatM2Fixed2(unit.contractArea ?? unit.area);
    };

    if (!buildingInfo) return null;

    return (
        <div className="flex min-h-screen bg-[#F7F9FC] font-sans">

            {/* 1. Left Sidebar */}
            <aside className="w-[300px] bg-white border-r border-slate-200 flex flex-col z-20 shrink-0 hidden lg:flex">
                <div className="p-6 flex-1 flex flex-col h-full overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="flex mb-6 border-b border-violet-600/20">
                        <button
                            onClick={() => setSidebarTab('review')}
                            className={`flex-1 pb-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${sidebarTab === 'review' ? 'border-b-2 border-violet-600 text-slate-800' : 'text-slate-400 border-transparent'}`}
                        >
                            <History className="w-4 h-4" /> 검토 목록
                        </button>
                        <button
                            onClick={() => setSidebarTab('quote')}
                            className={`flex-1 pb-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${sidebarTab === 'quote' ? 'border-b-2 border-violet-600 text-violet-700' : 'text-slate-400 border-transparent'}`}
                        >
                            <FileText className="w-4 h-4" /> 견적서
                        </button>
                    </div>

                    {/* Sidebar Content */}
                    <div className="overflow-y-auto flex-1 pr-1">
                        {sidebarTab === 'review' ? (
                            <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                                최근 본 건물이 없습니다.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs text-slate-500 px-1 mb-1">
                                    <span>체크하여 비교 분석 (최대 5개)</span>
                                    <Trash2 className="w-3.5 h-3.5 cursor-pointer hover:text-slate-700" />
                                </div>

                                {/* 현재 건물 카드 */}
                                <div className="bg-white border border-violet-200 rounded-2xl p-4 shadow-sm relative group cursor-pointer hover:border-violet-400 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-violet-600 rounded flex items-center justify-center text-white shadow-sm">
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-sm truncate max-w-[160px]">{buildingInfo.name}</h4>
                                        </div>
                                        <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded font-bold">현재</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-3 h-3 text-slate-400" />
                                            <span className="font-medium text-slate-600">{buildingInfo.scale}</span>
                                            <span className="text-slate-300">|</span>
                                            <span>{buildingInfo.totalUnits}세대</span>
                                        </div>
                                        <div className="flex items-center gap-2 font-bold text-slate-700">
                                            <span>선택 {selectedUnits.length}개</span>
                                            <span className="text-slate-300 font-normal">|</span>
                                            <span>{selectedAreaSummary.exclusivePy}평</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400">{buildingInfo.usage} · {buildingInfo.age}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* 2. Main Content Area */}
            <div className="flex-1 flex flex-col relative">

                {/* Header */}
                <header className="relative z-50 bg-white border-b border-slate-200 h-[72px] flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
                        <div className="bg-blue-600 rounded-lg p-1.5 shadow-sm">
                            <Building className="w-5 h-5 text-white" />
                        </div>
                        <div className="leading-tight">
                            <h1 className="text-lg font-bold text-slate-900">BuildingCost <span className="text-blue-600">Pro</span></h1>
                            <p className="text-[10px] text-slate-400">매입 · 임차 견적 자동화</p>
                        </div>
                    </div>

                    {/* Steps Indicator */}
                    <div className="hidden md:flex items-center absolute left-1/2 transform -translate-x-1/2">
                        <div className="flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1 shadow-sm">
                                <Check className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[11px] font-medium text-emerald-600">주소 검색</span>
                        </div>
                        <div className="w-24 h-[2px] bg-emerald-400 mb-5 mx-2"></div>
                        <div className="flex flex-col items-center relative">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-1 shadow-lg ring-4 ring-blue-50 z-10">2</div>
                            <span className="text-[11px] font-bold text-blue-600">호실 선택</span>
                        </div>
                        <div className="w-24 h-[2px] bg-slate-200 mb-5 mx-2"></div>
                        <div className="flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs mb-1">3</div>
                            <span className="text-[11px] font-medium text-slate-400">견적 결과</span>
                        </div>
                    </div>

                    <div className="w-24" />
                </header>

                {/* Scrollable Main Body */}
                <main className="relative z-0 flex-1 p-6 md:p-8 bg-[#F7F9FC]">
                    <div className="max-w-[1400px] mx-auto space-y-6 pb-32">
                        {/* Address Search Section */}
                        <div ref={searchWrapperRef} className="rounded-[24px] border border-slate-200 bg-white/90 p-2 shadow-sm">
                            <div className="relative flex items-center rounded-[20px] border border-slate-200 bg-white pl-3 pr-2 py-1.5">
                                <Search className="w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={addressInput}
                                    onChange={(e) => setAddressInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && addressInput.trim()) {
                                            e.preventDefault();
                                            onSearch();
                                        }
                                    }}
                                    placeholder="새 주소 검색..."
                                    className="py-2.5 pl-2 pr-3 text-base w-full outline-none text-slate-700"
                                />
                                <button
                                    onClick={onSearch}
                                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[92px] sm:min-w-[110px] px-5 py-2.5 rounded-[16px] text-base font-bold transition-colors whitespace-nowrap"
                                >
                                    검색
                                </button>
                            </div>
                        </div>

                        {showPostcode && (
                            <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                                    <span className="text-sm font-semibold text-slate-700">주소를 선택해주세요</span>
                                    <button
                                        onClick={onClosePostcode}
                                        title="주소 검색 닫기"
                                        className="px-1 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                        닫기
                                    </button>
                                </div>
                                <div ref={postcodeRef} className="w-full" style={{ height: '520px' }} />
                            </div>
                        )}

                        {/* Building Title */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">{buildingInfo.name}</h2>
                            <p className="text-slate-500 text-sm">{buildingInfo.address}</p>
                        </div>

                        {/* Info Cards Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <InfoCard icon={<Layers className="w-5 h-5 text-white" />} label="규모" value={buildingInfo.scale} subtext={`총 ${buildingInfo.totalUnits}세대`} color="bg-indigo-500" />
                            <InfoCard icon={<Maximize className="w-5 h-5 text-white" />} label="연면적" value={<span>{formatNumber(buildingInfo.grossFloorArea)}㎡</span>} subtext={`약 ${buildingInfo.grossFloorAreaPy}평`} color="bg-blue-500" />
                            <InfoCard icon={<Calendar className="w-5 h-5 text-white" />} label="사용승인" value={buildingInfo.approvalDate} subtext={buildingInfo.age} color="bg-orange-500" />
                            <InfoCard icon={<Car className="w-5 h-5 text-white" />} label="주차" value={`${buildingInfo.parkingCount > 0 ? buildingInfo.parkingCount : '-'}대`} subtext="등기부 확인 필요" color="bg-emerald-500" />
                            <InfoCard icon={<ArrowUpCircle className="w-5 h-5 text-white" />} label="승강기" value={`${buildingInfo.elevatorCount > 0 ? buildingInfo.elevatorCount : '-'}대`} subtext={`승용 ${buildingInfo.rideElev} / 비상 ${buildingInfo.emgenElev}`} color="bg-purple-500" />
                            <InfoCard icon={<TrendingUp className="w-5 h-5 text-white" />} label="건폐·용적" value={`${buildingInfo.coverageRatio}% / ${buildingInfo.floorAreaRatio}%`} subtext="건폐 / 용적" color="bg-pink-500" />
                            <InfoCard icon={<Building2 className="w-5 h-5 text-white" />} label="주용도" value={buildingInfo.usage} subtext={buildingInfo.structure} color="bg-cyan-500" />
                            <InfoCard icon={<AlertCircle className="w-5 h-5 text-white" />} label="위반건축물" value={buildingInfo.violation} subtext={buildingInfo.violation === '정상' ? '적합 상태' : '위반 내용 확인'} color={buildingInfo.violation === '정상' ? 'bg-emerald-500' : 'bg-red-500'} />
                        </div>

                        {/* Floor Area Summary */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-blue-600" />
                                    <h3 className="text-sm md:text-base font-bold text-slate-900">층별 면적 요약</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setActiveFloorFilter('all')}
                                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                            activeFloorFilter === 'all'
                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        전체층 보기
                                    </button>
                                    {activeFloorFilter !== 'all' && (
                                        <span className="text-xs text-blue-600 font-semibold">
                                            {getFloorLabel(activeFloorFilter)} 필터 적용
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div
                                className={`mx-6 mt-4 mb-1 rounded-lg border px-3 py-2 text-xs ${
                                    floorAreaMeta.source === 'api'
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : floorAreaMeta.source === 'none'
                                        ? 'bg-slate-50 border-slate-200 text-slate-500'
                                        : 'bg-amber-50 border-amber-200 text-amber-700'
                                }`}
                            >
                                {floorAreaMeta.source === 'api'
                                    ? '원본 데이터'
                                    : floorAreaMeta.source === 'none'
                                        ? '미제공'
                                        : '보정 데이터'} · {floorAreaMeta.note}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 text-xs">
                                        <tr>
                                            <th className="px-4 py-3 text-left">층</th>
                                            <th className="px-4 py-3 text-right">건축물대장 층면적</th>
                                            <th className="px-4 py-3 text-right">전용면적 합계</th>
                                            <th className="px-4 py-3 text-right">계약면적 합계</th>
                                            <th className="px-4 py-3 text-right">호실수</th>
                                            <th className="px-4 py-3 text-left">층 용도</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {floorSummaryRows.map((row) => {
                                            const isActive = activeFloorFilter === row.floorLevel;
                                            const hasLedgerArea = row.ledgerM2Raw !== '0';
                                            return (
                                                <tr
                                                    key={row._uid}
                                                    onClick={() => setActiveFloorFilter((prev) => (prev === row.floorLevel ? 'all' : row.floorLevel))}
                                                    className={`cursor-pointer transition-colors ${
                                                        isActive ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <span className={`font-bold text-xs px-2 py-1 rounded ${
                                                            row.floorLevel < 0 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-700 bg-slate-100'
                                                        }`}>
                                                            {row.floorLabel}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {hasLedgerArea ? (
                                                            <>
                                                                <span className="font-bold text-slate-900">{row.ledgerM2Raw}㎡</span>
                                                                <span className="text-xs text-slate-400 ml-1">({row.ledgerPy}평)</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="font-semibold text-slate-800">{row.exclusiveM2Raw}㎡</span>
                                                        <span className="text-xs text-slate-400 ml-1">({row.exclusivePy}평)</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="font-semibold text-blue-700">{row.contractM2Raw}㎡</span>
                                                        <span className="text-xs text-slate-400 ml-1">({row.contractPy}평)</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{row.unitCount}</td>
                                                    <td className="px-4 py-3 text-slate-500 text-xs">
                                                        {row.purpose || '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {floorSummaryRows.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                                                    층별 면적 데이터가 없습니다.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Split Layout: Map + Unit Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                            {/* Left: Map & Trends */}
                            <div className="lg:col-span-4 space-y-4">
                                <div className="h-[400px]">
                                    <InvestmentMap address={address} coords={coords} transactions={transactions} />
                                </div>
                                <div className="h-[300px]">
                                    <MarketChart trends={trends} />
                                </div>
                            </div>

                            {/* Right: Unit Selection */}
                            <div className="lg:col-span-8">
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[700px]">

                                    {/* Toolbar */}
                                    <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-3">
                                                <div className="bg-blue-600 text-white p-2 rounded-lg shadow-md">
                                                    <Building className="w-5 h-5" />
                                                </div>
                                                <h3 className="font-bold text-slate-900 text-lg">호실별 전유면적</h3>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                                    <button
                                                        onClick={() => setViewMode('grid')}
                                                        title="그리드 뷰"
                                                        className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        <LayoutGrid className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setViewMode('list')}
                                                        title="리스트 뷰"
                                                        className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        <List className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="text-sm font-medium text-slate-400">
                                                    {allFilteredUnits.length}개 호실
                                                </div>
                                                {selectedUnits.length > 0 && (
                                                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">{selectedUnits.length}개 선택</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Filters */}
                                        <div className="flex gap-2 flex-wrap">
                                            {/* 동 필터 - 2개 이상의 동이 있을 때만 표시 */}
                                            {uniqueDongs.length > 1 && (
                                                <div className="relative w-36">
                                                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                                                    <select
                                                        title="동 필터"
                                                        className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-1 focus:ring-blue-500 block p-2.5 pl-9 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                                                        value={activeDongFilter}
                                                        onChange={(e) => setActiveDongFilter(e.target.value)}
                                                    >
                                                        <option value="all">전체 동</option>
                                                        {uniqueDongs.map((d) => (
                                                            <option key={d} value={d}>{d}동</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                                                </div>
                                            )}
                                            <div className="relative w-36">
                                                <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                                                <select
                                                    title="층 필터"
                                                    className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-1 focus:ring-blue-500 block p-2.5 pl-9 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                                                    value={activeFloorFilter}
                                                    onChange={(e) => setActiveFloorFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                                >
                                                    <option value="all">전체 층</option>
                                                    {floorsData.map((f) => (
                                                        <option key={f.floorLevel} value={f.floorLevel}>{getFloorLabel(f.floorLevel)}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                                            </div>
                                            <div className="relative flex-1">
                                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                                <input
                                                    type="text"
                                                    placeholder="호수 검색..."
                                                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-1 focus:ring-blue-500 block w-full pl-9 p-2.5 outline-none hover:bg-slate-50 transition-colors"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleSelectAll(allFilteredUnits)}
                                                className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors min-w-[100px] justify-center"
                                            >
                                                <div className={`w-4 h-4 border rounded flex items-center justify-center ${allFilteredUnits.length > 0 && allFilteredUnits.every((u) => selectedIds.has(u._uid)) ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-300 bg-white'}`}>
                                                    {allFilteredUnits.length > 0 && allFilteredUnits.every((u) => selectedIds.has(u._uid)) && <Check className="w-3 h-3" />}
                                                </div>
                                                <span>전체 선택</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex-1 bg-slate-50/50 p-6 min-h-[500px]">

                                        {/* Grid View */}
                                        {viewMode === 'grid' && (
                                            <div className="space-y-4">
                                                {filteredFloors.map((floor) => (
                                                    <div key={floor.floorLevel} className="flex bg-white rounded-xl border border-slate-100 overflow-hidden">
                                                        <div className="w-20 shrink-0 flex flex-col justify-center items-center bg-slate-50 border-r border-slate-100 p-2">
                                                            <span className={`text-xl font-extrabold ${floor.floorLevel < 0 ? 'text-emerald-600' : 'text-slate-700'}`}>{getFloorLabel(floor.floorLevel)}</span>
                                                            <span className="text-[10px] text-slate-400 mt-1">{floor.units.length}호</span>
                                                        </div>
                                                        <div className="flex-1 p-3 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                                            {floor.units.filter((u) => u.hoNm.includes(searchTerm)).map((unit) => {
                                                                const isSelected = selectedIds.has(unit._uid);
                                                                return (
                                                                    <div
                                                                        key={unit._uid}
                                                                        onClick={() => toggleUnit(unit)}
                                                                        className={`
                                      relative p-2 rounded border cursor-pointer transition-all duration-200 flex flex-col justify-center items-center h-[60px]
                                      ${isSelected
                                                                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                                                                                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm text-slate-600'}
                                    `}
                                                                    >
                                                                        <div className="font-bold text-xs">{unit.hoNm}</div>
                                                                        <div className={`text-[10px] mt-1 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`}>
                                                                            {getAreaPy(unit)}평
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                                {filteredFloors.length === 0 && (
                                                    <div className="text-center py-20 text-slate-400">
                                                        <Building className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                        <p className="font-medium">호실 정보가 없습니다</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* List View */}
                                        {viewMode === 'list' && (
                                            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                                                        <tr>
                                                            <th className="p-4 w-16 text-center text-xs">선택</th>
                                                            <th className="p-4 w-20 text-center text-xs">층</th>
                                                            <th className="p-4 w-24 text-xs">호수</th>
                                                            <th className="p-4 text-xs">전용면적</th>
                                                            <th className="p-4 text-xs">계약면적</th>
                                                            <th className="p-4 text-right text-xs">용도</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {allFilteredUnits.map((unit) => {
                                                            const isSelected = selectedIds.has(unit._uid);
                                                            const areaPy = getAreaPy(unit);
                                                            const areaM2 = getAreaM2(unit);
                                                            return (
                                                                <tr
                                                                    key={unit._uid}
                                                                    onClick={() => toggleUnit(unit)}
                                                                    className={`cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/20' : ''}`}
                                                                >
                                                                    <td className="p-4 text-center">
                                                                        <div className={`w-5 h-5 rounded-md border mx-auto flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'}`}>
                                                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 text-center">
                                                                        <span className={`font-bold px-2 py-0.5 rounded text-xs ${Number(unit.flrNo) < 0 ? 'text-emerald-600 bg-emerald-50' : 'text-orange-500 bg-orange-50'}`}>{getFloorLabel(unit.flrNo)}</span>
                                                                    </td>
                                                                    <td className="p-4 font-bold text-slate-800">{unit.hoNm}</td>
                                                                    <td className="p-4">
                                                                        <span className="font-bold text-slate-900 text-sm mr-2">{areaPy} 평</span>
                                                                        <span className="text-slate-400 text-xs">({areaM2}㎡)</span>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <span className="font-bold text-blue-700 text-sm mr-2">{getContractAreaPy(unit)} 평</span>
                                                                        <span className="text-slate-400 text-xs">({getContractAreaM2(unit)}㎡)</span>
                                                                    </td>
                                                                    <td className="p-4 text-right text-slate-500">
                                                                        <span className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 border border-slate-200">
                                                                            {getUnitUsageLabel(unit)}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Action Bar */}
                    {selectedUnits.length > 0 && (
                        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 lg:ml-[150px] z-50 animate-in slide-in-from-bottom-8 duration-400">
                            <div className="bg-[#2D323E] text-white rounded-2xl shadow-2xl flex items-center p-3 pl-8 pr-3 gap-8 border border-slate-700/50 min-w-[840px]">
                                <div className="flex gap-8 items-center flex-1">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">선택 호실</span>
                                        <div className="font-bold text-2xl leading-none">{selectedUnits.length} <span className="text-sm font-normal text-slate-400">개</span></div>
                                    </div>
                                    <div className="w-[1px] bg-slate-600 h-10 self-center"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">총 전용면적</span>
                                        <div className="font-bold text-2xl leading-none">
                                            {selectedAreaSummary.exclusivePy} <span className="text-sm font-normal text-slate-400">평</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 mt-1">{selectedAreaSummary.exclusiveM2}㎡</div>
                                    </div>
                                    <div className="w-[1px] bg-slate-600 h-10 self-center"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider mb-1">총 계약면적</span>
                                        <div className="font-bold text-2xl leading-none">
                                            {selectedAreaSummary.contractPy} <span className="text-sm font-normal text-slate-400">평</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 mt-1">{selectedAreaSummary.contractM2}㎡</div>
                                    </div>

                                    {/* Floor Chips */}
                                    <div className="hidden lg:flex gap-2 ml-auto items-center">
                                        {[...new Set(selectedUnits.map((u) => Number(u.flrNo)))].slice(0, 4).map((f) => (
                                            <span key={f} className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded">{getFloorLabel(f)}</span>
                                        ))}
                                        {new Set(selectedUnits.map((u) => Number(u.flrNo))).size > 4 && (
                                            <span className="text-slate-500 text-xs">+{new Set(selectedUnits.map((u) => Number(u.flrNo))).size - 4}</span>
                                        )}
                                        <X className="w-4 h-4 ml-3 text-slate-500 cursor-pointer hover:text-white" onClick={() => onSelectionChange(new Set())} />
                                    </div>
                                </div>
                                <button
                                    onClick={onGenerateQuote}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2"
                                >
                                    <Star className="w-4 h-4 fill-white" />
                                    <span className="text-base">견적서 생성</span>
                                    <ArrowRightLeft className="w-4 h-4 opacity-50 ml-1" />
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
