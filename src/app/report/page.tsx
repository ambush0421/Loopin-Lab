"use client";

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Share2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddressSearch from '@/components/common/AddressSearch';
import BuildingInfoCard from '@/components/building/BuildingInfoCard';
import RoomSelector from '@/components/room/RoomSelector';
import TotalFinancialEditor from '@/components/financial/TotalFinancialEditor';
import RoomFinancialEditor from '@/components/financial/RoomFinancialEditor';
import LoanSimulator from '@/components/financial/LoanSimulator';
import InvestmentDashboard from '@/components/financial/InvestmentDashboard';
import NearbyTransactions from '@/components/location/NearbyTransactions';
import KakaoMap from '@/components/location/KakaoMap';
import { useBuildingStore } from '@/stores/buildingStore';
import { useRoomStore } from '@/stores/roomStore';

const ReportPage: React.FC = () => {
  const { buildingInfo } = useBuildingStore();
  const { selectedRooms } = useRoomStore();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `부동산_분석_보고서_${buildingInfo?.bldNm || ''}`,
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("보고서 링크가 복사되었습니다.");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-10 space-y-10">
        {/* 상단 검색 영역 */}
        <section className="no-print">
          <AddressSearch />
        </section>

        {buildingInfo && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 인쇄 대상 영역 */}
            <div ref={printRef} className="space-y-10 print:p-8 print:bg-white">
              <header className="hidden print:flex justify-between items-center border-b-2 border-primary pb-4 mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-primary">부동산 분석 보고서</h1>
                  <p className="text-sm text-muted-foreground">{buildingInfo.bldNm}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  생성일: {new Date().toLocaleDateString()}
                </div>
              </header>

              <BuildingInfoCard />
              
              <div className="space-y-8">
                <KakaoMap />
                <NearbyTransactions />
              </div>

              <RoomSelector />

              {selectedRooms.length > 0 && (
                <>
                  <TotalFinancialEditor />
                  <RoomFinancialEditor />
                  <div className="page-break" />
                  <LoanSimulator />
                  <InvestmentDashboard />
                </>
              )}

              <footer className="hidden print:block text-center pt-10 border-t text-xs text-muted-foreground">
                © 2026 Building Report Pro. 본 보고서는 참고용이며 실제와 다를 수 있습니다.
              </footer>
            </div>

            {/* 하단 액션 버튼 (인쇄 제외) */}
            <div className="no-print fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-50">
              <Button size="lg" className="shadow-2xl rounded-full px-8" onClick={() => handlePrint()}>
                <Printer className="w-5 h-5 mr-2" /> 보고서 출력 (PDF)
              </Button>
              <Button size="lg" variant="outline" className="shadow-2xl rounded-full px-8" onClick={handleCopyLink}>
                <Share2 className="w-5 h-5 mr-2" /> 링크 복사
              </Button>
            </div>
          </div>
        )}

        {!buildingInfo && (
          <div className="py-20 text-center space-y-4 opacity-50">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">보고서를 생성하려면 주소를 검색해 주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;
