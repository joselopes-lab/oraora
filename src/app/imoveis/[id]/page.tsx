
import PropertyDetailsComponent from './PropertyDetailsComponent';
import type { Metadata } from 'next';
import { getPropertyData } from '@/app/sites/utils.server';
import { getCanonicalUrl, getRobotsRules, generatePropertyJsonLd, generateOrganizationJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyData(id);
  const headersList = await headers();
  const host = headersList.get('host') || 'oraora.com.br';

  if (!property || property.isVisibleOnSite === false) {
    return { title: 'Imóvel não encontrado | Oraora' };
  }

  const canonical = getCanonicalUrl(property, host);
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
  const property = await getPropertyData(id);
  const headersList = await headers();
  const host = headersList.get('host') || 'oraora.com.br';

  if (!property || property.isVisibleOnSite === false) {
    notFound();
  }

  const jsonLd = generatePropertyJsonLd(property, `https://${host}`);
  const orgJsonLd = generateOrganizationJsonLd();

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={orgJsonLd} />
      <PropertyDetailsComponent />
    </>
  );
}
