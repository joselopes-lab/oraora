
import { adminDb } from '@/firebase/index.server';
import { notFound } from 'next/navigation';
import { getThemePage } from '@/layouts/registry';
import type { Metadata } from 'next';
import { getBrokerData, getPropertyData, serializeForClient } from '../../../utils.server';
import { FieldValue } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { getCanonicalUrl, getRobotsRules, generatePropertyJsonLd, generateBrokerJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

export const dynamic = 'force-dynamic';

type Property = {
  id: string;
  builderId: string;
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
};

async function getSimilarProperties(property: Property): Promise<Property[]> {
  const snap = await adminDb.collection('properties')
    .where('isVisibleOnSite', '==', true)
    .where('localizacao.cidade', '==', property.localizacao.cidade)
    .limit(5)
    .get();
  
  return snap.docs
    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as any))
    .filter(p => p.id !== property.id)
    .slice(0, 4);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string, slug: string }> }): Promise<Metadata> {
  const { id: propertyIdentifier, slug } = await params;
  const broker = await getBrokerData(slug);
  const property = await getPropertyData(propertyIdentifier) as any;
  const headersList = await headers();
  const host = headersList.get('host') || 'oraora.com.br';

  if (!property || !broker || property.isVisibleOnSite === false) {
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
      images: property.midia?.[0] ? [{ url: property.midia[0], width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: property.midia?.[0] ? [property.midia[0]] : [],
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
  const property = await getPropertyData(propertyIdentifier) as any;
  const headersList = await headers();
  const host = headersList.get('host') || 'oraora.com.br';

  if (!broker || !property || property.isVisibleOnSite === false) {
    notFound();
  }

  try {
    await adminDb.collection('corretorMetrics').doc(broker.id).set({
      siteHits: FieldValue.increment(1)
    }, { merge: true });
  } catch (e) {}

  const similarProperties = await getSimilarProperties(property);
  const propertyJsonLd = generatePropertyJsonLd(property, `https://${host}`);
  const brokerJsonLd = generateBrokerJsonLd(broker);
  const layoutId = (broker as any).layoutId;

  const PropertyPage = await getThemePage(layoutId, 'property');

  return (
    <>
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
