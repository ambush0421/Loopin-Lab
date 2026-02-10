'use client';

import React, { useState, useEffect } from 'react';
import DaumPostcodeEmbed from 'react-daum-postcode';
import axios from 'axios';
import { BuildingReport } from '@/types/building';
import ReportView from '@/components/ReportView';
import { Search, Loader2, Printer, RefreshCcw, LogIn, LogOut, CloudUpload, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function Home() {
  const [showPostcode, setShowPostcode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<BuildingReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const email = window.prompt('이메일을 입력해 주세요 (Magic Link 발송)');
    if (!email) return;
    
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) alert('로그인 실패: ' + error.message);
    else alert('이메일로 로그인 링크가 발송되었습니다.');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSaveReport = async () => {
    if (!user || !reportData) return;
    
    setSaveStatus('saving');
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          address: reportData.platAddr,
          building_data: reportData,
          land_data: reportData.landInfo,
          price_data: reportData.priceHistory
        });

      if (error) throw error;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Save Error:', err);
      alert('저장 중 오류가 발생했습니다.');
      setSaveStatus('idle');
    }
  };

  const handleAddressComplete = async (data: any) => {
    setShowPostcode(false);
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      // 주소 정보를 API 파라미터로 변환
      // sigunguCode: 5자리, bnameCode: 10자리 (앞 5자리가 시군구, 뒤 5자리가 법정동)
      const sigunguCd = data.sigunguCode;
      const bjdongCd = data.bnameCode.substring(5); // 뒤 5자리 추출
      
      // 번/지 추출 (예: "123-45" -> "0123", "0045")
      let bun = '';
      let ji = '';
      
      if (data.jibunAddress) {
        const match = data.jibunAddress.match(/(\d+)(-(\d+))?$/);
        if (match) {
          bun = match[1].padStart(4, '0');
          ji = (match[3] || '0').padStart(4, '0');
        }
      }

      const params = { sigunguCd, bjdongCd, bun, ji };

      // 병렬 API 호출
      const [bldRes, landRes, priceRes] = await Promise.all([
        axios.get('/api/building', { params }),
        axios.get('/api/land', { params }).catch(() => ({ data: { success: false } })),
        axios.get('/api/price', { params }).catch(() => ({ data: { success: false } }))
      ]);

      if (bldRes.data.success) {
        const integratedData: BuildingReport = {
          ...bldRes.data.data,
          landInfo: landRes.data.success ? landRes.data.data : undefined,
          priceHistory: priceRes.data.success ? priceRes.data.data : undefined,
        };
        setReportData(integratedData);
      } else {
        setError('건물 데이터를 가져오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || '오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header - Hidden on Print */}
        <div className="mb-8 flex justify-between items-start print:hidden">
          <div className="flex-1 text-center pl-10">
            <h1 className="text-4xl font-black text-blue-600 mb-2">Building Report Pro</h1>
            <p className="text-gray-600">주소 검색 한 번으로 완성되는 고품질 부동산 분석 보고서</p>
          </div>
          <div className="flex gap-2">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-medium">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-xl font-bold text-sm border hover:bg-gray-50 transition-colors shadow-sm"
              >
                <LogIn className="h-4 w-4" />
                로그인
              </button>
            )}
          </div>
        </div>

        {/* Search Section - Hidden on Print */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 print:hidden">
          {!reportData && !loading ? (
            <div className="text-center py-10">
              <button
                onClick={() => setShowPostcode(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                <Search className="h-5 w-5" />
                분석할 건물 주소 검색하기
              </button>
              <p className="mt-4 text-sm text-gray-400">도로명 또는 지번 주소를 입력해 주세요.</p>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setReportData(null);
                    setShowPostcode(true);
                  }}
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                >
                  <RefreshCcw className="h-4 w-4" />
                  다시 검색
                </button>
                {reportData && user && (
                  <button
                    onClick={handleSaveReport}
                    disabled={saveStatus !== 'idle'}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                      saveStatus === 'saved' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {saveStatus === 'saving' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : saveStatus === 'saved' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <CloudUpload className="h-4 w-4" />
                    )}
                    {saveStatus === 'saving' ? '저장 중...' : saveStatus === 'saved' ? '저장됨' : '클라우드 저장'}
                  </button>
                )}
              </div>
              {reportData && (
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  PDF 저정 및 인쇄
                </button>
              )}
            </div>
          )}

          {showPostcode && (
            <div className="mt-6 border rounded-xl overflow-hidden shadow-inner relative">
              <button 
                onClick={() => setShowPostcode(false)}
                className="absolute top-2 right-2 z-10 bg-gray-800 text-white text-xs px-2 py-1 rounded"
              >닫기</button>
              <DaumPostcodeEmbed onComplete={handleAddressComplete} />
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">건축물대장 API에서 데이터를 분석 중입니다...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center mb-8">
            {error}
          </div>
        )}

        {/* Report Content */}
        {reportData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ReportView data={reportData} />
          </div>
        )}
      </div>
    </main>
  );
}