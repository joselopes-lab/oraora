
import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

/**
 * @fileOverview Gerador dinâmico de robots.txt baseado no hostname.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('host') || 'oraora.com.br';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/login/', '/radar/dashboard/'],
      },
    ],
    sitemap: `https://${host}/sitemap.xml`,
  };
}
