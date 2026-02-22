'use client';

import { useState, useMemo } from 'react';
import { X, Building2, TrendingUp, Calculator, PieChart, Info, DollarSign, Wallet, ArrowRightLeft, Download, AlertTriangle, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { useCompareStore, CompareGroup } from '@/stores/useCompareStore';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';
import { PremiumReportTemplate } from '../report/PremiumReportTemplate';

export interface CommercialData {
  grade: number;
  footTraffic: number;
  storeDensity: string;
  primaryAgeGroup: string;
  description: string;
  estimatedRent?: number;
}

interface QuotationModalProps {
  onClose: () => void;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export function QuotationModal({ onClose }: QuotationModalProps) {
  const { compareGroups } = useCompareStore();

  // Configuration / Assumptions
  const [assumptions, setAssumptions] = useState({
    leaseDepositPerPy: 1000000,
    leaseRentPerPy: 100000,
    leaseMaintPerPy: 30000,
    purchasePricePerPy: 20000000,
    loanLtvUse: 80,
    loanLtvInvest: 60,
    interestRate: 4.5
  });

  // Custom Logo Upload
  const [customLogo, setCustomLogo] = useState<string | undefined>(undefined);

  const reportRef = useRef<HTMLDivElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: 'BuildingReportPro_DecisionPackage'
  });

  // Calculate metrics for all groups
  const analyzedGroups = useMemo(() => {
    return compareGroups.map((group, index) => {
      const totalAreaM2 = group.units.reduce((sum, u) => sum + (parseFloat(u.area) || 0), 0);
      const totalPyung = totalAreaM2 * 0.3025;

      // Basic base numbers (만원)
      const deposit = Math.round(totalPyung * (assumptions.leaseDepositPerPy / 10000)); // Convert to 만원
      const rent = Math.round(totalPyung * (assumptions.leaseRentPerPy / 10000));       // Convert to 만원
      const maint = Math.round(totalPyung * (assumptions.leaseMaintPerPy / 10000));     // Convert to 만원
      const price = Math.round(totalPyung * (assumptions.purchasePricePerPy / 10000));   // Convert to 만원

      const commercialRent = group.commercialData?.estimatedRent ? (group.commercialData.estimatedRent * 10) : (assumptions.leaseRentPerPy / 10000); // Assuming estimatedRent is already in 만원 or similar scale
      const tenantRent = Math.round(totalPyung * commercialRent);

      let kpi1 = { label: '', value: '', unit: '', sub: '' };
      let kpi2 = { label: '', value: '', unit: '', sub: '' };
      let kpi3 = { label: '', value: '', unit: '', sub: '' };

      // For charting
      let chartCost = 0;   // Monthly Outflow equivalent (만원)
      let chartIncome = 0; // Monthly Income (만원)

      if (group.scenario === 'LEASE') {
        const totalMonthly = rent + maint;
        const noc = (assumptions.leaseRentPerPy / 10000) + (assumptions.leaseMaintPerPy / 10000);

        kpi1 = { label: '보증금 총액', value: deposit > 0 ? Math.round(deposit / 10000).toLocaleString() : '0', unit: '억원', sub: `${deposit.toLocaleString()}만` };
        kpi2 = { label: '월 고정비 (임대료+관리비)', value: totalMonthly.toLocaleString(), unit: '만원', sub: `NOC: 평당 ${noc}만` };
        kpi3 = { label: '3년 총 현금유출', value: Math.round((totalMonthly * 36) / 10000).toLocaleString(), unit: '억원', sub: `매월 ${totalMonthly.toLocaleString()}만 지출` };

        chartCost = totalMonthly;
        chartIncome = 0;

      } else if (group.scenario === 'PURCHASE_USE') {
        const loanAmount = price * (assumptions.loanLtvUse / 100);
        const equity = price - loanAmount;
        const annualInterest = loanAmount * (assumptions.interestRate / 100);
        const monthlyInterest = annualInterest / 12;
        const totalMonthly = monthlyInterest + maint;
        const savings = (rent + maint) - totalMonthly;

        kpi1 = { label: '예상 총 매매가', value: price > 0 ? Math.round(price / 10000).toLocaleString() : '0', unit: '억원', sub: `평당 ${(assumptions.purchasePricePerPy / 10000).toLocaleString()}만` };
        kpi2 = { label: '실투자금 (자기자본)', value: equity > 0 ? Math.round(equity / 10000).toLocaleString() : '0', unit: '억원', sub: `LTV ${assumptions.loanLtvUse}% 적용` };
        kpi3 = { label: '월 이자+관리비', value: Math.round(totalMonthly).toLocaleString(), unit: '만원', sub: savings > 0 ? `임차 대비 월 ${Math.round(savings).toLocaleString()}만 절감` : `매월 지출` };

        chartCost = totalMonthly || 0;
        chartIncome = 0;

      } else if (group.scenario === 'PURCHASE_INVEST') {
        const loanAmount = price * (assumptions.loanLtvInvest / 100);
        const equity = price - loanAmount - deposit; // deposit is received from tenant
        const annualIncome = tenantRent * 12;
        const annualInterest = loanAmount * (assumptions.interestRate / 100);
        const netIncome = annualIncome - annualInterest;

        // Failsafe: Prevent division by zero and NaN
        const roi = (equity > 0 && isFinite(netIncome)) ? (netIncome / equity) * 100 : 0;
        const capRate = (price > 0 && isFinite(annualIncome)) ? (annualIncome / price) * 100 : 0;

        const safeEquityDisplay = equity > 0 ? Math.round(equity / 10000).toLocaleString() : '0';
        const safeDepositSub = deposit > 0 ? Math.round(deposit / 10000) : 0;
        const safeAnnualIncomeSub = annualIncome > 0 ? Math.round(annualIncome / 10000) : 0;

        kpi1 = { label: '실투자금 (자기자본)', value: safeEquityDisplay, unit: '억원', sub: `보증금 ${safeDepositSub}억 회수 반영` };
        kpi2 = { label: 'Cap Rate (표면수익률)', value: capRate.toFixed(2), unit: '%', sub: `연 기대수익 ${safeAnnualIncomeSub}억` };
        kpi3 = { label: '자기자본수익률 (ROI)', value: roi.toFixed(2), unit: '%', sub: `대출이자 삭감 후 순수익 기준` };

        chartCost = isFinite(annualInterest) ? annualInterest / 12 : 0; // Monthly interest
        chartIncome = isFinite(tenantRent) ? tenantRent : 0;
      }

      return {
        ...group,
        index,
        totalPyung,
        kpi1, kpi2, kpi3,
        chartCost,
        chartIncome
      };
    });
  }, [compareGroups, assumptions]);

  const chartData = analyzedGroups.map(g => ({
    name: g.groupName.substring(0, 15) + (g.groupName.length > 15 ? '...' : ''),
    '월 지출(비용)': Math.round(g.chartCost),
    '월 수익(수입)': Math.round(g.chartIncome),
    scenario: g.scenario,
    index: g.index
  }));

  if (compareGroups.length === 0) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">비교할 옵션이 없습니다</h2>
          <p className="text-slate-500 mb-6">최소 1개 이상의 호실을 장바구니에 담아주세요.</p>
          <button onClick={onClose} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold w-full">돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 p-4 md:p-8 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-[1800px] h-[95vh] bg-slate-50 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-700">

        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">B2B Dashboard</span>
                <h1 className="text-2xl font-black text-slate-900">최종 옵션 통합 비교 분석표</h1>
              </div>
              <p className="text-sm font-medium text-slate-500">선택하신 {compareGroups.length}개의 대안을 시나리오별 재무 타당성 측면에서 비교합니다.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold transition-colors cursor-pointer border border-indigo-200">
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <Download className="w-4 h-4 rotate-180" /> 로고 업로드
            </label>
            <button
              onClick={() => handlePrint()}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30"
            >
              <Download className="w-4 h-4" /> 리포트 다운로드
            </button>
            <button onClick={onClose} className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors ml-2">
              <X className="w-4 h-4" /> 닫기
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">

          {/* Top: 5-Column Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {analyzedGroups.map((group) => (
              <div key={group.groupId} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow relative">
                {/* Group Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${group.scenario === 'LEASE' ? 'bg-blue-500' :
                    group.scenario === 'PURCHASE_USE' ? 'bg-indigo-500' : 'bg-emerald-500'
                    }`} />

                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm ${group.scenario === 'LEASE' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      group.scenario === 'PURCHASE_USE' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                      {group.scenario === 'LEASE' ? '🏢 임대차' : group.scenario === 'PURCHASE_USE' ? '🏭 매매 (실입주)' : '💰 매매 (투자)'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1 relative z-10 line-clamp-2" title={group.groupName}>
                    {group.groupName}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 relative z-10 truncate" title={group.address}>
                    <Building2 className="w-3 h-3" /> {group.buildingData?.bldNm || group.address.split(' ').slice(0, 2).join(' ')}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-500">총 전용</span>
                    <span className="text-sm font-black text-slate-800">{group.totalPyung.toFixed(1)}평</span>
                  </div>
                </div>

                {/* CPA Metrics (Middle) */}
                <div className="p-5 flex-1 flex flex-col gap-4 bg-white">
                  {/* KPI 1 */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">{group.kpi1.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 tracking-tight">{group.kpi1.value}</span>
                      <span className="text-sm font-bold text-slate-400">{group.kpi1.unit}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{group.kpi1.sub}</p>
                  </div>
                  <div className="w-full h-px bg-slate-100" />
                  {/* KPI 2 */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">{group.kpi2.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-black tracking-tight ${group.scenario === 'PURCHASE_INVEST' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {group.kpi2.value}
                      </span>
                      <span className="text-sm font-bold text-slate-400">{group.kpi2.unit}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{group.kpi2.sub}</p>
                  </div>
                  <div className="w-full h-px bg-slate-100" />
                  {/* KPI 3 */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">{group.kpi3.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-black tracking-tight ${group.scenario === 'PURCHASE_INVEST' ? 'text-emerald-600' :
                        group.scenario === 'PURCHASE_USE' ? 'text-indigo-600' :
                          'text-blue-600'
                        }`}>
                        {group.kpi3.value}
                      </span>
                      <span className="text-sm font-bold text-slate-400">{group.kpi3.unit}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{group.kpi3.sub}</p>
                  </div>
                </div>
                {/* CTA Button per card */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center mt-auto">
                  <button className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors flex items-center justify-center w-full gap-1">
                    이 대안 선택하기 <ArrowRightLeft className="w-3 h-3" />
                  </button>
                </div>
                {/* Bottom Stripe */}
                <div className={`h-1.5 w-full ${COLORS[group.index % COLORS.length]}`} style={{ backgroundColor: COLORS[group.index % COLORS.length] }} />
              </div>
            ))}

            {/* Empty placeholders if < 5 */}
            {Array.from({ length: 5 - analyzedGroups.length }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border-2 border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400 p-6 min-h-[400px] hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-md">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 group-hover:bg-blue-100">
                  <span className="font-bold text-slate-400 group-hover:text-blue-500 transition-colors">+</span>
                </div>
                <p className="text-sm font-bold">대안 추가 가능</p>
                <p className="text-xs text-center mt-2 px-4 opacity-70">비교함에 다른 호실이나 건물을 추가하여 나란히 비교해 보세요.</p>
              </div>
            ))}
          </div>

          {/* Bottom: Visual Comparison Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col lg:flex-row gap-8 min-h-[300px]">
            <div className="lg:w-1/4 flex flex-col justify-center">
              <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" /> 월별 현금흐름 비교
              </h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                선택된 대안들의 <strong>매월 발생하는 지출(임대료, 관리비, 대출이자)</strong>과 <strong>수익(임대수익)</strong>을 직관적으로 비교합니다. 실입주/임대차 대안은 지출에 집중되며, 투자 대안은 수익이 함께 표시됩니다.
              </p>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-inner">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5"><Calculator className="w-4 h-4 text-slate-500" /> 동적 민감도 시뮬레이터</h4>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-600">대출 금리</label>
                      <span className="text-sm font-black text-blue-600">{assumptions.interestRate.toFixed(1)}%</span>
                    </div>
                    <input
                      type="range" min="2.0" max="10.0" step="0.1"
                      value={assumptions.interestRate}
                      onChange={e => setAssumptions({ ...assumptions, interestRate: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1"><span>2.0%</span><span>10.0%</span></div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-600">LTV (실입주)</label>
                      <span className="text-sm font-black text-indigo-600">{assumptions.loanLtvUse}%</span>
                    </div>
                    <input
                      type="range" min="0" max="90" step="5"
                      value={assumptions.loanLtvUse}
                      onChange={e => setAssumptions({ ...assumptions, loanLtvUse: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-600">LTV (투자)</label>
                      <span className="text-sm font-black text-emerald-600">{assumptions.loanLtvInvest}%</span>
                    </div>
                    <input
                      type="range" min="0" max="90" step="5"
                      value={assumptions.loanLtvInvest}
                      onChange={e => setAssumptions({ ...assumptions, loanLtvInvest: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500">평당 매매가 추정(설정용)</span>
                    <div className="flex items-center">
                      <input type="number" value={assumptions.purchasePricePerPy} onChange={e => setAssumptions({ ...assumptions, purchasePricePerPy: Number(e.target.value) })} className="w-24 text-right bg-white border border-slate-300 rounded-md text-xs p-1.5 font-bold focus:border-blue-500 outline-none" />
                      <span className="text-[10px] ml-1.5 text-slate-500 font-bold">만원</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-3/4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  barGap={8}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `${val.toLocaleString()}만`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${Number(value || 0).toLocaleString()} 만원`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  <Bar dataKey="월 지출(비용)" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-cost-${index}`} fill={entry.scenario === 'PURCHASE_INVEST' ? '#f87171' : COLORS[index % COLORS.length]} fillOpacity={entry.scenario === 'PURCHASE_INVEST' ? 0.3 : 1} />
                    ))}
                  </Bar>
                  <Bar dataKey="월 수익(수입)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden PDF Report Template for Printing */}
      <div style={{ display: 'none' }}>
        <PremiumReportTemplate
          ref={reportRef}
          compareGroups={compareGroups}
          assumptions={assumptions}
          analyzedGroups={analyzedGroups}
          chartData={chartData}
          customLogo={customLogo}
        />
      </div>

    </div >
  );
}