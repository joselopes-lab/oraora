


import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import { notFound } from 'next/navigation';
import MapClientPage from '@/layouts/urban-padrao/explorar-no-mapa/MapClientPage';

// Force dynamic rendering to ensure data is fresh on every request
export const dynamic = 'force-dynamic';

// Tipos de dados
type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  slug: string;
  layoutId?: string; 
};

type Portfolio = {
  propertyIds: string[];
};

type Property = {
  id: string;
  informacoesbasicas: {
    nome: string;
    status: string;
    valor?: number;
    descricao?: string;
  };
  localizacao: {
    address?: string;
    bairro: string;
    cidade: string;
    estado: string;
    latitude?: number;
    longitude?: number;
  };
  midia: string[];
  caracteristicasimovel: {
    tipo: string;
    quartos?: string[];
    tamanho?: string;
    vagas?: string;
  };
};

// Funções de busca de dados no servidor
async function getBrokerData(slug: string): Promise<Broker | null> {
  const { firestore } = initializeFirebase();
  const brokersRef = collection(firestore, 'brokers');
  const q = query(brokersRef, where('slug', '==', slug));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const brokerDoc = querySnapshot.docs[0];
  return { id: brokerDoc.id, ...brokerDoc.data() } as Broker;
}

async function getPortfolioProperties(brokerId: string): Promise<Property[]> {
  const { firestore } = initializeFirebase();
  const portfolioRef = doc(firestore, 'portfolios', brokerId);
  const portfolioSnap = await getDoc(portfolioRef);

  const propertyIds = portfolioSnap.exists() ? portfolioSnap.data()?.propertyIds || [] : [];
  if (propertyIds.length === 0) {
    return [];
  }
  
  const propertiesData: Property[] = [];
  const propertiesRef = collection(firestore, 'properties');

  // Firestore 'in' query is limited to 30 elements, so we batch the requests.
  for (let i = 0; i < propertyIds.length; i += 30) {
    const batch = propertyIds.slice(i, i + 30);
    if (batch.length > 0) {
        const q = query(propertiesRef, where('__name__', 'in', batch));
        const propertiesSnap = await getDocs(q);
        propertiesSnap.forEach(doc => {
            propertiesData.push({ id: doc.id, ...doc.data() } as Property);
        });
    }
  }

  return propertiesData;
}

async function getBrokerProperties(brokerId: string): Promise<Property[]> {
  const { firestore } = initializeFirebase();
  const brokerPropertiesRef = collection(firestore, 'brokerProperties');
  const q = query(brokerPropertiesRef, where('brokerId', '==', brokerId), where('isVisibleOnSite', '==', true));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
}


export default async function BrokerMapPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const broker = await getBrokerData(slug);

  if (!broker) {
    notFound();
  }

  const [portfolioProperties, brokerProperties] = await Promise.all([
    getPortfolioProperties(broker.id),
    getBrokerProperties(broker.id)
  ]);

  const allProperties = [...portfolioProperties, ...brokerProperties];

  return <MapClientPage broker={broker} properties={allProperties} />;
}
