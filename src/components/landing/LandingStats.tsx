'use client';

const STATS = [
  { label: '시나리오 점검', value: '1,200+' },
  { label: '평균 분석 시간', value: '3분' },
  { label: '절감된 수작업', value: '70%' },
  { label: '재사용 팀', value: '100+' },
];

export function LandingStats() {
  return (
    <section className="bg-slate-900 py-14 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-4 md:grid-cols-4">
          {STATS.map((item) => (
            <div key={item.label} className="rounded-xl border border-white/15 bg-white/5 p-5">
              <p className="text-3xl font-black tracking-tight">{item.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-300">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

