import { collection, query, where, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import { notFound } from 'next/navigation';
import SobreClientPage from '@/layouts/urban-padrao/sobre/SobreClientPage';
import DomusSobrePage from '@/app/layouts/domus/sobre/DomusSobrePage';

// Force dynamic rendering to ensure data is fresh on every request
export const dynamic = 'force-dynamic';

type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  accentColor?: string;
  slug: string;
  layoutId?: string;
  urbanPadraoSobre?: any;
  oraoraSobre?: any;
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

export default async function BrokerAboutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const broker = await getBrokerData(slug);

  if (!broker) {
    notFound();
  }
  
  if (broker.layoutId === 'domus') {
    return <DomusSobrePage broker={broker as any} />;
  }
  
  return <SobreClientPage broker={broker as any} />;
}
