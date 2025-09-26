
import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Property } from '@/app/dashboard/properties/page';
import { type Builder } from '@/app/dashboard/builders/page';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://oraora.com.br';

  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/imoveis</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
  
  try {
    // 1. Get all visible builders
    const buildersQuery = query(collection(db, 'builders'), where('isVisibleOnSite', '==', true));
    const buildersSnapshot = await getDocs(buildersQuery);
    const visibleBuilderIds = buildersSnapshot.docs.map(doc => doc.id);

    if (visibleBuilderIds.length > 0) {
      // 2. Get all visible properties that belong to visible builders
      const propertiesQuery = query(
        collection(db, 'properties'),
        where('isVisibleOnSite', '==', true),
        where('builderId', 'in', visibleBuilderIds)
      );
      const querySnapshot = await getDocs(propertiesQuery);

      querySnapshot.forEach((doc) => {
        const property = doc.data() as Property;
        if (property.slug) {
          sitemapXml += `
  <url>
    <loc>${baseUrl}/imoveis/${property.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        }
      });
    }

  } catch (error) {
    console.error("Error generating sitemap:", error);
  }

  sitemapXml += '</urlset>';

  return new NextResponse(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
