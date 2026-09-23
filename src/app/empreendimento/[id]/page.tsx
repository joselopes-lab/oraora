import { adminDb } from '@/firebase/index.server';
import { notFound } from 'next/navigation';
import { projectRepository } from '@/repositories/project.repository';
import { ConstructorRepository } from '@/repositories/constructor.repository';
import { propertyRepository } from '@/repositories/property.repository';
import { PriceTableRepository } from '@/repositories/price-table.repository';
import EmpreendimentoLandingClient from './EmpreendimentoLandingClient';
import { JsonLd } from '@/components/JsonLd';
import { generatePropertyJsonLd } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const project = await projectRepository.getById(id);

  if (!project || project.isPublished !== true) {
    return {
      title: 'Empreendimento não encontrado | OraOra',
      description: 'O empreendimento solicitado não está disponível.',
    };
  }

  const title = `${project.tituloComercial || project.name} | Lançamento Imobiliário`;
  const description = project.descricaoCurta || `Conheça o empreendimento ${project.name} em ${project.localizacao?.bairro || ''}, ${project.localizacao?.cidade || ''}.`;
  const image = project.midia?.[0] || '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function EmpreendimentoPublicPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Fetch project
  const project = await projectRepository.getById(id);

  // 2. Strict publication check
  if (!project || project.isPublished !== true) {
    notFound();
  }

  // 3. Fetch constructor branding / data
  const constructorRepo = new ConstructorRepository();
  let constructorData = null;
  if (project.builderId) {
    constructorData = await constructorRepo.getById(project.builderId);
  }

  // 4. Fetch properties / units linked to project
  const properties = await propertyRepository.listByProjectId(id);

  // 5. Fetch price tables
  const priceTableRepo = new PriceTableRepository();
  const priceTables = await priceTableRepo.getTablesByProjectIds([id]);

  // Serialize data for client
  const serializedProject = JSON.parse(JSON.stringify(project));
  const serializedConstructor = JSON.parse(JSON.stringify(constructorData || {}));
  const serializedProperties = JSON.parse(JSON.stringify(properties || []));
  const serializedPriceTables = JSON.parse(JSON.stringify(priceTables || []));

  const defaultBranding = {
    primaryColor: '#f59e0b',
    secondaryColor: '#10b981',
    backgroundColor: '#030712',
    textColor: '#f8fafc',
    buttonColor: '#f59e0b',
    buttonTextColor: '#030712',
  };

  const cBranding = constructorData?.branding || {};
  const pBranding = project?.branding || {};
  const resolvedBranding = {
    primaryColor: pBranding.primaryColor || cBranding.primaryColor || constructorData?.primaryColor || defaultBranding.primaryColor,
    secondaryColor: pBranding.secondaryColor || cBranding.secondaryColor || constructorData?.secondaryColor || defaultBranding.secondaryColor,
    backgroundColor: pBranding.backgroundColor || cBranding.backgroundColor || defaultBranding.backgroundColor,
    textColor: pBranding.textColor || cBranding.textColor || defaultBranding.textColor,
    buttonColor: pBranding.buttonColor || cBranding.buttonColor || constructorData?.buttonColor || defaultBranding.buttonColor,
    buttonTextColor: pBranding.buttonTextColor || cBranding.buttonTextColor || constructorData?.buttonTextColor || defaultBranding.buttonTextColor,
  };

  // JSON-LD Structured Data
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: project.tituloComercial || project.name,
    description: project.descricaoCurta || project.descricaoCompleta,
    image: project.midia || [],
    address: {
      '@type': 'PostalAddress',
      streetAddress: project.localizacao?.address || '',
      addressLocality: project.localizacao?.cidade || '',
      addressRegion: project.localizacao?.estado || '',
      postalCode: project.localizacao?.cep || '',
      addressCountry: 'BR',
    },
    offers: {
      '@type': 'Offer',
      price: project.precoInicial || 0,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <JsonLd data={jsonLdData} />
      <EmpreendimentoLandingClient
        project={serializedProject}
        constructorData={serializedConstructor}
        properties={serializedProperties}
        priceTables={serializedPriceTables}
        resolvedBranding={resolvedBranding}
      />
    </>
  );
}
