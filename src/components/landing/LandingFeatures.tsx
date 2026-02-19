'use client';

import { Building2, CircleCheckBig, FileText, LineChart } from 'lucide-react';

const FEATURES = [
  {
    title: '공공데이터 수집',
    description: '건물대장과 거래 핵심 정보를 한 번에 수집합니다.',
    icon: Building2,
  },
  {
    title: '자동 비교 분석',
    description: '호실과 시나리오를 동일한 지표와 가정으로 비교합니다.',
    icon: LineChart,
  },
  {
    title: '리포트용 결과 생성',
    description: '매입/임차 의사결정에 바로 활용 가능한 분석 패키지를 생성합니다.',
    icon: FileText,
  },
  {
    title: '실행형 체크포인트',
    description: '진행 단계와 리스크를 명확한 체크포인트로 추적합니다.',
    icon: CircleCheckBig,
  },
];

export function LandingFeatures() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">PDCA 워크플로우</p>
          <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            한 화면에서 검색부터 의사결정까지
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {FEATURES.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-4 inline-flex rounded-xl bg-blue-600 p-2 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">{title}</h4>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

