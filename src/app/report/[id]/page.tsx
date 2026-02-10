'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ReportView from '@/components/ReportView';
import { Loader2, ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchReport(params.id as string);
    }
  }, [params.id]);

  const fetchReport = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setReportData(data.building_data);
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('보고서를 불러오는 중 오류가 발생했습니다.');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">보고서를 찾을 수 없습니다.</h1>
        <Link href="/dashboard" className="text-blue-600 hover:underline">대시보드로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            대시보드로 돌아가기
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" />
            PDF로 저장 / 인쇄
          </button>
        </div>

        <div className="overflow-auto pb-12">
          <ReportView data={reportData} />
        </div>
      </div>
    </div>
  );
}
