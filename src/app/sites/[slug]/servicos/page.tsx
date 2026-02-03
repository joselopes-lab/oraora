

import { collection, query, where, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import { notFound } from 'next/navigation';
import ServicosPage from '@/layouts/urban-padrao/servicos/ServicosPage';

// Force dynamic rendering to ensure data is fresh on every request
export const dynamic = 'force-dynamic';

type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  slug: string;
  layoutId?: string;
};

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

export default async function BrokerServicesPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const broker = await getBrokerData(slug);

  if (!broker) {
    notFound();
  }
  
  return <ServicosPage broker={broker} />;
}
