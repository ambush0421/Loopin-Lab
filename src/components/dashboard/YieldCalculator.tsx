'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function YieldCalculator() {
  const [inputs, setInputs] = useState({
    price: 0,       // 매매가 (억원)
    loanRatio: 60,  // 대출비율 (%)
    interestRate: 4.5, // 대출금리 (%)
    deposit: 0,     // 보증금 (억원)
    monthlyRent: 0, // 월 임대료 (만원)
    managementFee: 0, // 월 관리비 (만원)
  });

  const [results, setResults] = useState({
    realInvestment: 0, // 실투자금
    monthlyInterest: 0, // 월 이자
    monthlyNetIncome: 0, // 월 순수익
    yieldRate: 0,      // 수익률
  });

  const calculate = () => {
    const price = inputs.price * 100000000; // 억원 -> 원
    const loan = price * (inputs.loanRatio / 100);
    const deposit = inputs.deposit * 100000000;
    const rent = inputs.monthlyRent * 10000; // 만원 -> 원
    const interest = loan * (inputs.interestRate / 100 / 12);
    
    const realInvest = price - loan - deposit;
    const netIncome = rent - interest; // 관리비는 보통 수익에서 제외하거나 별도 처리
    const yieldRate = realInvest > 0 ? (netIncome * 12 / realInvest) * 100 : 0;

    setResults({
      realInvestment: realInvest,
      monthlyInterest: interest,
      monthlyNetIncome: netIncome,
      yieldRate: yieldRate
    });
  };

  useEffect(() => {
    calculate();
  }, [inputs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: Number(value) }));
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          💰 수익률 시뮬레이터
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">매매가 (억원)</label>
            <input type="number" name="price" value={inputs.price} onChange={handleChange} className="w-full p-2 border rounded font-mono text-right" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">대출비율 (%)</label>
            <input type="number" name="loanRatio" value={inputs.loanRatio} onChange={handleChange} className="w-full p-2 border rounded font-mono text-right" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">대출금리 (%)</label>
            <input type="number" name="interestRate" value={inputs.interestRate} onChange={handleChange} className="w-full p-2 border rounded font-mono text-right" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">보증금 (억원)</label>
            <input type="number" name="deposit" value={inputs.deposit} onChange={handleChange} className="w-full p-2 border rounded font-mono text-right" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">월 임대료 (만원)</label>
            <input type="number" name="monthlyRent" value={inputs.monthlyRent} onChange={handleChange} className="w-full p-2 border rounded font-mono text-right" />
          </div>
        </div>

        <div className="bg-zinc-50 p-4 rounded-lg space-y-3 border border-zinc-100">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-600">실투자금</span>
            <span className="text-lg font-black text-zinc-900">{(results.realInvestment / 100000000).toFixed(2)} 억</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-600">월 순수익</span>
            <span className={`text-lg font-black ${results.monthlyNetIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {(results.monthlyNetIncome / 10000).toLocaleString()} 만원
            </span>
          </div>
          <div className="pt-2 border-t border-zinc-200 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-600">연 수익률 (ROI)</span>
            <span className={`text-2xl font-black ${results.yieldRate >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {results.yieldRate.toFixed(2)} %
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
