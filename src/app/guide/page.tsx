import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Search, MousePointer, Calculator, Printer, ChevronDown } from 'lucide-react';

// ============================
// SEO 메타데이터 — 이용 가이드
// ============================
export const metadata: Metadata = {
  title: '이용 가이드',
  description:
    '빌딩 리포트 프로 이용 방법 안내. 주소 검색 → 호실 선택 → 수익률 자동계산 → 견적서 인쇄까지 4단계로 건축물대장 분석 리포트를 완성하세요.',
  keywords: ['건축물대장조회방법', '부동산분석서비스이용법', '수익률계산방법', '임대수익률자동계산'],
  openGraph: {
    title: '이용 가이드 | 빌딩 리포트 프로',
    description: '4단계로 건축물대장 분석 완료. 주소 검색부터 견적서 생성까지.',
    url: 'https://building-report.pro/guide',
    type: 'website',
  },
  alternates: {
    canonical: 'https://building-report.pro/guide',
  },
};

// ============================
// HowTo + FAQPage JSON-LD
// ============================
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'HowTo',
      name: '빌딩 리포트 프로 이용 방법 — 건축물대장 분석 4단계',
      description: '주소 입력부터 견적서 생성까지 4단계로 부동산 분석 리포트를 완성합니다.',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: '주소 검색',
          text: '분석하고 싶은 건물의 주소를 검색창에 입력합니다. 도로명 주소 또는 건물명으로 검색 가능하며, Daum 우편번호 서비스를 통해 정확한 주소를 선택합니다.',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: '호실 선택',
          text: '조회된 건물의 전체 호실 목록에서 분석하고 싶은 호실을 하나 이상 선택합니다. 집합건물의 경우 호실별 전용면적·공용면적·계약면적이 자동으로 표시됩니다.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: '수익률 자동계산 확인',
          text: '매매가 또는 보증금·월임대료를 입력하면 임대 수익률, BEP(투자금 회수기간), 대출 레버리지 효과 등 8대 투자 지표가 즉시 자동 계산됩니다.',
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: '견적서 인쇄 / PDF 저장',
          text: '분석 결과를 견적서로 생성한 후 인쇄하거나 PDF로 저장합니다. 선택한 호실 정보와 금액이 포함된 전문적인 부동산 견적서가 완성됩니다.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '건축물대장 조회가 안 될 때는 어떻게 하나요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '신축 건물이거나 공공데이터에 아직 등록되지 않은 경우 조회가 안 될 수 있습니다. 주소를 정확히 입력했는지 확인하고, 지번 주소 대신 도로명 주소로 시도해 보세요. 그래도 조회되지 않으면 국토교통부 건축행정시스템(세움터)에서 직접 확인하시기 바랍니다.',
          },
        },
        {
          '@type': 'Question',
          name: '수익률 계산에 어떤 값을 입력해야 하나요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '매입의 경우 매매가, 임차의 경우 보증금과 월 임대료(월세)를 입력합니다. 대출을 활용할 경우 대출금액과 금리를 추가 입력하면 레버리지 효과가 포함된 수익률이 계산됩니다.',
          },
        },
        {
          '@type': 'Question',
          name: '여러 호실을 한 번에 선택할 수 있나요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '예, 가능합니다. 호실 선택 그리드에서 원하는 여러 호실을 체크하면 선택한 호실들의 면적이 합산되어 견적서에 포함됩니다. 층별 전체 선택 기능도 제공합니다.',
          },
        },
        {
          '@type': 'Question',
          name: '견적서를 PDF로 저장할 수 있나요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '인쇄 버튼을 클릭하면 브라우저 인쇄 대화상자가 열립니다. 대화상자에서 "PDF로 저장"을 선택하면 PDF 파일로 저장할 수 있습니다. Chrome, Edge, Safari 모두 지원합니다.',
          },
        },
        {
          '@type': 'Question',
          name: '과거에 조회한 건물을 다시 볼 수 있나요?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '예, 최근 조회한 건물 목록이 사이드바 히스토리에 자동 저장됩니다. 히스토리에서 클릭하면 동일한 주소로 다시 조회됩니다. 이 정보는 브라우저 로컬스토리지에 저장되며 최대 10개까지 유지됩니다.',
          },
        },
      ],
    },
  ],
};

// ============================
// 단계별 가이드 데이터
// ============================
const steps = [
  {
    num: 1,
    icon: Search,
    title: '주소 검색',
    desc: '분석하고 싶은 건물의 주소를 검색창에 입력합니다.',
    details: [
      '도로명 주소 또는 건물명으로 검색 가능',
      'Daum 우편번호 서비스로 정확한 주소 선택',
      '주소 선택 즉시 건축물대장 자동 조회 시작',
    ],
  },
  {
    num: 2,
    icon: MousePointer,
    title: '호실 선택',
    desc: '조회된 건물의 호실 목록에서 분석할 호실을 선택합니다.',
    details: [
      '전체 호실의 전용·공용·계약면적 자동 표시',
      '복수 호실 동시 선택 가능',
      '층별 일괄 선택 기능 제공',
    ],
  },
  {
    num: 3,
    icon: Calculator,
    title: '수익률 자동계산',
    desc: '매매가 또는 보증금·임대료를 입력하면 수익률이 자동 계산됩니다.',
    details: [
      '임대 수익률, BEP(회수기간) 즉시 산출',
      '대출 레버리지 시뮬레이션',
      '8대 투자 핵심 지표 한눈에 확인',
    ],
  },
  {
    num: 4,
    icon: Printer,
    title: '견적서 인쇄 / PDF 저장',
    desc: '분석 결과를 전문 견적서로 생성하고 인쇄하거나 PDF로 저장합니다.',
    details: [
      '선택 호실·금액 포함 전문 견적서 자동 생성',
      '브라우저 인쇄 기능으로 PDF 저장 가능',
      'A4 인쇄에 최적화된 레이아웃',
    ],
  },
];

// ============================
// FAQ 데이터
// ============================
const faqs = [
  {
    q: '건축물대장 조회가 안 될 때는 어떻게 하나요?',
    a: '신축 건물이거나 공공데이터에 아직 등록되지 않은 경우 조회가 안 될 수 있습니다. 주소를 정확히 입력했는지 확인하고, 지번 주소 대신 도로명 주소로 시도해 보세요. 그래도 조회되지 않으면 국토교통부 건축행정시스템(세움터)에서 직접 확인하시기 바랍니다.',
  },
  {
    q: '수익률 계산에 어떤 값을 입력해야 하나요?',
    a: '매입의 경우 매매가, 임차의 경우 보증금과 월 임대료를 입력합니다. 대출을 활용할 경우 대출금액과 금리를 추가 입력하면 레버리지 효과가 포함된 수익률도 계산됩니다.',
  },
  {
    q: '여러 호실을 한 번에 선택할 수 있나요?',
    a: '예, 가능합니다. 호실 선택 그리드에서 여러 호실을 체크하면 면적이 합산되어 견적서에 포함됩니다.',
  },
  {
    q: '견적서를 PDF로 저장할 수 있나요?',
    a: '인쇄 버튼 클릭 후 브라우저의 "PDF로 저장"을 선택하면 됩니다. Chrome, Edge, Safari, Firefox 모두 지원합니다.',
  },
  {
    q: '과거에 조회한 건물을 다시 볼 수 있나요?',
    a: '사이드바 히스토리에 최근 조회 건물이 자동 저장됩니다. 클릭하면 다시 조회되며, 최대 10개까지 유지됩니다.',
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> 홈으로 돌아가기
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">

        {/* 제목 */}
        <div>
          <h1 className="text-3xl font-black text-zinc-900 mb-2">이용 가이드</h1>
          <p className="text-zinc-500">4단계로 건축물대장 분석 리포트를 완성하세요.</p>
        </div>

        {/* 단계별 가이드 */}
        <section aria-label="단계별 이용 방법">
          <h2 className="text-xl font-bold text-zinc-800 mb-6">이용 방법</h2>
          <ol className="space-y-4">
            {steps.map((step) => (
              <li key={step.num} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex gap-5">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg">
                  {step.num}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <step.icon className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-zinc-900">{step.title}</h3>
                  </div>
                  <p className="text-sm text-zinc-600 mb-3">{step.desc}</p>
                  <ul className="space-y-1">
                    {step.details.map((d) => (
                      <li key={d} className="text-xs text-zinc-500 flex items-start gap-1.5">
                        <span className="text-blue-500 mt-0.5">·</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ — GEO 대화형 콘텐츠 */}
        <section aria-label="자주 묻는 질문 (FAQ)">
          <h2 className="text-xl font-bold text-zinc-800 mb-6">자주 묻는 질문 (FAQ)</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="bg-white border border-zinc-200 rounded-2xl p-5 group shadow-sm"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-semibold text-zinc-800 text-sm">{faq.q}</span>
                  <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform shrink-0 ml-2" />
                </summary>
                <p className="text-sm text-zinc-600 mt-3 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 주의사항 */}
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h2 className="font-bold text-amber-800 mb-3">데이터 이용 시 유의사항</h2>
          <ul className="space-y-2 text-sm text-amber-700">
            <li>· 건축물대장 데이터는 국토교통부 공공데이터포털 기준이며, 실제 현황과 차이가 있을 수 있습니다.</li>
            <li>· 수익률 계산은 입력값 기반의 참고용 수치이며 투자 결과를 보장하지 않습니다.</li>
            <li>· 중요한 의사결정 시 반드시 등기부등본, 현장 실사 등 별도 확인을 권장합니다.</li>
          </ul>
        </section>

      </main>
    </div>
  );
}
