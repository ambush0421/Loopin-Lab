import React from 'react';
import { PieChart, ShieldCheck } from 'lucide-react';
import { CompareGroup } from '@/stores/useCompareStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

interface ReportSummaryDashboardProps {
    analyzedGroups: any[];
    chartData: any[];
    assumptions: any;
    colors: string[];
}

export const ReportSummaryDashboard: React.FC<ReportSummaryDashboardProps> = ({ analyzedGroups, chartData, assumptions, colors }) => {
    return (
        <div className="print-page w-[210mm] h-[297mm] p-[15mm] flex flex-col relative page-break-after bg-white">
            {/* Header */}
            <div className="border-b-[3px] border-slate-900 pb-4 mb-6 flex justify-between items-end shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="bg-slate-900 text-white p-1.5 rounded-lg">
                            <PieChart className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">상업용 부동산 옵션 통합 비교 (Executive Summary)</h1>
                    </div>
                    <p className="text-xs font-bold text-slate-500 pl-10">BuildingReportPro™ 의사결정 패키지</p>
                </div>
                <div className="text-right">
                    <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-200">
                        <ShieldCheck className="w-3 h-3" /> 인증된 실거래가 기반
                    </div>
                </div>
            </div>

            <div className="mb-4 shrink-0">
                <p className="text-sm font-bold text-slate-800 leading-relaxed text-justify bg-slate-50 p-3 rounded-lg border border-slate-200">
                    본 장에서는 검토 중인 <strong>총 {analyzedGroups.length}개의 주요 대안</strong>에 대한 시나리오별(임대차/실입주/투자) 재무 타당성 지표를 요약합니다.
                    선택된 옵션들의 핵심 요약(KPI)과 월별 현금흐름 비교군을 한눈에 살펴보세요.
                </p>
            </div>

            <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2 shrink-0">
                <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                요약 대시보드 (Dashboard)
            </h2>

            {/* 5-Column Grid */}
            <div className="grid grid-cols-5 gap-3 shrink-0 mb-6">
                {analyzedGroups.map((group) => (
                    <div key={group.groupId} className="bg-white rounded-xl border border-slate-200 flex flex-col relative overflow-hidden">
                        {/* Header */}
                        <div className="p-3 border-b border-slate-100 bg-slate-50 relative overflow-hidden h-28">
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${group.scenario === 'LEASE' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    group.scenario === 'PURCHASE_USE' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                                        'bg-emerald-100 text-emerald-800 border-emerald-200'
                                    }`}>
                                    {group.scenario === 'LEASE' ? '🏢 임대차' : group.scenario === 'PURCHASE_USE' ? '🏭 매매(실입주)' : '💰 매매(투자)'}
                                </span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-[11px] leading-snug mb-1 relative z-10 line-clamp-2">
                                {group.groupName}
                            </h3>
                            <p className="text-[9px] text-slate-500 relative z-10 truncate mb-1">
                                {group.buildingData?.bldNm || group.address.split(' ').slice(0, 2).join(' ')}
                            </p>
                            <div className="inline-flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                <span className="text-slate-500">전용</span>
                                <span className="text-slate-800">{group.totalPyung.toFixed(1)}평</span>
                            </div>
                        </div>
                        {/* Metrics */}
                        <div className="p-3 flex-1 flex flex-col gap-3">
                            <div>
                                <p className="text-[9px] font-semibold text-slate-500 mb-0.5">{group.kpi1.label}</p>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-sm font-black">{group.kpi1.value}</span>
                                    <span className="text-[9px] font-bold text-slate-400">{group.kpi1.unit}</span>
                                </div>
                            </div>
                            <div className="w-full h-px bg-slate-100" />
                            <div>
                                <p className="text-[9px] font-semibold text-slate-500 mb-0.5">{group.kpi2.label}</p>
                                <div className="flex items-baseline gap-0.5">
                                    <span className={`text-sm font-black ${group.scenario === 'PURCHASE_INVEST' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                        {group.kpi2.value}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400">{group.kpi2.unit}</span>
                                </div>
                            </div>
                            <div className="w-full h-px bg-slate-100" />
                            <div>
                                <p className="text-[9px] font-semibold text-slate-500 mb-0.5">{group.kpi3.label}</p>
                                <div className="flex items-baseline gap-0.5">
                                    <span className={`text-sm font-black ${group.scenario === 'PURCHASE_INVEST' ? 'text-emerald-600' :
                                        group.scenario === 'PURCHASE_USE' ? 'text-indigo-600' :
                                            'text-blue-600'
                                        }`}>
                                        {group.kpi3.value}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400">{group.kpi3.unit}</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-1 w-full" style={{ backgroundColor: colors[group.index % colors.length] }} />
                    </div>
                ))}
            </div>

            <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2 shrink-0">
                <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                옵션 간 월간 캐시플로우 비교
            </h2>

            {/* Visual Comparison Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 shrink-0 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        barGap={6}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(val) => `${(val / 10000).toLocaleString()}억`} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <RechartsTooltip
                            formatter={(value: any) => [`${Number(value || 0).toLocaleString()} 만원`, '']}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <Bar dataKey="월 지출(비용)" radius={[2, 2, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-cost-${index}`} fill={entry.scenario === 'PURCHASE_INVEST' ? '#f87171' : colors[index % colors.length]} fillOpacity={entry.scenario === 'PURCHASE_INVEST' ? 0.3 : 1} />
                            ))}
                        </Bar>
                        <Bar dataKey="월 수익(수입)" fill="#10b981" radius={[2, 2, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Disclaimer Footer Page 1 */}
            <div className="mt-auto border flex gap-3 bg-slate-50 border-slate-200 rounded-xl p-3 items-center">
                <ShieldCheck className="w-10 h-10 text-slate-300 shrink-0" />
                <div>
                    <h4 className="text-[10px] font-black text-slate-700 mb-0.5">데이터 공신력 인증 및 기본 가정</h4>
                    <p className="text-[9px] text-slate-500">국토교통부 실거래가 공개시스템 및 소상공인시장진흥공단 데이터를 기반으로 추정되었습니다. 법적 증빙 효력은 없습니다.<br />
                        <strong>기준 사항:</strong> 매매 LTV(실입주 {assumptions.loanLtvUse}%, 투자 {assumptions.loanLtvInvest}%), 대출금리 연 {assumptions.interestRate}%, 평당 임대보증금 {assumptions.leaseDepositPerPy}만
                    </p>
                </div>
            </div>
        </div>
    );
};
