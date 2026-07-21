import { MetadataRoute } from 'next';
import { adminDb } from '@/firebase/index.server';
import { headers } from 'next/headers';

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

  try {
    const isMainPortal = host === 'oraora.com.br' || host.includes('web.app') || host.includes('localhost') || host.includes('hosted.app');
    
    if (isMainPortal) {
      // SITEMAP DO PORTAL (Global)
      const propsSnap = await adminDb.collection('properties')
        .where('isVisibleOnSite', '==', true)
        .limit(500)
        .get();

      const globalProps = propsSnap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          url: `${baseUrl}/imoveis/${data.informacoesbasicas?.slug || docSnap.id}`,
          lastModified: data.updatedAt?.toDate() || new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        };
      });

      return [...staticRoutes, ...globalProps];
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
        const brokerPropsSnap = await adminDb.collection('brokerProperties')
          .where('brokerId', '==', brokerId)
          .where('isVisibleOnSite', '==', true)
          .get();

        const tenantProps = brokerPropsSnap.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            url: `${baseUrl}/imovel/${data.informacoesbasicas?.slug || docSnap.id}`,
            lastModified: data.updatedAt?.toDate() || new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.9,
          };
        });

        return [...staticRoutes, ...tenantProps];
      }
    }
  } catch (error) {
    console.error("Sitemap generation error:", error);
  }

  return staticRoutes;
}
