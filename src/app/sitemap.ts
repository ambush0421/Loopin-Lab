import type { MetadataRoute } from 'next';

// Next.js 내장 Sitemap 자동 생성
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://building-report.pro';

    return [
        {
            url: baseUrl,
            lastModified: new Date('2026-02-20'),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date('2026-02-20'),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/guide`,
            lastModified: new Date('2026-02-20'),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
    ];
}
