'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingStats } from '@/components/landing/LandingStats';
import { LandingValueUp } from '@/components/landing/LandingValueUp';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';
import { LandingTestimonials } from '@/components/landing/LandingTestimonials';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingCTA } from '@/components/landing/LandingCTA';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (query?: string) => {
    const targetQuery = query || searchQuery;
    if (targetQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(targetQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 내비게이션 바 */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#111111] to-[#2A2A2A] flex items-center justify-center shadow-sm">
              <span className="text-base font-semibold text-[#C9A962]">B</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                BuildingReportPro
              </h1>
              <p className="text-xs text-slate-500 -mt-0.5">프리미엄 부동산 분석 솔루션</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/explore" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              지도에서 탐색하기
            </Link>
            <Link href="/b2b-compare" className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
              B2B 비교 대시보드
            </Link>
          </div>
        </div>
      </nav>

      <LandingHero
        addressInput={searchQuery}
        setAddressInput={setSearchQuery}
        onSearch={handleSearch}
        showPostcode={false}
        postcodeRef={{ current: null }}
        onClosePostcode={() => { }}
      />

      <LandingFeatures />
      <LandingValueUp />
      <LandingStats />
      <LandingHowItWorks />
      <LandingTestimonials />
      <LandingFAQ />
      <LandingCTA onStartClick={() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          input?.focus();
        }, 500);
      }} />
    </div>
  );
}
