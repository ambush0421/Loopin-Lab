'use client';

const FAQ_ITEMS = [
  {
    q: '리포트에는 어떤 데이터를 사용하나요?',
    a: '공공 건축물대장 데이터, 호실 데이터, 그리고 거래 컨텍스트를 함께 결합해 분석합니다.',
  },
  {
    q: '매입·임차 의사결정 모두에 사용할 수 있나요?',
    a: '네. 대시보드에서 여러 시나리오를 비교하고 예상 결과를 나란히 확인할 수 있습니다.',
  },
  {
    q: '견적은 별도 툴이 필요한가요?',
    a: '아니요. 호실을 선택한 뒤 같은 화면에서 바로 견적 흐름을 열 수 있습니다.',
  },
];

export function LandingFAQ() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-4xl px-4">
        <h3 className="mb-8 text-center text-3xl font-extrabold tracking-tight text-slate-900">자주 묻는 질문</h3>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer list-none font-semibold text-slate-900">{item.q}</summary>
              <p className="mt-2 text-sm text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

