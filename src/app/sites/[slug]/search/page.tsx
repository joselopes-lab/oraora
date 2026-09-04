import { adminDb } from '@/firebase/index.server';
import { notFound } from 'next/navigation';
import { getThemePage } from '@/layouts/registry';
import { getBrokerData, serializeForClient } from '../../utils.server';
import { FieldValue, FieldPath } from 'firebase-admin/firestore';

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
    estado: string;
  };
  midia: string[];
  caracteristicasimovel: {
    tipo: string;
    quartos?: string[] | string;
    tamanho?: string;
    vagas?: string;
  };
};

async function getPortfolioProperties(brokerId: string): Promise<Property[]> {
  const portfolioRef = adminDb.collection('portfolios').doc(brokerId);
  const portfolioSnap = await portfolioRef.get();

  const propertyIds = portfolioSnap.exists ? portfolioSnap.data()?.propertyIds || [] : [];
  if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
    return [];
  }
  
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

export default async function BrokerSearchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const broker = await getBrokerData(slug);

  if (!broker) {
    notFound();
  }

  // Increment access metrics
  try {
    await adminDb.collection('corretorMetrics').doc(broker.id).set({
      siteHits: FieldValue.increment(1)
    }, { merge: true });
  } catch (e) {
    console.error("Erro ao rastrear acesso:", e);
  }

  const [portfolioProperties, brokerProperties, publishedAvulsoProperties] = await Promise.all([
    getPortfolioProperties(broker.id),
    getBrokerProperties(broker.id),
    getPublishedAvulsoProperties(broker.id)
  ]);

  const allProperties = [...portfolioProperties, ...brokerProperties, ...publishedAvulsoProperties];
  const layoutId = (broker as any).layoutId;
  const SearchPageComponent = await getThemePage(layoutId, 'search');

  const serializedBroker = serializeForClient({
    id: broker.id,
    brandName: broker.brandName,
    logoUrl: broker.logoUrl,
    primaryColor: broker.primaryColor,
    secondaryColor: broker.secondaryColor,
    accentColor: broker.accentColor,
    backgroundColor: broker.backgroundColor,
    foregroundColor: broker.foregroundColor,
    slug: broker.slug,
    layoutId: broker.layoutId,
    businessSettings: broker.businessSettings,
  });

  const serializedProperties = serializeForClient(allProperties);

  return <SearchPageComponent broker={serializedBroker} properties={serializedProperties} />;
}
