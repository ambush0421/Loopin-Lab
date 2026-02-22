'use client';

import { motion } from 'framer-motion';

const FAQ_ITEMS = [
  {
    q: '보고서의 추정치와 시뮬레이션 산출 기준은 어떻게 되나요?',
    a: '국토교통부 실거래가 오픈 API 및 건축물대장 데이터를 100% 실시간 연동하며, 입력하신 가정(시장 캡레이트, 대출 금리 등)을 바탕으로 현금흐름 및 NPV/IRR 모델을 즉각 구축하여 신뢰성 있는 결과를 제공합니다.',
  },
  {
    q: '엔터프라이즈 맞춤형 정교한 비교 시나리오 처리도 가능한가요?',
    a: '네, 보증금에 대한 기회비용(이자율), 각종 부대비용(인테리어 감가상각, 관리비 인상률), 렌트프리 적용 등 보수적인 기업 재무/회계 기준에 맞춘 세밀한 현황 비교(TOC, NOC)가 가능합니다.',
  },
  {
    q: '생성된 리포트를 내부 경영진 기안/품의서에 바로 첨부해도 되나요?',
    a: '물론입니다. C-Level 임원진이 가장 직관적으로 이해할 수 있는 KPI 대시보드(차트 및 주요 요약 지표) 형태로 구성된 프리미엄 원페이저 PDF를 즉시 다운로드하여 보고용으로 바로 사용할 수 있습니다.',
  },
];

export function LandingFAQ() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-4xl px-4">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center text-3xl font-extrabold tracking-tight text-slate-900"
        >
          자주 묻는 질문
        </motion.h3>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <motion.details
              key={item.q}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-white"
            >
              <summary className="cursor-pointer list-none font-semibold text-slate-900 group-hover:text-blue-700">
                {item.q}
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">{item.a}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}

