'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, TrendingDown, TrendingUp, MapPin, Calendar, Car, BarChart3 } from 'lucide-react';
import ScoreBreakdownChart from "@/components/charts/ScoreBreakdownChart";
import {
  toSafeNumber,
  formatManwon,
  formatSignedBillionFromManwon
} from '@/lib/utils/finance-format';

interface MobileComparisonCardProps {
  building: MobileComparisonBuilding;
  index: number;
  isBest: boolean;
}

type MobileComparisonBuilding = {
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
  };
  tags: {
    riskLevel: 'SAFE' | 'CAUTION' | 'DANGER';
  };
  metrics: {
    cost: number;
    area: number;
    year: number;
    parking: number;
    marketAvgPyung?: number;
  };
};

export function MobileComparisonCard({ building, index, isBest }: MobileComparisonCardProps) {
  const toPyung = (m2: number) => (m2 * 0.3025).toFixed(1);

  return (
    <Card className={`w-full border-none shadow-xl rounded-[2rem] overflow-hidden bg-white mb-4 ${isBest ? 'ring-4 ring-blue-500/20' : ''
      }`}>
      <CardContent className="p-0">
        {/* 상단 헤더 섹션 */}
        <div className={`p-6 ${isBest ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Candidate {index + 1}</span>
            {isBest && (
              <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5">
                <Trophy className="w-3 h-3 text-yellow-300" />
                <span className="text-[10px] font-bold">AI BEST CHOICE</span>
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold mb-2 line-clamp-1 break-words">{building.name}</h3>
          <div className="flex items-start gap-1.5 text-white/60 text-xs">
            <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2 break-words leading-snug">{building.address}</span>
          </div>
        </div>

        {/* 메인 지표 섹션 */}
        <div className="p-6 grid grid-cols-2 gap-4 border-b border-slate-50">
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">월 고정비</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900">{formatManwon(building.metrics.cost)}</span>
              {toSafeNumber(building.analysis.monthlySaving) > 0 && <TrendingDown className="w-3 h-3 text-blue-500" />}
              {toSafeNumber(building.analysis.monthlySaving) < 0 && <TrendingUp className="w-3 h-3 text-amber-500" />}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">전용 면적</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900">{toPyung(toSafeNumber(building.metrics.area))}평</span>
              <span className="text-[10px] text-slate-400">({toSafeNumber(building.metrics.area).toFixed(0)}㎡)</span>
            </div>
          </div>
        </div>

        {/* 분석 스코어링 섹션 (신규 추가) */}
        <div className="p-6 border-b border-slate-50">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">항목별 분석 스코어</span>
          </div>
          <ScoreBreakdownChart breakdown={building.analysis.breakdown} />
        </div>

        {/* 상세 스펙 섹션 */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">인근 시세 평균</p>
                <p className="text-sm font-bold text-slate-700">{formatManwon(building.metrics.marketAvgPyung || 0)}/평</p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-[10px] font-black whitespace-nowrap align-self-start shrink-0 ${building.tags.riskLevel === 'SAFE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
              {building.tags.riskLevel === 'SAFE' ? '정상건물' : '주의필요'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">준공연도</p>
                <p className="text-xs font-bold text-slate-700">{toSafeNumber(building.metrics.year)}년</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Car className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">주차대수</p>
                <p className="text-xs font-bold text-slate-700">{toSafeNumber(building.metrics.parking)}대</p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 3년 누적 이익 섹션 */}
        <div className={`p-6 ${isBest ? 'bg-blue-50' : 'bg-slate-50'} flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">3년 누적 실질 이익</p>
            <p className={`text-xl font-black ${isBest ? 'text-blue-600' : 'text-slate-700'}`}>
              {formatSignedBillionFromManwon(building.analysis.cumulativeEffect3Y)}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBest ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
