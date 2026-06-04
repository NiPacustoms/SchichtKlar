import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://jobflow.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/anmelden', '/recht/'],
        disallow: [
          '/admin/',
          '/employee/',
          '/api/',
          '/debug/',
          '/debug-env/',
          '/debug-umgebung/',
          '/fix-admin-role/',
          '/customers/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
