
import PropertyDetailsComponent from './PropertyDetailsComponent';
import type { Metadata } from 'next';
import { PropertyRepository } from '@/repositories/property.repository';
import { adminDb } from '@/firebase/index.server';
import { priceTableRepository } from '@/repositories/price-table.repository';
import { getCanonicalUrl, getRobotsRules, generatePropertyJsonLd, generateOrganizationJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = await PropertyRepository.findPublicBySlugOrId(id);
  const headersList = await headers();
  const host = headersList.get('host') || 'oraora.com.br';

  if (!property || property.isVisibleOnSite === false) {
    return { title: 'Imóvel não encontrado | Oraora' };
  }

  const canonical = getCanonicalUrl(property, host, property.brokerId ? await adminDb.collection('brokers').doc(property.brokerId).get().then(doc => doc.exists ? { id: doc.id, ...doc.data() } : null).catch(() => null) : null);
  const robots = getRobotsRules(property, host);
  const title = property.informacoesbasicas.nome;
  const description = property.informacoesbasicas.descricao?.substring(0, 160).replace(/<[^>]*>?/gm, '');

  return {
    title: `${title} | Oraora`,
    description,
    alternates: { canonical },
    robots,
    openGraph: {
      title,
      description,
      images: property.midia?.[0] ? [{ url: property.midia[0], width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const property = await PropertyRepository.findPublicBySlugOrId(id);
  const headersList = await headers();
  const host = headersList.get('host') || 'oraora.com.br';

  if (!property || property.isVisibleOnSite === false) {
    notFound();
  }

  let priceTableInfo = null;
  if (property) {
    try {
      const table = await priceTableRepository.getTableByProperty(property.id);
      if (table) {
        const currentVersion = await priceTableRepository.getCurrentVersion(table.id, table.currentVersionId);
        const versions = await priceTableRepository.listVersions(table.id);
        priceTableInfo = { table, currentVersion, versions };
      }
    } catch (e) {
      console.error('Error fetching price table for property', e);
    }
  }

  const jsonLd = generatePropertyJsonLd(property, `https://${host}`);
  const orgJsonLd = generateOrganizationJsonLd();

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={orgJsonLd} />
      <PropertyDetailsComponent initialProperty={property} priceTableInfo={priceTableInfo} />
    </>
  );
}
