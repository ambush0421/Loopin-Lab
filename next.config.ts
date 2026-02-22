import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // SEO / 보안 헤더
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 클릭재킹 방지
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // MIME 스니핑 방지
          { key: "X-Content-Type-Options", value: "nosniff" },
          // 레퍼러 제어 (검색 유입 측정용)
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // XSS 보호
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
      // 정적 파일 캐싱 (SEO 크롤러가 자주 읽는 파일)
      {
        source: "/robots.txt",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        source: "/llms.txt",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
