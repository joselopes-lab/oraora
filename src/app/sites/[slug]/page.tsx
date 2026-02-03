

import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/index.server';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import UrbanPadraoLayout from '@/layouts/urban-padrao/UrbanPadraoLayout';
import LivingLayout from '@/layouts/living/LivingLayout';
import DomusLayout from '@/app/layouts/domus/DomusLayout';

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
  layoutId?: string; // Adicionar layoutId
  homepage?: {
    heroTagline?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    heroVideoUrl?: string;
    heroImageUrl?: string;
    statsSold?: string;
    statsExperience?: string;
    statsSatisfaction?: string;
    statsSupport?: string;
    featuredTagline?: string;
    featuredTitle?: string;
    featuredSubtitle?: string;
    aboutTagline?: string;
    aboutTitle?: string;
    aboutText?: string;
    aboutImageUrl?: string;
    ctaTitle?: string;
    ctaSubtitle?: string;
    value1Icon?: string;
    value1Title?: string;
    value1Description?: string;
    value2Icon?: string;
    value2Title?: string;
    value2Description?: string;
    value3Icon?: string;
    value3Title?: string;
    value3Description?: string;
    value4Icon?: string;
    value4Title?: string;
    value4Description?: string;
    aboutQuote?: string;
    aboutAwardTitle?: string;
    aboutAwardText?: string;
    hideStats?: boolean;
    statsSectionBgColor?: string;
    statsNumberColor?: string;
    statsLabelColor?: string;
  };
  footerSlogan?: string;
  footerContactEmail?: string;
  footerContactPhone?: string;
  footerContactAddress?: string;
  creci?: string;
  whatsappUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
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

  if (!portfolioSnap.exists()) {
    return [];
  }

  const propertyIds = portfolioSnap.data()?.propertyIds || [];
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


// A página principal que atua como roteador de layouts
export default async function BrokerSitePage({ params }: { params: { slug: string } }) {
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


  // Lógica para escolher qual layout renderizar
  switch (broker.layoutId) {
    case 'urban-padrao':
      return <UrbanPadraoLayout broker={broker} properties={allProperties} />;
    case 'living':
        return <LivingLayout broker={broker} properties={allProperties} />;
    case 'domus':
        return <DomusLayout broker={broker} properties={allProperties} />;
    default:
      // Renderiza o layout padrão se nenhum for selecionado ou se o ID for inválido
      return <UrbanPadraoLayout broker={broker} properties={allProperties} />;
  }
}

// Generate static routes at build time for better performance
export async function generateStaticParams() {
  try {
    const { firestore } = initializeFirebase();
    const brokersRef = collection(firestore, 'brokers');
    const snapshot = await getDocs(query(brokersRef, where('slug', '!=', null)));
    
    return snapshot.docs.map(doc => ({
      slug: doc.data().slug,
    }));
  } catch (error) {
    console.error("Failed to generate static params for broker sites:", error);
    return [];
  }
}
