import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, ArrowLeft, CheckCircle2, Database, Shield, Zap, Users, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
    title: '서비스 소개',
    description: 'Building Report Pro는 공공데이터 기반 건축물대장 분석 플랫폼입니다. 부동산 투자자, 임대사업자, 중개업소를 위한 전문 분석 리포트를 제공합니다.',
};

export default function AboutPage() {
    const features = [
        {
            icon: Database,
            title: '공공데이터 기반',
            description: '국토교통부 건축물대장 공식 데이터를 실시간으로 조회하여 신뢰할 수 있는 정보를 제공합니다.',
        },
        {
            icon: Zap,
            title: '즉시 분석',
            description: '주소만 입력하면 건물 개요, 호실별 면적, 주차대수, 승강기 등 핵심 정보를 즉시 분석합니다.',
        },
        {
            icon: BarChart3,
            title: '예상 금액 산정',
            description: '선택한 호실의 예상 매매가, 보증금, 월 임대료를 자동으로 계산합니다.',
        },
        {
            icon: Users,
            title: '통합 견적서',
            description: '임원 보고용 프리미엄 통합 견적서를 자동 생성하여 의사결정을 지원합니다.',
        },
    ];

    const targetUsers = [
        {
            title: '부동산 투자자',
            description: '상업용 부동산 투자 검토 시 건물 스펙과 예상 수익률을 빠르게 분석할 수 있습니다.',
        },
        {
            title: '임대사업자',
            description: '보유 건물의 호실별 면적과 임대료 산정에 필요한 정확한 데이터를 확보할 수 있습니다.',
        },
        {
            title: '부동산 중개업소',
            description: '고객에게 제공할 전문적인 건물 분석 리포트를 간편하게 생성할 수 있습니다.',
        },
        {
            title: '자산관리사(PM)',
            description: '관리 건물의 제원 정보를 체계적으로 파악하고 리포트할 수 있습니다.',
        },
    ];

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* 헤더 */}
            <header className="bg-white border-b border-zinc-200">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <Link href="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        홈으로 돌아가기
                    </Link>
                </div>
            </header>

            {/* 히어로 섹션 */}
            <section className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white py-20">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-3 bg-blue-600 px-4 py-2 rounded-full mb-6">
                        <Building2 className="w-5 h-5" />
                        <span className="font-bold text-sm">공공데이터 기반 건축물 분석 플랫폼</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                        Building Report Pro
                    </h1>
                    <p className="text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed">
                        국토교통부 건축물대장 데이터를 활용하여 건물 정보, 호실별 면적,
                        주차대수, 승강기, 예상 매매가/임대료까지 한눈에 분석합니다.
                        <br />
                        <strong className="text-white">부동산 투자 의사결정의 첫걸음</strong>, Building Report Pro와 함께하세요.
                    </p>
                    <div className="mt-10">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-colors shadow-xl shadow-blue-600/30"
                        >
                            지금 시작하기
                        </Link>
                    </div>
                </div>
            </section>

            {/* 주요 기능 */}
            <section className="py-20">
                <div className="max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl font-black text-zinc-900 text-center mb-4">주요 기능</h2>
                    <p className="text-zinc-500 text-center mb-12 max-w-2xl mx-auto">
                        Building Report Pro는 부동산 전문가를 위한 핵심 기능을 제공합니다.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-zinc-900 mb-2">{feature.title}</h3>
                                <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 이런 분들께 추천합니다 */}
            <section className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl font-black text-zinc-900 text-center mb-4">이런 분들께 추천합니다</h2>
                    <p className="text-zinc-500 text-center mb-12 max-w-2xl mx-auto">
                        Building Report Pro는 다양한 부동산 전문가들의 업무를 지원합니다.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {targetUsers.map((user, index) => (
                            <div key={index} className="flex items-start gap-4 p-6 bg-zinc-50 rounded-2xl">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900 mb-2">{user.title}</h3>
                                    <p className="text-sm text-zinc-500 leading-relaxed">{user.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 데이터 출처 */}
            <section className="py-20">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-8 md:p-12 rounded-3xl">
                        <div className="flex items-start gap-6">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Shield className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black mb-4">신뢰할 수 있는 공공데이터</h2>
                                <p className="text-blue-100 leading-relaxed mb-4">
                                    Building Report Pro는 국토교통부가 제공하는 공공데이터포털의 <strong className="text-white">건축물대장 정보</strong>를
                                    실시간으로 조회합니다. 정부가 공식적으로 제공하는 데이터를 기반으로 하므로
                                    높은 신뢰성을 보장합니다.
                                </p>
                                <p className="text-sm text-blue-200">
                                    * 최종 의사결정 시에는 등기부등본 확인, 현장 실사, 전문가 상담 등 별도의 검증 절차를 권장합니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-zinc-900 text-white">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-black mb-4">지금 바로 시작하세요</h2>
                    <p className="text-zinc-400 mb-8">
                        주소만 입력하면 건축물 분석 리포트가 즉시 생성됩니다.
                    </p>
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
