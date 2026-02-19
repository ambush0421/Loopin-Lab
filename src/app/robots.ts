import type { MetadataRoute } from "next";

const siteUrl = "https://building-report.pro";
const privateRoutes = [
  "/dashboard",
  "/dashboard/*",
  "/report",
  "/report/*",
  "/share",
  "/share/*",
  "/api/*",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privateRoutes,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: privateRoutes,
      },
      {
        userAgent: "Yeti",
        allow: "/",
        disallow: privateRoutes,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: "building-report.pro",
  };
}
