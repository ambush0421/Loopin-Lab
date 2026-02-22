"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Calculator, Save, FileText, X } from 'lucide-react';

import { useBuildingStore } from '@/stores/buildingStore';
import { useRoomStore } from '@/stores/roomStore';
import { useMapStore } from '@/stores/mapStore';

interface AnalyzePageProps {
    params: Promise<{ id: string }>;
}

// 숫자 포맷 (1000 → 1,000)
function formatNumber(n: number): string {
    return n.toLocaleString('ko-KR');
}

export default function AnalyzePage({ params }: AnalyzePageProps) {
    const router = useRouter();
    const resolvedParams = use(params);
    const { id } = resolvedParams; // Format: sigunguCd-bjdongCd-bun-ji

    const { buildingInfo, setBuildingInfo } = useBuildingStore();
    const {
        allRooms,
        setAllRooms,
        reset: resetRoom,
        selectedRooms,
        addRoom,
        removeRoom,
        updateRoomFinancial,
        totalFinancials,
        getInvestmentAnalysis,
    } = useRoomStore();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            setError(null);

            // id 형식 검증
            const parts = id.split('-');
            if (parts.length !== 4) {
                setError('유효하지 않은 건물 식별자입니다.');
                setLoading(false);
                return;
            }

            const [sigunguCd, bjdongCd, bun, ji] = parts;

            // 이미 스토어에 데이터가 있고, 식별자가 일치한다면(간단히 검사) 스킵
            // (정확한 매칭은 복잡하므로, 일단 buildingInfo가 있으면 무시하거나 새로 불러옵니다)
            // 여기서는 항상 새로 불러오는 것이 안전할 수 있으나, 탐색 뷰에서 넘어올 때의 속도를 위해
            // 데이터가 이미 렌더링되어 있다면 API 호출을 생략할 수도 있습니다.
            // 임시로 무조건 새로 패치하거나 캐시를 사용할 수 있습니다.

            try {
                const res = await fetch(`/api/building-ledger?sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&bun=${bun}&ji=${ji}`);
                if (!res.ok) throw new Error('건물 데이터를 불러오는데 실패했습니다.');
                const result = await res.json();

                if (!result.success) {
                    throw new Error(result.error || '데이터 조회 실패');
                }

                if (result.data?.summary) {
                    setBuildingInfo(result.data.summary);
                }

                resetRoom();
                if (result.data?.rooms?.length > 0) {
                    setAllRooms(result.data.rooms);
                }

            } catch (err: any) {
                setError(err.message || '알 수 없는 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        }

        // 스토어에 이미 데이터가 있으면 로딩 완료 처리 (최적화)
        // 실제 운영 환경에서는 ID 일치 여부를 꼼꼼히 따져야 합니다.
        if (buildingInfo && allRooms.length > 0) {
            setLoading(false);
            // 선택 사항: 백그라운드에서 업데이트
        } else {
            loadData();
        }
    }, [id, buildingInfo, allRooms.length, setBuildingInfo, setAllRooms, resetRoom]);

    const analysis = React.useMemo(() => {
        if (selectedRooms.length === 0 || totalFinancials.salePrice === 0) return null;
        return getInvestmentAnalysis();
    }, [selectedRooms, totalFinancials, getInvestmentAnalysis]);

    if (loading) {
        return (
            <div className="h-screen bg-[#0A0A0A] flex flex-col items-center justify-center relative overflow-hidden">
                {/* 배경 글로우 효과 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C9A962]/5 rounded-full blur-[100px]"></div>

                <div className="flex items-center justify-center mb-8 relative z-10 w-24 h-24">
                    <div className="absolute inset-0 rounded-full border border-[#C9A962]/20"></div>
                    <div className="absolute inset-0 rounded-full border-t border-[#C9A962] animate-[spin_2s_linear_infinite]"></div>
                    <div className="absolute inset-2 rounded-full border border-[#C9A962]/20 animate-[spin_3s_linear_infinite_reverse]"></div>
                    <Building2 className="w-8 h-8 text-[#C9A962] animate-pulse" />
                </div>

                <div className="text-center relative z-10 space-y-3">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-[#E0E0E0] to-[#848484] animate-pulse">
                        건물 및 호실 데이터 분석 중
                    </h2>
                    <p className="text-[13px] text-[#A0A0A0] max-w-[280px] leading-relaxed mx-auto">
                        공공기관 건축물대장 및 실거래가<br />데이터를 실시간으로 취합하고 있습니다.
                    </p>
                </div>

                {/* 하단 로딩 바 */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-[#1A1A1A]">
                    <div className="h-full bg-gradient-to-r from-transparent via-[#C9A962] to-transparent w-1/2 animate-[progress_2s_ease-in-out_infinite]"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
                <p className="text-red-400 font-medium mb-4">{error}</p>
                <button
                    onClick={() => router.push('/explore')}
                    className="px-6 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#2A2A2A] transition-colors"
                >
                    돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#0A0A0A] flex flex-col text-white font-sans overflow-hidden">
            {/* Header */}
            <header className="h-[60px] shrink-0 border-b border-white/10 bg-[#111111] flex items-center px-6 justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/explore')}
                        title="탐색 페이지로 돌아가기"
                        aria-label="뒤로 가기"
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#848484]" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#C9A962]/10 border border-[#C9A962]/30 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-[#C9A962]" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold">{buildingInfo?.bldNm || '건물명 없음'}</h1>
                            <p className="text-[11px] text-[#848484]">{buildingInfo?.platPlc}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        title="수익률 계산기"
                        aria-label="수익률 계산기"
                        className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-white/10 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Calculator className="w-4 h-4 text-[#848484]" />
                        <span>수익률 계산기</span>
                    </button>
                    <button
                        onClick={() => router.push('/report')}
                        title="보고서 생성하기"
                        aria-label="보고서 생성"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C9A962] hover:opacity-90 rounded-lg text-sm font-bold text-[#111111] transition-opacity"
                    >
                        <FileText className="w-4 h-4" />
                        <span>보고서 생성</span>
                    </button>
                </div>
            </header>

            {/* Main Layout: 3 Columns (Filters, Grid, Financials) */}
            <main className="flex-1 min-h-0 flex">

                {/* 왼쪽 사이드바: 층/호실 필터 및 요약 */}
                <aside className="w-[280px] shrink-0 border-r border-white/10 bg-[#111111]/50 p-6 overflow-y-auto">
                    <h2 className="text-xs font-bold text-[#848484] mb-4 uppercase tracking-wider">건물 요약 지표</h2>
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-[#1A1A1A] border border-white/5">
                            <p className="text-xs text-[#848484] mb-1">연면적</p>
                            <p className="text-lg font-semibold">{buildingInfo?.totArea?.toLocaleString()} ㎡</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[#1A1A1A] border border-white/5">
                            <p className="text-xs text-[#848484] mb-1">주차대수</p>
                            <p className="text-lg font-semibold">{buildingInfo?.totPkngCnt} 대</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[#1A1A1A] border border-white/5">
                            <p className="text-xs text-[#848484] mb-1">총 호실</p>
                            <p className="text-lg font-semibold">{allRooms.length} 개</p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-xs font-bold text-[#848484] mb-4 uppercase tracking-wider">필터</h2>
                        <div className="p-4 rounded-xl border border-dashed border-white/20 text-center text-sm text-[#848484]">
                            층별 필터 등 UI 구현 예정
                        </div>
                    </div>
                </aside>

                {/* 중앙 콘텐츠: 호실 그리드 뷰 */}
                <section className="flex-1 min-w-0 p-8 overflow-y-auto bg-[#0A0A0A]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">호실 상세 선택</h2>
                        <div className="text-sm text-[#848484]">
                            분석할 호실을 클릭하세요
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {allRooms.map((room) => {
                            const isSelected = selectedRooms.some(r => r.id === room.id);
                            return (
                                <button
                                    key={room.id}
                                    onClick={() => isSelected ? removeRoom(room.id) : addRoom(room.id)}
                                    className={`p-4 rounded-xl border transition-all text-left ${isSelected
                                        ? 'bg-[#C9A962]/10 border-[#C9A962] shadow-[0_4px_12px_rgba(201,169,98,0.2)]'
                                        : 'bg-[#161616] border-white/5 hover:border-[#C9A962]/50 hover:bg-[#C9A962]/5'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`text-sm font-bold ${isSelected ? 'text-[#C9A962]' : 'group-hover:text-[#C9A962]'}`}>{room.hoNm}</span>
                                        <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-[#848484]">{room.mainPurpsCdNm || '용도미상'}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[#6A6A6A]">전용면적</span>
                                            <span className="font-medium">{room.area.toFixed(1)}㎡</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[#6A6A6A]">공용면적</span>
                                            <span className="font-medium">{room.commonArea?.toFixed(1) || 0}㎡</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* 우측 사이드바: 재무 시뮬레이션 (ProForma) */}
                <aside className="w-[360px] shrink-0 border-l border-white/10 bg-[#111111]/80 p-6 overflow-y-auto shadow-2xl flex flex-col">
                    <h2 className="text-xs font-bold text-[#848484] mb-6 uppercase tracking-wider">ProForma 시뮬레이션</h2>

                    <div className="flex-1 space-y-6">
                        {/* 금액입력 */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold border-b border-white/10 pb-2 flex items-center justify-between">
                                <span>매입/임대 가정</span>
                                {selectedRooms.length > 0 && <span className="text-xs text-[#C9A962] font-medium">{selectedRooms.length}개 선택됨</span>}
                            </h3>

                            {selectedRooms.length === 0 ? (
                                <div className="p-6 border border-dashed border-[#C9A962]/30 rounded-xl bg-[#C9A962]/5 text-center transition-all">
                                    <p className="text-sm text-[#C9A962] font-medium mb-1">분석할 호실을 클릭하세요</p>
                                    <p className="text-[11px] text-[#848484]">선택한 호실의 매매 및 임대 조건을<br />입력하여 수익률을 시뮬레이션 합니다.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* 매매가 */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-[#A0A0A0]">매매가 (단위: 만원)</label>
                                        <input
                                            type="text"
                                            value={totalFinancials.salePrice === 0 ? '' : formatNumber(totalFinancials.salePrice)}
                                            onChange={(e) => {
                                                const raw = Number(e.target.value.replace(/[^0-9]/g, ""));
                                                // 임시: 첫 번째 선택된 방에 몰아줌 (UI 편의상)
                                                // 실제로는 각 호실별 입력 폼을 분리하거나 비율로 분배해야 하지만, MVP에선 통합 입력
                                                updateRoomFinancial(selectedRooms[0].id, 'salePrice', raw);
                                            }}
                                            className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-right font-medium text-white focus:outline-none focus:border-[#C9A962] transition-colors"
                                            placeholder="예: 50,000"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-[#A0A0A0]">임대 보증금 (단위: 만원)</label>
                                        <input
                                            type="text"
                                            value={totalFinancials.deposit === 0 ? '' : formatNumber(totalFinancials.deposit)}
                                            onChange={(e) => updateRoomFinancial(selectedRooms[0].id, 'deposit', Number(e.target.value.replace(/[^0-9]/g, "")))}
                                            className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-right font-medium text-white focus:outline-none focus:border-[#C9A962] transition-colors"
                                            placeholder="예: 5,000"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-[#A0A0A0]">월 임대료 (단위: 만원)</label>
                                        <input
                                            type="text"
                                            value={totalFinancials.monthlyRent === 0 ? '' : formatNumber(totalFinancials.monthlyRent)}
                                            onChange={(e) => updateRoomFinancial(selectedRooms[0].id, 'monthlyRent', Number(e.target.value.replace(/[^0-9]/g, "")))}
                                            className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-right font-medium text-white focus:outline-none focus:border-[#C9A962] transition-colors"
                                            placeholder="예: 300"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 요약 지표 */}
                        {selectedRooms.length > 0 && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-sm font-semibold border-b border-white/10 pb-2">수익률 분석</h3>

                                {analysis && analysis.grossYield > 0 ? (
                                    <div className="p-5 rounded-xl bg-gradient-to-b from-[#1A1A1A] to-[#111111] border border-[#C9A962]/30 space-y-4 shadow-[0_4px_24px_rgba(201,169,98,0.1)] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A962]/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>

                                        <div className="flex justify-between items-end">
                                            <span className="text-sm text-[#848484]">예상 Cap Rate (Gross)</span>
                                            <span className="text-2xl font-bold text-[#C9A962]">
                                                {analysis.grossYield.toFixed(2)}%
                                            </span>
                                        </div>

                                        <div className="h-px w-full bg-white/5 relative">
                                            <div className="absolute top-0 left-0 h-full bg-[#C9A962]/30" style={{ width: `${Math.min(analysis.grossYield * 10, 100)}%` }}></div>
                                        </div>

                                        <div className="flex justify-between items-center text-[13px]">
                                            <span className="text-[#848484]">월 순임대료(NOC 추정)</span>
                                            <span className="font-medium text-white">
                                                {formatNumber(Math.round(totalFinancials.monthlyRent * 10000 / selectedRooms.reduce((acc, r) => acc + (r.area / 3.3058), 0)))} 원/평
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-[#0A0A0A] border border-white/5">
                                        <p className="text-center text-xs text-[#6A6A6A]">조건을 입력하면<br />수익률이 자동 계산됩니다.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 선택 호실 칩스 (하단 고정) */}
                    {selectedRooms.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-white/10 shrink-0">
                            <p className="text-[10px] text-[#6A6A6A] mb-2 uppercase text-center tracking-widest">Selected Unit{selectedRooms.length > 1 && 's'}</p>
                            <div className="flex flex-wrap gap-1.5 justify-center max-h-24 overflow-y-auto">
                                {selectedRooms.map((r) => (
                                    <span key={r.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#1A1A1A] border border-white/10 text-xs font-medium text-[#E0E0E0]">
                                        {r.hoNm}
                                        <button onClick={() => removeRoom(r.id)} className="hover:text-red-400 focus:outline-none">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

            </main>
        </div>
    );
}
