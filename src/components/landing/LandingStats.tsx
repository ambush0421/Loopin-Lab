'use client';

import { motion } from 'framer-motion';

const STATS = [
  { label: '분석된 오피스 자산', value: '4,500+' },
  { label: '평균 의사결정 단축', value: '85%' },
  { label: '연간 절감된 임대료', value: '₩120억+' },
  { label: '도입 파트너사', value: '150+' },
];

export function LandingStats() {
  return (
    <section className="bg-slate-900 py-14 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-4 md:grid-cols-4">
          {STATS.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-xl border border-white/15 bg-white/5 p-5 transition-colors hover:bg-white/10"
            >
              <p className="text-3xl font-black tracking-tight">{item.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-300">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

