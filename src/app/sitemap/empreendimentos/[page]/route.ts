import { NextResponse } from 'next/server';
import {
  escapeXml,
  extractDate,
  getProjectsPageDocs,
  getProjectsSegmentInfo,
} from '@/lib/sitemap-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  const { page } = await params;
  const pageStr = (page || '1').replace(/\.xml$/, '');
  const pageNum = parseInt(pageStr, 10);

  if (isNaN(pageNum) || pageNum < 1) {
    return new NextResponse('Segmento inválido', { status: 404 });
  }

  const { totalPages } = await getProjectsSegmentInfo();
  if (pageNum > totalPages && totalPages > 0) {
    return new NextResponse('Segmento não encontrado', { status: 404 });
  }

  const docs = await getProjectsPageDocs(pageNum);
  if (docs.length === 0 && pageNum > 1) {
    return new NextResponse('Segmento vazio', { status: 404 });
  }

  const baseUrl = 'https://oraora.com.br';
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const docSnap of docs) {
    const data = docSnap.data();
    const url = `${baseUrl}/empreendimento/${docSnap.id}`;
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(url)}</loc>\n`;
    xml += `    <lastmod>${extractDate(data).toISOString()}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  }

  xml += '</urlset>';

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
