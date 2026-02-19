'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { Loader2, FileText, Trash2, Calendar, MapPin, Search, Calculator } from 'lucide-react';
import { ExpertCalculator } from '@/components/dashboard/ExpertCalculator';

interface SavedReport {
  id: string;
  address: string;
  created_at: string;
  building_data: {
    bldNm?: string;
    [key: string]: unknown;
  } | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchReports(session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchReports = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id, address, created_at, building_data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase.from('reports').delete().eq('id', id);
      if (error) throw error;
      setReports(reports.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const filteredReports = reports.filter(report => 
    report.address.includes(searchTerm) || 
    report.building_data?.bldNm?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold">로그인이 필요합니다</h1>
        <Link href="/" className="text-blue-600 hover:underline">홈으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">내 보고서 보관함</h1>
            <p className="text-gray-500">저장된 부동산 분석 리포트를 관리하세요.</p>
          </div>
          <Link 
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 transition-colors"
          >
            + 새 보고서 만들기
          </Link>
        </header>

        {/* 전문가용 금융 시뮬레이터 섹션 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-900 p-2 rounded-xl">
              <Calculator className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">전문가용 금융 시뮬레이터</h2>
          </div>
          <ExpertCalculator />
        </section>

        {/* 검색 필터 */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="주소 또는 건물명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 리포트 목록 */}
        {reports.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">저장된 보고서가 없습니다</h3>
            <p className="mt-1 text-gray-500">첫 번째 부동산 분석을 시작해보세요!</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">검색 결과가 없습니다.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <div key={report.id} className="group relative overflow-hidden rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md border border-gray-100">
                <div className="mb-3 flex items-start justify-between">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <button 
                    onClick={() => handleDelete(report.id)}
                    className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <h3 className="mb-1 text-lg font-bold text-gray-900 line-clamp-1">
                  {report.building_data?.bldNm || '건물명 없음'}
                </h3>
                
                <div className="mb-4 flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">{report.address}</span>
                </div>

                <div className="mt-auto border-t pt-3 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(report.created_at).toLocaleDateString()}
                  </div>
                  <Link href={`/report/${report.id}`} className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                    열기 <span className="text-xs">→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
