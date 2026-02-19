'use client';

const STEPS = [
  {
    title: '주소 검색',
    description: '대상 건물을 찾아 기본 지번 정보를 고정합니다.',
  },
  {
    title: '자동 통합 수집',
    description: '호실, 시세, 위치 신호를 하나의 데이터셋으로 통합합니다.',
  },
  {
    title: '의사결정 출력',
    description: '비교 지표를 검토하고 견적 흐름으로 바로 이동합니다.',
  },
];

export function LandingHowItWorks() {
  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h3 className="mb-8 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          이용 방법
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {index + 1}
              </p>
              <h4 className="text-lg font-bold text-slate-900">{step.title}</h4>
              <p className="mt-2 text-sm text-slate-600">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

