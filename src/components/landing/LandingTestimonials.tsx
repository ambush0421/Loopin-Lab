'use client';

import { Building2, TrendingUp, Handshake, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const useCases = [
  {
    icon: TrendingUp,
    role: '기업 이전 담당 TF (대기업)',
    quote: '"사옥 매입 vs 임차, 수십 개의 매물을 엑셀 없이 단숨에 비교할 수 있어 TF 팀의 야근이 사라졌습니다."',
    detail: '복잡한 재무 시나리오(렌트프리, 기회비용 등)를 직관적으로 비교하여 이사회 보고용으로 즉시 활용',
    bg: 'bg-blue-50',
    accent: 'text-blue-600',
    border: 'border-blue-200',
  },
  {
    icon: Building2,
    role: '자산운용사 (AM / 실무운용역)',
    quote: '"펀드에 편입할 타겟 자산의 예상 현금흐름과 기대수익률(Cap Rate)을 3초 만에 시뮬레이션 할 수 있습니다."',
    detail: '기초자산의 실거래가 검증 및 층별 등기부 리스크 파악으로 딜 스크리닝 속도 향상',
    bg: 'bg-slate-50',
    accent: 'text-slate-800',
    border: 'border-slate-200',
  },
  {
    icon: Handshake,
    role: '엔터프라이즈 전문 상업용 중개법인',
    quote: '"고객사 경영진에게 제출할 프리미엄 분석 리포트를 클릭 한 번으로 생성하여, 딜 성사율이 2배 이상 높아졌습니다."',
    detail: '고객맞춤형 투자의향서(LOI) 및 입주제안서 작성 시간을 획기적으로 단축',
    bg: 'bg-indigo-50',
    accent: 'text-indigo-600',
    border: 'border-indigo-200',
  },
  {
    icon: ClipboardCheck,
    role: '부동산 디벨로퍼 (시행/개발)',
    quote: '"부지 매입 전, 입지 분석부터 예상 임대수익 시뮬레이션까지 초기 타당성 검토에 최적화된 툴입니다."',
    detail: '가설 기반의 개발 후 매각(Exit) 시나리오 검증 및 개발 마진(Yield on Cost) 추정',
    bg: 'bg-cyan-50',
    accent: 'text-cyan-600',
    border: 'border-cyan-200',
  },
];

export function LandingTestimonials() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold mb-3 tracking-wide">
            이용 후기 및 활용 사례
          </span>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">수많은 상업용 부동산 리더들이 선택했습니다</h3>
          <p className="text-slate-500 mt-2 font-medium">단순 조회를 넘어, 수십 억에서 수천 억 규모의 딜(Deal)을 분석하고 리드합니다.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {useCases.map((u, index) => {
            const Icon = u.icon;
            return (
              <motion.div
                key={u.role}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`${u.bg} border ${u.border} rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm transition-transform hover:scale-110">
                    <Icon className={`w-6 h-6 ${u.accent}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-lg ${u.accent} mb-2`}>{u.role}</h4>
                    <p className="text-gray-700 text-sm italic mb-2 leading-relaxed">{u.quote}</p>
                    <p className="text-xs text-gray-500">{u.detail}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
