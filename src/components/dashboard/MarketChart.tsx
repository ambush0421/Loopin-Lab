'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ResponsiveContainerProps } from 'recharts';

interface MarketChartProps {
  trends?: { month: string; price: number }[];
}

export function MarketChart({ trends }: MarketChartProps) {
  // 데이터가 없을 때 표시할 기본값
  const defaultTrends = [
    { month: '24.01', price: 5200 },
    { month: '24.02', price: 5400 },
    { month: '24.03', price: 5300 },
    { month: '24.04', price: 5600 },
    { month: '24.05', price: 5800 },
    { month: '24.06', price: 6100 },
  ];

  const chartData = trends && trends.length > 0 ? trends : defaultTrends;

  return (
    <Card className="h-full border-none shadow-lg rounded-3xl overflow-hidden flex flex-col bg-white">
      <CardHeader className="p-5 pb-2 bg-slate-50 border-b border-slate-100">
        <CardTitle className="text-sm font-bold text-slate-600 flex justify-between items-center">
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            주변 실거래 시세 추이
          </span>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
            만원/평
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 pb-2">
        <div className="h-full w-full min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis
                hide
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                formatter={(value: any) => [`${value?.toLocaleString()}만원`, '평당가']}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-500 font-medium">최근 6개월 데이터</span>
          </div>
          <p className="text-[10px] text-slate-400">
            * {trends ? '실시간 데이터' : '샘플 데이터'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}