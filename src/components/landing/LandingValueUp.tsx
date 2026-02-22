'use client';

import { ArrowUpRight, BarChart3, CircleCheckBig, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const VALUE_POINTS = [
  {
    title: '데이터 기반 매물 탐색',
    description: '상업용 부동산 시장의 발품/손품을 없앱니다. 클릭 한 번으로 숨겨진 우량 매물을 검증하세요.',
    icon: ArrowUpRight,
  },
  {
    title: '투명한 비용 스캐닝',
    description: '숨겨진 부대비용(보증금 이자, 관리비 인상률, 인테리어 상각 등)까지 포함된 실질 TOC(총소유비용)를 산출합니다.',
    icon: BarChart3,
  },
  {
    title: '리스크 사전 차단',
    description: '용도변경 가능성, 위반건축물 여부 등 기회비용을 갉아먹는 리스크를 사전에 파악합니다.',
    icon: ShieldCheck,
  },
  {
    title: '신속한 C-Level 보고',
    description: '엑셀 작업 없이, 3초 만에 생성되는 원페이저 PDF로 내부 품의서와 이사회 보고를 즉시 완료합니다.',
    icon: CircleCheckBig,
  },
];

export function LandingValueUp() {
  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">EXECUTIVE ROI</p>
          <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            시간과 자본의 낭비를 없애는<br />가장 강력한 부동산 분석 솔루션
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm md:text-base text-slate-600 font-medium">
            산만하게 흩어진 부동산 데이터를 하나의 정제된 재무 모델로 탈바꿈시켜, 불확실한 시장에서 기업의 최적 입지와 투자 수익을 찾아냅니다.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
          {VALUE_POINTS.map(({ title, description, icon: Icon }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:shadow-lg hover:-translate-y-1 hover:border-blue-200"
            >
              <div className="mb-3 inline-flex rounded-xl bg-blue-600/10 p-2 text-blue-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-700">{title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
