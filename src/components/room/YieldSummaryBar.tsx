import React from 'react';
import { useRoomStore } from '@/stores/roomStore';
import { formatPrice } from '@/utils/format';
import { TrendingUp, Calculator } from 'lucide-react';

export const YieldSummaryBar: React.FC = () => {
    const { getInvestmentAnalysis, selectedRooms, totalFinancials } = useRoomStore();

    if (selectedRooms.length === 0) return null;

    const analysis = getInvestmentAnalysis();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg p-4 slide-in-from-bottom flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm md:text-base">
                    선택된 호실: {selectedRooms.length}개
                    (매매가: <span className="font-bold">{formatPrice(totalFinancials.salePrice)}</span>)
                </span>
            </div>

            <div className="flex items-center gap-4 bg-muted/50 rounded-full px-4 py-2">
                <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground">명목수익률</span>
                    <span className="font-bold text-sm md:text-lg">{analysis.grossYield.toFixed(2)}%</span>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground">순수익률(Net)</span>
                    <span className="font-bold text-sm md:text-lg">{analysis.netYield.toFixed(2)}%</span>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex flex-col items-center text-primary">
                    <span className="text-xs flex items-center gap-1"><TrendingUp className="w-3 h-3" /> 레버리지수익률</span>
                    <span className="font-black text-sm md:text-lg">{analysis.leveragedYield.toFixed(2)}%</span>
                </div>
            </div>
        </div>
    );
};

export default YieldSummaryBar;
