'use client';

import { motion } from 'framer-motion';

interface LandingCTAProps {
  onStartClick: () => void;
}

export function LandingCTA({ onStartClick }: LandingCTAProps) {
  return (
    <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-20 text-white relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center relative z-10"
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">START NOW</p>
        <h3 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">압도적인 데이터로 최적의 딜(Deal)을 완성하세요.</h3>
        <p className="mt-4 max-w-2xl text-base text-slate-300 leading-relaxed font-medium">
          복잡한 엑셀은 끄셔도 좋습니다. 단 3초 만에 생성되는 CEO용 비교 리포트를 무료로 경험해 보세요.
        </p>
        <button
          type="button"
          onClick={onStartClick}
          className="mt-10 rounded-full bg-blue-600 px-10 py-4 text-sm font-bold text-white shadow-xl shadow-blue-900/40 transition-all hover:bg-blue-500 hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          무료로 타당성 분석 시작하기
        </button>
      </motion.div>
    </section>
  );
}

