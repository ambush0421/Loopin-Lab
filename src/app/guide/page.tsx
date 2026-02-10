import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Search, MousePointer, FileText, Printer, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: '이용 가이드',
    description: 'Building Report Pro 이용 가이드. 건축물대장 분석 서비스 사용 방법을 단계별로 안내합니다.',
};

export default function GuidePage() {
    const steps = [
        {
            step: 1,
            icon: Search,
            title: '주소 검색',
            description: '분석하고자 하는 건물의 주소를 입력하거나 검색합니다.',
            details: [
                '메인 화면에서 주소를 직접 입력하거나 "전체 주소 검색 팝업"을 클릭합니다.',
                '도로명 주소 또는 지번 주소 모두 검색 가능합니다.',
                '예: "강남구 테헤란로 123" 또는 "마곡동 456-7"',
            ],
        },
        {
            step: 2,
            icon: MousePointer,
            title: '호실 선택',
            description: '분석하고자 하는 호실을 선택합니다.',
            details: [
                '건물 정보가 로드되면 호실별 전유면적 목록이 표시됩니다.',
                '개별 호실을 클릭하여 선택하거나, 층별로 전체 선택할 수 있습니다.',
                '최대 100개 호실까지 동시 선택 가능합니다.',
            ],
        },
        {
            step: 3,
            icon: FileText,
            title: '통합 견적서 생성',
            description: '선택한 호실에 대한 종합 분석 리포트를 생성합니다.',
            details: [
                '호실을 선택하면 하단에 "통합 견적서 생성" 버튼이 나타납니다.',
                '버튼을 클릭하면 건물 개요, 선택 호실 요약, 예상 금액이 포함된 리포트가 생성됩니다.',
                '평당 매매가, 보증금, 임대료를 직접 조정하여 시뮬레이션할 수 있습니다.',
            ],
        },
        {
            step: 4,
            icon: Printer,
            title: 'PDF 저장 / 인쇄',
            description: '생성된 견적서를 PDF로 저장하거나 인쇄합니다.',
            details: [
                '견적서 화면에서 "PDF 저장 / 인쇄" 버튼을 클릭합니다.',
                '브라우저의 인쇄 기능을 통해 PDF로 저장하거나 직접 인쇄할 수 있습니다.',
                '임원 보고용, 고객 제안용 등 다양한 용도로 활용 가능합니다.',
            ],
        },
    ];

    const faqs = [
        {
            question: '데이터는 어디서 가져오나요?',
            answer: '국토교통부가 운영하는 공공데이터포털(data.go.kr)의 건축물대장 정보를 실시간으로 조회합니다. 정부 공식 데이터를 기반으로 하므로 높은 신뢰성을 보장합니다.',
        },
        {
            question: '모든 건물 정보를 조회할 수 있나요?',
            answer: '건축물대장에 등록된 모든 건물 정보를 조회할 수 있습니다. 다만, 신축 건물의 경우 등록까지 시간이 소요될 수 있습니다.',
        },
        {
            question: '예상 금액은 어떻게 계산되나요?',
            answer: '사용자가 입력한 평당 가격(매매가, 보증금, 임대료)과 선택한 호실의 전용면적을 기반으로 자동 계산됩니다. 실제 시세와 다를 수 있으므로 참고용으로 활용해 주세요.',
        },
        {
            question: '이 정보로 바로 계약해도 되나요?',
            answer: '본 서비스는 참고용 정보를 제공합니다. 실제 거래 시에는 반드시 등기부등본 확인, 현장 실사, 공인중개사 상담 등 정식 절차를 거쳐주세요.',
        },
        {
            question: '사용료가 있나요?',
            answer: '현재 기본 기능은 무료로 제공됩니다.',
        },
    ];

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* 헤더 */}
            <header className="bg-white border-b border-zinc-200">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <Link href="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        홈으로 돌아가기
                    </Link>
                </div>
            </header>

            {/* 히어로 */}
            <section className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-16">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-4xl font-black mb-4">이용 가이드</h1>
                    <p className="text-blue-100 text-lg">
                        Building Report Pro 사용 방법을 단계별로 안내합니다.
                    </p>
                </div>
            </section>

            {/* 사용 단계 */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-2xl font-black text-zinc-900 mb-8">사용 방법</h2>

                    <div className="space-y-8">
                        {steps.map((item) => (
                            <div key={item.step} className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                                <div className="flex items-start gap-6">
                                    <div className="flex-shrink-0">
                                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                                            {item.step}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <item.icon className="w-5 h-5 text-blue-600" />
                                            <h3 className="text-xl font-bold text-zinc-900">{item.title}</h3>
                                        </div>
                                        <p className="text-zinc-600 mb-4">{item.description}</p>
                                        <ul className="space-y-2">
                                            {item.details.map((detail, index) => (
                                                <li key={index} className="flex items-start gap-2 text-sm text-zinc-500">
                                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                                                    {detail}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 bg-white">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex items-center gap-3 mb-8">
                        <HelpCircle className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-black text-zinc-900">자주 묻는 질문</h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="border border-zinc-200 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-zinc-900 mb-2">Q. {faq.question}</h3>
                                <p className="text-zinc-600 leading-relaxed">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <p className="text-zinc-500 mb-4">준비되셨나요?</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-colors"
                    >
                        건축물 분석 시작하기
                    </Link>
                </div>
            </section>
        </div>
    );
}
