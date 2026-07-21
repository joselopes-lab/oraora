import { adminDb } from '@/firebase/index.server';
import { notFound } from 'next/navigation';
import { getBrokerData } from '../utils.server';
import { FieldValue } from 'firebase-admin/firestore';
import { LayoutProps } from '@/layouts/sdk.types';
import { getTheme, getThemePage } from '@/layouts/registry';
import { JsonLd } from '@/components/JsonLd';
import { generatePropertyJsonLd } from '@/lib/seo';
import { headers } from 'next/headers';
import React from 'react';

// Force dynamic rendering to ensure data is fresh on every request
export const dynamic = 'force-dynamic';

type Property = {
  id: string;
  isVisibleOnSite?: boolean;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    salePrice?: number;
    rentPrice?: number;
    transactionTypes?: string[];
    descricao?: string;
    slug?: string;
  };
  localizacao: {
    bairro: string;
    cidade: string;
  };
  midia: string[];
  caracteristicasimovel: {
    quartos?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
};

async function getPortfolioProperties(brokerId: string, enabledTransactions: string[]): Promise<Property[]> {
  const portfolioRef = adminDb.collection('portfolios').doc(brokerId);
  const portfolioSnap = await portfolioRef.get();

  if (!portfolioSnap.exists) {
    return [];
  }

  const propertyIds = portfolioSnap.data()?.propertyIds || [];
  if (propertyIds.length === 0) {
    return [];
  }
  
  const propertiesData: Property[] = [];
  const propertiesRef = adminDb.collection('properties');

  for (let i = 0; i < propertyIds.length; i += 30) {
    const batch = propertyIds.slice(i, i + 30);
    if (batch.length > 0) {
        const snap = await propertiesRef.where('__name__', 'in', batch).get();
        snap.forEach(docSnap => {
            const data = docSnap.data() as any;
            if (data.isVisibleOnSite !== false) {
                const propTypes = data.informacoesbasicas?.transactionTypes || ['sale'];
                const hasMatch = propTypes.some((t: string) => enabledTransactions.includes(t));
                if (hasMatch) {
                    propertiesData.push({ id: docSnap.id, ...data });
                }
            }
        });
    }
  }

  return propertiesData;
}

async function getBrokerProperties(brokerId: string, enabledTransactions: string[]): Promise<Property[]> {
  const snap = await adminDb.collection('brokerProperties')
    .where('brokerId', '==', brokerId)
    .where('isVisibleOnSite', '==', true)
    .get();
  
  const allProps = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as any));
  
  return allProps.filter((p: any) => {
      const propTypes = p.informacoesbasicas?.transactionTypes || ['sale'];
      return propTypes.some((t: string) => enabledTransactions.includes(t));
  });
}

export default async function BrokerSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const broker = await getBrokerData(slug);
  const headersList = await headers();
  const host = headersList.get('host') || 'oraora.com.br';

  if (!broker) {
    notFound();
  }

  const enabledTransactions = broker.businessSettings?.enabledTransactions || ['sale', 'rent'];

  try {
    await adminDb.collection('corretorMetrics').doc(broker.id).set({
      siteHits: FieldValue.increment(1)
    }, { merge: true });
  } catch (e) {
    console.error("Erro ao rastrear acesso:", e);
  }

  const [portfolioProperties, brokerProperties] = await Promise.all([
    getPortfolioProperties(broker.id, enabledTransactions),
    getBrokerProperties(broker.id, enabledTransactions)
  ]);

  const allProperties = [...portfolioProperties, ...brokerProperties];

  let featuredProperties: Property[] = [];
  const selectedIds = (broker as any).homepage?.featuredPropertyIds || [];

  if (selectedIds.length > 0) {
    selectedIds.forEach((id: string) => {
      const match = allProperties.find(p => p.id === id);
      if (match) featuredProperties.push(match);
    });
  }

  if (featuredProperties.length === 0 && allProperties.length > 0) {
    featuredProperties = [...allProperties].sort(() => 0.5 - Math.random()).slice(0, 6);
  }

  const otherProperties = allProperties.filter(p => !featuredProperties.find(fp => fp.id === p.id));
  const sortedProperties = [...featuredProperties, ...otherProperties];

  const layoutId = (broker as any).layoutId;

  // --- ORAORA PAGE LOADER 1.0 ---
  const theme = getTheme(layoutId);
  const ThemePage = getThemePage(layoutId, 'home');

  // --- ORAORA THEME SDK 1.0 - PREPARE PROPS ---
  const sdkProps: LayoutProps = {
    broker: {
      id: broker.id,
      brandName: broker.brandName,
      slug: broker.slug,
      creci: broker.creci,
      whatsappUrl: broker.whatsappUrl,
      instagramUrl: broker.instagramUrl,
      linkedinUrl: broker.linkedinUrl,
      logoUrl: broker.logoUrl,
      footerLogoUrl: broker.footerLogoUrl,
      faviconUrl: broker.faviconUrl,
    },
    properties: sortedProperties as any,
    content: broker.homepage || {},
    theme: {
      primary: broker.primaryColor,
      secondary: broker.secondaryColor,
      accent: broker.accentColor,
      background: broker.backgroundColor,
      foreground: broker.foregroundColor,
    },
    seo: {
      title: broker.siteTitle,
      slogan: broker.footerSlogan,
      description: (broker as any).homepage?.heroSubtitle,
    },
    settings: {
      enabledTransactions,
    },
    version: theme.manifest.version
  };

  if (theme.isLegacy) {
    return <ThemePage broker={broker as any} properties={sortedProperties as any} />;
  }

  return (
    <>
      {sortedProperties[0] && <JsonLd data={generatePropertyJsonLd(sortedProperties[0], `https://${host}`)} />}
      <ThemePage {...sdkProps} />
    </>
  );
}
