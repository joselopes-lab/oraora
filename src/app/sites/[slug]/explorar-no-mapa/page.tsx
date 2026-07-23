import { adminDb } from '@/firebase/index.server';
import { notFound } from 'next/navigation';
import { getThemePage } from '@/layouts/registry';
import { getBrokerData, serializeForClient } from '../../utils.server';
import { FieldValue } from 'firebase-admin/firestore';

// Force dynamic rendering to ensure data is fresh on every request
export const dynamic = 'force-dynamic';

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    descricao?: string;
    slug?: string;
  };
  localizacao: {
    address?: string;
    bairro: string;
    cidade: string;
    estado: string;
    latitude?: number;
    longitude?: number;
    googleMapsLink?: string;
    googleStreetViewLink?: string;
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
            propertiesData.push({ id: docSnap.id, ...docSnap.data() } as any);
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


export default async function BrokerMapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const broker = await getBrokerData(slug);

  if (!broker) {
    notFound();
  }

  // Incrementa contador de acessos
  try {
    await adminDb.collection('corretorMetrics').doc(broker.id).set({
      siteHits: FieldValue.increment(1)
    }, { merge: true });
  } catch (e) {
    console.error("Erro ao rastrear acesso:", e);
  }

  const [portfolioProperties, brokerProperties] = await Promise.all([
    getPortfolioProperties(broker.id),
    getBrokerProperties(broker.id)
  ]);

  const allProperties = [...portfolioProperties, ...brokerProperties];
  const layoutId = (broker as any).layoutId;

  // --- ORAORA PAGE LOADER 1.0 ---
  const MapPage = await getThemePage(layoutId, 'map');

  return <MapPage broker={serializeForClient(broker) as any} properties={serializeForClient(allProperties) as any} />;
}
