"use client";

import React from 'react';
import { useMapStore } from '@/stores/mapStore';
import { useBuildingStore } from '@/stores/buildingStore';
import { X, Building2, AlertCircle, FileText } from 'lucide-react';

// 면적 포맷 (㎡ → 평)
function formatArea(sqm: number): string {
    return `${sqm.toFixed(1)}㎡ (${(sqm / 3.3058).toFixed(1)}평)`;
}

// 숫자 포맷 (1000 → 1,000)
function formatNumber(n: number): string {
    return n.toLocaleString('ko-KR');
}

interface BuildingPanelProps {
    onGenerateQuote?: () => void;
}

const BuildingPanel: React.FC<BuildingPanelProps> = ({ onGenerateQuote }) => {
    const { panelOpen, panelLoading, panelError, selectedBuilding, closePanel } = useMapStore();
    const { buildingInfo, isLoading: buildingLoading, loadingStep } = useBuildingStore();
    const loading = panelLoading || buildingLoading;

    if (!panelOpen) return null;

    return (
        <div
            className={`h-full flex flex-col overflow-hidden w-[440px] bg-zinc-950 border-l border-white/5 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[-10px_0_30px_rgba(0,0,0,0.5)]`}
        >
            {/* 패널 헤더 */}
            <div
                className="flex items-start justify-between shrink-0 p-5 px-6 border-b border-zinc-800"
            >
                <div className="flex flex-col gap-1 min-w-0">
                    {selectedBuilding && (
                        <span
                            className="self-start text-[10px] font-medium bg-[#C9A962]/25 border border-[#C9A962]/40 text-[#C9A962] px-2 py-0.5"
                        >
                            {buildingInfo?.mainPurpsCdNm || '건물'}
                        </span>
                    )}
                    <h2 className="text-xl font-semibold text-white truncate">
                        {buildingInfo?.bldNm || selectedBuilding?.buildingName || '건물 분석'}
                    </h2>
                    <p className="text-xs text-[#848484] truncate">
                        {selectedBuilding?.address}
                        {buildingInfo && ` | 지하${buildingInfo.ugrndFlrCnt}층~지상${buildingInfo.grndFlrCnt}층`}
                    </p>
                </div>
                <button
                    onClick={closePanel}
                    title="패널 닫기"
                    aria-label="패널 닫기"
                    className="shrink-0 flex items-center justify-center w-8 h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                >
                    <X className="w-3.5 h-3.5 text-zinc-400" />
                </button>
            </div>

            {/* 로딩 스켈레톤 대신 글로우 로더 적용 */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 flex-1">
                    <div className="relative flex items-center justify-center w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-2 border-[rgba(201,169,98,0.2)]"></div>
                        <div className="absolute inset-0 rounded-full border-t-2 border-[#C9A962] animate-spin"></div>
                        <Building2 className="w-5 h-5 text-[#C9A962] absolute animate-pulse" />
                    </div>
                    <p className="text-[13px] font-medium text-[#848484] animate-pulse">
                        {loadingStep || '프리미엄 데이터 조회 중...'}
                    </p>
                </div>
            )}

            {/* 에러 */}
            {panelError && !loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 px-6">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                    <p className="text-sm text-red-400 text-center">{panelError}</p>
                </div>
            )}

            {/* 콘텐츠 */}
            {!loading && !panelError && buildingInfo && (
                <div className="flex-1 overflow-y-auto">
                    {/* 건물 지표 카드 */}
                    <div
                        className="grid grid-cols-3 shrink-0 border-b border-zinc-800"
                    >
                        {[
                            { label: '연면적', value: `${formatNumber(Math.round(buildingInfo.totArea))}㎡` },
                            { label: '준공연도', value: buildingInfo.useAprDay?.substring(0, 4) || '-' },
                            { label: '주차', value: `${formatNumber(buildingInfo.totPkngCnt)}대`, highlight: true },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="flex flex-col gap-1 px-5 py-4 border-r border-zinc-800 bg-zinc-950 last:border-r-0"
                            >
                                <span className="text-[11px] text-zinc-400">{item.label}</span>
                                <span
                                    className={`text-lg font-semibold ${item.highlight ? 'text-[#C9A962]' : 'text-white'}`}
                                >
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* 건물 사진 플레이스홀더 (프리미엄 느낌) */}
                    <div className="p-5">
                        <div
                            className="w-full h-40 rounded-xl flex items-center justify-center overflow-hidden mb-2 relative bg-gradient-to-br from-[#C9A962]/10 to-[#C9A962]/5 border border-dashed border-[#C9A962]/30"
                        >
                            <Building2 className="w-8 h-8 text-[#C9A962] opacity-50" />
                            <div className="absolute bottom-2 right-3 text-[10px] text-[#C9A962]/60 font-medium">실거래가 연동 준비 중</div>
                        </div>
                    </div>
                </div>
            )}

            {/* CTA 버튼 */}
            {!loading && buildingInfo && (
                <div className="p-4 bg-zinc-950 border-t border-white/5 shrink-0 min-h-[80px]">
                    <button
                        onClick={onGenerateQuote}
                        title="호실 단위 상세 분석 및 견적 페이지 이동"
                        aria-label="투자가치 상세 분석 시작"
                        className="w-full flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#D4AF37] to-[#C9A962] rounded-lg py-3.5 shadow-[0_8px_20px_rgba(201,169,98,0.25)]"
                    >
                        <FileText className="w-5 h-5 text-zinc-950" />
                        <span className="text-base font-extrabold text-zinc-950 tracking-wide">호실 단위 상세 분석 및 견적</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default BuildingPanel;
