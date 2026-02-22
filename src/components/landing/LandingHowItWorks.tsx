'use client';

import { motion } from 'framer-motion';

const STEPS = [
  {
    title: '타겟 빌딩 검색',
    description: '관심 건물의 주소를 1회 입력하여 건축물대장과 공시지가를 실시간 연동합니다.',
  },
  {
    title: '현금흐름 시뮬레이션',
    description: '임차/매입 시나리오를 적용하고 면적, 예상 임대료, 관리비를 기반으로 재무 모델을 구축합니다.',
  },
  {
    title: '원페이저 대시보드 출력',
    description: '산출된 핵심 지표(NOC, Cap Rate, ROI) 기반의 비교 보고서를 확인하고 즉각 의사결정을 내립니다.',
  },
];

export function LandingHowItWorks() {
  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h3 className="mb-8 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          분석 프로세스
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white transition-transform group-hover:scale-110 group-hover:bg-slate-900 shadow-sm">
                {index + 1}
              </div>
              <h4 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-700">{step.title}</h4>
              <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">{step.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

