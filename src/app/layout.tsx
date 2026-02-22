import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CompareCartBar } from "@/components/financial/CompareCartBar";
import "./globals.css";

// =====================================
// 사이트 전역 메타데이터 (SEO / GEO 최적화)
// =====================================
const BASE_URL = "https://building-report.pro";
const SITE_NAME = "빌딩 리포트 프로";
const TITLE_FULL = "빌딩 리포트 프로 — 건축물대장 분석 · 수익률 자동계산 · 견적서 생성";
const DESCRIPTION =
  "주소 입력 한 번으로 건축물대장 분석, 호실별 면적 계산, 임대 수익률 자동산출, 매입·임차 견적서를 즉시 생성합니다. 공공데이터 기반 무료 부동산 분석 서비스.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: TITLE_FULL,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "건축물대장",
    "건물분석",
    "부동산수익률",
    "임대수익률계산",
    "매입견적",
    "임차견적",
    "상가분석",
    "사무실분석",
    "호실면적",
    "공공데이터부동산",
    "BEP분석",
    "부동산레버리지",
  ],
  authors: [{ name: SITE_NAME, url: BASE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  // Open Graph — 카카오 공유, 페이스북, 링크드인
  openGraph: {
    title: TITLE_FULL,
    description: DESCRIPTION,
    url: BASE_URL,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "빌딩 리포트 프로 — 건축물대장 분석 서비스",
      },
    ],
  },
  // Twitter / X
  twitter: {
    card: "summary_large_image",
    title: TITLE_FULL,
    description: DESCRIPTION,
    images: [`${BASE_URL}/og-image.png`],
  },
  // 검색엔진 크롤링 허용
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // 기타 SEO
  alternates: {
    canonical: BASE_URL,
    languages: {
      "ko-KR": BASE_URL,
    },
  },
};

// =====================================
// JSON-LD 구조화 데이터 (GEO 최적화)
// =====================================
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: SITE_NAME,
      description: DESCRIPTION,
      inLanguage: "ko-KR",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${BASE_URL}/#webapp`,
      name: SITE_NAME,
      url: BASE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web Browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "KRW",
      },
      description: DESCRIPTION,
      featureList: [
        "건축물대장 자동 조회",
        "호실별 면적 계산 (전용·공용·계약면적)",
        "임대 수익률 자동산출",
        "BEP(회수기간) 분석",
        "대출 레버리지 시뮬레이션",
        "매입·임차 통합 견적서 생성",
        "실거래가 비교",
        "카카오맵 위치 시각화",
      ],
      inLanguage: "ko-KR",
    },
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: SITE_NAME,
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/og-image.png`,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="canonical" href={BASE_URL} />
        <meta name="theme-color" content="#2563eb" />
        <meta name="geo.region" content="KR" />
        <meta name="geo.placename" content="Korea" />
        {/* JSON-LD 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Pretendard 폰트 */}
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css" />
      </head>
      <body className="antialiased min-h-screen flex flex-col font-pretendard">
        <TooltipProvider>
          <main className="flex-1">{children}</main>
          <Footer />
          <CompareCartBar />
        </TooltipProvider>
      </body>
    </html>
  );
}
