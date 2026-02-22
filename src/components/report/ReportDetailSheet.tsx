import React from 'react';
import { Building2, Calculator, Receipt, TrendingUp } from 'lucide-react';
import { calculateInvestmentFeasibility, calculateProFormaCashflow } from '@/utils/financial';

interface ReportDetailSheetProps {
    group: any;
    pageIndex: number;
    assumptions: any;
}

export const ReportDetailSheet: React.FC<ReportDetailSheetProps> = ({ group, pageIndex, assumptions }) => {
    // 매매(투자) 시나리오 파라미터 구성
    const targetRooms = group.units || [];
    const totalPurchasePrice = targetRooms.reduce((acc: number, r: any) => acc + (assumptions.purchasePricePerPy * (r.area / 3.3058)), 0);
    const totalRent = targetRooms.reduce((acc: number, r: any) => acc + (assumptions.leaseRentPerPy * (r.area / 3.3058)), 0);
    const totalDeposit = targetRooms.reduce((acc: number, r: any) => acc + (assumptions.leaseDepositPerPy * (r.area / 3.3058)), 0);

    // 임대차 제외, 매매(실입주/투자)에 따른 LTV 다르게 적용
    const ltv = group.scenario === 'PURCHASE_INVEST' ? assumptions.loanLtvInvest : assumptions.loanLtvUse;
    const loanAmount = Math.round(totalPurchasePrice * (ltv / 100));

    const params = {
        purchasePrice: totalPurchasePrice,
        deposit: totalDeposit,
        monthlyRent: totalRent,
        loanAmount: loanAmount,
        interestRate: assumptions.interestRate
    };

    const feasibility = calculateInvestmentFeasibility(params);
    const proforma = calculateProFormaCashflow(params);

    return (
        <div className="print-page w-[210mm] min-h-[297mm] p-[15mm] flex flex-col relative page-break-after bg-white">
            {/* Header */}
            <div className="border-b-[3px] border-slate-900 pb-3 mb-6 flex justify-between items-end shrink-0">
                <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border mb-2 inline-block ${group.scenario === 'LEASE' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        group.scenario === 'PURCHASE_USE' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                            'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                        {group.scenario === 'LEASE' ? '임대차 (Lease)' : group.scenario === 'PURCHASE_USE' ? '매매 - 실입주 (Owner Occupied)' : '매매 - 투자용 (Investment)'} 분석보고서
                    </span>
                    <h2 className="text-xl font-black text-slate-900">Option {pageIndex + 1}: {group.groupName}</h2>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500">BuildingReportPro™</p>
                </div>
            </div>

            {/* Building Overview */}
            <div className="bg-slate-50 border-t-2 border-slate-900 border-b border-x border-slate-200 p-4 mb-6 shrink-0">
                <div className="flex items-start gap-3 mb-3">
                    <Building2 className="w-5 h-5 text-slate-700 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-0.5">{group.buildingData?.bldNm || '물건 상세 정보'}</h3>
                        <p className="text-[11px] font-medium text-slate-500">{group.address}</p>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-4 border-t border-slate-200 pt-3">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400">주용도 (Zoning)</p>
                        <p className="text-xs font-bold text-slate-800">{group.buildingData?.mainPurpsCdNm || '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400">연면적 (GFA)</p>
                        <p className="text-xs font-bold text-slate-800">{group.buildingData?.totArea ? `${Number(group.buildingData?.totArea).toLocaleString()}㎡` : '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400">사용승인일 (Built)</p>
                        <p className="text-xs font-bold text-slate-800">{group.buildingData?.useAprDay ? group.buildingData?.useAprDay.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400">검토 면적</p>
                        <p className="text-xs font-black text-blue-600">{group.totalPyung.toFixed(1)}평 ({group.units.length}개 호실)</p>
                    </div>
                </div>
            </div>

            {/* Financial Sections */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                {/* 1. 자금조달계획 (Sources & Uses) */}
                <div>
                    <h3 className="text-sm font-black text-slate-900 mb-3 border-l-4 border-slate-800 pl-2 flex items-center gap-2">
                        <Calculator className="w-4 h-4" /> 자금조달 계획 및 부대비용
                    </h3>
                    {group.scenario === 'LEASE' ? (
                        <table className="w-full text-xs text-left border-collapse border border-slate-200">
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="py-2.5 px-3 bg-slate-50 font-bold text-slate-700 w-1/2">총 임대 보증금</td>
                                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{Math.round(totalDeposit).toLocaleString()}만</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 bg-slate-50 font-medium text-slate-600">중개보수 추정 (약 0.9%)</td>
                                    <td className="py-2.5 px-3 text-right text-slate-700">+{Math.round(totalDeposit * 0.009).toLocaleString()}만</td>
                                </tr>
                                <tr className="border-t-2 border-slate-300">
                                    <td className="py-2.5 px-3 bg-slate-100 font-bold text-slate-900">초기 투자규모 (Uses)</td>
                                    <td className="py-2.5 px-3 bg-slate-100 text-right font-black text-slate-900">{Math.round(totalDeposit + (totalDeposit * 0.009)).toLocaleString()}만</td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-xs text-left border-collapse border border-slate-200">
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="py-2.5 px-3 bg-slate-50 font-bold text-slate-700 w-1/2">추정 매매가</td>
                                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{Math.round(totalPurchasePrice).toLocaleString()}만</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 bg-slate-50 font-medium text-slate-600">취득세 등 (법정 상업용 4.6% 기준)</td>
                                    <td className="py-2.5 px-3 text-right text-slate-700">+{Math.round(feasibility.acquisitionTax).toLocaleString()}만</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 bg-slate-50 font-medium text-slate-600">중개보수 (최대 0.9%)</td>
                                    <td className="py-2.5 px-3 text-right text-slate-700">+{Math.round(feasibility.brokerageFee).toLocaleString()}만</td>
                                </tr>
                                <tr className="border-t-2 border-slate-300">
                                    <td className="py-2.5 px-3 bg-slate-100 font-bold text-slate-900">총 투자규모 (Uses)</td>
                                    <td className="py-2.5 px-3 bg-slate-100 text-right font-black text-slate-900">{Math.round(totalPurchasePrice + feasibility.totalIncidentalCosts).toLocaleString()}만</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 bg-slate-50 font-medium text-slate-600">예상 대출액 (LTV {ltv}%)</td>
                                    <td className="py-2.5 px-3 text-right text-red-600">-{Math.round(loanAmount).toLocaleString()}만</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 bg-slate-50 font-medium text-slate-600">회수 보증금</td>
                                    <td className="py-2.5 px-3 text-right text-red-600">-{Math.round(totalDeposit).toLocaleString()}만</td>
                                </tr>
                                <tr className="border-t-2 border-slate-800">
                                    <td className="py-2.5 px-3 bg-blue-50 font-black text-slate-900 text-[13px]">핵심자기자본 (Net Equity)</td>
                                    <td className="py-2.5 px-3 bg-blue-50 text-right font-black text-blue-700 text-[13px]">{Math.round(feasibility.netEquity).toLocaleString()}만</td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </div>

                {/* 2. 추정 현금흐름표 (Pro Forma) */}
                <div>
                    <h3 className="text-sm font-black text-slate-900 mb-3 border-l-4 border-slate-800 pl-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> 추정 현금흐름표 (Pro Forma)
                    </h3>
                    <table className="w-full text-xs text-left border-collapse border border-slate-200">
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="py-2.5 px-3 bg-slate-50 font-bold text-slate-700 w-1/2">월 임대수입</td>
                                <td className="py-2.5 px-3 text-right font-bold text-slate-900">{Math.round(totalRent).toLocaleString()}만/월</td>
                            </tr>
                            <tr>
                                <td className="py-2.5 px-3 bg-slate-50 font-medium text-slate-600">연간 임대수입 (Gross)</td>
                                <td className="py-2.5 px-3 text-right text-emerald-600">{Math.round(totalRent * 12).toLocaleString()}만/연</td>
                            </tr>
                            <tr>
                                <td className="py-2.5 px-3 bg-slate-50 font-medium text-slate-600">연간 운영비/공실손실</td>
                                <td className="py-2.5 px-3 text-right text-red-600">-(공실 5%, 운영 10% 가정)</td>
                            </tr>
                            <tr className="border-t-2 border-slate-300">
                                <td className="py-2.5 px-3 bg-slate-100 font-bold text-slate-900">순영업소득 (NOI)</td>
                                <td className="py-2.5 px-3 bg-slate-100 text-right font-black text-slate-900 pl-1">
                                    {Math.round(proforma.annualNOI).toLocaleString()}만/연
                                    <span className="block text-[10px] text-slate-500 font-normal">Cap Rate: {proforma.capRate.toFixed(2)}%</span>
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2.5 px-3 bg-slate-50 font-medium text-slate-600">연간 이자비용 ({assumptions.interestRate}%)</td>
                                <td className="py-2.5 px-3 text-right text-red-600">-{Math.round(proforma.annualDebtService).toLocaleString()}만/연</td>
                            </tr>
                            <tr className="border-t-2 border-slate-800">
                                <td className="py-2.5 px-3 bg-emerald-50 font-black text-slate-900 text-[13px]">세전현금흐름 (BTCF)</td>
                                <td className="py-2.5 px-3 bg-emerald-50 text-right font-black text-emerald-700 text-[13px]">
                                    {Math.round(proforma.annualBTCF).toLocaleString()}만/연
                                    <span className="block text-[10px] text-slate-500 font-normal">ROI: {proforma.equityROI.toFixed(2)}%</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Units List */}
            <h3 className="text-sm font-black text-slate-900 mb-3 border-l-4 border-slate-800 pl-2">산정 대상 호실 목록 (Total {group.units.length} Units)</h3>
            <div className="border border-slate-200 rounded-none overflow-hidden mb-6 flex-1 max-h-[400px]">
                <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-900 border-b border-slate-200 text-white sticky top-0">
                        <tr>
                            <th className="px-3 py-2 font-bold text-center">층수</th>
                            <th className="px-3 py-2 font-bold text-center">호수</th>
                            <th className="px-3 py-2 font-bold text-center">동명</th>
                            <th className="px-3 py-2 font-bold text-center">주용도</th>
                            <th className="px-3 py-2 font-bold text-right">전용면적(㎡)</th>
                            <th className="px-3 py-2 font-bold text-right">전용면적(평)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {group.units.map((u: any, i: number) => {
                            const py = (Number(u.area) * 0.3025).toFixed(2);
                            return (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-3 py-2 text-center text-slate-700 font-medium">{u.flrNo}F</td>
                                    <td className="px-3 py-2 text-center font-bold text-slate-900">{u.hoNm || '-'}</td>
                                    <td className="px-3 py-2 text-center text-slate-500">{u.dongNm || '-'}</td>
                                    <td className="px-3 py-2 text-center text-slate-600">{u.mainPurpsCdNm || '-'}</td>
                                    <td className="px-3 py-2 text-right text-slate-600">{Number(u.area).toFixed(2)}㎡</td>
                                    <td className="px-3 py-2 text-right font-bold text-slate-800">{py}평</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-6 text-right">
                <p className="text-[10px] text-slate-400 font-mono">CONFIDENTIAL - FOR INTERNAL DISCUSSION ONLY</p>
            </div>
        </div>
    );
};
