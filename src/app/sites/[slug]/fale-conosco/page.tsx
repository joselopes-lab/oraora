import { collection, query, where, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import { notFound } from 'next/navigation';
import FaleConoscoClientPage from '@/layouts/urban-padrao/fale-conosco/FaleConoscoClientPage';
import DomusFaleConoscoPage from '@/app/layouts/domus/fale-conosco/DomusFaleConoscoPage';

// Force dynamic rendering to ensure data is fresh on every request
export const dynamic = 'force-dynamic';

type Broker = {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  slug: string;
  layoutId?: string;
  footerContactEmail?: string;
  footerContactPhone?: string;
  footerContactAddress?: string;
  creci?: string;
  whatsappUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
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

export default async function BrokerContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const broker = await getBrokerData(slug);

  if (!broker) {
    notFound();
  }

  // Lógica de seleção de layout
  if (broker.layoutId === 'domus') {
    return <DomusFaleConoscoPage broker={broker as any} />;
  }
  
  return <FaleConoscoClientPage broker={broker as any} />;
}
