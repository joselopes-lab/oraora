
import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, documentId, getDocs } from 'firebase/firestore';
import BrokerPublicHeader from '@/components/broker-public-header';
import { type Property } from '@/app/dashboard/properties/page';
import { queryInBatches } from '@/lib/firestoreUtils';
import { AuthProvider } from '@/context/auth-context';
import { LocationProvider } from '@/context/location-context';
import ImoveisClientPage from './imoveis-client-page';
import Image from 'next/image';

interface Broker {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  logoUrl?: string;
  portfolioPropertyIds?: string[];
  hiddenPortfolioPropertyIds?: string[];
  backgroundColor?: string;
  theme?: 'light' | 'dark';
}

async function getBrokerData(brokerId: string): Promise<{ broker: Broker | null, properties: Property[] }> {
  if (!brokerId) return { broker: null, properties: [] };

  try {
    const brokerDocRef = doc(db, 'users', brokerId);
    const brokerDocSnap = await getDoc(brokerDocRef);

    if (!brokerDocSnap.exists() || brokerDocSnap.data().role !== 'Corretor') {
      return { broker: null, properties: [] };
    }

    const brokerData = { id: brokerDocSnap.id, ...brokerDocSnap.data() } as Broker;
    let portfolioProperties: Property[] = [];

    // 1. Fetch properties from portfolio (from builders)
    const propertyIds = brokerData.portfolioPropertyIds || [];
    const hiddenPropertyIds = brokerData.hiddenPortfolioPropertyIds || [];
    const visiblePropertyIds = propertyIds.filter(id => !hiddenPropertyIds.includes(id));
    
    if (visiblePropertyIds.length > 0) {
        portfolioProperties = await queryInBatches<Property>(
            'properties',
            documentId(),
            visiblePropertyIds,
            [where('isVisibleOnSite', '==', true)]
        );
    }
    
    // 2. Fetch "avulso" properties
    const avulsoQuery = query(collection(db, 'properties'), where('builderId', '==', brokerId), where('isVisibleOnSite', '==', true));
    const avulsoSnapshot = await getDocs(avulsoQuery);
    const avulsoProperties = avulsoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));

    // 3. Combine and remove duplicates
    const allPropertiesMap = new Map<string, Property>();
    [...portfolioProperties, ...avulsoProperties].forEach(p => {
      if (!allPropertiesMap.has(p.id)) {
        allPropertiesMap.set(p.id, p);
      }
    });

    const properties = Array.from(allPropertiesMap.values());
    
    return { broker: brokerData, properties };

  } catch (error) {
    console.error("Erro ao buscar dados do corretor:", error);
    return { broker: null, properties: [] };
  }
}

export default async function BrokerSearchPage({ params }: { params: { brokerId: string } }) {
  const { brokerId } = params;
  const { broker, properties } = await getBrokerData(brokerId);

  if (!broker) {
    notFound();
  }

  const plainBroker = JSON.parse(JSON.stringify(broker));
  const plainProperties = JSON.parse(JSON.stringify(properties));
  
  const pageStyle = {
    backgroundColor: broker.theme === 'dark' ? '#000000' : (broker.backgroundColor || 'transparent'),
  };

  return (
    <LocationProvider>
        <AuthProvider>
            <div style={pageStyle} className="flex flex-col min-h-screen">
                <BrokerPublicHeader broker={plainBroker} />
                <ImoveisClientPage broker={plainBroker} initialProperties={plainProperties} />
                 <footer style={{ backgroundColor: '#232323' }} className="text-white py-8 px-4">
                    <div className="container mx-auto text-center">
                        <p>Proteção completa desde a explosão de uma panela de pressão até mesmo incêndio ou queda de aeronave.</p>
                        {broker.logoUrl && (
                          <div className="mt-6 flex justify-center">
                            <Image
                              src={broker.logoUrl}
                              alt={`Logo de ${broker.name}`}
                              width={150}
                              height={50}
                              className="h-12 w-auto object-contain"
                            />
                          </div>
                        )}
                    </div>
                </footer>
            </div>
        </AuthProvider>
    </LocationProvider>
  );
}
