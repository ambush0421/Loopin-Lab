'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ScoreBreakdownChartProps {
  breakdown?: {
    costScore: number;
    areaScore: number;
    parkingScore: number;
    modernityScore: number;
  };
}

const ScoreBreakdownChart: React.FC<ScoreBreakdownChartProps> = ({ breakdown }) => {
  const safeBreakdown = breakdown || { costScore: 0, areaScore: 0, parkingScore: 0, modernityScore: 0 };

  const data = [
    { name: '가성비', score: Math.max(0, safeBreakdown.costScore), color: '#000000' },
    { name: '공간성', score: Math.max(0, safeBreakdown.areaScore), color: '#333333' },
    { name: '편의성', score: Math.max(0, safeBreakdown.parkingScore), color: '#666666' },
    { name: '신축도', score: Math.max(0, safeBreakdown.modernityScore), color: '#999999' },
  ];

  return (
    <div className="h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="2 2" horizontal={false} stroke="#eee" />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            fontSize={10}
            width={40}
            tickLine={false}
            axisLine={false}
            tick={{ fontWeight: 'bold' }}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '4px', padding: '4px 8px' }}
            itemStyle={{ color: '#fff', fontSize: '10px' }}
            labelStyle={{ display: 'none' }}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={12}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreBreakdownChart;
