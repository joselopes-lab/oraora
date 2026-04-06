import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';

/**
 * @fileOverview Gerador dinâmico de sitemap.xml para SEO.
 * Lista páginas estáticas, imóveis globais, imóveis de corretores e sites de corretores.
 */

export async function GET() {
  const { firestore } = initializeFirebase();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://oraora.com.br';
  
  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // 1. Páginas Estáticas do Portal
  const staticPages = ['', '/imoveis', '/corretor', '/sobre', '/contato', '/ajuda'];
  staticPages.forEach(page => {
    sitemapXml += `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
  });

  try {
    // 2. Imóveis das Construtoras (Global)
    const qProps = query(
      collection(firestore, 'properties'), 
      where('isVisibleOnSite', '==', true)
    );
    const snapProps = await getDocs(qProps);
    snapProps.forEach(docSnap => {
      const data = docSnap.data();
      const slug = data.informacoesbasicas?.slug || docSnap.id;
      sitemapXml += `
  <url>
    <loc>${baseUrl}/imoveis/${slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // 3. Imóveis Avulsos dos Corretores
    const qBrokerProps = query(
      collection(firestore, 'brokerProperties'), 
      where('isVisibleOnSite', '==', true)
    );
    const snapBrokerProps = await getDocs(qBrokerProps);
    snapBrokerProps.forEach(docSnap => {
      const data = docSnap.data();
      const slug = data.informacoesbasicas?.slug || docSnap.id;
      sitemapXml += `
  <url>
    <loc>${baseUrl}/imoveis/${slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // 4. Sites Individuais de Corretores (/sites/[slug])
    const brokersRef = collection(firestore, 'brokers');
    const snapBrokers = await getDocs(brokersRef);
    snapBrokers.forEach(docSnap => {
      const data = docSnap.data();
      if (data.slug) {
        sitemapXml += `
  <url>
    <loc>${baseUrl}/sites/${data.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
      }
    });

  } catch (error) {
    console.error("Erro ao gerar sitemap dinâmico:", error);
    // Retorna o que foi gerado até o erro para não quebrar o arquivo XML
  }

  sitemapXml += '\n</urlset>';

  return new NextResponse(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}
