import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import { getSupabaseConfigError, hasSupabaseEnv, supabase } from '@/lib/supabase';
import ReportView from '@/components/ReportView';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface SharePageProps {
  params: Promise<{ id: string }>;
}

interface ShareReportRow {
  bld_nm: string | null;
  address: string | null;
  analysis_data: unknown | null;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  if (!hasSupabaseEnv) {
    return {
      title: '공유 리포트를 불러올 수 없음',
      description: getSupabaseConfigError() || 'Supabase 설정이 필요합니다.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { id } = await params;

  const { data } = await supabase
    .from('reports')
    .select('bld_nm, address, analysis_data')
    .eq('id', id)
    .single<ShareReportRow>();

  if (!data) {
    return {
      title: '보고서를 찾을 수 없습니다',
      description: '요청한 공유 보고서가 존재하지 않거나 접근할 수 없습니다.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const buildingName = data.bld_nm || '부동산';
  const address = data.address || '주소 정보 없음';

  return {
    title: `${buildingName} 투자 분석 보고서`,
    description: `주소: ${address} | BuildingReportPro 공유 리포트`,
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
    openGraph: {
      title: `${buildingName} 투자 분석 보고서`,
      description: `${address} 분석 결과를 확인하세요.`,
      url: `https://building-report.pro/share/${id}`,
      type: 'website',
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  if (!hasSupabaseEnv) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">저장 기능 미설정</h1>
          <p className="mt-3 text-sm text-slate-500">Supabase 환경설정이 누락되어 공유 데이터를 조회할 수 없습니다.</p>
          <Link href="/" className="mt-6 inline-block">
            <Button className="rounded-xl bg-blue-600 px-5 hover:bg-blue-700">새 분석 시작하기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { id } = await params;

  const { data: report, error } = await supabase
    .from('reports')
    .select('analysis_data, bld_nm, address')
    .eq('id', id)
    .single<ShareReportRow>();

  if (error || !report || !report.analysis_data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">보고서를 찾을 수 없습니다</h1>
          <p className="mt-3 text-sm text-slate-500">만료되었거나 삭제된 링크일 수 있습니다.</p>
          <Link href="/" className="mt-6 inline-block">
            <Button className="rounded-xl bg-blue-600 px-5 hover:bg-blue-700">새 분석 시작하기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur no-print">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-sm shadow-blue-500/20">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900">BuildingReportPro 공유 리포트</span>
          </div>
          <Link href="/">
            <Button size="sm" className="gap-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
              분석 시작
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <ReportView data={report.analysis_data} readOnly />
        </div>
      </main>

      <footer className="pb-10 pt-4 text-center text-xs text-slate-400 no-print">
        © 2026 BuildingReportPro
      </footer>
    </div>
  );
}
