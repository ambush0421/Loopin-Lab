'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { analyzePerformance, FinancialInputs } from '@/lib/finance';
import { 
  Coins, Landmark, Percent, Home, AlertCircle, 
  ArrowRightCircle, TrendingUp, DollarSign 
} from 'lucide-react';

export function ExpertCalculator() {
  const [inputs, setInputs] = useState<FinancialInputs>({
    purchasePrice: 3000000000, // 30억
    targetLoanRatio: 60,
    interestRate: 4.5,
    loanTermYears: 30,
    gracePeriodMonths: 12,
    isCorporate: true,
    isInOvercrowded: true,
    expectedVacancy: 5,
    operatingExpenses: 150, // 150만
    monthlyRent: 1200,      // 1200만
  });

  const results = useMemo(() => analyzePerformance(inputs), [inputs]);

  const formatKRW = (val: number) => {
    if (val >= 100000000) return `${(val / 100000000).toFixed(2)}억원`;
    return `${(val / 10000).toLocaleString()}만원`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 왼쪽: 컨트롤러 (Inputs) */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-8">
            <CardTitle className="text-lg flex items-center gap-2">
              <Landmark className="w-5 h-5 text-blue-400" />
              시뮬레이션 변수 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* 법인 여부 토글 (Checkbox fallback) */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-slate-700">법인 여부</Label>
                <p className="text-[10px] text-slate-400">취득세 중과 여부 결정</p>
              </div>
              <input 
                type="checkbox"
                checked={inputs.isCorporate} 
                onChange={(e) => setInputs(prev => ({ ...prev, isCorporate: e.target.checked }))}
                className="w-5 h-5 rounded accent-blue-600"
              />
            </div>

            {/* 과밀억제권역 토글 */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-slate-700">과밀억제권역</Label>
                <p className="text-[10px] text-slate-400">수도권 취득세 기준</p>
              </div>
              <input 
                type="checkbox"
                checked={inputs.isInOvercrowded} 
                onChange={(e) => setInputs(prev => ({ ...prev, isInOvercrowded: e.target.checked }))}
                className="w-5 h-5 rounded accent-blue-600"
              />
            </div>

            {/* LTV 슬라이더 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-bold text-slate-700">대출 비중 (LTV)</Label>
                <span className="text-sm font-black text-blue-600">{inputs.targetLoanRatio}%</span>
              </div>
              <input 
                type="range" min="0" max="90" step="5"
                value={inputs.targetLoanRatio}
                onChange={(e) => setInputs(prev => ({ ...prev, targetLoanRatio: Number(e.target.value) }))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* 금리 슬라이더 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-bold text-slate-700">대출 금리</Label>
                <span className="text-sm font-black text-blue-600">{inputs.interestRate}%</span>
              </div>
              <input 
                type="range" min="2" max="10" step="0.1"
                value={inputs.interestRate}
                onChange={(e) => setInputs(prev => ({ ...prev, interestRate: Number(e.target.value) }))}
                className="w-full accent-blue-600"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 오른쪽: 분석 결과 (Outputs) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 초기 투자 비용 분석 */}
          <Card className="border-none shadow-lg rounded-[2rem] bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                초기 투입 자금
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                <span className="text-xs text-slate-400 font-medium">자기자본 (Equity)</span>
                <span className="text-xl font-black text-slate-900">{formatKRW(results.initial.equity)}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>취득세 (예상)</span>
                  <span className="font-bold text-red-500">{formatKRW(results.initial.acquisitionTax)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>대출 실행액</span>
                  <span className="font-bold text-blue-600">{formatKRW(results.initial.loanAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 수익성 지표 */}
          <Card className="border-none shadow-lg rounded-[2rem] bg-blue-600 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                핵심 수익성 지표
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-[10px] font-bold opacity-70 mb-1">세후 실질 수익률 (CoC)</p>
                <h3 className="text-4xl font-black">{results.metrics.cocReturn.toFixed(2)}%</h3>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs opacity-70">Cap Rate</span>
                <span className="text-lg font-bold">{results.metrics.capRate.toFixed(2)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 월간 현금 흐름 분석 */}
        <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">월간 현금 흐름 (Cash Flow)</h3>
              <div className="px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black">정상 수지</div>
            </div>
            <div className="p-8 grid grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">총 임대수입</p>
                <p className="text-lg font-black text-slate-900">{formatKRW(results.monthly.grossIncome)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">월 이자 비용</p>
                <p className="text-lg font-black text-red-500">-{formatKRW(results.monthly.interest)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">순현금흐름</p>
                <p className="text-xl font-black text-blue-600">{formatKRW(results.monthly.cashFlow)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 안내 문구 */}
        <div className="flex items-start gap-3 p-6 bg-amber-50 rounded-3xl border border-amber-100">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed font-medium">
            본 시뮬레이션은 취득세 중과 및 공실률 5%를 가정한 보수적 추정치입니다. 실제 대출 한도와 금리는 법인의 신용도 및 건물의 감정가에 따라 달라질 수 있으므로 반드시 금융기관과 확인하시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
}
