import React from 'react';
import { Target, AlertTriangle, CheckCircle2, TrendingUp, Landmark } from 'lucide-react';
import { calculateInvestmentFeasibility, calculateProFormaCashflow } from '@/utils/financial';
import { analyzeDealbreakers } from '@/utils/calculate';

interface ExecutiveSummaryProps {
    analyzedGroups: any[];
    assumptions: any;
}

export const ReportExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ analyzedGroups, assumptions }) => {
    const enrichedGroups = analyzedGroups.map(group => {
        // 대표 건물 하나 추출 (보통 1호실 기준이거나 합산)
        const building = group.buildingData;

        // 매매(투자) 시나리오 파라미터 구성
        const targetRooms = group.units || [];
        const totalPurchasePrice = targetRooms.reduce((acc: number, r: any) => acc + (assumptions.purchasePricePerPy * (r.area / 3.3058)), 0);
        const totalRent = targetRooms.reduce((acc: number, r: any) => acc + (assumptions.leaseRentPerPy * (r.area / 3.3058)), 0);
        const totalDeposit = targetRooms.reduce((acc: number, r: any) => acc + (assumptions.leaseDepositPerPy * (r.area / 3.3058)), 0);
        const loanAmount = Math.round(totalPurchasePrice * (assumptions.loanLtvInvest / 100));

        const params = {
            purchasePrice: totalPurchasePrice,
            deposit: totalDeposit,
            monthlyRent: totalRent,
            loanAmount: loanAmount,
            interestRate: assumptions.interestRate
        };

        const feasibility = calculateInvestmentFeasibility(params);
        const proforma = calculateProFormaCashflow(params);
        const dealbreakers = building ? analyzeDealbreakers(building) : [];

        return {
            ...group,
            feasibility,
            proforma,
            params,
            dealbreakers
        };
    });

    // 1. 최고 추천 대안 도출 (보통 수익률이 가장 높은 물건)
    // 부대비용 포함한 실질 자본환원율(Net Cap Rate)이나 세전현금흐름 ROI를 산출
    let bestCandidate: any = null;
    let bestRoi = -1;

    enrichedGroups.forEach((group) => {
        const hasDanger = group.dealbreakers.some((d: any) => d.type === 'danger');
        if (!hasDanger && group.proforma.equityROI > bestRoi) {
            bestRoi = group.proforma.equityROI;
            bestCandidate = group;
        }
    });

    if (!bestCandidate && enrichedGroups.length > 0) {
        // 치명적 리스크가 다 있다면 그냥 ROI 가장 높은 걸로
        bestCandidate = [...enrichedGroups].sort((a, b) => b.proforma.equityROI - a.proforma.equityROI)[0];
    }



    return (
        <div className="print-page w-[210mm] min-h-[297mm] p-[15mm] flex flex-col relative page-break-after bg-white">
            {/* Header */}
            <div className="border-b-[3px] border-slate-900 pb-4 mb-8">
                <h2 className="text-sm font-black text-slate-500 tracking-widest uppercase mb-1">SECTION 1</h2>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">타당성 종합 검토 (Executive Summary)</h1>
            </div>

            {/* 최우선 추천 (Strong Buy) */}
            {bestCandidate && (
                <div className="mb-10 bg-slate-50 border border-slate-200 p-6 rounded-none relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <Target className="w-5 h-5 text-blue-600" />
                        <h3 className="text-xl font-bold text-slate-900">종합 최우선 추천 대안 (Top Pick)</h3>
                    </div>

                    <div>
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 uppercase tracking-wider mb-2">Strong Buy</span>
                        <div className="text-2xl font-black text-slate-900">
                            Option {analyzedGroups.findIndex(g => g.groupId === bestCandidate.groupId) + 1} - {bestCandidate.buildingData?.bldNm || '건물명 없음'}
                        </div>
                    </div>
                </div>
            )}

            {/* 비교 요약 테이블 (Pro Forma Summary) */}
            <div className="mb-10">
                <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-800">핵심 대안 비교표 (Core Metrics)</h3>
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr>
                            <th className="border-b-2 border-slate-900 py-3 px-2 text-left font-bold text-slate-700">대안 (Option)</th>
                            <th className="border-b-2 border-slate-900 py-3 px-2 text-right font-bold text-slate-700">추정 매매가</th>
                            <th className="border-b-2 border-slate-900 py-3 px-2 text-right font-bold text-slate-700">필요 자기자본(Equity)</th>
                            <th className="border-b-2 border-slate-900 py-3 px-2 text-right font-bold text-slate-700">Cap Rate</th>
                            <th className="border-b-2 border-slate-900 py-3 px-2 text-right font-bold text-slate-700">세전 ROI (BTCF)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {enrichedGroups.map((op, idx) => (
                            <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                                <td className="py-3 px-2 font-bold text-slate-800">
                                    {idx + 1}. {op.buildingData?.bldNm}
                                </td>
                                <td className="py-3 px-2 text-right font-medium text-slate-600">
                                    {Math.round(op.params.purchasePrice).toLocaleString()}만
                                </td>
                                <td className="py-3 px-2 text-right font-black text-blue-600">
                                    {Math.round(op.feasibility.netEquity).toLocaleString()}만
                                </td>
                                <td className="py-3 px-2 text-right font-bold text-slate-700">
                                    {op.proforma.capRate.toFixed(1)}%
                                </td>
                                <td className="py-3 px-2 text-right font-bold text-slate-900">
                                    {op.proforma.equityROI.toFixed(1)}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 리스크 매트릭스 (Dealbreakers) */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    치명적 단점 및 리스크 매트릭스 (Red Flags)
                </h3>
                <div className="space-y-4">
                    {enrichedGroups.map((op, idx) => (
                        <div key={idx} className="p-4 bg-white border border-slate-200">
                            <div className="font-bold text-slate-800 mb-2">Option {idx + 1}. {op.buildingData?.bldNm}</div>
                            {op.dealbreakers.length > 0 ? (
                                <ul className="space-y-2">
                                    {op.dealbreakers.map((db: any, dIdx: number) => (
                                        <li key={dIdx} className="flex items-start gap-2 text-sm">
                                            {db.type === 'danger' ?
                                                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> :
                                                <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />}
                                            <div>
                                                <strong className={db.type === 'danger' ? 'text-red-700' : 'text-orange-700'}>[{db.title}]</strong>
                                                <span className="text-slate-600 ml-2">{db.description}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                                    <CheckCircle2 className="w-4 h-4" />
                                    치명적 단점 발견되지 않음 (Clear)
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-6 text-right">
                <p className="text-[10px] text-slate-400 font-mono">CONFIDENTIAL - DO NOT DISTRIBUTE</p>
            </div>
        </div>
    );
};
