'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Building2, Calendar, Loader2, AlertCircle, ExternalLink } from "lucide-react";

interface RealTradeChartProps {
    lawdCd: string; // 법정동 코드 앞 5자리
    buildingName?: string;
    dong?: string;
    buildingType?: 'commercial' | 'officetel';
}

interface TradeData {
    price: number;
    area: number;
    pyung: number;
    pricePerPyung: number;
    floor: string;
    dealYear: string;
    dealMonth: string;
    dealDay?: string;
}

interface TradeStats {
    count: number;
    avgPricePerPyung: number;
    minPricePerPyung: number;
    maxPricePerPyung: number;
    recentTrades: TradeData[];
}

interface RentStats {
    count: number;
    avgDepositPerPyung: number;
    avgMonthlyPerPyung: number;
    recentRents: any[];
}

export function RealTradeChart({ lawdCd, buildingName, dong, buildingType = 'officetel' }: RealTradeChartProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tradeStats, setTradeStats] = useState<TradeStats | null>(null);
    const [rentStats, setRentStats] = useState<RentStats | null>(null);
    const [recentTrades, setRecentTrades] = useState<any[]>([]);

    useEffect(() => {
        if (!lawdCd) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    lawdCd,
                    type: buildingType,
                    ...(buildingName && { buildingName }),
                    ...(dong && { dong })
                });

                const response = await fetch(`/api/real-trade?${params}`);
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || '조회 실패');
                }

                if (result.success) {
                    setTradeStats(result.data.stats.trade);
                    setRentStats(result.data.stats.rent);
                    setRecentTrades(result.data.trades || []);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [lawdCd, buildingName, dong, buildingType]);

    // 데이터가 없거나 로딩 중인 경우
    if (!lawdCd) {
        return null;
    }

    return (
        <Card className="border border-slate-200 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        주변 실거래가 시세
                    </CardTitle>
                    <a
                        href="https://rt.molit.go.kr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-200 hover:text-white flex items-center gap-1 transition-colors"
                    >
                        국토부 실거래가
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
                <p className="text-blue-200 text-xs mt-1">최근 6개월 실거래 데이터 (공공데이터포털)</p>
            </CardHeader>

            <CardContent className="p-5">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="ml-3 text-slate-500">실거래가 조회 중...</span>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-12 text-amber-600">
                        <AlertCircle className="w-6 h-6 mr-2" />
                        <div>
                            <p className="font-medium">실거래가 조회 불가</p>
                            <p className="text-xs text-slate-500 mt-1">API 키 승인 대기 중이거나 데이터가 없습니다.</p>
                        </div>
                    </div>
                ) : !tradeStats && !rentStats ? (
                    <div className="text-center py-12 text-slate-400">
                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">해당 지역 실거래 데이터 없음</p>
                        <p className="text-xs mt-1">최근 6개월간 거래 내역이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* 매매 시세 */}
                        {tradeStats && (
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                    매매 시세 ({tradeStats.count}건)
                                </h3>

                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                                        <p className="text-xs text-slate-500 mb-1">평균 평당가</p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {(tradeStats.avgPricePerPyung / 10000).toFixed(0)}
                                            <span className="text-sm font-normal text-slate-500 ml-1">만원</span>
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                                        <p className="text-xs text-blue-600 mb-1">최저가</p>
                                        <p className="text-xl font-bold text-blue-700">
                                            {(tradeStats.minPricePerPyung / 10000).toFixed(0)}
                                            <span className="text-sm font-normal ml-1">만원</span>
                                        </p>
                                    </div>
                                    <div className="bg-rose-50 p-4 rounded-xl text-center">
                                        <p className="text-xs text-rose-600 mb-1">최고가</p>
                                        <p className="text-xl font-bold text-rose-700">
                                            {(tradeStats.maxPricePerPyung / 10000).toFixed(0)}
                                            <span className="text-sm font-normal ml-1">만원</span>
                                        </p>
                                    </div>
                                </div>

                                {/* 최근 거래 목록 */}
                                {tradeStats.recentTrades && tradeStats.recentTrades.length > 0 && (
                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-100">
                                                <tr className="text-xs text-slate-600">
                                                    <th className="px-3 py-2 text-left">거래일</th>
                                                    <th className="px-3 py-2 text-right">층</th>
                                                    <th className="px-3 py-2 text-right">면적(평)</th>
                                                    <th className="px-3 py-2 text-right">거래가</th>
                                                    <th className="px-3 py-2 text-right">평당가</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {tradeStats.recentTrades.map((trade, i) => (
                                                    <tr key={i} className="hover:bg-slate-50">
                                                        <td className="px-3 py-2 text-slate-600">
                                                            {trade.dealYear}.{trade.dealMonth}.{trade.dealDay || '??'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-mono">{trade.floor}F</td>
                                                        <td className="px-3 py-2 text-right">{trade.pyung?.toFixed(1)}</td>
                                                        <td className="px-3 py-2 text-right font-medium">
                                                            {(trade.price / 10000).toFixed(1)}억
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-bold text-blue-600">
                                                            {(trade.pricePerPyung / 10000).toFixed(0)}만
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 전월세 시세 */}
                        {rentStats && (
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                                    전월세 시세 ({rentStats.count}건)
                                </h3>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-emerald-50 p-4 rounded-xl text-center">
                                        <p className="text-xs text-emerald-600 mb-1">평균 보증금 (평당)</p>
                                        <p className="text-xl font-bold text-emerald-700">
                                            {rentStats.avgDepositPerPyung?.toLocaleString() || '-'}
                                            <span className="text-sm font-normal ml-1">만원</span>
                                        </p>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-xl text-center">
                                        <p className="text-xs text-amber-600 mb-1">평균 월세 (평당)</p>
                                        <p className="text-xl font-bold text-amber-700">
                                            {rentStats.avgMonthlyPerPyung?.toLocaleString() || '-'}
                                            <span className="text-sm font-normal ml-1">만원</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 데이터 출처 */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 text-center">
                        데이터 출처: 국토교통부 실거래가 공개시스템 (공공데이터포털 API)
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
