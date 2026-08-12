import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { generateSemanticSlug } from '@/lib/slug';

export const dynamic = 'force-dynamic';

/**
 * Helper to safely extract date from Firestore timestamps or dates.
 */
function extractDate(data: any): Date {
  const ts = data.updatedAt || data.seo?.lastModifiedAt || data.createdAt;
  if (!ts) return new Date();
  if (typeof ts.toDate === 'function') {
    try {
      return ts.toDate();
    } catch {
      // fallback
    }
  }
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string' || typeof ts === 'number') {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

/**
 * @fileOverview Gerador oficial de sitemap do Next.js 15.
 * Suporta multi-tenancy detectando o host e gerando as rotas dinâmicas do corretor ou do portal.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get('host') || 'oraora.com.br';
  const baseUrl = `https://${host}`;

  // 1. Rotas Estáticas Comuns
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/imoveis`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contato`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];

  const seenUrls = new Set<string>();
  staticRoutes.forEach(r => seenUrls.add(r.url));

  const sitemapEntries: MetadataRoute.Sitemap = [...staticRoutes];

  try {
    const { adminDb } = await import('@/firebase/index.server');
    const { FieldPath } = await import('firebase-admin/firestore');

    const isMainPortal = host === 'oraora.com.br' || host.includes('web.app') || host.includes('localhost') || host.includes('hosted.app');
    
    if (isMainPortal) {
      // SITEMAP DO PORTAL (Global)
      const propsSnap = await adminDb.collection('properties')
        .where('isVisibleOnSite', '==', true)
        .limit(1000)
        .get();

      for (const docSnap of propsSnap.docs) {
        const data = docSnap.data();
        const propObj = { id: docSnap.id, ...data };
        const url = `${baseUrl}/imoveis/${generateSemanticSlug(propObj)}`;
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          sitemapEntries.push({
            url,
            lastModified: extractDate(data),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      }
    } else {
      // SITEMAP DO CORRETOR (Tenant)
      const slug = host.split('.')[0];
      let brokerId: string | null = null;
      
      const domainSnap = await adminDb.collection('domains').doc(host).get();
      if (domainSnap.exists) {
        brokerId = domainSnap.data()?.brokerId;
      } else {
        const brokerSnap = await adminDb.collection('brokers').where('slug', '==', slug).limit(1).get();
        if (!brokerSnap.empty) brokerId = brokerSnap.docs[0].id;
      }

      if (brokerId) {
        // 1. Broker Properties
        const brokerPropsSnap = await adminDb.collection('brokerProperties')
          .where('brokerId', '==', brokerId)
          .where('isVisibleOnSite', '==', true)
          .get();

        for (const docSnap of brokerPropsSnap.docs) {
          const data = docSnap.data();
          const propObj = { id: docSnap.id, ...data };
          const url = `${baseUrl}/imovel/${generateSemanticSlug(propObj)}`;
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            sitemapEntries.push({
              url,
              lastModified: extractDate(data),
              changeFrequency: 'weekly',
              priority: 0.9,
            });
          }
        }

        // 2. Portfolio Properties
        const portfolioSnap = await adminDb.collection('portfolios').doc(brokerId).get();
        if (portfolioSnap.exists) {
          const propertyIds: string[] = portfolioSnap.data()?.propertyIds || [];
          if (Array.isArray(propertyIds) && propertyIds.length > 0) {
            const propertiesRef = adminDb.collection('properties');
            for (let i = 0; i < propertyIds.length; i += 30) {
              const batch = propertyIds.slice(i, i + 30);
              if (batch && batch.length > 0) {
                const snap = await propertiesRef.where(FieldPath.documentId(), 'in', batch).get();
                snap.forEach(docSnap => {
                  const data = docSnap.data();
                  if (data.isVisibleOnSite !== false) {
                    const propObj = { id: docSnap.id, ...data };
                    const url = `${baseUrl}/imovel/${generateSemanticSlug(propObj)}`;
                    if (!seenUrls.has(url)) {
                      seenUrls.add(url);
                      sitemapEntries.push({
                        url,
                        lastModified: extractDate(data),
                        changeFrequency: 'weekly',
                        priority: 0.8,
                      });
                    }
                  }
                });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Sitemap generation error:", error);
  }

  return sitemapEntries;
}

