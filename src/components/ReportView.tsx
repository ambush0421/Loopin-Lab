// @ts-nocheck
'use client';
import React from 'react';
import { BuildingReport, ReportType } from '@/types/building';
import { AlertTriangle, Building, MapPin, Calendar, Ruler, Car, TrendingUp, Landmark, ShieldCheck, Calculator, BarChart3, PieChart, Coins, Home, Activity, Map as MapIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import InitialCostChart from '@/components/charts/InitialCostChart';
import CashFlowChart from '@/components/charts/CashFlowChart';
import { InvestmentMap } from './dashboard/InvestmentMap';
import { MarketChart } from './dashboard/MarketChart';

interface ReportViewProps {
  data: any;
  readOnly?: boolean;
}

// Helper to calculate building age
const getBuildingAge = (useAprvDay: string) => {
  if (!useAprvDay || useAprvDay.length !== 8) return 'N/A';
  const approvalYear = parseInt(useAprvDay.substring(0, 4), 10);
  const currentYear = new Date().getFullYear();
  const age = currentYear - approvalYear;
  return age > 0 ? `${age}년` : '1년 미만';
};


const ReportView: React.FC<ReportViewProps> = ({ data }) => {
  const type = data.reportType || 'PURCHASE';

  // 유형별 타이틀 및 레이블 설정
  const config = {
    LEASE: {
      mainTitle: "BUILDING LEASE ANALYSIS",
      subTitle: "임차 적정성 분석 보고서",
      section1: "01. PROPERTY IDENTITY",
      section1Sub: "기본 건축물 정보",
      section5: "05. RATIO ANALYSIS",
      section5Sub: "면적 및 비율 분석"
    },
    PURCHASE: {
      mainTitle: "ASSET PURCHASE ANALYSIS",
      subTitle: "사옥 매입 적정성 분석 보고서",
      section1: "01. ASSET SPECIFICATION",
      section1Sub: "자산 기본 명세",
      section5: "05. CAPITAL EFFICIENCY",
      section5Sub: "자본 효율성 및 면적 분석"
    },
    INVEST: {
      mainTitle: "INVESTMENT ANALYSIS",
      subTitle: "수익형 부동산 투자 분석 보고서",
      section1: "01. INVESTMENT TARGET",
      section1Sub: "투자 대상물 정보",
      section5: "05. YIELD PARAMETERS",
      section5Sub: "수익률 변수 및 비율 분석"
    }
  }[type];

  const getAnalystOpinion = () => {
    if (data.vlrtBldRgstYn === 'Y') {
      return "본 자산은 공적 장부상 위반 사항이 존재하여 매입/임차 시 행정적 리스크가 매우 높습니다. 이행강제금 및 용도변경 제한 사항을 필히 검토하십시오.";
    }

    if (type === 'PURCHASE') {
      return `본 물건은 법적 제한 사항이 없으며, 연면적 및 건폐율이 효율적으로 관리되고 있습니다. 사옥 매입 시 기업의 고정 자산 가치 상승 및 실무 공간 확보 측면에서 우량한 선택지로 판단됩니다.`;
    }

    if (type === 'INVEST') {
      return "지목 및 공시지가 추이가 안정적이며, 자산 건전성이 확보된 물건입니다. 인근 시세와 연동된 임대 수익 구조 최적화 시 타겟 수익률 달성이 충분히 가능할 것으로 분석됩니다.";
    }

    return `본 자산은 법적 제한 사항이 없는 우량한 상태로 확인됩니다. 연면적 및 건폐율이 법정 한도 내에서 효율적으로 관리되고 있습니다.`;
  };

  const formatPrice = (value: number | undefined) => {
    if (value === undefined || value === null) return '정보 없음';
    if (value >= 100000000) {
      const uk = Math.floor(value / 100000000);
      const man = Math.round((value % 100000000) / 10000);
      return man > 0 ? `${uk}억 ${man.toLocaleString()}만` : `${uk}억`;
    }
    if (value >= 10000) {
      return `${Math.round(value / 10000).toLocaleString()}만`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white p-[20mm] mx-auto shadow-lg border print:shadow-none print:border-none print:m-0 font-sans text-black">
      {/* Header */}
      <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-start">
        <div className="space-y-1">
          <span className="bg-gray-800 text-white text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter">{type}</span>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">{config.mainTitle}</h1>
          <h2 className="text-xl font-bold text-gray-900">{config.subTitle}</h2>
        </div>
        <div className="grid grid-cols-3 border border-black text-center text-[10px] w-48">
          <div className="border-r border-black p-1 bg-gray-50 font-bold">담당</div>
          <div className="border-r border-black p-1 bg-gray-50 font-bold">검토</div>
          <div className="p-1 bg-gray-50 font-bold">승인</div>
          <div className="border-r border-black h-12"></div>
          <div className="border-r border-black h-12"></div>
          <div className="h-12"></div>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <section className="mb-10">
        <div className="grid grid-cols-4 gap-0 border border-black divide-x divide-black">
          <SummaryMetric label="연면적" value={`${(data.totArea * 0.3025).toFixed(1)}`} unit="평" />
          <SummaryMetric
            label="공시지가 (m²)"
            value={data.landInfo?.pannPrc ? `${formatPrice(data.landInfo.pannPrc)}` : '-'}
            unit="원"
          />
          <SummaryMetric label="건물 연식" value={getBuildingAge(data.useAprvDay)} highlight />
          <SummaryMetric label="용적률" value={`${data.vlrat.toFixed(1)}%`} />
        </div>
      </section>

      {/* Violation Alert */}
      {data.vlrtBldRgstYn === 'Y' && (
        <div className="bg-black text-white p-6 mb-10 flex items-center gap-6 border-4 border-black">
          <AlertTriangle className="text-white h-12 w-12 shrink-0" />
          <div>
            <h3 className="font-black text-2xl uppercase tracking-tight">ATTENTION: VIOLATION DETECTED</h3>
            <p className="text-sm mt-1 opacity-90">본 건축물은 행정청에 의해 위반건축물로 등재되어 있습니다. 법적/금융적 제한 사항을 확인하십시오.</p>
          </div>
        </div>
      )}

      {/* Section 01: Property Identity */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-black pb-2">
          <Building className="h-6 w-6" />
          <h2 className="text-2xl font-black uppercase tracking-tight">{config.section1}</h2>
          <span className="text-gray-400 text-sm font-medium ml-auto">{config.section1Sub}</span>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          <InfoRow label="건물명 (PROPERTY NAME)" value={data.bldNm || 'N/A'} />
          <InfoRow label="대지위치 (LOCATION)" value={data.platAddr} />
          <InfoRow label="주용도 (PRIMARY USE)" value={data.mainPurpsCdNm} />
          <InfoRow label="구조 (STRUCTURE)" value={data.strctCdNm} />
          <InfoRow label="사용승인일 (APPROVAL DATE)" value={formatDate(data.useAprvDay)} />
          <InfoRow label="규모 (SCALE)" value={`지상 ${data.grndFlrCnt}층 / 지하 ${data.ugndFlrCnt}층`} />
        </div>
      </section>

      {/* Section 02: Location & Market Analysis */}
      <section className="mb-12 page-break-inside-avoid">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-black pb-2">
          <MapIcon className="h-6 w-6" />
          <h2 className="text-2xl font-black uppercase tracking-tight">02. LOCATION & MARKET</h2>
          <span className="text-gray-400 text-sm font-medium ml-auto">위치 및 주변 실거래 분석</span>
        </div>
        <div className="grid grid-cols-5 gap-6 h-[300px]">
          <div className="col-span-3 border-4 border-black relative grayscale">
            <InvestmentMap address={data.platAddr} />
            <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest z-10">
              Strategic Map View
            </div>
          </div>
          <div className="col-span-2">
            <MarketChart trends={data.marketTrends} />
          </div>
        </div>
      </section>

      {/* Section 03 & 04: Land & Price Analysis */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <section>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-black pb-2">
            <Landmark className="h-6 w-6" />
            <h2 className="text-xl font-black uppercase tracking-tight">03. LAND SPEC</h2>
          </div>
          <div className="space-y-4">
            <DataGridItem label="지목 (LAND USE)" value={data.landInfo?.lndMsclCdNm || '-'} />
            <DataGridItem label="대지면적 (LAND AREA)" value={`${data.landInfo?.lndpclAr.toLocaleString() || '-'} m²`} />
            <div className="p-4 bg-black text-white mt-2">
              <div className="text-[10px] font-bold opacity-70 uppercase">Current Public Price</div>
              <div className="text-xl font-black">{data.landInfo?.pannPrc.toLocaleString() || '-'} KRW / m²</div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-black pb-2">
            <TrendingUp className="h-6 w-6" />
            <h2 className="text-xl font-black uppercase tracking-tight">04. PRICE TREND</h2>
          </div>
          <div className="h-[140px] w-full border border-gray-200 p-2">
            {data.priceHistory && data.priceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.priceHistory}>
                  <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#eee" />
                  <XAxis dataKey="year" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000', color: '#fff', border: 'none', fontSize: '10px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => [`${formatPrice(Number(value))}원/m²`, "공시지가"]}
                  />
                  <Line type="monotone" dataKey="price" stroke="#000" strokeWidth={3} dot={{ fill: '#000', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300 text-[10px] font-bold italic">NO DATA AVAILABLE</div>
            )}
          </div>
        </section>
      </div>

      {/* Section 05: Quantitative Analysis */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-black pb-2">
          <Ruler className="h-6 w-6" />
          <h2 className="text-2xl font-black uppercase tracking-tight">{config.section5}</h2>
          <span className="text-gray-400 text-sm font-medium ml-auto">{config.section5Sub}</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <AnalysisCard label="대지면적" value={data.platArea} unit="m²" />
          <AnalysisCard label="연면적" value={data.totArea} unit="m²" />
          <AnalysisCard label="건폐율" value={data.bcRat} unit="%" />
          <AnalysisCard label="용적률" value={data.vlrat} unit="%" />
        </div>
      </section>

      {/* Section 06: Financial Simulation placeholder */}
      {!data.analysis?.financialSimulation && (
        <section className="mb-12 page-break-inside-avoid">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-black pb-2">
            <Calculator className="h-6 w-6" />
            <h2 className="text-2xl font-black uppercase tracking-tight">06. FINANCIAL SIMULATION</h2>
          </div>
          <div className="border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <p className="text-gray-500 font-bold">재무 분석 데이터가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">AI 기반 재무 시뮬레이션 기능이 추가될 예정입니다.</p>
          </div>
        </section>
      )}

      {/* Section 06: Financial Simulation */}
      {data.analysis?.financialSimulation && (
        <section className="mb-12 page-break-inside-avoid">
          <div className="flex items-center gap-3 mb-6 border-b-2 border-black pb-2">
            <Calculator className="h-6 w-6" />
            <h2 className="text-2xl font-black uppercase tracking-tight">06. FINANCIAL SIMULATION</h2>
            <span className="text-gray-400 text-sm font-medium ml-auto">재무 타당성 분석 (추정)</span>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="border-2 border-black p-6">
              <div className="flex items-center justify-between mb-4 border-b border-black pb-2">
                <h3 className="text-sm font-black uppercase tracking-widest">Initial Investment</h3>
                <PieChart className="w-4 h-4 text-gray-400" />
              </div>
              <InitialCostChart
                equity={data.analysis.financialSimulation.initial.equity}
                loan={data.analysis.financialSimulation.initial.loanAmount}
                tax={data.analysis.financialSimulation.initial.acquisitionTax}
              />
              <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-300 mt-2">
                <span className="text-xs font-black text-black uppercase">Required Equity</span>
                <span className="text-lg font-black text-black">{data.analysis.financialSimulation.initial.equity.toLocaleString()} 원</span>
              </div>
            </div>

            <div className="border-2 border-black bg-gray-50 p-6">
              <div className="flex items-center justify-between mb-4 border-b border-black pb-2">
                <h3 className="text-sm font-black uppercase tracking-widest">Cash Flow Analysis</h3>
                <BarChart3 className="w-4 h-4 text-gray-400" />
              </div>
              <CashFlowChart
                grossIncome={data.analysis.financialSimulation.monthly.grossIncome}
                interest={data.analysis.financialSimulation.monthly.interest}
                netIncome={data.analysis.financialSimulation.monthly.cashFlow}
              />
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t-2 border-black">
                <div className="text-center">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Cap Rate</div>
                  <div className="text-2xl font-black">{data.analysis.financialSimulation.metrics.capRate.toFixed(2)}%</div>
                </div>
                <div className="text-center bg-black text-white py-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">CoC Return</div>
                  <div className="text-2xl font-black">{data.analysis.financialSimulation.metrics.cocReturn.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 07: Conclusion */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-black pb-2">
          <ShieldCheck className="h-6 w-6" />
          <h2 className="text-2xl font-black uppercase tracking-tight">07. FINAL JUDGEMENT</h2>
        </div>
        <div className="flex gap-8 items-stretch">
          <div className="bg-black text-white w-32 flex flex-col items-center justify-center p-4">
            <div className="text-[10px] font-bold opacity-70 mb-1">GRADE</div>
            <div className="text-5xl font-black">{data.analysis?.score ? (Math.round(data.analysis.score / 10)) : (data.vlrtBldRgstYn === 'Y' ? 'C' : 'A')}</div>
          </div>
          <div className="flex-1 border-4 border-black p-6 flex flex-col justify-center">
            <h3 className="font-black text-xl mb-2">분석 의견 (ANALYST OPINION)</h3>
            <p className="text-sm leading-relaxed text-gray-700 italic">
              {data.analysis?.reasoning || getAnalystOpinion()}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-auto pt-8 border-t-2 border-black flex justify-between items-end">
        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest space-y-1">
          <p>© 2026 BUILDING REPORT PRO / PREMIUM ANALYTICS</p>
          <p>CONFIDENTIAL DOCUMENT - FOR REFERENCE ONLY</p>
        </div>
        <div className="text-right">
          <div className="text-[8px] font-bold uppercase tracking-tighter mb-1">Verify Authenticity</div>
          <div className="w-16 h-16 bg-gray-100 border border-gray-200 flex items-center justify-center text-[8px] text-gray-400">QR CODE</div>
        </div>
      </div>
    </div>
  );
};

const SummaryMetric = ({ label, value, unit, highlight }: { label: string; value: string | number; unit?: string; highlight?: boolean }) => (
  <div className={`p-6 flex flex-col gap-1 ${highlight ? 'bg-black text-white' : 'bg-white text-black'}`}>
    <span className={`text-[10px] font-black uppercase tracking-widest ${highlight ? 'text-gray-300' : 'text-gray-500'}`}>{label}</span>
    <p className="text-2xl font-black tracking-tighter whitespace-nowrap">
      {value}
      {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
    </p>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col border-b border-gray-100 pb-2">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight mb-1">{label}</span>
    <span className="text-sm font-bold">{value}</span>
  </div>
);

const DataGridItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-end border-b border-black pb-1">
    <span className="text-[10px] font-bold text-gray-500 uppercase">{label}</span>
    <span className="font-black text-sm">{value}</span>
  </div>
);

const AnalysisCard = ({ label, value, unit }: { label: string; value: number; unit: string }) => (
  <div className="border-2 border-black p-4 text-center">
    <div className="text-[10px] font-black uppercase mb-1">{label}</div>
    <div className="text-xl font-black">
      {value.toLocaleString()}<span className="text-[10px] ml-0.5">{unit}</span>
    </div>
  </div>
);

const formatDate = (dateStr: string) => {
  if (!dateStr || dateStr.length !== 8) return dateStr || '-';
  return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
};

export default ReportView;