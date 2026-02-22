'use client';

import { Building, Search, ArrowRight, ShieldCheck, BarChart3, FileBadge } from 'lucide-react';
import { motion } from 'framer-motion';

interface LandingHeroProps {
    addressInput: string;
    setAddressInput: (value: string) => void;
    onSearch: (query?: string) => void;
    showPostcode: boolean;
    postcodeRef: React.RefObject<HTMLDivElement | null>;
    onClosePostcode: () => void;
}

export function LandingHero({
    addressInput,
    setAddressInput,
    onSearch,
    showPostcode,
    postcodeRef,
    onClosePostcode,
}: LandingHeroProps) {
    return (
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-slate-50">
            {/* Premium Animated Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40"></div>
            <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-multiply">
                <div className="absolute -left-24 -top-16 h-[500px] w-[500px] rounded-full bg-slate-400/20 blur-[100px]" />
                <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-sky-200/40 blur-[120px]" />
                <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-blue-100/50 blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-5xl px-4 py-20 text-center md:py-32">
                {/* Trust Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 flex justify-center"
                >
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-2 backdrop-blur-md shadow-sm">
                        <ShieldCheck className="h-4 w-4 text-slate-800" />
                        <span className="text-sm font-bold text-slate-800 tracking-wide">성공적인 기업 이전과 상업용 부동산 투자를 위한 필수 데이터 솔루션</span>
                    </div>
                </motion.div>

                {/* Main Copy */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-6 text-5xl font-black tracking-tight text-slate-900 md:text-7xl leading-[1.15]"
                >
                    클릭 한 번으로 끝내는<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900">
                        완벽한 임대차 및 매입 타당성 분석
                    </span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mx-auto mb-12 max-w-2xl text-lg md:text-xl text-slate-600 font-medium leading-relaxed"
                >
                    건축물대장부터 층별 적정 임대료, 현금흐름(NOC/ROI) 시뮬레이션까지.<br className="hidden md:block" />C-Level 경영진의 확실한 의사결정을 돕는 프리미엄 비교 리포트.
                </motion.p>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
                    className="relative mx-auto max-w-3xl"
                >
                    <div className="flex flex-col sm:flex-row items-center gap-2 rounded-2xl md:rounded-full border-4 border-white bg-white/80 p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] backdrop-blur-xl transition-all focus-within:ring-4 focus-within:ring-blue-100">
                        <div className="hidden md:flex pl-5 pr-2 text-blue-600">
                            <Search className="h-6 w-6" />
                        </div>
                        <input
                            type="text"
                            value={addressInput}
                            onChange={(e) => setAddressInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onSearch(addressInput.trim());
                                }
                            }}
                            placeholder="건물명 또는 지번/도로명 주소를 입력하세요 (예: 강남파이낸스센터)"
                            className="w-full flex-1 bg-transparent p-4 text-lg md:text-xl text-slate-800 outline-none placeholder:text-slate-400 font-bold"
                            autoFocus
                        />
                        <button
                            onClick={() => onSearch(addressInput.trim())}
                            className="w-full sm:w-auto rounded-xl md:rounded-full bg-slate-900 px-10 py-4 text-lg font-black text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] hover:bg-slate-800 flex items-center justify-center gap-2"
                        >
                            주소 검색하고 분석 시작하기 <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Postcode Dropdown */}
                    {showPostcode && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 450, y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            className="absolute left-0 right-0 top-[110%] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 backdrop-blur-sm">
                                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Building className="h-4 w-4 text-blue-500" /> 정확한 주소를 선택해주세요
                                </span>
                                <button
                                    onClick={onClosePostcode}
                                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm border border-slate-200 transition-all hover:bg-slate-100 hover:text-slate-900"
                                >
                                    닫기
                                </button>
                            </div>
                            <div ref={postcodeRef} className="w-full bg-white" style={{ height: 'calc(100% - 49px)' }} />
                        </motion.div>
                    )}
                </motion.div>

                {/* Micro Features / Social Proof */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="mt-16 flex flex-wrap justify-center gap-8 text-slate-500"
                >
                    {[
                        { icon: Building, text: "공공데이터 100% 실시간 연동" },
                        { icon: BarChart3, text: "경영진 피칭용 핵심 지표(KPI)" },
                        { icon: FileBadge, text: "비교 대시보드 및 PDF 출력" }
                    ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm font-semibold">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 text-slate-700">
                                <feature.icon className="h-4 w-4" />
                            </div>
                            {feature.text}
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
