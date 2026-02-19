'use client';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | number;
}

const STEPS = [
  { id: 1, label: '검색' },
  { id: 2, label: '분석' },
  { id: 3, label: '견적' },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <section className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 px-4 py-4">
        {STEPS.map((step, index) => {
          const isActive = currentStep >= step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={[
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600',
                  ].join(' ')}
                >
                  {step.id}
                </div>
                <span
                  className={[
                    'text-xs font-semibold uppercase tracking-wide',
                    isCurrent ? 'text-blue-700' : 'text-slate-500',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && <div className="h-px w-8 bg-slate-300" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

