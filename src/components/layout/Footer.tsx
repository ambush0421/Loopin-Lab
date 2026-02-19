'use client';

import Link from 'next/link';
import { Building2, Mail, Shield, FileText, Info } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full bg-zinc-900 text-zinc-400 print:hidden">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-xl">BuildingReportPro</h3>
                <p className="text-xs text-zinc-500">공공데이터 기반 건축물 분석 플랫폼</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              BuildingReportPro는 건축물대장 데이터를 기반으로 매입/임차 의사결정을 돕는 분석 리포트를 제공합니다.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4" />
              <a href="mailto:contact@building-report.pro" className="hover:text-white transition-colors">
                contact@building-report.pro
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">서비스</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">건축물 분석</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">서비스 소개</Link></li>
              <li><Link href="/guide" className="hover:text-white transition-colors">이용 가이드</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">고객지원</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors flex items-center gap-1"><Shield className="w-3 h-3" /> 개인정보처리방침</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors flex items-center gap-1"><FileText className="w-3 h-3" /> 이용약관</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors flex items-center gap-1"><Info className="w-3 h-3" /> 회사 소개</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <p>© {currentYear} BuildingReportPro. All rights reserved.</p>
          <p>데이터 출처: data.go.kr</p>
        </div>
      </div>
    </footer>
  );
}
