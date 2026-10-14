import { NextResponse } from 'next/server';
import { escapeXml } from '@/lib/sitemap-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://oraora.com.br';
  const nowIso = new Date().toISOString();

  const staticRoutes = [
    { url: `${baseUrl}`, priority: '1.0', changefreq: 'daily' },
    { url: `${baseUrl}/imoveis`, priority: '0.9', changefreq: 'daily' },
    { url: `${baseUrl}/sobre`, priority: '0.7', changefreq: 'monthly' },
    { url: `${baseUrl}/contato`, priority: '0.7', changefreq: 'monthly' },
    { url: `${baseUrl}/termos-de-uso`, priority: '0.5', changefreq: 'yearly' },
    { url: `${baseUrl}/politica-de-privacidade`, priority: '0.5', changefreq: 'yearly' },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const route of staticRoutes) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(route.url)}</loc>\n`;
    xml += `    <lastmod>${nowIso}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  xml += '</urlset>';

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
