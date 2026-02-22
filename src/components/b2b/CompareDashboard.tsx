'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRoomStore } from '@/stores/roomStore';
import { formatPrice, formatPercent } from '@/utils/format';
import { calcGrossYield, calcNOI, calcCapRate, calcLeveragedYield } from '@/utils/calculate';
import { Building, MapPin, TrendingUp, Search } from 'lucide-react';
import { DEFAULT_VACANCY_RATE, DEFAULT_MANAGEMENT_FEE_RATE } from '@/constants';
import { mockBkitUnitResponse } from '@/mocks/building';

export const CompareDashboard: React.FC = () => {
    const { selectedRooms, loanSimulation, setAllRooms, addAllRooms } = useRoomStore();

    useEffect(() => {
        // 데이터가 비어있을 경우 B2B 시연용 목업 데이터 주입
        if (selectedRooms.length === 0) {
            // 목업 데이터 3개를 가공하여 주입
            const b2bMocks: any[] = [
                {
                    ...mockBkitUnitResponse[0],
                    id: 'mock-b2b-1',
                    hoNm: '테헤란로 센트럴 타워 15층',
                    salePrice: 15000000000, // 150억
                    deposit: 1000000000,    // 10억
                    monthlyRent: 80000000,  // 8천만원
                },
                {
                    ...mockBkitUnitResponse[1],
                    id: 'mock-b2b-2',
                    hoNm: '강남 프라임 오피스 8층',
                    salePrice: 8500000000,  // 85억
                    deposit: 500000000,     // 5억
                    monthlyRent: 45000000,  // 4500만원
                },
                {
                    ...mockBkitUnitResponse[0],
                    id: 'mock-b2b-3',
                    hoNm: '판교 테크원 타워 22층',
                    salePrice: 22000000000, // 220억
                    deposit: 1500000000,    // 15억
                    monthlyRent: 110000000, // 1억 1천만원
                }
            ];

            // Zustand store 에 mock 데이터 업로드 후 일괄 선택
            setAllRooms(b2bMocks);
            setTimeout(() => addAllRooms(), 0);
        }
    }, [selectedRooms.length, setAllRooms, addAllRooms]);
    const compareItems = selectedRooms.slice(0, 3);
    const emptySlotsCount = Math.max(0, 3 - compareItems.length);
    const emptySlots = Array.from({ length: emptySlotsCount });

    return (
        <div className="w-full min-h-screen bg-neutral-950 text-neutral-50 p-6 md:p-10 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white mb-2">
                            Property Comparison
                        </h1>
                        <p className="text-neutral-400 text-sm md:text-base">
                            Side-by-side asset performance metrics for professional investors.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="border-neutral-800 bg-neutral-900 text-neutral-200 hover:bg-neutral-800">
                            <Search className="w-4 h-4 mr-2" /> Select Properties
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            Export PDF
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {compareItems.map((room, idx) => {
                        // 개별 호실/건물에 대한 지표 계산 연동
                        const pgi = room.monthlyRent * 12;
                        const noi = calcNOI(room.monthlyRent, DEFAULT_VACANCY_RATE, DEFAULT_MANAGEMENT_FEE_RATE);
                        const capRate = calcCapRate(noi, room.salePrice);
                        const grossYield = calcGrossYield(room.monthlyRent, room.salePrice);

                        // 시뮬레이션 대출 비율 적용 (개별)
                        const roomLoanAmount = Math.round(room.salePrice * (loanSimulation.loanRatio / 100));
                        const roomSelfFunding = room.salePrice - roomLoanAmount;
                        const roomAnnualInterest = Math.round(roomLoanAmount * (loanSimulation.interestRate / 100));
                        const leveragedYield = calcLeveragedYield(noi, roomAnnualInterest, roomSelfFunding);

                        return (
                            <Card key={room.id} className="bg-neutral-900 border-neutral-800 overflow-hidden flex flex-col">
                                <div className="h-48 bg-neutral-800 relative group overflow-hidden">
                                    {/* Placeholder for Property Image */}
                                    <div className="absolute inset-0 flex items-center justify-center text-neutral-600 group-hover:scale-105 transition-transform duration-500">
                                        <Building className="w-16 h-16 opacity-20" />
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <Badge className="bg-black/50 backdrop-blur-md text-blue-400 border border-blue-900/50">
                                            Asset 0{idx + 1}
                                        </Badge>
                                    </div>
                                </div>

                                <CardHeader className="pb-2">
                                    <div className="flex items-center text-neutral-400 text-xs mb-1">
                                        <MapPin className="w-3 h-3 mr-1" /> 서울특별시 강남구 (가설정)
                                    </div>
                                    <CardTitle className="text-xl font-bold text-white">
                                        {room.floor}층 {room.hoNm}
                                    </CardTitle>
                                    <p className="text-sm text-neutral-500">{room.mainPurpsCdNm} | {room.area}㎡</p>
                                </CardHeader>

                                <CardContent className="flex-1 mt-4">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-neutral-800 pb-2">
                                            <span className="text-sm text-neutral-400">Purchase Price</span>
                                            <span className="text-lg font-bold text-white tracking-tight">
                                                {formatPrice(room.salePrice / 10000)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-neutral-800 pb-2">
                                            <span className="text-sm text-neutral-400">Cap Rate</span>
                                            <span className="text-lg font-bold text-blue-400">
                                                {formatPercent(capRate)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-neutral-800 pb-2">
                                            <span className="text-sm text-neutral-400">NOI (Annual)</span>
                                            <span className="text-lg font-semibold text-white">
                                                {formatPrice(noi / 10000)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end pt-2">
                                            <span className="text-sm flex items-center gap-1 text-neutral-400">
                                                Leveraged Yield <TrendingUp className="w-3 h-3 text-emerald-400" />
                                            </span>
                                            <span className="text-xl font-black text-emerald-400">
                                                {formatPercent(leveragedYield)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {emptySlots.map((_, idx) => (
                        <Card key={`empty-${idx}`} className="bg-neutral-900/50 border-neutral-800 border-dashed flex flex-col items-center justify-center min-h-[400px] hover:bg-neutral-900 transition-colors cursor-pointer opacity-60">
                            <div className="rounded-full bg-neutral-800 p-4 mb-4">
                                <Search className="w-6 h-6 text-neutral-500" />
                            </div>
                            <h3 className="text-lg font-medium text-neutral-300">Add Property</h3>
                            <p className="text-sm text-neutral-500 mt-1">Select from portfolio to compare</p>
                        </Card>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default CompareDashboard;
