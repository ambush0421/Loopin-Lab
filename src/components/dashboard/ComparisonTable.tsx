'use client';

import { Trophy, Info, MapPin } from "lucide-react";
import ScoreBreakdownChart from "@/components/charts/ScoreBreakdownChart";
import {
  formatManwon,
  formatSignedDelta,
  formatSignedManwon,
  toSafeNumber
} from '@/lib/utils/finance-format';

interface ComparisonTableProps {
  data: ComparisonData;
  onViewDetail: (id: string) => void;
}

type ComparisonTableBuilding = {
  id: string;
  name: string;
  address: string;
  analysis: {
    monthlySaving?: number;
    cumulativeEffect3Y?: number;
    breakdown?: {
      costScore: number;
      areaScore: number;
      parkingScore: number;
      modernityScore: number;
    };
    score?: number;
  };
  tags: {
    riskLevel: 'SAFE' | 'CAUTION' | 'DANGER';
  };
  metrics: {
    cost: number;
    area: number;
    year: number;
    parking: number;
  };
};

type ComparisonData = {
  buildings: ComparisonTableBuilding[];
  recommendation: {
    bestBuildingIndex: number;
    reason: string;
    totalScore: number;
  };
  meta: {
    type: 'LEASE' | 'PURCHASE' | 'INVEST';
  } & Record<string, unknown>;
};

export function ComparisonTable({ data, onViewDetail }: ComparisonTableProps) {
  if (!data || !data.buildings) return null;

  const { buildings, recommendation, meta } = data;
  const bestIdx = recommendation.bestBuildingIndex;
  const type = meta.type || 'LEASE';

  const toPyung = (m2: number) => (m2 * 0.3025).toFixed(1);

  // 유형별 레이블 설정
  const labels = {
    LEASE: { cost: "월 고정비 (임대료)", effect: "3년 누적 절감 효과" },
    PURCHASE: { cost: "매매가 (Purchase Price)", effect: "자산 가치 기여도" },
    INVEST: { cost: "취득가 (Investment)", effect: "예상 수익 기여도" }
  }[type as 'LEASE' | 'PURCHASE' | 'INVEST'];

  return (
    <div className="space-y-6">
      {/* 추천 배너 */}
      <div className="bg-black rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border-4 border-black">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-white p-4 rounded-2xl">
              <Trophy className="w-10 h-10 text-black" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">AI Strategic Selection</p>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">{buildings[bestIdx].name}</h2>
            </div>
          </div>
          <div className="bg-white/10 px-8 py-6 rounded-2xl backdrop-blur-xl border border-white/20 max-w-lg">
            <div className="flex items-start gap-4">
              <Info className="w-6 h-6 text-white mt-1 shrink-0" />
              <p className="text-sm font-medium leading-relaxed italic">&quot;{recommendation.reason}&quot;</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      </div>

      {/* 비교 테이블 */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[900px] grid grid-cols-12 gap-0 border-4 border-black rounded-3xl bg-white shadow-xl overflow-hidden font-sans">
          {/* 항목 레이블 열 */}
          <div className="col-span-3 bg-gray-50 border-r-2 border-black">
            <div className="h-40 border-b-2 border-black flex items-center px-8">
              <span className="text-xs font-black text-black uppercase tracking-[0.2em]">Analysis Matrix</span>
            </div>
            <div className="divide-y-2 divide-gray-200">
              <div className="h-16 flex items-center px-8 text-xs font-black text-gray-500 uppercase">{labels.cost}</div>
              <div className="h-16 flex items-center px-8 text-xs font-black text-black bg-gray-100 uppercase">변동/절감액</div>
              <div className="h-16 flex items-center px-8 text-xs font-black text-gray-500 uppercase">전용 면적 (평)</div>
              <div className="h-16 flex items-center px-8 text-xs font-black text-gray-500 uppercase">준공 연도</div>
              <div className="h-16 flex items-center px-8 text-xs font-black text-gray-500 uppercase">주차 수용력</div>
              <div className="h-16 flex items-center px-8 text-xs font-black text-gray-500 uppercase">행정 리스크</div>
              <div className="h-32 flex items-center px-8 text-xs font-black text-black bg-gray-100 uppercase italic">Metric Breakdown</div>
              <div className="h-24 flex items-center px-8 text-sm font-black text-white bg-black uppercase">{labels.effect}</div>
              <div className="h-24 flex items-center px-8 text-xs font-black text-gray-500 uppercase">Detailed Action</div>
            </div>
          </div>

          {/* 물건 데이터 열 */}
          {buildings.map((b, idx: number) => (
            <div
              key={b.id}
              className={`col-span-3 border-r-2 border-black last:border-r-0 transition-all ${idx === bestIdx ? 'bg-white z-10 shadow-[0_0_40px_rgba(0,0,0,0.1)]' : 'opacity-80'
                }`}
            >
              <div className="h-40 border-b-2 border-black p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {idx === bestIdx && (
                      <span className="bg-black text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter">Selected</span>
                    )}
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Candidate {idx + 1}</span>
                  </div>
                  <h3 className="font-black text-black text-lg line-clamp-2 leading-tight uppercase italic">{b.name}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[10px] font-medium truncate">{b.address}</span>
                </div>
              </div>

              <div className="divide-y-2 divide-gray-100">
                <div className="h-16 flex items-center px-6 font-black text-black text-lg tracking-tighter">
                  {formatManwon(toSafeNumber(b.metrics.cost))}
                </div>

                <div className={`h-16 flex items-center px-6 ${idx === bestIdx ? 'bg-gray-50' : ''}`}>
                  <div className="flex flex-col">
                    <span className={`text-base font-black ${toSafeNumber(b.analysis.monthlySaving) >= 0 ? 'text-black' : 'text-gray-400'}`}>
                      {formatSignedDelta(toSafeNumber(b.analysis.monthlySaving))}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Value Delta</span>
                  </div>
                </div>

                <div className="h-16 flex items-center px-6">
                  <div className="flex flex-col">
                    <span className="text-base font-black text-black">{toPyung(toSafeNumber(b.metrics.area))}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{toSafeNumber(b.metrics.area).toFixed(1)} m²</span>
                  </div>
                </div>

                <div className="h-16 flex items-center px-6 text-sm font-black text-black italic">
                  {toSafeNumber(b.metrics.year)} <span className="text-[10px] text-gray-400 ml-1">({new Date().getFullYear() - toSafeNumber(b.metrics.year)}Y)</span>
                </div>

                <div className="h-16 flex items-center px-6 text-sm font-black text-black uppercase">
                  {toSafeNumber(b.metrics.parking)} UNITS
                </div>

                <div className="h-16 flex items-center px-6 text-xs font-black">
                  <span className={b.tags.riskLevel === 'SAFE' ? 'text-black' : 'text-gray-300 line-through'}>
                    {b.tags.riskLevel === 'SAFE' ? 'CERTIFIED' : 'VIOLATION'}
                  </span>
                </div>

                <div className="h-32 p-4 bg-gray-50/50 flex items-center">
                  <ScoreBreakdownChart breakdown={b.analysis.breakdown} />
                </div>

                <div className={`h-24 flex items-center px-6 ${idx === bestIdx ? 'bg-black text-white' : 'bg-gray-100'}`}>
                  <div className="flex flex-col">
                    <span className={`text-xl font-black ${idx === bestIdx ? 'text-white' : 'text-black'} tracking-tighter`}>
                      {formatSignedManwon(b.analysis.cumulativeEffect3Y)}
                    </span>
                    <span className={`text-[9px] font-black ${idx === bestIdx ? 'text-gray-400' : 'text-gray-400'} uppercase tracking-widest`}>
                      3Y Projected Gain
                    </span>
                  </div>
                </div>

                <div className="h-24 flex items-center px-6">
                  <button
                    onClick={() => onViewDetail(b.id)}
                    className={`w-full py-3 rounded-none text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 border-black ${idx === bestIdx
                      ? 'bg-black text-white hover:bg-white hover:text-black'
                      : 'bg-white text-black hover:bg-black hover:text-white'
                      }`}
                  >
                    View Analysis
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
