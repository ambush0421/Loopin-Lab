'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Script from 'next/script';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { HistorySidebar } from '@/components/dashboard/HistorySidebar';
import { TopMetrics } from '@/components/dashboard/TopMetrics';
import { InvestmentMap } from '@/components/dashboard/InvestmentMap';
import { YieldCalculator } from '@/components/dashboard/YieldCalculator';
import { MarketChart } from '@/components/dashboard/MarketChart';
import { UnitGridTable } from '@/components/dashboard/UnitGridTable';
import { FloatingQuoteBar } from '@/components/dashboard/FloatingQuoteBar';
import { QuotationModal } from '@/components/dashboard/QuotationModal';
import { RealTradeChart } from '@/components/dashboard/RealTradeChart';
import { TradeComparison } from '@/components/dashboard/TradeComparison';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingStats } from '@/components/landing/LandingStats';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';
import { LandingTestimonials } from '@/components/landing/LandingTestimonials';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingCTA } from '@/components/landing/LandingCTA';
import { StepIndicator } from '@/components/landing/StepIndicator';
import { Button } from '@/components/ui/button';
import { Search, Printer, Building2, X, AlertTriangle } from 'lucide-react';

declare global {
  interface Window {
    daum: any;
  }
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [marketPrice, setMarketPrice] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number, lng: number } | undefined>(undefined);
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const [params, setParams] = useState({
    sigunguCd: '',
    bjdongCd: '',
    bun: '',
    ji: ''
  });
  const [addressInput, setAddressInput] = useState('');
  const [showPostcode, setShowPostcode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [daumReady, setDaumReady] = useState(false);
  const toApiUrl = useCallback((path: string) => {
    if (typeof window === 'undefined') return path;
    return new URL(path, window.location.origin).toString();
  }, []);

  // 주소 선택 후 fetch를 트리거하기 위한 상태
  const [pendingSearch, setPendingSearch] = useState<{
    params: typeof params;
    address: string;
  } | null>(null);

  const postcodeRef = useRef<HTMLDivElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // 선택된 호실 객체 리스트 계산
  const selectedUnits = useMemo(() => {
    return units.filter(u => selectedIds.has(u._uid));
  }, [units, selectedIds]);

  // ====================================================
  // pendingSearch가 설정되면 useEffect에서 fetch 실행
  // (iframe oncomplete 콜백 컨텍스트가 아닌, 
  //  React 렌더 사이클의 메인 window 컨텍스트에서 실행)
  // ====================================================
  useEffect(() => {
    if (!pendingSearch) return;
    const { params: p, address: a } = pendingSearch;
    setPendingSearch(null);  // 한 번만 실행
    fetchAllData(p, a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSearch]);

  // Daum Postcode oncomplete 핸들러
  const handlePostcodeComplete = useCallback(async (postcodeData: any) => {
    setShowPostcode(false);

    const fullAddress = postcodeData.address;
    const fullBjdongCode = postcodeData.bjdongCode || postcodeData.bcode || '';
    const bjdongCd = fullBjdongCode.length >= 10 ? fullBjdongCode.substring(5) : '';

    const jibun = postcodeData.jibunAddress || postcodeData.autoJibunAddress || postcodeData.address;
    let bun = '';
    let ji = '0000';

    const match = jibun.match(/(\d+)(?:-?(\d+))?(?:\s*번지?)?\s*$/);
    if (match) {
      bun = match[1].padStart(4, '0');
      ji = match[2] ? match[2].padStart(4, '0') : '0000';
    }

    const newParams = {
      sigunguCd: postcodeData.sigunguCode || '',
      bjdongCd,
      bun,
      ji
    };

    setAddress(fullAddress);
    setAddressInput(fullAddress);
    setParams(newParams);
    setSelectedIds(new Set());
    setErrorMsg(null);

    // 좌표 가져오기
    try {
      const geocodeRes = await fetch(
        toApiUrl(`/api/geocode?address=${encodeURIComponent(fullAddress)}`),
        {
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
          redirect: 'error',
        }
      );
      if (geocodeRes.ok) {
        const geocodeData = await geocodeRes.json();
        if (geocodeData.lat && geocodeData.lng) {
          setCoords({ lat: geocodeData.lat, lng: geocodeData.lng });
        } else {
          setCoords({ lat: 37.566826, lng: 126.9786567 });
        }
      } else {
        setCoords({ lat: 37.566826, lng: 126.9786567 });
      }
    } catch {
      setCoords({ lat: 37.566826, lng: 126.9786567 });
    }

    // fetch를 직접 호출하지 않고, 상태를 설정하여 useEffect에서 트리거
    setPendingSearch({ params: newParams, address: fullAddress });
  }, [toApiUrl]);

  // embed 모드로 Daum Postcode 열기
  const openPostcodeEmbed = useCallback((query?: string) => {
    if (!daumReady || !window.daum?.Postcode) {
      setErrorMsg('주소 검색 서비스를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setShowPostcode(true);
    setTimeout(() => {
      if (postcodeRef.current) {
        postcodeRef.current.innerHTML = '';
        new window.daum.Postcode({
          oncomplete: handlePostcodeComplete,
          onclose: () => setShowPostcode(false),
          width: '100%',
          height: '100%',
        }).embed(postcodeRef.current, { q: query || '', autoClose: false });
      }
    }, 50);
  }, [daumReady, handlePostcodeComplete]);

  // 외부 클릭 시 postcode 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setShowPostcode(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ====================================================
  // fetchAllData - XMLHttpRequest 폴백 포함
  // ====================================================
  const fetchAllData = async (searchParams: typeof params, fullAddress: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const query = new URLSearchParams(searchParams).toString();

      // 안전한 fetch (재시도 + XHR 폴백)
      const safeFetch = async (path: string, name: string): Promise<any> => {
        const url = toApiUrl(path);

        // 시도 1: 일반 fetch (타임아웃 + 재시도)
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            console.log(`[API] ${name} fetch 시도 ${attempt + 1}/3: ${url}`);

            const res = await fetch(url, {
              signal: controller.signal,
              headers: { 'Accept': 'application/json' },
              cache: 'no-store',
              redirect: 'error',
            });
            clearTimeout(timeoutId);

            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const json = await res.json();
              if (!res.ok) {
                return { _error: json.error || `${name} 조회 실패 (${res.status})`, _status: res.status };
              }
              return json;
            }
            const text = await res.text();
            console.warn(`[API] ${name}: non-JSON (status=${res.status})`, text.substring(0, 200));
            return { _error: `서버가 잘못된 응답 반환 (status=${res.status})`, _status: res.status };
          } catch (e: any) {
            const isRedirectError = String(e?.message || '').toLowerCase().includes('redirect');
            if (isRedirectError) {
              return { _error: `${name} redirect loop detected. Please refresh and try again.`, _status: 310 };
            }
            console.warn(`[API] ${name} fetch 실패 (시도 ${attempt + 1}):`, e.message);
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
              continue;
            }
          }
        }

        // 시도 2: XMLHttpRequest 폴백 (fetch가 완전히 실패한 경우)
        console.log(`[API] ${name} XHR 폴백 시도: ${url}`);
        return new Promise((resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.timeout = 30000;
          xhr.onload = () => {
            try {
              const json = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(json);
              } else {
                resolve({ _error: json.error || `${name} 조회 실패 (${xhr.status})`, _status: xhr.status });
              }
            } catch {
              resolve({ _error: `${name} 응답 파싱 실패`, _status: xhr.status });
            }
          };
          xhr.onerror = () => {
            console.error(`[API] ${name} XHR도 실패`);
            resolve({ _error: `${name} network error. Please refresh and try again.`, _status: 0 });
          };
          xhr.ontimeout = () => {
            resolve({ _error: `${name} 응답 시간 초과`, _status: 408 });
          };
          xhr.send();
        });
      };

      // 1단계: 건물 표제부 (필수)
      const titleResultV2 = await safeFetch(`/api/building-report-v2?${query}`, '건물 표제부');
      const titleResult = titleResultV2?._error
        ? await safeFetch(`/api/building-report?${query}`, '건물 표제부(폴백)')
        : titleResultV2;

      if (titleResult._error) {
        setErrorMsg(titleResult._error);
        setData(null);
        return;
      }

      const buildingData = Array.isArray(titleResult.response?.body?.items?.item)
        ? titleResult.response.body.items.item[0]
        : titleResult.response?.body?.items?.item;

      if (!buildingData) {
        setErrorMsg('건축물대장 정보가 없습니다.');
        setData(null);
        return;
      }

      setData(buildingData);

      // 2단계: 호실/시세 정보 (선택) - 병렬 호출
      const [unitsResult, marketResult] = await Promise.all([
        safeFetch(`/api/building-units?${query}`, '호실 정보'),
        safeFetch(`/api/market-price?${query}`, '시세 정보')
      ]);

      setMarketPrice(marketResult?._error ? null : marketResult);

      const rawUnits = (unitsResult && !unitsResult._error) ? (unitsResult?.response?.body?.items?.item || []) : [];
      const unitList = Array.isArray(rawUnits) ? rawUnits : [rawUnits];

      const processedUnits = unitList.map((u: any, idx: number) => ({
        ...u,
        _uid: `${u.dongNm || ''}-${u.flrNo || '0'}-${u.hoNm || ''}-${u.area || ''}-${u.etcPurps || u.mainPurpsCdNm || ''}-${idx}`
      }));

      setUnits(processedUnits);

      // 히스토리 저장 (params/address 포함 - 검색목록에서 재조회 가능하도록)
      const historyItem = {
        id: Date.now().toString(),
        title: buildingData.bldNm || fullAddress.split(' ').slice(0, 3).join(' '),
        date: new Date().toLocaleDateString(),
        address: fullAddress,
        params: searchParams,
      };
      const saved = localStorage.getItem('building_report_history');
      const history = saved ? JSON.parse(saved) : [];
      const updated = [historyItem, ...history.filter((h: any) => h.title !== historyItem.title)].slice(0, 10);
      localStorage.setItem('building_report_history', JSON.stringify(updated));
      // 사이드바에 변경 알림
      window.dispatchEvent(new Event('historyUpdated'));

    } catch (error: any) {
      console.error('[fetchAllData] 오류:', error);
      setErrorMsg(`데이터 조회 오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 랜딩 페이지 (데이터 없을 때)
  if (!data && !loading) {
    return (
      <>
        <Script
          src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log('[Daum] Postcode SDK 로드 완료');
            setDaumReady(true);
          }}
          onError={(e) => {
            console.error('[Daum] Postcode SDK 로드 실패:', e);
          }}
        />

        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* 내비게이션 바 */}
          <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 leading-tight">
                    BuildingReportPro
                  </h1>
                  <p className="text-xs text-gray-500 -mt-0.5">매입 · 임차 견적 자동화</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Search className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </nav>

          {/* 스텝 인디케이터 */}
          <StepIndicator currentStep={1} />

          {/* 에러 배너 */}
          {errorMsg && (
            <div className="max-w-3xl mx-auto mt-4 px-4">
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium flex-1">{errorMsg}</p>
                <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 히어로 섹션 */}
          <div ref={searchWrapperRef}>
            <LandingHero
              addressInput={addressInput}
              setAddressInput={setAddressInput}
              onSearch={(query) => openPostcodeEmbed(query)}
              showPostcode={showPostcode}
              postcodeRef={postcodeRef}
              onClosePostcode={() => setShowPostcode(false)}
            />
          </div>

          {/* 주요 기능 */}
          <LandingFeatures />

          {/* 실적 수치 */}
          <LandingStats />

          {/* 이용 방법 */}
          <LandingHowItWorks />

          {/* 고객 리뷰 */}
          <LandingTestimonials />

          {/* FAQ */}
          <LandingFAQ />

          {/* 최종 행동 유도 */}
          <LandingCTA onStartClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
              const input = document.querySelector('input[placeholder*="건물명"]') as HTMLInputElement;
              input?.focus();
            }, 500);
          }} />
        </div>
      </>
    );
  }

  // 대시보드 (데이터 있을 때)
  return (
    <>
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[Daum] Postcode SDK 로드 완료');
          setDaumReady(true);
        }}
        onError={(e) => {
          console.error('[Daum] Postcode SDK 로드 실패:', e);
        }}
      />

      <DashboardShell
        title={data ? (data.bldNm || '건축물 정보 분석') : 'BuildingReportPro'}
        subTitle={address || '주소를 검색하면 분석이 시작됩니다.'}
        sidebar={
          <HistorySidebar
            onSelectItem={(item) => {
              if (item.params && item.address) {
                setAddress(item.address);
                setAddressInput(item.address);
                setParams(item.params);
                setSelectedIds(new Set());
                setErrorMsg(null);
                setCoords(undefined);
                setPendingSearch({ params: item.params, address: item.address });
              }
            }}
          />
        }
        stepIndicator={<StepIndicator currentStep={isQuotationOpen ? 3 : 2} />}
        onLogoClick={() => {
          setData(null);
          setUnits([]);
          setAddress('');
          setSelectedIds(new Set());
          setIsQuotationOpen(false);
          setShowPostcode(false);
          setErrorMsg(null);
        }}
        headerAction={
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block" ref={searchWrapperRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onFocus={() => {
                  if (daumReady) openPostcodeEmbed(addressInput.trim());
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && addressInput.trim()) {
                    openPostcodeEmbed(addressInput.trim());
                  }
                }}
                placeholder="새 주소 검색.."
                className="w-56 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white hover:border-slate-300"
              />
              {showPostcode && (
                <div className="absolute top-full left-0 mt-1 w-[400px] h-[400px] bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
                    <span className="text-xs font-medium text-gray-600">주소 검색</span>
                    <button onClick={() => setShowPostcode(false)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                      <X className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </div>
                  <div ref={postcodeRef} className="w-full" style={{ height: 'calc(100% - 36px)' }} />
                </div>
              )}
            </div>
            <Button
              onClick={() => openPostcodeEmbed(addressInput.trim() || undefined)}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">검색</span>
              <span className="sm:hidden">주소 변경</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()} className="rounded-xl">
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        }
      >
        {/* 에러 배너 */}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium flex-1">{errorMsg}</p>
            <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex h-[500px] items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xl font-black text-zinc-400 tracking-tighter uppercase">Analyzing Official Big Data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-32">
            <TopMetrics data={data} />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-4 space-y-6 flex flex-col">
                <div className={`h-[400px] ${isQuotationOpen ? 'invisible' : ''}`}>
                  <InvestmentMap address={address} coords={coords} transactions={marketPrice?.transactions} />
                </div>
                <div className="h-[300px]">
                  <MarketChart trends={marketPrice?.trends} />
                </div>
                <YieldCalculator />
                <TradeComparison
                  comparison={marketPrice?.comparison}
                  totalCount={marketPrice?.totalCount}
                />
                {params.sigunguCd && (
                  <RealTradeChart
                    lawdCd={params.sigunguCd}
                    buildingName={data?.bldNm}
                    buildingType="officetel"
                  />
                )}
              </div>

              <div className="xl:col-span-8 h-[950px]">
                <UnitGridTable
                  units={units}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                />
              </div>
            </div>
          </div>
        )}
      </DashboardShell>

      {selectedUnits.length > 0 && !isQuotationOpen && (
        <FloatingQuoteBar
          selectedUnits={selectedUnits}
          onClear={() => setSelectedIds(new Set())}
          onGenerate={() => setIsQuotationOpen(true)}
        />
      )}

      {isQuotationOpen && (
        <QuotationModal
          selectedUnits={selectedUnits}
          allUnits={units}
          buildingData={data}
          address={address}
          onClose={() => setIsQuotationOpen(false)}
        />
      )}
    </>
  );
}
