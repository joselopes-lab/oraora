import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { adminDb } from '@/firebase/index.server';
import { FieldPath } from 'firebase-admin/firestore';
import { generateSemanticSlug } from '@/lib/slug';
import {
  escapeXml,
  extractDate,
  getPropertiesSegmentInfo,
  getProjectsSegmentInfo,
} from '@/lib/sitemap-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const headersList = await headers();
  const host = (headersList.get('x-forwarded-host') || headersList.get('host') || 'oraora.com.br').toLowerCase();
  const baseUrl = `https://${host}`;

  const isMainPortal =
    host === 'oraora.com.br' ||
    host === 'www.oraora.com.br' ||
    host.includes('web.app') ||
    host.includes('localhost') ||
    host.includes('hosted.app') ||
    host.includes('run.app');

  if (isMainPortal) {
    // ==========================================
    // PORTAL PRINCIPAL: SITEMAP INDEX OFICIAL
    // ==========================================
    const propertiesInfo = await getPropertiesSegmentInfo();
    const projectsInfo = await getProjectsSegmentInfo();
    const nowIso = new Date().toISOString();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // 1. Sitemap Institucional
    xml += '  <sitemap>\n';
    xml += `    <loc>${escapeXml(`${baseUrl}/sitemap/institucional.xml`)}</loc>\n`;
    xml += `    <lastmod>${nowIso}</lastmod>\n`;
    xml += '  </sitemap>\n';

    // 2. Sitemaps de Imóveis (segmentos dinâmicos baseados no total real)
    for (let page = 1; page <= propertiesInfo.totalPages; page++) {
      xml += '  <sitemap>\n';
      xml += `    <loc>${escapeXml(`${baseUrl}/sitemap/imoveis/${page}.xml`)}</loc>\n`;
      xml += `    <lastmod>${nowIso}</lastmod>\n`;
      xml += '  </sitemap>\n';
    }

    // 3. Sitemaps de Empreendimentos (segmentos dinâmicos)
    for (let page = 1; page <= projectsInfo.totalPages; page++) {
      xml += '  <sitemap>\n';
      xml += `    <loc>${escapeXml(`${baseUrl}/sitemap/empreendimentos/${page}.xml`)}</loc>\n`;
      xml += `    <lastmod>${nowIso}</lastmod>\n`;
      xml += '  </sitemap>\n';
    }

    xml += '</sitemapindex>';

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }

  // ==========================================
  // SITES DOS CORRETORES (MULTI-TENANT URLSET)
  // ==========================================
  const seenUrls = new Set<string>();
  const staticRoutes = [
    { url: `${baseUrl}`, priority: '1.0', changefreq: 'daily' },
    { url: `${baseUrl}/imoveis`, priority: '0.9', changefreq: 'daily' },
    { url: `${baseUrl}/sobre`, priority: '0.7', changefreq: 'monthly' },
    { url: `${baseUrl}/contato`, priority: '0.7', changefreq: 'monthly' },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const r of staticRoutes) {
    seenUrls.add(r.url);
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(r.url)}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += `    <changefreq>${r.changefreq}</changefreq>\n`;
    xml += `    <priority>${r.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  try {
    const slug = host.split('.')[0];
    let brokerId: string | null = null;

    // Resolução de Domínio Personalizado
    const cleanHost = host.trim();
    const normalizedDomain = cleanHost.replace(/^www\./, '');
    let domainSnap = await adminDb.collection('domains').doc(normalizedDomain).get();
    if (!domainSnap.exists && cleanHost !== normalizedDomain) {
      domainSnap = await adminDb.collection('domains').doc(cleanHost).get();
    }

    if (domainSnap.exists) {
      brokerId = domainSnap.data()?.brokerId || null;
    } else {
      // Resolução por subdomínio ou slug
      const brokerSnap = await adminDb.collection('brokers').where('slug', '==', slug).limit(1).get();
      if (!brokerSnap.empty) {
        brokerId = brokerSnap.docs[0].id;
      } else {
        const brokerDocSnap = await adminDb.collection('brokers').doc(slug).get();
        if (brokerDocSnap.exists) {
          brokerId = brokerDocSnap.id;
        }
      }
    }

    if (brokerId) {
      // 1. Imóveis avulsos do corretor (brokerProperties)
      const brokerPropsSnap = await adminDb
        .collection('brokerProperties')
        .where('brokerId', '==', brokerId)
        .where('isVisibleOnSite', '==', true)
        .get();

      for (const docSnap of brokerPropsSnap.docs) {
        const data = docSnap.data();
        const propObj = { id: docSnap.id, ...data };
        const url = `${baseUrl}/imoveis/${generateSemanticSlug(propObj)}`;
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          xml += '  <url>\n';
          xml += `    <loc>${escapeXml(url)}</loc>\n`;
          xml += `    <lastmod>${extractDate(data).toISOString()}</lastmod>\n`;
          xml += '    <changefreq>weekly</changefreq>\n';
          xml += '    <priority>0.9</priority>\n';
          xml += '  </url>\n';
        }
      }

      // 2. Imóveis de construtoras vinculados à carteira do corretor (portfolios)
      const portfolioSnap = await adminDb.collection('portfolios').doc(brokerId).get();
      if (portfolioSnap.exists) {
        const propertyIds: string[] = portfolioSnap.data()?.propertyIds || [];
        if (Array.isArray(propertyIds) && propertyIds.length > 0) {
          const propertiesRef = adminDb.collection('properties');
          for (let i = 0; i < propertyIds.length; i += 30) {
            const batch = propertyIds.slice(i, i + 30);
            if (batch && batch.length > 0) {
              const snap = await propertiesRef.where(FieldPath.documentId(), 'in', batch).get();
              snap.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.isVisibleOnSite !== false) {
                  const propObj = { id: docSnap.id, ...data };
                  const url = `${baseUrl}/imoveis/${generateSemanticSlug(propObj)}`;
                  if (!seenUrls.has(url)) {
                    seenUrls.add(url);
                    xml += '  <url>\n';
                    xml += `    <loc>${escapeXml(url)}</loc>\n`;
                    xml += `    <lastmod>${extractDate(data).toISOString()}</lastmod>\n`;
                    xml += '    <changefreq>weekly</changefreq>\n';
                    xml += '    <priority>0.8</priority>\n';
                    xml += '  </url>\n';
                  }
                }
              });
            }
          }
        }
      }
      // 3. Imóveis selecionados e publicados pelo corretor (brokerSelectedProperties)
      const selSnap = await adminDb.collection('brokerSelectedProperties')
        .where('brokerId', '==', brokerId)
        .where('publishedOnSite', '==', true)
        .get();

      const selPropertyIds = selSnap.docs.map(doc => doc.data().propertyId).filter(Boolean);
      if (selPropertyIds.length > 0) {
        const propertiesRef = adminDb.collection('properties');
        for (let i = 0; i < selPropertyIds.length; i += 30) {
          const batch = selPropertyIds.slice(i, i + 30);
          if (batch && batch.length > 0) {
            const snap = await propertiesRef.where(FieldPath.documentId(), 'in', batch).get();
            snap.forEach((docSnap) => {
              const data = docSnap.data();
              if (data.isVisibleOnSite !== false) {
                const propObj = { id: docSnap.id, ...data };
                const url = `${baseUrl}/imoveis/${generateSemanticSlug(propObj)}`;
                if (!seenUrls.has(url)) {
                  seenUrls.add(url);
                  xml += '  <url>\n';
                  xml += `    <loc>${escapeXml(url)}</loc>\n`;
                  xml += `    <lastmod>${extractDate(data).toISOString()}</lastmod>\n`;
                  xml += '    <changefreq>weekly</changefreq>\n';
                  xml += '    <priority>0.8</priority>\n';
                  xml += '  </url>\n';
                }
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Erro ao gerar sitemap do corretor:', error);
  }

  xml += '</urlset>';

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
