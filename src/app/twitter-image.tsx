import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BuildingReportPro - AI 부동산 분석 리포트";
export const size = {
  width: 1200,
  height: 600,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "space-between",
          padding: "52px",
          background:
            "radial-gradient(circle at 0% 0%, rgba(186,230,253,0.35) 0%, rgba(15,23,42,0) 35%), linear-gradient(120deg, #1d4ed8 0%, #0f172a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: "#ffffff",
                color: "#1d4ed8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              B
            </div>
            BuildingReportPro
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                fontSize: 52,
                lineHeight: 1.12,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                maxWidth: 720,
              }}
            >
              공공데이터 + AI
              <br />
              부동산 분석 자동화
            </div>
            <div style={{ fontSize: 24, opacity: 0.92 }}>
              매입/임차 비교부터 보고서 공유까지
            </div>
          </div>
          <div style={{ fontSize: 22, opacity: 0.88 }}>building-report.pro</div>
        </div>

        <div
          style={{
            width: 320,
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.22)",
            background: "rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "28px",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 20, opacity: 0.88 }}>Core Features</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>Building Analytics</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>Decision Simulation</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>Shareable Reports</div>
        </div>
      </div>
    ),
    size,
  );
}
