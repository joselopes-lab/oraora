
import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, documentId, getDocs } from 'firebase/firestore';
import PublicLayout from '@/components/public-layout';
import BrokerPublicPageClient from './broker-public-page-client';
import { type Property } from '@/app/dashboard/properties/page';
import { queryInBatches } from '@/lib/firestoreUtils';

interface Broker {
  id: string;
  name: string;
  email: string;
  portfolioPropertyIds?: string[];
  // Adicione outros campos públicos que desejar
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
    let properties: Property[] = [];

    const propertyIds = brokerData.portfolioPropertyIds;

    if (propertyIds && propertyIds.length > 0) {
        const fetchedProperties = await queryInBatches<Property>(
            'properties',
            documentId(),
            propertyIds
        );
        
        // Filter for visibility in the code, not in the query
        properties = fetchedProperties.filter(p => p.isVisibleOnSite === true);
    }
    
    return { broker: brokerData, properties };

  } catch (error) {
    console.error("Erro ao buscar dados do corretor:", error);
    return { broker: null, properties: [] };
  }
}

export default async function BrokerPublicPage({ params }: { params: { brokerId: string } }) {
  const { broker, properties } = await getBrokerData(params.brokerId);

  if (!broker) {
    notFound();
  }

  const plainBroker = JSON.parse(JSON.stringify(broker));
  const plainProperties = JSON.parse(JSON.stringify(properties));

  return (
    <PublicLayout>
        <BrokerPublicPageClient broker={plainBroker} properties={plainProperties} />
    </PublicLayout>
  );
}
