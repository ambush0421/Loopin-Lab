import React from 'react';
import { BuildingReport } from '@/types/building';
import { AlertTriangle, Building, MapPin, Calendar, Ruler, Car, TrendingUp, Landmark, ShieldCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReportViewProps {
  data: BuildingReport;
}

const ReportView: React.FC<ReportViewProps> = ({ data }) => {
  return (
    <div className="w-[210mm] min-h-[297mm] bg-white p-[20mm] mx-auto shadow-lg border print:shadow-none print:border-none print:m-0 font-sans text-black">
      {/* Header */}
      <div className="border-b-4 border-black pb-6 mb-10 flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">BUILDING ANALYSIS</h1>
          <h2 className="text-xl font-bold text-gray-900">건축물 분석 보고서</h2>
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

      {/* Basic Info Section */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-black pb-2">
          <Building className="h-6 w-6" />
          <h2 className="text-2xl font-black uppercase tracking-tight">01. PROPERTY IDENTITY</h2>
          <span className="text-gray-400 text-sm font-medium ml-auto">기본 건축물 정보</span>
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

      {/* Financial & Land Analysis */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        {/* Land Data */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-black pb-2">
            <Landmark className="h-6 w-6" />
            <h2 className="text-xl font-black uppercase tracking-tight">02. LAND SPEC</h2>
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

        {/* Price History Chart */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b-2 border-black pb-2">
            <TrendingUp className="h-6 w-6" />
            <h2 className="text-xl font-black uppercase tracking-tight">03. PRICE TREND</h2>
          </div>
          <div className="h-[140px] w-full border border-gray-200 p-2">
            {data.priceHistory ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.priceHistory}>
                  <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#eee" />
                  <XAxis dataKey="year" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', color: '#fff', border: 'none', fontSize: '10px' }}
                    itemStyle={{ color: '#fff' }}
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

      {/* Quantitative Analysis */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-black pb-2">
          <Ruler className="h-6 w-6" />
          <h2 className="text-2xl font-black uppercase tracking-tight">04. RATIO ANALYSIS</h2>
          <span className="text-gray-400 text-sm font-medium ml-auto">면적 및 비율 분석</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <AnalysisCard label="대지면적" value={data.platArea} unit="m²" />
          <AnalysisCard label="연면적" value={data.totArea} unit="m²" />
          <AnalysisCard label="건폐율" value={data.bcRat} unit="%" />
          <AnalysisCard label="용적률" value={data.vlrat} unit="%" />
        </div>
      </section>

      {/* Conclusion / Recommendation */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-black pb-2">
          <ShieldCheck className="h-6 w-6" />
          <h2 className="text-2xl font-black uppercase tracking-tight">05. FINAL JUDGEMENT</h2>
        </div>
        <div className="flex gap-8 items-stretch">
          <div className="bg-black text-white w-32 flex flex-col items-center justify-center p-4">
            <div className="text-[10px] font-bold opacity-70 mb-1">GRADE</div>
            <div className="text-5xl font-black">{data.vlrtBldRgstYn === 'Y' ? 'C' : 'A'}</div>
          </div>
          <div className="flex-1 border-4 border-black p-6 flex flex-col justify-center">
            <h3 className="font-black text-xl mb-2">분석 의견 (ANALYST OPINION)</h3>
            <p className="text-sm leading-relaxed text-gray-700 italic">
              {data.vlrtBldRgstYn === 'Y' 
                ? "본 자산은 공적 장부상 위반 사항이 존재하여 매입 시 행정적 리스크가 매우 높습니다. 이행강제금 및 용도변경 제한 사항을 필히 검토하십시오." 
                : "본 자산은 법적 제한 사항이 없는 우량한 상태로 확인됩니다. 연면적 및 건폐율이 법정 한도 내에서 효율적으로 관리되고 있습니다."}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-auto pt-8 border-t-2 border-black flex justify-between items-end">
        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest space-y-1">
          <p>© 2026 BUILDING REPORT PRO / PREMUM ANALYTICS</p>
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