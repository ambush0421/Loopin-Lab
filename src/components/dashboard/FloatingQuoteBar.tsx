'use client';

import { useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { FileText, X, Layers, SquareStack } from "lucide-react";

interface FloatingQuoteBarProps {
  selectedUnits: any[];
  onClear: () => void;
  onGenerate: () => void;
}

export function FloatingQuoteBar({ selectedUnits, onClear, onGenerate }: FloatingQuoteBarProps) {
  const stats = useMemo(() => {
    const count = selectedUnits.length;

    const totalArea = selectedUnits.reduce((sum, u) => {
      const rawArea = u.area || u.exposArea || 0;
      const val = typeof rawArea === 'string' ? parseFloat(rawArea.replace(/,/g, '')) : Number(rawArea);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const pyung = totalArea * 0.3025;

    return { count, totalArea, pyung };
  }, [selectedUnits]);

  if (stats.count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4 animate-in slide-in-from-bottom-8 duration-400 print:hidden">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/40 p-3 px-5 flex items-center justify-between border border-white/10 backdrop-blur-xl">

        {/* 좌측: 선택 정보 */}
        <div className="flex items-center gap-6">
          {/* 선택 호실 수 */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <SquareStack className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">선택 호실</p>
              <p className="text-xl font-bold text-white">{stats.count}<span className="text-sm text-slate-400 ml-1">개</span></p>
            </div>
          </div>

          <div className="h-10 w-px bg-white/10"></div>

          {/* 총 면적 */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">총 전용면적</p>
              <p className="text-xl font-bold text-white">
                {stats.pyung.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                <span className="text-sm text-slate-400 ml-1">평</span>
              </p>
            </div>
          </div>
        </div>

        {/* 우측: 버튼 */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="p-2.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title="선택 해제"
          >
            <X className="w-5 h-5" />
          </button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              onGenerate();
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-5 h-auto font-bold flex items-center gap-2.5 shadow-lg shadow-blue-600/30 transition-all"
          >
            <FileText className="w-5 h-5" />
            <span>견적서 생성</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
