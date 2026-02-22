import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Building2, CheckCircle2, Database, TrendingUp, FileText, Map } from 'lucide-react';

// ============================
// SEO 메타데이터 — 서비스 소개
// ============================
export const metadata: Metadata = {
  title: '서비스 소개',
  description:
    '빌딩 리포트 프로는 주소 하나로 건축물대장 분석, 호실별 면적 계산, 임대 수익률 자동산출, 부동산 견적서를 즉시 생성해 드리는 무료 부동산 분석 서비스입니다.',
  keywords: ['건축물대장분석', '부동산수익률', '임대수익률', '매입견적', '빌딩리포트'],
  openGraph: {
    title: '서비스 소개 | 빌딩 리포트 프로',
    description: '공공데이터 기반 건축물 분석 서비스. 주소 입력 한 번으로 수익률 자동 계산.',
    url: 'https://building-report.pro/about',
    type: 'website',
  },
  alternates: {
    canonical: 'https://building-report.pro/about',
  },
};

// ============================
// Organization JSON-LD
// ============================
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '빌딩 리포트 프로',
  url: 'https://building-report.pro',
  description:
    '국토교통부 공공데이터를 기반으로 건축물대장 분석, 임대 수익률 자동산출, 매입·임차 견적서를 제공하는 무료 부동산 분석 서비스.',
  knowsAbout: ['건축물대장', '부동산 수익률 분석', '임대차 견적', '공공데이터 API'],
  areaServed: 'KR',
  serviceType: '부동산 분석',
};

// ============================
// 핵심 기능 목록
// ============================
const features = [
  {
    icon: Database,
    title: '건축물대장 즉시 조회',
    desc: '국토교통부 공공데이터포털 API를 통해 건물 용도, 총 면적, 층수, 사용승인일 등의 공식 건축물대장 정보를 실시간으로 조회합니다.',
  },
  {
    icon: Building2,
    title: '호실별 면적 자동 계산',
    desc: '집합건물(상가·오피스텔·아파트 등)의 호실별 전용면적, 공용면적, 계약면적을 공공데이터 기준으로 자동 산출합니다.',
  },
  {
    icon: TrendingUp,
    title: '8대 투자 핵심 지표 자동산출',
    desc: '임대 수익률, 회수기간(BEP), 대출 레버리지 효과, 공실 리스크, 건물 노후도 등 투자 판단에 필요한 핵심 지표를 자동으로 계산합니다.',
  },
  {
    icon: FileText,
    title: '매입·임차 견적서 원클릭 생성',
    desc: '매매가 또는 보증금·임대료를 입력하면 전문적인 부동산 견적서가 즉시 생성됩니다. PDF 인쇄도 가능합니다.',
  },
  {
    icon: Map,
    title: '실거래가 비교 및 지도 시각화',
    desc: '국토교통부 실거래가 데이터를 기반으로 주변 최근 거래 현황을 파악하고, 카카오맵으로 위치와 주변 환경을 한눈에 확인합니다.',
  },
];

// ============================
// 활용 사례
// ============================
const useCases = [
  { label: '상가 매입 투자자', desc: '수익률과 회수기간을 자동 계산해 투자 타당성을 신속하게 검토' },
  { label: '임차 창업자', desc: '월세 조건 입력만으로 예상 임차 비용과 BEP를 즉시 파악' },
  { label: '공인중개사', desc: '고객에게 전문적인 분석 견적서를 신속하게 제공' },
  { label: '법인 부동산 담당자', desc: '다수 건물 비교 분석과 레버리지 시뮬레이션 활용' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> 홈으로 돌아가기
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">

        {/* 히어로 섹션 */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-zinc-900">빌딩 리포트 프로</h1>
          </div>
          <p className="text-xl text-zinc-700 font-semibold mb-3">
            주소 입력 한 번으로 완성되는 부동산 분석 리포트
          </p>
          <p className="text-zinc-600 leading-relaxed">
            빌딩 리포트 프로는 국토교통부 공공데이터포털의 건축물대장 데이터를 활용해
            부동산 매입·임차에 필요한 분석 정보를 무료로 제공합니다.
            주소를 입력하면 건축물 정보 조회부터 수익률 자동계산, 견적서 생성까지
            전 과정이 자동으로 처리됩니다.
          </p>
        </div>

        {/* 핵심 기능 */}
        <section aria-label="핵심 기능">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">핵심 기능</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm flex gap-4">
                <div className="shrink-0 p-2 bg-blue-50 rounded-xl h-fit">
                  <f.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-800 mb-1">{f.title}</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 데이터 출처 투명성 */}
        <section className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <h2 className="text-lg font-bold text-blue-900 mb-3">데이터 출처 및 정확성</h2>
          <ul className="space-y-2">
            {[
              '건축물대장 정보: 국토교통부 공공데이터포털 (data.go.kr) 건축물대장 표제부·전유부 API',
              '실거래가 데이터: 국토교통부 부동산 실거래 신고 데이터',
              '위치 정보: 카카오 로컬 API (지오코딩)',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-blue-800">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-blue-700 mt-3">
            ※ 공공데이터의 측량 기준일·업데이트 주기에 따라 최신 변경 사항이 즉시 반영되지 않을 수 있습니다.
            중요한 의사결정 시 등기부등본, 현장 실사 등 별도 확인을 권장합니다.
          </p>
        </section>

        {/* 활용 사례 */}
        <section aria-label="활용 사례">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">이런 분들이 활용하세요</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {useCases.map((u) => (
              <div key={u.label} className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm">
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{u.label}</span>
                <p className="text-sm text-zinc-600 mt-2">{u.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
