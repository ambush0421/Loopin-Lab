'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, Printer, CheckCircle2, AlertTriangle, FileText, TrendingUp, Home, Calendar, Activity, BarChart3, ArrowRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type ReportType = 'LEASE' | 'PURCHASE_USE' | 'PURCHASE_INVEST';

interface UnitData {
  _uid: string;
  area: any;
  hoNm: string;
  flrNo: any;
  flrGbCd?: string; // 층구분코드: 10=지하, 20=지상, 30=옥탑, 40=필로티
  customPrice?: number;
  customDeposit?: number;
  customRent?: number;
}

interface QuotationModalProps {
  selectedUnits: any[];
  buildingData: any;
  address: string;
  onClose: () => void;
}

// 층 정보 파싱 함수 (flrGbCd 코드 기반)
function parseFloor(unit: any): string {
  const flrNo = Number(unit.flrNo) || 0;
  const flrGbCd = unit.flrGbCd;

  if (flrGbCd === "10") {
    // 지하층
    return `지하 ${flrNo > 0 ? flrNo : 1}층`;
  } else if (flrGbCd === "30") {
    // 옥탑층
    return `옥탑 ${flrNo > 0 ? flrNo : ''}층`;
  } else if (flrGbCd === "40") {
    // 필로티
    return `필로티 ${flrNo > 0 ? flrNo : ''}층`;
  } else {
    // 지상층 (기본)
    return flrNo > 0 ? `${flrNo}층` : '-';
  }
}

export function QuotationModal({ selectedUnits, buildingData, address, onClose }: QuotationModalProps) {
  const [reportType, setReportType] = useState<ReportType>('LEASE');
  const [units, setUnits] = useState<UnitData[]>([]);

  const [pricePerPyung, setPricePerPyung] = useState(2500);
  const [depositPerPyung, setDepositPerPyung] = useState(150);
  const [rentPerPyung, setRentPerPyung] = useState(8);
  const [maintPerPyung, setMaintPerPyung] = useState(2.5);

  const [ltvRatio, setLtvRatio] = useState(70);
  const [interestRate, setInterestRate] = useState(4.5);

  const [currentOffice, setCurrentOffice] = useState({
    address: '',
    pyung: 0,
    deposit: 0,
    rent: 0,
    maint: 0,
  });

  const [additionalCost, setAdditionalCost] = useState({
    interior: 0,
    moving: 0,
    other: 0,
  });

  const [contractTerms, setContractTerms] = useState({
    period: '2년',
    rentFree: '',
    moveInDate: '',
  });

  const [reportMeta, setReportMeta] = useState({
    reportNo: `BR-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    reportDate: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
    department: '',
    writer: '',
    reviewer: '',
    approver: '',
    recommendation: 'POSITIVE' as 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE',
    comment: ''
  });

  const [tradeData, setTradeData] = useState<any>(null);
  const [loadingTrade, setLoadingTrade] = useState(false);

  useEffect(() => {
    // 다양한 필드명 대응 (sigunguCd, sigunguCode 등)
    const lawdCd = buildingData?.sigunguCd || buildingData?.sigunguCode;
    if (!lawdCd) {
      console.warn('RealTrade fetch skipped: lawdCd is missing', buildingData);
      return;
    }

    const fetchRealTrade = async () => {
      setLoadingTrade(true);
      try {
        const type = buildingData.mainPurpsCd === '14002' || buildingData.mainPurpsNm?.includes('오피스텔') ? 'officetel' : 'commercial';
        const dongFilter = buildingData.bjdongNm || buildingData.dongNm || '';

        console.log('Fetching real trade data for:', { lawdCd, type, dong: dongFilter });

        const params = new URLSearchParams({
          lawdCd: String(lawdCd),
          type: type,
          dong: String(dongFilter)
        });

        const res = await fetch(`/api/real-trade?${params}`);
        const result = await res.json();

        console.log('Real trade API response:', result);

        if (result.success && result.data) {
          setTradeData(result.data);
        } else {
          console.warn('Real trade API returned no data or failed:', result);
        }
      } catch (error) {
        console.error('Failed to fetch real trade data:', error);
      } finally {
        setLoadingTrade(false);
      }
    };

    fetchRealTrade();
  }, [buildingData]);

  useEffect(() => {
    setUnits(selectedUnits.map(u => ({ ...u })));
  }, [selectedUnits]);

  const toPyung = (m2: number): number => m2 * 0.3025;
  const parseArea = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val.replace(/,/g, '')) || 0;
    return 0;
  };

  const formatPrice = (manwon: number): string => {
    if (manwon >= 10000) {
      const uk = Math.floor(manwon / 10000);
      const remain = Math.round(manwon % 10000);
      return remain > 0 ? `${uk}억 ${remain.toLocaleString()}만원` : `${uk}억원`;
    }
    return `${Math.round(manwon).toLocaleString()}만원`;
  };

  const calculatedUnits = useMemo(() => {
    return units.map(u => {
      const areaM2 = parseArea(u.area);
      const pyung = toPyung(areaM2);
      return {
        ...u,
        areaM2,
        pyung,
        price: u.customPrice ?? Math.round(pyung * pricePerPyung),
        deposit: u.customDeposit ?? Math.round(pyung * depositPerPyung),
        rent: u.customRent ?? Math.round(pyung * rentPerPyung),
        maint: Math.round(pyung * maintPerPyung),
      };
    });
  }, [units, pricePerPyung, depositPerPyung, rentPerPyung, maintPerPyung]);

  const totals = useMemo(() => {
    return calculatedUnits.reduce((acc, curr) => ({
      areaM2: acc.areaM2 + curr.areaM2,
      pyung: acc.pyung + curr.pyung,
      price: acc.price + curr.price,
      deposit: acc.deposit + curr.deposit,
      rent: acc.rent + curr.rent,
      maint: acc.maint + curr.maint,
    }), { areaM2: 0, pyung: 0, price: 0, deposit: 0, rent: 0, maint: 0 });
  }, [calculatedUnits]);

  const monthlyTotal = totals.rent + totals.maint;
  const annualTotal = monthlyTotal * 12;
  const acquisitionTax = Math.round(totals.price * 0.046);
  const totalAcquisition = totals.price + acquisitionTax;
  const totalAdditionalCost = additionalCost.interior + additionalCost.moving + additionalCost.other;

  const loanAmount = Math.round(totals.price * (ltvRatio / 100));
  const equityRequired = totalAcquisition - loanAmount;
  const annualInterest = Math.round(loanAmount * (interestRate / 100));
  const annualRent = totals.rent * 12;
  const capRate = totals.price > 0 ? ((annualRent / totals.price) * 100).toFixed(2) : '0.00';
  const netCashFlow = annualRent - annualInterest;
  const roe = equityRequired > 0 ? ((netCashFlow / equityRequired) * 100).toFixed(2) : '0.00';

  const currentMonthly = currentOffice.rent + currentOffice.maint;
  const monthlyDiff = monthlyTotal - currentMonthly;

  const data = buildingData || {};
  const buildingName = data.bldNm || address?.split(' ').slice(0, 3).join(' ') || '-';
  const totalParking = (Number(data.indrAutoUtcnt || 0) + Number(data.oudrAutoUtcnt || 0) + Number(data.indrMechUtcnt || 0) + Number(data.oudrMechUtcnt || 0));
  const totalElevator = (Number(data.rideUseElvtCnt || 0) + Number(data.emgenUseElvtCnt || 0));

  const getReportTitle = () => {
    switch (reportType) {
      case 'LEASE': return '임차 검토 보고서';
      case 'PURCHASE_USE': return '매입 검토 보고서';
      case 'PURCHASE_INVEST': return '투자 검토 보고서';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 overflow-hidden print:p-0 print:bg-white print:block">

      <div className="flex w-full max-w-[1400px] h-[95vh] bg-white rounded-xl shadow-2xl overflow-hidden print:block print:h-auto print:shadow-none print:rounded-none">

        {/* 왼쪽: 설정 패널 */}
        <aside className="w-[360px] bg-neutral-50 border-r flex flex-col shrink-0 overflow-hidden print:hidden">
          <div className="p-4 bg-black text-white">
            <h2 className="text-sm font-bold tracking-wide">REPORT SETTINGS</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* 보고서 유형 */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Report Type</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { type: 'LEASE', label: '임차', icon: FileText },
                  { type: 'PURCHASE_USE', label: '매입(실사용)', icon: Home },
                  { type: 'PURCHASE_INVEST', label: '매입(투자)', icon: TrendingUp },
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setReportType(type as ReportType)}
                    className={`py-2 text-xs font-medium rounded transition-all flex flex-col items-center gap-1 ${reportType === type
                      ? 'bg-black text-white'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px]">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 시세 설정 */}
            <div className="space-y-3 p-3 bg-white rounded border border-neutral-200">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Price Settings (평당)</label>

              {reportType !== 'LEASE' && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-600">매매가</span>
                    <span className="font-bold">{pricePerPyung.toLocaleString()}만</span>
                  </div>
                  <input type="range" min="500" max="15000" step="50" value={pricePerPyung} onChange={(e) => setPricePerPyung(Number(e.target.value))} className="w-full accent-black" />
                </div>
              )}

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-600">보증금</span>
                  <span className="font-bold">{depositPerPyung.toLocaleString()}만</span>
                </div>
                <input type="range" min="0" max="2000" step="10" value={depositPerPyung} onChange={(e) => setDepositPerPyung(Number(e.target.value))} className="w-full accent-black" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-600">월 임대료</span>
                  <span className="font-bold">{rentPerPyung.toLocaleString()}만</span>
                </div>
                <input type="range" min="0" max="30" step="0.5" value={rentPerPyung} onChange={(e) => setRentPerPyung(Number(e.target.value))} className="w-full accent-black" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-600">관리비</span>
                  <span className="font-bold">{maintPerPyung.toLocaleString()}만</span>
                </div>
                <input type="range" min="0" max="10" step="0.5" value={maintPerPyung} onChange={(e) => setMaintPerPyung(Number(e.target.value))} className="w-full accent-black" />
              </div>
            </div>

            {/* 금융 조건 (투자용만) */}
            {reportType === 'PURCHASE_INVEST' && (
              <div className="space-y-3 p-3 bg-white rounded border border-neutral-200">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Finance</label>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-600">LTV</span>
                    <span className="font-bold">{ltvRatio}%</span>
                  </div>
                  <input type="range" min="0" max="80" step="5" value={ltvRatio} onChange={(e) => setLtvRatio(Number(e.target.value))} className="w-full accent-black" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-600">금리</span>
                    <span className="font-bold">{interestRate}%</span>
                  </div>
                  <input type="range" min="2" max="8" step="0.1" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} className="w-full accent-black" />
                </div>
              </div>
            )}

            {/* 현재 사무실 */}
            {(reportType === 'LEASE' || reportType === 'PURCHASE_USE') && (
              <div className="space-y-2 p-3 bg-white rounded border border-neutral-200">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Current Office (비교용)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="면적(평)" value={currentOffice.pyung || ''} onChange={(e) => setCurrentOffice({ ...currentOffice, pyung: Number(e.target.value) })} className="p-2 text-xs border border-neutral-200 rounded" />
                  <input type="number" placeholder="보증금(만)" value={currentOffice.deposit || ''} onChange={(e) => setCurrentOffice({ ...currentOffice, deposit: Number(e.target.value) })} className="p-2 text-xs border border-neutral-200 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="월세(만)" value={currentOffice.rent || ''} onChange={(e) => setCurrentOffice({ ...currentOffice, rent: Number(e.target.value) })} className="p-2 text-xs border border-neutral-200 rounded" />
                  <input type="number" placeholder="관리비(만)" value={currentOffice.maint || ''} onChange={(e) => setCurrentOffice({ ...currentOffice, maint: Number(e.target.value) })} className="p-2 text-xs border border-neutral-200 rounded" />
                </div>
              </div>
            )}

            {/* 부대비용 */}
            <div className="space-y-2 p-3 bg-white rounded border border-neutral-200">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Additional Cost (만원)</label>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" placeholder="인테리어" value={additionalCost.interior || ''} onChange={(e) => setAdditionalCost({ ...additionalCost, interior: Number(e.target.value) })} className="p-2 text-xs border border-neutral-200 rounded text-center" />
                <input type="number" placeholder={reportType === 'LEASE' ? '이사' : '법무'} value={additionalCost.moving || ''} onChange={(e) => setAdditionalCost({ ...additionalCost, moving: Number(e.target.value) })} className="p-2 text-xs border border-neutral-200 rounded text-center" />
                <input type="number" placeholder="기타" value={additionalCost.other || ''} onChange={(e) => setAdditionalCost({ ...additionalCost, other: Number(e.target.value) })} className="p-2 text-xs border border-neutral-200 rounded text-center" />
              </div>
            </div>

            {/* 계약 조건 */}
            {reportType === 'LEASE' && (
              <div className="space-y-2 p-3 bg-white rounded border border-neutral-200">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Contract Terms</label>
                <div className="grid grid-cols-2 gap-2">
                  <select value={contractTerms.period} onChange={(e) => setContractTerms({ ...contractTerms, period: e.target.value })} className="p-2 text-xs border border-neutral-200 rounded">
                    <option value="1년">1년</option>
                    <option value="2년">2년</option>
                    <option value="3년">3년</option>
                    <option value="5년">5년</option>
                  </select>
                  <input type="text" placeholder="렌트프리" value={contractTerms.rentFree} onChange={(e) => setContractTerms({ ...contractTerms, rentFree: e.target.value })} className="p-2 text-xs border border-neutral-200 rounded" />
                </div>
              </div>
            )}

            {/* 결재선 */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Approval</label>
              <input type="text" placeholder="부서명" value={reportMeta.department} onChange={(e) => setReportMeta({ ...reportMeta, department: e.target.value })} className="w-full p-2 text-xs border border-neutral-200 rounded" />
              <div className="grid grid-cols-3 gap-2">
                <input type="text" placeholder="작성" value={reportMeta.writer} onChange={(e) => setReportMeta({ ...reportMeta, writer: e.target.value })} className="p-2 text-xs border border-neutral-200 rounded text-center" />
                <input type="text" placeholder="검토" value={reportMeta.reviewer} onChange={(e) => setReportMeta({ ...reportMeta, reviewer: e.target.value })} className="p-2 text-xs border border-neutral-200 rounded text-center" />
                <input type="text" placeholder="승인" value={reportMeta.approver} onChange={(e) => setReportMeta({ ...reportMeta, approver: e.target.value })} className="p-2 text-xs border border-neutral-200 rounded text-center" />
              </div>
            </div>

            {/* 종합 의견 */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Recommendation</label>
              <div className="grid grid-cols-3 gap-1 mb-2">
                {[
                  { key: 'POSITIVE', label: '추천' },
                  { key: 'NEUTRAL', label: '검토' },
                  { key: 'NEGATIVE', label: '비추천' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setReportMeta({ ...reportMeta, recommendation: key as any })}
                    className={`py-2 text-xs font-medium rounded transition-all ${reportMeta.recommendation === key
                      ? 'bg-black text-white'
                      : 'bg-white border border-neutral-200 text-neutral-600'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <textarea placeholder="의견..." value={reportMeta.comment} onChange={(e) => setReportMeta({ ...reportMeta, comment: e.target.value })} rows={2} className="w-full p-2 text-xs border border-neutral-200 rounded resize-none" />
            </div>
          </div>

          {/* 인쇄 버튼 */}
          <div className="p-4 bg-white border-t space-y-2">
            <button onClick={() => window.print()} className="w-full bg-black hover:bg-neutral-800 text-white flex items-center justify-center gap-2 py-3 rounded font-medium text-sm transition-all">
              <Printer className="w-4 h-4" /> Print Report
            </button>
            <button onClick={onClose} className="w-full py-2 text-neutral-500 hover:text-black text-sm">Close</button>
          </div>
        </aside>

        {/* 오른쪽: 보고서 미리보기 */}
        <main className="flex-1 bg-neutral-100 p-6 overflow-y-auto print:p-0 print:bg-white">
          <div id="print-root" className="printable-area bg-white shadow-lg mx-auto print:shadow-none print:w-full" style={{ width: '210mm', minHeight: '297mm' }}>
            <div className="p-12 print:p-10">

              {/* 헤더 */}
              <header className="mb-12 border-b-4 border-black pb-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-extrabold text-black tracking-tighter mb-2">
                      {getReportTitle()}
                    </h1>
                    <div className="flex items-center gap-4 text-xs font-bold text-neutral-400 tracking-widest uppercase">
                      <span>문서 번호 {reportMeta.reportNo}</span>
                      <span>•</span>
                      <span>작성일 {reportMeta.reportDate}</span>
                    </div>
                  </div>

                  {/* 결재란 - 정교한 격자 구조 */}
                  <div className="flex border border-black h-24">
                    <div className="w-10 bg-black text-white flex items-center justify-center text-[10px] font-bold [writing-mode:vertical-lr] rotate-180 uppercase tracking-widest">
                      결재 서명
                    </div>
                    <div className="flex">
                      {['담당자', '검토자', '최종승인'].map((label, idx) => (
                        <div key={label} className={`w-24 flex flex-col ${idx !== 2 ? 'border-r border-black' : ''}`}>
                          <div className="h-7 border-b border-black text-[10px] font-bold flex items-center justify-center bg-neutral-50 uppercase">{label}</div>
                          <div className="flex-1 flex items-center justify-center text-sm font-semibold italic text-neutral-400">
                            {idx === 0 ? reportMeta.writer : idx === 1 ? reportMeta.reviewer : reportMeta.approver}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </header>

              {/* 핵심 요약 지표 */}
              <section className="mb-12">
                <div className="grid grid-cols-4 gap-0 border border-black divide-x divide-black">
                  <div className="p-6">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">검토 면적</p>
                    <p className="text-3xl font-black text-black leading-none">{totals.pyung.toFixed(1)} <span className="text-sm font-normal uppercase">평</span></p>
                  </div>
                  <div className="p-6">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">{reportType === 'LEASE' ? '보증금' : '매매 가격'}</p>
                    <p className="text-2xl font-black text-black leading-none whitespace-nowrap">{formatPrice(reportType === 'LEASE' ? totals.deposit : totals.price).replace('원', '')}</p>
                  </div>
                  <div className="p-6 bg-black text-white">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">월 고정 비용</p>
                    <p className="text-2xl font-black leading-none">{monthlyTotal.toLocaleString()} <span className="text-sm font-normal">만원</span></p>
                  </div>
                  <div className="p-6">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">연간 합계 비용</p>
                    <p className="text-2xl font-black text-black leading-none whitespace-nowrap">{formatPrice(annualTotal).replace('원', '')}</p>
                  </div>
                </div>
                {reportType === 'PURCHASE_INVEST' && (
                  <div className="grid grid-cols-2 gap-0 border-x border-b border-black divide-x divide-black">
                    <div className="p-4 text-center">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mr-3">예상 수익률 (연)</span>
                      <span className="text-xl font-black">{capRate}%</span>
                    </div>
                    <div className="p-4 text-center">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mr-3">내 돈 대비 수익률</span>
                      <span className="text-xl font-black">{roe}%</span>
                    </div>
                  </div>
                )}
              </section>

              {/* 본문 섹션들 */}
              <div className="space-y-10">
                {/* 1. 건물 정보 요약 */}
                <section>
                  <div className="flex items-baseline gap-3 border-b-2 border-black pb-2 mb-4">
                    <span className="text-2xl font-black italic tracking-tighter">01</span>
                    <h2 className="text-lg font-black uppercase tracking-tight">건물 정보 요약</h2>
                  </div>
                  <table className="w-full text-sm border-collapse">
                    <tbody className="divide-y divide-neutral-200">
                      <tr>
                        <td className="py-3 font-bold text-black w-32 uppercase tracking-wide text-[11px]">주소(소재지)</td>
                        <td className="py-3 text-neutral-800" colSpan={3}>{address}</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-bold text-black uppercase tracking-wide text-[11px]">건물명</td>
                        <td className="py-3 text-neutral-800 font-bold">{buildingName}</td>
                        <td className="py-3 font-bold text-black w-32 uppercase tracking-wide text-[11px]">건물 규모</td>
                        <td className="py-3 text-neutral-800">지하 {data.ugrndFlrCnt || 0}층 / 지상 {data.grndFlrCnt || 0}층</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-bold text-black uppercase tracking-wide text-[11px]">준공일</td>
                        <td className="py-3 text-neutral-800">{data.useAprDay ? `${data.useAprDay.substring(0, 4)}년 ${data.useAprDay.substring(4, 6)}월` : '-'}</td>
                        <td className="py-3 font-bold text-black uppercase tracking-wide text-[11px]">주차 / 엘리베이터</td>
                        <td className="py-3 text-neutral-800">{totalParking}대 / {totalElevator}대</td>
                      </tr>
                      <tr className="bg-neutral-50 px-2">
                        <td className="py-4 font-bold text-black uppercase tracking-wide text-[11px] pl-3">검토 대상 호실</td>
                        <td className="py-4 text-black font-black" colSpan={3}>
                          {calculatedUnits.map(u => `${parseFloor(u)} ${u.hoNm}`).join(', ')}
                          <span className="text-neutral-400 font-normal ml-3">({calculatedUnits.length}개 호실, {totals.pyung.toFixed(1)}평)</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                {/* 2. 예상 비용 계산 */}
                <section>
                  <div className="flex items-baseline gap-3 border-b-2 border-black pb-2 mb-4">
                    <span className="text-2xl font-black italic tracking-tighter">02</span>
                    <h2 className="text-lg font-black uppercase tracking-tight">예상 비용 계산</h2>
                  </div>
                  <div className="border border-black overflow-hidden">
                    <table className="w-full text-sm border-collapse">
                      <tbody className="divide-y divide-neutral-100">
                        {reportType !== 'LEASE' && (
                          <>
                            <tr>
                              <td className="py-4 px-4 font-bold bg-neutral-50 w-40 uppercase text-[10px] tracking-widest">매매 가격</td>
                              <td className="py-4 px-4 text-right font-black text-xl">{formatPrice(totals.price)}</td>
                              <td className="py-4 px-4 text-right text-neutral-400 text-xs w-36">@ 평당 {pricePerPyung.toLocaleString()}만</td>
                            </tr>
                            <tr>
                              <td className="py-4 px-4 font-bold bg-neutral-50 uppercase text-[10px] tracking-widest">취득세 (4.6%)</td>
                              <td className="py-4 px-4 text-right font-bold">{formatPrice(acquisitionTax)}</td>
                              <td className="py-4 px-4 text-right text-neutral-400 text-xs">법약 요율</td>
                            </tr>
                            <tr className="border-y-2 border-black">
                              <td className="py-4 px-4 font-black bg-neutral-100 uppercase text-[11px] tracking-widest">총 필요 자금</td>
                              <td className="py-4 px-4 text-right font-black text-2xl">{formatPrice(totalAcquisition)}</td>
                              <td className="py-4 px-4 text-right text-neutral-400 text-xs italic">세금 포함 합계</td>
                            </tr>
                          </>
                        )}
                        {reportType === 'LEASE' && (
                          <tr>
                            <td className="py-4 px-4 font-bold bg-neutral-50 w-40 uppercase text-[10px] tracking-widest">임대 보증금</td>
                            <td className="py-4 px-4 text-right font-black text-xl">{formatPrice(totals.deposit)}</td>
                            <td className="py-4 px-4 text-right text-neutral-400 text-xs w-36">@ 평당 {depositPerPyung.toLocaleString()}만</td>
                          </tr>
                        )}
                        <tr>
                          <td className="py-4 px-4 font-bold bg-neutral-50 uppercase text-[10px] tracking-widest">월 임대료</td>
                          <td className="py-4 px-4 text-right font-bold">{totals.rent.toLocaleString()} 만원</td>
                          <td className="py-4 px-4 text-right text-neutral-400 text-xs">@ 평당 {rentPerPyung.toLocaleString()}만</td>
                        </tr>
                        <tr>
                          <td className="py-4 px-4 font-bold bg-neutral-50 uppercase text-[10px] tracking-widest">월 관리비</td>
                          <td className="py-4 px-4 text-right font-bold">{totals.maint.toLocaleString()} 만원</td>
                          <td className="py-4 px-4 text-right text-neutral-400 text-xs">@ 평당 {maintPerPyung.toLocaleString()}만</td>
                        </tr>
                        <tr className="bg-black text-white">
                          <td className="py-6 px-4 font-black uppercase text-[12px] tracking-widest">월 합계 비용</td>
                          <td className="py-6 px-4 text-right font-black text-3xl">{monthlyTotal.toLocaleString()} <span className="text-lg font-medium">만원</span></td>
                          <td className="py-6 px-4 text-right text-neutral-500 text-sm font-bold italic">연간 합계: {formatPrice(annualTotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 3. 주변 시세 분석 */}
                <section>
                  <div className="flex items-baseline gap-3 border-b-2 border-black pb-2 mb-4">
                    <span className="text-2xl font-black italic tracking-tighter">03</span>
                    <h2 className="text-lg font-black uppercase tracking-tight">주변 시세 분석</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {/* 시세 추이 차트 */}
                    <div className="border border-black p-4">
                      <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity className="w-3 h-3" /> 주변 평단가 추이 (최근 6개월)
                      </h3>
                      <div className="h-40 w-full">
                        {loadingTrade ? (
                          <div className="h-full flex items-center justify-center text-xs text-neutral-400 font-bold">거래 데이터 분석 중...</div>
                        ) : tradeData?.trades?.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[...tradeData.trades].reverse().map(t => ({
                              name: `${String(t.dealYear).slice(2)}.${t.dealMonth}`,
                              price: Math.round(t.pricePerPyung / 10000)
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                              <YAxis hide domain={['auto', 'auto']} />
                              <Tooltip
                                contentStyle={{ border: '1px solid black', borderRadius: '0px', fontSize: '10px', fontWeight: 'bold' }}
                                formatter={(value: any) => [`${value}만원`, '평단가']}
                              />
                              <Line type="monotone" dataKey="price" stroke="#000" strokeWidth={3} dot={{ r: 3, fill: '#000' }} activeDot={{ r: 5 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-neutral-400 font-bold italic">데이터가 충분하지 않습니다.</div>
                        )}
                      </div>
                    </div>

                    {/* 최근 거래 내역 */}
                    <div className="border border-black p-4">
                      <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <BarChart3 className="w-3 h-3" /> 인근 최근 실거래 사례 (국토부)
                      </h3>
                      <div className="overflow-hidden">
                        <table className="w-full text-[10px] border-collapse">
                          <thead>
                            <tr className="bg-neutral-100 border-y border-black">
                              <th className="py-2 px-1 text-left font-black uppercase">거래일</th>
                              <th className="py-2 px-1 text-right font-black uppercase">층</th>
                              <th className="py-2 px-1 text-right font-black uppercase">전용(평)</th>
                              <th className="py-2 px-1 text-right font-black uppercase">평당가</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {tradeData?.stats?.trade?.recentTrades?.map((t: any, i: number) => (
                              <tr key={i}>
                                <td className="py-2 px-1 font-bold">{String(t.dealYear).slice(2)}.{t.dealMonth}.{t.dealDay}</td>
                                <td className="py-2 px-1 text-right font-medium">{t.floor}층</td>
                                <td className="py-2 px-1 text-right font-medium">{t.pyung.toFixed(1)}평</td>
                                <td className="py-2 px-1 text-right font-black">{Math.round(t.pricePerPyung / 10000)}만</td>
                              </tr>
                            )) || (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-neutral-400 font-bold italic">조회된 데이터가 없습니다.</td>
                                </tr>
                              )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. 수익성 분석 */}
                {reportType === 'PURCHASE_INVEST' && (
                  <section>
                    <div className="flex items-baseline gap-3 border-b-2 border-black pb-2 mb-4">
                      <span className="text-2xl font-black italic tracking-tighter">04</span>
                      <h2 className="text-lg font-black uppercase tracking-tight">수익성 분석</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-6 items-stretch">
                      <div className="border-2 border-black p-6">
                        <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-6">자금 구성 상세</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-baseline py-1">
                            <span className="text-xs font-bold text-neutral-500 uppercase">은행 대출금 ({ltvRatio}%)</span>
                            <span className="text-lg font-bold">{formatPrice(loanAmount)}</span>
                          </div>
                          <div className="flex justify-between items-baseline py-1">
                            <span className="text-xs font-bold text-neutral-500 uppercase">연간 이자 비용 ({interestRate}%)</span>
                            <span className="text-lg font-bold text-neutral-400">-{formatPrice(annualInterest)}</span>
                          </div>
                          <div className="pt-4 border-t-2 border-neutral-100 flex justify-between items-baseline">
                            <span className="text-sm font-black uppercase">실제 내 돈(투자금)</span>
                            <span className="text-2xl font-black underline decoration-2 underline-offset-4">{formatPrice(equityRequired)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-2 border-black p-6 bg-neutral-50">
                        <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-6">수익률 지표</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-baseline py-1 border-b border-neutral-200">
                            <span className="text-xs font-black text-neutral-500 uppercase">연간 예상 수입</span>
                            <span className="text-xl font-bold">{formatPrice(annualRent)}</span>
                          </div>
                          <div className="flex justify-between items-baseline mt-4">
                            <span className="text-xs font-black tracking-widest uppercase">연 수익률</span>
                            <span className="text-3xl font-black">{capRate}%</span>
                          </div>
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs font-black tracking-widest uppercase">내 돈 대비 수익률</span>
                            <span className="text-3xl font-black underline decoration-4 underline-offset-2">{roe}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {(reportType === 'LEASE' || reportType === 'PURCHASE_USE') && currentOffice.pyung > 0 && (
                  <section>
                    <div className="flex items-baseline gap-3 border-b-2 border-black pb-2 mb-4">
                      <span className="text-2xl font-black italic tracking-tighter">05</span>
                      <h2 className="text-lg font-black uppercase tracking-tight">현재 사무실과 비교</h2>
                    </div>
                    <div className="border border-black">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-neutral-100 border-b border-black">
                            <th className="py-3 px-4 text-left font-black text-[10px] uppercase w-28">비교 항목</th>
                            <th className="py-3 px-4 text-right font-black text-[10px] uppercase">현재 사무실</th>
                            <th className="py-3 px-4 text-center font-black text-[10px] uppercase w-16">방향</th>
                            <th className="py-3 px-4 text-right font-black text-[10px] uppercase bg-black text-white">검토 대상</th>
                            <th className="py-3 px-4 text-right font-black text-[10px] uppercase">차이</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          <tr>
                            <td className="py-4 px-4 font-bold bg-neutral-50 uppercase text-[10px]">전용 면적 (평)</td>
                            <td className="py-4 px-4 text-right font-medium">{currentOffice.pyung} 평</td>
                            <td className="py-4 px-4 text-center text-neutral-300">→</td>
                            <td className="py-4 px-4 text-right font-black text-lg">{totals.pyung.toFixed(1)} 평</td>
                            <td className={`py-4 px-4 text-right font-black ${totals.pyung >= currentOffice.pyung ? 'text-black' : 'text-neutral-400'}`}>
                              {totals.pyung >= currentOffice.pyung ? '+' : ''}{(totals.pyung - currentOffice.pyung).toFixed(1)} 평
                            </td>
                          </tr>
                          <tr>
                            <td className="py-4 px-4 font-bold bg-neutral-50 uppercase text-[10px]">월 합계 비용</td>
                            <td className="py-4 px-4 text-right font-medium">{currentMonthly.toLocaleString()} ╎</td>
                            <td className="py-4 px-4 text-center text-neutral-300">→</td>
                            <td className="py-4 px-4 text-right font-black text-lg">{monthlyTotal.toLocaleString()} ╎</td>
                            <td className={`py-4 px-4 text-right font-black ${monthlyDiff <= 0 ? 'text-black' : 'text-neutral-400'}`}>
                              {monthlyDiff >= 0 ? '+' : ''}{monthlyDiff.toLocaleString()} 만원
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* 06. 전문가 분석 의견 */}
                <section>
                  <div className="flex items-baseline gap-3 border-b-2 border-black pb-2 mb-4">
                    <span className="text-2xl font-black italic tracking-tighter">06</span>
                    <h2 className="text-lg font-black uppercase tracking-tight">전문가 분석 의견</h2>
                  </div>
                  <div className={`border-4 p-8 flex items-start gap-8 ${reportMeta.recommendation === 'POSITIVE' ? 'border-black bg-neutral-50' :
                    reportMeta.recommendation === 'NEGATIVE' ? 'border-neutral-300 bg-neutral-100' : 'border-neutral-400'
                    }`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 flex items-center justify-center font-black text-2xl ${reportMeta.recommendation === 'POSITIVE' ? 'bg-black text-white' : 'bg-neutral-300 text-white'
                          }`}>
                          {reportMeta.recommendation === 'POSITIVE' ? 'A' : reportMeta.recommendation === 'NEGATIVE' ? 'C' : 'B'}
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">
                          {reportMeta.recommendation === 'POSITIVE' ? '매수/임차 적극 추천' :
                            reportMeta.recommendation === 'NEGATIVE' ? '재검토 권고' : '추가 확인 후 결정'}
                        </h3>
                      </div>
                      <p className="text-sm font-medium text-neutral-800 leading-relaxed max-w-2xl">
                        {reportMeta.comment || (
                          reportType === 'PURCHASE_INVEST'
                            ? `총 투자금 ${formatPrice(equityRequired)} 대비 예상 수익률은 ${roe}%입니다. ` + (tradeData?.stats?.trade?.avgPricePerPyung ? `인근 실거래 평균 평당가(${Math.round(tradeData.stats.trade.avgPricePerPyung / 10000)}만원) 대비 본 물건은 평당 ${pricePerPyung.toLocaleString()}만원으로 ${pricePerPyung <= tradeData.stats.trade.avgPricePerPyung / 10000 ? '가격 경쟁력이 충분한' : '적정한'} 수준입니다.` : `건물 전체 가치 대비 수익률(Cap Rate)은 ${capRate}%로, 주변 시세와 비교했을 때 ${Number(capRate) >= 5 ? '상당히 매력적인' : '안정적인'} 투자처로 보입니다.`)
                            : `검토 중인 공간(${totals.pyung.toFixed(1)}평)의 월 합계 비용은 ${monthlyTotal.toLocaleString()}만원(연간 약 ${formatPrice(annualTotal)})입니다. ` + (tradeData?.stats?.rent?.avgMonthlyPerPyung ? `주변 평당 임대료 시세(${tradeData.stats.rent.avgMonthlyPerPyung.toLocaleString()}원)와 비교 시 ${rentPerPyung * 10000 <= tradeData.stats.rent.avgMonthlyPerPyung ? '매우 합리적인' : '시장 평균'} 수준으로 파악됩니다.` : `평당 비용이 주변 시세 대비 ${Number(monthlyTotal / totals.pyung) < 10 ? '매우 합리적인' : '적절한'} 수준으로 파악됩니다.`)
                        )}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* 푸터 */}
              <footer className="mt-16 pt-8 border-t border-neutral-200 flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-neutral-400 tracking-widest">부동산 가치 분석 시스템 (AI 기반)</p>
                  <p className="text-[9px] text-neutral-300">내부 검토용 • 이 보고서는 실제 거래 전 확인이 필요합니다.</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black tracking-widest uppercase text-black">BUILDING REPORT PRO</p>
                </div>
              </footer>
            </div>
          </div>
        </main>

        <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white hover:bg-neutral-100 text-black rounded-full shadow-lg print:hidden transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}