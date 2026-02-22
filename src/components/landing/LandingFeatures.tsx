'use client';

import { Building2, CircleCheckBig, FileText, LineChart } from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    title: '원클릭 건축물대장 분석',
    description: '공공데이터와 실시간 연동되어 권리 분석 및 층별 등기부 리스크를 즉시 확인합니다.',
    icon: Building2,
  },
  {
    title: '임대 vs 매입 딥다이브',
    description: '동일 보증금/예산 대비 [임대 유지]와 [매입 후 사옥 사용] 시나리오의 5년 후 NPV를 비교합니다.',
    icon: LineChart,
  },
  {
    title: 'C-Level 보고용 대시보드',
    description: 'ROI, Cap Rate, NOC 등 경영진이 요구하는 핵심 재무 지표를 1페이지로 완벽히 요약합니다.',
    icon: FileText,
  },
  {
    title: '실거래가 기반 적정가 산출',
    description: '주변 상업용 부동산의 최근 매매/임대 실거래 데이터를 바탕으로 호가 거품을 걸러냅니다.',
    icon: CircleCheckBig,
  },
];

export function LandingFeatures() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">CORE COMPETITIVE EDGE</p>
          <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            주먹구구식 엑셀은 그만.<br />압도적인 데이터로 협상 우위를 점하세요.
          </h3>
        </motion.div>
        <div className="grid gap-4 md:grid-cols-2">
          {FEATURES.map(({ title, description, icon: Icon }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:bg-white"
            >
              <div className="mb-4 inline-flex rounded-xl bg-slate-800 p-2 text-white transition-transform group-hover:scale-110 group-hover:bg-slate-900 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-700">{title}</h4>
              <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">{description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

