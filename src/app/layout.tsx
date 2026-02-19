import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const siteUrl = "https://building-report.pro";
const siteName = "BuildingReportPro";
const defaultTitle = "BuildingReportPro - AI 부동산 분석 리포트";
const defaultDescription =
  "공공데이터와 AI 기반으로 건축물 분석, 매입/임차 비교, 리포트 공유까지 빠르게 수행하는 부동산 의사결정 플랫폼.";

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const naverVerification = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/favicon.ico`,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  inLanguage: "ko-KR",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    "건축물 분석",
    "부동산 투자",
    "부동산 리포트",
    "매입 의사결정",
    "임차 의사결정",
    "AI 부동산 분석",
  ],
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    url: siteUrl,
    siteName,
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "BuildingReportPro - AI 부동산 분석 리포트",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(naverVerification
      ? { other: { "naver-site-verification": naverVerification } }
      : {}),
  },
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <TooltipProvider>
          <main className="flex-1">{children}</main>
          <Footer />
        </TooltipProvider>
      </body>
    </html>
  );
}
