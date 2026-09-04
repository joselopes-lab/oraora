import { adminDb } from '@/firebase/index.server';
import { notFound } from 'next/navigation';
import { getThemePage } from '@/layouts/registry';
import type { Metadata } from 'next';
import { getBrokerData, getPropertyData, serializeForClient } from '../../../utils.server';
import { FieldValue, FieldPath } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { getCanonicalUrl, getRobotsRules, generatePropertyJsonLd, generateBrokerJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { PropertyViewTracker } from '@/components/privacy/PropertyViewTracker';

export const dynamic = 'force-dynamic';

type Property = {
  id: string;
  builderId?: string;
  brokerId?: string;
  isVisibleOnSite?: boolean;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    descricao?: string;
    slug?: string;
    condominio?: number;
    iptu?: number;
  };
  localizacao: {
    address?: string;
    bairro: string;
    cidade: string;
    state: string;
    latitude?: number;
    longitude?: number;
    googleMapsLink?: string;
    googleStreetViewLink?: string;
  };
  midia: string[];
  caracteristicasimovel: {
    tipo: string;
    quartos?: string[] | string;
    suites?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
  areascomuns?: string[];
  seo?: any;
  physicalPropertyId?: string;
  knowledgeMetadata?: {
    source?: 'system_config' | 'user_input' | 'market_report' | 'official_api';
    updatedAt?: string;
    reliability?: 'high' | 'medium' | 'low';
  };
};

async function verifyAndGetPropertyForBroker(brokerId: string, propertyIdentifier: string) {
  const property = await getPropertyData(propertyIdentifier) as any;
  if (!property || property.isVisibleOnSite === false) {
    return null;
  }

  const propertyId = property.id;

  // 1. Check brokerProperties
  const bpDoc = await adminDb.collection('brokerProperties').doc(propertyId).get();
  if (bpDoc.exists && bpDoc.data()?.brokerId === brokerId && bpDoc.data()?.isVisibleOnSite !== false) {
    return property;
  }

  // 2. Check portfolio
  const portfolioSnap = await adminDb.collection('portfolios').doc(brokerId).get();
  if (portfolioSnap.exists) {
    const pIds = portfolioSnap.data()?.propertyIds || [];
    if (pIds.includes(propertyId)) {
      return property;
    }
  }

  // 3. Check brokerSelectedProperties (avulsos with publishedOnSite == true)
  const selSnap = await adminDb.collection('brokerSelectedProperties')
    .where('brokerId', '==', brokerId)
    .where('propertyId', '==', propertyId)
    .where('publishedOnSite', '==', true)
    .limit(1)
    .get();
  
  if (!selSnap.empty) {
    delete property.builderId;
    delete property.tenantId;
    delete property.constructorId;
    delete property.ownerId;
    return property;
  }

  return null;
}

async function getPortfolioProperties(brokerId: string): Promise<Property[]> {
  const portfolioRef = adminDb.collection('portfolios').doc(brokerId);
  const portfolioSnap = await portfolioRef.get();
  if (!portfolioSnap.exists) return [];
  const propertyIds: string[] = portfolioSnap.data()?.propertyIds || [];
  if (!Array.isArray(propertyIds) || propertyIds.length === 0) return [];
  
  const propertiesData: Property[] = [];
  const propertiesRef = adminDb.collection('properties');
  for (let i = 0; i < propertyIds.length; i += 30) {
    const batch = propertyIds.slice(i, i + 30);
    if (batch && batch.length > 0) {
      const snap = await propertiesRef.where(FieldPath.documentId(), 'in', batch).get();
      snap.forEach(docSnap => {
        const data = docSnap.data() as any;
        if (data.isVisibleOnSite !== false) {
          propertiesData.push({ id: docSnap.id, ...data });
        }
      });
    }
  }
  return propertiesData;
}

async function getBrokerProperties(brokerId: string): Promise<Property[]> {
  const snap = await adminDb.collection('brokerProperties')
    .where('brokerId', '==', brokerId)
    .where('isVisibleOnSite', '==', true)
    .get();
  return snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as any));
}

async function getPublishedAvulsoProperties(brokerId: string): Promise<Property[]> {
  const selSnap = await adminDb.collection('brokerSelectedProperties')
    .where('brokerId', '==', brokerId)
    .where('publishedOnSite', '==', true)
    .get();
  const propertyIds = selSnap.docs.map(doc => doc.data().propertyId).filter(Boolean);
  if (propertyIds.length === 0) return [];

  const propertiesData: Property[] = [];
  const propertiesRef = adminDb.collection('properties');
  for (let i = 0; i < propertyIds.length; i += 30) {
    const batch = propertyIds.slice(i, i + 30);
    if (batch && batch.length > 0) {
      const snap = await propertiesRef.where(FieldPath.documentId(), 'in', batch).get();
      snap.forEach(docSnap => {
        const data = docSnap.data() as any;
        if (data.isVisibleOnSite !== false) {
          delete data.builderId;
          delete data.tenantId;
          delete data.constructorId;
          delete data.ownerId;
          propertiesData.push({ id: docSnap.id, ...data });
        }
      });
    }
  }
  return propertiesData;
}

async function getSimilarProperties(property: Property, brokerId: string): Promise<Property[]> {
  try {
    const [portfolioProps, brokerProps, publishedAvulsos] = await Promise.all([
      getPortfolioProperties(brokerId),
      getBrokerProperties(brokerId),
      getPublishedAvulsoProperties(brokerId)
    ]);

    const allBrokerProperties = [...portfolioProps, ...brokerProps, ...publishedAvulsos];
    
    const sameBairro = allBrokerProperties.filter(p => 
      p.id !== property.id && 
      p.localizacao?.bairro === property.localizacao?.bairro
    );

    let results = sameBairro.slice(0, 4);

    if (results.length < 4) {
      const others = allBrokerProperties.filter(p => 
        p.id !== property.id && 
        !results.some(r => r.id === p.id)
      );
      results = [...results, ...others].slice(0, 4);
    }

    return results;
  } catch (error) {
    console.error("Erro ao buscar imóveis semelhantes:", error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string, slug: string }> }): Promise<Metadata> {
  const { id: propertyIdentifier, slug } = await params;
  const broker = await getBrokerData(slug);
  const headersList = await headers();
  const host = headersList.get('host') || 'oraora.com.br';

  if (!broker) {
    return { title: 'Imóvel não encontrado | Oraora' };
  }

  const property = await verifyAndGetPropertyForBroker(broker.id, propertyIdentifier) as any;

  if (!property) {
    return { title: 'Imóvel não encontrado | Oraora' };
  }

  const title = property.informacoesbasicas.nome;
  const description = property.informacoesbasicas.descricao?.replace(/<[^>]*>?/gm, '').substring(0, 160);
  const canonical = getCanonicalUrl(property, host, broker);
  const robots = getRobotsRules(property, host);

  return {
    title: `${title} | ${broker.brandName}`,
    description,
    alternates: { canonical },
    robots,
    openGraph: {
      title: `${title} | ${broker.brandName}`,
      description,
      type: 'website',
      images: (property.midia?.[0] || (property as any).media?.[0]) ? [{ url: property.midia?.[0] || (property as any).media?.[0], width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: (property.midia?.[0] || (property as any).media?.[0]) ? [property.midia?.[0] || (property as any).media?.[0]] : [],
    },
    keywords: [
      property.caracteristicasimovel.tipo,
      property.localizacao.bairro,
      property.localizacao.cidade,
      broker.brandName,
      'imóveis de luxo',
      'comprar imóvel'
    ]
  };
}

export default async function BrokerPropertyDetailsPage({ params }: { params: Promise<{ slug: string, id: string }> }) {
  const { slug, id: propertyIdentifier } = await params;
  const broker = await getBrokerData(slug);
  const headersList = await headers();
  const host = headersList.get('host') || 'oraora.com.br';

  if (!broker) {
    notFound();
  }

  const property = await verifyAndGetPropertyForBroker(broker.id, propertyIdentifier) as any;

  if (!property) {
    notFound();
  }

  try {
    await adminDb.collection('corretorMetrics').doc(broker.id).set({
      siteHits: FieldValue.increment(1)
    }, { merge: true });
  } catch (e) {}

  const similarProperties = await getSimilarProperties(property, broker.id);

  const propertyJsonLd = generatePropertyJsonLd(property, `https://${host}`, broker);
  const brokerJsonLd = generateBrokerJsonLd(broker);
  const layoutId = (broker as any).layoutId;

  const PropertyPage = await getThemePage(layoutId, 'property');

  return (
    <>
      <PropertyViewTracker property={property} />
      <JsonLd data={propertyJsonLd} />
      <JsonLd data={brokerJsonLd} />
      <PropertyPage 
        broker={serializeForClient(broker) as any} 
        property={serializeForClient(property) as any} 
        similarProperties={serializeForClient(similarProperties) as any} 
      />
    </>
  );
}
