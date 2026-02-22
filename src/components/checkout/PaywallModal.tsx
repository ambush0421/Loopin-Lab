'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCompareStore } from '@/stores/useCompareStore';
import { X, CheckCircle2, Lock, FileText, Download, Building2, UserCircle } from 'lucide-react';
import { useEffect } from 'react';

export function PaywallModal() {
    const { isPaywallOpen, setPaywallOpen, compareGroups } = useCompareStore();

    useEffect(() => {
        // Prevent body scroll when paywall is open
        if (isPaywallOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isPaywallOpen]);

    if (!isPaywallOpen) return null;

    return (
        <AnimatePresence>
            {isPaywallOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        onClick={() => setPaywallOpen(false)}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
                    >
                        <button
                            title="결제창 닫기"
                            onClick={() => setPaywallOpen(false)}
                            className="absolute top-4 right-4 z-10 p-2 bg-white/50 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>

                        {/* Left: Premium Value Prop (Dark) */}
                        <div className="md:w-5/12 bg-slate-900 text-white p-10 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500 blur-3xl opacity-20 rounded-full" />
                            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500 blur-3xl opacity-20 rounded-full" />

                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                                    <Lock className="w-3.5 h-3.5" />
                                    Premium Analytic Report
                                </div>
                                <h2 className="text-3xl font-extrabold leading-tight mb-4">
                                    가장 완벽한<br />투자의사결정 지표.
                                </h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                    전문 회계사와 금융 전문가의 로직이 반영된 렌트프리 환산 실사용 평당 단가(NOC) 및 NPV/IRR 타당성 분석표를 확인하세요.
                                </p>

                                <div className="space-y-4">
                                    {[
                                        "선택한 매물 간의 3년 누적 현금흐름 비교",
                                        "숨은 세금(취·등록세 포함) 삭감 후 실 수익률",
                                        "대출 레버리지 변화에 따른 스트레스 시뮬레이션",
                                        "투자가치 종합 요약 한장(One-Pager) PDF 다운로드"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                            <span className="text-sm font-medium text-slate-200">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative z-10 mt-12 hidden md:block">
                                <p className="text-xs text-slate-500">
                                    현재 <strong className="text-blue-400">{compareGroups.length}개</strong>의 매물 비교 분석표가 준비되었습니다.
                                </p>
                            </div>
                        </div>

                        {/* Right: Checkout Flow */}
                        <div className="md:w-7/12 p-10 flex flex-col justify-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">원하시는 요금제를 선택하세요</h3>

                            <div className="space-y-4">
                                {/* Option A: Single */}
                                <div className="relative border-2 border-slate-200 hover:border-blue-500 bg-white rounded-2xl p-6 cursor-pointer transition-all group hover:shadow-md">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                                단건 결제 패스
                                            </h4>
                                            <p className="text-sm text-slate-500 mt-1">현재 담은 매물 비교 보고서 소장</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-slate-900">₩4,900</span>
                                            <span className="text-xs text-slate-400 block">/ 1건 다운로드</span>
                                        </div>
                                    </div>
                                    <button className="w-full mt-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors flex justify-center items-center gap-2">
                                        <Download className="w-4 h-4" /> 지금 결제하고 PDF 받기
                                    </button>
                                </div>

                                {/* Option B: Subscription (B2B) */}
                                <div className="relative border-2 border-blue-500 bg-blue-50/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(59,130,246,0.15)] cursor-pointer transition-all group">
                                    <div className="absolute top-0 right-6 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                        Most Popular for B2B
                                    </div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                                                <Building2 className="w-5 h-5 text-blue-600" />
                                                중개법인 프로 플랜
                                            </h4>
                                            <p className="text-sm text-slate-600 mt-1">전문가를 위한 무제한 생성 솔루션</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-blue-600">₩49,000</span>
                                            <span className="text-xs text-slate-500 block">/ 매월 (언제든 취소 가능)</span>
                                        </div>
                                    </div>
                                    <ul className="mt-4 mb-5 space-y-2">
                                        <li className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                            <span className="font-bold">무제한</span> 비교 견적서 열람 및 다운로드
                                        </li>
                                        <li className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <UserCircle className="w-4 h-4 text-blue-500" />
                                            PDF 하단 <span>맞춤형 브랜드 워터마크(로고/연락처) 추가</span>
                                        </li>
                                    </ul>
                                    <button className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-colors flex justify-center items-center gap-2">
                                        프로 구독 시작하기
                                    </button>
                                </div>
                            </div>

                            <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1">
                                <Lock className="w-3 h-3" /> 안전한 결제 환경 (Toss Payments 연동 완료)
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
