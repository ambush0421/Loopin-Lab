import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: '개인정보처리방침',
    description: 'Building Report Pro 개인정보처리방침. 수집하는 개인정보 항목, 이용 목적, 보관 기간 및 파기 절차에 대해 안내합니다.',
};

export default function PrivacyPage() {
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
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-zinc-900">개인정보처리방침</h1>
                            <p className="text-zinc-500 mt-1">최종 수정일: 2024년 1월 1일</p>
                        </div>
                    </div>

                    {/* 본문 */}
                    <div className="prose prose-zinc max-w-none">
                        <p className="text-lg text-zinc-600 leading-relaxed">
                            Building Report Pro(이하 "서비스")는 이용자의 개인정보를 중요시하며,
                            「개인정보 보호법」을 준수하고 있습니다. 본 개인정보처리방침을 통해
                            이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며,
                            개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
                        </p>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">1. 수집하는 개인정보 항목</h2>
                        <p>서비스는 최소한의 개인정보만을 수집합니다.</p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-600">
                            <li><strong>자동 수집 항목:</strong> IP 주소, 쿠키, 방문 일시, 서비스 이용 기록, 브라우저 유형</li>
                            <li><strong>분석 목적 정보:</strong> 검색한 주소 정보 (익명화 처리됨)</li>
                        </ul>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">2. 개인정보의 수집 및 이용 목적</h2>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-600">
                            <li>서비스 제공 및 운영</li>
                            <li>서비스 개선 및 신규 서비스 개발</li>
                            <li>이용자 통계 분석 및 서비스 품질 향상</li>
                            <li>부정 이용 방지 및 서비스 안정성 확보</li>
                        </ul>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">3. 개인정보의 보유 및 이용 기간</h2>
                        <p className="text-zinc-600">
                            수집된 개인정보는 수집 목적이 달성된 후 지체 없이 파기됩니다.
                            단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-600">
                            <li>웹사이트 방문 기록: 3개월</li>
                            <li>서비스 이용 기록: 1년</li>
                        </ul>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">4. 개인정보의 제3자 제공</h2>
                        <p className="text-zinc-600">
                            서비스는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.
                            다만, 다음의 경우에는 예외로 합니다.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-600">
                            <li>이용자가 사전에 동의한 경우</li>
                            <li>법령의 규정에 따르거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요청이 있는 경우</li>
                        </ul>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">5. 쿠키(Cookie)의 사용</h2>
                        <p className="text-zinc-600">
                            서비스는 이용자에게 개인화된 서비스를 제공하기 위해 쿠키를 사용합니다.
                            쿠키는 웹사이트가 고객의 컴퓨터 브라우저로 전송하는 소량의 정보입니다.
                            이용자는 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.
                        </p>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">6. 개인정보의 파기 절차 및 방법</h2>
                        <p className="text-zinc-600">
                            서비스는 개인정보 수집 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-600">
                            <li><strong>파기 절차:</strong> 보유 기간이 경과한 개인정보는 즉시 파기</li>
                            <li><strong>파기 방법:</strong> 전자적 파일은 복구 불가능한 방법으로 영구 삭제</li>
                        </ul>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">7. 이용자 및 법정대리인의 권리와 행사 방법</h2>
                        <p className="text-zinc-600">
                            이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며,
                            삭제를 요청할 수 있습니다.
                        </p>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">8. 개인정보 보호책임자</h2>
                        <div className="bg-zinc-50 p-6 rounded-xl text-zinc-600">
                            <p><strong>개인정보 보호책임자:</strong> 홍길동</p>
                            <p><strong>이메일:</strong> privacy@building-report.pro</p>
                            <p><strong>전화:</strong> 02-0000-0000</p>
                        </div>

                        <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">9. 개인정보처리방침의 변경</h2>
                        <p className="text-zinc-600">
                            본 개인정보처리방침은 법령, 정책 또는 서비스 변경에 따라 수정될 수 있습니다.
                            변경 시 공지사항을 통해 안내드립니다.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
