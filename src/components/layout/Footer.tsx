'use client';

import Link from 'next/link';
import { Building2, Mail, Shield, FileText, Info } from 'lucide-react';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-zinc-900 text-zinc-400 print:hidden">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* 상단 정보 섹션 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* 브랜드 */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-600 rounded-xl">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-xl">Building Report Pro</h3>
                                <p className="text-xs text-zinc-500">공공데이터 기반 건축물 분석 플랫폼</p>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed mb-4">
                            Building Report Pro는 국토교통부 공공데이터포털의 건축물대장 정보를 활용하여
                            부동산 투자자, 임대사업자, 부동산 전문가들에게 신뢰할 수 있는 건축물 분석 리포트를 제공합니다.
                            정확한 데이터 기반의 의사결정을 지원합니다.
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4" />
                            <a href="mailto:contact@building-report.pro" className="hover:text-white transition-colors">
                                contact@building-report.pro
                            </a>
                        </div>
                    </div>

                    {/* 서비스 */}
                    <div>
                        <h4 className="text-white font-bold mb-4">서비스</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="hover:text-white transition-colors">
                                    건축물대장 분석
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="hover:text-white transition-colors">
                                    서비스 소개
                                </Link>
                            </li>
                            <li>
                                <Link href="/guide" className="hover:text-white transition-colors">
                                    이용 가이드
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 고객지원 */}
                    <div>
                        <h4 className="text-white font-bold mb-4">고객지원</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/privacy" className="hover:text-white transition-colors flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> 개인정보처리방침
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="hover:text-white transition-colors flex items-center gap-1">
                                    <FileText className="w-3 h-3" /> 이용약관
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="hover:text-white transition-colors flex items-center gap-1">
                                    <Info className="w-3 h-3" /> 회사 소개
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* 구분선 */}
                <div className="border-t border-zinc-800 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-xs text-zinc-500 text-center md:text-left">
                            <p>© {currentYear} Building Report Pro. All rights reserved.</p>
                            <p className="mt-1">
                                본 서비스는 <a href="https://www.data.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">공공데이터포털</a>의
                                국토교통부 건축물대장 정보를 활용합니다.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <span>사업자등록번호: 000-00-00000</span>
                            <span className="hidden md:inline">|</span>
                            <span>대표: 홍길동</span>
                        </div>
                    </div>
                </div>

                {/* 면책 조항 */}
                <div className="mt-6 p-4 bg-zinc-800/50 rounded-xl text-xs text-zinc-500 leading-relaxed">
                    <strong className="text-zinc-400">면책 조항:</strong> 본 서비스에서 제공하는 정보는
                    공공데이터포털의 건축물대장 정보를 기반으로 자동 생성된 참고 자료입니다.
                    실제 거래 시에는 반드시 등기부등본 확인, 현장 실사, 공인중개사 상담 등
                    정식 절차를 거쳐야 합니다. 본 서비스의 정보 오류로 인한 손해에 대해
                    서비스 제공자는 법적 책임을 지지 않습니다.
                </div>
            </div>
        </footer>
    );
}
