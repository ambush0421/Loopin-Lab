'use client';

import { useCompareStore } from '@/stores/useCompareStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Layers, Trash2 } from 'lucide-react';
import { PaywallModal } from '../checkout/PaywallModal';

export function CompareCartBar() {
    const { compareGroups, removeGroup, setDashboardOpen } = useCompareStore();

    return (
        <>
            <AnimatePresence>
                {compareGroups.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-5xl"
                    >
                        <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-6 backdrop-blur-md bg-opacity-90">

                            {/* Left: Info */}
                            <div className="flex items-center gap-4 flex-1 max-w-[250px]">
                                <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                                    <Layers className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                        비교 옵션 <span className="bg-blue-500/30 text-blue-300 text-xs px-2 py-0.5 rounded-full">{compareGroups.length} / 5</span>
                                    </h3>
                                    <p className="text-slate-400 text-[11px]">최대 5개의 옵션을 심층 분석</p>
                                </div>
                            </div>

                            {/* Middle: Selected Items Preview */}
                            <div className="hidden lg:flex flex-1 gap-2 overflow-x-auto min-w-0">
                                {compareGroups.map((g, i) => (
                                    <div key={g.groupId} className="bg-slate-800 rounded-lg px-3 py-2 flex-1 relative group border border-slate-700 min-w-[120px] max-w-[160px]">
                                        <div className="flex justify-between items-start mb-1 h-5">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-blue-300 whitespace-nowrap">
                                                {g.scenario === 'LEASE' ? '임대' : g.scenario === 'PURCHASE_USE' ? '실입주' : '투자가치'}
                                            </span>
                                            <button
                                                title="옵션 삭제"
                                                onClick={() => removeGroup(g.groupId)}
                                                className="bg-slate-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all shadow-md z-10"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-white font-bold text-xs truncate" title={g.groupName}>{g.groupName}</p>
                                        <p className="text-slate-400 text-[10px] truncate" title={g.buildingData?.bldNm || g.address}>
                                            {g.buildingData?.bldNm || g.address.split(' ').slice(0, 3).join(' ')}
                                        </p>
                                    </div>
                                ))}
                                {/* Empty placeholders */}
                                {Array.from({ length: Math.max(0, 5 - compareGroups.length) }).map((_, i) => (
                                    <div key={`empty-${i}`} className="bg-slate-800/50 border border-slate-700 border-dashed rounded-lg px-3 py-2 flex-1 flex items-center justify-center min-w-[90px] max-w-[160px]">
                                        <span className="text-slate-600 text-xs">비어있음</span>
                                    </div>
                                ))}
                            </div>

                            {/* Right: CTA */}
                            <div className="shrink-0">
                                <button
                                    onClick={() => setDashboardOpen(true)}
                                    disabled={compareGroups.length < 2}
                                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${compareGroups.length >= 2
                                        ? 'bg-blue-500 hover:bg-blue-400 text-white hover:scale-105 active:scale-95'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        }`}
                                >
                                    {compareGroups.length >= 2 ? '최종 옵션 비교 대시보드 보기' : '옵션 2개 이상 담기'}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <PaywallModal />
        </>
    );
}
