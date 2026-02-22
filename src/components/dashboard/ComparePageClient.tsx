'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ComparisonTable } from '@/components/dashboard/ComparisonTable';
import { FeedbackSection } from '@/components/dashboard/FeedbackSection';
import { WeightSettings } from '@/components/dashboard/WeightSettings';
import { PDFReport } from '@/components/dashboard/PDFReport';
import { MobileComparisonCard } from '@/components/dashboard/MobileComparisonCard';
import { MobileFloatingBar } from '@/components/dashboard/MobileFloatingBar';
import { MobileWeightDrawer } from '@/components/dashboard/MobileWeightDrawer';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Loader2, Plus, ArrowLeft, Building, Trash2, FileDown, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { toSafeNumber } from '@/lib/utils/finance-format';
import {
  API_ERROR_CODE_MESSAGES,
  API_ERROR_FIELD_LABELS,
  type ApiErrorResponse,
  type ReportType,
  type WeightInput,
} from '@/lib/constants/building-report';
import {
  formatWeightSummary,
  buildWeightDisplayRows,
  getWeightSourceLabel,
} from '@/lib/utils/weight-display';
import { type CompareResponse } from '@/lib/types/building-report';

type WeightMap = {
  cost: number;
  area: number;
  parking: number;
  modernity: number;
};

type PayloadWeights = {
  costScore: number;
  areaScore: number;
  parkingScore: number;
  modernityScore: number;
};

type ComparisonData = CompareResponse;

type ComparisonError = ApiErrorResponse | { error: string };

type ItemInputField = 'sigunguCd' | 'bjdongCd' | 'bun' | 'ji' | 'cost';
type ItemInputValue = string | number;

const getApiErrorMessage = (errorPayload: unknown): string => {
  if (!errorPayload || typeof errorPayload !== 'object') {
    return '비교 보고서 생성 중 오류가 발생했습니다.';
  }

  const payload = errorPayload as { error?: unknown };
  const err = payload.error;

  if (typeof err === 'string') {
    return err;
  }

  if (err && typeof err === 'object') {
    const typed = err as ApiErrorResponse['error'];
    const code = typeof typed.code === 'string' ? typed.code : 'INTERNAL_ERROR';
    const baseMessage =
      typeof typed.message === 'string' && typed.message.trim()
        ? typed.message
        : API_ERROR_CODE_MESSAGES[code as keyof typeof API_ERROR_CODE_MESSAGES] || '비교 보고서 생성 중 오류가 발생했습니다.';
    const fallbackLabel = typeof typed.field === 'string' && API_ERROR_FIELD_LABELS[typed.field]
      ? ` (${API_ERROR_FIELD_LABELS[typed.field]})`
      : '';
    const suffixes: string[] = [];
    if (typed.details && typeof typed.details === 'string') {
      suffixes.push(typed.details);
    }
    return `${baseMessage}${fallbackLabel}${suffixes.length ? `: ${suffixes.join(', ')}` : ''}`;
  }

  return '비교 보고서 생성 중 오류가 발생했습니다.';
};

export default function ComparePage() {
  const router = useRouter();
  const [items, setItems] = useState([
    { sigunguCd: '11680', bjdongCd: '10300', bun: '0012', ji: '0000', cost: 0 },
    { sigunguCd: '11680', bjdongCd: '10100', bun: '0799', ji: '0000', cost: 0 }
  ]);
  const [currentCost, setCurrentCost] = useState(600);
  const [weights, setWeights] = useState<WeightMap>({
    cost: 0.4,
    area: 0.3,
    parking: 0.15,
    modernity: 0.15
  });
  const [type, setType] = useState<ReportType>('LEASE');
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [mobileIdx, setMobileIdx] = useState(0);
  const [isWeightDrawerOpen, setIsWeightDrawerOpen] = useState(false);

  const handleAddItem = () => {
    if (items.length >= 4) return;
    setItems([...items, { sigunguCd: '', bjdongCd: '', bun: '', ji: '', cost: 0 }]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 2) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const formatWeightSummaryText = (weights?: WeightInput) => {
    return weights ? formatWeightSummary(weights) : '요청 가중치 없음';
  };

  const handleInputChange = (idx: number, field: ItemInputField, value: ItemInputValue) => {
    const newItems = [...items];
    const current = newItems[idx];
    if (!current) return;
    newItems[idx] = { ...current, [field]: value };
    setItems(newItems);
  };

  const normalizeWeights = (raw: WeightMap): PayloadWeights => ({
    costScore: raw.cost,
    areaScore: raw.area,
    parkingScore: raw.parking,
    modernityScore: raw.modernity
  });

  const hasPositiveWeight = (next: WeightMap) => {
    return next.cost > 0 || next.area > 0 || next.parking > 0 || next.modernity > 0;
  };

  const handleCompare = async (updatedWeights: WeightMap = weights) => {
    if (!hasPositiveWeight(updatedWeights)) {
      alert('가중치가 모두 0입니다. 기본 가중치를 사용해 계산합니다.');
    }

    const normalizedItems = items.map((item) => ({
      ...item,
      sigunguCd: String(item.sigunguCd ?? '').trim(),
      bjdongCd: String(item.bjdongCd ?? '').trim(),
      bun: String(item.bun ?? '').trim(),
      ji: String(item.ji ?? '').trim(),
      cost: toSafeNumber(item.cost),
    }));

    const invalidItemIndex = normalizedItems.findIndex((item) => {
      return !(item.sigunguCd && item.bjdongCd && item.bun && item.ji && toSafeNumber(item.cost) >= 0);
    });

    if (invalidItemIndex !== -1) {
      alert(`후보 ${invalidItemIndex + 1}의 시군구/법정동/번지 값을 모두 입력해 주세요.`);
      return;
    }

    const normalizedCurrentCost = toSafeNumber(currentCost);
    setLoading(true);
    try {
      const normalizedWeights = normalizeWeights(updatedWeights);
      const response = await fetch('/api/building-report-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, items: normalizedItems, currentCost: normalizedCurrentCost, weights: normalizedWeights })
      });
      const data = (await response.json()) as ComparisonData | ComparisonError;
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data));
      }

      const responseData = data as ComparisonData;
      setComparisonData(responseData);
      setMobileIdx(responseData.recommendation.bestBuildingIndex);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '비교 보고서 생성 중 오류가 발생했습니다.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (newWeights: WeightMap) => {
    setWeights(newWeights);
    if (comparisonData) {
      handleCompare(newWeights);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 md:py-12 px-4 pb-32 md:pb-12">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-2 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              대시보드로 돌아가기
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">의사결정 비교 보고서</h1>
          </div>
          
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
            {(['LEASE', 'PURCHASE', 'INVEST'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                  type === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t === 'LEASE' ? '임차' : t === 'PURCHASE' ? '매매' : '투자'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* 왼쪽: 설정 영역 */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            <WeightSettings weights={weights} onChange={handleWeightChange} />
            
            <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-6 pb-0">
                <CardTitle className="text-sm font-bold text-slate-700">현재 상황 설정</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">현재 월 지출액</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        value={currentCost}
                        onChange={(e) => setCurrentCost(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-blue-600 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-400">만원</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 입력 및 결과 영역 */}
          <div className="col-span-12 lg:col-span-9">
            {!comparisonData && (
              <Card className="border-none shadow-xl rounded-3xl overflow-hidden mb-12">
                <CardHeader className="bg-white border-b border-slate-100 p-6 md:p-8">
                  <CardTitle className="text-lg md:text-xl flex items-center gap-3">
                    <Building className="w-6 h-6 text-blue-600" />
                    후보 물건 정보 입력
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                    {items.map((item, idx) => (
                      <div key={idx} className="p-5 md:p-6 rounded-2xl bg-slate-50 border border-slate-100 relative group">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-bold text-slate-400">후보 {idx + 1}</span>
                          {items.length > 2 && (
                            <button onClick={() => handleRemoveItem(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">시군구코드</label>
                            <input 
                              value={item.sigunguCd}
                              onChange={(e) => handleInputChange(idx, 'sigunguCd', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="11680"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">법정동코드</label>
                            <input 
                              value={item.bjdongCd}
                              onChange={(e) => handleInputChange(idx, 'bjdongCd', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="10300"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">번-지</label>
                            <div className="flex gap-2">
                              <input 
                                value={item.bun}
                                onChange={(e) => handleInputChange(idx, 'bun', e.target.value)}
                                className="w-1/2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                                placeholder="0012"
                              />
                              <input 
                                value={item.ji}
                                onChange={(e) => handleInputChange(idx, 'ji', e.target.value)}
                                className="w-1/2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                                placeholder="0000"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                              {type === 'LEASE' ? '월 임대료' : '매매가'}
                            </label>
                            <input 
                              type="number"
                              value={item.cost}
                              onChange={(e) => handleInputChange(idx, 'cost', parseInt(e.target.value) || 0)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {items.length < 4 && (
                      <button 
                        onClick={handleAddItem}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all gap-2"
                      >
                        <Plus className="w-8 h-8" />
                        <span className="text-sm font-bold">물건 추가하기</span>
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleCompare()}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-4 md:py-5 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "비교 보고서 생성하기"}
                  </button>
                </CardContent>
              </Card>
            )}

            {comparisonData && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800">분석 결과</h2>
                {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                    {/* 모바일 전용 설정 버튼 */}
                    <button
                      onClick={() => setIsWeightDrawerOpen(true)}
                      className="lg:hidden p-2 bg-white border border-slate-200 rounded-xl text-slate-600 active:bg-slate-50 transition-colors"
                    >
                      <SlidersHorizontal className="w-5 h-5" />
                    </button>

                    <div className="hidden md:block">
                      <PDFDownloadLink 
                        document={<PDFReport data={comparisonData} />} 
                        fileName={`building_report_${new Date().toISOString().slice(0,10)}.pdf`}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md"
                      >
                        {({ loading }) => (
                          <>
                            <FileDown className="w-4 h-4" />
                            {loading ? '준비 중...' : 'PDF 보고서 다운로드'}
                          </>
                        )}
                      </PDFDownloadLink>
                    </div>
                    <button 
                      onClick={() => setComparisonData(null)}
                      className="text-sm font-bold text-blue-600 hover:underline"
                    >
                      조건 수정하기
                    </button>
                  </div>
                </div>

                <div className="mb-4 p-4 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
                  <div className="font-bold text-slate-600">요청 가중치: <span className="font-normal text-slate-500">{formatWeightSummaryText(comparisonData.meta?.requestedWeights)}</span></div>
                  <div className="font-bold text-slate-600">정규화 가중치: <span className="font-normal text-slate-500">{formatWeightSummary(comparisonData.meta?.normalizedWeights)}</span></div>
                  <div className="font-bold text-slate-600">최종 적용 가중치: <span className="font-normal text-slate-500">{formatWeightSummary(comparisonData.meta?.weights)}</span></div>
                  <div className="font-bold text-slate-600">가중치 적용 방식: <span className="font-normal text-slate-500">{getWeightSourceLabel(comparisonData.meta?.weightSource)}</span></div>
                  <div className="font-bold text-slate-600">요청/정규화/최종 가중치:</div>
                  {buildWeightDisplayRows(
                    comparisonData.meta.requestedWeights,
                    comparisonData.meta.normalizedWeights,
                    comparisonData.meta.weights,
                  ).map((row) => (
                    <div key={row.key} className={`font-normal ${row.missingInput ? 'text-rose-700' : 'text-slate-500'}`}>
                      {row.label} {row.detail}
                    </div>
                  ))}
                  {comparisonData.meta?.weightNotice && (
                    <div className="font-bold text-amber-700">
                      안내: <span className="font-normal text-amber-600">{comparisonData.meta.weightNotice}</span>
                    </div>
                  )}
                </div>

                {/* 데스크톱 뷰 */}
                <div className="hidden lg:block">
                  <ComparisonTable 
                    data={comparisonData} 
                    onViewDetail={(id) => router.push(`/report/${id}`)} 
                  />
                </div>

                {/* 모바일 뷰 */}
                <div className="lg:hidden">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <span className="text-xs font-bold text-slate-400">
                      후보 물건 {mobileIdx + 1} / {comparisonData.buildings.length}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setMobileIdx(Math.max(0, mobileIdx - 1))}
                        disabled={mobileIdx === 0}
                        className="p-2 bg-white border border-slate-200 rounded-full disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setMobileIdx(Math.min(comparisonData.buildings.length - 1, mobileIdx + 1))}
                        disabled={mobileIdx === comparisonData.buildings.length - 1}
                        className="p-2 bg-white border border-slate-200 rounded-full disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <MobileComparisonCard 
                    building={comparisonData.buildings[mobileIdx]} 
                    index={mobileIdx}
                    isBest={mobileIdx === comparisonData.recommendation.bestBuildingIndex}
                  />
                  
                  <MobileFloatingBar data={comparisonData} />
                </div>
                
                <div className="mt-12">
                  <FeedbackSection 
                    reportId={comparisonData.meta.timestamp} 
                    reportType={comparisonData.meta.type}
                    aiChoiceIndex={comparisonData.recommendation.bestBuildingIndex}
                    buildings={comparisonData.buildings}
                  />
                </div>

                {/* 모바일 가중치 설정 드로어 */}
                <MobileWeightDrawer 
                  isOpen={isWeightDrawerOpen}
                  onClose={() => setIsWeightDrawerOpen(false)}
                  weights={weights}
                  onWeightChange={handleWeightChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
