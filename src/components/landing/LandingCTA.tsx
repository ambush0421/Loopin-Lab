'use client';

interface LandingCTAProps {
  onStartClick: () => void;
}

export function LandingCTA({ onStartClick }: LandingCTAProps) {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-cyan-600 py-16 text-white">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">지금 시작</p>
        <h3 className="mt-3 text-3xl font-extrabold tracking-tight">건물 분석을 바로 시작할까요?</h3>
        <p className="mt-3 max-w-2xl text-sm text-blue-100">
          주소를 검색하고 대시보드를 검토한 뒤 바로 견적로 이동하세요.
        </p>
        <button
          type="button"
          onClick={onStartClick}
          className="mt-8 rounded-full bg-white px-8 py-3 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50"
        >
          건물 분석 시작
        </button>
      </div>
    </section>
  );
}

