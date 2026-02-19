import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: '이용약관',
    description: 'Building Report Pro 이용약관. 서비스 이용 조건, 이용자의 권리와 의무, 면책사항 등을 안내합니다.',
};

export default function TermsPage() {
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

            {/* 콘텐츠 */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
                    {/* 타이틀 */}
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-zinc-100">
                        <div className="p-3 bg-blue-600 rounded-2xl">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-zinc-900">이용약관</h1>
                            <p className="text-zinc-500 mt-1">최종 수정일: 2024년 1월 1일</p>
                        </div>
                    </div>

                    {/* 본문 */}
                    <div className="prose prose-zinc max-w-none">
                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">제1조 (목적)</h2>
                        <p className="text-zinc-600">
                            본 약관은 Building Report Pro(이하 &quot;서비스&quot;)가 제공하는 건축물대장 분석 서비스의
                            이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                        </p>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">제2조 (정의)</h2>
                        <ol className="list-decimal pl-6 space-y-2 text-zinc-600">
                            <li>&quot;서비스&quot;란 Building Report Pro가 제공하는 건축물대장 조회 및 분석 서비스를 말합니다.</li>
                            <li>&quot;이용자&quot;란 본 약관에 따라 서비스를 이용하는 자를 말합니다.</li>
                            <li>&quot;콘텐츠&quot;란 서비스에서 제공하는 건축물 정보, 분석 리포트 등 모든 정보를 말합니다.</li>
                        </ol>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">제3조 (약관의 효력 및 변경)</h2>
                        <ol className="list-decimal pl-6 space-y-2 text-zinc-600">
                            <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
                            <li>서비스는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있으며,
                                변경된 약관은 공지 후 적용됩니다.</li>
                        </ol>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">제4조 (서비스의 제공)</h2>
                        <ol className="list-decimal pl-6 space-y-2 text-zinc-600">
                            <li>서비스는 다음의 서비스를 제공합니다:
                                <ul className="list-disc pl-6 mt-2 space-y-1">
                                    <li>건축물대장 정보 조회 및 분석</li>
                                    <li>호실별 면적 정보 제공</li>
                                    <li>예상 매매가/임대료 계산</li>
                                    <li>통합 견적서 생성</li>
                                </ul>
                            </li>
                            <li>서비스는 연중무휴 24시간 제공을 원칙으로 하나, 시스템 점검 등의 이유로
                                일시적으로 중단될 수 있습니다.</li>
                        </ol>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">제5조 (데이터 출처 및 정확성)</h2>
                        <ol className="list-decimal pl-6 space-y-2 text-zinc-600">
                            <li>서비스에서 제공하는 건축물 정보는 국토교통부 공공데이터포털의
                                건축물대장 데이터를 기반으로 합니다.</li>
                            <li>데이터의 정확성은 원천 데이터(공공데이터포털)의 정확성에 의존하며,
                                서비스는 데이터의 완전성, 정확성을 보증하지 않습니다.</li>
                            <li>이용자는 중요한 의사결정 시 반드시 등기부등본, 현장 실사 등
                                별도의 검증 절차를 거쳐야 합니다.</li>
                        </ol>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">제6조 (이용자의 의무)</h2>
                        <ol className="list-decimal pl-6 space-y-2 text-zinc-600">
                            <li>이용자는 관련 법령, 본 약관의 규정을 준수하여야 합니다.</li>
                            <li>이용자는 서비스를 이용하여 얻은 정보를 서비스의 사전 승낙 없이
                                복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리 목적으로 이용하거나
                                제3자에게 이용하게 할 수 없습니다.</li>
                            <li>이용자는 서비스의 정상적인 운영을 방해하는 행위를 해서는 안 됩니다.</li>
                        </ol>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">제7조 (면책사항)</h2>
                        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-zinc-600">
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>서비스는 공공데이터를 기반으로 한 참고 정보를 제공하며,
                                    해당 정보의 정확성, 완전성, 적시성을 보장하지 않습니다.</li>
                                <li>이용자가 서비스를 통해 얻은 정보를 바탕으로 내린 모든 의사결정에 대한
                                    책임은 이용자 본인에게 있습니다.</li>
                                <li>서비스는 이용자가 서비스를 이용하여 기대하는 수익을 얻지 못하거나
                                    상실한 것에 대해 책임지지 않습니다.</li>
                                <li>천재지변, 시스템 장애 등 서비스 제공자의 귀책사유가 없는
                                    서비스 중단에 대해서는 책임이 면제됩니다.</li>
                            </ol>
                        </div>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">제8조 (저작권)</h2>
                        <ol className="list-decimal pl-6 space-y-2 text-zinc-600">
                            <li>서비스가 작성한 저작물에 대한 저작권 및 기타 지적재산권은 서비스에 귀속됩니다.</li>
                            <li>이용자는 서비스를 이용함으로써 얻은 정보를 서비스의 사전 승낙 없이
                                무단으로 복제, 전송, 출판, 배포, 방송 기타 방법에 의하여
                                영리 목적으로 이용하거나 제3자에게 제공할 수 없습니다.</li>
                        </ol>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">제9조 (분쟁 해결)</h2>
                        <ol className="list-decimal pl-6 space-y-2 text-zinc-600">
                            <li>서비스와 이용자 간에 발생한 분쟁에 관한 소송은
                                민사소송법상의 관할법원에 제기합니다.</li>
                            <li>서비스와 이용자 간에 제기된 소송에는 대한민국 법을 적용합니다.</li>
                        </ol>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">부칙</h2>
                        <p className="text-zinc-600">
                            본 약관은 2024년 1월 1일부터 시행합니다.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
