
import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Property } from '@/app/dashboard/properties/page';

export async function GET() {
  const baseUrl = 'https://oraora.com.br';

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
      // 2. Divide os IDs em chunks de 30 (limite do Firestore para 'in')
      const chunkSize = 30;
      const chunks = [];
      
      for (let i = 0; i < visibleBuilderIds.length; i += chunkSize) {
        chunks.push(visibleBuilderIds.slice(i, i + chunkSize));
      }
      
      console.log(`Processing ${chunks.length} chunks for ${visibleBuilderIds.length} builders`);
      
      // 3. Processa cada chunk com controle de rate limiting
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          const propertiesQuery = query(
            collection(db, 'properties'),
            where('isVisibleOnSite', '==', true),
            where('builderId', 'in', chunk)
          );
          
          const querySnapshot = await getDocs(propertiesQuery);
          
          console.log(`Chunk ${i + 1}/${chunks.length}: Found ${querySnapshot.size} properties`);
          
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
          
          // 4. Pequeno delay entre chunks para evitar throttling (opcional)
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (chunkError) {
          console.error(`Error processing chunk ${i + 1}:`, chunkError);
          // Continua processando os outros chunks mesmo se um falhar
        }
      }
      
      console.log(`Sitemap generation completed for ${visibleBuilderIds.length} builders`);
    } else {
      console.log('No visible builders found');
    }
    
  } catch (error) {
    console.error("Error generating sitemap:", error);
    throw error; // Re-throw para que a função chamadora saiba que houve erro
  }
  
  sitemapXml += '</urlset>';

  return new NextResponse(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}