

import { collection, query, where, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import { notFound } from 'next/navigation';
import FaleConoscoClientPage from '@/layouts/urban-padrao/fale-conosco/FaleConoscoClientPage';

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

export default async function BrokerContactPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const broker = await getBrokerData(slug);

  if (!broker) {
    notFound();
  }

  // You could add logic here to switch between different contact page layouts
  // based on broker.layoutId if needed in the future.
  
  return <FaleConoscoClientPage broker={broker} />;
}
