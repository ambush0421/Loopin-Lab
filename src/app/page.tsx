import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

const siteUrl = "https://building-report.pro";
const homeTitle = "BuildingReportPro - AI 부동산 분석 리포트";
const homeDescription =
  "주소 검색부터 건축물 분석, 매입·임차 비교, 공유 리포트 생성까지 한 번에 수행하는 AI 기반 부동산 의사결정 플랫폼.";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: siteUrl,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: homeTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    images: ["/twitter-image"],
  },
  keywords: [
    "건축물 분석",
    "부동산 투자 분석",
    "임차 매물 비교",
    "부동산 보고서 자동화",
    "AI 부동산",
  ],
};

export default function HomePage() {
  return <HomePageClient />;
}
