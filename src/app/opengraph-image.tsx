import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BuildingReportPro - AI 부동산 분석 리포트";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "linear-gradient(135deg, rgba(14,116,144,1) 0%, rgba(30,64,175,1) 50%, rgba(59,130,246,1) 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "#ffffff",
              color: "#1d4ed8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            B
          </div>
          BuildingReportPro
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 62,
              lineHeight: 1.1,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              maxWidth: 980,
            }}
          >
            AI로 빠르게 끝내는
            <br />
            부동산 의사결정 리포트
          </div>
          <div
            style={{
              fontSize: 28,
              opacity: 0.92,
              maxWidth: 980,
            }}
          >
            건축물 분석, 매입·임차 비교, 견적 리포트 공유를 한 번에
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            opacity: 0.9,
          }}
        >
          <span>building-report.pro</span>
          <span>KO Real Estate AI Workflow</span>
        </div>
      </div>
    ),
    size,
  );
}
