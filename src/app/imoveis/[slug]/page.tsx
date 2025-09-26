
import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Property } from '@/app/dashboard/properties/page';
import PublicLayout from '@/components/public-layout';
import PropertyPageClient from './property-page-client';
import type { Metadata } from 'next';

interface PropertyPageProps {
  params: { slug: string };
}

async function getPropertyData(slug: string): Promise<Property | null> {
    const q = query(collection(db, 'properties'), where('slug', '==', slug), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    
    const docSnap = querySnapshot.docs[0];
    const propData = { id: docSnap.id, ...docSnap.data() } as Property;
    
    // Check if property itself is visible
    if (!propData.isVisibleOnSite) {
        return null;
    }

    // If there's no builderId, it's a legacy property, consider it visible.
    if (!propData.builderId) {
        return propData;
    }

    // Check if the associated builder is also visible
    const builderDoc = await getDoc(doc(db, 'builders', propData.builderId));
    if (builderDoc.exists() && builderDoc.data().isVisibleOnSite) {
        return propData;
    }
    
    // If builder is not visible, treat the property as not found on the public site
    return null;
}

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const property = await getPropertyData(params.slug);

  if (!property) {
    return {
      title: 'Imóvel não encontrado',
      robots: {
        index: false,
        follow: false,
      }
    };
  }
  
  const title = property.seoTitle || property.informacoesbasicas.nome;
  const description = property.seoDescription || property.informacoesbasicas.descricao;
  const keywords = property.seoKeywords || `comprar imóvel, ${property.informacoesbasicas.nome}, ${property.localizacao.cidade}`;
  const imageUrl = property.midia && property.midia.length > 0 ? property.midia[0] : undefined;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
  };
}


export default async function PublicPropertyPage({ params }: PropertyPageProps) {
    const property = await getPropertyData(params.slug);

    if (!property) {
        notFound();
    }

    let relatedProperties: Property[] = [];
    try {
        if (property.localizacao.cidade) {
            const relatedQuery = query(
              collection(db, 'properties'),
              where('localizacao.cidade', '==', property.localizacao.cidade),
              where('isVisibleOnSite', '==', true),
              limit(5) // Fetch 5, one might be the current one
            );

            const relatedSnapshot = await getDocs(relatedQuery);
            // Filter out the current property from the results
            relatedProperties = relatedSnapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as Property))
              .filter(p => p.slug !== property.slug)
              .slice(0, 4); // And then take the first 4
        }
    } catch (error) {
        console.error("Error fetching related properties on server:", error);
    }
    
    // Convert complex objects to plain objects for client components
    const plainProperty = JSON.parse(JSON.stringify(property));
    const plainRelatedProperties = JSON.parse(JSON.stringify(relatedProperties));

    return (
        <PublicLayout>
            <Suspense fallback={<div>Carregando...</div>}>
                <PropertyPageClient property={plainProperty} relatedProperties={plainRelatedProperties} />
            </Suspense>
        </PublicLayout>
    )
}
